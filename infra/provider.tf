terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.60" }
    random = { source = "hashicorp/random", version = "~> 3.6" }
    rabbitmq = { source = "cyrilgdn/rabbitmq", version = "~> 1.14" }
  }
}


provider "aws" { region = var.region }

# RabbitMQ Management API (private inside VPC)
provider "rabbitmq" {
  endpoint = var.rabbitmq_mgmt_url
  username = var.rabbitmq_username
  password = var.rabbitmq_password
}
