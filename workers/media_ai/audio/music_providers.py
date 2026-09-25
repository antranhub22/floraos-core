"""
Nhạc nền do nhà cung cấp sinh (PO 25/09/2026 — nhà cung cấp trước, thư viện là đường lùi).

Khoá khớp `PROVIDER_CATALOG.music` ở `src/modules/creative-production/domain/provider-catalog.ts`.
Mỗi bên nhận (mô tả, số giây, tệp ra) và ném `NhaCungCapNhacLoi` khi hỏng — hàm
`sinh_nhac_theo_thu_tu` thử lần lượt theo thứ tự của lượt, gom lý do từng bên;
mọi bên lỗi thì trả `None` để worker lùi về bài thư viện và GHI RÕ lý do.

ElevenLabs Music: `POST https://api.elevenlabs.io/v1/music` (header `xi-api-key`),
thân `{prompt, music_length_ms, model_id, force_instrumental}`, trả thẳng byte mp3.
Nhạc nền không lời để không lấn giọng đọc.
"""

from __future__ import annotations

from pathlib import Path
from typing import Callable, Dict, List, Optional, Tuple

from .tts_engine import _ensure_api_key

ELEVENLABS_MUSIC_URL = "https://api.elevenlabs.io/v1/music"
# Giới hạn độ dài của API (ms) — ngoài khoảng thì kẹp lại, worker cắt/lặp sau.
_MIN_MS = 10_000
_MAX_MS = 300_000


class NhaCungCapNhacLoi(RuntimeError):
    pass


# Tâm trạng (khớp `MusicMood` phía TS) → mô tả nhạc tiếng Anh cho mô hình.
_MO_TA_TAM_TRANG: Dict[str, str] = {
    "romantic": "romantic, tender piano and soft strings",
    "upbeat": "upbeat, cheerful acoustic pop with light percussion",
    "chill": "chill lo-fi beats, relaxed and warm",
    "warm": "warm acoustic guitar, cozy and heartfelt",
    "luxury": "elegant, luxurious lounge with soft jazz piano",
}


def mo_ta_nhac(mood: Optional[str], chu_de: Optional[str] = None) -> str:
    """Lời nhắc sinh nhạc: nhạc nền không lời cho video tiệm hoa, theo tâm trạng."""
    phan_mood = _MO_TA_TAM_TRANG.get((mood or "").lower(), _MO_TA_TAM_TRANG["warm"])
    them = f", mood inspired by: {chu_de.strip()[:120]}" if chu_de and chu_de.strip() else ""
    return (
        f"Instrumental background music for a flower shop social media video, {phan_mood}{them}. "
        "No vocals, gentle dynamics that sit under a voiceover, clean ending."
    )


def sinh_nhac_elevenlabs(prompt: str, seconds: float, out_file: Path, post: Optional[Callable] = None) -> None:
    api_key = _ensure_api_key("ELEVENLABS_API_KEY")
    if not api_key:
        raise NhaCungCapNhacLoi("elevenlabs_music: thiếu ELEVENLABS_API_KEY")
    if post is None:
        import requests

        post = requests.post
    ms = int(min(_MAX_MS, max(_MIN_MS, round(seconds * 1000))))
    try:
        resp = post(
            ELEVENLABS_MUSIC_URL,
            params={"output_format": "mp3_44100_128"},
            headers={"xi-api-key": api_key, "Content-Type": "application/json"},
            json={"prompt": prompt, "music_length_ms": ms, "model_id": "music_v1", "force_instrumental": True},
            timeout=240,
        )
    except Exception as exc:  # noqa: BLE001 — lỗi mạng của bên này, thử bên kế tiếp
        raise NhaCungCapNhacLoi(f"elevenlabs_music: lỗi mạng ({exc})") from exc
    if resp.status_code != 200:
        raise NhaCungCapNhacLoi(f"elevenlabs_music: HTTP {resp.status_code} {str(getattr(resp, 'text', ''))[:200]}")
    if not resp.content or len(resp.content) < 1_000:
        raise NhaCungCapNhacLoi("elevenlabs_music: tệp trả về rỗng")
    out_file.parent.mkdir(parents=True, exist_ok=True)
    out_file.write_bytes(resp.content)


MUSIC_PROVIDERS: Dict[str, Callable[..., None]] = {
    "elevenlabs_music": sinh_nhac_elevenlabs,
}


def sinh_nhac_theo_thu_tu(
    thu_tu: List[str],
    prompt: str,
    seconds: float,
    out_dir: Path,
) -> Tuple[Optional[Path], Optional[str], List[str]]:
    """Thử lần lượt; trả (tệp, bên đã sinh, lý do các bên hỏng). Hết danh sách → (None, None, lý do)."""
    ly_do: List[str] = []
    for key in thu_tu:
        fn = MUSIC_PROVIDERS.get(key)
        if fn is None:
            ly_do.append(f"{key}: chưa có adapter")
            continue
        out = out_dir / f"bgm_{key}.mp3"
        try:
            fn(prompt, seconds, out)
        except NhaCungCapNhacLoi as exc:
            ly_do.append(str(exc))
            continue
        if out.is_file() and out.stat().st_size > 0:
            return out, key, ly_do
        ly_do.append(f"{key}: không ghi được tệp")
    return None, None, ly_do
