#!/bin/bash
# Create OSRM data archive for team sharing

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}=== Creating OSRM Data Archive ===${NC}"
echo ""

# Check if OSRM data exists
if [ ! -f "osrm/vietnam-251119.osrm" ]; then
    echo -e "${RED}[ERROR] OSRM data not found. Run setup-osrm.sh first.${NC}"
    exit 1
fi

# Get total size
TOTAL_SIZE=$(du -sh osrm | cut -f1)
echo -e "${YELLOW}[INFO] Total OSRM data size: $TOTAL_SIZE${NC}"
echo ""

# Create archive
echo -e "${YELLOW}[1/2] Compressing OSRM data...${NC}"
TIMESTAMP=$(date +%Y%m%d)
ARCHIVE_NAME="osrm-vietnam-$TIMESTAMP.tar.gz"

tar czf "$ARCHIVE_NAME" osrm/

ARCHIVE_SIZE=$(du -h "$ARCHIVE_NAME" | cut -f1)
echo -e "${GREEN}[OK] Created $ARCHIVE_NAME ($ARCHIVE_SIZE)${NC}"

echo ""
echo -e "${YELLOW}[2/2] Upload Instructions:${NC}"
echo "  1. Upload $ARCHIVE_NAME to Google Drive"
echo "  2. Set sharing: 'Anyone with the link can view'"
echo "  3. Copy the File ID from share link:"
echo -e "     ${CYAN}https://drive.google.com/file/d/FILE_ID_HERE/view${NC}"
echo "  4. Update docs/OSRM-QUICK-START.md with the link"
echo ""
echo -e "${GREEN}[DONE] Archive ready: $ARCHIVE_NAME${NC}"
echo ""
