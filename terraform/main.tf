data "aws_caller_identity" "current" {}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

resource "aws_s3_bucket" "estatehub_images" {
  bucket = "estatehub-property-images-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "estatehub_images" {
  bucket = aws_s3_bucket.estatehub_images.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "estatehub_images" {
  bucket = aws_s3_bucket.estatehub_images.id

  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = false
  restrict_public_buckets = false
}

data "aws_iam_policy_document" "estatehub_images_public_read" {
  statement {
    sid    = "PublicReadImages"
    effect = "Allow"

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    actions = [
      "s3:GetObject"
    ]

    resources = [
      "${aws_s3_bucket.estatehub_images.arn}/*"
    ]
  }
}

resource "aws_s3_bucket_policy" "estatehub_images_public_read" {
  bucket = aws_s3_bucket.estatehub_images.id
  policy = data.aws_iam_policy_document.estatehub_images_public_read.json
}

resource "aws_iam_role" "estatehub_ec2" {
  name = "estatehub-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "ec2.amazonaws.com"
        }

        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy" "estatehub_s3" {
  name = "estatehub-s3-access"
  role = aws_iam_role.estatehub_ec2.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]

        Resource = "${aws_s3_bucket.estatehub_images.arn}/*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "estatehub_ec2" {
  name = "estatehub-ec2-profile"
  role = aws_iam_role.estatehub_ec2.name
}

resource "aws_security_group" "estatehub_ec2" {
  name        = "estatehub-ec2-sg"
  description = "Security group for EstateHub EC2"

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_allowed_cidr]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "EstateHub-EC2-SG"
  }
}

resource "aws_instance" "estatehub_ec2" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  key_name               = "estatehubkey"
  iam_instance_profile   = aws_iam_instance_profile.estatehub_ec2.name
  vpc_security_group_ids = [aws_security_group.estatehub_ec2.id]

  tags = {
    Name = "EstateHub-EC2"
  }
}
###                                         LAMBDA                                ###
#FOR IAM ROLE PERMISSION
resource "aws_iam_role" "estatehub_lambda" {
  name = "estatehub-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [{
      Effect = "Allow"

      Principal = {
        Service = "lambda.amazonaws.com"
      }

      Action = "sts:AssumeRole"
    }]
  })

  tags = {
    Name = "EstateHub-Lambda-Role"
  }
}

#LAMBDA FUNCTIONS
resource "aws_lambda_function" "estatehub_api" {
  function_name = "estatehub-api"

  role    = aws_iam_role.estatehub_lambda.arn
  handler = "index.handler"
  runtime = "nodejs20.x"

  filename         = "${path.module}/../lambda/function.zip"
  source_code_hash = filebase64sha256("${path.module}/../lambda/function.zip")

  tags = {
    Name = "EstateHub-API"
  }
}

###                                         DYNAMODB                            ###
#DynamoDB table.Ismein Lambda EstateHub ki activity records store HOGI.

resource "aws_dynamodb_table" "estatehub_activity" {
  name         = "estatehub-activity"
  billing_mode = "PROVISIONED"

  read_capacity  = 1
  write_capacity = 1

  hash_key = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Name = "EstateHub-Activity"
  }
}

###                                      API-GATEWAY                ###

#API Gateway HTTP API add

resource "aws_apigatewayv2_api" "estatehub_api" {
  name          = "estatehub-api"
  protocol_type = "HTTP"

  tags = {
    Name = "EstateHub-API-Gateway"
  }
}

resource "aws_apigatewayv2_integration" "estatehub_lambda" {
  api_id                 = aws_apigatewayv2_api.estatehub_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.estatehub_api.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "estatehub_default" {
  api_id    = aws_apigatewayv2_api.estatehub_api.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.estatehub_lambda.id}"
}

resource "aws_apigatewayv2_stage" "estatehub_default" {
  api_id      = aws_apigatewayv2_api.estatehub_api.id
  name        = "$default"
  auto_deploy = true
}

#Lambda permission added

resource "aws_lambda_permission" "estatehub_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.estatehub_api.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.estatehub_api.execution_arn}/*/*"
}

#Give Lambda permission to write to DynamoDB

resource "aws_iam_role_policy" "estatehub_lambda_dynamodb" {
  name = "estatehub-lambda-dynamodb"
  role = aws_iam_role.estatehub_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:PutItem"
      ]
      Resource = aws_dynamodb_table.estatehub_activity.arn
    }]
  })
}