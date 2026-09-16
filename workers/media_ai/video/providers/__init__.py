"""
Video Provider Registry & Factory (M04c).
Điều phối việc chọn Provider theo ưu tiên:
1. Yêu cầu cụ thể từ tham số gọi / job payload
2. Biến môi trường hệ thống: AI_VIDEO_PROVIDER (mặc định: LOCAL_CINEMATIC)
"""

from __future__ import annotations

import os
from typing import Optional

from media_ai.video.providers.base import BaseVideoProvider, VideoProviderError
from media_ai.video.providers.local_cinematic import LocalCinematicProvider
from media_ai.video.providers.veo_provider import GoogleVeoProvider
from media_ai.video.providers.heygen_provider import HeyGenProvider

__all__ = [
    "BaseVideoProvider",
    "VideoProviderError",
    "LocalCinematicProvider",
    "GoogleVeoProvider",
    "HeyGenProvider",
    "get_video_provider",
]


def get_video_provider(provider_name: Optional[str] = None) -> BaseVideoProvider:
    """
    Lấy thể hiện Provider tương ứng.
    - LOCAL_CINEMATIC (Mặc định — Phương án A): 0 cost, FFmpeg Ken Burns, siêu tốc
    - VEO (Phương án B Standby): Google Veo AI Video Generation
    - HEYGEN (Phương án B Standby): HeyGen Talking Avatar Video Generation
    """
    target = (
        provider_name
        or os.environ.get("AI_VIDEO_PROVIDER")
        or "LOCAL_CINEMATIC"
    ).upper().strip()

    if target in ("VEO", "GOOGLE_VEO"):
        return GoogleVeoProvider()
    elif target in ("HEYGEN", "TALKING_PHOTO"):
        return HeyGenProvider()
    else:
        return LocalCinematicProvider()
