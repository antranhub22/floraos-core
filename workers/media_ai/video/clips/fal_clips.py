"""Kling và Luma qua hàng đợi fal.ai (25/09/2026) — cùng `FalClient` đã dùng ở Khu vực D.

- Kling: `fal-ai/kling-video/v2.1/master/image-to-video` — `duration` "5" | "10".
- Luma Ray 2: `fal-ai/luma-dream-machine/ray-2/image-to-video` — `duration` "5s" | "9s".
Lược đồ theo trang API fal; CHƯA gọi thật từ máy agent (nợ #153).
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import httpx

from media_ai.providers.scene.base import SceneProviderError
from media_ai.providers.scene.fal_client import FalClient
from media_ai.video.clips.base import ClipProviderError, ClipRequest, data_uri


def _url_video(ra: dict[str, Any]) -> str:
    v = ra.get("video")
    if isinstance(v, dict) and isinstance(v.get("url"), str):
        return v["url"]
    raise ClipProviderError("fal không trả video")


class _FalClip:
    name = ""
    model_version = ""

    def __init__(self, api_key: str | None = None, client: httpx.Client | None = None, khoang_poll_s: float = 3.0) -> None:
        # Video sinh lâu hơn ảnh: poll thưa hơn, tổng thời gian chờ ~ 90 × 3s.
        self._fal = FalClient(api_key=api_key, client=client, timeout_s=300, khoang_poll_s=khoang_poll_s)

    def co_khoa(self) -> bool:
        return bool(self._fal.api_key)

    def _dau_vao(self, req: ClipRequest) -> dict[str, Any]:
        raise NotImplementedError

    def sinh_clip(self, req: ClipRequest, out_path: Path) -> Path:
        try:
            ra = self._fal.chay(self.model_version, self._dau_vao(req))
            out_path.write_bytes(self._fal.tai_bytes(_url_video(ra)))
        except SceneProviderError as exc:
            raise ClipProviderError(f"{self.name}: {exc}", exc.status_code) from exc
        return out_path


class KlingClip(_FalClip):
    name = "kling"
    model_version = "fal-ai/kling-video/v2.1/master/image-to-video"

    def _dau_vao(self, req: ClipRequest) -> dict[str, Any]:
        return {
            "prompt": req.prompt,
            "image_url": data_uri(req.image_path),
            "duration": "5" if req.duration_s <= 5.5 else "10",
            "negative_prompt": "blur, distort, low quality, extra flowers, text, watermark",
        }


class LumaClip(_FalClip):
    name = "luma"
    model_version = "fal-ai/luma-dream-machine/ray-2/image-to-video"

    def _dau_vao(self, req: ClipRequest) -> dict[str, Any]:
        return {
            "prompt": req.prompt,
            "image_url": data_uri(req.image_path),
            "aspect_ratio": req.aspect_ratio if req.aspect_ratio in ("9:16", "16:9", "1:1", "4:3", "3:4") else "9:16",
            "duration": "5s" if req.duration_s <= 5.5 else "9s",
            "resolution": "720p",
        }
