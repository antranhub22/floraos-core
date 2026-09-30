---
name: worker-python
description: >-
  Quy tắc phát triển Python workers cho FloraOS. Kích hoạt khi agent tạo/sửa
  code trong workers/, bao gồm vision worker, media_ai worker (image, video,
  audio, guard), hoặc job system, hoặc bất kỳ logic nào liên quan đến
  background job processing.
---

# Python Workers — FloraOS

## Quick Reference (Khuôn chuẩn Worker FloraOS)

### Job Handler & 3 Trục Trạng thái (status / stage / result)
```python
# Khuôn chuẩn từ workers/media_ai/jobs/worker.py
import uuid
from typing import Any
import psycopg
from psycopg.rows import dict_row
from shared.storage import doc_bytes, ghi_bytes

def handle_job(conn: psycopg.Connection, job: dict[str, Any]) -> None:
    job_id = job["id"]
    org_id = job["organization_id"]  # BẮT BUỘC: chỉ lấy từ dòng job trong DB
    
    # 1. Cập nhật stage tiến trình
    update_stage(conn, job_id, stage="PROCESSING")
    
    # 2. Đọc tệp qua shared.storage (đường dẫn chuẩn: org/<org_id>/<prod_id>/<asset_id>.<ext>)
    input_bytes = doc_bytes(job["input_storage_path"])
    
    # 3. Xử lý nghiệp vụ + Guard thẩm định
    result_bytes, is_valid, reason = run_pipeline_with_guard(input_bytes)
    
    # 4. Phân định rõ 3 trục: status / stage / result
    # QUAN TRỌNG: REJECTED không phải FAILED (job chạy đúng nhưng vi phạm tiêu chuẩn chất lượng)
    if not is_valid:
        set_verdict(conn, job_id, status="COMPLETED", stage="VERIFYING", result="REJECTED", reason=reason)
        return  # Không ghi asset mới khi bị từ chối
        
    out_path = f"org/{org_id}/{job['product_id']}/{uuid.uuid4()}.jpg"
    ghi_bytes(out_path, result_bytes, content_type="image/jpeg")
    set_verdict(conn, job_id, status="COMPLETED", stage="GENERATING_OUTPUTS", result="APPROVED", output_path=out_path)
```
---

## Rules (bắt buộc)

### 1. Job System — Ba trục tách rời
- `status` / `stage` / `result` tách rời.
- `COMPLETED + result=REJECTED` **KHÔNG phải** `FAILED`.
- `usage` ghi ở core (tại điểm tạo job), KHÔNG ghi ở worker.

### 2. Worker Pattern
- Lấy việc: `SELECT … FOR UPDATE SKIP LOCKED` + `LISTEN/NOTIFY`.
- **CẤM `subprocess` + parse stdout.**
- **CẤM chạy job qua HTTP.**

### 3. Storage Path
Format: `org/<organization_id>/<product_id>/<asset_id>.<ext>`.

### 4. Provider Routing
- Dùng provider → dùng TOÀN BỘ tính năng, không trộn cục bộ.
- Mọi bên lỗi → lùi luồng cục bộ + GHI RÕ lý do.

### 5. Worker Modules & Lệnh

| Worker | Module | Lệnh |
|---|---|---|
| Vision | `vision.jobs.worker` | `npm run worker:vision` |
| Media | `media_ai.jobs.worker` | `npm run worker:media` |
| Video | `media_ai.video.video_worker` | `npm run worker:video` |
| Market Intel | TS worker | `npm run worker:market-intelligence` |
| Tất cả | — | `npm run dev:all` |
| Test | pytest | `cd workers && .venv/bin/python -m pytest tests -q` |

---

## DO / DON'T

### ❌ DON'T — Gọi worker qua HTTP
```python
# Từ Next.js API route
requests.post("http://localhost:8080/process-image", json=payload)
```

### ✅ DO — INSERT job vào DB, worker tự lấy
```typescript
// Từ Next.js use-case
await db.jobs.create({ data: { type: "media.process", payload, ...scopedData(ctx, {}) } })
// Worker tự SELECT ... FOR UPDATE SKIP LOCKED
```

### ❌ DON'T — subprocess + parse stdout
```python
output = subprocess.check_output(["python", "script.py", image_path])
result = parse_json(output.decode())
```

### ✅ DO — Import và gọi trực tiếp
```python
from media_ai.image.processor import process_image
result = await process_image(image_path, config)
```

---

## Reference Files

| Pattern | File |
|---|---|
| Media worker entry | `workers/media_ai/jobs/worker.py` |
| Video worker | `workers/media_ai/video/video_worker.py` |
| Scene providers | `workers/media_ai/providers/scene/` |
| Shared DB utils | `workers/shared/` |
| Worker requirements | `workers/requirements.txt` |
| Generate scene | `workers/media_ai/generate_scene.py` |

> Xem thêm: skill `ai-integration` §3 cho provider rules. Skill `database-schema` §3 cho tenant trên bảng jobs.
