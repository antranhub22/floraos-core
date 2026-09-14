"""Cổng nhà cung cấp của M04a (M04 mục 6) — bản song song với
`workers/vision/providers/base.py` của M01.

Nguyên tắc giống hệt M01: không luật nghiệp vụ nào được phụ thuộc trực tiếp
vào một model cụ thể. Đổi từ model mã nguồn mở sang API thương mại rồi sang
model riêng của ALG chỉ được phép chạm vào `providers/`, không chạm pipeline.

Năm cổng theo đúng M04 mục 6. Bản này (P9 đợt một) mới hiện thực hai:
`ImageEnhancer` (bằng `PassthroughEnhancer`) và `IdentityVerifier` — ba cổng
còn lại khai ở đây để pipeline gọi đúng tên ngay từ đầu, hiện thực sau.
"""

from __future__ import annotations

from typing import Protocol, TypedDict


class KetQuaTangCuong(TypedDict, total=False):
    """Đầu ra của một lượt tăng cường ảnh.

    `generated_flags` KHÔNG có giá trị mặc định ngầm (`YC-A5`): provider phải
    khai rõ có dùng generative fill hay không. Một adapter quên khai sẽ bị
    `assets` từ chối ở phía TS chứ không âm thầm ghi `false`.
    """

    image: bytes
    generated_flags: dict
    parameters: dict
    variants: dict[str, bytes]


class ImageEnhancer(Protocol):
    name: str
    model_version: str

    def enhance(self, image: bytes, config: dict) -> KetQuaTangCuong: ...


class Segmenter(Protocol):
    """Tách sản phẩm khỏi nền. M04 mục 6 gợi ý tái dùng SAM2 của M01."""

    name: str
    model_version: str

    def segment(self, image: bytes) -> dict: ...


class BackgroundProcessor(Protocol):
    name: str
    model_version: str

    def process(self, image: bytes, mask: dict, config: dict) -> bytes: ...


class Upscaler(Protocol):
    name: str
    model_version: str

    def upscale(self, image: bytes, target_resolution: tuple[int, int]) -> bytes: ...


class IdentityVerifier(Protocol):
    """Cổng cứng. `compare` trả đúng khối `identity_guard` của đặc tả 06 mục 8.

    Ràng buộc V1.2 của M04 (`YC-N4`): hai lượt phân tích của MỘT job phải
    dùng cùng provider và cùng model version. Cổng này nhận nguyên
    `VisionAnalyzer` chứ không nhận hai `dict` rời, để chỗ hiện thực còn có
    thể tự bảo đảm ràng buộc đó — xem `media_ai/guard/verifier.py`.
    """

    def compare(self, original_fingerprint: dict, enhanced_image: bytes) -> dict: ...
