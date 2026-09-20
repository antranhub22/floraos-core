"""
Music Engine — Giải quyết nhạc nền (BGM) cho Audio Worker.

Ánh xạ track ID từ SSOT TypeScript catalog → đường dẫn file .mp3 thật.
Xử lý loop nhạc nền đủ thời lượng video.
"""

from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path
from typing import Optional

# Thư mục nhạc nền (dùng chung assets với video worker)
MUSIC_DIR = Path(__file__).resolve().parents[1] / "video" / "assets" / "music"

# Ánh xạ trackId (từ SSOT TypeScript) → filename thật
TRACK_ID_TO_FILE = {
    "acoustic-warm-guitar": "acoustic_warm_guitar.mp3",
    "upbeat-cheerful-pop": "upbeat_cheerful_pop.mp3",
    "lofi-chill-beats": "lo_fi_chill_beats.mp3",
    "romantic-piano-melody": "romantic_piano_melody.mp3",
}

# Ánh xạ tên cũ (backward compat với video worker)
LEGACY_NAME_TO_FILE = {
    "Acoustic Warm Guitar": "acoustic_warm_guitar.mp3",
    "Upbeat Cheerful Pop": "upbeat_cheerful_pop.mp3",
    "Lo-Fi Chill Beats": "lo_fi_chill_beats.mp3",
    "Romantic Piano Melody": "romantic_piano_melody.mp3",
}


def resolve_music_path(
    track_id: Optional[str] = None,
    legacy_name: Optional[str] = None,
) -> Optional[Path]:
    """Giải quyết track ID hoặc tên cũ → đường dẫn file thật."""
    filename: Optional[str] = None

    # Ưu tiên track_id (SSOT)
    if track_id:
        filename = TRACK_ID_TO_FILE.get(track_id)

    # Fallback legacy name
    if not filename and legacy_name:
        filename = LEGACY_NAME_TO_FILE.get(legacy_name)
        if not filename:
            # Fuzzy match
            for k, v in LEGACY_NAME_TO_FILE.items():
                if k.lower() in legacy_name.lower():
                    filename = v
                    break

    if not filename:
        filename = "acoustic_warm_guitar.mp3"

    path = MUSIC_DIR / filename
    if path.is_file():
        return path

    # Fallback tuyệt đối
    fallback = MUSIC_DIR / "acoustic_warm_guitar.mp3"
    return fallback if fallback.is_file() else None


def loop_music_to_duration(
    music_path: Path,
    target_duration: float,
    out_file: Path,
    volume: float = 0.65,
    fade_out_seconds: float = 1.0,
) -> Optional[Path]:
    """
    Loop nhạc nền đủ thời lượng mục tiêu + fade out.

    Args:
        music_path: Đường dẫn file nhạc nền nguồn.
        target_duration: Thời lượng mục tiêu (giây).
        out_file: Đường dẫn file output.
        volume: Âm lượng BGM (0.0 - 1.0).
        fade_out_seconds: Thời lượng fade out cuối.

    Returns:
        Path file output nếu thành công, None nếu lỗi.
    """
    if not music_path.is_file():
        return None

    out_file.parent.mkdir(parents=True, exist_ok=True)
    fade_start = max(0.5, target_duration - fade_out_seconds)

    try:
        af = (
            f"aloop=loop=-1:size=2e+09,"
            f"atrim=0:{target_duration:.2f},"
            f"volume={volume:.2f},"
            f"afade=t=out:st={fade_start:.2f}:d={fade_out_seconds:.1f}"
        )
        cmd = [
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", str(music_path),
            "-af", af,
            "-c:a", "libmp3lame", "-b:a", "128k",
            str(out_file),
        ]
        subprocess.run(cmd, check=True, timeout=30)
        return out_file if out_file.is_file() else None
    except Exception as exc:
        print(f"⚠️ [MusicEngine] Loop nhạc nền thất bại: {exc}", flush=True)
        return None


def get_audio_duration(file_path: Path) -> float:
    """Lấy thời lượng file âm thanh bằng ffprobe."""
    try:
        cmd = [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(file_path),
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        return float(res.stdout.strip())
    except Exception:
        return 0.0
