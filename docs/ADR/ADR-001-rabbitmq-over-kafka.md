# ADR-001: RabbitMQ over Kafka for Event-Driven Messaging

**Status:** Accepted  
**Date:** October 2025  
**Decision Makers:** Không Huỳnh Ngọc Hân, Ngô Quang Tiến, Nguyễn Hữu Duy  
**Module Context:** Module E - Cost Optimization & FinOps

---

## Context and Problem Statement

The UIT-Go platform requires an asynchronous messaging system to enable event-driven communication between microservices. Key events include trip creation, driver acceptance, location updates, and notifications. We need to choose between industry-standard solutions: **Apache Kafka** vs **RabbitMQ**.

### Requirements
- Handle 1,000+ events per second (MVP target)
- Support publish-subscribe pattern with topic-based routing
- Enable service decoupling and eventual consistency
- **Cost-effective for Module E focus**
- Easy to set up and maintain for local development
- Low resource consumption (team uses personal laptops)

---

## Decision Drivers

1. **Cost** (Module E Priority): AWS operational costs, resource usage
2. **Development Velocity**: Setup complexity, debugging ease
3. **Performance**: Message latency, throughput
4. **Scalability**: Ability to grow with user base
5. **Team Expertise**: Learning curve for NestJS integration

---

## Considered Options

### Option 1: Apache Kafka
**Description:** Distributed event streaming platform with built-in persistence and replay capabilities.

**Pros:**
- ✅ Industry standard for high-throughput event streaming
- ✅ Built-in event replay and long-term retention
- ✅ Excellent for analytics and event sourcing
- ✅ Horizontal scalability proven at scale (Uber, Netflix)

**Cons:**
- ❌ **High resource usage**: ~800 MB RAM idle for broker
- ❌ **Complex setup**: Requires Zookeeper (or KRaft mode)
- ❌ **Slow startup**: 30-60 seconds per container
- ❌ **High AWS cost**: Amazon MSK ~$150/month minimum
- ❌ **Port conflicts**: Broker default port (9092) conflicted with PostgreSQL in our Docker setup

**Cost Analysis (AWS):**
| Component | Configuration | Monthly Cost |
|-----------|---------------|--------------|
| MSK Cluster | 3x m5.large brokers | ~$150 |
| Zookeeper | 3x t3.small nodes | ~$30 |
| Data Transfer | 100 GB/month | ~$10 |
| **Total** | | **~$190** |

### Option 2: RabbitMQ (CHOSEN)
**Description:** Lightweight message broker with flexible routing via exchanges and queues.

**Pros:**
- ✅ **Low resource usage**: ~150 MB RAM idle
- ✅ **Simple setup**: Single Docker container
- ✅ **Fast startup**: ~10 seconds
- ✅ **Flexible routing**: Topic exchanges with wildcard routing keys (trip.*, driver.*)
- ✅ **Management UI**: Built-in monitoring dashboard
- ✅ **NestJS integration**: Native @nestjs/microservices support
- ✅ **Cost-effective**: ~$30/month on AWS (t4g.small EC2)

**Cons:**
- ❌ **No event replay**: Messages are deleted after acknowledgment
- ❌ **Limited retention**: Not designed for long-term event storage
- ❌ **Fewer integrations**: Smaller ecosystem than Kafka

**Cost Analysis (AWS):**
| Component | Configuration | Monthly Cost |
|-----------|---------------|--------------|
| EC2 Instance | t4g.small (ARM) | ~$15 |
| EBS Storage | 20 GB GP3 | ~$2 |
| Data Transfer | 100 GB/month | ~$10 |
| Elastic IP | 1 static IP | ~$3 |
| **Total** | | **~$30** |

### Option 3: AWS SQS + SNS
**Description:** Fully managed AWS message queue and pub/sub services.

**Pros:**
- ✅ Fully managed (zero ops)
- ✅ Pay-per-use pricing
- ✅ Auto-scaling

**Cons:**
- ❌ **Vendor lock-in**: AWS-specific
- ❌ **Limited local dev**: Requires LocalStack or mocks
- ❌ **Higher latency**: ~100-300ms per message
- ❌ **Complex for topic routing**: Requires SNS + multiple SQS queues

---

## Decision Outcome

**Chosen option:** **RabbitMQ** (Option 2)

### Rationale

1. **Cost Savings (Module E Alignment):**
   - **$120/month savings** compared to Kafka ($30 vs $150)
   - **81% lower resource usage** (150 MB vs 800 MB RAM)
   - **Fits Module E mandate**: Demonstrate cost-conscious architecture

2. **Development Velocity:**
   - Setup time: **30 minutes** vs 2-3 hours for Kafka
   - Single `docker-compose up` command vs multi-broker configuration
   - Team successfully running on 8GB RAM laptops

3. **Sufficient for MVP Scope:**
   - Handles **5,000+ messages/second** (measured locally)
   - Our target: 1,000 messages/second (peak)
   - **50-70ms end-to-end latency** (publish → consume)

4. **Flexible Routing:**
   - Topic exchange pattern fits our use case perfectly:
     - `trip.*` → Matches trip.created, trip.started, trip.completed
     - `driver.*` → Matches driver.accepted, driver.location.updated
   - Multiple consumers can subscribe to same events

5. **Team Capability:**
   - Native NestJS support (`@nestjs/microservices`)
   - Built-in management UI (localhost:15672)
   - Simpler debugging (textual protocol vs binary)

### Accepted Trade-offs

| What We Lost | Impact | Mitigation Strategy |
|--------------|--------|---------------------|
| Event replay | Cannot re-process historical events | Store critical events in PostgreSQL audit log |
| Long-term retention | Events deleted after ACK | Export important events to S3/database for analytics |
| Kafka ecosystem | Fewer integrations (Kafka Connect, etc.) | Build custom integrations if needed |
| Industry perception | "Why not Kafka?" questions | Document decision with data (this ADR!) |

### Positive Consequences

- ✅ **$1,440/year cost savings** on AWS
- ✅ Team can run full stack on personal laptops
- ✅ Faster iteration cycles (quick restart, easy debugging)
- ✅ Management UI improves observability
- ✅ Demonstrates **informed trade-off decision-making** (SE360 learning objective)

### Negative Consequences

- ❌ **Cannot replay events** for debugging or reprocessing
- ❌ Future migration to Kafka requires effort if scale demands it
- ❌ Limited to ~10K messages/sec (RabbitMQ ceiling)

---

## Implementation Details

### RabbitMQ Configuration

**Docker Compose:**
```yaml
rabbitmq:
  image: rabbitmq:3-management
  container_name: rabbitmq
  ports:
    - '15672:15672'  # Management UI
    - '5672:5672'    # AMQP
  environment:
    RABBITMQ_DEFAULT_USER: admin
    RABBITMQ_DEFAULT_PASS: admin123
  volumes:
    - rabbitmq_data:/var/lib/rabbitmq
```

**Exchange and Queue Setup:**
```typescript
// Setup in each service
await this.channel.assertExchange('uitgo.events', 'topic', {
  durable: true
});

// Trip Service Queue
await this.channel.assertQueue('trip.q', { durable: true });
await this.channel.bindQueue('trip.q', 'uitgo.events', 'trip.*');
await this.channel.bindQueue('trip.q', 'uitgo.events', 'driver.accepted');

// Driver Service Queue
await this.channel.assertQueue('driver.q', { durable: true });
await this.channel.bindQueue('driver.q', 'uitgo.events', 'trip.created');

// Notification Service Queue
await this.channel.assertQueue('notif.q', { durable: true });
await this.channel.bindQueue('notif.q', 'uitgo.events', 'trip.*');
await this.channel.bindQueue('notif.q', 'uitgo.events', 'driver.*');
```

### Routing Key Convention

| Event | Routing Key | Producers | Consumers |
|-------|-------------|-----------|-----------|
| Trip requested | `trip.created` | Trip Service | Driver, Notif |
| Trip started | `trip.started` | Trip Service | Notif |
| Trip completed | `trip.completed` | Trip Service | Notif, User |
| Trip cancelled | `trip.cancelled` | Trip Service | Notif, User |
| Driver accepts | `driver.accepted` | Driver Service | Trip, Notif |
| Location update | `driver.location.updated` | Driver Service | Trip |

---

## Validation and Measurement

### Performance Test Results (Local Docker)

**Test Setup:** 6 microservices + RabbitMQ on MacBook Pro M1, 16GB RAM

| Metric | Result | Target | Status |
|--------|--------|--------|--------|
| Publish latency | 10-15ms | < 50ms | ✅ Pass |
| End-to-end latency | 50-70ms | < 200ms | ✅ Pass |
| Throughput | 5,000 msg/sec | 1,000 msg/sec | ✅ Pass |
| Memory usage (idle) | 150 MB | < 500 MB | ✅ Pass |
| CPU usage (load) | 15% (single core) | < 50% | ✅ Pass |

**Conclusion:** RabbitMQ **exceeds all performance requirements** for MVP scope.

### Observed Issues During Development

**Problem 1:** Initial Kafka setup crashed due to port 9092 conflict with PostgreSQL container.
- **Solution:** Switched to RabbitMQ, no port conflicts.

**Problem 2:** Kafka broker took 60+ seconds to start, slowing development loops.
- **Solution:** RabbitMQ starts in ~10 seconds.

**Problem 3:** Team members with 8GB RAM laptops couldn't run Kafka + all services.
- **Solution:** RabbitMQ uses 81% less memory, full stack runs smoothly.

---

## Future Considerations

### When to Reconsider Kafka

**Trigger Conditions:**
1. Message throughput > 10,000/sec sustained
2. Need for event replay / audit log is critical
3. Advanced stream processing (windowing, joins)
4. Integration with Kafka ecosystem tools (Kafka Connect, KSQL)

**Migration Path:**
1. Implement event sourcing in PostgreSQL first (proof of concept)
2. Run Kafka and RabbitMQ in parallel (dual-write pattern)
3. Gradually migrate consumers to Kafka
4. Decommission RabbitMQ

**Estimated Effort:** 2-3 weeks for full migration

### Monitoring and Alerting

**Key Metrics to Track:**
- Queue depth (alert if > 1,000 messages)
- Message age (alert if > 5 minutes)
- Consumer lag (alert if > 100 messages behind)
- Error rate (alert if > 1% failed deliveries)

**Tools:**
- RabbitMQ Management UI for real-time monitoring
- Prometheus + Grafana for historical metrics
- AWS CloudWatch alarms (when deployed to AWS)

---

## References

1. [RabbitMQ vs Kafka](https://www.rabbitmq.com/blog/2020/10/27/performance-comparison)
2. [NestJS Microservices Documentation](https://docs.nestjs.com/microservices/basics)
3. [AWS MSK Pricing](https://aws.amazon.com/msk/pricing/)
4. [When NOT to use Kafka](https://medium.com/@robin.phillips/when-not-to-use-kafka-f2f2c3d0b9a5)
5. Module E Requirements: Automation & Cost Optimization (FinOps)

---

## Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| Oct 2025 | 1.0 | Initial decision | Không Huỳnh Ngọc Hân |
| Nov 2025 | 1.1 | Added performance test results | Team |

---

**Decision Status:** ✅ **ACCEPTED**  
**Last Review:** November 2025  
**Next Review:** Q2 2026 (after MVP launch)
