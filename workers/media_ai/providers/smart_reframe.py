"""Smart Reframe — Tạo 4 tỷ lệ từ Master Image MỘT LẦN.

Không gọi lại AI. Chỉ crop/fit thông minh từ ảnh đã tăng cường.
4 tỷ lệ chuẩn (M04 mục 17.3):
  - 1:1      vuông (Instagram post, catalog grid)
  - 4:5      dọc nhẹ (Instagram portrait)
  - 9:16     dọc full (Reels, Stories, TikTok)
  - 16:9     ngang (YouTube thumbnail, web banner)

Logic bảo toàn chủ thể (Subject Preservation):
  - Khi tỷ lệ ảnh gốc và tỷ lệ đích gần nhau (chênh lệch < 8%):
    Crop nhẹ rìa để đạt tỷ lệ toàn màn hình (full-bleed).
  - Khi tỷ lệ lệch nhau (như 16:9 hoặc 9:16):
    Bảo toàn 100% chủ thể bằng Fit & Studio Canvas Extension (Ambiance Pad),
    giữ trọn vẹn từng bông hoa, cành lá, nơ và giấy gói ở trung tâm,
    khoảng đệm mở rộng bằng phông nền Studio Ambiance mịn màng.
"""

from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO

from PIL import Image, ImageFilter

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
    model_version = "studio-ambiance-fit-v1"

    def reframe(self, master_image: bytes) -> dict[str, ReframedImage]:
        """Trả về dict ratio_key -> ReframedImage cho 4 tỷ lệ chuẩn."""
        img = Image.open(BytesIO(master_image))
        if img.mode != "RGB":
            img = img.convert("RGB")

        results: dict[str, ReframedImage] = {}

        for ratio_key, (rw, rh) in RATIO_PRESETS.items():
            target_w = TARGET_WIDTHS[ratio_key]
            target_h = int(target_w * rh / rw)

            reframed_img = self._render_studio_ambiance_fit(img, target_w, target_h)

            buf = BytesIO()
            reframed_img.save(buf, format="JPEG", quality=90)
            results[ratio_key] = ReframedImage(
                ratio=ratio_key,
                image=buf.getvalue(),
                width=target_w,
                height=target_h,
            )

        return results

    def _render_studio_ambiance_fit(
        self, img: Image.Image, target_w: int, target_h: int
    ) -> Image.Image:
        """Tạo ảnh theo tỷ lệ mục tiêu bảo toàn 100% chủ thể với Studio Canvas Extension."""
        orig_w, orig_h = img.size
        orig_ratio = orig_w / orig_h
        target_ratio = target_w / target_h

        # Nếu tỷ lệ rất gần nhau (chênh lệch < 8%), crop nhẹ với Smart Floral Framing
        ratio_diff = abs(orig_ratio - target_ratio) / target_ratio
        if ratio_diff < 0.08:
            crop_w, crop_h = self._compute_crop_box(orig_w, orig_h, target_w, target_h)
            left = (orig_w - crop_w) // 2
            # Smart Floral Framing: ưu tiên giữ đỉnh hoa và nơ ruy băng ở điểm vàng thị giác,
            # cắt bớt phần cánh tay dài ở mép đáy thay vì crop đều 50-50
            top = max(0, int((orig_h - crop_h) * 0.25))
            if top + crop_h > orig_h:
                top = orig_h - crop_h
            cropped = img.crop((left, top, left + crop_w, top + crop_h))
            return cropped.resize((target_w, target_h), Image.LANCZOS)

        # Ngược lại: bảo toàn 100% chủ thể bằng Studio Ambiance Extension với viền mềm (Feathering)
        # Fit scale: dành 92% khung hình để chủ thể thở và không chạm sát viền
        padding_factor = 0.92
        scale = min(
            (target_w * padding_factor) / orig_w,
            (target_h * padding_factor) / orig_h,
        )
        sharp_w = max(1, int(orig_w * scale))
        sharp_h = max(1, int(orig_h * scale))
        foreground = img.resize((sharp_w, sharp_h), Image.LANCZOS)

        # Lấy mẫu màu sắc chính xác từ 3 cạnh mép (trên, trái, phải) của ảnh gốc
        import numpy as np
        arr = np.array(img)
        border_pixels = np.concatenate([
            arr[:15, :].reshape(-1, 3),
            arr[:, :15].reshape(-1, 3),
            arr[:, -15:].reshape(-1, 3),
        ], axis=0)
        edge_color = tuple(np.median(border_pixels, axis=0).astype(int))

        # Lớp nền: Tạo canvas có màu nền đồng nhất với rìa ảnh gốc
        bg = Image.new("RGB", (target_w, target_h), edge_color)
        bg_blur = img.resize((target_w, target_h), Image.BILINEAR).filter(ImageFilter.GaussianBlur(radius=60))
        bg = Image.blend(bg, bg_blur, 0.15)

        # Tạo mặt nạ chuyển tiếp viền mềm (Alpha Feathering 32px) để loại bỏ hoàn toàn góc cạnh chữ nhật
        feather_size = min(36, max(8, sharp_w // 15), max(8, sharp_h // 15))
        mask_arr = np.ones((sharp_h, sharp_w), dtype=float)
        for i in range(feather_size):
            factor = i / float(feather_size)
            mask_arr[i, :] = np.minimum(mask_arr[i, :], factor)
            mask_arr[sharp_h - 1 - i, :] = np.minimum(mask_arr[sharp_h - 1 - i, :], factor)
            mask_arr[:, i] = np.minimum(mask_arr[:, i], factor)
            mask_arr[:, sharp_w - 1 - i] = np.minimum(mask_arr[:, sharp_w - 1 - i], factor)
        feather_mask = Image.fromarray((mask_arr * 255).astype(np.uint8), mode="L")

        # Dán foreground hòa tan mềm mại vào nền canvas
        paste_x = (target_w - sharp_w) // 2
        paste_y = (target_h - sharp_h) // 2
        bg.paste(foreground, (paste_x, paste_y), feather_mask)

        return bg

    def _compute_crop_box(
        self, orig_w: int, orig_h: int, target_w: int, target_h: int
    ) -> tuple[int, int]:
        """Tính kích thước crop box trong ảnh gốc để đạt tỷ lệ mục tiêu."""
        orig_ratio = orig_w / orig_h
        target_ratio = target_w / target_h

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