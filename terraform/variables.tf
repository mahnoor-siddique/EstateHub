variable "aws_region" {
  description = "AWS region for EstateHub infrastructure"
  type        = string
  default     = "eu-north-1"
}

variable "ssh_allowed_cidr" {
  description = "Public IP allowed to SSH into EstateHub EC2"
  type        = string
}