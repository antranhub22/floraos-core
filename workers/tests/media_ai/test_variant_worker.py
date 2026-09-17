"""Cổng Subject Integrity của M04b — phép đo phải BẮT được việc vẽ đè.

Ca thử ở đây không chạm Postgres: `dung_bien_the` và `_do_lo_chu_the` tách
khỏi vòng đời job đúng để có thể khoá bằng test thuần, cùng lý do
`optimization-rules.ts` không import Prisma.
"""

from __future__ import annotations

from io import BytesIO

import numpy as np
import pytest
from PIL import Image, ImageFilter

from media_ai.jobs.variant_worker import (
    NGUONG_TU_CHOI,
    RATIO_PRESETS,
    _dong_khung,
    _do_lo_chu_the,
    _sang_bytes,
)


def _anh_mau(w: int = 240, h: int = 240) -> Image.Image:
    """Một khối màu CÓ KẾT CẤU, gieo cố định nên ca thử lặp lại được.

    Vân kết cấu không phải để cho đẹp. Ảnh chỉ có dải chuyển màu tuyến tính
    là bất biến dưới phép làm mờ Gauss — dùng nó làm mẫu thì ca thử "phát
    hiện vẽ đè" sẽ XANH ngay cả khi phép đo hỏng hoàn toàn. Bó hoa thật có
    vân cánh; mẫu thử phải có thứ tương đương.
    """
    rng = np.random.default_rng(20260917)
    arr = np.zeros((h, w, 3), dtype=np.int16)
    arr[:, :, 0] = np.linspace(0, 255, w, dtype=np.int16)[None, :]
    arr[:, :, 1] = np.linspace(0, 255, h, dtype=np.int16)[:, None]
    arr[:, :, 2] = 128
    arr += rng.integers(-40, 41, size=(h, w, 3), dtype=np.int16)
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), mode="RGB")


def _mat_na(w: int = 240, h: int = 240) -> Image.Image:
    """Chủ thể là hình tròn giữa khung."""
    m = Image.new("L", (w, h), 0)
    from PIL import ImageDraw

    ImageDraw.Draw(m).ellipse([w * 0.2, h * 0.2, w * 0.8, h * 0.8], fill=255)
    return m


class TestDoLoChuThe:
    def test_sao_chep_nguyen_khoi_thi_trung_khit_tuyet_doi(self):
        master = _anh_mau()
        alpha = _mat_na()
        ket_qua = master.copy().convert("RGBA")
        ket_qua.putalpha(alpha)

        assert _do_lo_chu_the(master, ket_qua, alpha) == 1.0

    def test_doi_vien_khong_lam_sut_diem(self):
        """Làm mềm viền là bước CỐ Ý của M04b — nó không được kêu báo động."""
        master = _anh_mau()
        alpha = _mat_na()
        ket_qua = master.copy().convert("RGBA")
        # Chỉ đụng vào phần alpha ở rìa, giữ nguyên RGB của lõi.
        ket_qua.putalpha(alpha.filter(ImageFilter.GaussianBlur(2)))

        assert _do_lo_chu_the(master, ket_qua, alpha) == 1.0

    def test_ve_de_len_lo_lam_sut_diem_xuong_duoi_nguong(self):
        """Đây là lỗi mà cổng này sinh ra để bắt: một bộ lọc quét cả chủ thể."""
        master = _anh_mau()
        alpha = _mat_na()
        ket_qua = master.filter(ImageFilter.GaussianBlur(3)).convert("RGBA")
        ket_qua.putalpha(alpha)

        diem = _do_lo_chu_the(master, ket_qua, alpha)
        assert diem < NGUONG_TU_CHOI

    def test_lech_mot_muc_xam_cung_bi_tinh_la_doi(self):
        """Ngưỡng là sai khác 0 tuyệt đối — nới thành 'gần đúng' là tự bịt mắt."""
        master = _anh_mau()
        alpha = _mat_na()
        arr = np.array(master, dtype=np.int16)
        arr[:, :, 2] = np.clip(arr[:, :, 2] + 1, 0, 255)
        ket_qua = Image.fromarray(arr.astype(np.uint8), mode="RGB").convert("RGBA")
        ket_qua.putalpha(alpha)

        assert _do_lo_chu_the(master, ket_qua, alpha) == 0.0

    def test_mat_na_rong_la_tu_choi_chu_khong_phai_diem_dep(self):
        master = _anh_mau()
        alpha_rong = Image.new("L", master.size, 0)
        ket_qua = master.copy().convert("RGBA")

        assert _do_lo_chu_the(master, ket_qua, alpha_rong) == 0.0


class TestDongKhung:
    @pytest.mark.parametrize("ratio", list(RATIO_PRESETS))
    def test_dung_kich_thuoc_tung_ty_le(self, ratio: str):
        khung = _dong_khung(_anh_mau(300, 200), ratio)
        assert khung.size == RATIO_PRESETS[ratio]

    def test_dem_chu_khong_cat_nen_giu_tron_bo_hoa(self):
        """Ảnh rất ngang đưa về 9:16 phải còn nguyên chiều ngang, chỉ thêm đệm."""
        goc = _anh_mau(400, 100)
        khung = _dong_khung(goc, "9:16")
        rong, cao = RATIO_PRESETS["9:16"]
        assert khung.size == (rong, cao)
        # Tỷ lệ cạnh của phần ảnh thật giữ nguyên: cao/rộng gốc = 1/4.
        ty_le_that = (goc.height / goc.width)
        cao_that = round(rong * ty_le_that)
        giua = np.array(khung.convert("RGB"))[cao // 2]
        # Hàng giữa phải là ảnh thật trên toàn chiều rộng, không phải đệm.
        assert cao_that > 0
        assert not np.all(giua == giua[0])

    def test_giu_kenh_alpha_cho_ban_tach_nen(self):
        rgba = _anh_mau(120, 120).convert("RGBA")
        rgba.putalpha(_mat_na(120, 120))
        khung = _dong_khung(rgba, "1:1")
        assert khung.mode == "RGBA"
        # Góc khung phải trong suốt — đó là điều làm nên bản PNG tách nền.
        assert khung.getpixel((0, 0))[3] == 0


class TestXuatTep:
    def test_con_alpha_thi_xuat_png(self):
        rgba = _anh_mau(60, 60).convert("RGBA")
        data, mime, duoi = _sang_bytes(rgba)
        assert mime == "image/png" and duoi == "png"
        assert Image.open(BytesIO(data)).mode == "RGBA"

    def test_nen_dac_thi_xuat_jpeg(self):
        data, mime, duoi = _sang_bytes(_anh_mau(60, 60))
        assert mime == "image/jpeg" and duoi == "jpg"
        assert Image.open(BytesIO(data)).mode == "RGB"
