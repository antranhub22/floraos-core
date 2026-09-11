"""Florence-2 — chặng gọi tên của bộ máy `local_cv` (Cục bộ).

Hiện thực `BoGoiTen` khai ở `vision/providers/local_cv.py`. Đóng nợ #55
cùng đợt với `local_cv_segmenter.py` — đọc docstring module đó trước, cảnh
báo CHƯA CHẠY THỬ áp dụng y hệt ở đây: môi trường viết mã không cài được
`transformers`/`torch` (chặn mạng tới `huggingface.co`/`pypi.org`), nên mã
suy luận trong tệp này chưa chạy thử lần nào trên trọng số thật. Trước khi
dùng thật, làm theo năm bước ở đầu `local_cv_segmenter.py` (đổi phần cài đặt
sang `transformers` và tải mô hình Florence-2 qua `from_pretrained`, không
cần tải tay như SAM2 — `huggingface_hub` tự tải khi máy có mạng).

## Vì sao cắt ảnh theo bbox rồi caption, không dùng token vùng của Florence-2

Florence-2 có tác vụ vùng thật (`<REGION_TO_CATEGORY>`,
`<REGION_TO_DESCRIPTION>`) nhận toạ độ qua token `<loc_NNN>` lượng tử hoá
0-999. Cách đó chính xác hơn nhưng đòi khớp đúng quy ước lượng tử của từng
phiên bản mô hình — sai một chỗ làm mô hình đọc nhầm vùng mà không báo lỗi
gì, tức lỗi âm thầm và khó bắt. Cắt ảnh theo `bbox` (đã chuẩn hoá ở
`local_cv_segmenter`) rồi hỏi `<CAPTION>` trên riêng vùng đã cắt thô hơn
nhưng sai ở đâu thấy ngay khi nhìn ảnh đã cắt — đúng tinh thần "một bộ máy
giả chạy trót lọt còn tệ hơn báo lỗi rõ ràng" đã nêu ở
`registry._dung_local_cv`. Đổi sang token vùng là việc kế tiếp khi có bộ
ảnh vàng để đo, ghi thêm ở `TECHNICAL_DEBT.md` khi làm.

## Độ chắc dựng từ đâu

Florence-2 sinh chữ, không có "confidence" tự nhiên như một bộ phân loại.
Bộ này lấy trung bình xác suất token của câu đã sinh (từ
`compute_transition_scores` của `generate()`) làm ước lượng — không phải
xác suất mô hình gọi ĐÚNG loài, chỉ là mô hình chắc CHỮ NÓ VỪA SINH đến đâu.
`local_cv.py` đã ép trần ở `CONFIDENCE_KHONG_CO_DANH_MUC` (55) phía trên lớp
này rồi, nên con số ở đây chỉ cần đủ để phân biệt "mô hình lưỡng lự" khỏi
"mô hình chắc" trong nội bộ — không phải số cuối cùng người soát nhìn thấy.
"""

from __future__ import annotations

import math
from typing import Any


def _don_ma_caption(chu: str) -> str:
    """Florence-2 đôi khi trả kèm dấu chấm cuối câu hoặc khoảng trắng thừa.
    Không cắt bớt nội dung — chỉ dọn phần thừa không mang nghĩa, để nhãn thô
    đưa vào `local_cv._nhom_theo_nhan` không bị lệch vì khoảng trắng hay dấu
    câu ở cuối.
    """
    return chu.strip().rstrip(".").strip()


def _do_chac_tu_diem_chuyen(diem_chuyen: list[float]) -> int:
    """`diem_chuyen` là log-xác suất từng token đã sinh (đơn vị log, từ
    `transition_scores`). Đổi sang xác suất trung bình rồi quy về thang
    0-100.

    Danh sách rỗng — mô hình không sinh token nào — trả 0, không trả một
    con số bịa: đó đúng nghĩa "không có gì để chắc chắn về". `math.exp`
    được chặn trần ở 0.0 trước khi tính mũ vì log-xác suất về lý thuyết
    không dương, nhưng một số bản `transformers` có thể trả số dương nhỏ do
    làm tròn dấu phẩy động — chặn ở đây để không vô tình vượt quá 100% xác
    suất cho một token.
    """
    if not diem_chuyen:
        return 0
    xac_suat = [math.exp(min(0.0, lg)) for lg in diem_chuyen]
    trung_binh = sum(xac_suat) / len(xac_suat)
    return max(0, min(100, round(trung_binh * 100)))


def _cat_bbox_co_dem(
    kich_thuoc_anh: tuple[int, int],
    bbox_chuan_hoa: tuple[float, float, float, float],
    ty_le_dem: float,
) -> tuple[int, int, int, int]:
    """Khung cắt pixel `(x0, y0, x1, y1)` từ `bbox` chuẩn hoá (trái, trên,
    phải, dưới) 0-1, có đệm thêm `ty_le_dem` mỗi cạnh. Đệm vì SAM2 đôi khi
    cắt sát mép cánh hoa, và Florence-2 caption tốt hơn khi thấy chút bối
    cảnh quanh vật thể thay vì đúng khung mặt nạ.

    Khung luôn rộng và cao ít nhất 1px, và không bao giờ vượt biên ảnh —
    một bbox sát mép cộng đệm âm không được phép cắt ra toạ độ âm.
    """
    rong, cao = kich_thuoc_anh
    trai, tren, phai, duoi = bbox_chuan_hoa
    rong_bbox = max(phai - trai, 0.0)
    cao_bbox = max(duoi - tren, 0.0)
    dem_x = rong_bbox * ty_le_dem
    dem_y = cao_bbox * ty_le_dem

    x0 = max(0, round((trai - dem_x) * rong))
    y0 = max(0, round((tren - dem_y) * cao))
    x1 = min(rong, round((phai + dem_x) * rong))
    y1 = min(cao, round((duoi + dem_y) * cao))

    if x1 <= x0:
        x1 = min(rong, x0 + 1)
    if y1 <= y0:
        y1 = min(cao, y0 + 1)
    return (x0, y0, x1, y1)


class Florence2Labeler:
    """`BoGoiTen` — Florence-2 chạy trên máy chủ của chính tổ chức.

    Nạp `torch`/`transformers` và trọng số LÚC DỰNG (`__init__`), cùng lý do
    và cùng quy tắc #6 như `Sam2Segmenter`.
    """

    name = "local_cv.florence2_labeler"

    def __init__(
        self,
        model_id: str | None = None,
        device: str | None = None,
        task_prompt: str | None = None,
        max_new_tokens: int | None = None,
        ty_le_dem_bbox: float | None = None,
    ) -> None:
        from vision.providers.chung import nap_json

        config = nap_json("config.json")
        self._model_id = model_id or config.get("florence2_model_id") or "florence-community/Florence-2-base"
        self._task_prompt = task_prompt or config.get("florence2_task_prompt") or "<CAPTION>"
        self._max_new_tokens = max_new_tokens or int(config.get("florence2_max_new_tokens", 64))
        self._ty_le_dem_bbox = (
            ty_le_dem_bbox
            if ty_le_dem_bbox is not None
            else float(config.get("florence2_bbox_dem_ty_le", 0.08))
        )

        # Từ đây trở xuống mới đụng `torch`/`transformers` — import trong
        # __init__, không ở đầu tệp, cùng lý do đã ghi ở `Sam2Segmenter`.
        import torch
        from transformers import AutoProcessor, Florence2ForConditionalGeneration

        # `transformers >= 5.15.1` hỗ trợ Florence-2 NGUYÊN BẢN qua
        # `Florence2ForConditionalGeneration` — không cần `trust_remote_code`.
        # Đổi từ mã từ xa của `microsoft/Florence-2-base` (đã chạy thử thật
        # 2026-09-11: mã đó gọi `self.forced_bos_token_id` mà
        # `PretrainedConfig` của `transformers` 5.17 không còn cấp mặc định,
        # ném `AttributeError` ngay lúc nạp) sang bản nguyên bản trong
        # `florence-community/Florence-2-base` — cùng trọng số, khác đường
        # nạp. Né được luôn vụ `flash_attn` chỉ chạy trên CUDA mà mã từ xa
        # cũ đòi hỏi dù máy không có CUDA.
        self._device = device or config.get("local_cv_device") or (
            "cuda"
            if torch.cuda.is_available()
            else "mps"
            if torch.backends.mps.is_available()
            else "cpu"
        )

        # `float16` trên MPS thường ra NaN ở một số lớp attention của
        # Florence-2 (vấn đề đã biết của backend MPS, không phải của mô
        # hình) — `float32` chậm hơn nhưng cho kết quả đúng. CUDA vẫn dùng
        # `float16` cho tốc độ vì đây là nơi Florence-2 được kiểm thử chính.
        self._dtype = torch.float16 if self._device == "cuda" else torch.float32

        # Nạp trọng số MỘT LẦN ở đây, cùng lý do `Sam2Segmenter.__init__`
        # (quy tắc #6). Dùng `florence-community/Florence-2-base` (hỗ trợ
        # nguyên bản trong `transformers`, không cần `trust_remote_code`) —
        # xem lý do đổi từ `microsoft/Florence-2-base` ở khối import phía
        # trên.
        self._model = Florence2ForConditionalGeneration.from_pretrained(
            self._model_id,
            torch_dtype=self._dtype,
            low_cpu_mem_usage=True,
        ).to(self._device)
        self._processor = AutoProcessor.from_pretrained(self._model_id)
        self._torch = torch

    @property
    def model_version(self) -> str:
        return self._model_id

    def goi_ten(self, image: bytes, mat_na: Any) -> tuple[str, int]:
        import io

        from PIL import Image

        with Image.open(io.BytesIO(image)) as anh:
            anh_rgb = anh.convert("RGB")
            x0, y0, x1, y1 = _cat_bbox_co_dem(anh_rgb.size, mat_na.bbox, self._ty_le_dem_bbox)
            anh_cat = anh_rgb.crop((x0, y0, x1, y1))

        inputs = self._processor(
            text=self._task_prompt, images=anh_cat, return_tensors="pt"
        ).to(self._device)
        # `input_ids` phải giữ nguyên kiểu số nguyên — chỉ ép kiểu
        # `pixel_values` khớp `self._dtype` của mô hình. Processor luôn trả
        # `pixel_values` ở `float32`; không ép lại thì CUDA chạy `float16`
        # sẽ ném lỗi lệch kiểu giữa ảnh vào và trọng số mô hình.
        inputs["pixel_values"] = inputs["pixel_values"].to(self._dtype)

        with self._torch.no_grad():
            dau_ra = self._model.generate(
                input_ids=inputs["input_ids"],
                pixel_values=inputs["pixel_values"],
                max_new_tokens=self._max_new_tokens,
                num_beams=1,  # greedy — compute_transition_scores không cần sửa beam
                do_sample=False,
                output_scores=True,
                return_dict_in_generate=True,
            )

        # `skip_special_tokens=False` vì `post_process_generation` của chính
        # Florence-2 cần các token đặc biệt còn nguyên để phân giải đúng tác
        # vụ — cắt sớm ở bước decode làm bước phân giải phía dưới đọc sai.
        chuoi_sinh = self._processor.batch_decode(dau_ra.sequences, skip_special_tokens=False)[0]

        ket_qua_dich = self._processor.post_process_generation(
            chuoi_sinh, task=self._task_prompt, image_size=anh_cat.size
        )
        nhan_tho = ket_qua_dich.get(self._task_prompt, chuoi_sinh)
        nhan = _don_ma_caption(str(nhan_tho))

        diem_chuyen = self._model.compute_transition_scores(
            dau_ra.sequences, dau_ra.scores, normalize_logits=True
        )[0].tolist()
        do_chac = _do_chac_tu_diem_chuyen(diem_chuyen)

        return nhan, do_chac
