"""SAM2 — chặng tách thực thể của bộ máy `local_cv` (Cục bộ).

Hiện thực `BoTachThucThe` khai ở `vision/providers/local_cv.py`. Đóng nợ kỹ
thuật #55 (`docs/dac-ta/TECHNICAL_DEBT.md`) — phần còn thiếu duy nhất của
bộ này trước đợt build 2026-09-11.

## CHƯA CHẠY THỬ MỘT LẦN NÀO TRÊN TRỌNG SỐ THẬT

Môi trường viết mã (container CI, và VM cô lập trên máy phát triển) không
truy cập được `pypi.org`/`huggingface.co` để cài `torch`, `sam2` hay tải
trọng số — đúng chặn đã ghi ở nợ #55. Quy tắc bất di bất dịch #6 (nạp trọng
số một lần, giữ lại) và quy trình bàn giao ở
`docs/kien-truc/M01_FLORAOS_VISION_CODING_AGENT_GUIDE.md` mục 4 đòi code suy
luận phải chạy thử trước khi coi là xong — tệp này CHƯA đạt điều kiện đó.

Trước khi đổi bộ máy `local_cv` sang dùng thật (kể cả ở mức `thu_nghiem`):

1. `pip install -r workers/requirements-local-cv.txt` trên máy có GPU (CUDA
   hoặc Apple Silicon MPS đều chạy được — MPS chậm hơn CUDA nhưng chạy được;
   chạy TRÊN macOS thật, không phải qua VM cô lập của Claude — VM đó không
   thấy GPU của máy).
2. Tải trọng số SAM2 (không có trên PyPI — theo hướng dẫn chính thức của
   Meta tại repo `facebookresearch/sam2`) và điền đường dẫn vào
   `contracts/config.json` khoá `sam2_checkpoint` + `sam2_model_config`.
3. Chạy `pytest workers/tests/vision/test_local_cv_segmenter.py -v` — các ca
   thử thuần (không cần GPU, không cần `torch`) phải xanh trước.
4. Rồi chạy tay `Sam2Segmenter().tach(...)` trên một ảnh thật và soát bằng
   mắt số mặt nạ + khung bao trước khi đổi bộ máy của bất kỳ tổ chức nào
   sang `local_cv`.
5. Chỉ sau khi có kết quả thật mới đối chiếu với `BO_ANH_VANG.md` và cân
   nhắc đổi `trang_thai` phía TS (`MO_TA_BO_MAY.local_cv`) — việc đổi đó vẫn
   cần đo trên bộ ảnh vàng theo D5-c, không đổi bằng lập luận.

## Vì sao tách hàm thuần ra khỏi lớp nạp mô hình

`_bbox_xywh_chuan_hoa` và `_loc_va_chuan_hoa` không đụng tới `sam2`/`torch` —
chúng chỉ làm số học trên kết quả `SAM2AutomaticMaskGenerator.generate()` đã
trả về (một danh sách dict có khoá `area`, `bbox`, `stability_score`). Tách
riêng để có test chạy thật trong MỌI môi trường, kể cả môi trường không có
GPU — cùng tinh thần với `local_cv.lap_rap`: phần thuần luôn kiểm được,
phần nạp mô hình chờ máy có GPU.
"""

from __future__ import annotations

from typing import Any


class MatNaSam2:
    """Hiện thực `MatNa` (`local_cv.MatNa`) bọc một dict SAM2 trả về."""

    __slots__ = ("_bbox", "_dien_tich")

    def __init__(self, bbox: tuple[float, float, float, float], dien_tich: float) -> None:
        self._bbox = bbox
        self._dien_tich = dien_tich

    @property
    def bbox(self) -> tuple[float, float, float, float]:
        return self._bbox

    @property
    def dien_tich(self) -> float:
        return self._dien_tich

    def __repr__(self) -> str:  # pragma: no cover - tiện gỡ lỗi, không phải hành vi
        return f"MatNaSam2(bbox={self._bbox!r}, dien_tich={self._dien_tich!r})"


def _bbox_xywh_chuan_hoa(
    bbox_xywh: tuple[float, float, float, float], rong: int, cao: int
) -> tuple[float, float, float, float]:
    """SAM2 trả `bbox` dạng XYWH tính bằng pixel trên ảnh gốc đưa vào
    `generate()`. `MatNa` của `local_cv` đòi chuẩn hoá 0-1 theo (trái, trên,
    phải, dưới) — quy ước dùng chung với phần còn lại của module: không
    trường nào của `Schema.json` dùng pixel tuyệt đối, vì ảnh gửi cho các bộ
    máy khác luôn bị thu nhỏ trước ở `chung.thu_nho_anh`.

    Ảnh 0x0 (đầu vào hỏng) trả khung rỗng thay vì chia cho không.
    """
    if rong <= 0 or cao <= 0:
        return (0.0, 0.0, 0.0, 0.0)
    x, y, bw, bh = bbox_xywh
    trai = min(max(x / rong, 0.0), 1.0)
    tren = min(max(y / cao, 0.0), 1.0)
    phai = min(max((x + bw) / rong, 0.0), 1.0)
    duoi = min(max((y + bh) / cao, 0.0), 1.0)
    return (trai, tren, max(phai, trai), max(duoi, tren))


def _loc_va_chuan_hoa(
    mat_na_tho: list[dict[str, Any]],
    rong: int,
    cao: int,
    dien_tich_toi_thieu: float,
    on_dinh_toi_thieu: float,
    so_luong_toi_da: int,
) -> list[MatNaSam2]:
    """Lọc nhiễu và chuẩn hoá đầu ra thô của `SAM2AutomaticMaskGenerator`.

    Ba lý do lọc, không phải một:

    - `dien_tich_toi_thieu` bỏ mặt nạ vụn (nếp gấp giấy gói, hạt bụi) — SAM2
      tự động tách MỌI thứ nó thấy được, kể cả chi tiết không ai quan tâm
      khi đếm sản phẩm.
    - `on_dinh_toi_thieu` bỏ mặt nạ SAM2 tự báo không chắc
      (`stability_score` thấp) — thường là nhiễu ở biên giữa các cụm hoa
      dính nhau.
    - `so_luong_toi_da` chặn trần số lần gọi Florence-2 tiếp theo: một khung
      hoa vài trăm bông không cần từng ấy lượt gọi mô hình gán nhãn —
      `local_cv._nhom_theo_nhan` gộp các nhãn giống nhau lại sau đó, nên cắt
      bớt thực thể nhỏ nhất không làm sai tổng đếm bao nhiêu.

    Sắp theo diện tích giảm dần trước khi cắt bớt: giữ thực thể LỚN trước —
    một cụm hoa chiếm nửa khung ảnh quan trọng hơn một mảnh lá ở góc ảnh.

    Dòng thiếu `area` hoặc `bbox` bị bỏ qua thay vì làm hàm vỡ: một phiên
    bản SAM2 khác có thể đổi hình dạng dict trả về, và một mặt nạ đọc không
    được nên biến mất khỏi kết quả, không nên làm cả lượt phân tích lỗi.
    """
    ung_vien: list[tuple[float, tuple[float, float, float, float]]] = []
    for mn in mat_na_tho:
        dien_tich_px = mn.get("area")
        bbox = mn.get("bbox")
        if dien_tich_px is None or bbox is None:
            continue
        on_dinh = mn.get("stability_score", 1.0)
        if on_dinh is not None and on_dinh < on_dinh_toi_thieu:
            continue
        ty_le = dien_tich_px / float(rong * cao) if rong and cao else 0.0
        if ty_le < dien_tich_toi_thieu:
            continue
        ung_vien.append((ty_le, _bbox_xywh_chuan_hoa(tuple(bbox), rong, cao)))

    ung_vien.sort(key=lambda cap: cap[0], reverse=True)
    if so_luong_toi_da > 0:
        ung_vien = ung_vien[:so_luong_toi_da]

    return [MatNaSam2(bbox=bbox, dien_tich=ty_le) for ty_le, bbox in ung_vien]


class Sam2Segmenter:
    """`BoTachThucThe` — SAM2 chạy trên máy chủ của chính tổ chức.

    Nạp `torch`/`sam2` và trọng số LÚC DỰNG (`__init__`), không lúc import
    tệp này — tệp này import được ở một tổ chức chỉ dùng bộ Đầy đủ/Gọn mà
    không cài `torch`, vì hai lớp con nặng chỉ import bên trong `__init__`.
    `registry._dung_local_cv` bọc mọi lỗi dựng lớp này (thiếu gói, thiếu
    checkpoint, thiếu GPU) thành `NotImplementedError` nói rõ nguyên nhân
    (quy tắc bất di bất dịch #2, #6).
    """

    name = "local_cv.sam2_segmenter"

    def __init__(
        self,
        checkpoint: str | None = None,
        model_config: str | None = None,
        device: str | None = None,
        dien_tich_toi_thieu: float | None = None,
        on_dinh_toi_thieu: float | None = None,
        so_luong_toi_da: int | None = None,
    ) -> None:
        from vision.providers.chung import nap_json

        config = nap_json("config.json")

        # Soát cấu hình TRƯỚC khi import torch/sam2: một `config.json` thiếu
        # khoá phải báo lỗi rõ ràng ngay cả trên máy chưa cài `torch` —
        # không cần GPU để biết config sai.
        self._checkpoint = checkpoint or config.get("sam2_checkpoint")
        self._model_config = model_config or config.get("sam2_model_config")
        if not self._checkpoint or not self._model_config:
            raise ValueError(
                "Thiếu `sam2_checkpoint` hoặc `sam2_model_config` trong "
                "contracts/config.json — điền đường dẫn trọng số SAM2 đã tải "
                "về (không có trên PyPI, xem hướng dẫn ở đầu module này)."
            )

        self._dien_tich_toi_thieu = (
            dien_tich_toi_thieu
            if dien_tich_toi_thieu is not None
            else float(config.get("sam2_dien_tich_toi_thieu_ty_le", 0.001))
        )
        self._on_dinh_toi_thieu = (
            on_dinh_toi_thieu
            if on_dinh_toi_thieu is not None
            else float(config.get("sam2_on_dinh_toi_thieu", 0.9))
        )
        self._so_luong_toi_da = (
            so_luong_toi_da
            if so_luong_toi_da is not None
            else int(config.get("sam2_so_luong_toi_da", 40))
        )

        # Từ đây trở xuống mới đụng `torch`/`sam2`/`numpy` — import trong
        # __init__, không ở đầu tệp, cùng lý do docstring lớp.
        import numpy as np
        import torch
        from sam2.automatic_mask_generator import SAM2AutomaticMaskGenerator
        from sam2.build_sam import build_sam2

        self._device = device or config.get("local_cv_device") or (
            "cuda"
            if torch.cuda.is_available()
            else "mps"
            if torch.backends.mps.is_available()
            else "cpu"
        )

        # Nạp trọng số MỘT LẦN ở đây — provider này sống suốt vòng đời worker
        # (`registry.lay_provider` dựng lười, giữ lại — quy tắc #6).
        sam2_model = build_sam2(self._model_config, self._checkpoint, device=self._device)
        self._mask_generator = SAM2AutomaticMaskGenerator(sam2_model)
        self._np = np

    @property
    def model_version(self) -> str:
        return f"sam2:{self._model_config}"

    def tach(self, image: bytes) -> list[MatNaSam2]:
        import io

        from PIL import Image

        with Image.open(io.BytesIO(image)) as anh:
            anh_rgb = anh.convert("RGB")
            mang = self._np.array(anh_rgb)

        cao, rong = mang.shape[0], mang.shape[1]
        mat_na_tho = self._mask_generator.generate(mang)
        return _loc_va_chuan_hoa(
            mat_na_tho,
            rong=rong,
            cao=cao,
            dien_tich_toi_thieu=self._dien_tich_toi_thieu,
            on_dinh_toi_thieu=self._on_dinh_toi_thieu,
            so_luong_toi_da=self._so_luong_toi_da,
        )
