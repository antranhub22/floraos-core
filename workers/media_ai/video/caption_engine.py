"""
Caption & Subtitle Rendering Engine (M04c) — Extensible Multi-Style Typography.
Áp dụng Registry Pattern để hỗ trợ nhiều phong cách phụ đề đa dạng cho Video hoa.
Tự động ngắt dòng thông minh, căn chỉnh vị trí an toàn (Safe Zone) 1/4 dưới khung hình.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from PIL import Image, ImageDraw, ImageFont

# Danh sách đường dẫn font TrueType ưu tiên hỗ trợ đầy đủ Unicode Tiếng Việt
SYSTEM_FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/Library/Fonts/Arial Bold.ttf",
    "/Library/Fonts/Arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
]


@dataclass
class CaptionStyleConfig:
    """Cấu hình tham số đồ họa cho một phong cách phụ đề."""

    name: str
    label: str
    text_color: Tuple[int, int, int]  # RGB
    bg_color: Optional[Tuple[int, int, int, int]] = None  # RGBA
    border_color: Optional[Tuple[int, int, int, int]] = None
    border_width: int = 0
    border_radius: int = 16
    font_size_ratio: float = 0.038  # Tỷ lệ cỡ font so với chiều cao khung hình
    y_pos_ratio: float = 0.78  # Vị trí trục Y (78% chiều cao - Safe zone)
    padding_x: int = 24
    padding_y: int = 14
    has_shadow: bool = False
    shadow_color: Tuple[int, int, int, int] = (0, 0, 0, 180)
    shadow_offset: Tuple[int, int] = (2, 3)
    is_full_width: bool = False  # Trải dài toàn bộ chiều rộng (Banner)


# ==============================================================================
# CAPTION STYLES REGISTRY — Dễ dàng đăng ký và mở rộng thêm phong cách mới
# ==============================================================================
CAPTION_STYLES: Dict[str, CaptionStyleConfig] = {
    # 1. Hộp mờ hiện đại (Trending TikTok / Instagram Reels)
    "MODERN_BADGE": CaptionStyleConfig(
        name="MODERN_BADGE",
        label="Hộp mờ hiện đại",
        text_color=(255, 255, 255),
        bg_color=(15, 23, 42, 190),  # Đen slate mờ 75%
        border_color=(255, 255, 255, 35),
        border_width=1,
        border_radius=18,
        font_size_ratio=0.036,
        y_pos_ratio=0.78,
        padding_x=28,
        padding_y=14,
        has_shadow=True,
    ),
    # 2. Thanh lịch tinh tế (Hoa cưới, phong cách Hàn Quốc, thẩm mỹ cao cấp)
    "MINIMAL_ELEGANT": CaptionStyleConfig(
        name="MINIMAL_ELEGANT",
        label="Thanh lịch tinh tế",
        text_color=(255, 255, 255),
        bg_color=None,  # Không có hộp nền
        border_width=0,
        font_size_ratio=0.038,
        y_pos_ratio=0.79,
        padding_x=16,
        padding_y=8,
        has_shadow=True,
        shadow_color=(0, 0, 0, 220),
        shadow_offset=(2, 3),
    ),
    # 3. Hộp điểm nhấn Gen Z (Trẻ trung, tươi sáng, khuyến mãi)
    "HIGHLIGHT_BOX": CaptionStyleConfig(
        name="HIGHLIGHT_BOX",
        label="Hộp điểm nhấn Gen Z",
        text_color=(24, 24, 27),  # Chữ đen đậm
        bg_color=(250, 204, 21, 235),  # Vàng hoàng yến nổi bật
        border_color=(255, 255, 255, 180),
        border_width=2,
        border_radius=12,
        font_size_ratio=0.035,
        y_pos_ratio=0.77,
        padding_x=24,
        padding_y=12,
        has_shadow=True,
        shadow_color=(0, 0, 0, 100),
    ),
    # 4. Dải băng tin tức (Chuyên nghiệp, video catalog e-commerce)
    "BOTTOM_BANNER": CaptionStyleConfig(
        name="BOTTOM_BANNER",
        label="Dải băng tin tức",
        text_color=(255, 255, 255),
        bg_color=(15, 23, 42, 215),  # Dải băng xanh đen mờ sang trọng
        border_color=(244, 63, 94, 200),  # Viền trên màu hoa hồng rose
        border_width=2,
        border_radius=0,
        font_size_ratio=0.034,
        y_pos_ratio=0.82,
        padding_x=32,
        padding_y=18,
        is_full_width=True,
    ),
}


def register_caption_style(config: CaptionStyleConfig) -> None:
    """Đăng ký thêm phong cách phụ đề tùy biến mới vào Registry."""
    CAPTION_STYLES[config.name] = config


def get_caption_style(name: Optional[str]) -> Optional[CaptionStyleConfig]:
    """Lấy cấu hình phong cách phụ đề theo mã định danh."""
    if not name or name.upper() == "NONE":
        return None
    return CAPTION_STYLES.get(name.upper(), CAPTION_STYLES["MODERN_BADGE"])


def get_available_font(font_size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    """Tìm font TrueType hỗ trợ tiếng Việt, nếu không có thì fallback sang mặc định."""
    for path in SYSTEM_FONT_CANDIDATES:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, font_size)
            except Exception:
                continue
    try:
        return ImageFont.load_default(size=font_size)
    except TypeError:
        return ImageFont.load_default()


def smart_wrap_text(
    text: str, font: ImageFont.ImageFont, max_width: int, draw: ImageDraw.Draw
) -> List[str]:
    """
    Tự động ngắt dòng theo bề rộng khung hình.
    """
    words = text.strip().split()
    if not words:
        return []

    lines: List[str] = []
    current_line = []

    for word in words:
        test_line = " ".join(current_line + [word])
        bbox = draw.textbbox((0, 0), test_line, font=font)
        line_width = bbox[2] - bbox[0]

        if line_width <= max_width or not current_line:
            current_line.append(word)
        else:
            lines.append(" ".join(current_line))
            current_line = [word]

    if current_line:
        lines.append(" ".join(current_line))

    return lines


def fit_text_to_bounds(
    text: str,
    base_font_size: int,
    max_width: int,
    draw: ImageDraw.Draw,
    max_lines: int = 3,
) -> Tuple[List[str], ImageFont.ImageFont, int]:
    """
    Tự động tính cỡ font phù hợp để toàn bộ câu văn hiển thị trọn vẹn 100%
    trong tối đa max_lines dòng mà không bị cắt cụt bất kỳ từ nào.
    """
    words = text.strip().split()
    if not words:
        font = get_available_font(base_font_size)
        return [], font, base_font_size

    min_size = 22
    for font_size in range(base_font_size, min_size - 1, -2):
        font = get_available_font(font_size)
        lines = []
        cur = []
        for w in words:
            test = " ".join(cur + [w])
            bbox = draw.textbbox((0, 0), test, font=font)
            if (bbox[2] - bbox[0]) <= max_width or not cur:
                cur.append(w)
            else:
                lines.append(" ".join(cur))
                cur = [w]
        if cur:
            lines.append(" ".join(cur))

        if len(lines) <= max_lines:
            return lines, font, font_size

    font = get_available_font(min_size)
    lines = []
    cur = []
    for w in words:
        test = " ".join(cur + [w])
        bbox = draw.textbbox((0, 0), test, font=font)
        if (bbox[2] - bbox[0]) <= max_width or not cur:
            cur.append(w)
        else:
            lines.append(" ".join(cur))
            cur = [w]
    if cur:
        lines.append(" ".join(cur))
    return lines, font, min_size


def render_caption_overlay(
    size: Tuple[int, int],
    text: str,
    style_name: str = "MODERN_BADGE",
) -> Optional[Image.Image]:
    """
    Lớp phụ đề RGBA trong suốt đúng kích thước khung video (24/09/2026) — ghép
    lên video theo thời gian (không in chết vào ảnh, không bị Ken Burns phóng to).
    """
    style = get_caption_style(style_name)
    if not style or not text or not text.strip():
        return None

    clean_text = text.strip()
    w, h = size

    # Khởi tạo overlay RGBA cho các chi tiết bán trong suốt
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    base_font_size = max(26, int(h * style.font_size_ratio))
    max_text_width = int(w * 0.82)
    lines, font, font_size = fit_text_to_bounds(clean_text, base_font_size, max_text_width, draw, max_lines=3)
    if not lines:
        return None

    line_spacing = int(font_size * 0.25)
    line_bboxes = [draw.textbbox((0, 0), line, font=font) for line in lines]
    line_heights = [(bb[3] - bb[1]) for bb in line_bboxes]
    line_widths = [(bb[2] - bb[0]) for bb in line_bboxes]

    total_text_height = sum(line_heights) + line_spacing * (len(lines) - 1)
    max_line_width = max(line_widths)

    badge_w = w if style.is_full_width else max_line_width + style.padding_x * 2
    badge_h = total_text_height + style.padding_y * 2

    # Vị trí Y căn giữa theo tỷ lệ safe zone
    badge_y = int(h * style.y_pos_ratio) - badge_h // 2
    badge_x = 0 if style.is_full_width else (w - badge_w) // 2

    # 1. Vẽ hộp nền (Badge background) nếu có cấu hình
    if style.bg_color:
        badge_box = [badge_x, badge_y, badge_x + badge_w, badge_y + badge_h]
        if style.border_radius > 0:
            draw.rounded_rectangle(
                badge_box,
                radius=style.border_radius,
                fill=style.bg_color,
                outline=style.border_color,
                width=style.border_width,
            )
        else:
            draw.rectangle(
                badge_box,
                fill=style.bg_color,
                outline=style.border_color,
                width=style.border_width,
            )

    # 2. Vẽ từng dòng chữ
    current_y = badge_y + style.padding_y
    for i, line in enumerate(lines):
        lw = line_widths[i]
        line_x = (w - lw) // 2

        # Vẽ bóng đổ (Drop shadow) nếu phong cách yêu cầu
        if style.has_shadow:
            sx = line_x + style.shadow_offset[0]
            sy = current_y + style.shadow_offset[1]
            draw.text((sx, sy), line, font=font, fill=style.shadow_color)

        draw.text((line_x, current_y), line, font=font, fill=style.text_color)
        current_y += line_heights[i] + line_spacing

    return overlay


def render_caption_on_image(
    image: Image.Image,
    text: str,
    style_name: str = "MODERN_BADGE",
) -> Image.Image:
    """Vẽ phụ đề theo phong cách chỉ định lên một đối tượng ảnh PIL."""
    overlay = render_caption_overlay(image.size, text, style_name)
    if overlay is None:
        return image
    base_rgba = image.convert("RGBA")
    combined = Image.alpha_composite(base_rgba, overlay)
    return combined.convert("RGB")


SUBTITLE_MAX_CHARS = 60


def split_subtitle_chunks(text: str, max_chars: int = SUBTITLE_MAX_CHARS) -> List[str]:
    """
    Chia lời thoại thành các đoạn phụ đề ngắn (≤ ~2 dòng) theo dấu câu rồi theo
    từ — ghép lại đúng nguyên văn lời thoại (PO 24/09/2026: phụ đề = lời thoại).
    """
    import re as _re

    clean = " ".join((text or "").split())
    if not clean:
        return []
    parts = [p.strip() for p in _re.split(r"(?<=[.!?…,;:])\s+", clean) if p.strip()]
    chunks: List[str] = []
    for part in parts:
        if chunks and len(chunks[-1]) + 1 + len(part) <= max_chars:
            chunks[-1] = f"{chunks[-1]} {part}"
            continue
        if len(part) <= max_chars:
            chunks.append(part)
            continue
        cur: List[str] = []
        for word in part.split(" "):
            if cur and len(" ".join(cur + [word])) > max_chars:
                chunks.append(" ".join(cur))
                cur = [word]
            else:
                cur.append(word)
        if cur:
            chunks.append(" ".join(cur))
    return chunks


def subtitle_timeline(
    scene_texts: List[str], scene_durations: List[float], max_chars: int = SUBTITLE_MAX_CHARS
) -> List[Tuple[str, float, float]]:
    """
    Mốc (đoạn, bắt đầu, kết thúc) theo thời gian video: mỗi cảnh bắt đầu ở tổng
    thời lượng các cảnh trước; trong cảnh, mỗi đoạn chiếm phần thời gian tỉ lệ
    số ký tự — khớp nhịp đọc.
    """
    out: List[Tuple[str, float, float]] = []
    start = 0.0
    for text, dur in zip(scene_texts, scene_durations):
        chunks = split_subtitle_chunks(text, max_chars)
        total = sum(len(c) for c in chunks) or 1
        t = start
        for c in chunks:
            span = float(dur) * len(c) / total
            out.append((c, round(t, 3), round(t + span, 3)))
            t += span
        start += float(dur)
    return out




def render_caption_to_file(
    image_path: Path,
    text: str,
    out_path: Path,
    style_name: str = "MODERN_BADGE",
) -> Path:
    """
    Đọc ảnh từ đĩa, vẽ phụ đề theo phong cách, và lưu vào tệp mới.
    """
    out_path.parent.mkdir(parents=True, exist_ok=True)
    if not text or not text.strip() or style_name.upper() == "NONE":
        # Không vẽ chữ, sao chép hoặc lưu ảnh trực tiếp
        img = Image.open(image_path).convert("RGB")
        img.save(out_path, format="JPEG", quality=95)
        return out_path

    img = Image.open(image_path)
    captioned = render_caption_on_image(img, text, style_name)
    captioned.save(out_path, format="JPEG", quality=95)
    return out_path
