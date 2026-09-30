"""Nhà cung cấp clip video — khoá khớp `provider-catalog.ts` loại `video` (25/09/2026)."""

from __future__ import annotations

from typing import Callable

from media_ai.video.clips.base import ClipProvider
from media_ai.video.clips.fal_clips import KlingClip, LumaClip
from media_ai.video.clips.runway_clip import RunwayClip
from media_ai.video.clips.veo_clip import VeoClip

NHA_CUNG_CAP_CLIP: dict[str, Callable[[], ClipProvider]] = {
    "veo": VeoClip,
    "kling": KlingClip,
    "runway": RunwayClip,
    "luma": LumaClip,
}


def thu_tu_clip(order: list[str]) -> list[ClipProvider]:
    """Theo thứ tự core gửi; bỏ khoá lạ; CHỈ bên có khoá."""
    ds = [NHA_CUNG_CAP_CLIP[k]() for k in dict.fromkeys(str(x).lower() for x in order) if k in NHA_CUNG_CAP_CLIP]
    return [p for p in ds if p.co_khoa()]
