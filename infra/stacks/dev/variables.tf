variable "project" {
  type    = string
  default = "uit-go"
}

variable "env" {
  type    = string
  default = "dev"
}

variable "region" {
  type    = string
  default = "ap-southeast-1"
}

variable "vpc_cidr" {
  type    = string
  default = "10.20.0.0/16"
}

variable "az_count" {
  type    = number
  default = 2
}

variable "container_image_map" {
  description = "Map of service name to container image"
  type        = map(string)
  default     = {}
}

variable "container_cpu" {
  type    = number
  default = 512
}

variable "container_mem" {
  type    = number
  default = 1024
}

variable "desired_count" {
  type    = number
  default = 1
}

variable "enable_alb" {
  type        = bool
  default     = false
  description = "Enable ALB for api-gateway"
}

variable "enable_rds" {
  type        = bool
  default     = false
}

variable "db_master_username" {
  type    = string
  default = "appadmin"
}

variable "db_master_password" {
  type      = string
  default   = null
  sensitive = true
}

variable "supabase_url" {
  type    = string
  default = ""
}

variable "supabase_key" {
  type      = string
  default   = ""
  sensitive = true
}

variable "supabase_jwt_secret" {
  type      = string
  default   = ""
  sensitive = true
}

variable "budget_alert_emails" {
  type    = list(string)
  default = []
}

variable "enable_budget" {
  type    = bool
  default = false
}

variable "enable_anomaly_monitor" {
  type    = bool
  default = false
}

variable "finops_team_email" {
  type    = string
  default = ""
}

variable "sns_topic_arn" {
  type    = string
  default = ""
}
