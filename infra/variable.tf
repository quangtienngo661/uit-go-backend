variable "project"   {
  type = string
  default = "uit-go"
  }
variable "env"       {
  type = string
  default = "dev"
  }
variable "region"    {
  type = string
  default = "ap-southeast-1"
  }
variable "vpc_cidr"  {
  type = string
  default = "10.20.0.0/16"
  }
variable "az_count"  {
  type = number
  default = 2
  }

# images (will input real image tags later)
variable "container_image_map" {
  type = map(string)
  default = {
    "api-gateway"  = "ghcr.io/uit-go/api-gateway:latest"
    "auth-service" = "ghcr.io/uit-go/auth:latest"
    "user-service" = "ghcr.io/uit-go/user:latest"
    "trip-service" = "ghcr.io/uit-go/trip:latest"
    "driver-service" = "ghcr.io/uit-go/driver:latest"
    "notification-service" = "ghcr.io/uit-go/notification:latest"
  }
}

# resources
variable "container_cpu" {
  type = number
  default = 512
  }
variable "container_mem" {
  type = number
  default = 1024
  }
variable "desired_count" {
  type = number
  default = 1
  }

# DB master (for all 3 RDS instances)
variable "db_master_username" {
  type = string
  default = "appadmin"
  }
variable "db_master_password" {
  type = string
  default = null
  sensitive = true
  }


# Supabase (for api-gateway & auth-service)
variable "supabase_url"       {
  type = string
  default = ""
  }
variable "supabase_key"       {
  type = string
  default = ""
  sensitive = true
  }
variable "supabase_jwt_secret"{
  type = string
  default = ""
  sensitive = true
  }

# RabbitMQ Management API
variable "rabbitmq_mgmt_url" { type = string }
variable "rabbitmq_username" {
  type = string
  default = "mqadmin"
  }

variable "rabbitmq_password" {
  type = string
  sensitive = true
  }

# FinOps variables
variable "budget_alert_emails" {
  type = list(string)
  default = []
  description = "Email addresses to notify for budget alerts"
  }

variable "finops_team_email" {
  type = string
  default = ""
  description = "Email for cost anomaly alerts"
  }

variable "sns_topic_arn" {
  type = string
  default = ""
  description = "SNS topic ARN for CloudWatch alarms"
  }

# Firebase (for notification-service push notifications)
variable "firebase_project_id" {
  type = string
  default = ""
  description = "Firebase project ID for push notifications"
  }

variable "firebase_client_email" {
  type = string
  default = ""
  description = "Firebase service account email"
  }

variable "firebase_private_key" {
  type = string
  default = ""
  sensitive = true
  description = "Firebase service account private key"
  }

# Email (for notification-service email notifications)
variable "mail_host" {
  type = string
  default = "smtp.gmail.com"
  description = "SMTP mail server host"
  }

variable "mail_port" {
  type = number
  default = 587
  description = "SMTP mail server port"
  }

variable "mail_user" {
  type = string
  default = ""
  description = "SMTP authentication username"
  }

variable "mail_pass" {
  type = string
  default = ""
  sensitive = true
  description = "SMTP authentication password"
  }
