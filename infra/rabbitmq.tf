# Central Exchange (topic)
resource "rabbitmq_exchange" "events" {
  name     = "uitgo.events"
  vhost    = "/"
  type     = "topic"
  durable  = true
  auto_delete = false
}

# Queues
resource "rabbitmq_queue" "trip_q" {
  name    = "trip-service.q"
  vhost   = "/"
  durable = true
}

resource "rabbitmq_queue" "driver_q" {
  name    = "driver-service.q"
  vhost   = "/"
  durable = true
}

resource "rabbitmq_queue" "notification_q" {
  name    = "notification-service.q"
  vhost   = "/"
  durable = true
}

resource "rabbitmq_queue" "dlq" {
  name    = "uitgo.dlq"
  vhost   = "/"
  durable = true
}

# Bindings the routing keys according to architecture model
resource "rabbitmq_binding" "trip_requested__trip" {
  vhost = "/"
  source = rabbitmq_exchange.events.name
  destination_type = "queue"
  destination = rabbitmq_queue.trip_q.name
  routing_key = "trip.requested"
}

resource "rabbitmq_binding" "driver_accepted__trip" {
  vhost = "/"
  source = rabbitmq_exchange.events.name
  destination_type = "queue"
  destination = rabbitmq_queue.trip_q.name
  routing_key = "driver.accepted"
}

resource "rabbitmq_binding" "trip_created__driver" {
  vhost = "/"
  source = rabbitmq_exchange.events.name
  destination_type = "queue"
  destination = rabbitmq_queue.driver_q.name
  routing_key = "trip.created"
}

resource "rabbitmq_binding" "trip_cancelled__driver" {
  vhost = "/"
  source = rabbitmq_exchange.events.name
  destination_type = "queue"
  destination = rabbitmq_queue.driver_q.name
  routing_key = "trip.cancelled"
}

resource "rabbitmq_binding" "trip_started__noti" {
  vhost = "/"
  source = rabbitmq_exchange.events.name
  destination_type = "queue"
  destination = rabbitmq_queue.notification_q.name
  routing_key = "trip.started"
}

resource "rabbitmq_binding" "trip_completed__noti" {
  vhost = "/"
  source = rabbitmq_exchange.events.name
  destination_type = "queue"
  destination = rabbitmq_queue.notification_q.name
  routing_key = "trip.completed"
}

resource "rabbitmq_binding" "driver_accepted__noti" {
  vhost = "/"
  source = rabbitmq_exchange.events.name
  destination_type = "queue"
  destination = rabbitmq_queue.notification_q.name
  routing_key = "driver.accepted"
}

# wildcard: all trip.* -> notification
resource "rabbitmq_binding" "trip_all__noti" {
  vhost = "/"
  source = rabbitmq_exchange.events.name
  destination_type = "queue"
  destination = rabbitmq_queue.notification_q.name
  routing_key = "trip.*"
}

# DLQ routing
resource "rabbitmq_binding" "dlq_binding" {
  vhost = "/"
  source = rabbitmq_exchange.events.name
  destination_type = "queue"
  destination = rabbitmq_queue.dlq.name
  routing_key = "dlq"
}
