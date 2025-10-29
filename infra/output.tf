output "alb_dns_name" { value = module.alb.dns_name }
output "userdb_address"   { value = module.rds_user.db_instance_address }
output "tripdb_address"   { value = module.rds_trip.db_instance_address }
output "driverdb_address" { value = module.rds_driver.db_instance_address }
output "redis_endpoint"   { value = module.redis.primary_endpoint_address }
output "rabbitmq_console" { value = aws_mq_broker.rabbit.instances[0].console_url }
output "rabbitmq_amqp"    { value = aws_mq_broker.rabbit.instances[0].endpoints[0] }
output "namespace_domain" { value = local.namespace_domain }
