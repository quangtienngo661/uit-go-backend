# Create OSRM data archive for team sharing
# Run this after successfully processing OSRM data

Write-Host "=== Creating OSRM Data Archive ===" -ForegroundColor Cyan
Write-Host ""

# Check if OSRM data exists
if (-not (Test-Path "osrm/vietnam-251119.osrm")) {
    Write-Host "[ERROR] OSRM data not found. Run setup-osrm.ps1 first." -ForegroundColor Red
    exit 1
}

# Get total size
$totalSize = (Get-ChildItem "osrm" -Recurse | Measure-Object -Property Length -Sum).Sum / 1GB
Write-Host "[INFO] Total OSRM data size: $([math]::Round($totalSize, 2)) GB" -ForegroundColor Yellow
Write-Host ""

# Create archive
Write-Host "[1/2] Compressing OSRM data..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd"
$archiveName = "osrm-vietnam-$timestamp.zip"

Compress-Archive -Path "osrm/*" -DestinationPath $archiveName -Force

$archiveSize = (Get-Item $archiveName).Length / 1MB
Write-Host "[OK] Created $archiveName ($([math]::Round($archiveSize, 2)) MB)" -ForegroundColor Green

Write-Host ""
Write-Host "[2/2] Upload Instructions:" -ForegroundColor Yellow
Write-Host "  1. Upload $archiveName to Google Drive" -ForegroundColor White
Write-Host "  2. Set sharing: 'Anyone with the link can view'" -ForegroundColor White
Write-Host "  3. Copy the File ID from share link:" -ForegroundColor White
Write-Host "     https://drive.google.com/file/d/FILE_ID_HERE/view" -ForegroundColor Cyan
Write-Host "  4. Update docs/OSRM-QUICK-START.md with the link" -ForegroundColor White
Write-Host ""
Write-Host "[DONE] Archive ready: $archiveName" -ForegroundColor Green
Write-Host ""
