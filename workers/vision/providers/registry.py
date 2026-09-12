"""Sổ đăng ký bộ máy phân tích — nơi duy nhất ánh xạ khoá bộ máy sang lớp.

Worker KHÔNG import lớp provider nào trực tiếp (quy tắc bất di bất dịch #2:
"Orchestrator không được import trực tiếp class provider cụ thể — chỉ làm
việc qua interface/registry"). Nó cầm một chuỗi lấy từ `payload.engine` của
dòng job và hỏi sổ này.

Khoá ở đây phải khớp từng chữ với `VISION_ENGINES` phía TypeScript
(`src/modules/products/domain/vision-engine.ts`). Hai bên không có nguồn sự
thật chung nào khác, y như `notify_channel_for` — nên có một ca thử khoá
đúng ba khoá này, và nó sẽ đỏ nếu một bên đổi mà bên kia quên.

Provider dựng LƯỜI, một lần rồi giữ lại: `OpenAI()` đọc biến môi trường lúc
dựng và các mô hình cục bộ nạp trọng số lúc dựng, nên dựng cả ba ngay lúc
worker khởi động sẽ bắt một tổ chức chỉ dùng bộ gọn phải có sẵn GPU.
"""

from __future__ import annotations

from typing import Any, Callable

KHOA_BO_MAY = ("openai_structured", "openai_direct", "local_cv")

MAC_DINH = "openai_direct"


def _dung_openai_structured() -> Any:
    from vision.providers.openai_structured import OpenAIStructuredProvider

    return OpenAIStructuredProvider()


def _dung_openai_direct() -> Any:
    from vision.providers.openai_direct import OpenAIDirectProvider

    return OpenAIDirectProvider()


def _dung_local_cv() -> Any:
    """SAM2 (tách) + Florence-2 (gọi tên), nạp một lần lúc dựng.

    Hai lớp nặng (`Sam2Segmenter`, `Florence2Labeler`) chỉ import `torch`
    bên trong `__init__` của chính chúng — tệp này vẫn import được ở một tổ
    chức chỉ dùng bộ Đầy đủ/Gọn mà không cài `torch`. Mọi lỗi dựng — thiếu
    gói, thiếu checkpoint, thiếu GPU — bọc lại thành `NotImplementedError`
    nói rõ nguyên nhân, chứ không để lộ một traceback khó đọc hay tệ hơn là
    lặng lẽ trả một provider giả (cùng nguyên tắc bản gốc của hàm này).

    CHƯA chạy thử trên trọng số thật — xem cảnh báo ở đầu
    `local_cv_segmenter.py`. Mã ở đây chỉ mới đóng nợ #55 phần wiring, chưa
    đóng phần "đã chạy tay ít nhất một lần" mà quy trình bàn giao đòi hỏi.
    """
    try:
        from vision.providers.local_cv_labeler import Florence2Labeler
        from vision.providers.local_cv_segmenter import Sam2Segmenter
    except ImportError as exc:
        raise NotImplementedError(
            "Bộ máy cục bộ cần `torch`, `transformers`, `sam2` và trọng số "
            "SAM2 đã tải về — cài theo `workers/requirements-local-cv.txt`. "
            f"Lỗi khi import: {exc}. "
            "Trong lúc chờ, Điều hành đổi bộ máy của tổ chức sang 'Đầy đủ' hoặc 'Gọn'."
        ) from exc

    from vision.providers.local_cv import LocalCvProvider

    try:
        bo_tach = Sam2Segmenter()
        bo_goi_ten = Florence2Labeler()
    except Exception as exc:  # noqa: BLE001 - nạp trọng số có nhiều kiểu lỗi khác nhau
        raise NotImplementedError(
            f"Bộ máy cục bộ (SAM2/Florence-2) không dựng được: {exc}. "
            "Kiểm tra `sam2_checkpoint`/`sam2_model_config`/`florence2_model_id` "
            "trong `contracts/config.json` và tài nguyên GPU của máy chủ. "
            "Trong lúc chờ, Điều hành đổi bộ máy của tổ chức sang 'Đầy đủ' hoặc 'Gọn'."
        ) from exc

    return LocalCvProvider(bo_tach=bo_tach, bo_goi_ten=bo_goi_ten)


_XUONG: dict[str, Callable[[], Any]] = {
    "openai_structured": _dung_openai_structured,
    "openai_direct": _dung_openai_direct,
    "local_cv": _dung_local_cv,
}

_DA_DUNG: dict[str, Any] = {}


def lay_provider(khoa: str | None) -> Any:
    """Provider cho một khoá bộ máy, dựng lười và giữ lại.

    Khoá lạ rơi về mặc định thay vì ném lỗi — cùng luật với
    `resolveVisionEngine` phía TS. Một dòng job cũ ghi tên bộ máy đã bỏ vẫn
    phải chạy được, chứ không nằm kẹt mãi.
    """
    ten = khoa if khoa in _XUONG else MAC_DINH
    if ten not in _DA_DUNG:
        _DA_DUNG[ten] = _XUONG[ten]()
    return _DA_DUNG[ten]
