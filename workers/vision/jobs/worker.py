"""Worker M01 — lấy việc từ `generation_jobs` bằng `SKIP LOCKED` +
`LISTEN/NOTIFY` (quyết định D6-1, kiến trúc V2 mục 3.1). Cấm tuyệt đối
`subprocess.Popen` + parse stdout; cấm chạy job qua HTTP (`workers/README.md`
luật 1-5).

`organization_id` lấy CHỈ từ dòng job (`job["organization_id"]`) — không suy
từ dữ liệu ảnh, không nhận từ tham số nào khác (luật 1).

Ba trục job tách rời (luật 2): `stage` đổi khi đổi bước, `result` khi có
phán quyết (`OK`/`LOW_CONFIDENCE`, đặc tả 07 mục 6.1), `status` sau cùng.
Worker KHÔNG ghi `usage` (luật 3) — hạn mức đã kiểm và ghi ở phía core lúc
enqueue (`enqueue-job.ts`).
"""

from __future__ import annotations

import json
import os
import re
import time
from pathlib import Path
from typing import Any

import psycopg
from psycopg.rows import dict_row

from vision.providers.openai_structured import OpenAIStructuredProvider

FEATURE = "vision.analyze"
CONTRACT_VERSION = "1"  # Schema.json chưa tự khai version — hằng số này là nơi duy nhất theo dõi.

# repo_root/var/storage/<storage_key> — cùng STORAGE_ROOT của
# `LocalDiskStorageProvider` (nợ #15, TECHNICAL_DEBT.md): chỉ đúng khi worker
# và web chạy chung một máy, chung một checkout. Thay khi có adapter S3/R2 thật.
REPO_ROOT = Path(__file__).resolve().parents[3]
STORAGE_ROOT = REPO_ROOT / "var" / "storage"


def notify_channel_for(feature: str) -> str:
    """Mirror của `notifyChannelFor` (`postgres-queue-provider.ts`) — hai bên
    phải tính ra cùng một tên kênh, không có nguồn sự thật chung nào khác."""
    return "floraos_job_" + re.sub(r"[^a-zA-Z0-9_]", "_", feature)


def _read_asset_bytes(storage_key: str) -> bytes:
    path = STORAGE_ROOT / storage_key
    return path.read_bytes()


def _emit_event(conn: psycopg.Connection, job_id: str, event: str, payload: dict) -> None:
    """`job_events` — nhật ký cộng dồn cho SSE (đặc tả 07 mục 6.1). `seq` bằng
    `MAX(seq)+1` trong phạm vi job — an toàn vì một job chỉ có đúng một
    worker sở hữu sau `claim_next` (cùng giả định `job_events.seq`, nợ #16).
    """
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO job_events (id, job_id, seq, event, payload, created_at)
            VALUES (gen_random_uuid(), %(job_id)s,
                    COALESCE((SELECT MAX(seq) FROM job_events WHERE job_id = %(job_id)s), 0) + 1,
                    %(event)s, %(payload)s, now())
            """,
            {"job_id": job_id, "event": event, "payload": json.dumps(payload)},
        )
    conn.commit()


def claim_next(conn: psycopg.Connection, feature: str) -> dict[str, Any] | None:
    """`SELECT … FOR UPDATE SKIP LOCKED` rồi `UPDATE … PROCESSING`, một giao
    dịch — đúng cơ chế `GenerationJobRepository.claimNext` phía TS (đặc tả 07
    mục 6), worker chạy thẳng câu SQL này, không gọi lại hàm TS (`YC-J8`).
    """
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


def _insert_analysis(
    conn: psycopg.Connection,
    job: dict[str, Any],
    asset_id: str,
    product_id: str | None,
    provider: OpenAIStructuredProvider,
    raw: dict,
) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO product_analyses
                (id, organization_id, product_id, asset_id, job_id,
                 provider, model, model_version, contract_name, contract_version,
                 raw, approval_state, created_at)
            VALUES
                (gen_random_uuid(), %(organization_id)s, %(product_id)s, %(asset_id)s, %(job_id)s,
                 %(provider)s, %(model)s, %(model_version)s, %(contract_name)s, %(contract_version)s,
                 %(raw)s, 'PENDING', now())
            """,
            {
                "organization_id": job["organization_id"],
                "product_id": product_id,
                "asset_id": asset_id,
                "job_id": job["id"],
                "provider": provider.name,
                "model": provider.model_version,
                "model_version": provider.model_version,
                "contract_name": "PhanTichSanPhamHoa",
                "contract_version": CONTRACT_VERSION,
                "raw": json.dumps(raw),
            },
        )
    conn.commit()


def process_job(conn: psycopg.Connection, job: dict[str, Any], provider: OpenAIStructuredProvider) -> None:
    payload = job["payload"] if isinstance(job["payload"], dict) else json.loads(job["payload"])
    asset_ids: list[str] = payload["asset_ids"]
    product_id: str | None = payload.get("product_id")
    organization_id = job["organization_id"]  # luật 1 — chỉ từ dòng job

    _emit_event(conn, job["id"], "stage", {"stage": "DETECTING"})
    with conn.cursor() as cur:
        cur.execute("UPDATE generation_jobs SET stage = 'DETECTING' WHERE id = %s", (job["id"],))
    conn.commit()

    lowest_confidence = 100
    try:
        for asset_id in asset_ids:
            storage_key = _asset_storage_key(conn, organization_id, asset_id)
            image_bytes = _read_asset_bytes(storage_key)

            raw = provider.analyze(
                image_bytes,
                {"organization_id": organization_id, "product_id": product_id, "asset_id": asset_id},
            )
            confidence = raw.get("confidence")
            if isinstance(confidence, int):
                lowest_confidence = min(lowest_confidence, confidence)

            _insert_analysis(conn, job, asset_id, product_id, provider, raw)
            _emit_event(conn, job["id"], "log", {"asset_id": asset_id, "status": "phân tích xong"})

        result = "LOW_CONFIDENCE" if lowest_confidence < 70 else "OK"
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE generation_jobs
                   SET status = 'COMPLETED', result = %s, stage = NULL, completed_at = now()
                 WHERE id = %s
                """,
                (result, job["id"]),
            )
        conn.commit()
        _emit_event(conn, job["id"], "done", {"status": "COMPLETED", "result": result})

    except Exception as exc:  # noqa: BLE001 — job lỗi kỹ thuật, không phải phán quyết nghiệp vụ
        conn.rollback()
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE generation_jobs
                   SET status = 'FAILED', error = %s, attempts = attempts + 1
                 WHERE id = %s
                """,
                (str(exc), job["id"]),
            )
        conn.commit()
        _emit_event(conn, job["id"], "done", {"status": "FAILED", "error": str(exc)})


def _asset_storage_key(conn: psycopg.Connection, organization_id: str, asset_id: str) -> str:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT storage_key FROM assets WHERE id = %s AND organization_id = %s",
            (asset_id, organization_id),
        )
        row = cur.fetchone()
        if row is None:
            raise LookupError(f"asset {asset_id} không thuộc tổ chức {organization_id}")
        return row[0]


def run_worker(database_url: str, poll_interval_seconds: float = 5.0) -> None:
    """Vòng lặp chính. `LISTEN` để thức ngay khi có job mới; vẫn giữ vòng lặp
    thăm dò làm lưới an toàn (bỏ lỡ `NOTIFY` khi mất kết nối tạm thời không
    làm job kẹt vô thời hạn — `scan-stuck-jobs.ts`, `YC-J10`, là lưới thứ hai
    ở phía TS cho đúng trường hợp này).
    """
    provider = OpenAIStructuredProvider()
    channel = notify_channel_for(FEATURE)

    with psycopg.connect(database_url, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(f"LISTEN {channel}")

        while True:
            job = claim_next(conn, FEATURE)
            if job is not None:
                process_job(conn, job, provider)
                continue

            for _notify in conn.notifies(timeout=poll_interval_seconds):
                break  # một NOTIFY là đủ để vòng lặp thử claim lại ngay


def main() -> None:
    database_url = os.environ["DATABASE_URL"]
    run_worker(database_url)


if __name__ == "__main__":
    main()
