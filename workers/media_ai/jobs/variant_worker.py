"""Worker M04b — biến thể marketing dựng trên Master Image đã duyệt.

Cùng khuôn với `workers/media_ai/jobs/worker.py` của M04a: lấy việc qua
`claim_next` (`SELECT … FOR UPDATE SKIP LOCKED`), `organization_id` CHỈ lấy
từ dòng job, không `subprocess`, không HTTP nội bộ.

Luồng một job:

    SEGMENTING   tách chủ thể khỏi nền Master Image
    COMPOSING    ghép bối cảnh + đóng dấu thương hiệu của tiệm
    VERIFYING    ĐO lõi chủ thể so với Master  → cổng Subject Integrity
    GENERATING_OUTPUTS  ghi asset (chỉ khi KHÔNG bị từ chối)

Ba điều đã chặn bằng cấu trúc:

1. **M04b không sinh pixel mới trên bó hoa.** Chủ thể được sao chép nguyên
   khối từ Master Image; chỉ hậu cảnh là mới. Vì vậy "có giữ nguyên không"
   là một phép ĐO, và `_do_lo_chu_the` là phép đo đó. Bản trước hiển thị
   100 / 99 / 98 — ba hằng số gõ tay trong mã giao diện.

2. **Đo trên LÕI, không trên toàn chủ thể.** Viền được làm mềm có chủ đích
   (alpha feathering, light wrap) nên viền LUÔN đổi; tính cả viền vào phép
   đo là biến một bước cố ý thành một báo động giả mỗi lượt. Mặt nạ được co
   biên trước khi so.

3. **Bị từ chối thì KHÔNG ghi asset**, đúng như M04a: không có dòng `assets`
   nào thì không có đường nào để ảnh đó lọt ra qua endpoint tải về.

Worker KHÔNG ghi `usage` (`YC-U4`) — credit trừ ở phía TS lúc tạo job.
"""

from __future__ import annotations

import json
import uuid
from io import BytesIO
from pathlib import Path
from typing import Any

import numpy as np
import psycopg
from PIL import Image
from psycopg.rows import dict_row

from shared.storage import doc_bytes, ghi_bytes
from media_ai.image.brand_watermark import dong_dau
from media_ai.image.defringe import EdgeDefringer
from media_ai.image.studio_backdrop import StudioBackdropEngine
from media_ai.providers.segmentation.rembg_segmenter import RembgSegmenter

FEATURE = "media.variant"
PIPELINE_VERSION = "m04b-1"

REPO_ROOT = Path(__file__).resolve().parents[3]
STORAGE_ROOT = REPO_ROOT / "var" / "storage"

# Cùng ngưỡng với `src/modules/media/domain/variant-rules.ts`. Phía TS tính
# LẠI phán quyết từ số đo, nên hai bên lệch nhau thì phía TS thắng — ở đây
# chỉ dùng để quyết định có ghi asset hay không.
NGUONG_TU_CHOI = 0.99

RATIO_PRESETS: dict[str, tuple[int, int]] = {
    "1:1": (1024, 1024),
    "4:5": (1024, 1280),
    "9:16": (1080, 1920),
    "16:9": (1920, 1080),
}

PRESET_SANG_STUDIO_STYLE: dict[str, str] = {
    "transparent": "transparent",
    "studio_white": "clean_white",
    "wedding": "boutique_bokeh",
    "living_room": "soft_ambient",
    "wood_minimal": "wood_warm",
    "luxury_hotel": "warm_gray",
}

NHAN_PRESET: dict[str, str] = {
    "transparent": "Tách nền trong suốt (PNG)",
    "studio_white": "Studio trắng tinh khôi",
    "wedding": "Bàn tiệc cưới lãng mạn",
    "living_room": "Phòng khách thanh lịch",
    "wood_minimal": "Gỗ tối giản Bắc Âu",
    "luxury_hotel": "Sảnh khách sạn 5 sao",
}


# ─── Hạ tầng dùng chung với worker M04a ────────────────────────────────────


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


def _doc_asset(conn: psycopg.Connection, organization_id: str, asset_id: str) -> dict[str, Any]:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            SELECT id, product_id, storage_key, mime_type, version, kind, approval_state
              FROM assets
             WHERE id = %s AND organization_id = %s
            """,
            (asset_id, organization_id),
        )
        row = cur.fetchone()
        if row is None:
            raise LookupError(f"asset {asset_id} không thuộc tổ chức {organization_id}")
        return row


def _doc_thuong_hieu(
    conn: psycopg.Connection, organization_id: str
) -> tuple[bytes | None, str | None]:
    """Logo thật của tiệm và tên tiệm. Cả hai đều có thể vắng."""
    ten_tiem: str | None = None
    logo_bytes: bytes | None = None

    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("SELECT name FROM organizations WHERE id = %s", (organization_id,))
        row = cur.fetchone()
        if row:
            ten_tiem = row["name"]

        cur.execute(
            "SELECT logo_asset_id FROM brand_profiles WHERE organization_id = %s",
            (organization_id,),
        )
        ho_so = cur.fetchone()

    if ho_so and ho_so["logo_asset_id"]:
        try:
            logo_asset = _doc_asset(conn, organization_id, ho_so["logo_asset_id"])
            logo_bytes = doc_bytes(logo_asset["storage_key"], STORAGE_ROOT)
        except Exception:
            # Logo khai trong hồ sơ nhưng không đọc được: lùi về chữ, không
            # làm hỏng cả job vì một tệp thiếu.
            logo_bytes = None

    return logo_bytes, ten_tiem


# ─── Phép đo của cổng Subject Integrity ────────────────────────────────────


def _co_bien(alpha: Image.Image, buoc: int = 3) -> np.ndarray:
    """Co mặt nạ vào trong `buoc` điểm ảnh, bằng min-filter lặp.

    Dùng `ImageFilter.MinFilter` thay vì OpenCV: bước này phải chạy được cả
    trên máy chưa cài `cv2`, vì nó là cổng an toàn chứ không phải một tính
    năng phụ có thể bỏ qua.
    """
    from PIL import ImageFilter

    m = alpha
    for _ in range(buoc):
        m = m.filter(ImageFilter.MinFilter(3))
    return np.array(m) >= 250


def _do_lo_chu_the(
    master_rgb: Image.Image,
    ket_qua_rgba: Image.Image,
    alpha: Image.Image,
) -> float:
    """Tỷ lệ điểm ảnh LÕI chủ thể còn trùng khít với Master Image.

    Trả `1.0` khi lõi không đổi một điểm nào. Trả `0.0` khi không còn lõi để
    đo — không có lõi nghĩa là mặt nạ hỏng, và mặt nạ hỏng phải là từ chối
    chứ không phải một điểm số đẹp.
    """
    if ket_qua_rgba.size != master_rgb.size:
        ket_qua_rgba = ket_qua_rgba.resize(master_rgb.size, Image.LANCZOS)
    if alpha.size != master_rgb.size:
        alpha = alpha.resize(master_rgb.size, Image.LANCZOS)

    loi = _co_bien(alpha)
    tong = int(loi.sum())
    if tong == 0:
        return 0.0

    a = np.array(master_rgb.convert("RGB"), dtype=np.int16)
    b = np.array(ket_qua_rgba.convert("RGB"), dtype=np.int16)
    # Sai khác 0 tuyệt đối là chuẩn: lõi được dán nguyên khối, không qua bộ
    # lọc nào. Nới thành "gần đúng" ở đây là tự bịt mắt trước đúng loại lỗi
    # mà cổng này sinh ra để bắt.
    trung = (np.abs(a - b).max(axis=2) == 0) & loi
    return float(int(trung.sum()) / tong)


# ─── Dựng ảnh ──────────────────────────────────────────────────────────────


def _dong_khung(anh: Image.Image, ratio: str) -> Image.Image:
    """Đưa về đúng tỷ lệ bằng cách ĐỆM, không cắt.

    Cắt là cách nhanh nhất để mất mấy bông ngoài rìa hoặc cụt cuống — mà bảo
    toàn trọn bó hoa chính là điều M04b hứa. Ảnh RGBA đệm trong suốt; ảnh
    nền đặc đệm bằng màu góc trên trái, tức chính màu phông vừa ghép.
    """
    rong_dich, cao_dich = RATIO_PRESETS.get(ratio, RATIO_PRESETS["1:1"])
    ty_le = min(rong_dich / anh.width, cao_dich / anh.height)
    moi = (max(1, int(anh.width * ty_le)), max(1, int(anh.height * ty_le)))
    vua = anh.resize(moi, Image.LANCZOS)

    if anh.mode == "RGBA":
        khung = Image.new("RGBA", (rong_dich, cao_dich), (0, 0, 0, 0))
    else:
        khung = Image.new("RGB", (rong_dich, cao_dich), anh.convert("RGB").getpixel((0, 0)))

    khung.paste(vua, ((rong_dich - moi[0]) // 2, (cao_dich - moi[1]) // 2), vua if anh.mode == "RGBA" else None)
    return khung


def _sang_bytes(anh: Image.Image) -> tuple[bytes, str, str]:
    """Trả (bytes, mime, đuôi). PNG khi còn kênh alpha, JPEG khi không."""
    buf = BytesIO()
    if anh.mode == "RGBA":
        anh.save(buf, format="PNG")
        return buf.getvalue(), "image/png", "png"
    anh.convert("RGB").save(buf, format="JPEG", quality=92)
    return buf.getvalue(), "image/jpeg", "jpg"


def dung_bien_the(
    master_bytes: bytes,
    preset: str,
    ratio: str,
    watermark: bool,
    logo_bytes: bytes | None,
    ten_tiem: str | None,
) -> tuple[list[dict[str, Any]], float]:
    """Dựng danh sách biến thể và đo lõi chủ thể.

    Tách khỏi `process_variant_job` để chạy được trong test mà không cần
    Postgres — cùng lý do `optimization-rules.ts` không import Prisma.
    """
    master_rgb = Image.open(BytesIO(master_bytes)).convert("RGB")

    rgba, alpha = RembgSegmenter(model_name="bria-rmbg").extract_subject(master_rgb)
    rgba = EdgeDefringer(inpaint_radius=3, solid_threshold=245).defringe(rgba)

    engine = StudioBackdropEngine()
    style = PRESET_SANG_STUDIO_STYLE.get(preset, "warm_gray")

    bien_the: list[dict[str, Any]] = []

    # 1. Tách nền trong suốt — luôn có. Đây là bản mà người bán đem đi ghép
    #    vào bất cứ đâu, nên nó không bao giờ bị watermark che.
    bien_the.append(
        {
            "key": "transparent",
            "title": "Tách nền trong suốt (PNG)",
            "background": "Trong suốt (Alpha)",
            "image": _dong_khung(rgba, ratio),
            "watermark": False,
            "generative_fill_used": False,
        }
    )

    # 2. Bối cảnh đã chọn. Bỏ qua khi người dùng chọn chính "trong suốt" —
    #    dựng hai bản giống hệt nhau chỉ để đủ số lượng là làm phiền người xem.
    anh_boi_canh: Image.Image | None = None
    if style != "transparent":
        anh_boi_canh = engine.composite(
            rgba, style=style, with_shadow=True, with_light_wrap=True
        )
        bien_the.append(
            {
                "key": "styled",
                "title": NHAN_PRESET.get(preset, "Bối cảnh studio"),
                "background": NHAN_PRESET.get(preset, "Bối cảnh studio"),
                "image": _dong_khung(anh_boi_canh, ratio),
                "watermark": False,
                "generative_fill_used": True,
            }
        )

    # 3. Bản đóng dấu — chỉ khi người dùng bật VÀ tiệm có gì để đóng.
    if watermark and (logo_bytes or ten_tiem):
        nguon = anh_boi_canh if anh_boi_canh is not None else rgba
        da_dong = dong_dau(nguon, logo_bytes, ten_tiem)
        bien_the.append(
            {
                "key": "branded",
                "title": "Bản đóng dấu thương hiệu",
                "background": NHAN_PRESET.get(preset, "Bối cảnh studio"),
                "image": _dong_khung(da_dong, ratio),
                "watermark": True,
                "generative_fill_used": anh_boi_canh is not None,
            }
        )

    # Đo trên bản bối cảnh nếu có (nó đi qua NHIỀU bước xử lý nhất), ngược
    # lại đo trên bản tách nền. Đo bản dễ nhất rồi báo cáo cho cả lượt là
    # cách một cổng an toàn trở thành hình thức.
    de_do = anh_boi_canh if anh_boi_canh is not None else rgba
    do_trung = _do_lo_chu_the(master_rgb, de_do, alpha)

    return bien_the, do_trung


# ─── Vòng đời một job ──────────────────────────────────────────────────────


def _ghi_asset_bien_the(
    conn: psycopg.Connection,
    job: dict[str, Any],
    master: dict[str, Any],
    item: dict[str, Any],
    ratio: str,
    preset: str,
    do_trung: float,
) -> str:
    data, mime, duoi = _sang_bytes(item["image"])
    asset_id = str(uuid.uuid4())
    product_id = master["product_id"]
    storage_key = (
        f"org/{job['organization_id']}/{product_id or 'unfiled'}/{asset_id}_m04b_{item['key']}.{duoi}"
    )
    ghi_bytes(storage_key, data, mime, STORAGE_ROOT)

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO assets
                (id, organization_id, product_id, parent_asset_id, kind, state, version,
                 storage_key, mime_type, width, height, aspect_ratio, file_size,
                 provider, model, model_version, pipeline_version,
                 parameters, identity_score, generated_flags, metadata,
                 approval_state, created_by, created_at)
            VALUES
                (%(id)s, %(organization_id)s, %(product_id)s, %(parent_asset_id)s,
                 'MARKETING', 'READY', 1,
                 %(storage_key)s, %(mime_type)s, %(width)s, %(height)s, %(aspect_ratio)s, %(file_size)s,
                 %(provider)s, %(model)s, %(model_version)s, %(pipeline_version)s,
                 %(parameters)s, %(identity_score)s, %(generated_flags)s, %(metadata)s,
                 'PENDING', %(created_by)s, now())
            """,
            {
                "id": asset_id,
                "organization_id": job["organization_id"],
                "product_id": product_id,
                # Phả hệ trỏ về Master, không về ảnh gốc: biến thể là con của
                # bản đã duyệt, và đó là thứ khiến `listDerivedFrom` đọc đúng.
                "parent_asset_id": master["id"],
                "storage_key": storage_key,
                "mime_type": mime,
                "width": item["image"].width,
                "height": item["image"].height,
                "aspect_ratio": ratio,
                "file_size": len(data),
                "provider": "m04b_studio",
                "model": "rembg+studio_backdrop",
                "model_version": "bria-rmbg-v1",
                "pipeline_version": PIPELINE_VERSION,
                "parameters": json.dumps(
                    {"preset": preset, "ratio": ratio, "watermark": item["watermark"]}
                ),
                "identity_score": do_trung,
                "generated_flags": json.dumps(
                    {
                        "generative_fill_used": item["generative_fill_used"],
                        "requires_reshoot_warning": False,
                    }
                ),
                "metadata": json.dumps(
                    {
                        "job_id": job["id"],
                        "variant_key": item["key"],
                        "title": item["title"],
                        "background": item["background"],
                        "ratio": ratio,
                        "preset": preset,
                        "watermark": item["watermark"],
                        "source_master_asset_id": master["id"],
                        "subject_pixel_identity": do_trung,
                    }
                ),
                "created_by": job["user_id"],
            },
        )
    conn.commit()
    return asset_id


def process_variant_job(conn: psycopg.Connection, job: dict[str, Any]) -> None:
    payload = job["payload"] if isinstance(job["payload"], dict) else json.loads(job["payload"])
    organization_id = job["organization_id"]  # luật 1 — chỉ từ dòng job

    try:
        master_asset_id = payload["master_asset_id"]
        preset = payload.get("preset") or "studio_white"
        ratio = payload.get("ratio") or "1:1"
        watermark = bool(payload.get("watermark", True))

        master = _doc_asset(conn, organization_id, master_asset_id)
        # Lớp chặn thứ hai. Phía TS đã kiểm ở `request-variants.ts`; kiểm lại
        # ở đây vì hàng đợi có thể nhận job từ một đường ghi khác trong tương
        # lai, và cổng 2 của M04a là thứ không được có đường vòng.
        if master["kind"] != "MASTER" or master["approval_state"] != "APPROVED":
            raise ValueError(
                "Biến thể chỉ dựng được trên Master Image đã duyệt "
                f"(nhận kind={master['kind']}, approval_state={master['approval_state']})"
            )

        _set_stage(conn, job["id"], "SEGMENTING")
        master_bytes = doc_bytes(master["storage_key"], STORAGE_ROOT)
        logo_bytes, ten_tiem = _doc_thuong_hieu(conn, organization_id)

        _set_stage(conn, job["id"], "COMPOSING")
        bien_the, do_trung = dung_bien_the(
            master_bytes, preset, ratio, watermark, logo_bytes, ten_tiem
        )

        _set_stage(conn, job["id"], "VERIFYING")
        bi_tu_choi = do_trung < NGUONG_TU_CHOI
        khoi_do = {
            "subject_pixel_identity": do_trung,
            "generative_fill_used": any(b["generative_fill_used"] for b in bien_the),
            "source_master_asset_id": master["id"],
            "ly_do": (
                []
                if not bi_tu_choi
                else [
                    "Lõi chủ thể đã bị thay đổi trong lúc ghép bối cảnh — "
                    f"chỉ còn {do_trung:.4f} trùng khít với Master Image"
                ]
            ),
        }
        _emit_event(conn, job["id"], "variant_integrity", khoi_do)

        asset_ids: list[str] = []
        if bi_tu_choi:
            ket_qua = "REJECTED"
            _emit_event(
                conn,
                job["id"],
                "log",
                {"message": "Subject Integrity từ chối — không ghi biến thể nào", "ly_do": khoi_do["ly_do"]},
            )
        else:
            ket_qua = "WARNING" if do_trung < 0.999 else "SAFE"
            _set_stage(conn, job["id"], "GENERATING_OUTPUTS")
            for item in bien_the:
                asset_ids.append(
                    _ghi_asset_bien_the(conn, job, master, item, ratio, preset, do_trung)
                )

        output_payload = {
            "master_asset_id": master["id"],
            "variant_asset_ids": asset_ids,
            "preset": preset,
            "ratio": ratio,
            "watermark": watermark,
            "subject_pixel_identity": do_trung,
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
            conn,
            job["id"],
            "done",
            {"status": "COMPLETED", "result": ket_qua, **output_payload},
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
