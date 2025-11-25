# OSRM Setup for UIT-Go

This document explains how to set up OSRM (Open Source Routing Machine) for the UIT-Go project.

## Why OSRM?

OSRM provides **real route calculation** based on actual road networks, unlike simple Haversine distance calculation. It's used to:
- Calculate actual driving distance (not "as the crow flies")
- Estimate driving duration
- Provide turn-by-turn directions
- Find optimal routes

## Quick Start

### Automated Setup (Recommended)

**Windows:**
```powershell
.\scripts\setup-osrm.ps1
```

**Linux/Mac:**
```bash
chmod +x scripts/setup-osrm.sh
./scripts/setup-osrm.sh
```

### Manual Setup

#### Step 1: Download Vietnam Map Data

Download the Vietnam OSM data file (~316 MB):

```bash
# Create osrm directory
mkdir -p osrm

# Download Vietnam map data
curl -o osrm/vietnam-251119.osm.pbf https://download.geofabrik.de/asia/vietnam-latest.osm.pbf
```

Or download manually from: https://download.geofabrik.de/asia/vietnam.html

#### Step 2: Process OSM Data

This step takes ~5-10 minutes and only needs to be done once:

```bash
# Extract (parse OSM data)
docker run -t --rm -v "${PWD}/osrm:/data" osrm/osrm-backend \
  osrm-extract -p /opt/car.lua /data/vietnam-251119.osm.pbf

# Partition (prepare for fast routing)
docker run -t --rm -v "${PWD}/osrm:/data" osrm/osrm-backend \
  osrm-partition /data/vietnam-251119.osrm

# Customize (optimize for routing)
docker run -t --rm -v "${PWD}/osrm:/data" osrm/osrm-backend \
  osrm-customize /data/vietnam-251119.osrm
```

#### Step 3: Start OSRM Server

```bash
docker compose up -d osrm-backend
```

## Verify Installation

Test the OSRM API with a sample route (District 1 to District 7, Saigon):

```bash
curl "http://localhost:5050/route/v1/driving/106.660172,10.762622;106.700806,10.776889?overview=false"
```

Expected response:
```json
{
  "code": "Ok",
  "routes": [{
    "distance": 5902.1,
    "duration": 419.5
  }]
}
```

## Folder Structure

After setup, your `osrm/` directory will contain:

```
osrm/
├── vietnam-251119.osm.pbf          # Original map data (316 MB)
├── vietnam-251119.osrm             # Processed routing data
├── vietnam-251119.osrm.cells       
├── vietnam-251119.osrm.edges       
├── vietnam-251119.osrm.geometry    
└── ... (other processed files)
```

**Note:** The `osrm/` folder is ignored by git (see `.gitignore`) to avoid committing large files.

## API Examples

### Get Route

```bash
curl "http://localhost:5050/route/v1/driving/LON1,LAT1;LON2,LAT2?overview=full&geometries=geojson"
```

Parameters:
- `overview=full` - Include route geometry
- `geometries=geojson` - Return coordinates as GeoJSON
- `steps=true` - Include turn-by-turn instructions

### Find Nearest Road

```bash
curl "http://localhost:5050/nearest/v1/driving/106.660172,10.762622"
```

### Match GPS Trace

```bash
curl "http://localhost:5050/match/v1/driving/106.66,10.76;106.67,10.77?overview=full"
```

## Integration with Trip Service

Example usage in TypeScript:

```typescript
// apps/trip/src/app/routing/routing.service.ts
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

    return {
      distanceMeters: data.routes[0].distance,
      durationSeconds: data.routes[0].duration,
      geometry: data.routes[0].geometry.coordinates,
      steps: data.routes[0].legs[0].steps
    };
  }
}
```

## Troubleshooting

### OSRM container won't start

1. Check if data is processed:
   ```bash
   ls -lh osrm/
   ```
   You should see `vietnam-251119.osrm` file.

2. Check Docker logs:
   ```bash
   docker logs osrm
   ```

### "Module 'lib/obstacles' not found" error

This means you're using a custom car.lua without the required libraries. Use the built-in profile:
```bash
osrm-extract -p /opt/car.lua /data/vietnam-251119.osm.pbf
```

### Re-process data

If you need to start over:
```bash
# Remove processed files
rm osrm/vietnam-251119.osrm*

# Re-run setup script
.\scripts\setup-osrm.ps1
```

## Cost Comparison

| Solution | Monthly Cost | Traffic Data | Setup |
|----------|-------------|--------------|-------|
| **OSRM (Self-hosted)** | $0 | No | Manual (one-time) |
| Google Routes API | $10/1000 req | Yes | API Key |
| Mapbox Directions | $0.40/1000 req | Yes | API Key |

OSRM is **free** but requires:
- One-time setup (~10 minutes)
- 300-400 MB disk space per country
- No real-time traffic data

## References

- [OSRM Documentation](http://project-osrm.org/)
- [OSRM Docker Hub](https://hub.docker.com/r/osrm/osrm-backend/)
- [OpenStreetMap Vietnam Data](https://download.geofabrik.de/asia/vietnam.html)
- [ADR-008: Routing Service Decision](../docs/ADR/ADR-008-routing-service.md) _(to be created)_
