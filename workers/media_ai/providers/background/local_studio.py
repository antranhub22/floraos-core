"""Phông Studio cục bộ theo khung adapter chung (Đợt 1, 24/09/2026).

0 credit, không gọi mạng. Dựng phông ĐÚNG kích thước khung làm việc — trước
đây phông có kích thước ảnh Master rồi bị đệm màu trơn cho đủ khung đích.

Bảng năng lực nói thật: phông cục bộ không đọc lời nhắc, không có seed (vi hạt
và bokeh dùng seed cố định trong `StudioBackdropEngine`), nên các ý định đó
được ghi vào `bo_qua` thay vì giả vờ làm được.
"""

from __future__ import annotations

from media_ai.image.studio_backdrop import StudioBackdropEngine
from media_ai.providers.background.base import BackgroundRequest, BackgroundResult, NangLuc


class LocalStudioBackground:
    name = "local_studio"
    model_version = "studio-backdrop-v1"
    nang_luc = NangLuc(seed=False, negative_prompt=False, ratios=frozenset({"1:1", "4:5", "9:16", "16:9"}), prompt=False)

    def __init__(self, style: str = "warm_gray") -> None:
        self._style = style
        self._engine = StudioBackdropEngine()

    def generate(self, req: BackgroundRequest) -> BackgroundResult:
        bo_qua: list[str] = []
        if req.seed is not None:
            bo_qua.append("seed")
        if (req.scene_prompt or "").strip() or (req.lighting_mood or "").strip() or req.palette:
            bo_qua.append("prompt")
        anh = self._engine.create_backdrop(req.rong, req.cao, style=self._style, with_grain=True)  # type: ignore[arg-type]
        return BackgroundResult(anh=anh.convert("RGBA"), prompt=None, seed=None, aspect_ratio=req.ratio, bo_qua=bo_qua)
