"""
Unit tests for caption_engine.py — Multi-Style Caption & Subtitle System.
"""

import tempfile
from pathlib import Path
from PIL import Image

from media_ai.video.caption_engine import (
    CAPTION_STYLES,
    CaptionStyleConfig,
    get_caption_style,
    register_caption_style,
    render_caption_on_image,
    render_caption_to_file,
    smart_wrap_text,
    get_available_font,
)


def test_caption_styles_registry():
    """Kiểm tra Registry phong cách có đủ 4 phong cách chính."""
    assert "MODERN_BADGE" in CAPTION_STYLES
    assert "MINIMAL_ELEGANT" in CAPTION_STYLES
    assert "HIGHLIGHT_BOX" in CAPTION_STYLES
    assert "BOTTOM_BANNER" in CAPTION_STYLES

    assert get_caption_style("NONE") is None
    assert get_caption_style("non_existent").name == "MODERN_BADGE"


def test_register_custom_caption_style():
    """Kiểm tra khả năng mở rộng thêm phong cách tùy biến mới."""
    custom = CaptionStyleConfig(
        name="NEON_CYBER",
        label="Neon rực rỡ",
        text_color=(0, 255, 255),
        bg_color=(0, 0, 0, 200),
    )
    register_caption_style(custom)
    retrieved = get_caption_style("NEON_CYBER")
    assert retrieved is not None
    assert retrieved.name == "NEON_CYBER"
    assert retrieved.text_color == (0, 255, 255)


def test_smart_wrap_text():
    """Kiểm tra ngắt dòng thông minh với văn bản tiếng Việt."""
    font = get_available_font(32)
    img = Image.new("RGB", (800, 600), (255, 255, 255))
    from PIL import ImageDraw
    draw = ImageDraw.Draw(img)

    text = "Bó hoa hồng đỏ Ecuador phối baby trắng tinh tế giao hỏa tốc 2h"
    lines = smart_wrap_text(text, font, max_width=400, draw=draw)
    assert len(lines) >= 1
    assert len(lines) <= 4


def test_fit_text_to_bounds():
    """Kiểm tra tính năng tự động co giãn font hiển thị trọn vẹn 100% chữ."""
    from media_ai.video.caption_engine import fit_text_to_bounds
    img = Image.new("RGB", (800, 600), (255, 255, 255))
    from PIL import ImageDraw
    draw = ImageDraw.Draw(img)

    text = "Bó hoa hồng đỏ Ecuador phối baby trắng tinh tế giao hỏa tốc 2h"
    lines, font, sz = fit_text_to_bounds(text, base_font_size=40, max_width=400, draw=draw, max_lines=3)
    assert len(lines) <= 3
    assert "Ecuador" in " ".join(lines)
    assert "2h" in " ".join(lines)


def test_render_caption_all_styles():
    """Kiểm tra render ảnh cho từng phong cách không phát sinh lỗi."""
    base_img = Image.new("RGB", (1080, 1920), (100, 150, 200))
    sample_text = "Hoa Tươi Đà Lạt Rực Rỡ Đón Nắng Mới"

    for style_key in ["MODERN_BADGE", "MINIMAL_ELEGANT", "HIGHLIGHT_BOX", "BOTTOM_BANNER"]:
        result = render_caption_on_image(base_img, sample_text, style_name=style_key)
        assert result.size == (1080, 1920)
        assert result.mode == "RGB"


def test_render_caption_to_file():
    """Kiểm tra render ra file JPEG thành công."""
    with tempfile.TemporaryDirectory() as tmpdir:
        input_file = Path(tmpdir) / "input.jpg"
        output_file = Path(tmpdir) / "output.jpg"

        img = Image.new("RGB", (1080, 1920), (200, 100, 100))
        img.save(input_file, format="JPEG")

        res = render_caption_to_file(
            input_file,
            "Thiết kế hoa nghệ thuật sang trọng",
            output_file,
            style_name="MODERN_BADGE",
        )
        assert res.is_file()
        assert res.stat().st_size > 0
