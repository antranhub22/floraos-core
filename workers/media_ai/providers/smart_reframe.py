"""Smart Reframe — Tạo 4 tỷ lệ từ Master Image MỘT LẦN.

Không gọi lại AI. Chỉ crop/resize thông minh từ ảnh đã tăng cường.
4 tỷ lệ chuẩn (M04 mục 17.3):
  - 1:1      vuông (Instagram post, catalog grid)
  - 4:5      dọc nhẹ (Instagram portrait)
  - 9:16     dọc full (Reels, Stories, TikTok)
  - 16:9     ngang (YouTube thumbnail, web banner)

Logic: phát hiện vùng quan trọng (sản phẩm) → crop giữ vùng đó ở giữa → resize.
Hiện tại dùng crop trung tâm đơn giản; có thể nâng cấp bằng saliency detection sau.
"""

from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from typing import Literal

from PIL import Image

RATIO_PRESETS: dict[str, tuple[int, int]] = {
    "1:1": (1, 1),
    "4:5": (4, 5),
    "9:16": (9, 16),
    "16:9": (16, 9),
}

TARGET_WIDTHS: dict[str, int] = {
    "1:1": 1024,
    "4:5": 1024,
    "9:16": 1080,
    "16:9": 1920,
}


@dataclass
class ReframedImage:
    ratio: str
    image: bytes
    width: int
    height: int


class SmartReframe:
    """Tạo 4 tỷ lệ từ một ảnh master. Không có state, có thể dùng chung."""

    name = "smart_reframe"
    model_version = "center-crop-v1"

    def reframe(self, master_image: bytes) -> dict[str, ReframedImage]:
        """Trả về dict ratio_key -> ReframedImage cho 4 tỷ lệ chuẩn."""
        img = Image.open(BytesIO(master_image))
        original_w, original_h = img.size

        results: dict[str, ReframedImage] = {}

        for ratio_key, (rw, rh) in RATIO_PRESETS.items():
            target_w = TARGET_WIDTHS[ratio_key]
            target_h = int(target_w * rh / rw)

            # Tính crop box để đạt tỷ lệ rw:rh, giữ vùng trung tâm
            crop_w, crop_h = self._compute_crop_box(original_w, original_h, rw, rh)
            left = (original_w - crop_w) // 2
            top = (original_h - crop_h) // 2
            right = left + crop_w
            bottom = top + crop_h

            cropped = img.crop((left, top, right, bottom))
            resized = cropped.resize((target_w, target_h), Image.LANCZOS)

            buf = BytesIO()
            resized.save(buf, format="JPEG", quality=90)
            results[ratio_key] = ReframedImage(
                ratio=ratio_key,
                image=buf.getvalue(),
                width=target_w,
                height=target_h,
            )

        return results

    def _compute_crop_box(
        self, orig_w: int, orig_h: int, target_rw: int, target_rh: int
    ) -> tuple[int, int]:
        """Tính kích thước crop box trong ảnh gốc để đạt tỷ lệ mục tiêu."""
        orig_ratio = orig_w / orig_h
        target_ratio = target_rw / target_rh

        if orig_ratio > target_ratio:
            # Ảnh gốc rộng hơn → crop chiều ngang
            crop_h = orig_h
            crop_w = int(orig_h * target_ratio)
        else:
            # Ảnh gốc cao hơn → crop chiều dọc
            crop_w = orig_w
            crop_h = int(orig_w / target_ratio)

        return crop_w, crop_h


def reframe_to_ratios(master_image: bytes) -> dict[str, bytes]:
    """Hàm tiện ích: trả về dict ratio_key -> bytes."""
    reframer = SmartReframe()
    reframed = reframer.reframe(master_image)
    return {k: v.image for k, v in reframed.items()}