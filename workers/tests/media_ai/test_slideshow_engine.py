"""
Kiểm thử bộ Slideshow Engine (M04c) thu hoạch từ SocialFlow.
"""

from pathlib import Path
import pytest

from media_ai.video.slideshow_engine import (
    FRAME_RESOLUTIONS,
    build_ffmpeg_command,
    is_ffmpeg_available,
    SlideshowError,
)


def test_ffmpeg_command_structure():
    images = [Path("/tmp/img1.png"), Path("/tmp/img2.png"), Path("/tmp/img3.png")]
    out = Path("/tmp/video.mp4")

    cmd = build_ffmpeg_command(images, out, aspect_ratio="9:16", total_duration=15)
    joined = " ".join(cmd)

    # 1. Mỗi ảnh có input riêng
    assert cmd.count("-i") == 3

    # 2. Scale và zoompan đúng độ phân giải 9:16
    w, h = FRAME_RESOLUTIONS["9:16"]
    assert f"s={w}x{h}" in joined
    assert "zoompan" in joined

    # 3. Chuyển cảnh xfade mượt mà
    assert joined.count("xfade") == 2
    assert "[v_out]" in joined

    # 4. Codec chuẩn libx264 + yuv420p + faststart
    assert "libx264" in joined
    assert "yuv420p" in joined
    assert "+faststart" in joined


def test_ffmpeg_command_single_image():
    images = [Path("/tmp/single.png")]
    out = Path("/tmp/single.mp4")

    cmd = build_ffmpeg_command(images, out, aspect_ratio="1:1", total_duration=5)
    joined = " ".join(cmd)

    # 1 ảnh thì không cần xfade
    assert cmd.count("-i") == 1
    assert "xfade" not in joined
    assert "zoompan" in joined
    w, h = FRAME_RESOLUTIONS["1:1"]
    assert f"s={w}x{h}" in joined


def test_ffmpeg_command_with_audio():
    images = [Path("/tmp/img1.png"), Path("/tmp/img2.png")]
    audio = Path(__file__)  # Dùng file có thật để pass is_file()
    out = Path("/tmp/video.mp4")

    cmd = build_ffmpeg_command(
        images, out, aspect_ratio="16:9", total_duration=10, audio_path=audio
    )
    joined = " ".join(cmd)

    # Thêm input audio
    assert cmd.count("-i") == 3
    assert "-shortest" in joined
    assert "aac" in joined


def test_empty_images_raises_error():
    with pytest.raises(SlideshowError, match="Cần ít nhất 1 ảnh"):
        build_ffmpeg_command([], Path("/tmp/out.mp4"))
