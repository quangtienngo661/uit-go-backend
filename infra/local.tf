locals {
  name_prefix = "${var.project}-${var.env}"

  # .env ports and health check paths for each service
  service_cfg = {
    "api-gateway"  = { port = 3000, health = "/health" }
    "auth-service" = { port = 3001, health = "/health" }
    "user-service" = { port = 3002, health = "/health" }
    "trip-service" = { port = 3003, health = "/health" }
    "driver-service" = { port = 3004, health = "/health" }
    "notification-service" = { port = 3005, health = "/health" }
  }

  # internal DNS Service Discovery
  namespace_domain = "local"

  tags = { Project = var.project, Env = var.env, Owner = "se360-uit-go" }
}
