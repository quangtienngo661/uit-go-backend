# OSRM Quick Start - Pre-processed Data

Để tiết kiệm thời gian setup (5-10 phút processing), team có thể download **pre-processed OSRM data**.

## Option 1: Download Pre-processed Data (Khuyến nghị) ⚡

### Bước 1: Download

**Google Drive:** [Download OSRM Data (~400MB)](LINK_TO_GOOGLE_DRIVE)

Hoặc sử dụng `gdown`:
```bash
# Install gdown
pip install gdown

# Download và extract
gdown 1XXXXXXXXXXXXXXXXXXXXXXXXXXX -O osrm-data.zip
unzip osrm-data.zip -d osrm/
```

### Bước 2: Verify

Kiểm tra files:
```bash
ls osrm/
# Phải có:
# - vietnam-251119.osm.pbf (316 MB)
# - vietnam-251119.osrm
# - vietnam-251119.osrm.* (nhiều files)
```

### Bước 3: Start OSRM

```bash
docker compose up -d osrm-backend
```

**Test:**
```bash
curl "http://localhost:5050/route/v1/driving/106.66,10.76;106.70,10.77"
```

---

## Option 2: Process từ đầu (5-10 phút)

Nếu không muốn download, chạy setup script:

```powershell
# Windows
.\scripts\setup-osrm.ps1

# Linux/Mac
./scripts/setup-osrm.sh
```

---

## Tạo pre-processed data để share (Cho maintainer)

Nếu bạn đã process xong và muốn share cho team:

### 1. Compress OSRM data

```bash
# Windows PowerShell
Compress-Archive -Path "osrm/*" -DestinationPath "osrm-data.zip"

# Linux/Mac
zip -r osrm-data.zip osrm/
```

### 2. Upload lên Google Drive

1. Upload `osrm-data.zip` (~400MB) lên Google Drive
2. Chia sẻ link với quyền "Anyone with the link can view"
3. Lấy File ID từ link sharing
4. Update link trong file này

**Ví dụ link:**
```
https://drive.google.com/file/d/1XXXXXXXXXXXXXXXXXXXXXXXXXXX/view?usp=sharing
                           ^^^^^^^^^^^^^^^^^^^^^^^^^^^
                           File ID này để dùng với gdown
```

### 3. Update README

Thêm link download vào README.md:

```markdown
## Quick Start OSRM

**Option A: Download pre-processed data** (Recommended)
- [Download OSRM data (400MB)](GOOGLE_DRIVE_LINK)
- Extract to `osrm/` folder
- Run: `docker compose up -d osrm-backend`

**Option B: Process from scratch** (5-10 minutes)
- Run: `.\scripts\setup-osrm.ps1`
```

---

## Tính toán Storage

| Item | Size | Ghi chú |
|------|------|---------|
| vietnam-251119.osm.pbf | 316 MB | Original OSM data |
| Processed files (*.osrm*) | ~1.2 GB | After extract/partition/customize |
| **Compressed .zip** | **~400 MB** | ✅ Share file này |

---

## Alternative: Docker Volume Sharing

Nếu team làm việc locally gần nhau, có thể share Docker volume:

```bash
# Export volume
docker run --rm -v osrm-data:/data -v $(pwd):/backup alpine tar czf /backup/osrm-volume.tar.gz -C /data .

# Import volume (team member khác)
docker volume create osrm-data
docker run --rm -v osrm-data:/data -v $(pwd):/backup alpine tar xzf /backup/osrm-volume.tar.gz -C /data
```

---

## So sánh các phương án

| Phương án | Thời gian setup | Internet | Chi phí |
|-----------|-----------------|----------|---------|
| **Download pre-processed** | 2-3 phút | ~400MB download | Free (Google Drive) |
| **Process từ đầu** | 5-10 phút | ~316MB OSM data | Free |
| **Git LFS** | Clone time | Mỗi clone | $5/tháng |

**Khuyến nghị:** Download pre-processed data, giữ script cho trường hợp cần.
