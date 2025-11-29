terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket         = "uit-go-terraform-state"
    key            = "dev/terraform.tfstate"
    region         = "ap-southeast-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.region
}

locals {
  name_prefix = "${var.project}-${var.env}"
  namespace   = "${var.project}.local"
  tags = {
    Project = var.project
    Env     = var.env
    Managed = "terraform"
  }

  service_cfg = {
    "api-gateway"          = { port = 3000, health = "/health" }
    "auth-service"         = { port = 3001, health = "/health" }
    "user-service"         = { port = 3002, health = "/health" }
    "trip-service"         = { port = 3003, health = "/health" }
    "driver-service"       = { port = 3004, health = "/health" }
    "notification-service" = { port = 3005, health = "/health" }
  }

  default_images = {
    "api-gateway"          = "ghcr.io/se360-uit-go/uit-go-api-gateway:latest"
    "auth-service"         = "ghcr.io/se360-uit-go/uit-go-auth:latest"
    "user-service"         = "ghcr.io/se360-uit-go/uit-go-user:latest"
    "trip-service"         = "ghcr.io/se360-uit-go/uit-go-trip:latest"
    "driver-service"       = "ghcr.io/se360-uit-go/uit-go-driver:latest"
    "notification-service" = "ghcr.io/se360-uit-go/uit-go-notification:latest"
  }

  images = merge(local.default_images, var.container_image_map)
}

module "network" {
  source             = "../../modules/network"
  name_prefix        = local.name_prefix
  cidr               = var.vpc_cidr
  az_count           = var.az_count
  enable_nat_gateway = true
  single_nat_gateway = true
  tags               = local.tags
}

module "cluster" {
  source      = "../../modules/ecs-cluster"
  name_prefix = local.name_prefix
  tags        = local.tags
}

resource "aws_service_discovery_private_dns_namespace" "ns" {
  name        = local.namespace
  description = "UIT-Go internal service namespace"
  vpc         = module.network.vpc_id
  tags        = local.tags
}

module "alb" {
  count             = var.enable_alb ? 1 : 0
  source            = "../../modules/alb"
  name_prefix       = "${local.name_prefix}-api"
  vpc_id            = module.network.vpc_id
  public_subnets    = module.network.public_subnets
  service_port      = local.service_cfg["api-gateway"].port
  health_check_path = local.service_cfg["api-gateway"].health
  tags              = local.tags
}

resource "aws_security_group" "ecs_tasks" {
  name   = "${local.name_prefix}-ecs-tasks"
  vpc_id = module.network.vpc_id
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  dynamic "ingress" {
    for_each = var.enable_alb ? [1] : []
    content {
      from_port       = 3000
      to_port         = 3999
      protocol        = "tcp"
      security_groups = [module.alb[0].alb_sg_id]
    }
  }
  tags = local.tags
}

resource "aws_security_group" "db" {
  count  = var.enable_rds ? 1 : 0
  name   = "${local.name_prefix}-rds"
  vpc_id = module.network.vpc_id
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = local.tags
}

module "rds_user" {
  count                  = var.enable_rds ? 1 : 0
  source                 = "../../modules/rds"
  name_prefix            = "${local.name_prefix}-user"
  db_name                = "userdb"
  username               = var.db_master_username
  password               = coalesce(var.db_master_password, "changeme123!")
  subnet_ids             = module.network.private_subnets
  vpc_security_group_ids = var.enable_rds ? [aws_security_group.db[0].id] : []
  tags                   = merge(local.tags, { Service = "user-service" })
}

module "rds_trip" {
  count                  = var.enable_rds ? 1 : 0
  source                 = "../../modules/rds"
  name_prefix            = "${local.name_prefix}-trip"
  db_name                = "tripdb"
  username               = var.db_master_username
  password               = coalesce(var.db_master_password, "changeme123!")
  subnet_ids             = module.network.private_subnets
  vpc_security_group_ids = var.enable_rds ? [aws_security_group.db[0].id] : []
  tags                   = merge(local.tags, { Service = "trip-service" })
}

module "rds_driver" {
  count                  = var.enable_rds ? 1 : 0
  source                 = "../../modules/rds"
  name_prefix            = "${local.name_prefix}-driver"
  db_name                = "driverdb"
  username               = var.db_master_username
  password               = coalesce(var.db_master_password, "changeme123!")
  subnet_ids             = module.network.private_subnets
  vpc_security_group_ids = var.enable_rds ? [aws_security_group.db[0].id] : []
  tags                   = merge(local.tags, { Service = "driver-service" })
}

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
      { name = "USERDB_HOST", value = var.enable_rds && length(module.rds_user) > 0 ? module.rds_user[0].db_instance_address : "" },
      { name = "USERDB_PORT", value = var.enable_rds ? "5432" : "" },
      { name = "USERDB_USERNAME", value = var.enable_rds ? var.db_master_username : "" },
      { name = "USERDB_PASSWORD", value = var.enable_rds ? coalesce(var.db_master_password, "changeme123!") : "" },
      { name = "USERDB_DATABASE", value = var.enable_rds ? "userdb" : "" }
    ]
    "trip-service" = [
      { name = "PORT", value = tostring(local.service_cfg["trip-service"].port) },
      { name = "TRIPDB_HOST", value = var.enable_rds && length(module.rds_trip) > 0 ? module.rds_trip[0].db_instance_address : "" },
      { name = "TRIPDB_PORT", value = var.enable_rds ? "5432" : "" },
      { name = "TRIPDB_USERNAME", value = var.enable_rds ? var.db_master_username : "" },
      { name = "TRIPDB_PASSWORD", value = var.enable_rds ? coalesce(var.db_master_password, "changeme123!") : "" },
      { name = "TRIPDB_DATABASE", value = var.enable_rds ? "tripdb" : "" }
    ]
    "driver-service" = [
      { name = "PORT", value = tostring(local.service_cfg["driver-service"].port) },
      { name = "DRIVERDB_HOST", value = var.enable_rds && length(module.rds_driver) > 0 ? module.rds_driver[0].db_instance_address : "" },
      { name = "DRIVERDB_PORT", value = var.enable_rds ? "5432" : "" },
      { name = "DRIVERDB_USERNAME", value = var.enable_rds ? var.db_master_username : "" },
      { name = "DRIVERDB_PASSWORD", value = var.enable_rds ? coalesce(var.db_master_password, "changeme123!") : "" },
      { name = "DRIVERDB_DATABASE", value = var.enable_rds ? "driverdb" : "" }
    ]
    "notification-service" = [
      { name = "PORT", value = tostring(local.service_cfg["notification-service"].port) }
    ]
  }
}

module "services" {
  source   = "../../modules/service"
  for_each = local.service_cfg

  name_prefix      = local.name_prefix
  service_name     = each.key
  cluster_id       = module.cluster.cluster_id
  cluster_name     = module.cluster.cluster_name
  subnets          = module.network.private_subnets
  security_groups  = [aws_security_group.ecs_tasks.id]
  container_image  = local.images[each.key]
  container_port   = each.value.port
  cpu              = var.container_cpu
  memory           = var.container_mem
  desired_count    = var.desired_count
  log_group_name   = module.cluster.log_group_name
  region           = var.region
  env              = local.container_env[each.key]
  namespace_id     = aws_service_discovery_private_dns_namespace.ns.id
  target_group_arn = var.enable_alb && each.key == "api-gateway" ? module.alb[0].target_group_arn : null
  tags             = local.tags
}

module "finops" {
  source                 = "../../modules/finops"
  name_prefix            = local.name_prefix
  project                = var.project
  region                 = var.region
  budget_alert_emails    = var.budget_alert_emails
  enable_budget          = var.enable_budget
  enable_anomaly_monitor = var.enable_anomaly_monitor
  finops_team_email      = var.finops_team_email
  sns_topic_arn          = var.sns_topic_arn
  cluster_name           = module.cluster.cluster_name
  log_group_name         = module.cluster.log_group_name
  tags                   = local.tags
}
