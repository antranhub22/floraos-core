"""
Module xử lý và phối trộn âm thanh video (M04c).
Bao gồm:
- Giọng đọc lồng tiếng AI theo từng phân cảnh (OpenAI TTS với giọng nữ/nam truyền cảm, fallback say/chime)
- Nhạc nền bản quyền miễn phí theo chủ đề (Acoustic Guitar, Lo-Fi, Pop, Piano)
- Phối âm đa kênh với tính năng ducking (hạ âm lượng nhạc nền khi có giọng đọc)
"""

from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np

REPO_ROOT = Path(__file__).resolve().parents[3]
MUSIC_DIR = Path(__file__).resolve().parent / "assets" / "music"

VOICE_MAPPING = {
    "vi-VN-Standard-A": "nova",     # Nữ truyền cảm
    "vi-VN-Standard-B": "onyx",     # Nam ấm áp
    "vi-VN-Standard-C": "shimmer",  # Nữ trẻ trung
    "alloy": "alloy",
    "echo": "echo",
    "fable": "fable",
    "onyx": "onyx",
    "nova": "nova",
    "shimmer": "shimmer",
}

MUSIC_MAPPING = {
    "Acoustic Warm Guitar": "acoustic_warm_guitar.mp3",
    "Upbeat Cheerful Pop": "upbeat_cheerful_pop.mp3",
    "Lo-Fi Chill Beats": "lo_fi_chill_beats.mp3",
    "Romantic Piano Melody": "romantic_piano_melody.mp3",
}


def _ensure_api_key():
    if not os.environ.get("OPENAI_API_KEY"):
        env_file = REPO_ROOT / ".env"
        if env_file.is_file():
            for line in env_file.read_text(encoding="utf-8").splitlines():
                if line.startswith("OPENAI_API_KEY="):
                    val = line.split("=", 1)[1].strip().strip('"').strip("'")
                    if val:
                        os.environ["OPENAI_API_KEY"] = val
                    break


def generate_speech_openai(text: str, voice_code: str, out_file: Path) -> bool:
    """Sinh giọng đọc lồng tiếng bằng OpenAI TTS."""
    _ensure_api_key()
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return False

    voice = VOICE_MAPPING.get(voice_code, "nova")
    try:
        import openai
        client = openai.OpenAI(api_key=api_key)
        response = client.audio.speech.create(
            model="tts-1",
            voice=voice,
            input=text,
        )
        with open(out_file, "wb") as f:
            f.write(response.content)
        return out_file.is_file() and out_file.stat().st_size > 0
    except Exception as exc:
        print(f"⚠️ [AudioEngine] OpenAI TTS lỗi: {exc}", flush=True)
        return False


def generate_speech_fallback(text: str, out_file: Path) -> bool:
    """Fallback TTS bằng macOS say hoặc âm báo nhẹ nhàng."""
    if shutil.which("say"):
        aiff_path = out_file.with_suffix(".aiff")
        try:
            subprocess.run(["say", "-o", str(aiff_path), text], check=True, timeout=10)
            if aiff_path.is_file():
                subprocess.run(
                    ["ffmpeg", "-y", "-loglevel", "error", "-i", str(aiff_path), str(out_file)],
                    check=True,
                )
                aiff_path.unlink(missing_ok=True)
                return True
        except Exception as exc:
            print(f"⚠️ [AudioEngine] macOS say fallback lỗi: {exc}", flush=True)

    return False


def get_music_track_path(music_track_name: Optional[str]) -> Optional[Path]:
    """Tìm đường dẫn tệp nhạc nền phù hợp."""
    if not music_track_name:
        return None

    filename = MUSIC_MAPPING.get(music_track_name)
    if not filename:
        for k, v in MUSIC_MAPPING.items():
            if k.lower() in music_track_name.lower():
                filename = v
                break

    if not filename:
        filename = "acoustic_warm_guitar.mp3"

    p = MUSIC_DIR / filename
    if p.is_file():
        return p

    fallback_p = MUSIC_DIR / "acoustic_warm_guitar.mp3"
    return fallback_p if fallback_p.is_file() else None


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


def build_audio_track(
    scenes: List[Dict[str, Any]],
    music_track: Optional[str],
    voice_code: Optional[str],
    total_duration: float,
    out_audio_file: Path,
) -> Optional[Path]:
    """
    Tạo tệp âm thanh hoàn chỉnh cho video (giọng đọc + nhạc nền ducking).
    Đồng bộ chuẩn xác thời điểm phát giọng đọc theo từng phân cảnh.
    """
    temp_dir = Path(tempfile.mkdtemp(prefix="flora_audio_"))
    try:
        voice_files: List[Path] = []
        has_voice = False

        n_scenes = max(1, len(scenes))
        total_weights = sum(
            float(sc.get("durationSeconds") or sc.get("duration_seconds") or 1) for sc in scenes
        ) or float(n_scenes)

        # 1. Sinh giọng đọc cho từng phân cảnh
        if voice_code and voice_code != "none":
            for idx, sc in enumerate(scenes):
                script = (sc.get("voiceScript") or sc.get("voice_script") or "").strip()
                weight = float(sc.get("durationSeconds") or sc.get("duration_seconds") or 1)
                scene_dur = round((weight / total_weights) * total_duration, 2)

                scene_voice = temp_dir / f"scene_{idx}.mp3"
                padded_voice = temp_dir / f"scene_{idx}_padded.mp3"

                if script:
                    success = generate_speech_openai(script, voice_code, scene_voice)
                    if not success:
                        success = generate_speech_fallback(script, scene_voice)

                    if success and scene_voice.is_file():
                        act_dur = get_audio_duration(scene_voice)
                        # Nếu giọng đọc dài hơn phân cảnh: điều chỉnh tempo để đọc trọn vẹn câu không bị cắt
                        if act_dur > (scene_dur - 0.2) and act_dur > 0:
                            tempo = min(2.0, max(0.5, act_dur / max(1.0, scene_dur - 0.25)))
                            af = f"atempo={tempo:.3f},apad,atrim=0:{scene_dur:.2f}"
                        else:
                            af = f"apad,atrim=0:{scene_dur:.2f}"

                        cmd = [
                            "ffmpeg", "-y", "-loglevel", "error",
                            "-i", str(scene_voice),
                            "-af", af,
                            "-c:a", "libmp3lame",
                            str(padded_voice),
                        ]
                        subprocess.run(cmd, check=True)
                        voice_files.append(padded_voice)
                        has_voice = True
                        continue

                # Phân cảnh không có lời thoại -> chèn đoạn im lặng đúng độ dài
                cmd = [
                    "ffmpeg", "-y", "-loglevel", "error",
                    "-f", "lavfi", "-i", f"anullsrc=r=44100:cl=mono",
                    "-t", str(scene_dur),
                    "-c:a", "libmp3lame",
                    str(padded_voice),
                ]
                subprocess.run(cmd, check=True)
                voice_files.append(padded_voice)

        full_voice: Optional[Path] = None
        if has_voice and voice_files:
            concat_list = temp_dir / "concat_voice.txt"
            with open(concat_list, "w", encoding="utf-8") as f:
                for vf in voice_files:
                    f.write(f"file '{vf.absolute()}'\n")

            full_voice = temp_dir / "full_voice.mp3"
            subprocess.run(
                [
                    "ffmpeg", "-y", "-loglevel", "error",
                    "-f", "concat", "-safe", "0",
                    "-i", str(concat_list),
                    "-c:a", "libmp3lame",
                    str(full_voice),
                ],
                check=True,
            )

        # 2. Tìm tệp nhạc nền
        bgm_path = get_music_track_path(music_track)

        # 3. Phối trộn âm thanh
        out_audio_file.parent.mkdir(parents=True, exist_ok=True)
        fade_out_start = max(0.5, total_duration - 1.0)

        if full_voice and full_voice.is_file() and bgm_path and bgm_path.is_file():
            # Cả giọng đọc và nhạc nền: Nhạc nền ducking âm lượng 0.22, giọng đọc 1.0
            filter_str = (
                f"[0:a]volume=1.0,apad,atrim=0:{total_duration}[v];"
                f"[1:a]aloop=loop=-1:size=2e+09,atrim=0:{total_duration},volume=0.22[m];"
                f"[v][m]amix=inputs=2:duration=longest,afade=t=out:st={fade_out_start:.2f}:d=1.0[out]"
            )
            cmd = [
                "ffmpeg", "-y", "-loglevel", "error",
                "-i", str(full_voice),
                "-i", str(bgm_path),
                "-filter_complex", filter_str,
                "-map", "[out]",
                "-c:a", "aac", "-b:a", "128k",
                str(out_audio_file),
            ]
            subprocess.run(cmd, check=True)
            return out_audio_file

        elif full_voice and full_voice.is_file():
            # Chỉ có giọng đọc
            cmd = [
                "ffmpeg", "-y", "-loglevel", "error",
                "-i", str(full_voice),
                "-af", f"apad,atrim=0:{total_duration},afade=t=out:st={fade_out_start:.2f}:d=1.0",
                "-c:a", "aac", "-b:a", "128k",
                str(out_audio_file),
            ]
            subprocess.run(cmd, check=True)
            return out_audio_file

        elif bgm_path and bgm_path.is_file():
            # Chỉ có nhạc nền: Âm lượng 0.65
            cmd = [
                "ffmpeg", "-y", "-loglevel", "error",
                "-i", str(bgm_path),
                "-af", f"aloop=loop=-1:size=2e+09,atrim=0:{total_duration},volume=0.65,afade=t=out:st={fade_out_start:.2f}:d=1.0",
                "-c:a", "aac", "-b:a", "128k",
                str(out_audio_file),
            ]
            subprocess.run(cmd, check=True)
            return out_audio_file

        return None

    except Exception as exc:
        print(f"❌ [AudioEngine] Phối trộn âm thanh thất bại: {exc}", flush=True)
        return None
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
