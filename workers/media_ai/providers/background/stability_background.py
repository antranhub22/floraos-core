"""Hậu cảnh do Stability AI sinh cho nhánh Cloud của M04b (23/09/2026).

Vì sao hậu cảnh RIÊNG, không "sửa ảnh có hoa":
    Nhánh Cloud cũ (`executeCloudCreative`, chạy đồng bộ trong request HTTP)
    gửi nguyên ảnh hoa cho nhà cung cấp và nhận về ảnh mới — bó hoa bị vẽ lại,
    nên không có cách nào ĐO Subject Integrity, và mã cũ gõ tay 0,98. Ở đây
    nhà cung cấp chỉ vẽ KHÔNG GIAN TRỐNG (không hoa, không người, không chữ).
    Worker dán NGUYÊN KHỐI chủ thể đã tách từ Master Image lên trên
    (`StudioBackdropEngine.composite(backdrop_image=...)`), rồi đo lõi chủ thể
    bằng đúng phép đo của nhánh local (`_do_lo_chu_the`). Bó hoa của tiệm
    không bao giờ đi qua mô hình sinh ảnh.

Endpoint: `POST https://api.stability.ai/v2beta/stable-image/generate/core`
(multipart/form-data, trả thẳng byte ảnh khi `Accept: image/*`) — cùng
endpoint `src/modules/media/adapters/stability-ai-image-provider.ts` đang dùng.

Chi phí: Stability không trả số tiền trong phản hồi. `cost_usd` để `None`
(chưa đo được), đúng nguyên tắc "chưa đo được khác 0" của `providers/chung.py`.
"""

from __future__ import annotations

import os
from typing import Any

import httpx

_ENDPOINT = "https://api.stability.ai/v2beta/stable-image/generate/core"

# Tỷ lệ Stability Core chấp nhận — chọn tỷ lệ gần nhất với khung cần phủ.
_TY_LE_HO_TRO: dict[str, float] = {
    "1:1": 1.0,
    "4:5": 0.8,
    "5:4": 1.25,
    "2:3": 2 / 3,
    "3:2": 1.5,
    "9:16": 9 / 16,
    "16:9": 16 / 9,
    "21:9": 21 / 9,
    "9:21": 9 / 21,
}

# Luôn nối vào lời nhắc: nhà cung cấp chỉ được vẽ không gian trống. Nếu mô hình
# vẫn vẽ lẫn hoa vào hậu cảnh thì bó hoa thật dán đè lên vẫn nguyên vẹn — đây là
# lớp giảm nhiễu thị giác, không phải lớp bảo vệ sản phẩm.
_RANG_BUOC_CANH_TRONG = (
    "empty scene, no flowers, no bouquet, no vase, no people, no hands, no text, "
    "no logo, space in the center foreground for a product, photorealistic"
)
_NEGATIVE = "flowers, bouquet, vase, person, hand, text, watermark, logo, blurry, distorted"

_DO_DAI_PROMPT_TOI_DA = 600


class BackgroundProviderError(RuntimeError):
    """Nhà cung cấp không sinh được hậu cảnh (thiếu khoá, hết credit, lỗi mạng…).

    Worker bắt lỗi này để LÙI về phông tự dựng cục bộ, không làm hỏng job.
    """

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code


def chon_ty_le(width: int, height: int) -> str:
    if width <= 0 or height <= 0:
        return "1:1"
    muc_tieu = width / height
    return min(_TY_LE_HO_TRO, key=lambda k: abs(_TY_LE_HO_TRO[k] - muc_tieu))


def lam_sach_prompt(scene_prompt: str | None) -> str:
    """Cắt độ dài, bỏ ký tự điều khiển, luôn nối ràng buộc 'cảnh trống'."""
    goc = (scene_prompt or "").strip()
    goc = "".join(ch for ch in goc if ch.isprintable())
    goc = goc[:_DO_DAI_PROMPT_TOI_DA]
    if not goc:
        goc = "elegant softly lit interior backdrop for a flower shop product photo"
    return f"{goc}. {_RANG_BUOC_CANH_TRONG}"


class StabilityBackgroundProvider:
    name = "stability_ai"
    model_version = "stable-image-core-v2beta"

    def __init__(
        self,
        api_key: str | None = None,
        client: httpx.Client | None = None,
        timeout_s: float = 60.0,
    ) -> None:
        self._api_key = api_key if api_key is not None else os.environ.get("STABILITY_API_KEY")
        self._client = client
        self._timeout_s = timeout_s

    def sinh_hau_canh(self, scene_prompt: str | None, width: int, height: int) -> dict[str, Any]:
        """Trả `{"image": bytes, "prompt": str, "aspect_ratio": str}`.

        Ném `BackgroundProviderError` cho MỌI lỗi — kể cả thiếu khoá — để
        worker có đúng một nhánh lùi về phông cục bộ.
        """
        if not self._api_key:
            raise BackgroundProviderError("Thiếu STABILITY_API_KEY")

        prompt = lam_sach_prompt(scene_prompt)
        ty_le = chon_ty_le(width, height)
        client = self._client if self._client is not None else httpx.Client(timeout=self._timeout_s)
        try:
            resp = client.post(
                _ENDPOINT,
                headers={"Authorization": f"Bearer {self._api_key}", "Accept": "image/*"},
                files={"none": ("", b"")},
                data={
                    "prompt": prompt,
                    "negative_prompt": _NEGATIVE,
                    "aspect_ratio": ty_le,
                    "output_format": "png",
                },
            )
        except httpx.HTTPError as exc:
            raise BackgroundProviderError(f"Lỗi mạng khi gọi Stability: {exc}") from exc
        finally:
            if self._client is None:
                client.close()

        if resp.status_code != 200:
            raise BackgroundProviderError(
                f"Stability trả HTTP {resp.status_code}: {resp.text[:200]}",
                status_code=resp.status_code,
            )
        content_type = resp.headers.get("content-type", "")
        if not content_type.startswith("image/") or len(resp.content) < 100:
            raise BackgroundProviderError(
                f"Stability trả dữ liệu không phải ảnh ({content_type}, {len(resp.content)} bytes)"
            )
        return {"image": resp.content, "prompt": prompt, "aspect_ratio": ty_le}


def resolve_background_provider(provider_key: str | None) -> StabilityBackgroundProvider:
    """Hiện chỉ có Stability — khoá lạ cũng không được âm thầm đổi nhà cung cấp."""
    key = (provider_key or "stability").strip().lower()
    if key not in {"stability", "stability_ai"}:
        raise BackgroundProviderError(f"Nhà cung cấp hậu cảnh chưa hỗ trợ: {provider_key}")
    return StabilityBackgroundProvider()
