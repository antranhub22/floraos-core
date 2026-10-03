"""Runway Gen-4 Turbo — ảnh → video (25/09/2026).

`POST https://api.dev.runwayml.com/v1/image_to_video` (header `X-Runway-Version`),
poll `GET /v1/tasks/{id}` tới `SUCCEEDED`, tải `output[0]`. Khoá
`RUNWAYML_API_SECRET`. Lược đồ theo tài liệu Runway API; CHƯA gọi thật (nợ #153).
"""

from __future__ import annotations

import os
import time
from pathlib import Path

import httpx

from media_ai.video.clips.base import ClipProviderError, ClipRequest, data_uri

BASE = "https://api.dev.runwayml.com/v1"
VERSION = "2024-11-06"
TY_LE = {"9:16": "720:1280", "16:9": "1280:720", "1:1": "960:960", "4:5": "832:1104"}


class RunwayClip:
    name = "runway"
    model_version = "gen4_turbo"

    def __init__(self, api_key: str | None = None, client: httpx.Client | None = None, khoang_poll_s: float = 5.0, so_lan_poll: int = 120) -> None:
        self.api_key = api_key if api_key is not None else os.environ.get("RUNWAYML_API_SECRET")
        self._client = client
        self._khoang = khoang_poll_s
        self._so_lan = so_lan_poll

    def co_khoa(self) -> bool:
        return bool(self.api_key)

    def _hdr(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.api_key}", "X-Runway-Version": VERSION, "Content-Type": "application/json"}

    def sinh_clip(self, req: ClipRequest, out_path: Path) -> Path:
        if not self.api_key:
            raise ClipProviderError("Thiếu RUNWAYML_API_SECRET")
        client = self._client or httpx.Client(timeout=120)
        try:
            r = client.post(f"{BASE}/image_to_video", headers=self._hdr(), json={
                "model": self.model_version,
                "promptImage": data_uri(req.image_path),
                "promptText": req.prompt[:1000],
                "ratio": TY_LE.get(req.aspect_ratio, "720:1280"),
                "duration": 5 if req.duration_s <= 5.5 else 10,
            })
            if r.status_code not in (200, 201):
                raise ClipProviderError(f"Runway từ chối (HTTP {r.status_code}): {r.text[:160]}", r.status_code)
            task_id = r.json().get("id")
            if not task_id:
                raise ClipProviderError("Runway không trả id tác vụ")
            for _ in range(self._so_lan):
                t = client.get(f"{BASE}/tasks/{task_id}", headers=self._hdr())
                if t.status_code != 200:
                    raise ClipProviderError(f"Runway lỗi khi hỏi tác vụ (HTTP {t.status_code})", t.status_code)
                d = t.json()
                st = d.get("status")
                if st == "SUCCEEDED":
                    out = (d.get("output") or [None])[0]
                    if not out:
                        raise ClipProviderError("Runway xong nhưng không có video")
                    v = client.get(out)
                    if v.status_code != 200:
                        raise ClipProviderError(f"Không tải được video Runway (HTTP {v.status_code})", v.status_code)
                    out_path.write_bytes(v.content)
                    return out_path
                if st in ("FAILED", "CANCELLED"):
                    raise ClipProviderError(f"Runway tác vụ {st}: {str(d.get('failure') or '')[:160]}")
                time.sleep(self._khoang)
            raise ClipProviderError("Runway quá thời gian chờ")
        except httpx.HTTPError as exc:
            raise ClipProviderError(f"Lỗi mạng khi gọi Runway: {exc}") from exc
        finally:
            if self._client is None:
                client.close()
