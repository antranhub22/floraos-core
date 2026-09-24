"""
Module xử lý và phối trộn âm thanh video (M04c).

⚠️ REFACTORED: Các engine thực sự đã tách sang `workers/media_ai/audio/`.
File này giữ vai trò backward-compatible shim — import lại từ audio module.

Bao gồm:
- Giọng đọc lồng tiếng AI theo từng phân cảnh (OpenAI TTS, fallback say/chime)
- Nhạc nền bản quyền miễn phí theo chủ đề
- Phối âm đa kênh với tính năng ducking
"""

from __future__ import annotations

# ============================================================
# RE-EXPORT từ Audio Studio module mới
# ============================================================

from media_ai.audio.tts_engine import (
    generate_speech_openai,
    generate_speech_local_fallback as generate_speech_fallback,
)
from media_ai.audio.music_engine import (
    resolve_music_path,
    get_audio_duration,
    LEGACY_NAME_TO_FILE,
)
from media_ai.audio.mixing_engine import (
    mix_audio,
    concat_audio_files,
    generate_silence,
    pad_voice_to_duration,
)

import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Optional

REPO_ROOT = Path(__file__).resolve().parents[3]
MUSIC_DIR = Path(__file__).resolve().parent / "assets" / "music"

# Giữ nguyên mapping cũ cho backward compat
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


def get_music_track_path(music_track_name: Optional[str]) -> Optional[Path]:
    """Tìm đường dẫn tệp nhạc nền phù hợp. Delegate sang audio module."""
    return resolve_music_path(legacy_name=music_track_name)


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

    ⚠️ Giữ nguyên API cũ để video_worker.py không cần thay đổi.
    Logic bên trong delegate sang các engine trong audio/ module.
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
            openai_voice = VOICE_MAPPING.get(voice_code, "nova")

            for idx, sc in enumerate(scenes):
                script = (sc.get("voiceScript") or sc.get("voice_script") or "").strip()
                weight = float(sc.get("durationSeconds") or sc.get("duration_seconds") or 1)
                scene_dur = round((weight / total_weights) * total_duration, 2)

                scene_voice = temp_dir / f"scene_{idx}.mp3"
                padded_voice = temp_dir / f"scene_{idx}_padded.mp3"

                if script:
                    # Delegate sang audio module TTS engine
                    success = generate_speech_openai(script, openai_voice, scene_voice)
                    if not success:
                        success = generate_speech_fallback(script, scene_voice)

                    # 24/09/2026: thứ tự tham số đúng chữ ký `mixing_engine`
                    # (voice, target_duration, padded). Trước đây truyền đảo
                    # (padded, duration) → pad hỏng mọi cảnh, nối giọng hỏng,
                    # video chỉ còn nhạc nền dù TTS đã đọc xong.
                    if (
                        success
                        and scene_voice.is_file()
                        and pad_voice_to_duration(scene_voice, scene_dur, padded_voice)
                    ):
                        voice_files.append(padded_voice)
                        has_voice = True
                        continue

                # Phân cảnh không có lời thoại (hoặc đọc/pad hỏng) -> im lặng đúng độ dài
                generate_silence(scene_dur, padded_voice)
                voice_files.append(padded_voice)

        if voice_code and voice_code != "none" and not has_voice:
            # 24/09/2026: trước đây im lặng — video ra chỉ có nhạc mà không ai biết vì sao.
            print(
                "⚠️ [AudioEngine] Đã chọn giọng đọc nhưng KHÔNG sinh được lời thoại nào "
                "(kiểm tra OPENAI_API_KEY / mạng / lời thoại trống) — video chỉ có nhạc nền.",
                flush=True,
            )

        full_voice: Optional[Path] = None
        if has_voice and voice_files:
            full_voice = temp_dir / "full_voice.mp3"
            concat_audio_files(voice_files, full_voice)

        # 2. Tìm tệp nhạc nền
        bgm_path = resolve_music_path(legacy_name=music_track)

        # 3. Phối trộn âm thanh — delegate sang mixing engine
        out_audio_file.parent.mkdir(parents=True, exist_ok=True)

        result = mix_audio(
            voice_file=full_voice,
            bgm_file=bgm_path,
            total_duration=total_duration,
            out_file=out_audio_file,
            voice_volume=1.0,
            bgm_ducking_volume=0.22,
            bgm_normal_volume=0.65,
        )

        return result

    except Exception as exc:
        print(f"❌ [AudioEngine] Phối trộn âm thanh thất bại: {exc}", flush=True)
        return None
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
