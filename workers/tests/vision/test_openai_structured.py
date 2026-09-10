"""Test cho phần BUILD của openai_structured.py — chỉ phần logic thuần
(ngưỡng chạy lượt hai, đồng thuận trung vị). KHÔNG gọi OpenAI thật (không có
key thật, không có ảnh thật trong sandbox này) — `_call`/`analyze()` phải
chờ Tony chạy thử trên máy thật với `OPENAI_API_KEY` thật, đúng như đã báo
trong mục "Cần xác nhận thêm" của báo cáo P5.
"""

import os

os.environ.setdefault("OPENAI_API_KEY", "test-key-khong-that")

from vision.providers.openai_structured import (  # noqa: E402
    _min_bom_confidence,
    _needs_second_round,
    _overall_confidence,
    _reconcile_quantity,
)


def _ket_qua(confidence, bom_confidences=None):
    bom_confidences = bom_confidences if bom_confidences is not None else [90, 90]
    return {
        "confidence": confidence,
        "bom": {
            "flowers": [{"quantity": 5, "confidence": c} for c in bom_confidences],
            "foliage": [],
            "accessories": [],
            "wrapping": [],
        },
    }


class TestNguongChayLuotHai:
    def test_confidence_tong_cao_khong_chay_lai(self):
        r = _ket_qua(90, [90, 90])
        assert _needs_second_round(r) is False

    def test_confidence_tong_thap_chay_lai(self):
        r = _ket_qua(50, [90, 90])
        assert _needs_second_round(r) is True

    def test_mot_thanh_phan_bom_thap_cung_chay_lai(self):
        r = _ket_qua(95, [95, 40])
        assert _needs_second_round(r) is True

    def test_khong_co_bom_khong_loi(self):
        assert _needs_second_round({"confidence": 90}) is False


class TestOverallVaMinBomConfidence:
    def test_confidence_khong_phai_int_tra_ve_0(self):
        assert _overall_confidence({"confidence": "cao"}) == 0
        assert _overall_confidence({}) == 0

    def test_min_bom_confidence_khong_co_bom_tra_100(self):
        assert _min_bom_confidence({}) == 100


class TestReconcileQuantity:
    def test_trung_vi_confidence_va_quantity(self):
        a = _ket_qua(80, [80, 80])
        b = _ket_qua(60, [60, 60])
        _reconcile_quantity(a, b)
        assert a["confidence"] == 70
        assert isinstance(a["confidence"], int)
        for item in a["bom"]["flowers"]:
            assert item["quantity"] == 5  # 5 và 5 -> trung vị vẫn 5
            assert isinstance(item["quantity"], int)

    def test_quantity_khac_nhau_ra_int_khong_ra_float(self):
        a = _ket_qua(80)
        a["bom"]["flowers"] = [{"quantity": 10, "confidence": 80}]
        b = _ket_qua(80)
        b["bom"]["flowers"] = [{"quantity": 11, "confidence": 80}]
        _reconcile_quantity(a, b)
        # trung_vi([10, 11]) = 10.5 -> round -> 10 hoặc 11, phải là int
        assert isinstance(a["bom"]["flowers"][0]["quantity"], int)
        assert a["bom"]["flowers"][0]["quantity"] in (10, 11)

    def test_so_thanh_phan_khac_nhau_khong_loi(self):
        a = _ket_qua(80)
        a["bom"]["flowers"] = [{"quantity": 10, "confidence": 80}]
        b = _ket_qua(80)
        b["bom"]["flowers"] = []
        # không được ném lỗi khi lượt hai thiếu thành phần so với lượt một
        _reconcile_quantity(a, b)
        assert a["bom"]["flowers"][0]["quantity"] == 10
