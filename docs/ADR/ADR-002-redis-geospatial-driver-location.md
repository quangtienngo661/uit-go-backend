# ADR-002: Redis Geospatial for Driver Location Tracking

**Status:** Accepted  
**Date:** October 2025  
**Decision Makers:** Ngô Quang Tiến, Không Huỳnh Ngọc Hân  
**Module Context:** Module E - Cost Optimization

---

## Context

The Driver Service needs to store and query real-time driver locations to match passengers with nearby available drivers. The system must support:
- **Sub-second query latency** (< 50ms) for proximity search
- **Frequent location updates** (~1000 drivers × 30 sec intervals = ~33 updates/sec)
- **Radius search** (find all drivers within X km of passenger location)
- **Cost-effective storage** (Module E requirement)

---

## Decision Drivers

1. **Query Performance**: User experience demands instant driver search
2. **Cost**: In-memory vs persistent storage trade-offs
3. **Scalability**: Handle 10K+ concurrent drivers (future)
4. **Development Simplicity**: Easy to implement and debug
5. **AWS Deployment Cost**: Elasticache vs RDS pricing

---

## Considered Options

### Option 1: PostGIS (PostgreSQL Extension)
**Pros:**
- ✅ Persistent storage (no data loss on restart)
- ✅ Complex spatial queries (polygons, routing)
- ✅ SQL familiarity
- ✅ Historical location tracking built-in

**Cons:**
- ❌ **Slower queries**: 50-100ms average for radius search
- ❌ Requires spatial indexes (maintenance overhead)
- ❌ Higher AWS cost: db.t4g.medium ~$45/mo
- ❌ Complex setup (extensions, optimizations)

### Option 2: Redis Geospatial (CHOSEN)
**Pros:**
- ✅ **⚡ Ultra-fast queries**: < 5ms for GEO RADIUS
- ✅ Simple API (`GEOADD`, `GEORADIUS`, `GEOPOS`)
- ✅ Low cost: cache.t4g.micro ~$12/mo on AWS
- ✅ Easy container deployment
- ✅ Built-in Haversine distance calculation

**Cons:**
- ❌ **In-memory only**: Data lost on restart (mitigated by RabbitMQ events)
- ❌ No historical queries (only current locations)
- ❌ Limited to 2D coordinates (not an issue for us)

### Option 3: DynamoDB with Geohashing
**Pros:**
- ✅ Fully managed, serverless
- ✅ Pay-per-request pricing

**Cons:**
- ❌ Complex geohash implementation required
- ❌ Higher latency than Redis (~20-50ms)
- ❌ **Vendor lock-in** (AWS-specific)

---

## Decision Outcome

**Chosen:** **Redis Geospatial** (Option 2)

### Rationale

1. **Speed-First for UX:**
   - Ride-sharing apps need **instant** driver results
   - 5ms vs 50ms is **10x faster** - directly impacts user satisfaction
   - Measured locally: **GEORADIUS in 3-4ms** for 10K drivers

2. **Cost Savings:**
   - **$33/month saved** vs PostGIS RDS ($12 vs $45)
   - **73% cost reduction** aligns with Module E

3. **Simplicity:**
   - Single Redis command: `GEORADIUS drivers:available 106.6297 10.8231 5 km`
   - No need for spatial indexes, query optimization

4. **Scalability:**
   - Memory footprint: ~60 bytes per driver
   - **10K drivers = ~600 KB** (easily fits in cache.t4g.micro 512 MB)

### Trade-off Accepted

| Lost | Impact | Mitigation |
|------|--------|------------|
| Persistence | Locations lost on Redis restart | Drivers re-send location on reconnect (~30 sec) |
| Historical data | Cannot query "where was driver at 3pm yesterday" | Store location events in PostgreSQL via RabbitMQ |
| Complex queries | No polygon search, routing | Not needed for MVP |

---

## Implementation

```typescript
// Add driver location
await redis.geoadd('drivers:available', longitude, latitude, driverId);

// Find nearby drivers (5km radius)
const nearby = await redis.georadius(
  'drivers:available',
  passengerLng,
  passengerLat,
  5,
  'km',
  'WITHDIST',
  'ASC',
  'COUNT',
  10
);

// Remove offline driver
await redis.zrem('drivers:available', driverId);
```

---

## Validation

**Performance Test (Local):**
- Dataset: 10,000 drivers in Ho Chi Minh City area
- Query: Find drivers within 5km radius
- **Result: 3.8ms average** (100 queries)
- **Target met**: < 50ms ✅

---

## References

1. [Redis Geospatial Commands](https://redis.io/commands/geoadd/)
2. [PostGIS vs Redis Performance](https://blog.geomusings.com/2017/07/06/redis-geospatial/)
3. AWS Elasticache Pricing

---

**Status:** ✅ ACCEPTED  
**Next Review:** When driver count > 50K
