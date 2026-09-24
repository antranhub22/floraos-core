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
    """Tìm tệp nhạc hệ thống theo trackId (hoặc tên cũ của video worker).

    24/09/2026: mã lạ / tệp thiếu → `None` (worker báo lỗi rõ). Trước đây âm
    thầm trả Acoustic Guitar, nên chọn bài nào không có cũng ra guitar.
    """
    if not track_id:
        return None
    filename = TRACK_ID_TO_FILENAME.get(track_id) or LEGACY_NAME_TO_FILENAME.get(track_id)
    if not filename:
        for k, v in LEGACY_NAME_TO_FILENAME.items():
            if k.lower() in track_id.lower():
                filename = v
                break
    if not filename:
        return None
    p = MUSIC_DIR / filename
    return p if p.is_file() else None


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


# Chuẩn độ to cho video mạng xã hội (TikTok/Reels/YouTube chuẩn hoá quanh
# -14 LUFS; trần đỉnh -1.5 dBTP để không vỡ tiếng sau khi nền tảng nén lại).
TARGET_LUFS = -14.0
TARGET_TRUE_PEAK = -1.5


def _loudnorm() -> str:
    return f"loudnorm=I={TARGET_LUFS}:TP={TARGET_TRUE_PEAK}:LRA=11,aresample=44100"


def measure_loudness(file_path: Path) -> Optional[float]:
    """Đo độ to tích hợp (LUFS) của tệp — ghi vào output để kiểm chứng."""
    try:
        res = subprocess.run(
            [
                "ffmpeg", "-hide_banner", "-nostats", "-i", str(file_path),
                "-af", "loudnorm=print_format=json", "-f", "null", "-",
            ],
            capture_output=True, text=True, timeout=60,
        )
        import json as _json
        import re as _re

        m = _re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", res.stderr, _re.S)
        if not m:
            return None
        return round(float(_json.loads(m.group(0))["input_i"]), 1)
    except Exception:
        return None


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
    Phối voice + nhạc nền, xuất AAC stereo 44.1kHz đã chuẩn hoá độ to.

    24/09/2026 (rà soát Khu vực C):
    - Ducking THẬT bằng `sidechaincompress`: nhạc chỉ hạ khi có giọng, nâng lại
      khi ngừng (trước đây nhạc bị hạ cố định 22% suốt bản).
    - `amix ... normalize=0`: `amix` mặc định chia đôi mọi đầu vào, làm giọng
      nhỏ đi một nửa.
    - `loudnorm` về -14 LUFS / -1.5 dBTP; fade in 0.3s nhạc, fade out 1s cuối.
    `bgm_ducking_volume` giữ trong chữ ký để tương thích; mức hạ do bộ nén quyết định.
    """
    del bgm_ducking_volume
    try:
        out_file.parent.mkdir(parents=True, exist_ok=True)
        t = max(0.5, float(total_duration))
        fade_out_start = max(0.0, t - 1.0)
        fmt = "aformat=sample_rates=44100:channel_layouts=stereo"
        has_voice = bool(voice_file and voice_file.is_file())
        has_bgm = bool(bgm_file and bgm_file.is_file())

        if has_voice and has_bgm:
            filter_str = (
                f"[0:a]{fmt},volume={voice_volume},apad,atrim=0:{t:.2f},asplit=2[v][vsc];"
                f"[1:a]{fmt},aloop=loop=-1:size=2e+09,atrim=0:{t:.2f},volume={bgm_normal_volume},"
                f"afade=t=in:d=0.3[m];"
                f"[m][vsc]sidechaincompress=threshold=0.02:ratio=10:attack=15:release=350:makeup=1[md];"
                f"[v][md]amix=inputs=2:duration=first:normalize=0,"
                f"afade=t=out:st={fade_out_start:.2f}:d=1.0,{_loudnorm()}[out]"
            )
            cmd = [
                "ffmpeg", "-y", "-loglevel", "error",
                "-i", str(voice_file), "-i", str(bgm_file),
                "-filter_complex", filter_str, "-map", "[out]",
                "-t", f"{t:.2f}", "-c:a", "aac", "-b:a", "192k",
                str(out_file),
            ]
        elif has_voice:
            cmd = [
                "ffmpeg", "-y", "-loglevel", "error",
                "-i", str(voice_file),
                "-af", (
                    f"{fmt},volume={voice_volume},apad,atrim=0:{t:.2f},"
                    f"afade=t=out:st={fade_out_start:.2f}:d=1.0,{_loudnorm()}"
                ),
                "-t", f"{t:.2f}", "-c:a", "aac", "-b:a", "192k",
                str(out_file),
            ]
        elif has_bgm:
            cmd = [
                "ffmpeg", "-y", "-loglevel", "error",
                "-i", str(bgm_file),
                "-af", (
                    f"{fmt},aloop=loop=-1:size=2e+09,atrim=0:{t:.2f},"
                    f"volume={bgm_normal_volume},afade=t=in:d=0.3,"
                    f"afade=t=out:st={fade_out_start:.2f}:d=1.0,{_loudnorm()}"
                ),
                "-t", f"{t:.2f}", "-c:a", "aac", "-b:a", "192k",
                str(out_file),
            ]
        else:
            return None

        subprocess.run(cmd, check=True, timeout=180)
        return out_file if out_file.is_file() and out_file.stat().st_size > 0 else None

    except Exception as exc:
        print(f"❌ [Mixing] Phối trộn thất bại: {exc}", flush=True)
        return None


def fit_voice_to_scene(voice_file: Path, target_duration: float, out_file: Path) -> float:
    """
    Khớp giọng một cảnh vào thời lượng cảnh cho Audio Studio (24/09/2026).

    Trước đây giọng dài hơn cảnh bị tăng tốc tới 2× rồi cắt đuôi (nghe như tua
    nhanh, mất chữ cuối). Nay: cho phép nhanh tối đa 1.1× (tai không nhận ra);
    còn dài hơn thì KÉO DÀI cảnh bằng độ dài giọng + 0.3s nghỉ. Trả thời lượng
    thật của cảnh (giây); 0 nếu lỗi.
    """
    actual = get_audio_duration(voice_file)
    if actual <= 0:
        return 0.0
    target = max(0.5, float(target_duration))
    tempo = 1.0
    if actual > target - 0.2:
        needed = actual / max(0.5, target - 0.25)
        tempo = min(1.1, needed)
    spoken = actual / tempo
    final = max(target, round(spoken + 0.3, 2))
    af = (f"atempo={tempo:.3f}," if tempo > 1.001 else "") + f"apad,atrim=0:{final:.2f}"
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(voice_file), "-af", af,
             "-ar", "44100", "-c:a", "libmp3lame", "-b:a", "192k", str(out_file)],
            check=True, timeout=120,
        )
        return final if out_file.is_file() else 0.0
    except Exception as exc:
        print(f"⚠️ [Mixing] Khớp giọng lỗi: {exc}", flush=True)
        return 0.0
