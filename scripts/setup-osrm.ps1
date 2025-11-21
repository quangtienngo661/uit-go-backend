# Setup OSRM for UIT-Go Backend
# This script prepares OSRM data for Vietnam

Write-Host "=== UIT-Go OSRM Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check Docker
Write-Host "[1/5] Checking Docker..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "[OK] Docker is running" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker not running" -ForegroundColor Red
    exit 1
}

# Create osrm directory
Write-Host ""
Write-Host "[2/5] Creating osrm directory..." -ForegroundColor Yellow
if (-not (Test-Path "osrm")) {
    New-Item -ItemType Directory -Path "osrm" | Out-Null
    Write-Host "[OK] Created osrm directory" -ForegroundColor Green
} else {
    Write-Host "[OK] osrm directory exists" -ForegroundColor Green
}

# Check OSM data
Write-Host ""
Write-Host "[3/5] Checking Vietnam OSM data..." -ForegroundColor Yellow
$osmFile = "osrm/vietnam-251119.osm.pbf"

if (-not (Test-Path $osmFile)) {
    Write-Host "[WARNING] OSM file not found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Download Vietnam OSM data:" -ForegroundColor Cyan
    Write-Host "  https://download.geofabrik.de/asia/vietnam-latest.osm.pbf" -ForegroundColor White
    Write-Host ""
    Write-Host "Save as: osrm/vietnam-251119.osm.pbf" -ForegroundColor White
    Write-Host ""
    exit 1
} else {
    $fileSize = (Get-Item $osmFile).Length / 1MB
    Write-Host "[OK] Found OSM file ($([math]::Round($fileSize, 2)) MB)" -ForegroundColor Green
}

# Check processed data
Write-Host ""
Write-Host "[4/5] Checking processed data..." -ForegroundColor Yellow
if (Test-Path "osrm/vietnam-251119.osrm") {
    Write-Host "[OK] Data already processed" -ForegroundColor Green
    Write-Host ""
    Write-Host "[5/5] Starting OSRM..." -ForegroundColor Yellow
    docker compose up -d osrm-backend
    Write-Host ""
    Write-Host "[DONE] OSRM ready at http://localhost:5050" -ForegroundColor Green
    exit 0
}

# Process data
Write-Host "[INFO] Processing data (5-10 minutes)..." -ForegroundColor Yellow
Write-Host ""

Write-Host "Step 1/3: Extract..." -ForegroundColor Cyan
docker run -t --rm -v "${PWD}/osrm:/data" osrm/osrm-backend osrm-extract -p /opt/car.lua /data/vietnam-251119.osm.pbf
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ""
Write-Host "Step 2/3: Partition..." -ForegroundColor Cyan
docker run -t --rm -v "${PWD}/osrm:/data" osrm/osrm-backend osrm-partition /data/vietnam-251119.osrm
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ""
Write-Host "Step 3/3: Customize..." -ForegroundColor Cyan
docker run -t --rm -v "${PWD}/osrm:/data" osrm/osrm-backend osrm-customize /data/vietnam-251119.osrm
if ($LASTEXITCODE -ne 0) { exit 1 }

# Start
Write-Host ""
Write-Host "[5/5] Starting OSRM..." -ForegroundColor Yellow
docker compose up -d osrm-backend

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host "OSRM: http://localhost:5050" -ForegroundColor Cyan
Write-Host ""
