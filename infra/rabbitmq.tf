# Central Exchange (topic)
resource "rabbitmq_exchange" "events" {
  count = var.enable_mq ? 1 : 0
  name  = "uitgo.events"
  vhost = "/"
  settings {
    type        = "topic"
    durable     = true
    auto_delete = false
  }
}

# Queues
resource "rabbitmq_queue" "trip_q" {
  count = var.enable_mq ? 1 : 0
  name  = "trip-service.q"
  vhost = "/"
  settings {
    durable = true
  }
}

resource "rabbitmq_queue" "driver_q" {
  count = var.enable_mq ? 1 : 0
  name  = "driver-service.q"
  vhost = "/"
  settings {
    durable = true
  }
}

resource "rabbitmq_queue" "notification_q" {
  count = var.enable_mq ? 1 : 0
  name  = "notification-service.q"
  vhost = "/"
  settings {
    durable = true
  }
}

resource "rabbitmq_queue" "dlq" {
  count = var.enable_mq ? 1 : 0
  name  = "uitgo.dlq"
  vhost = "/"
  settings {
    durable = true
  }
}

# Bindings the routing keys according to architecture model
resource "rabbitmq_binding" "trip_requested__trip" {
  count            = var.enable_mq ? 1 : 0
  vhost            = "/"
  source           = rabbitmq_exchange.events[0].name
  destination_type = "queue"
  destination      = rabbitmq_queue.trip_q[0].name
  routing_key      = "trip.requested"
}

resource "rabbitmq_binding" "driver_accepted__trip" {
  count            = var.enable_mq ? 1 : 0
  vhost            = "/"
  source           = rabbitmq_exchange.events[0].name
  destination_type = "queue"
  destination      = rabbitmq_queue.trip_q[0].name
  routing_key      = "driver.accepted"
}

resource "rabbitmq_binding" "trip_created__driver" {
  count            = var.enable_mq ? 1 : 0
  vhost            = "/"
  source           = rabbitmq_exchange.events[0].name
  destination_type = "queue"
  destination      = rabbitmq_queue.driver_q[0].name
  routing_key      = "trip.created"
}

resource "rabbitmq_binding" "trip_cancelled__driver" {
  count            = var.enable_mq ? 1 : 0
  vhost            = "/"
  source           = rabbitmq_exchange.events[0].name
  destination_type = "queue"
  destination      = rabbitmq_queue.driver_q[0].name
  routing_key      = "trip.cancelled"
}

resource "rabbitmq_binding" "trip_started__noti" {
  count            = var.enable_mq ? 1 : 0
  vhost            = "/"
  source           = rabbitmq_exchange.events[0].name
  destination_type = "queue"
  destination      = rabbitmq_queue.notification_q[0].name
  routing_key      = "trip.started"
}

resource "rabbitmq_binding" "trip_completed__noti" {
  count            = var.enable_mq ? 1 : 0
  vhost            = "/"
  source           = rabbitmq_exchange.events[0].name
  destination_type = "queue"
  destination      = rabbitmq_queue.notification_q[0].name
  routing_key      = "trip.completed"
}

resource "rabbitmq_binding" "driver_accepted__noti" {
  count            = var.enable_mq ? 1 : 0
  vhost            = "/"
  source           = rabbitmq_exchange.events[0].name
  destination_type = "queue"
  destination      = rabbitmq_queue.notification_q[0].name
  routing_key      = "driver.accepted"
}

# wildcard: all trip.* -> notification
resource "rabbitmq_binding" "trip_all__noti" {
  count            = var.enable_mq ? 1 : 0
  vhost            = "/"
  source           = rabbitmq_exchange.events[0].name
  destination_type = "queue"
  destination      = rabbitmq_queue.notification_q[0].name
  routing_key      = "trip.*"
}

# DLQ routing
resource "rabbitmq_binding" "dlq_binding" {
  count            = var.enable_mq ? 1 : 0
  vhost            = "/"
  source           = rabbitmq_exchange.events[0].name
  destination_type = "queue"
  destination      = rabbitmq_queue.dlq[0].name
  routing_key      = "dlq"
}
