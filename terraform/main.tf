data "aws_caller_identity" "current" {}

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