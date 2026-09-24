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


def test_dot4_dung_nguyen_ban_phoi_khu_vuc_c(monkeypatch, tmp_path):
    """Đợt 4 (24/09/2026): có `audioStorageKey` thì KHÔNG tự đọc lại TTS / phủ nhạc."""
    from media_ai.video.providers import local_cinematic as lc
    import shared.storage as storage

    img = tmp_path / "a.jpg"
    img.write_bytes(b"x")
    monkeypatch.setattr(lc.LocalCinematicProvider, "is_available", lambda self: True)
    monkeypatch.setattr(lc.LocalCinematicProvider, "_resolve_image", lambda self, ref, org, d, i: img)
    monkeypatch.setattr(lc, "render_caption_to_file", lambda src, text, out, style_name=None: out.write_bytes(b"c"))
    monkeypatch.setattr(storage, "doc_bytes", lambda key, root: b"MIX")
    goi_tts = {"n": 0}
    monkeypatch.setattr(lc, "build_audio_track", lambda **k: goi_tts.update(n=1))
    nhan: dict = {}

    def fake_render(**kwargs):
        nhan["audio"] = kwargs["audio_path"].read_bytes()
        nhan["durations"] = kwargs["scene_durations"]
        kwargs["out_path"].write_bytes(b"mp4")

    monkeypatch.setattr(lc, "render_slideshow", fake_render)
    payload = {
        "videoJobId": "v1",
        "audioStorageKey": "org/org-1/unfiled/x_audio.m4a",
        "scenes": [
            {"imageAssetId": "k1", "durationSeconds": 5.2, "textOverlay": "A"},
            {"imageAssetId": "k2", "durationSeconds": 6.1, "textOverlay": "B"},
        ],
    }
    lc.LocalCinematicProvider().render_video("j1", "org-1", payload, tmp_path / "out.mp4")
    assert goi_tts["n"] == 0
    assert nhan["audio"] == b"MIX"
    assert nhan["durations"] == [5.2, 6.1]


def test_dot4_ban_phoi_to_chuc_khac_bi_chan(monkeypatch, tmp_path):
    from media_ai.video.providers import local_cinematic as lc
    import pytest

    img = tmp_path / "a.jpg"
    img.write_bytes(b"x")
    monkeypatch.setattr(lc.LocalCinematicProvider, "is_available", lambda self: True)
    monkeypatch.setattr(lc.LocalCinematicProvider, "_resolve_image", lambda self, ref, org, d, i: img)
    with pytest.raises(Exception, match="không thuộc tổ chức"):
        lc.LocalCinematicProvider().render_video(
            "j1", "org-1", {"audioStorageKey": "org/org-2/x.m4a", "scenes": [{"imageAssetId": "k"}]}, tmp_path / "o.mp4"
        )


def test_moc_chuyen_canh_khop_tieng_va_phu_de_theo_thoi_gian(tmp_path):
    """24/09/2026: bù chồng xfade + lớp phụ đề ghép theo thời gian."""
    from media_ai.video.slideshow_engine import build_ffmpeg_command

    imgs = [tmp_path / f"{i}.jpg" for i in range(3)]
    for p in imgs:
        p.write_bytes(b"x")
    audio = tmp_path / "a.m4a"
    audio.write_bytes(b"x")
    subs = [(tmp_path / "s0.png", 0.0, 2.0), (tmp_path / "s1.png", 2.0, 5.0)]
    cmd = build_ffmpeg_command(
        imgs, tmp_path / "o.mp4", audio_path=audio, scene_durations=[2.0, 3.0, 4.0], subtitle_overlays=subs
    )
    fc = cmd[cmd.index("-filter_complex") + 1]
    # Cảnh 2 bắt đầu đúng 2.0s, cảnh 3 đúng 5.0s (tổng các cảnh trước).
    assert "offset=2.000" in fc and "offset=5.000" in fc
    assert "overlay=0:0:enable='between(t,2.000,5.000)'" in fc
    # Âm thanh là đầu vào sau 3 ảnh + 2 lớp phụ đề.
    assert cmd[cmd.index("-map", cmd.index("-map") + 1) + 1] == "5:a"
