variable "name_prefix" {
  type = string
}

variable "db_name" {
  type = string
}

variable "username" {
  type = string
}

variable "password" {
  type      = string
  sensitive = true
}

variable "vpc_security_group_ids" {
  type = list(string)
}

variable "subnet_ids" {
  type = list(string)
}

variable "allocated_storage" {
  type    = number
  default = 20
}

variable "instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "family" {
  type    = string
  default = "postgres16"
}

variable "tags" {
  type    = map(string)
  default = {}
}

module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.5"

  identifier              = "${var.name_prefix}-${var.db_name}"
  engine                  = "postgres"
  instance_class          = var.instance_class
  allocated_storage       = var.allocated_storage
  db_name                 = var.db_name
  username                = var.username
  password                = var.password
  port                    = 5432
  family                  = var.family
  subnet_ids              = var.subnet_ids
  vpc_security_group_ids  = var.vpc_security_group_ids
  publicly_accessible     = false
  performance_insights_enabled = false
  tags                    = var.tags
}

output "db_instance_address" {
  value = module.rds.db_instance_address
}
