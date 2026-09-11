from vision.providers.local_cv_segmenter import (
    MatNaSam2,
    _bbox_xywh_chuan_hoa,
    _loc_va_chuan_hoa,
)


class TestBboxXywhChuanHoa:
    def test_chuan_hoa_dung_ty_le(self):
        # Ảnh rộng 1000 cao 2000 (px). Khung XYWH: gốc (100, 400), rộng 100 cao 200.
        assert _bbox_xywh_chuan_hoa((100, 400, 100, 200), rong=1000, cao=2000) == (
            0.1,
            0.2,
            0.2,
            0.3,
        )

    def test_anh_kich_thuoc_0_tra_khung_rong(self):
        assert _bbox_xywh_chuan_hoa((0, 0, 10, 10), rong=0, cao=0) == (0.0, 0.0, 0.0, 0.0)

    def test_khong_vuot_bien_0_1(self):
        assert _bbox_xywh_chuan_hoa((-50, -50, 2000, 2000), rong=1000, cao=1000) == (
            0.0,
            0.0,
            1.0,
            1.0,
        )

    def test_phai_khong_bao_gio_nho_hon_trai(self):
        # bw/bh âm bất thường (dữ liệu hỏng) vẫn không được đảo ngược khung.
        trai, tren, phai, duoi = _bbox_xywh_chuan_hoa((500, 500, -100, -100), rong=1000, cao=1000)
        assert phai >= trai
        assert duoi >= tren


class TestLocVaChuanHoa:
    @staticmethod
    def _mat_na_gia(area, bbox, stability=0.99):
        return {"area": area, "bbox": bbox, "stability_score": stability}

    def test_bo_mat_na_qua_nho(self):
        tho = [self._mat_na_gia(area=1, bbox=(0, 0, 1, 1))]
        kq = _loc_va_chuan_hoa(
            tho,
            rong=1000,
            cao=1000,
            dien_tich_toi_thieu=0.01,
            on_dinh_toi_thieu=0.9,
            so_luong_toi_da=10,
        )
        assert kq == []

    def test_bo_mat_na_khong_on_dinh(self):
        tho = [self._mat_na_gia(area=500_000, bbox=(0, 0, 900, 900), stability=0.5)]
        kq = _loc_va_chuan_hoa(
            tho,
            rong=1000,
            cao=1000,
            dien_tich_toi_thieu=0.01,
            on_dinh_toi_thieu=0.9,
            so_luong_toi_da=10,
        )
        assert kq == []

    def test_giu_mat_na_dat_nguong(self):
        tho = [self._mat_na_gia(area=500_000, bbox=(0, 0, 900, 900), stability=0.95)]
        kq = _loc_va_chuan_hoa(
            tho,
            rong=1000,
            cao=1000,
            dien_tich_toi_thieu=0.01,
            on_dinh_toi_thieu=0.9,
            so_luong_toi_da=10,
        )
        assert len(kq) == 1
        assert isinstance(kq[0], MatNaSam2)
        assert kq[0].dien_tich == 0.5

    def test_sap_giam_dan_theo_dien_tich_va_cat_theo_so_luong_toi_da(self):
        tho = [
            self._mat_na_gia(area=100_000, bbox=(0, 0, 10, 10)),
            self._mat_na_gia(area=900_000, bbox=(0, 0, 900, 900)),
            self._mat_na_gia(area=500_000, bbox=(0, 0, 500, 500)),
        ]
        kq = _loc_va_chuan_hoa(
            tho,
            rong=1000,
            cao=1000,
            dien_tich_toi_thieu=0.0,
            on_dinh_toi_thieu=0.0,
            so_luong_toi_da=2,
        )
        assert len(kq) == 2
        assert kq[0].dien_tich == 0.9
        assert kq[1].dien_tich == 0.5

    def test_thieu_area_hoac_bbox_thi_bo_qua_khong_vo(self):
        tho = [{"stability_score": 1.0}, {"area": 100}]  # thiếu bbox ở cả hai
        kq = _loc_va_chuan_hoa(
            tho,
            rong=1000,
            cao=1000,
            dien_tich_toi_thieu=0.0,
            on_dinh_toi_thieu=0.0,
            so_luong_toi_da=10,
        )
        assert kq == []

    def test_so_luong_toi_da_0_nghia_la_khong_gioi_han(self):
        tho = [self._mat_na_gia(area=100_000, bbox=(0, 0, 10, 10)) for _ in range(5)]
        kq = _loc_va_chuan_hoa(
            tho,
            rong=1000,
            cao=1000,
            dien_tich_toi_thieu=0.0,
            on_dinh_toi_thieu=0.0,
            so_luong_toi_da=0,
        )
        assert len(kq) == 5

    def test_danh_sach_rong_tra_danh_sach_rong(self):
        assert (
            _loc_va_chuan_hoa(
                [], rong=1000, cao=1000, dien_tich_toi_thieu=0.0, on_dinh_toi_thieu=0.0, so_luong_toi_da=10
            )
            == []
        )
