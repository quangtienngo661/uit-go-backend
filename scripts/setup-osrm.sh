#!/bin/bash
# Setup OSRM for UIT-Go Backend
# This script downloads and prepares OSRM data for Vietnam

set -e

echo "=== UIT-Go OSRM Setup ==="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if Docker is running
echo -e "${YELLOW}[1/5] Checking Docker...${NC}"
if ! docker version > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"

# Create osrm directory
echo ""
echo -e "${YELLOW}[2/5] Creating osrm directory...${NC}"
if [ ! -d "osrm" ]; then
    mkdir -p osrm
    echo -e "${GREEN}✓ Created osrm/ directory${NC}"
else
    echo -e "${GREEN}✓ osrm/ directory already exists${NC}"
fi

# Check if OSM data exists
echo ""
echo -e "${YELLOW}[3/5] Checking Vietnam OSM data...${NC}"
OSM_FILE="osrm/vietnam-251119.osm.pbf"

if [ ! -f "$OSM_FILE" ]; then
    echo -e "${YELLOW}⚠ vietnam-251119.osm.pbf not found (316 MB)${NC}"
    echo ""
    echo -e "${CYAN}Please download Vietnam OSM data manually:${NC}"
    echo -e "  1. Visit: https://download.geofabrik.de/asia/vietnam-latest.osm.pbf"
    echo -e "  2. Download the file (~316 MB)"
    echo -e "  3. Rename to: vietnam-251119.osm.pbf"
    echo -e "  4. Place it in: osrm/vietnam-251119.osm.pbf"
    echo ""
    echo -e "${CYAN}Or use curl:${NC}"
    echo -e "  curl -o osrm/vietnam-251119.osm.pbf https://download.geofabrik.de/asia/vietnam-latest.osm.pbf"
    echo ""
    exit 1
else
    FILE_SIZE=$(du -m "$OSM_FILE" | cut -f1)
    echo -e "${GREEN}✓ Found vietnam-251119.osm.pbf (${FILE_SIZE} MB)${NC}"
fi

# Check if OSRM data is already processed
echo ""
echo -e "${YELLOW}[4/5] Checking processed OSRM data...${NC}"
if [ -f "osrm/vietnam-251119.osrm" ]; then
    echo -e "${GREEN}✓ OSRM data already processed${NC}"
    echo ""
    echo -e "${YELLOW}[5/5] Starting OSRM server...${NC}"
    docker compose up -d osrm-backend
    echo ""
    echo -e "${GREEN}✓ OSRM is ready at http://localhost:5050${NC}"
    echo ""
    echo -e "${CYAN}Test with:${NC}"
    echo '  curl "http://localhost:5050/route/v1/driving/106.660172,10.762622;106.700806,10.776889?overview=false"'
    exit 0
fi

# Process OSM data
echo -e "${YELLOW}⚠ OSRM data needs to be processed (this takes ~5-10 minutes)${NC}"
echo ""

echo -e "${CYAN}Step 1/3: Extracting OSM data...${NC}"
docker run -t --rm -v "$(pwd)/osrm:/data" osrm/osrm-backend osrm-extract -p /opt/car.lua /data/vietnam-251119.osm.pbf
echo -e "${GREEN}✓ Extract completed${NC}"

echo ""
echo -e "${CYAN}Step 2/3: Partitioning data...${NC}"
docker run -t --rm -v "$(pwd)/osrm:/data" osrm/osrm-backend osrm-partition /data/vietnam-251119.osrm
echo -e "${GREEN}✓ Partition completed${NC}"

echo ""
echo -e "${CYAN}Step 3/3: Customizing data...${NC}"
docker run -t --rm -v "$(pwd)/osrm:/data" osrm/osrm-backend osrm-customize /data/vietnam-251119.osrm
echo -e "${GREEN}✓ Customize completed${NC}"

# Start OSRM
echo ""
echo -e "${YELLOW}[5/5] Starting OSRM server...${NC}"
docker compose up -d osrm-backend

echo ""
echo -e "${GREEN}=== Setup Complete! ===${NC}"
echo ""
echo -e "${CYAN}OSRM is now running at http://localhost:5050${NC}"
echo ""
echo -e "${CYAN}Test with:${NC}"
echo '  curl "http://localhost:5050/route/v1/driving/106.660172,10.762622;106.700806,10.776889?overview=false"'
echo ""
