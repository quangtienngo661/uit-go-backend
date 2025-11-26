output "alb_dns_name" {
  value       = var.enable_alb && length(module.alb) > 0 ? module.alb[0].dns_name : ""
  description = "ALB DNS name (empty if ALB disabled)"
}
output "userdb_address"   { value = var.enable_rds && length(module.rds_user) > 0 ? module.rds_user[0].db_instance_address : "" }
output "tripdb_address"   { value = var.enable_rds && length(module.rds_trip) > 0 ? module.rds_trip[0].db_instance_address : "" }
output "driverdb_address" { value = var.enable_rds && length(module.rds_driver) > 0 ? module.rds_driver[0].db_instance_address : "" }
output "redis_endpoint" {
  value       = var.enable_redis && length(aws_elasticache_replication_group.redis) > 0 ? aws_elasticache_replication_group.redis[0].primary_endpoint_address : ""
  description = "Redis primary endpoint (empty if Redis disabled)"
}
output "rabbitmq_console" {
  value       = var.enable_mq && length(aws_mq_broker.rabbit) > 0 ? aws_mq_broker.rabbit[0].instances[0].console_url : ""
  description = "RabbitMQ console URL (empty if MQ disabled)"
}
output "rabbitmq_amqp" {
  value       = var.enable_mq && length(aws_mq_broker.rabbit) > 0 ? aws_mq_broker.rabbit[0].instances[0].endpoints[0] : ""
  description = "RabbitMQ AMQP endpoint (empty if MQ disabled)"
}
output "namespace_domain" { value = local.namespace_domain }
