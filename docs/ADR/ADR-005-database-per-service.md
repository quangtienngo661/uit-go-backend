# ADR-005: Database Per Service Pattern

**Status:** Accepted  
**Date:** September 2025  
**Decision Makers:** Ngô Quang Tiến, Team  

---

## Context

In a microservices architecture, we must decide how services access data:
1. **Shared database**: All services connect to one database
2. **Database per service**: Each service has its own isolated database

Our system has 6 services: API Gateway, Auth, User, Trip, Driver, Notification.

---

## Decision Drivers

1. **Service Independence**: Services should deploy/scale independently
2. **Fault Isolation**: Database failure shouldn't cascade
3. **Technology Freedom**: Each service can choose optimal DB
4. **Data Consistency**: Trade-offs between strong and eventual consistency
5. **Development Complexity**: Multiple databases = more operational overhead

---

## Considered Options

### Option 1: Shared PostgreSQL Database
**Pros:**
- ✅ Simple: One connection string
- ✅ Strong ACID transactions across tables
- ✅ Easy joins between user/trip/driver data
- ✅ Lower infrastructure cost (1 DB instance)

**Cons:**
- ❌ **Tight coupling**: Schema change in one service affects others
- ❌ **Single point of failure**: DB down = all services down
- ❌ **Scaling bottleneck**: Cannot scale services independently
- ❌ **Deployment risk**: Migration breaks multiple services
- ❌ **No technology diversity**: Stuck with PostgreSQL for all use cases

### Option 2: Database Per Service (CHOSEN)
**Pros:**
- ✅ **Service independence**: Deploy, scale, fail independently
- ✅ **Technology freedom**: User (PostgreSQL), Driver (PostgreSQL + Redis), Future (MongoDB)
- ✅ **Fault isolation**: Driver DB crash doesn't affect User Service
- ✅ **Parallel development**: Teams don't block each other on schema changes
- ✅ **Clear ownership**: Each team owns their data

**Cons:**
- ❌ **No joins**: Cannot SELECT across services in SQL
- ❌ **Eventual consistency**: Data sync via events (not immediate)
- ❌ **More infrastructure**: 3 PostgreSQL instances + Redis
- ❌ **Distributed transactions**: Complex to coordinate (we avoid this)

---

## Decision Outcome

**Chosen:** **Database Per Service** (Option 2)

### Rationale

1. **True Microservices:**
   - A core tenet of microservices is **independent deployability**
   - Shared database violates this principle (creates hidden coupling)

2. **Fault Isolation (Reliability):**
   - Scenario: Trip DB crashes during high load
   - **With shared DB**: Entire platform down (User, Driver services also fail)
   - **With separate DBs**: Only Trip Service affected, rest of platform operational

3. **Technology Fit:**
   - **User Service**: Relational data (users, profiles) → PostgreSQL ✅
   - **Trip Service**: Transactional trips + ratings → PostgreSQL ✅
   - **Driver Service**: Real-time locations → PostgreSQL (persistent) + **Redis Geospatial** (fast queries) ✅
   - Future: Analytics on trips → Could add MongoDB or Elasticsearch without affecting others

4. **Scalability:**
   - **User DB**: Read-heavy (profiles, verification) → Can add read replicas
   - **Trip DB**: Write-heavy (trip status updates) → Can scale writes independently
   - **Driver DB**: Extreme read load (location queries) → Redis handles this

5. **Team Ownership:**
   - Clear boundaries: Hân owns User/Auth DB, Tiến owns Trip/Driver DB, Duy owns nothing (stateless notification)
   - No merge conflicts on migration files

---

## Implementation

### Database Allocation

| Service | Database | Port | Purpose | Size (Estimate) |
|---------|----------|------|---------|-----------------|
| User | user-db | 5433 | Users, driver profiles | 1 GB (10K users) |
| Trip | trip-db | 5434 | Trips, ratings | 5 GB (100K trips) |
| Driver | driver-db | 5435 | Driver data (persistent) | 500 MB |
| Driver | redis | 6379 | Real-time locations | 600 KB (10K drivers) |

**Docker Compose:**
```yaml
services:
  user-db:
    image: postgres:17
    ports: ["5433:5432"]
    environment:
      POSTGRES_USER: userdb_admin
      POSTGRES_DB: userdb
    volumes:
      - userdb_data:/var/lib/postgresql/data
  
  trip-db:
    image: postgres:17
    ports: ["5434:5432"]
    # ... (similar configuration)
  
  driver-db:
    image: postgres:17
    ports: ["5435:5432"]
    # ...
```

### Data Consistency Strategy

**Strong Consistency (Within Service):**
```sql
-- Trip Service: ACID transaction
BEGIN;
  INSERT INTO trip (...) VALUES (...);
  UPDATE driver_stats SET total_trips = total_trips + 1;
COMMIT;
```

**Eventual Consistency (Across Services):**
```
Trip created → RabbitMQ event: trip.created
              ↓
User Service consumes → Update user trip count (eventually)
Driver Service consumes → Find nearby drivers
Notification Service → Send email
```

**Important:** We accept **eventual consistency** across services. Example:
- Trip completed at 10:00:00
- User Service updates total trips at 10:00:02 (2-second delay)
- **This is acceptable** for our use case

---

## Handling Cross-Service Queries

**Problem:** "Show user profile with their last 5 trips"

**Anti-Pattern (DON'T DO):**
```typescript
// ❌ BAD: User Service querying Trip DB directly
const user = await userDb.findOne(userId);
const trips = await tripDb.find({ userId });  // WRONG!
```

**Correct Patterns:**

**Option A: API Composition (Aggregation at API Gateway)**
```typescript
// API Gateway
async getUserWithTrips(userId) {
  const [user, trips] = await Promise.all([
    this.userService.getUser(userId),      // Calls User Service
    this.tripService.getUserTrips(userId)   // Calls Trip Service
  ]);
  return { ...user, recentTrips: trips };
}
```

**Option B: Data Replication (Denormalization)**
```typescript
// User Service maintains a cache of recent trips
@MessagePattern('trip.completed')
async handleTripCompleted(event: TripCompletedEvent) {
  await this.userDb.update(event.userId, {
    $push: { recentTrips: { id: event.tripId, fare: event.fare } }
  });
}
```

We use **Option A** primarily (simpler, no stale data issues).

---

## Migration Management

**Per-Service Migrations:**
```bash
# User Service migrations
apps/user/src/migrations/
  ├── 1699123456789-CreateUserTable.ts
  └── 1699234567890-AddDriverProfile.ts

# Trip Service migrations
apps/trip/src/migrations/
  ├── 1699123456789-CreateTripTable.ts
  └── 1699234567890-AddRatingTable.ts

# Commands
npm run migration:run:user
npm run migration:run:trip
npm run migration:run:driver
npm run migration:run:all  # All at once
```

**Key Practice:** Each service owns its migrations. No cross-DB migrations.

---

## Trade-offs Accepted

| Challenge | Impact | Our Solution |
|-----------|--------|--------------|
| No SQL joins | Cannot JOIN user + trip in one query | API composition at Gateway |
| Eventual consistency | Data briefly out of sync | Acceptable for our use cases |
| More infrastructure | 3 DB instances vs 1 | Docker Compose makes this easy locally; AWS RDS handles production |
| Distributed transactions | Complex 2PC/saga patterns | **We avoid distributed transactions entirely** (design services to not need them) |

**Example of Avoiding Distributed Transactions:**

**Bad Design:**
```
Transfer credits from User A to User B:
  BEGIN TRANSACTION (User DB)
    Deduct from A
    Add to B
  COMMIT
```
This requires a distributed transaction across two service DBs.

**Good Design:**
- Use a **Wallet Service** with its own DB
- Credits belong to Wallet Service, not User Service
- Wallet Service handles transactions in **one DB** (strong ACID)

---

## Validation

**Deployment Test:**
- Killed Trip DB container (`docker stop trip-db`)
- **Result:**
  - ✅ User Service still responsive (login, profile updates work)
  - ✅ Driver Service still responsive (location updates work)
  - ❌ Trip Service failed (expected)
- **Conclusion:** Fault isolation verified ✅

**Migration Test:**
- Added column to Trip Service schema
- **Result:**
  - ✅ User/Driver services unaffected
  - ✅ No merge conflicts
  - ✅ Deployed Trip Service independently
- **Conclusion:** Independent deployability verified ✅

---

## Future Considerations

### When Scale Demands It

**Read Replicas (User Service):**
```
User Service ──write──▶ user-db-primary
              ──read──▶ user-db-replica-1 (read-only)
              ──read──▶ user-db-replica-2 (read-only)
```

**Sharding (Trip Service):**
```
Trips by region:
- trip-db-hcmc (Ho Chi Minh City trips)
- trip-db-hanoi (Hanoi trips)
```

**Technology Diversity:**
```
Current: All PostgreSQL
Future:
- User Service: PostgreSQL (relational data)
- Trip Service: PostgreSQL (transactions) + Elasticsearch (search/analytics)
- Driver Service: PostgreSQL + Redis + MongoDB (location history)
```

---

## References

1. [Microservices Patterns - Database per Service](https://microservices.io/patterns/data/database-per-service.html)
2. [Martin Fowler - Microservice Trade-Offs](https://martinfowler.com/articles/microservice-trade-offs.html)
3. [Saga Pattern for Distributed Transactions](https://microservices.io/patterns/data/saga.html)

---

**Status:** ✅ ACCEPTED  
**Databases:** 3x PostgreSQL + 1x Redis  
**Total DB Cost (AWS RDS):** ~$45/month (3x db.t4g.micro)  
**Next Review:** When adding new service
