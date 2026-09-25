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

    def _gen(text, voice_code, out_file, provider="openai", quality="standard", voice_map=None, strict=False, chain_order=None):
        calls.append({"chain_order": chain_order, "text": text, "voice_code": voice_code, "provider": provider, "strict": strict, "voice_map": voice_map})
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


# ─── Nhà cung cấp trước (PO 25/09/2026) ─────────────────────────────────────

def test_giong_doc_theo_thu_tu_nha_cung_cap_cua_tiem(fake_tts, tmp_path):
    r = process_audio_job(payload("VOICEOVER", providerKey="elevenlabs", providerOrder=["elevenlabs", "openai"]), tmp_path)
    assert r["status"] == "COMPLETED", r
    assert all(c["chain_order"] == ["elevenlabs", "openai"] for c in fake_tts)


def test_tts_lui_theo_dung_thu_tu_tiem(monkeypatch, tmp_path):
    from media_ai.audio import tts_engine

    thu: List[str] = []

    def _hong(*_a, **_k):
        return False

    def _ghi(name):
        def _f(*a, **_k):
            thu.append(name)
            return name == "minimax"
        return _f

    monkeypatch.setattr(tts_engine, "PROVIDER_FUNCTIONS", {"openai": _ghi("openai"), "elevenlabs": _ghi("elevenlabs"), "minimax": _ghi("minimax"), "edge_tts": _ghi("edge_tts")})
    ok, used = tts_engine.generate_speech("xin chào", "nova", tmp_path / "a.mp3", provider="elevenlabs", chain_order=["elevenlabs", "minimax", "openai"])
    assert ok and used == "minimax"
    assert thu == ["elevenlabs", "minimax"]  # không nhảy sang openai của chuỗi mặc định trước


def test_nhac_nen_do_nha_cung_cap_sinh(fake_tts, tmp_path, monkeypatch):
    from media_ai.audio import music_providers

    goi: List[Dict[str, Any]] = []

    def _sinh(prompt, seconds, out_file, post=None):
        goi.append({"prompt": prompt, "seconds": seconds})
        _sine(Path(out_file), seconds, freq=220)

    monkeypatch.setitem(music_providers.MUSIC_PROVIDERS, "elevenlabs_music", _sinh)
    r = process_audio_job(
        payload("AUDIO_MIX", musicTrackId="acoustic-warm-guitar", musicMood="romantic", musicProviderOrder=["elevenlabs_music"]),
        tmp_path,
    )
    assert r["status"] == "COMPLETED", r
    assert r["musicProviderUsed"] == "elevenlabs_music" and r["musicFallback"] is False
    assert len(goi) == 1 and "romantic" in goi[0]["prompt"] and "No vocals" in goi[0]["prompt"]
    # Sinh sau giọng đọc: đủ thời lượng thật.
    assert goi[0]["seconds"] >= r["totalDurationSeconds"]


def test_nha_cung_cap_nhac_loi_thi_lui_bai_thu_vien_va_ghi_ly_do(fake_tts, tmp_path, monkeypatch):
    from media_ai.audio import music_providers

    def _hong(prompt, seconds, out_file, post=None):
        raise music_providers.NhaCungCapNhacLoi("elevenlabs_music: HTTP 402 quota")

    monkeypatch.setitem(music_providers.MUSIC_PROVIDERS, "elevenlabs_music", _hong)
    r = process_audio_job(
        payload("MUSIC_SELECT", scenes=[], musicTrackId="acoustic-warm-guitar", musicProviderOrder=["elevenlabs_music"], totalDurationSeconds=8.0),
        tmp_path,
    )
    assert r["status"] == "COMPLETED", r
    assert r["hasMusic"] is True and r["musicProviderUsed"] is None
    assert r["musicFallback"] is True and "402" in r["musicFallbackReason"]


def test_elevenlabs_music_gui_dung_hop_dong(monkeypatch, tmp_path):
    from media_ai.audio import music_providers

    monkeypatch.setenv("ELEVENLABS_API_KEY", "k-test")
    seen: Dict[str, Any] = {}

    class _R:
        status_code = 200
        content = b"\xff\xfb" + b"0" * 5000
        text = ""

    def _post(url, **kw):
        seen.update(url=url, **kw)
        return _R()

    out = tmp_path / "m.mp3"
    music_providers.sinh_nhac_elevenlabs("calm", 4.0, out, post=_post)
    assert seen["url"] == "https://api.elevenlabs.io/v1/music"
    assert seen["headers"]["xi-api-key"] == "k-test"
    assert seen["json"]["music_length_ms"] == 10_000  # kẹp về tối thiểu của API
    assert seen["json"]["force_instrumental"] is True
    assert out.read_bytes() == _R.content


def test_elevenlabs_music_thieu_khoa_la_loi_nha_cung_cap(monkeypatch, tmp_path):
    from media_ai.audio import music_providers

    monkeypatch.delenv("ELEVENLABS_API_KEY", raising=False)
    monkeypatch.setattr(music_providers, "_ensure_api_key", lambda _k: None)
    with pytest.raises(music_providers.NhaCungCapNhacLoi):
        music_providers.sinh_nhac_elevenlabs("calm", 20, tmp_path / "m.mp3", post=lambda *a, **k: None)
