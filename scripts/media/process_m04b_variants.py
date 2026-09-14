"""AI Studio Pipeline — Bóc tách & ghép bối cảnh M04b chất lượng cao (Production Grade).

Sử dụng Rembg U2-Net deep learning model kết hợp EdgeDefringer (khử viền halo bằng OpenCV inpainting)
và StudioBackdropEngine (sinh bóng đổ tiếp xúc tự nhiên và bối cảnh ánh sáng thương mại).
"""

from __future__ import annotations

import base64
import io
import json
import os
import sys
import urllib.request

# Đảm bảo đường dẫn import tới workers
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))
WORKERS_DIR = os.path.join(PROJECT_ROOT, "workers")
if WORKERS_DIR not in sys.path:
    sys.path.insert(0, WORKERS_DIR)

from PIL import Image, ImageDraw, ImageFont  # noqa: E402
from media_ai.image.defringe import EdgeDefringer  # noqa: E402
from media_ai.image.studio_backdrop import StudioBackdropEngine  # noqa: E402
from media_ai.providers.segmentation.rembg_segmenter import RembgSegmenter  # noqa: E402


def load_input_image(payload: dict) -> Image.Image:
    """Nạp ảnh từ base64, đường dẫn tệp cục bộ hoặc URL."""
    if payload.get("image_base64"):
        b64_str = payload["image_base64"]
        if "," in b64_str:
            b64_str = b64_str.split(",", 1)[1]
        raw_bytes = base64.b64decode(b64_str)
        return Image.open(io.BytesIO(raw_bytes)).convert("RGB")

    if payload.get("image_path"):
        path = payload["image_path"]
        if not os.path.isabs(path):
            path = os.path.join(PROJECT_ROOT, path)
        return Image.open(path).convert("RGB")

    if payload.get("image_url"):
        url = payload["image_url"]
        if url.startswith("data:image"):
            b64_str = url.split(",", 1)[1]
            raw_bytes = base64.b64decode(b64_str)
            return Image.open(io.BytesIO(raw_bytes)).convert("RGB")

        # Tải từ local storage URL ví dụ /api/v1/storage/...
        if url.startswith("/api/v1/storage/"):
            key = url.replace("/api/v1/storage/", "")
            local_path = os.path.join(PROJECT_ROOT, "var", "storage", key)
            if os.path.exists(local_path):
                return Image.open(local_path).convert("RGB")

        # Tải từ web URL
        req = urllib.request.Request(url, headers={"User-Agent": "FloraOS-AI/1.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            return Image.open(io.BytesIO(resp.read())).convert("RGB")

    raise ValueError("Không tìm thấy nguồn ảnh hợp lệ trong payload")


def pil_to_base64(img: Image.Image, format_name: str = "PNG", quality: int = 92) -> str:
    """Chuyển PIL image thành data URL base64."""
    buf = io.BytesIO()
    if format_name.upper() == "JPEG":
        if img.mode != "RGB":
            img = img.convert("RGB")
        img.save(buf, format="JPEG", quality=quality)
        mime = "image/jpeg"
    else:
        if img.mode != "RGBA":
            img = img.convert("RGBA")
        img.save(buf, format="PNG")
        mime = "image/png"
    encoded = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:{mime};base64,{encoded}"


def draw_watermark(img: Image.Image, shop_name: str = "FloraOS Tiệm Hoa") -> Image.Image:
    """Vẽ watermark thương hiệu bán trong suốt ở góc dưới phải."""
    out = img.convert("RGBA")
    w, h = out.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    badge_w, badge_h = 180, 36
    x = w - badge_w - 24
    y = h - badge_h - 24

    # Nền frosted pill bo tròn
    draw.rounded_rectangle(
        [x, y, x + badge_w, y + badge_h],
        radius=18,
        fill=(15, 23, 42, 200),
        outline=(255, 255, 255, 60),
        width=1,
    )
    # Text
    draw.text((x + 14, y + 9), "🌸", fill=(255, 255, 255, 255))
    draw.text((x + 36, y + 10), shop_name, fill=(248, 250, 252, 240))

    return Image.alpha_composite(out, overlay)


def map_preset_to_studio_style(preset_id: str) -> str:
    """Ánh xạ mã preset M04b sang style của StudioBackdropEngine."""
    mapping = {
        "wood_minimal": "wood_warm",
        "studio_white": "clean_white",
        "wedding": "boutique_bokeh",
        "living_room": "soft_ambient",
        "luxury_hotel": "warm_gray",
        "transparent": "transparent",
    }
    return mapping.get(preset_id, "warm_gray")


def main():
    try:
        input_data = sys.stdin.read()
        if not input_data.strip():
            print(json.dumps({"ok": False, "error": "Empty input"}))
            sys.exit(1)

        payload = json.loads(input_data)
        source_img = load_input_image(payload)

        # 1. Bóc tách chủ thể bằng bria-rmbg (chuẩn e-commerce bảo toàn cuống hoa & chi tiết mảnh)
        try:
            segmenter = RembgSegmenter(model_name="bria-rmbg")
            rgba_raw, _ = segmenter.extract_subject(source_img)
        except Exception:
            segmenter = RembgSegmenter(model_name="u2net")
            rgba_raw, _ = segmenter.extract_subject(source_img)

        # 2. Khử viền ám màu phông cũ (De-fringing)
        defringer = EdgeDefringer(inpaint_radius=3, solid_threshold=245)
        rgba_clean = defringer.defringe(rgba_raw)

        # 3. Ghép bối cảnh Studio chất lượng cao
        engine = StudioBackdropEngine()
        preset_id = payload.get("preset", "wood_minimal")
        studio_style = map_preset_to_studio_style(preset_id)

        # A. Biến thể 1: Tách nền trong suốt
        b64_transparent = pil_to_base64(rgba_clean, "PNG")

        # B. Biến thể 2: Phông nền Studio theo preset (Bảo toàn 100% cuống hoa, không cắt cụt đáy)
        if studio_style == "transparent":
            img_preset = rgba_clean
        else:
            img_preset = engine.composite(rgba_clean, style=studio_style, with_arm_fadeout=False)
        b64_preset = pil_to_base64(img_preset, "JPEG", quality=92)

        # C. Biến thể 3: Đa kênh kèm Watermark
        shop_name = payload.get("shop_name", "FloraOS Tiệm Hoa")
        img_social = draw_watermark(img_preset, shop_name)
        b64_social = pil_to_base64(img_social, "JPEG", quality=92)

        result = {
            "ok": True,
            "variants": {
                "transparent": b64_transparent,
                "preset": b64_preset,
                "social": b64_social,
            },
        }
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
