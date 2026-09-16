"""
Google Veo Video Provider (Phương án B — Chế độ Standby / Sẵn sàng kích hoạt).
Thu hoạch & Chuẩn hóa từ SocialFlow backend/video_providers/veo.py.
Tạo video điện ảnh chuyển động chân thực từ ảnh hoa bằng mô hình Google Veo.
"""

from __future__ import annotations

import json
import os
import time
import urllib.request
from pathlib import Path
from typing import Any, Dict, Optional

from media_ai.video.providers.base import BaseVideoProvider, VideoProviderError
from media_ai.video.providers.local_cinematic import LocalCinematicProvider

DEFAULT_VEO_MODEL = "veo-2.0-generate-001"
POLL_INTERVAL_SECONDS = 5
MAX_POLL_ATTEMPTS = 60  # Tối đa 5 phút


class GoogleVeoProvider(BaseVideoProvider):
    """
    Adapter kết nối Google Veo AI Video Generation.
    Ở chế độ Standby: Sẵn sàng kích hoạt ngay khi cấu hình GOOGLE_VEO_API_KEY hoặc GEMINI_API_KEY.
    """

    def __init__(self, api_key: Optional[str] = None, model_name: str = DEFAULT_VEO_MODEL):
        self._api_key = api_key or os.environ.get("GOOGLE_VEO_API_KEY") or os.environ.get("GEMINI_API_KEY") or ""
        self._model_name = model_name
        self._fallback_provider = LocalCinematicProvider()

    @property
    def name(self) -> str:
        return "VEO"

    @property
    def model_version(self) -> str:
        return self._model_name

    def is_available(self) -> bool:
        """Kiểm tra có API Key để kết nối Google Veo không."""
        return bool(self._api_key.strip())

    def _submit_generation(self, prompt: str, image_path: Optional[Path], duration_sec: int) -> str:
        """Gửi yêu cầu sinh video tới Google Veo API endpoint."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self._model_name}:predictLongRunning?key={self._api_key}"
        headers = {"Content-Type": "application/json"}
        payload: Dict[str, Any] = {
            "prompt": prompt,
            "durationSeconds": min(15, max(5, duration_sec)),
            "fps": 30,
        }

        # Nếu có ảnh hoa đầu vào, gửi ảnh dạng base64
        if image_path and image_path.is_file():
            import base64
            with open(image_path, "rb") as f:
                b64 = base64.b64encode(f.read()).decode("utf-8")
            payload["image"] = {"bytesBase64Encoded": b64}

        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            op_name = data.get("name")
            if not op_name:
                raise VideoProviderError(f"Không nhận được mã tiến trình từ Veo: {data}")
            return op_name

    def _poll_operation(self, operation_name: str, out_file: Path) -> Path:
        """Thăm dò kết quả xử lý từ Google Veo."""
        url = f"https://generativelanguage.googleapis.com/v1beta/{operation_name}?key={self._api_key}"
        for attempt in range(MAX_POLL_ATTEMPTS):
            time.sleep(POLL_INTERVAL_SECONDS)
            req = urllib.request.Request(url, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if data.get("done"):
                    if "error" in data:
                        raise VideoProviderError(f"Veo render thất bại: {data['error']}")
                    res = data.get("response", {})
                    video_uri = res.get("videoUri") or res.get("video", {}).get("uri")
                    if video_uri:
                        # Tải video về tệp out_file
                        urllib.request.urlretrieve(video_uri, out_file)
                        return out_file
                    raise VideoProviderError(f"Veo hoàn tất nhưng không thấy videoUri: {data}")

        raise VideoProviderError(f"Quá thời gian chờ render từ Google Veo ({MAX_POLL_ATTEMPTS * POLL_INTERVAL_SECONDS}s)")

    def render_video(
        self,
        job_id: str,
        org_id: str,
        payload: Dict[str, Any],
        out_file: Path,
        progress_callback: Optional[Any] = None,
    ) -> Path:
        """
        Thực hiện render với Google Veo. Nếu chưa cấu hình Key, tự động dự phòng
        an toàn sang Local Cinematic Motion (Phương án A) và ghi chú cảnh báo.
        """
        if not self.is_available():
            print("ℹ️ [GoogleVeoProvider] Chưa cấu hình GOOGLE_VEO_API_KEY. Tự động dự phòng sang Local Cinematic.", flush=True)
            if progress_callback:
                progress_callback("LOG", {"message": "Google Veo chưa bật API Key, tự động chuyển sang Local Cinematic Motion"})
            return self._fallback_provider.render_video(job_id, org_id, payload, out_file, progress_callback)

        try:
            if progress_callback:
                progress_callback("STAGE", {"stage": "VEO_SUBMITTING", "progress": 30})

            scenes = payload.get("scenes") or []
            prompt = payload.get("title") or "Cinematic beautiful fresh flowers arrangement, smooth professional camera glide"
            duration = int(payload.get("durationSeconds") or 15)

            first_img: Optional[Path] = None
            if scenes:
                ref = scenes[0].get("imageAssetId") or scenes[0].get("imageUrl")
                if ref:
                    first_img = self._fallback_provider._resolve_image(str(ref), org_id, out_file.parent, 0)

            op_name = self._submit_generation(prompt=prompt, image_path=first_img, duration_sec=duration)
            if progress_callback:
                progress_callback("STAGE", {"stage": "VEO_PROCESSING", "progress": 50})

            return self._poll_operation(op_name, out_file)

        except Exception as err:
            print(f"⚠️ [GoogleVeoProvider] Lỗi Veo: {err}. Chuyển sang dự phòng Local Cinematic.", flush=True)
            if progress_callback:
                progress_callback("LOG", {"message": f"Veo gặp lỗi ({err}), chuyển sang dự phòng Local Cinematic"})
            return self._fallback_provider.render_video(job_id, org_id, payload, out_file, progress_callback)
