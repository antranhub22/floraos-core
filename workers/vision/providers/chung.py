"""Phần dùng chung của mọi adapter gọi OpenAI.

Ba bộ máy là ba lớp riêng vì chúng làm ba việc khác nhau. Nhưng những thứ
dưới đây không phải việc của bộ máy nào cả — chúng là cách nói chuyện với
nhà cung cấp cho đúng, và viết hai lần nghĩa là lần sau sửa một chỗ quên
chỗ kia.
"""

from __future__ import annotations

import io
import json
from pathlib import Path
from typing import Any

from PIL import Image

CONTRACTS_DIR = Path(__file__).resolve().parent.parent / "contracts"

# Lời gọi nhà cung cấp phải có hạn. Mặc định của SDK là 600 giây: một lượt
# treo giữ nguyên job ở `PROCESSING` đủ lâu để quét treo (15 phút) đánh dấu
# `FAILED` trong khi lượt gọi vẫn đang chạy và vẫn tính tiền.
TIMEOUT_GOI_GIAY = 120.0
SO_LAN_THU_LAI = 2

# Cạnh dài tối đa trước khi gửi đi. `config.json` đặt 1400 px và ghi rõ lý do
# ở khoá `_ghi_chu_workers`: ảnh điện thoại nguyên cỡ đẩy một lượt lên 14–24
# nghìn token, vượt trần 30.000 token mỗi phút của tài khoản và rớt 429.
CANH_DAI_MAC_DINH_PX = 1400


def nap_json(ten: str) -> dict:
    return json.loads((CONTRACTS_DIR / ten).read_text(encoding="utf-8"))


def nap_text(ten: str) -> str:
    return (CONTRACTS_DIR / ten).read_text(encoding="utf-8")


def doc_dap_ung(response: Any) -> dict:
    """Đọc thân JSON của một đáp ứng structured output, nói rõ khi không đọc được.

    `json.loads(response.choices[0].message.content)` đọc thẳng sẽ vỡ bằng
    `JSONDecodeError` hoặc `TypeError` ở ba tình huống bình thường của nhà
    cung cấp: mô hình từ chối trả lời (`refusal`), đáp ứng bị cắt vì chạm
    trần token (`finish_reason = "length"` — JSON cụt), hoặc `content` rỗng.
    Cả ba đều làm job `FAILED` với một câu lỗi không ai đọc ra nguyên nhân.
    """
    try:
        choice = response.choices[0]
    except (AttributeError, IndexError) as exc:
        raise ValueError("Nhà cung cấp trả đáp ứng rỗng") from exc

    tu_choi = getattr(choice.message, "refusal", None)
    if tu_choi:
        raise ValueError(f"Mô hình từ chối phân tích ảnh: {tu_choi}")

    if getattr(choice, "finish_reason", None) == "length":
        raise ValueError(
            "Đáp ứng bị cắt vì chạm trần token — JSON không trọn vẹn. "
            "Giảm khối danh mục trong lời nhắc hoặc nâng trần của mô hình."
        )

    content = getattr(choice.message, "content", None)
    if not content:
        raise ValueError(
            f"Nhà cung cấp trả thân rỗng (finish_reason={getattr(choice, 'finish_reason', None)})"
        )

    try:
        return json.loads(content)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Thân đáp ứng không phải JSON hợp lệ: {exc}") from exc


def thu_nho_anh(image: bytes, canh_dai_px: int) -> tuple[bytes, str]:
    """Trả ảnh JPEG có cạnh dài không quá `canh_dai_px`, kèm kiểu MIME.

    Hai việc cùng lúc. Thứ nhất là chi phí: số token của một ảnh tỉ lệ với
    diện tích, nên gửi ảnh gốc 4000 px thay vì 1400 px tốn khoảng tám lần
    tiền cho cùng một câu trả lời. Thứ hai là kiểu tệp: dán mọi ảnh vào URL
    dữ liệu khai `image/jpeg` kể cả khi đó là PNG hay WebP là khai sai —
    chuẩn hoá về JPEG ở đây làm lời khai đó thành đúng.

    Ảnh không đọc được thì trả nguyên byte đầu vào: quyết định ảnh hỏng hay
    không là việc của nhà cung cấp, không phải của bước chuẩn bị.
    """
    try:
        with Image.open(io.BytesIO(image)) as anh:
            anh = anh.convert("RGB")
            canh_dai = max(anh.size)
            if canh_dai > canh_dai_px:
                ty_le = canh_dai_px / canh_dai
                anh = anh.resize(
                    (max(1, round(anh.width * ty_le)), max(1, round(anh.height * ty_le))),
                    Image.Resampling.LANCZOS,
                )
            dem = io.BytesIO()
            anh.save(dem, format="JPEG", quality=90)
            return dem.getvalue(), "image/jpeg"
    except Exception:  # noqa: BLE001
        return image, "image/jpeg"
