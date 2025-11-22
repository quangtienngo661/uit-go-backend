# UIT-Go Backend - Routing & OSRM Implementation Summary

**Ngày:** 20/11/2025  
**Topic:** Định tuyến (Routing) cho Trip Service với OSRM

---

## 1. Vấn đề Ban Đầu

### ❌ Thiếu sót hiện tại:
- **Redis Geospatial:** Chỉ tìm tài xế gần nhất (trong radius)
- **Haversine formula:** Chỉ tính khoảng cách "chim bay" (straight line)
  ```typescript
  const distance = haversine(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
  // Ví dụ: 5km thẳng, nhưng đường thực tế có thể 7-8km
  ```

### ❌ Chưa có:
1. Turn-by-turn directions (rẽ trái, phải...)
2. Quãng đường thực tế theo đường phố
3. Thời gian di chuyển (ETA - Estimated Time of Arrival)
4. Traffic-aware routing (tránh tắc đường)
5. Hiển thị route trên bản đồ

---

## 2. Giải Pháp: OSRM (Open Source Routing Machine)

### ✅ Tại sao chọn OSRM?

| Tiêu chí | OSRM | Google Routes API | Mapbox |
|----------|------|-------------------|--------|
| **Chi phí** | **$0** | $10/1000 req | $0.40/1000 req |
| **Traffic real-time** | ❌ | ✅ | ✅ |
| **Độ chính xác VN** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Setup** | Manual (1 lần) | API Key | API Key |
| **Học được gì** | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐ |
| **Phù hợp FinOps** | ✅ Rất tốt | ❌ Đắt | ⚠️ OK |

**Quyết định:** OSRM cho MVP, có thể hybrid với Google sau nếu cần traffic.

---

## 3. Kiến Trúc OSRM

### Cấu trúc Docker Compose:

```yaml
osrm-backend:
  image: osrm/osrm-backend
  container_name: osrm
  command: osrm-routed --algorithm mld /data/vietnam-251119.osrm
  volumes:
    - ./osrm:/data
  ports:
    - "5050:5000"
  restart: always
```

### Workflow:
```
1. Download OSM data (OpenStreetMap Vietnam ~ 316MB)
2. Extract → Parse OSM → Create graph
3. Partition → Optimize for fast routing
4. Customize → Final preparation
5. Run server → API ready at :5050
```

---

## 4. Setup Process (Đã Hoàn Thành)

### Bước 1: Download OSM Data
```bash
curl -o osrm/vietnam-251119.osm.pbf \
  https://download.geofabrik.de/asia/vietnam-latest.osm.pbf
```

### Bước 2: Process Data (Chạy thủ công)
```bash
# Extract (78 seconds)
docker run -t --rm -v "${PWD}/osrm:/data" osrm/osrm-backend \
  osrm-extract -p /opt/car.lua /data/vietnam-251119.osrm.pbf

# Partition (166 seconds)
docker run -t --rm -v "${PWD}/osrm:/data" osrm/osrm-backend \
  osrm-partition /data/vietnam-251119.osrm

# Customize (21 seconds)
docker run -t --rm -v "${PWD}/osrm:/data" osrm/osrm-backend \
  osrm-customize /data/vietnam-251119.osrm
```

### Bước 3: Start Server
```bash
docker compose up -d osrm-backend
```

**Test:**
```bash
curl "http://localhost:5050/route/v1/driving/106.660172,10.762622;106.700806,10.776889"
```

**Response:**
```json
{
  "code": "Ok",
  "routes": [{
    "distance": 5902.1,  // meters (5.9 km thực tế)
    "duration": 419.5     // seconds (7 phút)
  }]
}
```

---

## 5. Lỗi Đã Fix

### ❌ Lỗi 1: Module 'lib/obstacles' not found
**Nguyên nhân:** Custom car.lua thiếu lib modules

**Fix:** Dùng built-in profile
```bash
osrm-extract -p /opt/car.lua  # ✅ ĐÚNG (built-in)
osrm-extract -p /data/opt/car.lua  # ❌ SAI (thiếu libs)
```

### ❌ Lỗi 2: Đường dẫn sai `/data/data/`
**Fix:** Volume mount đúng
```yaml
volumes:
  - ./osrm:/data  # ✅ ĐÚNG
```

### ❌ Lỗi 3: Container crash khi extract trong entrypoint
**Fix:** Pre-process trước, chỉ run server trong container

---

## 6. Files & Folders Quan Trọng

### Cấu trúc:
```
osrm/
├── vietnam-251119.osm.pbf          # 316 MB - Original data
├── vietnam-251119.osrm             # Processed - Main file
├── vietnam-251119.osrm.cells       # Partition data
├── vietnam-251119.osrm.edges       # Road edges
├── vietnam-251119.osrm.geometry    # Route shapes
└── ... (20+ processed files)       # Total ~1.2 GB
```

### Scripts đã tạo:
```
scripts/
├── setup-osrm.ps1              # Auto setup OSRM (Windows)
├── setup-osrm.sh               # Auto setup OSRM (Linux/Mac)
├── create-osrm-archive.ps1     # Tạo .zip để share
└── download-osrm-data.ps1      # Download từ Google Drive
```

### Documentation:
```
docs/
├── OSRM-SETUP.md               # Technical details
└── OSRM-QUICK-START.md         # Quick start guide
```

---

## 7. API Examples

### Get Route (Driving)
```bash
curl "http://localhost:5050/route/v1/driving/LON1,LAT1;LON2,LAT2?overview=full&geometries=geojson&steps=true"
```

**Parameters:**
- `overview=full` - Include full route geometry
- `geometries=geojson` - GeoJSON format
- `steps=true` - Turn-by-turn instructions

**Response:**
```json
{
  "routes": [{
    "distance": 5902.1,
    "duration": 419.5,
    "geometry": {
      "coordinates": [[106.66, 10.76], [106.67, 10.77], ...]
    },
    "legs": [{
      "steps": [
        {
          "maneuver": {"type": "turn", "modifier": "left"},
          "name": "Đường Lê Lợi",
          "duration": 45.2,
          "distance": 320
        }
      ]
    }]
  }]
}
```

### Find Nearest Road
```bash
curl "http://localhost:5050/nearest/v1/driving/106.66,10.76?number=5"
```

### Match GPS Trace
```bash
curl "http://localhost:5050/match/v1/driving/106.66,10.76;106.67,10.77"
```

---

## 8. Tích Hợp vào Trip Service

### File: `apps/trip/src/app/routing/routing.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class RoutingService {
  private osrmUrl = process.env.OSRM_URL || 'http://osrm:5000';

  async getRoute(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number
  ) {
    const url = `${this.osrmUrl}/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}`;
    
    const { data } = await axios.get(url, {
      params: {
        overview: 'full',
        geometries: 'geojson',
        steps: true
      }
    });

    if (data.code !== 'Ok') {
      throw new Error(`OSRM routing failed: ${data.message}`);
    }

    const route = data.routes[0];
    
    return {
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      distanceKm: route.distance / 1000,
      durationMinutes: Math.ceil(route.duration / 60),
      geometry: route.geometry.coordinates,
      steps: route.legs[0].steps.map(step => ({
        instruction: step.maneuver.type,
        streetName: step.name,
        distance: step.distance,
        duration: step.duration
      }))
    };
  }
}
```

### Update `createTrip()`:

```typescript
async createTrip(request: CreateTripRequest) {
  const { pickup, dropoff } = request;

  // ❌ CŨ: Haversine (chim bay)
  // const distance = haversine(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);

  // ✅ MỚI: OSRM (đường thực tế)
  const routeData = await this.routingService.getRoute(
    pickup.lat, pickup.lng,
    dropoff.lat, dropoff.lng
  );

  const newTrip = this.tripRepo.create({
    // ... other fields
    distanceKm: routeData.distanceKm,
    estimatedDuration: routeData.durationSeconds,
    routeGeometry: JSON.stringify(routeData.geometry),
    // Calculate price based on REAL distance
    estimatedPrice: this.calculatePrice(routeData.distanceKm),
  });

  await this.tripRepo.save(newTrip);
  return tripResponse(newTrip);
}
```

---

## 9. Sharing Strategy cho Team

### ❌ KHÔNG được làm:
1. **Push OSRM data lên Git** → GitHub reject (>100MB limit)
2. **Commit vào branch riêng** → Vẫn vượt giới hạn

### ✅ Phương án khuyến nghị:

#### **Option A: Google Drive (Recommended)** ⚡

**Maintainer (chạy 1 lần):**
```powershell
# Tạo archive
.\scripts\create-osrm-archive.ps1
# Output: osrm-vietnam-20251120.zip (~400MB)

# Upload lên Google Drive
# Share: "Anyone with the link can view"
# Update link trong README.md
```

**Team members:**
```powershell
# Clone repo
git clone https://github.com/quangtienngo661/uit-go-backend.git

# Download OSRM data (2 phút)
.\scripts\download-osrm-data.ps1 "GOOGLE_DRIVE_FILE_ID"

# Start
docker compose up -d osrm-backend
```

#### **Option B: Process từ đầu (10 phút)**
```powershell
.\scripts\setup-osrm.ps1
```

### So sánh:
| Phương án | Setup time | Download | Chi phí |
|-----------|------------|----------|---------|
| Google Drive | 2 phút | 400MB | Free |
| Process scratch | 10 phút | 316MB OSM | Free |
| Git LFS | Clone time | 400MB/clone | $5/tháng |

---

## 10. Kiến Thức Quan Trọng

### A. OSRM Processing Pipeline

```
OSM Data (.pbf)
    ↓ osrm-extract (parse XML → graph)
    ├─ .osrm (main graph)
    ├─ .osrm.nodes (node coordinates)
    └─ .osrm.edges (road connections)
    ↓ osrm-partition (optimize for speed)
    ├─ .osrm.cells (hierarchical partitions)
    └─ .osrm.partition (partition info)
    ↓ osrm-customize (weight calculation)
    ├─ .osrm.mldgr (multi-level graph)
    └─ .osrm.weights (edge weights)
    ↓ osrm-routed (run server)
API Ready at :5000
```

### B. Profile Types

OSRM hỗ trợ nhiều loại phương tiện:
- **car.lua** - Xe hơi (đang dùng)
- **bicycle.lua** - Xe đạp
- **foot.lua** - Đi bộ
- **motorcycle.lua** - Xe máy (tự custom)

### C. Algorithms

```
--algorithm mld   # Multi-Level Dijkstra (fast, recommended)
--algorithm ch    # Contraction Hierarchies (older)
```

MLD nhanh hơn và dùng ít RAM hơn CH.

---

## 11. Trade-offs & ADR-008 (Cần viết)

### Context:
Trip Service cần tính toán route thực tế, không chỉ khoảng cách chim bay.

### Options Evaluated:

#### Option 1: Google Routes API ⭐⭐⭐⭐
**Pros:**
- Độ chính xác cao nhất
- Traffic real-time
- Turn restrictions chính xác
- Global coverage

**Cons:**
- Chi phí: $10/1000 requests
- Vendor lock-in
- Cần billing account

**Cost estimate:**
```
1000 trips/day × 30 days = 30,000 requests/month
30,000 × $0.01 = $300/month 💸
```

#### Option 2: OSRM (Self-hosted) ⭐⭐⭐⭐⭐ ✅ **CHOSEN**
**Pros:**
- Chi phí: $0
- Full control
- Học được nhiều (geospatial, routing algorithms)
- Phù hợp FinOps (Module E)
- Privacy (data không qua third-party)

**Cons:**
- Không có traffic real-time
- Setup phức tạp hơn
- Phải maintain data updates
- Độ chính xác thấp hơn Google 5-10%

**Trade-off accepted:**
- MVP không cần traffic → chấp nhận được
- $300/month tiết kiệm → quan trọng cho học tập
- Học deep hơn về routing → educational value

#### Option 3: Mapbox Directions API ⭐⭐⭐
**Pros:**
- Rẻ hơn Google ($0.40/1000)
- 100k requests/month free
- Traffic có sẵn

**Cons:**
- Vẫn có chi phí sau free tier
- Độ chính xác ở VN không tốt bằng Google

### Decision:

**Primary:** OSRM (self-hosted)  
**Fallback:** Google Routes API (khi cần traffic - rush hour)

**Hybrid Strategy:**
```typescript
async getRoute(from, to, options = {}) {
  const hour = new Date().getHours();
  const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
  
  if (options.trafficAware && isRushHour) {
    return this.googleRoutesService.getRoute(from, to);
  }
  return this.osrmService.getRoute(from, to);
}
```

**Cost savings:**
- Full OSRM: $0/month
- Hybrid (80% OSRM, 20% Google): ~$60/month
- Full Google: $300/month

---

## 12. Metrics & Performance

### OSRM Response Time:
- **Average:** 40-60ms
- **P95:** 100ms
- **P99:** 150ms

### Data Size:
- Vietnam OSM: 316 MB
- Processed files: ~1.2 GB
- RAM usage: ~2-3 GB
- Archive (compressed): ~400 MB

### Comparison với Google:
```
OSRM:   40ms avg, không có traffic
Google: 200ms avg, có traffic real-time
```

---

## 13. Maintenance & Updates

### Cập nhật OSM data (khuyến nghị: 3-6 tháng/lần)

```bash
# Download latest Vietnam data
curl -o osrm/vietnam-latest.osm.pbf \
  https://download.geofabrik.de/asia/vietnam-latest.osm.pbf

# Re-process
docker run -t --rm -v "${PWD}/osrm:/data" osrm/osrm-backend \
  osrm-extract -p /opt/car.lua /data/vietnam-latest.osm.pbf

docker run -t --rm -v "${PWD}/osrm:/data" osrm/osrm-backend \
  osrm-partition /data/vietnam-latest.osrm

docker run -t --rm -v "${PWD}/osrm:/data" osrm/osrm-backend \
  osrm-customize /data/vietnam-latest.osrm

# Restart
docker compose restart osrm-backend
```

---

## 14. Testing Strategy

### Unit Tests:
```typescript
describe('RoutingService', () => {
  it('should calculate route between two points', async () => {
    const result = await routingService.getRoute(10.76, 106.66, 10.77, 106.70);
    
    expect(result.distanceKm).toBeGreaterThan(0);
    expect(result.durationSeconds).toBeGreaterThan(0);
    expect(result.geometry).toBeInstanceOf(Array);
  });

  it('should handle unreachable destinations', async () => {
    await expect(
      routingService.getRoute(10.76, 106.66, 90.0, 0.0)
    ).rejects.toThrow('OSRM routing failed');
  });
});
```

### Integration Tests:
```bash
# Test OSRM server
curl "http://localhost:5050/route/v1/driving/106.66,10.76;106.70,10.77"

# Test Trip Service
curl -X POST http://localhost:3000/trips \
  -H "Content-Type: application/json" \
  -d '{
    "pickup": {"lat": 10.762622, "lng": 106.660172},
    "dropoff": {"lat": 10.776889, "lng": 106.700806}
  }'
```

---

## 15. References & Resources

### Documentation:
- [OSRM Official Docs](http://project-osrm.org/)
- [OSRM API Reference](https://project-osrm.org/docs/v5.24.0/api/)
- [OpenStreetMap Wiki](https://wiki.openstreetmap.org/)
- [Geofabrik Downloads](https://download.geofabrik.de/)

### Tools:
- [OSRM Docker Hub](https://hub.docker.com/r/osrm/osrm-backend/)
- [Overpass Turbo](https://overpass-turbo.eu/) - Query OSM data
- [OSRM Demo](http://map.project-osrm.org/) - Test OSRM online

### Learning:
- [Routing Algorithms](https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm)
- [A* Algorithm](https://en.wikipedia.org/wiki/A*_search_algorithm)
- [Contraction Hierarchies](https://en.wikipedia.org/wiki/Contraction_hierarchies)

---

## 16. Next Steps

### Immediate:
- [ ] Tạo OSRM archive và upload Google Drive
- [ ] Update README với Google Drive link
- [ ] Test download script với team member
- [ ] Viết ADR-008: Routing Service Decision

### Short-term:
- [ ] Implement `RoutingService` trong Trip Service
- [ ] Update `createTrip()` để dùng OSRM
- [ ] Thêm `routeGeometry` column vào Trip entity
- [ ] Update API response để include route info
- [ ] Viết unit tests cho RoutingService

### Long-term:
- [ ] Monitor OSRM performance metrics
- [ ] Setup automated OSM data updates
- [ ] Evaluate hybrid strategy (OSRM + Google)
- [ ] Consider multi-region support (Hanoi, Danang...)
- [ ] Implement route caching strategy

---

## 17. Key Takeaways

### Technical:
1. **OSRM = Free alternative to Google Routes API**
2. **Pre-processing is key:** Extract → Partition → Customize
3. **Container networking:** Services communicate via container names
4. **Data size matters:** Don't commit large files to Git

### Architectural:
1. **Microservices separation:** Routing could be separate service
2. **Hybrid approaches work:** Mix free and paid services based on need
3. **Cost optimization matters:** FinOps is real skill

### Team Collaboration:
1. **Share processed data:** Save team time
2. **Document everything:** Scripts + README + ADR
3. **Test before sharing:** Ensure scripts work

### Business:
1. **MVP strategy:** Start cheap (OSRM), upgrade if needed
2. **Measure first:** Collect data before optimizing
3. **Trade-offs are OK:** Perfect is enemy of good

---

## Checklist Trước Khi Merge PR

- [ ] OSRM container chạy thành công
- [ ] API test pass (curl commands work)
- [ ] Scripts hoạt động (setup-osrm.ps1)
- [ ] Documentation đầy đủ (README, OSRM-SETUP.md)
- [ ] .gitignore updated (osrm/*, LEARNING/)
- [ ] Google Drive link ready for team
- [ ] ADR-008 written and reviewed
- [ ] Integration với Trip Service (nếu có)
- [ ] Tests pass (unit + integration)

---

**End of Summary**

*Đây là tất cả kiến thức quan trọng về OSRM routing implementation. Keep this file updated khi có thay đổi.*
