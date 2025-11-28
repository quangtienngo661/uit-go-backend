variable "name_prefix" {
  type = string
}

variable "project" {
  type = string
}

variable "region" {
  type = string
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

variable "cluster_name" {
  type    = string
  default = ""
}

variable "log_group_name" {
  type    = string
  default = ""
}

variable "tags" {
  type    = map(string)
  default = {}
}

resource "aws_budgets_budget" "monthly" {
  count             = var.enable_budget && length(var.budget_alert_emails) > 0 ? 1 : 0
  name              = "${var.name_prefix}-monthly-budget"
  budget_type       = "COST"
  limit_amount      = "500"
  limit_unit        = "USD"
  time_unit         = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_alert_emails
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.budget_alert_emails
  }

  cost_filter {
    name   = "TagKeyValue"
    values = ["user:Project$${var.project}"]
  }
}

resource "aws_ce_anomaly_monitor" "service_monitor" {
  count            = var.enable_anomaly_monitor ? 1 : 0
  name             = "${var.name_prefix}-cost-anomaly"
  monitor_type      = "DIMENSIONAL"
  monitor_dimension = "SERVICE"
  tags              = var.tags
}

resource "aws_ce_anomaly_subscription" "anomaly_alert" {
  count     = var.enable_anomaly_monitor && var.finops_team_email != "" ? 1 : 0
  name      = "${var.name_prefix}-anomaly-subscription"
  frequency = "DAILY"

  monitor_arn_list = var.enable_anomaly_monitor ? [aws_ce_anomaly_monitor.service_monitor[0].arn] : []

  subscriber {
    type    = "EMAIL"
    address = var.finops_team_email
  }

  threshold_expression {
    dimension {
      key           = "ANOMALY_TOTAL_IMPACT_ABSOLUTE"
      values        = ["100"]
      match_options = ["GREATER_THAN_OR_EQUAL"]
    }
  }
}

resource "aws_cloudwatch_dashboard" "finops" {
  dashboard_name = "${var.name_prefix}-finops-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", { stat = "Average", label = "ECS CPU Avg" }],
            [".", "MemoryUtilization", { stat = "Average", label = "ECS Memory Avg" }],
          ]
          period = 300
          region = var.region
          title  = "ECS Resource Utilization"
          yAxis  = { left = { min = 0, max = 100 } }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", { stat = "Sum", label = "RDS Connections" }],
            [".", "CPUUtilization", { stat = "Average", label = "RDS CPU" }],
          ]
          period = 300
          region = var.region
          title  = "RDS Performance"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ElastiCache", "CacheHits", { stat = "Sum", label = "Redis Hits" }],
            [".", "CacheMisses", { stat = "Sum", label = "Redis Misses" }],
          ]
          period = 300
          region = var.region
          title  = "Redis Cache Performance"
        }
      },
      {
        type = "log"
        properties = {
          query  = var.log_group_name != "" ? "SOURCE '${var.log_group_name}' | fields @timestamp, @message | filter @message like /ERROR/ | stats count() by bin(5m)" : ""
          region = var.region
          title  = "Error Rate (5min intervals)"
        }
      }
    ]
  })
}

resource "aws_cloudwatch_metric_alarm" "ecs_high_cpu" {
  count               = var.cluster_name != "" ? 1 : 0
  alarm_name          = "${var.name_prefix}-ecs-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "ECS CPU > 80% - may trigger autoscaling cost increase"
  alarm_actions       = var.sns_topic_arn != "" ? [var.sns_topic_arn] : []

  dimensions = {
    ClusterName = var.cluster_name
  }

  tags = var.tags
}
