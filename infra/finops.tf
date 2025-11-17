############################################
# FinOps Module: Cost Monitoring & Budgets
# This file implements Module E cost governance requirements
############################################

# 1) AWS Budget for monthly cost control (Overall)
resource "aws_budgets_budget" "monthly" {
  name              = "${local.name_prefix}-monthly-budget"
  budget_type       = "COST"
  limit_amount      = "500"
  limit_unit        = "USD"
  time_unit         = "MONTHLY"
  time_period_start = "2025-11-01_00:00"

  # Alert at 80% threshold
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_alert_emails
  }

  # Alert at 100% forecast
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.budget_alert_emails
  }

  # Filter by project tags
  cost_filter {
    name   = "TagKeyValue"
    values = ["user:Project$${var.project}"]
  }
}

# 1b) Per-Service Budgets for granular cost control
resource "aws_budgets_budget" "service_budgets" {
  for_each = local.service_cfg

  name              = "${local.name_prefix}-${each.key}-budget"
  budget_type       = "COST"
  limit_amount      = tostring(each.value.budget)
  limit_unit        = "USD"
  time_unit         = "MONTHLY"
  time_period_start = "2025-11-01_00:00"

  # Alert at 80% threshold
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_alert_emails
  }

  # Alert at 100% actual spend
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_alert_emails
  }

  # Filter by service tag
  cost_filter {
    name   = "TagKeyValue"
    values = ["user:Service$${each.key}"]
  }

  tags = local.service_tags[each.key]
}

# 2) CloudWatch Cost Anomaly Detection
resource "aws_ce_anomaly_monitor" "service_monitor" {
  name              = "${local.name_prefix}-cost-anomaly"
  monitor_type      = "DIMENSIONAL"
  monitor_dimension = "SERVICE"

  tags = local.tags
}

resource "aws_ce_anomaly_subscription" "anomaly_alert" {
  name      = "${local.name_prefix}-anomaly-subscription"
  frequency = "DAILY"

  monitor_arn_list = [
    aws_ce_anomaly_monitor.service_monitor.arn,
  ]

  subscriber {
    type    = "EMAIL"
    address = var.finops_team_email
  }

  threshold_expression {
    dimension {
      key           = "ANOMALY_TOTAL_IMPACT_ABSOLUTE"
      values        = ["100"] # Alert if anomaly > $100
      match_options = ["GREATER_THAN_OR_EQUAL"]
    }
  }
}

# 3) CloudWatch Dashboard for Cost Metrics
resource "aws_cloudwatch_dashboard" "finops" {
  dashboard_name = "${local.name_prefix}-finops-dashboard"

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
          query   = "SOURCE '${aws_cloudwatch_log_group.svc.name}' | fields @timestamp, @message | filter @message like /ERROR/ | stats count() by bin(5m)"
          region  = var.region
          title   = "Error Rate (5min intervals)"
        }
      }
    ]
  })
}

# 4) CloudWatch Alarms for Cost-Impacting Events
resource "aws_cloudwatch_metric_alarm" "ecs_high_cpu" {
  alarm_name          = "${local.name_prefix}-ecs-high-cpu"
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
    ClusterName = module.ecs.cluster_name
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "rds_high_connections" {
  alarm_name          = "${local.name_prefix}-rds-high-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80 # db.t4g.micro has ~100 max connections
  alarm_description   = "RDS connections high - may need instance upgrade"
  alarm_actions       = var.sns_topic_arn != "" ? [var.sns_topic_arn] : []

  tags = local.tags
}

# Note: Cost allocation by service is handled through resource tags (Service=xxx)
# Use AWS Cost Explorer with tag filters to view per-service costs

