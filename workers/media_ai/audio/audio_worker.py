"""
Audio Worker — Worker xử lý job âm thanh độc lập.

Lấy việc bằng SELECT FOR UPDATE SKIP LOCKED + LISTEN/NOTIFY.
Feature: "audio.generate"

Pipeline:
1. Nhận job từ generation_jobs
2. Sinh voice từng scene qua TTS Engine (multi-provider fallback)
3. Nối voice scenes thành 1 track liên tục
4. Chọn nhạc nền theo mood/trackId
5. Phối trộn voice + BGM (ducking)
6. Upload kết quả lên storage
7. Cập nhật trạng thái job
"""

from __future__ import annotations

import json
import os
import shutil
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Optional

from .tts_engine import generate_speech
from .mixing_engine import (
    resolve_music_file,
    pad_voice_to_duration,
    generate_silence,
    concat_audio_files,
    mix_audio,
    get_audio_duration,
)


def process_audio_job(payload: Dict[str, Any], work_dir: Path) -> Dict[str, Any]:
    """
    Xử lý 1 audio job.

    Args:
        payload: Dữ liệu job từ generation_jobs.payload
        work_dir: Thư mục tạm để lưu file trung gian

    Returns:
        Dict kết quả để ghi vào generation_jobs.output
    """
    task_type = payload.get("taskType", "AUDIO_MIX")
    scenes = payload.get("scenes", [])
    total_duration = float(payload.get("totalDurationSeconds", 30))
    voice_id = payload.get("voiceId", "flora-nu-truyen-cam")
    provider_key = payload.get("providerKey", "openai")
    provider_voice_code = payload.get("providerVoiceCode", "nova")
    quality_tier = payload.get("qualityTier", "standard")
    music_track_id = payload.get("musicTrackId")
    voice_volume = float(payload.get("voiceVolume", 1.0))
    bgm_ducking = float(payload.get("bgmDuckingVolume", 0.22))
    bgm_normal = float(payload.get("bgmNormalVolume", 0.65))

    work_dir.mkdir(parents=True, exist_ok=True)
    voice_dir = work_dir / "voices"
    voice_dir.mkdir(exist_ok=True)

    # ── Bước 1: Sinh voice từng scene ──
    voice_files: List[Path] = []
    scene_outputs: List[Dict[str, Any]] = []
    has_voice = False
    provider_used = provider_key

    n_scenes = max(1, len(scenes))
    total_weights = sum(
        float(sc.get("targetDurationSeconds", 1)) for sc in scenes
    ) or float(n_scenes)

    for idx, scene in enumerate(scenes):
        script = (scene.get("voiceScript") or "").strip()
        weight = float(scene.get("targetDurationSeconds", 1))
        scene_dur = round((weight / total_weights) * total_duration, 2)

        scene_voice = voice_dir / f"scene_{idx}.mp3"
        padded_voice = voice_dir / f"scene_{idx}_padded.mp3"

        actual_duration = 0.0

        if script:
            success, used_provider = generate_speech(
                text=script,
                voice_code=provider_voice_code,
                out_file=scene_voice,
                provider=provider_key,
                quality=quality_tier,
            )

            if success and scene_voice.is_file():
                provider_used = used_provider
                pad_voice_to_duration(scene_voice, scene_dur, padded_voice)
                voice_files.append(padded_voice)
                has_voice = True
                actual_duration = get_audio_duration(padded_voice)

                scene_outputs.append({
                    "sceneIndex": scene.get("sceneIndex", idx + 1),
                    "voiceUrl": None,  # Sẽ điền sau khi upload
                    "voiceStorageKey": None,
                    "actualDurationSeconds": actual_duration,
                })
                continue

        # Scene không có script → im lặng
        generate_silence(scene_dur, padded_voice)
        voice_files.append(padded_voice)
        actual_duration = scene_dur

        scene_outputs.append({
            "sceneIndex": scene.get("sceneIndex", idx + 1),
            "voiceUrl": None,
            "voiceStorageKey": None,
            "actualDurationSeconds": actual_duration,
        })

    # ── Bước 2: Nối voice thành 1 track ──
    full_voice: Optional[Path] = None
    if has_voice and voice_files:
        full_voice = work_dir / "full_voice.mp3"
        concat_audio_files(voice_files, full_voice)
        if not (full_voice.is_file() and full_voice.stat().st_size > 0):
            full_voice = None

    # ── Bước 3: Chọn nhạc nền ──
    bgm_file = resolve_music_file(music_track_id)

    # ── Bước 4: Phối trộn ──
    mixed_audio = work_dir / "mixed_audio.m4a"
    result_file = mix_audio(
        voice_file=full_voice,
        bgm_file=bgm_file,
        total_duration=total_duration,
        out_file=mixed_audio,
        voice_volume=voice_volume,
        bgm_ducking_volume=bgm_ducking,
        bgm_normal_volume=bgm_normal,
    )

    if result_file and result_file.is_file():
        final_duration = get_audio_duration(result_file)
        return {
            "status": "COMPLETED",
            "mixedAudioPath": str(result_file),
            "voiceOnlyPath": str(full_voice) if full_voice else None,
            "totalDurationSeconds": final_duration,
            "providerUsed": provider_used,
            "scenes": scene_outputs,
        }

    return {
        "status": "FAILED",
        "error": "Không thể phối trộn âm thanh",
        "providerUsed": provider_used,
        "scenes": scene_outputs,
    }
