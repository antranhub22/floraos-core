"""Hồi quy 24/09/2026: video Khu vực E chỉ có nhạc vì `build_audio_track` gọi
`pad_voice_to_duration`/`generate_silence` sai thứ tự tham số."""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

import pytest

from media_ai.video import audio_engine

pytestmark = pytest.mark.skipif(shutil.which("ffmpeg") is None, reason="cần ffmpeg")


def _tone(path: Path, seconds: float) -> None:
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", f"sine=frequency=440:duration={seconds}",
         "-c:a", "libmp3lame", str(path)],
        check=True,
    )


def test_giong_doc_duoc_dua_vao_ban_phoi(monkeypatch, tmp_path):
    def fake_tts(text, voice, out_file, *a, **k):
        _tone(Path(out_file), 1.0)
        return True

    monkeypatch.setattr(audio_engine, "generate_speech_openai", fake_tts)
    monkeypatch.setattr(audio_engine, "resolve_music_path", lambda **_k: None)
    bat = {}

    def fake_mix(voice_file, bgm_file, total_duration, out_file, **_k):
        bat["voice"] = voice_file
        shutil.copy(voice_file, out_file)
        return out_file

    monkeypatch.setattr(audio_engine, "mix_audio", fake_mix)
    out = tmp_path / "a.mp3"
    scenes = [
        {"voiceScript": "Cảnh một", "durationSeconds": 3},
        {"voiceScript": "", "durationSeconds": 2},
        {"voiceScript": "Cảnh ba", "durationSeconds": 3},
    ]
    kq = audio_engine.build_audio_track(scenes, None, "vi-VN-Standard-A", 8.0, out)
    assert kq is not None
    assert bat["voice"] is not None, "giọng đọc phải được nối và đưa vào bản phối"
