# Architectural Decision Records (ADR)

This directory contains the Architectural Decision Records for the UIT-Go backend system. Each ADR documents a significant architectural decision, the context, alternatives considered, and trade-offs made.

---

## What is an ADR?

An **Architectural Decision Record (ADR)** is a document that captures an important architectural decision made along with its context and consequences. ADRs help teams:

- 📝 **Document why** decisions were made (not just what)
- 🔄 **Track evolution** of architecture over time
- 🎓 **Onboard new members** by explaining rationale
- ⚖️ **Justify trade-offs** to stakeholders
- 🔮 **Review decisions** when context changes

---

## ADR Index

| ADR | Title | Status | Date | Key Trade-off |
|-----|-------|--------|------|---------------|
| [ADR-001](./ADR-001-rabbitmq-over-kafka.md) | RabbitMQ over Kafka | ✅ Accepted | Oct 2025 | Cost savings ($120/mo) vs Event replay capability |
| [ADR-002](./ADR-002-redis-geospatial-driver-location.md) | Redis Geospatial for Driver Location | ✅ Accepted | Oct 2025 | Speed (5ms queries) vs Persistence (in-memory only) |
| [ADR-003](./ADR-003-grpc-internal-communication.md) | gRPC for Trip-Driver Communication | ✅ Accepted | Oct 2025 | Performance (60% faster) vs Complexity (proto gen) |
| [ADR-004](./ADR-004-supabase-authentication.md) | Supabase BaaS for Authentication | ✅ Accepted | Sep 2025 | Security & Speed vs External dependency |
| [ADR-005](./ADR-005-database-per-service.md) | Database Per Service Pattern | ✅ Accepted | Sep 2025 | Service independence vs Distributed complexity |
| [ADR-006](./ADR-006-nx-monorepo.md) | Nx Monorepo Structure | ✅ Accepted | Sep 2025 | Code sharing & Build speed vs Repo size |
| [ADR-007](./ADR-007-terraform-finops-automation.md) | Terraform-Based FinOps Automation | ✅ Accepted | Nov 2025 | Proactive cost control vs CI/CD complexity |

---

## Decision Status

- ✅ **Accepted**: Decision is implemented and active
- 🔄 **Proposed**: Under discussion, not yet decided
- ⚠️ **Deprecated**: No longer recommended, superseded by another ADR
- ❌ **Rejected**: Considered but not adopted

---

## Module E: Cost Optimization Context

All ADRs are evaluated through the lens of **Module E: Automation & Cost Optimization (FinOps)**. Key principles:

1. **Cost-Conscious**: Every decision considers AWS operational costs
2. **Performance vs Cost**: Balance user experience with financial efficiency
3. **Measured Trade-offs**: Quantify what's gained and lost
4. **Pragmatic Choices**: Choose "good enough" over "perfect" when cost-effective

---

## Key Themes Across ADRs

### 🧩 Theme 1: Pragmatic Technology Choices

**Pattern**: Choose simpler, cheaper technology unless performance demands otherwise.

- **RabbitMQ over Kafka**: Simpler message broker adequate for MVP scale
- **Redis Geo over PostGIS**: Speed-first for critical UX path
- **Nx Monorepo**: Developer velocity over "true" microservice separation

**Lesson**: Industry "best practices" aren't always best for your context.

### ⚡ Theme 2: Optimize Critical Paths Only

**Pattern**: Use expensive/complex solutions only where they provide clear user value.

- **gRPC**: ONLY for Trip ↔ Driver (latency-sensitive)
- **REST**: For everything else (simplicity wins)
- **Redis Geo**: ONLY for real-time location queries
- **PostgreSQL**: For persistent data storage

**Lesson**: Performance optimization has diminishing returns. Optimize where users feel it.

### 💰 Theme 3: Cost as a First-Class Concern

**Pattern**: Quantify monthly AWS costs in every decision.

| Decision | Cost Impact | Annual Savings |
|----------|-------------|----------------|
| RabbitMQ vs Kafka | -$120/mo | $1,440/year |
| Redis vs PostGIS | -$33/mo | $396/year |
| Single NAT Gateway | -$60/mo | $720/year |
| **Total** | | **$2,556/year** |

**Lesson**: Small optimizations compound. A $10/mo saving is $120/year.

---

## How to Use These ADRs

### For New Team Members

1. Read ADRs in order (001 → 006) to understand system evolution
2. Focus on "Decision Outcome" and "Rationale" sections
3. Review "Trade-offs Accepted" to understand known limitations

### For Architecture Reviews

1. Check "Status" (is this still accepted?)
2. Review "Next Review" trigger conditions
3. Validate assumptions still hold (e.g., user scale, costs)

### When Adding New ADRs

Use this template structure:

```markdown
# ADR-XXX: [Title]

**Status:** Proposed / Accepted / Deprecated  
**Date:** [Month Year]  
**Decision Makers:** [Names]  

## Context
[Problem statement, requirements]

## Decision Drivers
[What factors influenced the decision]

## Considered Options
### Option 1: [Name]
**Pros:** ...
**Cons:** ...

### Option 2: [Name] (CHOSEN)
**Pros:** ...
**Cons:** ...

## Decision Outcome
[Chosen option and rationale]

### Trade-offs Accepted
[What was sacrificed, why it's acceptable]

## Implementation
[How to implement, code examples]

## Validation
[How to verify the decision works]

## References
[Sources, documentation]
```

---

## Changelog

| Date | ADR | Change | Author |
|------|-----|--------|--------|
| Nov 2025 | ADR-001 | Added performance test results | Team |
| Oct 2025 | ADR-003 | Documented gRPC setup challenges | Tiến |
| Oct 2025 | All | Initial creation | Hân |

---

## Contact

For questions about these decisions, contact:

- **Architecture Lead**: Không Huỳnh Ngọc Hân (23520427@gm.uit.edu.vn)
- **Technical Lead**: Ngô Quang Tiến
- **Course**: SE360 - Cloud-Native System Architecture, UIT

---

**Last Updated:** November 2025  
**Total ADRs:** 6  
**Estimated Cost Savings (from ADRs):** $2,556/year
