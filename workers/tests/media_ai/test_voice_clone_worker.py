"""Job `audio.voice_clone` (24/09/2026) — không Postgres, không gọi ElevenLabs thật."""

from __future__ import annotations

import subprocess
from pathlib import Path
from typing import Any

from media_ai.audio import tts_engine, voice_clone_worker


class _Cur:
    def __init__(self, log: list) -> None:
        self.log = log

    def execute(self, sql: str, params: Any = None) -> None:
        self.log.append((" ".join(sql.split()), params))

    def __enter__(self) -> "_Cur":
        return self

    def __exit__(self, *a: Any) -> None:
        return None


class _Conn:
    def __init__(self) -> None:
        self.log: list = []

    def cursor(self, **_k: Any) -> _Cur:
        return _Cur(self.log)

    def commit(self) -> None: ...

    def rollback(self) -> None: ...


def _mp3(seconds: float) -> bytes:
    res = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-f", "lavfi", "-i", f"sine=duration={seconds}",
         "-c:a", "libmp3lame", "-f", "mp3", "-"],
        check=True, capture_output=True,
    )
    return res.stdout


def _job(key: str = "org/org-1/audio/voice-samples/c1.mp3") -> dict:
    return {
        "id": "job-1",
        "organization_id": "org-1",
        "payload": {"voiceCloneId": "c1", "name": "Chị Lan", "sampleStorageKey": key, "sampleMimeType": "audio/mpeg"},
    }


def _patch_storage(monkeypatch, body: bytes) -> None:
    import shared.storage as storage

    monkeypatch.setattr(storage, "doc_bytes", lambda key, root: body)


def test_thanh_cong_ghi_ready_va_voice_id(monkeypatch):
    _patch_storage(monkeypatch, _mp3(25))
    monkeypatch.setattr(
        voice_clone_worker, "clone_voice_elevenlabs", lambda name, sample, mime: {"ok": True, "voice_id": "V" * 20}
    )
    conn = _Conn()
    voice_clone_worker.process_voice_clone_job(conn, _job())
    ready = [p for sql, p in conn.log if sql.startswith("UPDATE voice_clones")]
    assert ready and ready[-1][0] == "READY" and ready[-1][1] == "V" * 20
    assert ready[-1][4] == "org-1"  # lọc theo tổ chức của job
    assert any("SET status = 'COMPLETED'" in sql for sql, _ in conn.log)


def test_mau_qua_ngan_bi_tu_choi(monkeypatch):
    _patch_storage(monkeypatch, _mp3(5))
    goi = {"n": 0}
    monkeypatch.setattr(voice_clone_worker, "clone_voice_elevenlabs", lambda *a: goi.update(n=1) or {"ok": True})
    conn = _Conn()
    voice_clone_worker.process_voice_clone_job(conn, _job())
    assert goi["n"] == 0
    failed = [p for sql, p in conn.log if sql.startswith("UPDATE voice_clones")]
    assert failed[-1][0] == "FAILED" and "quá ngắn" in failed[-1][2]
    assert any("SET status = 'FAILED'" in sql for sql, _ in conn.log)


def test_mau_cua_to_chuc_khac_bi_chan(monkeypatch):
    _patch_storage(monkeypatch, _mp3(25))
    conn = _Conn()
    voice_clone_worker.process_voice_clone_job(conn, _job("org/org-2/audio/voice-samples/c1.mp3"))
    failed = [p for sql, p in conn.log if sql.startswith("UPDATE voice_clones")]
    assert failed[-1][0] == "FAILED"


def test_thieu_khoa_elevenlabs_bao_ro(monkeypatch, tmp_path: Path):
    monkeypatch.setattr(voice_clone_worker, "_ensure_api_key", lambda name: None)
    f = tmp_path / "s.mp3"
    f.write_bytes(_mp3(1))
    r = voice_clone_worker.clone_voice_elevenlabs("x", f, "audio/mpeg")
    assert r["ok"] is False and "ELEVENLABS_API_KEY" in r["error"]


def test_loi_than_thien_theo_ma():
    assert "401" in voice_clone_worker._loi_than_thien(401, "")
    assert "Instant Voice Clone" in voice_clone_worker._loi_than_thien(403, "can_not_use_instant_voice_cloning")


# ── tts_engine: chuỗi lùi & ElevenLabs (24/09/2026) ──


def test_chuoi_lui_khong_con_local_fallback():
    assert "local_fallback" not in tts_engine.FALLBACK_CHAIN


def test_strict_chi_thu_mot_nha_cung_cap(monkeypatch, tmp_path: Path):
    da_thu: list = []
    for prov in list(tts_engine.PROVIDER_FUNCTIONS):
        monkeypatch.setitem(
            tts_engine.PROVIDER_FUNCTIONS, prov, lambda *a, _p=prov, **k: da_thu.append(_p) or False
        )
    ok, used = tts_engine.generate_speech("xin chào", "V" * 20, tmp_path / "o.mp3", provider="elevenlabs", strict=True)
    assert (ok, used) == (False, "none")
    assert da_thu == ["elevenlabs"]


def test_lui_dung_ma_giong_cua_tung_nha_cung_cap(monkeypatch, tmp_path: Path):
    nhan: dict = {}

    def fail(text, code, out, q="standard"):
        return False

    def edge(text, code, out):
        nhan["edge"] = code
        return True

    monkeypatch.setitem(tts_engine.PROVIDER_FUNCTIONS, "openai", fail)
    monkeypatch.setitem(tts_engine.PROVIDER_FUNCTIONS, "elevenlabs", fail)
    monkeypatch.setitem(tts_engine.PROVIDER_FUNCTIONS, "minimax", fail)
    monkeypatch.setitem(tts_engine.PROVIDER_FUNCTIONS, "edge_tts", edge)
    ok, used = tts_engine.generate_speech(
        "xin chào", "onyx", tmp_path / "o.mp3", provider="openai",
        voice_map={"openai": "onyx", "edge_tts": "vi-VN-NamMinhNeural"},
    )
    assert ok and used == "edge_tts"
    assert nhan["edge"] == "vi-VN-NamMinhNeural"  # giọng nam vẫn là giọng nam


def test_elevenlabs_voice_id_di_thang_khong_goi_mang():
    assert tts_engine.resolve_elevenlabs_voice_id("21m00Tcm4TlvDq8ikWAM", "k") == "21m00Tcm4TlvDq8ikWAM"
