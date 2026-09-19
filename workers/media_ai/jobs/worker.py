"""Worker M04a — tối ưu ảnh + Product Identity Guard.

Cùng khuôn với `workers/vision/jobs/worker.py` (D6-1): lấy việc bằng
`SELECT … FOR UPDATE SKIP LOCKED` + `LISTEN/NOTIFY`, không `subprocess`,
không HTTP nội bộ, `organization_id` CHỈ lấy từ dòng job.

Luồng một job (M04 mục 5, đặc tả 07 mục 6.1 cho bộ `stage`):

    ANALYZING        phân tích ảnh GỐC  → dấu vân
    ENHANCING        tăng cường          → Master Image (một lần)
    SMART_REFRAME    tạo 4 tỷ lệ        → 1:1, 4:5, 9:16, 16:9 từ Master
    VERIFYING        phân tích lại + so  → phán quyết Guard
    GENERATING_OUTPUTS  ghi asset (chỉ khi KHÔNG bị từ chối)

Hai điều dễ làm sai, đã chặn bằng cấu trúc:

1. **`REJECTED` không phải job lỗi** (đặc tả 07 mục 6.1). Cổng từ chối nghĩa
   là job chạy ĐÚNG và đi tới phán quyết: `status = COMPLETED`,
   `result = REJECTED`. Ánh xạ sang `FAILED` làm retry chạy lại vô ích và
   làm sai kế toán. Chỉ `except` cuối mới ghi `FAILED`, và nó chỉ bắt hỏng
   kỹ thuật.

2. **Bị từ chối thì KHÔNG ghi asset tăng cường** (M04 mục 5: "Giữ Original,
   không trả ảnh đã enhance"). Ảnh gốc còn nguyên, không có dòng `assets`
   mới nào, nên không có đường nào để ảnh đó lọt ra ngoài qua
   `/media/optimizations/:id/download`.

Worker KHÔNG ghi `usage` (`YC-U4`, luật 3 của `workers/README.md`). Hoàn
credit cho job bị từ chối (D3) là việc của phía TS — xem
`src/modules/media/use-cases/refund-rejected-job.ts`.

**Chi phí thật (nợ #71).** Lượt gọi mô hình tăng cường (`AIC-08`) được ghi
vào `ai_requests` qua `media_ai.providers.chung.ghi_ai_request` — cùng
nguyên tắc với `vision/jobs/worker.py`: đo đúng thứ bị tính tiền, đọc từ
chính provider (`so_do_chi_phi_anh`), không dựng lại công thức.
"""

from __future__ import annotations

import json
import os
import re
import time
import uuid
from pathlib import Path
from typing import Any

import psycopg
from psycopg.rows import dict_row

from shared.storage import doc_bytes, ghi_bytes
from media_ai.guard.compare import REJECTED
from media_ai.guard.verifier import VisionIdentityVerifier
from media_ai.providers.chung import ghi_ai_request, so_do_chi_phi_anh
from media_ai.providers.enhancement.router import resolve_enhancer
from media_ai.providers.smart_reframe import SmartReframe

FEATURE = "media.optimize"
PIPELINE_VERSION = "m04a-1"

REPO_ROOT = Path(__file__).resolve().parents[3]
STORAGE_ROOT = REPO_ROOT / "var" / "storage"


def notify_channel_for(feature: str) -> str:
    """Mirror của `notifyChannelFor` (`postgres-queue-provider.ts`)."""
    return "floraos_job_" + re.sub(r"[^a-zA-Z0-9_]", "_", feature)


def _read_bytes(storage_key: str) -> bytes:
    """Qua `shared.storage`: cùng bốn biến môi trường với phía web, nên ảnh
    do web nhận nằm đúng chỗ worker tìm."""
    return doc_bytes(storage_key, STORAGE_ROOT)


def _write_bytes(storage_key: str, data: bytes) -> None:
    ghi_bytes(storage_key, data, "application/octet-stream", STORAGE_ROOT)


def _emit_event(conn: psycopg.Connection, job_id: str, event: str, payload: dict) -> None:
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


def _set_stage(conn: psycopg.Connection, job_id: str, stage: str) -> None:
    with conn.cursor() as cur:
        cur.execute("UPDATE generation_jobs SET stage = %s WHERE id = %s", (stage, job_id))
    conn.commit()
    _emit_event(conn, job_id, "stage", {"stage": stage})


def claim_next(conn: psycopg.Connection, feature: str) -> dict[str, Any] | None:
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


def _doc_asset(conn: psycopg.Connection, organization_id: str, asset_id: str) -> dict[str, Any]:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            SELECT id, product_id, storage_key, mime_type, version
              FROM assets
             WHERE id = %s AND organization_id = %s
            """,
            (asset_id, organization_id),
        )
        row = cur.fetchone()
        if row is None:
            raise LookupError(f"asset {asset_id} không thuộc tổ chức {organization_id}")
        return row


def _ghi_asset_master(
    conn: psycopg.Connection,
    job: dict[str, Any],
    asset_goc: dict[str, Any],
    data: bytes,
    khoi_guard: dict[str, Any],
    ket_qua_tang_cuong: dict[str, Any],
    enhancer: Any,
) -> str:
    """Ghi Master Image mới. `approval_state` để `PENDING` — cổng 2 (Review &
    Approve, `media.approve`/`I2`) mới là nơi đặt `APPROVED`; Guard PASS chỉ
    cho phép NGƯỜI DÙNG XEM, không phải cho phép ghi vào Product Master
    (M04 mục 5.1: "Guard PASS không thay thế được Approve")."""
    asset_id = str(uuid.uuid4())
    product_id = asset_goc["product_id"]
    duoi = Path(asset_goc["storage_key"]).suffix.lstrip(".") or "jpg"
    storage_key = (
        f"org/{job['organization_id']}/{product_id or 'unfiled'}/{asset_id}.{duoi}"
    )
    _write_bytes(storage_key, data)

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO assets
                (id, organization_id, product_id, parent_asset_id, kind, state, version,
                 storage_key, mime_type, provider, model, model_version, pipeline_version,
                 parameters, identity_score, generated_flags, metadata,
                 approval_state, created_by, created_at)
            VALUES
                (%(id)s, %(organization_id)s, %(product_id)s, %(parent_asset_id)s,
                 'MASTER', 'READY', %(version)s,
                 %(storage_key)s, %(mime_type)s, %(provider)s, %(model)s, %(model_version)s,
                 %(pipeline_version)s, %(parameters)s, %(identity_score)s, %(generated_flags)s,
                 %(metadata)s, 'PENDING', %(created_by)s, now())
            """,
            {
                "id": asset_id,
                "organization_id": job["organization_id"],
                "product_id": product_id,
                "parent_asset_id": asset_goc["id"],
                "version": (asset_goc["version"] or 1) + 1,
                "storage_key": storage_key,
                "mime_type": asset_goc["mime_type"],
                "provider": getattr(enhancer, "name", "unknown"),
                "model": getattr(enhancer, "name", "unknown"),
                "model_version": getattr(enhancer, "model_version", "unknown"),
                "pipeline_version": PIPELINE_VERSION,
                "parameters": json.dumps(ket_qua_tang_cuong["parameters"]),
                "identity_score": khoi_guard["identity_score"],
                "generated_flags": json.dumps(ket_qua_tang_cuong["generated_flags"]),
                # `assets` không có cột `job_id` (đặc tả 07 mục 5) — ghi vào metadata
                # để phía TS tra ngược được từ job sang Master Image nó sinh ra.
                "metadata": json.dumps({"job_id": job["id"], "identity_guard": khoi_guard}),
                "created_by": job["user_id"],
            },
        )
    conn.commit()
    return asset_id


def _ghi_ratio_assets(
    conn: psycopg.Connection,
    job: dict[str, Any],
    asset_goc: dict[str, Any],
    master_asset_id: str,
    ratio_images: dict[str, bytes],
    enhancer: Any,
) -> dict[str, str]:
    """Ghi 4 ảnh tỷ lệ (1:1, 4:5, 9:16, 16:9) từ Smart Reframe.
    Trả về dict ratio_key -> storage_key để ghi vào job.output.ratios."""
    ratio_storage_keys: dict[str, str] = {}
    product_id = asset_goc["product_id"]
    duoi = Path(asset_goc["storage_key"]).suffix.lstrip(".") or "jpg"

    for ratio_key, img_bytes in ratio_images.items():
        asset_id = str(uuid.uuid4())
        storage_key = (
            f"org/{job['organization_id']}/{product_id or 'unfiled'}/{asset_id}_{ratio_key}.{duoi}"
        )
        _write_bytes(storage_key, img_bytes)

        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO assets
                    (id, organization_id, product_id, parent_asset_id, kind, state, version,
                     storage_key, mime_type, provider, model, model_version, pipeline_version,
                     parameters, generated_flags, metadata, approval_state, created_by, created_at)
                VALUES
                    (%(id)s, %(organization_id)s, %(product_id)s, %(parent_asset_id)s,
                     'RATIO', 'READY', 1,
                     %(storage_key)s, %(mime_type)s, %(provider)s, %(model)s, %(model_version)s,
                     %(pipeline_version)s, '{}', '{"generative_fill_used": false, "requires_reshoot_warning": false}',
                     %(metadata)s, 'APPROVED', %(created_by)s, now())
                """,
                {
                    "id": asset_id,
                    "organization_id": job["organization_id"],
                    "product_id": product_id,
                    "parent_asset_id": master_asset_id,
                    "storage_key": storage_key,
                    "mime_type": asset_goc["mime_type"],
                    "provider": "smart_reframe",
                    "model": "smart_reframe",
                    "model_version": "center-crop-v1",
                    "pipeline_version": PIPELINE_VERSION,
                    "metadata": json.dumps({"job_id": job["id"], "ratio": ratio_key, "from_master": master_asset_id}),
                    "created_by": job["user_id"],
                },
            )
        conn.commit()
        ratio_storage_keys[ratio_key] = storage_key

    return ratio_storage_keys


def process_job(
    conn: psycopg.Connection,
    job: dict[str, Any],
    verifier: VisionIdentityVerifier,
    enhancer: Any,
    reframer: SmartReframe,
) -> None:
    payload = job["payload"] if isinstance(job["payload"], dict) else json.loads(job["payload"])
    organization_id = job["organization_id"]  # luật 1 — chỉ từ dòng job

    try:
        asset_id = payload["asset_id"]
        config = payload.get("config") or {}
        asset_goc = _doc_asset(conn, organization_id, asset_id)
        anh_goc = _read_bytes(asset_goc["storage_key"])
        ngu_canh = {
            "organization_id": organization_id,
            "product_id": asset_goc["product_id"],
            "asset_id": asset_id,
        }

        _set_stage(conn, job["id"], "ANALYZING")
        dau_van = verifier.phan_tich(anh_goc, ngu_canh)

        _set_stage(conn, job["id"], "ENHANCING")
        config_with_schema = dict(config)
        config_with_schema["original_analysis"] = dau_van
        active_enhancer = (
            resolve_enhancer(config_with_schema)
            if config.get("enhancer_provider")
            else enhancer
        )

        bat_dau_tang_cuong = time.monotonic()
        try:
            ket_qua_tang_cuong = active_enhancer.enhance(anh_goc, config_with_schema)
        except Exception:
            ghi_ai_request(
                conn,
                job_id=job["id"],
                organization_id=organization_id,
                capability_code="AIC-08",
                model_key=getattr(active_enhancer, "model_version", None)
                or getattr(active_enhancer, "name", "unknown"),
                outcome="FAILED",
                latency_ms=int((time.monotonic() - bat_dau_tang_cuong) * 1000),
                # Lượt hỏng vẫn bị nhà cung cấp tính tiền nếu nó đã kịp gọi
                # mô hình — bỏ nó khỏi sổ là để chi phí thật cao hơn sổ mà
                # không ai giải thích được khoảng lệch.
                **so_do_chi_phi_anh(active_enhancer),
            )
            raise
        ghi_ai_request(
            conn,
            job_id=job["id"],
            organization_id=organization_id,
            capability_code="AIC-08",
            model_key=getattr(active_enhancer, "model_version", None)
            or getattr(active_enhancer, "name", "unknown"),
            # Bộ máy tự lùi PIL khi lỗi API (`OpenAIEnhancer`) không ném lỗi
            # ra ngoài — phải đọc cờ `fallback` trong kết quả để phân biệt
            # với một lượt thật sự dùng đúng mô hình đã chọn.
            outcome=(
                "FALLBACK"
                if ket_qua_tang_cuong.get("parameters", {}).get("fallback")
                else "ACCEPTED"
            ),
            latency_ms=int((time.monotonic() - bat_dau_tang_cuong) * 1000),
            **so_do_chi_phi_anh(active_enhancer),
        )

        # Smart Reframe: tạo 4 tỷ lệ từ Master Image MỘT LẦN (M04 mục 17.3)
        _set_stage(conn, job["id"], "SMART_REFRAME")
        ratio_images = reframer.reframe(ket_qua_tang_cuong["image"])
        ratio_bytes = {k: v.image for k, v in ratio_images.items()}

        _set_stage(conn, job["id"], "VERIFYING")
        ngu_canh_verifying = dict(ngu_canh)
        ngu_canh_verifying["reference_analysis"] = dau_van
        khoi_guard = verifier.compare(dau_van, ket_qua_tang_cuong["image"], ngu_canh_verifying)
        _emit_event(conn, job["id"], "guard", khoi_guard)

        ket_qua = khoi_guard["result"]
        master_asset_id: str | None = None
        ratio_storage_keys: dict[str, str] = {}
        variant_storage_keys: dict[str, str] = {}
        variant_ratios_storage: dict[str, dict[str, str]] = {}

        if ket_qua != REJECTED:
            _set_stage(conn, job["id"], "GENERATING_OUTPUTS")
            master_asset_id = _ghi_asset_master(
                conn, job, asset_goc, ket_qua_tang_cuong["image"], khoi_guard,
                ket_qua_tang_cuong, active_enhancer,
            )
            # Ghi 4 ảnh tỷ lệ
            ratio_storage_keys = _ghi_ratio_assets(
                conn, job, asset_goc, master_asset_id, ratio_bytes, active_enhancer,
            )

            # Ghi các biến thể (Variants: Studio, Lifestyle, Bokeh) và sinh 4 tỷ lệ Smart Reframe cho từng biến thể
            variants = ket_qua_tang_cuong.get("variants") or {}
            for v_key, v_bytes in variants.items():
                v_asset_id = str(uuid.uuid4())
                v_storage_key = (
                    f"org/{job['organization_id']}/{asset_goc['product_id'] or 'unfiled'}/{v_asset_id}_var_{v_key}.jpg"
                )
                _write_bytes(v_storage_key, v_bytes)
                variant_storage_keys[v_key] = v_storage_key

                # Tạo 4 tỷ lệ Smart Reframe cho từng biến thể (bảo toàn 100% bó hoa ở các tỷ lệ 1:1, 4:5, 9:16, 16:9)
                v_reframed = reframer.reframe(v_bytes)
                v_ratio_map: dict[str, str] = {}
                for r_key, ref_img in v_reframed.items():
                    r_asset_id = str(uuid.uuid4())
                    r_storage_key = (
                        f"org/{job['organization_id']}/{asset_goc['product_id'] or 'unfiled'}/{r_asset_id}_var_{v_key}_{r_key}.jpg"
                    )
                    _write_bytes(r_storage_key, ref_img.image)
                    v_ratio_map[r_key] = r_storage_key
                variant_ratios_storage[v_key] = v_ratio_map
        else:
            _emit_event(
                conn, job["id"], "log",
                {"message": "Identity Guard từ chối — giữ ảnh gốc", "ly_do": khoi_guard["ly_do"]},
            )

        # Cập nhật job output với ratios storage_keys, variants, variant_ratios và applied_changes
        applied_changes = (
            ket_qua_tang_cuong.get("parameters", {}).get("applied_changes") or []
        )
        output_payload = {
            "master_asset_id": master_asset_id,
            "ratios": ratio_storage_keys,
            "variants": variant_storage_keys,
            "variant_ratios": variant_ratios_storage,
            "applied_changes": applied_changes,
        }

        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE generation_jobs
                   SET status = 'COMPLETED', result = %s, stage = NULL, completed_at = now(),
                       output = %s
                 WHERE id = %s
                """,
                (ket_qua, json.dumps(output_payload), job["id"]),
            )
        conn.commit()
        _emit_event(
            conn, job["id"], "done",
            {
                "status": "COMPLETED",
                "result": ket_qua,
                "master_asset_id": master_asset_id,
                "ratios": ratio_storage_keys,
                "variants": variant_storage_keys,
                "variant_ratios": variant_ratios_storage,
                "applied_changes": applied_changes,
            },
        )

    except Exception as exc:  # noqa: BLE001 — hỏng KỸ THUẬT, không phải phán quyết
        conn.rollback()
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE generation_jobs
                   SET status = 'FAILED', error = %s, stage = NULL, attempts = attempts + 1
                 WHERE id = %s
                """,
                (str(exc), job["id"]),
            )
        conn.commit()
        _emit_event(conn, job["id"], "done", {"status": "FAILED", "error": str(exc)})


def _clean_database_url(url: str) -> str:
    cleaned = url.strip().strip('"').strip("'")
    if "?" in cleaned:
        base, query = cleaned.split("?", 1)
        params = [p for p in query.split("&") if not p.startswith("schema=")]
        cleaned = f"{base}?{'&'.join(params)}" if params else base
    return cleaned


def run_worker(database_url: str, poll_interval_seconds: float = 5.0) -> None:
    from vision.providers.openai_structured import OpenAIStructuredProvider

    # MỘT instance analyzer cho cả hai lượt phân tích của mọi job — `YC-N4`
    # được bảo đảm bằng cấu trúc, xem `guard/verifier.py`.
    verifier = VisionIdentityVerifier(analyzer=OpenAIStructuredProvider())
    enhancer = resolve_enhancer()  # Đa Provider: Studio làm mặc định, kèm fallback Real-ESRGAN/PIL
    reframer = SmartReframe()  # Smart Reframe 4 tỷ lệ
    channel = notify_channel_for(FEATURE)
    video_feature = "video.render"
    video_channel = notify_channel_for(video_feature)
    variant_feature = "media.variant"
    variant_channel = notify_channel_for(variant_feature)

    cleaned_url = _clean_database_url(database_url)
    with psycopg.connect(cleaned_url, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(f"LISTEN {channel}")
            cur.execute(f"LISTEN {video_channel}")
            cur.execute(f"LISTEN {variant_channel}")

        while True:
            # Thứ tự ưu tiên là thứ tự người dùng chờ: M04a đứng trước M04b vì
            # không có Master Image thì không có biến thể nào để dựng.
            # 1. Xử lý tác vụ tối ưu ảnh M04a
            job = claim_next(conn, FEATURE)
            if job is not None:
                process_job(conn, job, verifier, enhancer, reframer)
                continue

            # 2. Xử lý tác vụ dựng biến thể marketing M04b
            variant_job = claim_next(conn, variant_feature)
            if variant_job is not None:
                from media_ai.jobs.variant_worker import process_variant_job
                process_variant_job(conn, variant_job)
                continue

            # 3. Xử lý tác vụ dựng video M04c
            video_job = claim_next(conn, video_feature)
            if video_job is not None:
                from media_ai.video.video_worker import process_video_job
                process_video_job(conn, video_job)
                continue

            for _notify in conn.notifies(timeout=poll_interval_seconds):
                break


def main() -> None:
    run_worker(os.environ["DATABASE_URL"])


if __name__ == "__main__":
    main()
