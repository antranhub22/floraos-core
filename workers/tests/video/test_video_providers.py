"""
Kiểm thử bộ Video Providers (Phương án A & Phương án B Standby) — M04c.
"""

from __future__ import annotations

import tempfile
from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest

from media_ai.video.providers import (
    get_video_provider,
    LocalCinematicProvider,
    GoogleVeoProvider,
    HeyGenProvider,
)
from media_ai.video.slideshow_engine import build_motion_filter, build_ffmpeg_command


def test_get_video_provider_factory():
    """Kiểm tra Factory trả về đúng provider tương ứng."""
    # Mặc định là LocalCinematicProvider (Phương án A)
    p_default = get_video_provider()
    assert isinstance(p_default, LocalCinematicProvider)
    assert p_default.name == "LOCAL_CINEMATIC"

    # Chỉ định rõ VEO (Phương án B Standby)
    p_veo = get_video_provider("VEO")
    assert isinstance(p_veo, GoogleVeoProvider)
    assert p_veo.name == "VEO"

    # Chỉ định rõ HEYGEN (Phương án B Standby)
    p_heygen = get_video_provider("HEYGEN")
    assert isinstance(p_heygen, HeyGenProvider)
    assert p_heygen.name == "HEYGEN"


def test_build_motion_filter_formulas():
    """Kiểm tra các biểu thức FFmpeg zoompan cho từng chuyển động Ken Burns."""
    f_in = build_motion_filter("ZOOM_IN", 1080, 1920, 90)
    assert "zoom+0.0015" in f_in
    assert "zoompan" in f_in

    f_out = build_motion_filter("ZOOM_OUT", 1080, 1920, 90)
    assert "zoom-0.0015" in f_out

    f_up = build_motion_filter("PAN_UP", 1080, 1920, 90)
    assert "ih-ih/zoom" in f_up

    f_right = build_motion_filter("PAN_RIGHT", 1080, 1920, 90)
    assert "iw-iw/zoom" in f_right

    f_static = build_motion_filter("STATIC", 1080, 1920, 90)
    assert "z=1.0" in f_static


def test_veo_provider_standby_behavior():
    """Google Veo ở chế độ Standby: tự động dự phòng sang Local Cinematic nếu chưa có API Key."""
    veo = GoogleVeoProvider(api_key="")
    assert veo.is_available() is False

    with tempfile.TemporaryDirectory() as tmp_dir:
        out_file = Path(tmp_dir) / "output.mp4"
        events = []

        def callback(evt, data):
            events.append((evt, data))

        # Mock fallback_provider.render_video để không chạy ffmpeg thật trong unit test này
        veo._fallback_provider = MagicMock()
        veo._fallback_provider.render_video.return_value = out_file

        res = veo.render_video(
            job_id="test_job",
            org_id="org_test",
            payload={"title": "Test Flower", "scenes": []},
            out_file=out_file,
            progress_callback=callback,
        )

        assert res == out_file
        veo._fallback_provider.render_video.assert_called_once()
        assert any("Google Veo chưa bật API Key" in str(e[1]) for e in events)


def test_heygen_provider_standby_behavior():
    """HeyGen ở chế độ Standby: tự động dự phòng sang Local Cinematic nếu chưa có API Key."""
    heygen = HeyGenProvider(api_key="")
    assert heygen.is_available() is False

    with tempfile.TemporaryDirectory() as tmp_dir:
        out_file = Path(tmp_dir) / "output_heygen.mp4"
        events = []

        def callback(evt, data):
            events.append((evt, data))

        heygen._fallback_provider = MagicMock()
        heygen._fallback_provider.render_video.return_value = out_file

        res = heygen.render_video(
            job_id="test_job_2",
            org_id="org_test",
            payload={"title": "Test Flower HeyGen", "scenes": []},
            out_file=out_file,
            progress_callback=callback,
        )

        assert res == out_file
        heygen._fallback_provider.render_video.assert_called_once()
        assert any("HeyGen chưa bật API Key" in str(e[1]) for e in events)


def test_build_ffmpeg_command_with_motions():
    """Kiểm tra tạo lệnh FFmpeg chứa các bộ lọc Ken Burns và xfade nối cảnh."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        p1 = Path(tmp_dir) / "img1.jpg"
        p2 = Path(tmp_dir) / "img2.jpg"
        p1.write_bytes(b"dummy1")
        p2.write_bytes(b"dummy2")
        out = Path(tmp_dir) / "out.mp4"

        cmd = build_ffmpeg_command(
            image_paths=[p1, p2],
            out_path=out,
            aspect_ratio="9:16",
            total_duration=10,
            motions=["ZOOM_IN", "PAN_RIGHT"],
            scene_durations=[5.0, 5.0],
        )

        cmd_str = " ".join(cmd)
        assert "ffmpeg" in cmd_str
        assert "zoompan" in cmd_str
        assert "xfade=transition=fade" in cmd_str
        assert str(out) in cmd_str
