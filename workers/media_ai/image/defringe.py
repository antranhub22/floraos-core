"""Edge Defringer & Color Decontaminator — Khử viền ám màu nền cũ cho ảnh bóc tách RGBA.

Khi bóc tách chủ thể bằng AI matting (rembg), các pixel bán trong suốt ở đường biên (0 < alpha < 250)
thường bị lưu giữ sắc màu của phông nền cũ (ví dụ: rèm cửa xanh xám, tường gạch...).
Module này áp dụng giải thuật Color Decontamination để lan truyền màu sắc thuần khiết
từ bên trong chủ thể (alpha >= 250) ra các pixel viền, giúp chủ thể hòa nhập 100% tự nhiên
vào bất kỳ phông nền Studio mới nào mà không để lại quầng viền khó chịu.
"""

from __future__ import annotations

import numpy as np
from PIL import Image


class EdgeDefringer:
    """Khử viền ám màu (Defringing / Color Decontamination) trên kênh Alpha."""

    def __init__(self, inpaint_radius: int = 3, solid_threshold: int = 248) -> None:
        self.inpaint_radius = inpaint_radius
        self.solid_threshold = solid_threshold

    def defringe(self, rgba_image: Image.Image) -> Image.Image:
        """Khử sạch màu phông cũ bám ở dải viền chuyển tiếp của ảnh RGBA."""
        try:
            import cv2

            if rgba_image.mode != "RGBA":
                return rgba_image

            rgba_np = np.array(rgba_image)
            rgb = rgba_np[:, :, :3].copy()
            alpha = rgba_np[:, :, 3].copy()

            # Vùng viền chuyển tiếp cần khử màu: có độ trong suốt nhưng lớn hơn 0
            fringe_mask = ((alpha > 0) & (alpha < self.solid_threshold)).astype(np.uint8) * 255

            if np.sum(fringe_mask > 0) == 0:
                return rgba_image

            # Lan truyền màu thuần từ vùng đặc (alpha >= solid_threshold) ra vùng viền
            bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
            decontaminated_bgr = cv2.inpaint(
                bgr, fringe_mask, self.inpaint_radius, cv2.INPAINT_TELEA
            )
            decontaminated_rgb = cv2.cvtColor(decontaminated_bgr, cv2.COLOR_BGR2RGB)

            clean_rgba = np.dstack((decontaminated_rgb, alpha))
            return Image.fromarray(clean_rgba, mode="RGBA")
        except Exception:
            return rgba_image
