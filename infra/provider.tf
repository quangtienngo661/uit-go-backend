terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.60" }
    random = { source = "hashicorp/random", version = "~> 3.6" }
    rabbitmq = { source = "cyrilgdn/rabbitmq", version = "~> 1.0" }
  }
  # To enable remote state, add an s3 backend block here after creating the bucket/table:
  # backend "s3" {
  #   bucket         = "<your-tf-state-bucket>"
  #   key            = "uit-go/terraform.tfstate"
  #   region         = "ap-southeast-1"
  #   dynamodb_table = "<your-tf-locks-table>"
  #   encrypt        = true
  # }
}


provider "aws" { region = var.region }

# RabbitMQ Management API (private inside VPC)
provider "rabbitmq" {
  endpoint = var.rabbitmq_mgmt_url
  username = var.rabbitmq_username
  password = var.rabbitmq_password
}
