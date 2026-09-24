"""Test Audio Worker — bốn loại tác vụ Khu vực C (viết lại 24/09/2026).

Không gọi mạng: `generate_speech` được thay bằng hàm sinh một đoạn sóng sin
bằng ffmpeg. Dùng ffmpeg thật cho nối/phối/chuẩn hoá độ to.

Trước 24/09/2026 worker không đọc `taskType` — cả bốn nút cùng ra một bản TTS
+ nhạc — và các test cũ còn khẳng định VOICE_CLONE "COMPLETED" dù không nhân
bản gì. Các test dưới khoá hành vi khác nhau THẬT của từng loại.
"""

from __future__ import annotations

import subprocess
from pathlib import Path
from typing import Any, Dict, List

import pytest

from media_ai.audio import audio_worker
from media_ai.audio.audio_worker import process_audio_job
from media_ai.audio.mixing_engine import MUSIC_DIR, get_audio_duration, measure_loudness


def _sine(out: Path, seconds: float, freq: int = 440) -> None:
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi",
         "-i", f"sine=frequency={freq}:duration={seconds}", "-c:a", "libmp3lame", str(out)],
        check=True,
    )


@pytest.fixture
def fake_tts(monkeypatch):
    calls: List[Dict[str, Any]] = []

    def _gen(text, voice_code, out_file, provider="openai", quality="standard", voice_map=None, strict=False):
        calls.append({"text": text, "voice_code": voice_code, "provider": provider, "strict": strict, "voice_map": voice_map})
        # ~ 14 ký tự/giây như giọng thật
        _sine(Path(out_file), max(0.6, len(text) / 14))
        return True, provider

    monkeypatch.setattr(audio_worker, "generate_speech", _gen)
    return calls


def scene(i, script="", dur=5.0):
    return {"sceneIndex": i, "voiceScript": script, "targetDurationSeconds": dur}


def payload(task, **kw):
    base = {
        "taskType": task,
        "scenes": [scene(1, "Xin chào quý khách", 3.0), scene(2, "Đặt hoa ngay hôm nay", 3.0)],
        "totalDurationSeconds": 6.0,
        "providerKey": "openai",
        "providerVoiceCode": "nova",
        "qualityTier": "standard",
    }
    base.update(kw)
    return base


needs_music = pytest.mark.skipif(
    not (MUSIC_DIR / "acoustic_warm_guitar.mp3").is_file(), reason="thiếu tệp nhạc hệ thống"
)


def test_voiceover_chi_giong_khong_nhac(fake_tts, tmp_path):
    r = process_audio_job(payload("VOICEOVER", musicTrackId="acoustic-warm-guitar"), tmp_path)
    assert r["status"] == "COMPLETED"
    assert r["output"] == "voice_only"
    assert r["hasVoice"] is True and r["hasMusic"] is False
    assert r["voiceOnlyPath"] is None
    assert len(fake_tts) == 2


@needs_music
def test_music_select_khong_goi_tts(fake_tts, tmp_path):
    r = process_audio_job(
        payload("MUSIC_SELECT", scenes=[], musicTrackId="acoustic-warm-guitar", totalDurationSeconds=8.0), tmp_path
    )
    assert r["status"] == "COMPLETED", r
    assert fake_tts == []
    assert r["hasVoice"] is False and r["hasMusic"] is True
    assert abs(r["totalDurationSeconds"] - 8.0) < 0.3


def test_music_select_thieu_nhac_that_bai(fake_tts, tmp_path):
    r = process_audio_job(payload("MUSIC_SELECT", scenes=[]), tmp_path)
    assert r["status"] == "FAILED"
    assert "nhạc" in r["error"]


def test_audio_mix_thieu_nhac_that_bai(fake_tts, tmp_path):
    r = process_audio_job(payload("AUDIO_MIX"), tmp_path)
    assert r["status"] == "FAILED"


def test_ma_bai_la_khong_am_tham_thanh_guitar(fake_tts, tmp_path):
    r = process_audio_job(payload("AUDIO_MIX", musicTrackId="khong-ton-tai"), tmp_path)
    assert r["status"] == "FAILED"
    assert "khong-ton-tai" in r["error"]


@needs_music
def test_audio_mix_co_ban_chi_giong_va_chuan_do_to(fake_tts, tmp_path):
    r = process_audio_job(payload("AUDIO_MIX", musicTrackId="romantic-piano-melody"), tmp_path)
    assert r["status"] == "COMPLETED", r
    assert r["hasVoice"] and r["hasMusic"]
    assert r["voiceOnlyPath"] and Path(r["voiceOnlyPath"]).is_file()
    assert r["loudnessLufs"] is not None and -16.5 <= r["loudnessLufs"] <= -11.5


@needs_music
def test_nhac_tiem_tu_tai_dung_bytes_truyen_vao(fake_tts, tmp_path):
    music = tmp_path / "m.mp3"
    _sine(music, 5, 220)
    r = process_audio_job(payload("AUDIO_MIX"), tmp_path / "w", music_bytes=music.read_bytes())
    assert r["status"] == "COMPLETED", r
    assert r["hasMusic"] is True


def test_voice_clone_goi_strict_va_khong_nhac_van_duoc(fake_tts, tmp_path):
    r = process_audio_job(
        payload("VOICE_CLONE", providerKey="elevenlabs", providerVoiceCode="AbCdEfGhIjKlMnOpQrSt", strictProvider=True),
        tmp_path,
    )
    assert r["status"] == "COMPLETED"
    assert all(c["strict"] is True and c["provider"] == "elevenlabs" for c in fake_tts)
    assert r["hasMusic"] is False


def test_voice_clone_tts_hong_thi_that_bai_ro_ly_do(monkeypatch, tmp_path):
    monkeypatch.setattr(audio_worker, "generate_speech", lambda *a, **k: (False, "none"))
    r = process_audio_job(payload("VOICE_CLONE", providerKey="elevenlabs", strictProvider=True), tmp_path)
    assert r["status"] == "FAILED"
    assert "ElevenLabs" in r["error"]


def test_mot_canh_khong_doc_duoc_thi_ca_job_that_bai(monkeypatch, tmp_path):
    n = {"i": 0}

    def _gen(text, voice_code, out_file, **k):
        n["i"] += 1
        if n["i"] == 2:
            return False, "none"
        _sine(Path(out_file), 1.0)
        return True, "openai"

    monkeypatch.setattr(audio_worker, "generate_speech", _gen)
    r = process_audio_job(payload("VOICEOVER"), tmp_path)
    assert r["status"] == "FAILED"
    assert "cảnh 2" in r["error"]


def test_giong_dai_hon_canh_thi_keo_dai_canh_khong_tua_nhanh(fake_tts, tmp_path):
    loi = "Bó hoa hồng đỏ thắm gửi trao yêu thương trọn vẹn cho người thương nhân ngày đặc biệt"  # ~6s
    r = process_audio_job(payload("VOICEOVER", scenes=[scene(1, loi, 2.0)]), tmp_path)
    assert r["status"] == "COMPLETED"
    sc = r["scenes"][0]
    assert sc["extended"] is True
    assert sc["actualDurationSeconds"] >= 5.0
    assert r["totalDurationSeconds"] >= 5.0


def test_loai_tac_vu_la_bi_tu_choi(fake_tts, tmp_path):
    r = process_audio_job(payload("KARAOKE"), tmp_path)
    assert r["status"] == "FAILED"


def test_measure_loudness_doc_duoc_so(tmp_path):
    f = tmp_path / "s.mp3"
    _sine(f, 2)
    assert isinstance(measure_loudness(f), float)
    assert get_audio_duration(f) > 1.5
