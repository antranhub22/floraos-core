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


# ─── Vòng đời một job `audio.generate` (23/09/2026) ─────────────────────────
#
# Trước ngày này KHÔNG worker nào nhận `audio.generate`: route TS trừ credit
# qua `enqueueJob` rồi job đứng PENDING mãi, và `process_audio_job` chỉ trả về
# đường dẫn tệp tạm cục bộ. Hàm dưới đây nối nó vào hàng đợi chung
# (`media_ai/jobs/worker.py`), ghi kết quả lên kho (`shared.storage.ghi_bytes`),
# và đặt đúng ba trục `status`/`stage`/`result`.

AUDIO_FEATURE = "audio.generate"
_REPO_ROOT = Path(__file__).resolve().parents[3]
_STORAGE_ROOT = _REPO_ROOT / "var" / "storage"

_MIME_THEO_DUOI = {".m4a": "audio/mp4", ".mp3": "audio/mpeg", ".wav": "audio/wav"}


def _su_kien(conn: Any, job_id: str, event: str, payload: Dict[str, Any]) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO job_events (id, job_id, seq, event, payload, created_at)
            VALUES (gen_random_uuid(), %(job_id)s,
                    COALESCE((SELECT MAX(seq) FROM job_events WHERE job_id = %(job_id)s), 0) + 1,
                    %(event)s, %(payload)s, now())
            """,
            {"job_id": job_id, "event": event, "payload": json.dumps(payload)},
        )
    conn.commit()


def process_audio_generation_job(conn: Any, job: Dict[str, Any]) -> None:
    """Chạy một job `audio.generate` đã được `claim_next` nhận (status PROCESSING)."""
    import uuid

    from shared.storage import ghi_bytes

    job_id = job["id"]
    organization_id = job["organization_id"]  # chỉ từ dòng job, không từ payload
    payload = job["payload"] if isinstance(job["payload"], dict) else json.loads(job["payload"])
    work_dir = Path(tempfile.mkdtemp(prefix=f"audio_{job_id}_"))
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE generation_jobs SET stage = 'GENERATING' WHERE id = %s", (job_id,))
        conn.commit()
        _su_kien(conn, job_id, "stage", {"stage": "GENERATING"})

        ket_qua = process_audio_job(payload, work_dir)
        if ket_qua.get("status") != "COMPLETED" or not ket_qua.get("mixedAudioPath"):
            raise RuntimeError(ket_qua.get("error") or "Không phối trộn được âm thanh")

        tep = Path(ket_qua["mixedAudioPath"])
        mime = _MIME_THEO_DUOI.get(tep.suffix.lower(), "audio/mp4")
        storage_key = (
            f"org/{organization_id}/{job.get('product_id') or 'unfiled'}/"
            f"{uuid.uuid4()}_audio{tep.suffix.lower() or '.m4a'}"
        )
        ghi_bytes(storage_key, tep.read_bytes(), mime, _STORAGE_ROOT)

        output = {
            "audio_storage_key": storage_key,
            "mime_type": mime,
            "total_duration_seconds": ket_qua.get("totalDurationSeconds"),
            "provider_used": ket_qua.get("providerUsed"),
            "has_voice": bool(ket_qua.get("voiceOnlyPath")),
            "scenes": ket_qua.get("scenes", []),
        }
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE generation_jobs
                   SET status = 'COMPLETED', result = 'SAFE', stage = NULL,
                       completed_at = now(), output = %s
                 WHERE id = %s
                """,
                (json.dumps(output), job_id),
            )
        conn.commit()
        _su_kien(conn, job_id, "done", {"status": "COMPLETED", **output})
    except Exception as exc:  # noqa: BLE001 — hỏng kỹ thuật, không phải phán quyết
        conn.rollback()
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE generation_jobs
                   SET status = 'FAILED', error = %s, stage = NULL, attempts = attempts + 1
                 WHERE id = %s
                """,
                (str(exc)[:1000], job_id),
            )
        conn.commit()
        _su_kien(conn, job_id, "done", {"status": "FAILED", "error": str(exc)[:1000]})
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)
