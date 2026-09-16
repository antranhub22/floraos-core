"""
Worker xử lý tiến trình Render Video (M04c).
Tuân thủ chuẩn D6-1 của floraos-core:
- Lấy việc bằng SELECT ... FOR UPDATE SKIP LOCKED
- Lắng nghe PostgreSQL LISTEN/NOTIFY qua kênh floraos_job_video_render
- Cập nhật job_events (stage, progress, done) cho SSE client
- Cập nhật video_jobs sang RENDER_COMPLETED
- Tích hợp kiến trúc Provider Pattern:
  + Phương án A (Mặc định): LocalCinematicProvider (FFmpeg Ken Burns, 0 credit)
  + Phương án B (Standby): GoogleVeoProvider & HeyGenProvider (AI Generative)
- Tuyệt đối không import bừa bãi, bảo toàn 100% tenant isolation (lấy org_id từ job).
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Any, Dict, Optional

import psycopg
from psycopg.rows import dict_row

from media_ai.video.providers import get_video_provider, VideoProviderError

FEATURE = "video.render"
REPO_ROOT = Path(__file__).resolve().parents[3]
STORAGE_ROOT = REPO_ROOT / "var" / "storage"
RENDER_DIR = STORAGE_ROOT / "videos"


def notify_channel_for(feature: str) -> str:
    """Tên kênh LISTEN/NOTIFY tương ứng."""
    return "floraos_job_" + re.sub(r"[^a-zA-Z0-9_]", "_", feature)


def claim_next(conn: psycopg.Connection, feature: str = FEATURE) -> Optional[Dict[str, Any]]:
    """Lấy job video tiếp theo bằng SELECT FOR UPDATE SKIP LOCKED."""
    with conn.transaction():
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT * FROM generation_jobs
                 WHERE status = 'PENDING' AND feature = %s
                 ORDER BY created_at
                 FOR UPDATE SKIP LOCKED
                 LIMIT 1
                """,
                (feature,),
            )
            job = cur.fetchone()
            if job is None:
                return None
            cur.execute(
                "UPDATE generation_jobs SET status = 'PROCESSING', started_at = now() WHERE id = %s",
                (job["id"],),
            )
    return job


def record_job_event(cur: psycopg.Cursor, job_id: str, event: str, payload: Dict[str, Any]):
    """Ghi nhận sự kiện tiến trình vào job_events để client đọc qua SSE."""
    cur.execute(
        """
        INSERT INTO job_events (id, job_id, seq, event, payload, created_at)
        VALUES (gen_random_uuid(), %(job_id)s,
                COALESCE((SELECT MAX(seq) FROM job_events WHERE job_id = %(job_id)s), 0) + 1,
                %(event)s, %(payload)s, NOW())
        """,
        {"job_id": job_id, "event": event, "payload": json.dumps(payload)},
    )


def process_video_job(conn: psycopg.Connection, job: Dict[str, Any]):
    """Thực thi tác vụ render video thông qua Provider."""
    job_id = job["id"]
    org_id = job["organization_id"]
    payload = job.get("payload") or {}
    video_job_id = payload.get("videoJobId") or job_id
    format_type = payload.get("format") or "REEL_15S"

    print(f"🎬 [VideoWorker] Bắt đầu render job {job_id} cho video_job {video_job_id} ({format_type})", flush=True)

    with conn.cursor(row_factory=dict_row) as cur:
        # 1. Chuyển generation_jobs sang PROCESSING
        cur.execute(
            """
            UPDATE generation_jobs
            SET status = 'PROCESSING', stage = 'RENDERING', started_at = NOW(), attempts = attempts + 1
            WHERE id = %s
            """,
            (job_id,),
        )
        record_job_event(cur, job_id, "stage", {"stage": "RENDERING", "progress": 15})

        # 2. Chuẩn bị thư mục và đường dẫn tệp đầu ra
        out_dir = RENDER_DIR / org_id
        out_dir.mkdir(parents=True, exist_ok=True)
        out_file = out_dir / f"{video_job_id}.mp4"

        # 3. Lựa chọn Provider (Mặc định Phương án A LOCAL_CINEMATIC hoặc Phương án B VEO/HEYGEN)
        provider_name = payload.get("provider") or payload.get("videoProvider")
        provider = get_video_provider(provider_name)
        print(f"🎬 [VideoWorker] Điều phối render qua [{provider.name}] ({provider.model_version})", flush=True)

        def handle_progress(evt_type: str, data: Dict[str, Any]):
            if evt_type == "STAGE":
                record_job_event(cur, job_id, "stage", data)
            elif evt_type == "LOG":
                record_job_event(cur, job_id, "log", data)

        try:
            # 4. Thực thi render qua Provider
            provider.render_video(
                job_id=job_id,
                org_id=org_id,
                payload=payload,
                out_file=out_file,
                progress_callback=handle_progress,
            )
            video_url = f"/api/v1/storage/videos/{org_id}/{video_job_id}.mp4"

            # 5. Cập nhật video_jobs sang RENDER_COMPLETED
            cur.execute(
                """
                UPDATE video_jobs
                SET stage = 'RENDER_COMPLETED', final_video_url = %s, error_message = NULL, updated_at = NOW()
                WHERE id = %s AND organization_id = %s
                """,
                (video_url, video_job_id, org_id),
            )

            # 6. Đánh dấu generation_jobs hoàn tất
            output_json = json.dumps({
                "video_url": video_url,
                "video_job_id": video_job_id,
                "provider": provider.name,
            })
            cur.execute(
                """
                UPDATE generation_jobs
                SET status = 'COMPLETED', stage = NULL, result = 'SUCCESS',
                    output = %s,
                    completed_at = NOW()
                WHERE id = %s
                """,
                (output_json, job_id),
            )
            record_job_event(cur, job_id, "done", {"progress": 100, "video_url": video_url})
            print(f"✅ [VideoWorker] Render thành công [{provider.name}] video_job {video_job_id} -> {video_url}", flush=True)

        except Exception as exc:
            err_msg = str(exc)
            print(f"❌ [VideoWorker] Thất bại khi render video_job {video_job_id}: {err_msg}", flush=True)
            record_job_event(cur, job_id, "error", {"error": err_msg})

            cur.execute(
                """
                UPDATE video_jobs
                SET stage = 'FAILED', error_message = %s, updated_at = NOW()
                WHERE id = %s AND organization_id = %s
                """,
                (err_msg[:500], video_job_id, org_id),
            )
            cur.execute(
                """
                UPDATE generation_jobs
                SET status = 'FAILED', stage = NULL, result = 'REJECTED',
                    error_message = %s, completed_at = NOW()
                WHERE id = %s
                """,
                (err_msg[:500], job_id),
            )


def run_worker(db_url: Optional[str] = None):
    """Vòng lặp chính của Video Worker lắng nghe sự kiện từ Postgres."""
    dsn = db_url or os.environ.get("DATABASE_URL")
    if not dsn:
        env_file = REPO_ROOT / ".env"
        if env_file.is_file():
            for line in env_file.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line.startswith("DATABASE_URL=") and not line.startswith("#"):
                    dsn = line.split("=", 1)[1].strip("\"'")
                    break
    if not dsn:
        dsn = "postgresql://floraos:floraos@127.0.0.1:5432/floraos?sslmode=disable"

    channel = notify_channel_for(FEATURE)
    print(f"🚀 [VideoWorker] Khởi động lắng nghe kênh: {channel}", flush=True)

    while True:
        try:
            with psycopg.connect(dsn, autocommit=True) as conn:
                conn.execute(f"LISTEN {channel}")
                print(f"📡 [VideoWorker] Đã kết nối Postgres và lắng nghe kênh {channel}", flush=True)

                while True:
                    # 1. Quét và nhận việc còn tồn trong hàng đợi
                    while True:
                        job = claim_next(conn, FEATURE)
                        if not job:
                            break
                        try:
                            process_video_job(conn, job)
                        except Exception as e:
                            print(f"❌ [VideoWorker] Lỗi ngoài dự kiến xử lý job {job.get('id')}: {e}", flush=True)

                    # 2. Chờ thông báo NOTIFY mới (timeout 5s để định kỳ kiểm tra liveness)
                    for notif in conn.notifies(timeout=5):
                        pass

        except psycopg.OperationalError as op_err:
            print(f"⚠️ [VideoWorker] Mất kết nối Postgres: {op_err}. Thử lại sau 3s...", flush=True)
            time.sleep(3)
        except Exception as general_err:
            print(f"⚠️ [VideoWorker] Ngoại lệ vòng lặp: {general_err}. Thử lại sau 3s...", flush=True)
            time.sleep(3)


if __name__ == "__main__":
    run_worker()
