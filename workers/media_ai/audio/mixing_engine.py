"""
Mixing Engine — Phối trộn âm thanh (Voice + BGM + Ducking).

Tách riêng từ audio_engine.py cũ trong video worker.
Xử lý:
- Nối voice từng cảnh thành 1 track liên tục
- Loop nhạc nền đủ thời lượng
- Ducking: hạ BGM khi có voice, nâng BGM khi im lặng
- Fade out cuối video
"""

from __future__ import annotations

import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import List, Optional


MUSIC_DIR = Path(__file__).resolve().parent.parent / "video" / "assets" / "music"

# Ánh xạ trackId (kebab-case từ TS) → filename
TRACK_ID_TO_FILENAME = {
    "acoustic-warm-guitar": "acoustic_warm_guitar.mp3",
    "upbeat-cheerful-pop": "upbeat_cheerful_pop.mp3",
    "lo-fi-chill-beats": "lo_fi_chill_beats.mp3",
    "romantic-piano-melody": "romantic_piano_melody.mp3",
}

# Backward-compatible: tên cũ từ video worker
LEGACY_NAME_TO_FILENAME = {
    "Acoustic Warm Guitar": "acoustic_warm_guitar.mp3",
    "Upbeat Cheerful Pop": "upbeat_cheerful_pop.mp3",
    "Lo-Fi Chill Beats": "lo_fi_chill_beats.mp3",
    "Romantic Piano Melody": "romantic_piano_melody.mp3",
}


def get_audio_duration(file_path: Path) -> float:
    """Lấy thời lượng tệp âm thanh bằng ffprobe."""
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


def resolve_music_file(track_id: Optional[str]) -> Optional[Path]:
    """Tìm file nhạc nền từ trackId hoặc tên cũ."""
    if not track_id:
        return None

    # Thử trackId mới (kebab-case)
    filename = TRACK_ID_TO_FILENAME.get(track_id)

    # Thử tên cũ (backward-compatible)
    if not filename:
        filename = LEGACY_NAME_TO_FILENAME.get(track_id)

    # Thử fuzzy match
    if not filename:
        for k, v in LEGACY_NAME_TO_FILENAME.items():
            if k.lower() in track_id.lower():
                filename = v
                break

    if not filename:
        filename = "acoustic_warm_guitar.mp3"

    p = MUSIC_DIR / filename
    if p.is_file():
        return p

    fallback_p = MUSIC_DIR / "acoustic_warm_guitar.mp3"
    return fallback_p if fallback_p.is_file() else None


def pad_voice_to_duration(
    voice_file: Path,
    target_duration: float,
    padded_file: Path,
) -> bool:
    """Pad/trim voice file cho đúng thời lượng mục tiêu."""
    try:
        actual = get_audio_duration(voice_file)
        if actual <= 0:
            return False

        # Nếu voice dài hơn scene: điều chỉnh tempo
        if actual > (target_duration - 0.2) and actual > 0:
            tempo = min(2.0, max(0.5, actual / max(1.0, target_duration - 0.25)))
            af = f"atempo={tempo:.3f},apad,atrim=0:{target_duration:.2f}"
        else:
            af = f"apad,atrim=0:{target_duration:.2f}"

        cmd = [
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", str(voice_file),
            "-af", af,
            "-c:a", "libmp3lame",
            str(padded_file),
        ]
        subprocess.run(cmd, check=True, timeout=120)
        return padded_file.is_file()
    except Exception as exc:
        print(f"⚠️ [Mixing] Pad voice lỗi: {exc}", flush=True)
        return False


def generate_silence(duration: float, out_file: Path) -> bool:
    """Tạo đoạn im lặng đúng thời lượng."""
    try:
        cmd = [
            "ffmpeg", "-y", "-loglevel", "error",
            "-f", "lavfi", "-i", f"anullsrc=r=44100:cl=mono",
            "-t", str(duration),
            "-c:a", "libmp3lame",
            str(out_file),
        ]
        subprocess.run(cmd, check=True, timeout=120)
        return out_file.is_file()
    except Exception:
        return False


def concat_audio_files(files: List[Path], out_file: Path) -> bool:
    """Nối nhiều file audio thành 1 file liên tục."""
    if not files:
        return False
    try:
        temp_dir = Path(tempfile.mkdtemp(prefix="flora_concat_"))
        concat_list = temp_dir / "concat.txt"
        with open(concat_list, "w", encoding="utf-8") as f:
            for af in files:
                f.write(f"file '{af.absolute()}'\n")

        out_file.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-f", "concat", "-safe", "0",
                "-i", str(concat_list),
                "-c:a", "libmp3lame",
                str(out_file),
            ],
            check=True,
            timeout=120,
        )
        shutil.rmtree(temp_dir, ignore_errors=True)
        return out_file.is_file()
    except Exception as exc:
        print(f"⚠️ [Mixing] Concat lỗi: {exc}", flush=True)
        return False


def mix_audio(
    voice_file: Optional[Path],
    bgm_file: Optional[Path],
    total_duration: float,
    out_file: Path,
    voice_volume: float = 1.0,
    bgm_ducking_volume: float = 0.22,
    bgm_normal_volume: float = 0.65,
) -> Optional[Path]:
    """
    Phối trộn voice + nhạc nền với ducking.
    - Khi có voice: BGM giảm xuống bgm_ducking_volume
    - Khi không voice: BGM ở bgm_normal_volume
    - Fade out 1 giây cuối
    """
    try:
        out_file.parent.mkdir(parents=True, exist_ok=True)
        fade_out_start = max(0.5, total_duration - 1.0)

        if voice_file and voice_file.is_file() and bgm_file and bgm_file.is_file():
            # Voice + BGM: ducking
            filter_str = (
                f"[0:a]volume={voice_volume},apad,atrim=0:{total_duration}[v];"
                f"[1:a]aloop=loop=-1:size=2e+09,atrim=0:{total_duration},volume={bgm_ducking_volume}[m];"
                f"[v][m]amix=inputs=2:duration=longest,"
                f"afade=t=out:st={fade_out_start:.2f}:d=1.0[out]"
            )
            cmd = [
                "ffmpeg", "-y", "-loglevel", "error",
                "-i", str(voice_file),
                "-i", str(bgm_file),
                "-filter_complex", filter_str,
                "-map", "[out]",
                "-c:a", "aac", "-b:a", "128k",
                str(out_file),
            ]
            subprocess.run(cmd, check=True, timeout=120)
            return out_file

        elif voice_file and voice_file.is_file():
            # Chỉ voice
            cmd = [
                "ffmpeg", "-y", "-loglevel", "error",
                "-i", str(voice_file),
                "-af", (
                    f"apad,atrim=0:{total_duration},"
                    f"afade=t=out:st={fade_out_start:.2f}:d=1.0"
                ),
                "-c:a", "aac", "-b:a", "128k",
                str(out_file),
            ]
            subprocess.run(cmd, check=True, timeout=120)
            return out_file

        elif bgm_file and bgm_file.is_file():
            # Chỉ BGM
            cmd = [
                "ffmpeg", "-y", "-loglevel", "error",
                "-i", str(bgm_file),
                "-af", (
                    f"aloop=loop=-1:size=2e+09,atrim=0:{total_duration},"
                    f"volume={bgm_normal_volume},"
                    f"afade=t=out:st={fade_out_start:.2f}:d=1.0"
                ),
                "-c:a", "aac", "-b:a", "128k",
                str(out_file),
            ]
            subprocess.run(cmd, check=True, timeout=120)
            return out_file

        return None

    except Exception as exc:
        print(f"❌ [Mixing] Phối trộn thất bại: {exc}", flush=True)
        return None
