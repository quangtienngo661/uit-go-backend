locals {
  name_prefix = "${var.project}-${var.env}"

  # .env ports and health check paths for each service
  service_cfg = {
    "api-gateway"  = { port = 3000, health = "/health", budget = 40 }
    "auth-service" = { port = 3001, health = "/health", budget = 30 }
    "user-service" = { port = 3002, health = "/health", budget = 50 }
    "trip-service" = { port = 3003, health = "/health", budget = 60 }
    "driver-service" = { port = 3004, health = "/health", budget = 70 }
    "notification-service" = { port = 3005, health = "/health", budget = 25 }
  }

  # internal DNS Service Discovery
  namespace_domain = "local"

  # Common tags for all resources
  common_tags = {
    Project      = var.project
    Environment  = var.env
    Owner        = "se360-uit-go"
    ManagedBy    = "Terraform"
    CostCenter   = "Engineering"
  }

  # Per-service tags (will be merged with common_tags)
  service_tags = {
    for service_name, config in local.service_cfg : service_name => merge(
      local.common_tags,
      {
        Service     = service_name
        Criticality = service_name == "api-gateway" ? "high" : service_name == "notification-service" ? "low" : "medium"
      }
    )
  }

  # Legacy tags reference for compatibility
  tags = local.common_tags
}
