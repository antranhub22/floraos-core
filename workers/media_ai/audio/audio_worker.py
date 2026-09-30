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
from .music_providers import mo_ta_nhac, sinh_nhac_theo_thu_tu
from .mixing_engine import (
    resolve_music_file,
    fit_voice_to_scene,
    generate_silence,
    concat_audio_files,
    mix_audio,
    get_audio_duration,
    measure_loudness,
)

# Bốn loại tác vụ (24/09/2026, khớp `audio-task-rules.ts`). Trước ngày này hàm
# dưới KHÔNG đọc `taskType`: cả bốn nút cùng ra một bản TTS + nhạc.
TASK_OUTPUT = {
    "VOICEOVER": "voice_only",
    "MUSIC_SELECT": "music_only",
    "AUDIO_MIX": "voice_and_music",
    "VOICE_CLONE": "voice_and_music",
}


def _sinh_giong_cac_canh(payload: Dict[str, Any], voice_dir: Path) -> Dict[str, Any]:
    """TTS từng cảnh → khớp thời lượng (kéo dài cảnh thay vì tua nhanh)."""
    scenes = payload.get("scenes", []) or []
    provider_key = payload.get("providerKey") or "openai"
    provider_voice_code = payload.get("providerVoiceCode") or "nova"
    quality_tier = payload.get("qualityTier", "standard")
    voice_map = payload.get("providerVoiceMap") or None
    strict = bool(payload.get("strictProvider"))
    chain_order = [p for p in (payload.get("providerOrder") or []) if isinstance(p, str)]

    voice_files: List[Path] = []
    scene_outputs: List[Dict[str, Any]] = []
    providers_used: List[str] = []
    has_voice = False

    for idx, scene in enumerate(scenes):
        script = (scene.get("voiceScript") or "").strip()
        target = float(scene.get("targetDurationSeconds", 5) or 5)
        scene_voice = voice_dir / f"scene_{idx}.mp3"
        fitted = voice_dir / f"scene_{idx}_fit.mp3"
        scene_index = scene.get("sceneIndex", idx + 1)

        if script:
            success, used = generate_speech(
                text=script,
                voice_code=provider_voice_code,
                out_file=scene_voice,
                provider=provider_key,
                quality=quality_tier,
                voice_map=voice_map,
                strict=strict,
                chain_order=chain_order,
            )
            if success and scene_voice.is_file():
                dur = fit_voice_to_scene(scene_voice, target, fitted)
                if dur > 0:
                    voice_files.append(fitted)
                    providers_used.append(used)
                    has_voice = True
                    scene_outputs.append({
                        "sceneIndex": scene_index,
                        "targetDurationSeconds": target,
                        "actualDurationSeconds": dur,
                        "extended": dur > target + 0.05,
                        "providerUsed": used,
                    })
                    continue
            # Có lời mà không đọc được: dừng cả job — một bản thiếu câu giữa
            # chừng không bán được, và credit sẽ được hoàn.
            return {
                "status": "FAILED",
                "error": (
                    f"Không sinh được giọng đọc cho cảnh {scene_index}"
                    + (
                        " bằng giọng nhân bản (ElevenLabs). Kiểm tra ELEVENLABS_API_KEY và giọng còn tồn tại."
                        if strict
                        else f": mọi nhà cung cấp TTS đều lỗi (bắt đầu từ '{provider_key}'). "
                        "Kiểm tra OPENAI_API_KEY / ELEVENLABS_API_KEY / mạng của worker, hoặc cài `edge-tts`."
                    )
                ),
            }

        generate_silence(target, fitted)
        voice_files.append(fitted)
        scene_outputs.append({
            "sceneIndex": scene_index,
            "targetDurationSeconds": target,
            "actualDurationSeconds": target,
            "extended": False,
            "providerUsed": None,
        })

    return {
        "status": "OK",
        "voice_files": voice_files,
        "scenes": scene_outputs,
        "has_voice": has_voice,
        "providers_used": providers_used,
    }


def process_audio_job(
    payload: Dict[str, Any],
    work_dir: Path,
    music_bytes: Optional[bytes] = None,
) -> Dict[str, Any]:
    """
    Xử lý 1 audio job theo `taskType`:

    - VOICEOVER: chỉ giọng đọc (không nhạc).
    - MUSIC_SELECT: chỉ nhạc, cắt/loop đủ `totalDurationSeconds`, không TTS.
    - AUDIO_MIX: giọng + nhạc (sidechain ducking, -14 LUFS).
    - VOICE_CLONE: như AUDIO_MIX nhưng giọng nhân bản, không lùi nhà cung cấp.

    `music_bytes`: tệp nhạc tiệm tự tải (đọc từ kho ở vòng đời job).
    """
    task_type = payload.get("taskType") or "AUDIO_MIX"
    output_kind = TASK_OUTPUT.get(task_type)
    if output_kind is None:
        return {"status": "FAILED", "error": f"Loại tác vụ không hỗ trợ: {task_type}"}

    total_duration = float(payload.get("totalDurationSeconds", 30) or 30)
    voice_volume = float(payload.get("voiceVolume", 1.0))
    bgm_ducking = float(payload.get("bgmDuckingVolume", 0.22))
    bgm_normal = float(payload.get("bgmNormalVolume", 0.65))

    work_dir.mkdir(parents=True, exist_ok=True)
    voice_dir = work_dir / "voices"
    voice_dir.mkdir(exist_ok=True)

    # ── Nhạc nền ──
    bgm_file: Optional[Path] = None
    wants_music = output_kind in ("music_only", "voice_and_music")
    if wants_music:
        if music_bytes:
            bgm_file = work_dir / "bgm_upload"
            bgm_file.write_bytes(music_bytes)
        else:
            track_id = payload.get("musicTrackId")
            bgm_file = resolve_music_file(track_id) if track_id else None
            if track_id and bgm_file is None:
                return {"status": "FAILED", "error": f"Không tìm thấy tệp nhạc của bài '{track_id}' trên worker"}
        if bgm_file is None and (output_kind == "music_only" or task_type == "AUDIO_MIX"):
            return {"status": "FAILED", "error": "Tác vụ này cần một bài nhạc nền"}

    # ── Giọng đọc ──
    full_voice: Optional[Path] = None
    scene_outputs: List[Dict[str, Any]] = []
    providers_used: List[str] = []
    has_voice = False
    if output_kind != "music_only":
        voice = _sinh_giong_cac_canh(payload, voice_dir)
        if voice["status"] != "OK":
            return {"status": "FAILED", "error": voice["error"], "providerUsed": "none"}
        scene_outputs = voice["scenes"]
        providers_used = voice["providers_used"]
        has_voice = voice["has_voice"]
        if not has_voice:
            return {"status": "FAILED", "error": "Không có lời thoại nào để đọc"}
        full_voice = work_dir / "full_voice.mp3"
        if not concat_audio_files(voice["voice_files"], full_voice) or full_voice.stat().st_size == 0:
            return {"status": "FAILED", "error": "Không nối được giọng các cảnh"}
        # Cảnh được kéo dài → tổng thời lượng theo giọng thật.
        total_duration = max(sum(float(s["actualDurationSeconds"]) for s in scene_outputs), 1.0)

    # ── Nhạc nền do nhà cung cấp sinh (PO 25/09/2026) ──
    # Sinh SAU giọng đọc để đúng thời lượng thật. Bài thư viện / bài tiệm tải
    # ở trên là đường lùi: mọi bên lỗi thì dùng nó và ghi rõ lý do.
    music_order = [p for p in (payload.get("musicProviderOrder") or []) if isinstance(p, str)]
    music_provider_used: Optional[str] = None
    music_fallback_reason: Optional[str] = None
    if wants_music and music_order:
        sinh, music_provider_used, ly_do = sinh_nhac_theo_thu_tu(
            music_order,
            mo_ta_nhac(payload.get("musicMood"), payload.get("musicPromptHint")),
            total_duration + 1.0,
            work_dir,
        )
        if sinh is not None:
            bgm_file = sinh
        else:
            # Tác vụ bắt buộc nhạc đã có bài dự phòng (kiểm ở trên); nhạc tuỳ chọn thì bỏ nhạc.
            music_fallback_reason = "; ".join(ly_do) or "không nhà cung cấp nào sinh được nhạc"

    # ── Phối ──
    mixed_audio = work_dir / "mixed_audio.m4a"
    result_file = mix_audio(
        voice_file=full_voice,
        bgm_file=bgm_file if wants_music else None,
        total_duration=total_duration,
        out_file=mixed_audio,
        voice_volume=voice_volume,
        bgm_ducking_volume=bgm_ducking,
        bgm_normal_volume=bgm_normal,
    )
    if not (result_file and result_file.is_file()):
        return {"status": "FAILED", "error": "Không thể phối trộn âm thanh", "scenes": scene_outputs}

    voice_only: Optional[Path] = None
    if full_voice is not None and wants_music and bgm_file is not None:
        # Bản chỉ-giọng cho người dựng video / phối lại (đã chuẩn hoá độ to).
        voice_only = mix_audio(full_voice, None, total_duration, work_dir / "voice_only.m4a", voice_volume)

    provider_used = providers_used[0] if providers_used else None
    if providers_used and len(set(providers_used)) > 1:
        provider_used = ",".join(sorted(set(providers_used)))

    return {
        "status": "COMPLETED",
        "taskType": task_type,
        "output": output_kind,
        "mixedAudioPath": str(result_file),
        "voiceOnlyPath": str(voice_only) if voice_only else None,
        "totalDurationSeconds": get_audio_duration(result_file),
        "loudnessLufs": measure_loudness(result_file),
        "providerUsed": provider_used,
        "hasVoice": has_voice,
        "hasMusic": bool(wants_music and bgm_file is not None),
        "musicProviderUsed": music_provider_used,
        "musicFallback": music_fallback_reason is not None,
        "musicFallbackReason": music_fallback_reason,
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

        music_bytes = None
        music_key = payload.get("musicStorageKey")
        if music_key:
            # Bài tiệm tự tải: khoá phải nằm trong kho của CHÍNH tổ chức của job.
            if not str(music_key).startswith(f"org/{organization_id}/"):
                raise RuntimeError("Tệp nhạc không thuộc tổ chức của job")
            from shared.storage import doc_bytes

            music_bytes = doc_bytes(music_key, _STORAGE_ROOT)

        ket_qua = process_audio_job(payload, work_dir, music_bytes=music_bytes)
        if ket_qua.get("status") != "COMPLETED" or not ket_qua.get("mixedAudioPath"):
            raise RuntimeError(ket_qua.get("error") or "Không phối trộn được âm thanh")

        tep = Path(ket_qua["mixedAudioPath"])
        mime = _MIME_THEO_DUOI.get(tep.suffix.lower(), "audio/mp4")
        storage_key = (
            f"org/{organization_id}/{job.get('product_id') or 'unfiled'}/"
            f"{uuid.uuid4()}_audio{tep.suffix.lower() or '.m4a'}"
        )
        ghi_bytes(storage_key, tep.read_bytes(), mime, _STORAGE_ROOT)

        voice_only_key = None
        if ket_qua.get("voiceOnlyPath"):
            vo = Path(ket_qua["voiceOnlyPath"])
            voice_only_key = storage_key.rsplit("_audio", 1)[0] + "_voice" + (vo.suffix.lower() or ".m4a")
            ghi_bytes(voice_only_key, vo.read_bytes(), _MIME_THEO_DUOI.get(vo.suffix.lower(), "audio/mp4"), _STORAGE_ROOT)

        output = {
            "audio_storage_key": storage_key,
            "voice_only_storage_key": voice_only_key,
            "mime_type": mime,
            "task_type": ket_qua.get("taskType"),
            "output": ket_qua.get("output"),
            "total_duration_seconds": ket_qua.get("totalDurationSeconds"),
            "loudness_lufs": ket_qua.get("loudnessLufs"),
            "provider_used": ket_qua.get("providerUsed"),
            # 24/09/2026: trước đây suy từ `voiceOnlyPath` — luôn True kể cả bản chỉ nhạc.
            "has_voice": bool(ket_qua.get("hasVoice")),
            "has_music": bool(ket_qua.get("hasMusic")),
            "music_provider_used": ket_qua.get("musicProviderUsed"),
            "music_fallback": bool(ket_qua.get("musicFallback")),
            "music_fallback_reason": ket_qua.get("musicFallbackReason"),
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
