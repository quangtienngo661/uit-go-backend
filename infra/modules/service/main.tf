variable "name_prefix" {
  type = string
}

variable "service_name" {
  type = string
}

variable "cluster_id" {
  type = string
}

variable "cluster_name" {
  type = string
}

variable "subnets" {
  type = list(string)
}

variable "security_groups" {
  type = list(string)
}

variable "container_image" {
  type = string
}

variable "container_port" {
  type = number
}

variable "cpu" {
  type    = number
  default = 512
}

variable "memory" {
  type    = number
  default = 1024
}

variable "desired_count" {
  type    = number
  default = 1
}

variable "log_group_name" {
  type = string
}

variable "region" {
  type = string
}

variable "env" {
  description = "List of { name, value } env vars"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "namespace_id" {
  type = string
}

variable "target_group_arn" {
  type    = string
  default = null
}

variable "tags" {
  type    = map(string)
  default = {}
}

resource "aws_iam_role" "task_exec" {
  name               = "${var.name_prefix}-${var.service_name}-exec"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume.json
  tags               = var.tags
}

data "aws_iam_policy_document" "ecs_tasks_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy_attachment" "exec" {
  role       = aws_iam_role.task_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_service_discovery_service" "sd" {
  name         = replace(var.service_name, "-", ".")
  namespace_id = var.namespace_id
  dns_config {
    namespace_id = var.namespace_id
    dns_records {
      type = "A"
      ttl  = 10
    }
    routing_policy = "WEIGHTED"
  }
  health_check_custom_config { failure_threshold = 1 }
}

resource "aws_ecs_task_definition" "task" {
  family                   = "${var.name_prefix}-${var.service_name}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = aws_iam_role.task_exec.arn
  tags                     = merge(var.tags, { Service = var.service_name })

  container_definitions = jsonencode([
    {
      name      = var.service_name
      image     = var.container_image
      essential = true
      portMappings = [
        {
          containerPort = var.container_port
          hostPort      = var.container_port
          protocol      = "tcp"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = var.log_group_name
          awslogs-region        = var.region
          awslogs-stream-prefix = var.service_name
        }
      }
      environment = var.env
    }
  ])
}

resource "aws_ecs_service" "svc" {
  name            = "${var.name_prefix}-${var.service_name}"
  cluster         = var.cluster_id
  task_definition = aws_ecs_task_definition.task.arn
  desired_count   = var.desired_count

  capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 2
    base              = 0
  }
  capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 0
  }

  network_configuration {
    subnets         = var.subnets
    security_groups = var.security_groups
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.sd.arn
  }

  dynamic "load_balancer" {
    for_each = var.target_group_arn == null ? [] : [1]
    content {
      target_group_arn = var.target_group_arn
      container_name   = var.service_name
      container_port   = var.container_port
    }
  }

  tags = merge(var.tags, { Service = var.service_name })
}

output "service_name" {
  value = aws_ecs_service.svc.name
}

output "service_discovery_arn" {
  value = aws_service_discovery_service.sd.arn
}
