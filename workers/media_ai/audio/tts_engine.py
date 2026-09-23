"""
TTS Engine — Bộ xử lý Text-to-Speech đa nhà cung cấp.

Hỗ trợ:
- OpenAI TTS (tts-1 / tts-1-hd)
- ElevenLabs (multilingual_v2)
- MiniMax TTS
- Edge TTS (miễn phí, Microsoft)
- Local fallback (macOS say)

Tách riêng khỏi video_worker để có thể gọi độc lập cho ảnh, bài post, v.v.
"""

from __future__ import annotations

import os
import shutil
import subprocess
from pathlib import Path
from typing import Optional

REPO_ROOT = Path(__file__).resolve().parents[3]


def _ensure_api_key(env_var: str) -> Optional[str]:
    """Đọc API key từ biến môi trường hoặc .env file."""
    val = os.environ.get(env_var)
    if val:
        return val

    env_file = REPO_ROOT / ".env"
    if env_file.is_file():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            if line.startswith(f"{env_var}="):
                val = line.split("=", 1)[1].strip().strip('"').strip("'")
                if val:
                    os.environ[env_var] = val
                    return val
    return None


# ============================================================
# PROVIDER 1: OpenAI TTS
# ============================================================

def generate_speech_openai(
    text: str,
    voice_code: str,
    out_file: Path,
    quality: str = "standard",
) -> bool:
    """Sinh giọng đọc bằng OpenAI TTS (tts-1 hoặc tts-1-hd)."""
    api_key = _ensure_api_key("OPENAI_API_KEY")
    if not api_key:
        return False

    model = "tts-1-hd" if quality == "hd" else "tts-1"

    try:
        import openai
        client = openai.OpenAI(api_key=api_key)
        response = client.audio.speech.create(
            model=model,
            voice=voice_code,
            input=text,
        )
        out_file.parent.mkdir(parents=True, exist_ok=True)
        with open(out_file, "wb") as f:
            f.write(response.content)
        return out_file.is_file() and out_file.stat().st_size > 0
    except Exception as exc:
        print(f"⚠️ [TTS/OpenAI] Lỗi: {exc}", flush=True)
        return False


# ============================================================
# PROVIDER 2: ElevenLabs
# ============================================================

def generate_speech_elevenlabs(
    text: str,
    voice_code: str,
    out_file: Path,
    quality: str = "standard",
) -> bool:
    """Sinh giọng đọc bằng ElevenLabs API."""
    api_key = _ensure_api_key("ELEVENLABS_API_KEY")
    if not api_key:
        return False

    try:
        import requests
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_code}"
        headers = {
            "xi-api-key": api_key,
            "Content-Type": "application/json",
        }
        model_id = (
            "eleven_multilingual_v2"
            if quality == "premium"
            else "eleven_turbo_v2_5"
        )
        payload = {
            "text": text,
            "model_id": model_id,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
            },
        }
        resp = requests.post(url, json=payload, headers=headers, timeout=30)
        if resp.status_code == 200:
            out_file.parent.mkdir(parents=True, exist_ok=True)
            with open(out_file, "wb") as f:
                f.write(resp.content)
            return out_file.is_file() and out_file.stat().st_size > 0
        print(f"⚠️ [TTS/ElevenLabs] HTTP {resp.status_code}: {resp.text[:200]}", flush=True)
        return False
    except Exception as exc:
        print(f"⚠️ [TTS/ElevenLabs] Lỗi: {exc}", flush=True)
        return False


# ============================================================
# PROVIDER 3: MiniMax TTS
# ============================================================

def generate_speech_minimax(
    text: str,
    voice_code: str,
    out_file: Path,
    quality: str = "standard",
) -> bool:
    """Sinh giọng đọc bằng MiniMax TTS API."""
    api_key = _ensure_api_key("MINIMAX_API_KEY")
    group_id = os.environ.get("MINIMAX_GROUP_ID", "")
    if not api_key or not group_id:
        return False

    try:
        import requests
        url = f"https://api.minimax.chat/v1/t2a_v2?GroupId={group_id}"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": "speech-01-turbo",
            "text": text,
            "voice_setting": {
                "voice_id": voice_code,
                "speed": 1.0,
                "vol": 1.0,
                "pitch": 0,
            },
            "audio_setting": {
                "sample_rate": 32000,
                "bitrate": 128000,
                "format": "mp3",
            },
        }
        resp = requests.post(url, json=payload, headers=headers, timeout=30)
        if resp.status_code == 200:
            data = resp.json()
            audio_hex = data.get("data", {}).get("audio", "")
            if audio_hex:
                out_file.parent.mkdir(parents=True, exist_ok=True)
                with open(out_file, "wb") as f:
                    f.write(bytes.fromhex(audio_hex))
                return out_file.is_file() and out_file.stat().st_size > 0
        print(f"⚠️ [TTS/MiniMax] HTTP {resp.status_code}", flush=True)
        return False
    except Exception as exc:
        print(f"⚠️ [TTS/MiniMax] Lỗi: {exc}", flush=True)
        return False


# ============================================================
# PROVIDER 4: Microsoft Edge TTS (miễn phí)
# ============================================================

def generate_speech_edge_tts(
    text: str,
    voice_code: str,
    out_file: Path,
) -> bool:
    """Sinh giọng đọc bằng Edge TTS (miễn phí, không cần API key)."""
    try:
        import edge_tts
        import asyncio

        async def _generate():
            communicate = edge_tts.Communicate(text, voice_code)
            out_file.parent.mkdir(parents=True, exist_ok=True)
            await communicate.save(str(out_file))

        asyncio.run(_generate())
        return out_file.is_file() and out_file.stat().st_size > 0
    except ImportError:
        print("⚠️ [TTS/EdgeTTS] Package 'edge-tts' chưa cài. pip install edge-tts", flush=True)
        return False
    except Exception as exc:
        print(f"⚠️ [TTS/EdgeTTS] Lỗi: {exc}", flush=True)
        return False


# ============================================================
# PROVIDER 5: Local Fallback (macOS say)
# ============================================================

def generate_speech_local_fallback(text: str, out_file: Path) -> bool:
    """Fallback TTS bằng macOS say hoặc âm báo nhẹ nhàng."""
    if shutil.which("say"):
        aiff_path = out_file.with_suffix(".aiff")
        try:
            subprocess.run(
                ["say", "-o", str(aiff_path), text],
                check=True,
                timeout=10,
            )
            if aiff_path.is_file():
                out_file.parent.mkdir(parents=True, exist_ok=True)
                subprocess.run(
                    ["ffmpeg", "-y", "-loglevel", "error", "-i", str(aiff_path), str(out_file)],
                    check=True,
                )
                aiff_path.unlink(missing_ok=True)
                return True
        except Exception as exc:
            print(f"⚠️ [TTS/Local] macOS say lỗi: {exc}", flush=True)
    return False


# ============================================================
# UNIFIED TTS ROUTER — Chuỗi fallback tự động
# ============================================================

# Thứ tự ưu tiên fallback
FALLBACK_CHAIN = ["openai", "elevenlabs", "minimax", "edge_tts", "local_fallback"]

PROVIDER_FUNCTIONS = {
    "openai": generate_speech_openai,
    "elevenlabs": generate_speech_elevenlabs,
    "minimax": generate_speech_minimax,
    "edge_tts": generate_speech_edge_tts,
    "local_fallback": generate_speech_local_fallback,
}


def generate_speech(
    text: str,
    voice_code: str,
    out_file: Path,
    provider: str = "openai",
    quality: str = "standard",
) -> tuple[bool, str]:
    """
    Sinh giọng đọc với fallback tự động.
    Trả (success: bool, provider_used: str).
    """
    # Xếp provider được chọn lên đầu chuỗi fallback
    chain = [provider] + [p for p in FALLBACK_CHAIN if p != provider]

    for prov in chain:
        func = PROVIDER_FUNCTIONS.get(prov)
        if not func:
            continue

        if prov == "local_fallback":
            success = func(text, out_file)
        elif prov == "edge_tts":
            # Mã giọng của nhà cung cấp khác (vd. OpenAI "nova") không hợp lệ với
            # Edge TTS — lùi về giọng nữ tiếng Việt (23/09/2026).
            edge_voice = voice_code if "-" in (voice_code or "") else "vi-VN-HoaiMyNeural"
            success = func(text, edge_voice, out_file)
        else:
            success = func(text, voice_code, out_file, quality)

        if success:
            return True, prov

    return False, "none"
