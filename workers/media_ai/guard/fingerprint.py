"""Dấu vân sản phẩm — rút từ chính hợp đồng `PhanTichSanPhamHoa` của M01.

M04 mục 5: *"Product Fingerprint nên tái sử dụng chính JSON Contract của
module AI Vision (component list, canonical_component, count) làm căn cứ so
sánh trước/sau."* Không dựng một lược đồ riêng: mọi trường ở đây đều có mặt
trong `workers/vision/contracts/Schema.json`, nên khi hợp đồng đổi thì chỗ
này vỡ ngay chứ không âm thầm so sai.

Thuần: không đọc ảnh, không gọi mạng, không chạm cơ sở dữ liệu. Đầu vào là
hai `dict` kết quả Vision, đầu ra là hai dấu vân so được với nhau.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


# Bốn nhóm thành phần của `bom` trong hợp đồng Vision. Thứ tự cố định để hai
# dấu vân luôn duyệt cùng một trật tự.
NHOM_BOM = ("flowers", "foliage", "accessories", "wrapping")


def _chuoi(value: Any) -> str | None:
    """Chuẩn hoá một ô văn bản: bỏ khoảng trắng thừa, hạ chữ, rỗng thành None.

    So khớp KHÔNG phân biệt hoa thường có chủ đích — hai lượt phân tích của
    cùng một model vẫn có thể trả "Hồng đậm" và "hồng đậm"; coi đó là khác
    nhau sẽ đánh tụt điểm màu vì một khác biệt không có thật.
    """
    if value is None:
        return None
    s = str(value).strip().lower()
    return s or None


def _so(value: Any) -> float | None:
    if isinstance(value, bool) or value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    try:
        return float(str(value).strip().replace(",", "."))
    except ValueError:
        return None


@dataclass(frozen=True)
class ThanhPhan:
    """Một dòng BOM đã chuẩn hoá, đủ để so trước/sau."""

    nhom: str
    ten: str | None
    mau: str | None
    so_luong: float | None

    @property
    def khoa(self) -> tuple[str, str | None]:
        """Khoá định danh một thành phần: nhóm + tên. Màu và số lượng là thứ
        đem ra SO, không phải thứ dùng để ghép cặp — nếu ghép cặp theo màu thì
        một thay đổi màu sẽ hiện ra thành 'mất một thành phần, thêm một thành
        phần' và bị tính hai lần."""
        return (self.nhom, self.ten)


@dataclass(frozen=True)
class DauVanSanPham:
    """Dấu vân của một ảnh, rút từ một kết quả phân tích Vision."""

    category: str | None
    shape: str | None
    facing: str | None
    container: str | None
    thanh_phan: tuple[ThanhPhan, ...] = field(default=())
    # Tỉ lệ đường kính bông trung bình — tín hiệu HÌNH HỌC thật sự duy nhất
    # mà hợp đồng cho ở mức từng bông (`bloom_diameter_ratio`).
    ty_le_duong_kinh: float | None = None

    @property
    def bo_nhan_dang(self) -> tuple[str | None, str | None, str | None, str | None]:
        return (self.category, self.shape, self.facing, self.container)


def _doc_thanh_phan(bom: Any) -> tuple[tuple[ThanhPhan, ...], float | None]:
    if not isinstance(bom, dict):
        return (), None

    ra: list[ThanhPhan] = []
    ty_le: list[float] = []
    for nhom in NHOM_BOM:
        dong_list = bom.get(nhom)
        if not isinstance(dong_list, list):
            continue
        for dong in dong_list:
            if not isinstance(dong, dict):
                continue
            # `wrapping` không có `name` mà có `material`; `flowers` có cả
            # `name` lẫn `mau`/`color`. Đọc theo thứ tự ưu tiên của hợp đồng.
            ten = _chuoi(dong.get("name")) or _chuoi(dong.get("material"))
            mau = _chuoi(dong.get("color")) or _chuoi(dong.get("mau"))
            ra.append(
                ThanhPhan(
                    nhom=nhom,
                    ten=ten,
                    mau=mau,
                    so_luong=_so(dong.get("quantity")),
                )
            )
            r = _so(dong.get("bloom_diameter_ratio"))
            if r is not None and r > 0:
                ty_le.append(r)

    trung_binh = sum(ty_le) / len(ty_le) if ty_le else None
    return tuple(ra), trung_binh


def rut_dau_van(phan_tich: dict[str, Any]) -> DauVanSanPham:
    """Một kết quả Vision → một dấu vân. Chịu được `dict` thiếu trường: một
    lượt phân tích hỏng phải cho ra dấu vân RỖNG chứ không được ném, vì phía
    trên còn cần so nó với dấu vân gốc rồi kết luận REJECTED — ném ở đây sẽ
    biến một phán quyết an toàn thành một job FAILED, sai theo M04 mục 7."""
    identity = phan_tich.get("identity")
    identity = identity if isinstance(identity, dict) else {}
    thanh_phan, ty_le = _doc_thanh_phan(phan_tich.get("bom"))

    return DauVanSanPham(
        category=_chuoi(identity.get("category")),
        shape=_chuoi(identity.get("shape")),
        facing=_chuoi(identity.get("facing")),
        container=_chuoi(identity.get("container")),
        thanh_phan=thanh_phan,
        ty_le_duong_kinh=ty_le,
    )
