import math

from vision.providers.local_cv_labeler import (
    _cat_bbox_co_dem,
    _do_chac_tu_diem_chuyen,
    _don_ma_caption,
)


class TestDonMaCaption:
    def test_cat_dau_cham_va_khoang_trang(self):
        assert _don_ma_caption("  a bouquet of yellow tulips. ") == "a bouquet of yellow tulips"

    def test_chuoi_rong_tra_chuoi_rong(self):
        assert _don_ma_caption("   ") == ""

    def test_khong_dong_bang_neu_khong_co_dau_cham_cuoi(self):
        assert _don_ma_caption("a single rose") == "a single rose"


class TestDoChacTuDiemChuyen:
    def test_danh_sach_rong_tra_0(self):
        assert _do_chac_tu_diem_chuyen([]) == 0

    def test_log_xac_suat_0_tuong_duong_100(self):
        # log(1.0) == 0.0 -> xác suất 1.0 -> 100.
        assert _do_chac_tu_diem_chuyen([0.0, 0.0]) == 100

    def test_log_xac_suat_am_ha_do_chac(self):
        diem = [math.log(0.5), math.log(0.5)]
        assert _do_chac_tu_diem_chuyen(diem) == 50

    def test_khong_vuot_100_du_diem_duong_bat_thuong(self):
        assert _do_chac_tu_diem_chuyen([5.0]) == 100

    def test_khong_am_du_diem_am_rat_lon(self):
        assert _do_chac_tu_diem_chuyen([-50.0]) == 0


class TestCatBboxCoDem:
    def test_cat_dung_khung_khong_dem(self):
        khung = _cat_bbox_co_dem((1000, 2000), (0.1, 0.2, 0.3, 0.4), ty_le_dem=0.0)
        assert khung == (100, 400, 300, 800)

    def test_dem_mo_rong_khung_ca_bon_canh(self):
        khong_dem = _cat_bbox_co_dem((1000, 1000), (0.4, 0.4, 0.6, 0.6), ty_le_dem=0.0)
        co_dem = _cat_bbox_co_dem((1000, 1000), (0.4, 0.4, 0.6, 0.6), ty_le_dem=0.5)
        assert co_dem[0] < khong_dem[0]
        assert co_dem[1] < khong_dem[1]
        assert co_dem[2] > khong_dem[2]
        assert co_dem[3] > khong_dem[3]

    def test_khong_vuot_bien_anh_khi_dem_qua_lon(self):
        khung = _cat_bbox_co_dem((1000, 1000), (0.0, 0.0, 0.1, 0.1), ty_le_dem=5.0)
        assert khung[0] == 0
        assert khung[1] == 0
        assert khung[2] <= 1000
        assert khung[3] <= 1000

    def test_khung_luon_rong_va_cao_it_nhat_1px(self):
        # bbox suy biến (điểm, không phải vùng) vẫn phải cắt ra được một khung hợp lệ.
        khung = _cat_bbox_co_dem((1000, 1000), (0.5, 0.5, 0.5, 0.5), ty_le_dem=0.0)
        x0, y0, x1, y1 = khung
        assert x1 > x0
        assert y1 > y0
