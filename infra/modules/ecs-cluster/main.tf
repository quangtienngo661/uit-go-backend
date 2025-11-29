variable "name_prefix" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}

module "ecs" {
  source  = "terraform-aws-modules/ecs/aws"
  version = "~> 5.11"

  cluster_name = "${var.name_prefix}-ecs"
  fargate_capacity_providers = {
    FARGATE = {
      default_capacity_provider_strategy = [
        { capacity_provider = "FARGATE", weight = 1, base = 0 }
      ]
    }
    FARGATE_SPOT = {
      default_capacity_provider_strategy = [
        { capacity_provider = "FARGATE_SPOT", weight = 2, base = 0 }
      ]
    }
  }
  autoscaling_capacity_providers = {}
  cluster_settings = [
    {
      name  = "containerInsights"
      value = "enabled"
    }
  ]
  tags = var.tags
}

resource "aws_cloudwatch_log_group" "service" {
  name              = "/${var.name_prefix}/services"
  retention_in_days = 7
  tags              = var.tags
}

output "cluster_id" {
  value = module.ecs.cluster_id
}

output "cluster_name" {
  value = module.ecs.cluster_name
}

output "log_group_name" {
  value = aws_cloudwatch_log_group.service.name
}
