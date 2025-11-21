# Download and extract pre-processed OSRM data
# Usage: .\scripts\download-osrm-data.ps1 <google-drive-file-id>

param(
    [Parameter(Mandatory=$true)]
    [string]$FileId
)

Write-Host "=== Downloading OSRM Data ===" -ForegroundColor Cyan
Write-Host ""

# Check if pip/gdown available
Write-Host "[1/3] Checking gdown..." -ForegroundColor Yellow
try {
    gdown --version | Out-Null
    Write-Host "[OK] gdown is installed" -ForegroundColor Green
} catch {
    Write-Host "[INFO] Installing gdown..." -ForegroundColor Yellow
    pip install gdown
}

# Download
Write-Host ""
Write-Host "[2/3] Downloading from Google Drive..." -ForegroundColor Yellow
$archiveName = "osrm-data.zip"
gdown $FileId -O $archiveName

if (-not (Test-Path $archiveName)) {
    Write-Host "[ERROR] Download failed" -ForegroundColor Red
    exit 1
}

$archiveSize = (Get-Item $archiveName).Length / 1MB
Write-Host "[OK] Downloaded ($([math]::Round($archiveSize, 2)) MB)" -ForegroundColor Green

# Extract
Write-Host ""
Write-Host "[3/3] Extracting..." -ForegroundColor Yellow
Expand-Archive -Path $archiveName -DestinationPath "." -Force
Remove-Item $archiveName

Write-Host "[OK] Extracted to osrm/" -ForegroundColor Green
Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Green
Write-Host "Start OSRM: docker compose up -d osrm-backend" -ForegroundColor Cyan
Write-Host ""
