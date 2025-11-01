############################################
# 1) VPC + Subnets + NAT
############################################
data "aws_availability_zones" "available" {}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.5"

  name = "${local.name_prefix}-vpc"
  cidr = var.vpc_cidr

  azs             = slice(data.aws_availability_zones.available.names, 0, var.az_count)
  public_subnets  = [for i, az in slice(data.aws_availability_zones.available.names, 0, var.az_count) : cidrsubnet(var.vpc_cidr, 4, i)]
  private_subnets = [for i, az in slice(data.aws_availability_zones.available.names, 0, var.az_count) : cidrsubnet(var.vpc_cidr, 4, i + 8)]

  enable_nat_gateway = true
  single_nat_gateway = true

  tags = local.tags
}

############################################
# 2) Cloud Map (Service Discovery)
############################################
resource "aws_service_discovery_private_dns_namespace" "ns" {
  name        = local.namespace_domain
  description = "UIT-Go internal service namespace"
  vpc         = module.vpc.vpc_id
}

############################################
# 3) ECS cluster + logs
############################################
module "ecs" {
  source  = "terraform-aws-modules/ecs/aws"
  version = "~> 5.11"

  cluster_name = "${local.name_prefix}-ecs"
  fargate_capacity_providers = ["FARGATE", "FARGATE_SPOT"]
  cluster_settings = { containerInsights = "enabled" }
  tags = local.tags
}

resource "aws_cloudwatch_log_group" "svc" {
  name              = "/${local.name_prefix}/services"
  retention_in_days = 7
  tags              = local.tags
}

############################################
# 4) ALB (public) -> api-gateway
############################################
resource "aws_security_group" "alb" {
  name   = "${local.name_prefix}-alb-sg"
  vpc_id = module.vpc.vpc_id
  ingress {
    from_port = 80
    to_port = 80
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    }
  egress  {
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    }
  tags = local.tags
}

module "alb" {
  source  = "terraform-aws-modules/alb/aws"
  version = "~> 9.10"
  name    = "${local.name_prefix}-alb"
  load_balancer_type = "application"
  vpc_id  = module.vpc.vpc_id
  subnets = module.vpc.public_subnets
  security_groups = [aws_security_group.alb.id]
  tags = local.tags
}

resource "aws_lb_target_group" "api" {
  name     = "${local.name_prefix}-tg"
  port     = local.service_cfg["api-gateway"].port
  protocol = "HTTP"
  vpc_id   = module.vpc.vpc_id
  health_check { path = local.service_cfg["api-gateway"].health }
  tags = local.tags
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = module.alb.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type = "forward"
    target_group_arn = aws_lb_target_group.api.arn
    }
}

############################################
# 5) Security Groups: ECS / RDS / Redis / MQ
############################################
resource "aws_security_group" "ecs_tasks" {
  name   = "${local.name_prefix}-ecs-tasks-sg"
  vpc_id = module.vpc.vpc_id
  # ALB -> ECS
  ingress {
    from_port = 3000
    to_port = 3999
    protocol = "tcp"
    security_groups = [aws_security_group.alb.id]
    }
  egress  {
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    }

  tags = local.tags
}

resource "aws_security_group" "db" {
  name   = "${local.name_prefix}-rds-sg"
  vpc_id = module.vpc.vpc_id
  ingress {
    from_port = 5432
    to_port = 5432
    protocol = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
    }

  egress  {
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = local.tags
}

resource "aws_security_group" "redis" {
  name   = "${local.name_prefix}-redis-sg"
  vpc_id = module.vpc.vpc_id
  ingress {
    from_port = 6379
    to_port = 6379
    protocol = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
    }
  egress  {
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = local.tags
}

resource "aws_security_group" "mq" {
  name   = "${local.name_prefix}-mq-sg"
  vpc_id = module.vpc.vpc_id
  ingress {
    from_port = 5671
    to_port = 5672
    protocol = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
    }
  egress  {
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = local.tags
}

############################################
# 6) RDS PostgreSQL (3 DB)
############################################
resource "random_password" "db" {
  length = 20
  special = true
  }

module "rds_user" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.5"
  identifier = "${local.name_prefix}-userdb"
  engine = "postgres"
  engine_version = "16.3"
  instance_class = "db.t4g.micro"
  allocated_storage = 20
  db_name  = "userdb"
  username = var.db_master_username
  password = coalesce(var.db_master_password, random_password.db.result)
  port = 5432
  family = "postgres16"
  subnet_ids = module.vpc.private_subnets
  vpc_security_group_ids = [aws_security_group.db.id]
  publicly_accessible = false
  tags = local.tags
}

module "rds_trip" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.5"
  identifier = "${local.name_prefix}-tripdb"
  engine = "postgres"
  engine_version = "16.3"
  instance_class = "db.t4g.micro"
  allocated_storage = 20
  db_name  = "tripdb"
  username = var.db_master_username
  password = coalesce(var.db_master_password, random_password.db.result)
  port = 5432
  family = "postgres16"
  subnet_ids = module.vpc.private_subnets
  vpc_security_group_ids = [aws_security_group.db.id]
  publicly_accessible = false
  tags = local.tags
}

module "rds_driver" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.5"
  identifier = "${local.name_prefix}-driverdb"
  engine = "postgres"
  engine_version = "16.3"
  instance_class = "db.t4g.micro"
  allocated_storage = 20
  db_name  = "driverdb"
  username = var.db_master_username
  password = coalesce(var.db_master_password, random_password.db.result)
  port = 5432
  family = "postgres16"
  subnet_ids = module.vpc.private_subnets
  vpc_security_group_ids = [aws_security_group.db.id]
  publicly_accessible = false
  tags = local.tags
}

############################################
# 7) ElastiCache Redis
############################################
module "redis_subnet_group" {
  source  = "terraform-aws-modules/elasticache/aws//modules/subnet-group"
  version = "~> 1.8"
  subnet_group_name = "${local.name_prefix}-redis-subnets"
  subnet_ids = module.vpc.private_subnets
}

module "redis" {
  source  = "terraform-aws-modules/elasticache/aws"
  version = "~> 1.8"
  cluster_id         = "${local.name_prefix}-redis"
  engine             = "redis"
  node_type          = "cache.t4g.small"
  num_cache_nodes    = 1
  subnet_group_name  = module.redis_subnet_group.this_elasticache_subnet_group_name
  security_group_ids = [aws_security_group.redis.id]
  parameter_group_name = "default.redis7"
  tags = local.tags
}

############################################
# 8) Amazon MQ RabbitMQ
############################################
resource "random_password" "mq" {
  length = 20
  special = true
  }

resource "aws_mq_broker" "rabbit" {
  broker_name                = "${local.name_prefix}-rabbitmq"
  engine_type                = "RabbitMQ"
  engine_version             = "3.13.6"
  host_instance_type         = "mq.t3.micro"
  publicly_accessible        = false
  security_groups            = [aws_security_group.mq.id]
  subnet_ids                 = module.vpc.private_subnets
  auto_minor_version_upgrade = true

  user {
    username = "mqadmin"
    password = random_password.mq.result
    }
  logs { general = true }
  tags = local.tags
}

############################################
# 9) IAM
############################################
resource "aws_iam_role" "task_exec" {
  name               = "${local.name_prefix}-ecsTaskExec"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume.json
  tags               = local.tags
}
data "aws_iam_policy_document" "ecs_tasks_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}
resource "aws_iam_role_policy_attachment" "exec" {
  role       = aws_iam_role.task_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

############################################
# 10) Service Discovery: 1 service/1 registry
############################################
resource "aws_service_discovery_service" "sd" {
  for_each    = local.service_cfg
  name        = replace(each.key, "-", ".") # cosmetic
  namespace_id = aws_service_discovery_private_dns_namespace.ns.id
  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.ns.id
    dns_records {
      type = "A"
      ttl = 10
      }
    routing_policy = "WEIGHTED"
  }
  health_check_custom_config { failure_threshold = 1 }
}

############################################
# 11) Task definitions
############################################
resource "aws_ecs_task_definition" "td" {
  for_each                 = local.service_cfg
  family                   = "${local.name_prefix}-${each.key}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.container_cpu
  memory                   = var.container_mem
  execution_role_arn       = aws_iam_role.task_exec.arn

  container_definitions = jsonencode([
    {
      name      = each.key
      image     = var.container_image_map[each.key]
      essential = true
      portMappings = [{ containerPort = each.value.port, hostPort = each.value.port, protocol = "tcp" }]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.svc.name
          awslogs-region        = var.region
          awslogs-stream-prefix = each.key
        }
      }
      environment = local.container_env[each.key]
    }
  ])
}

# Mapping env theo docker compose
locals {
  container_env = {
    "api-gateway" = [
      { name = "PORT", value = tostring(local.service_cfg["api-gateway"].port) },
      { name = "USER_SERVICE_HOST", value = "user.local" },
      { name = "USER_SERVICE_PORT", value = tostring(local.service_cfg["user-service"].port) },
      { name = "SUPABASE_URL", value = var.supabase_url },
      { name = "SUPABASE_KEY", value = var.supabase_key },
      { name = "SUPABASE_JWT_SECRET", value = var.supabase_jwt_secret }
    ]
    "auth-service" = [
      { name = "PORT", value = tostring(local.service_cfg["auth-service"].port) },
      { name = "USER_SERVICE_HOST", value = "user.local" },
      { name = "USER_SERVICE_PORT", value = tostring(local.service_cfg["user-service"].port) },
      { name = "SUPABASE_URL", value = var.supabase_url },
      { name = "SUPABASE_KEY", value = var.supabase_key },
      { name = "SUPABASE_JWT_SECRET", value = var.supabase_jwt_secret }
    ]
    "user-service" = [
      { name = "PORT", value = tostring(local.service_cfg["user-service"].port) },
      { name = "USERDB_HOST", value = module.rds_user.db_instance_address },
      { name = "USERDB_PORT", value = "5432" },
      { name = "USERDB_USERNAME", value = var.db_master_username },
      { name = "USERDB_PASSWORD", value = coalesce(var.db_master_password, random_password.db.result) },
      { name = "USERDB_DATABASE", value = "userdb" }
    ]
    "trip-service" = [
      { name = "PORT", value = tostring(local.service_cfg["trip-service"].port) },
      { name = "TRIPDB_HOST", value = module.rds_trip.db_instance_address },
      { name = "TRIPDB_PORT", value = "5432" },
      { name = "TRIPDB_USERNAME", value = var.db_master_username },
      { name = "TRIPDB_PASSWORD", value = coalesce(var.db_master_password, random_password.db.result) },
      { name = "TRIPDB_DATABASE", value = "tripdb" }
    ]
    "driver-service" = [
      { name = "PORT", value = tostring(local.service_cfg["driver-service"].port) },
      { name = "DRIVERDB_HOST", value = module.rds_driver.db_instance_address },
      { name = "DRIVERDB_PORT", value = "5432" },
      { name = "DRIVERDB_USERNAME", value = var.db_master_username },
      { name = "DRIVERDB_PASSWORD", value = coalesce(var.db_master_password, random_password.db.result) },
      { name = "DRIVERDB_DATABASE", value = "driverdb" },
      { name = "REDIS_HOST", value = module.redis.primary_endpoint_address },
      { name = "REDIS_PORT", value = "6379" }
    ]
    "notification-service" = [
      { name = "PORT", value = tostring(local.service_cfg["notification-service"].port) },
      { name = "RABBITMQ_ENDPOINT", value = aws_mq_broker.rabbit.instances[0].endpoints[0] },
      { name = "RABBITMQ_USER", value = "mqadmin" },
      { name = "MAIL_HOST", value = var.mail_host },
      { name = "MAIL_PORT", value = tostring(var.mail_port) },
      { name = "MAIL_USER", value = var.mail_user },
      { name = "MAIL_PASS", value = var.mail_pass },
      { name = "FIREBASE_PROJECT_ID", value = var.firebase_project_id },
      { name = "FIREBASE_CLIENT_EMAIL", value = var.firebase_client_email },
      { name = "FIREBASE_PRIVATE_KEY", value = var.firebase_private_key }
    ]
  }
}

############################################
# 12) ECS Services + Service Discovery + ALB target
############################################
resource "aws_ecs_service" "svc" {
  for_each        = local.service_cfg
  name            = "${local.name_prefix}-${each.key}"
  cluster         = module.ecs.cluster_id
  task_definition = aws_ecs_task_definition.td[each.key].arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = module.vpc.private_subnets
    security_groups = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.sd[each.key].arn
  }

  dynamic "load_balancer" {
    for_each = each.key == "api-gateway" ? [1] : []
    content {
      target_group_arn = aws_lb_target_group.api.arn
      container_name   = each.key
      container_port   = each.value.port
    }
  }

  depends_on = [aws_lb_listener.http]
  tags       = local.tags
}
