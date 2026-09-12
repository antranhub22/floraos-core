import os

os.environ.setdefault("OPENAI_API_KEY", "test-key-khong-that")

import pytest  # noqa: E402

from vision.providers import registry  # noqa: E402


class TestRegistry:
    def test_ba_khoa_khop_tung_chu_voi_phia_ts(self):
        """`VISION_ENGINES` ở `domain/vision-engine.ts` phải khớp đúng ba khoá
        này. Hai bên không có nguồn sự thật chung, y như `notify_channel_for`."""
        assert registry.KHOA_BO_MAY == ("openai_structured", "openai_direct", "local_cv")

    def test_mac_dinh_la_openai_direct(self):
        """Mặc định là `openai_direct` — rẻ nhất, nhanh nhất, phù hợp
        sản xuất khi bộ ảnh vàng đã xác nhận đủ. Tổ chức muốn chính xác
        hơn chọn bộ khác qua công tắc `bo_may_phan_tich`."""
        assert registry.MAC_DINH == "openai_direct"

    def test_khoa_la_roi_ve_mac_dinh_khong_nem_loi(self, monkeypatch):
        """Dòng job cũ ghi tên bộ máy đã bỏ vẫn phải chạy được."""
        goi = []
        monkeypatch.setattr(registry, "_DA_DUNG", {})
        monkeypatch.setitem(registry._XUONG, registry.MAC_DINH, lambda: goi.append(1) or "gia")
        assert registry.lay_provider("bo-may-khong-ton-tai") == "gia"
        assert registry.lay_provider(None) == "gia"

    def test_dung_luoi_va_giu_lai(self, monkeypatch):
        """Dựng cả ba lúc khởi động sẽ bắt tổ chức chỉ dùng bộ gọn phải có GPU."""
        so_lan = []
        monkeypatch.setattr(registry, "_DA_DUNG", {})
        monkeypatch.setitem(registry._XUONG, "openai_direct", lambda: so_lan.append(1) or "gia")
        registry.lay_provider("openai_direct")
        registry.lay_provider("openai_direct")
        assert len(so_lan) == 1

    def test_bo_cuc_bo_bao_thieu_gi_thay_vi_tra_provider_gia(self, monkeypatch):
        """Ép cấu hình `local_cv` thiếu khoá bất kể máy chạy test đã cài
        `torch`/`sam2` và trọng số thật hay chưa. Trước đây ca thử này gọi
        thẳng `registry.lay_provider` không monkeypatch gì thêm — chỉ đỏ nhờ
        máy chạy test thiếu `torch`; trên máy đã cài đủ và đã điền
        `sam2_checkpoint` thật (như máy đã dựng `.venv-local-cv`), việc dựng
        provider thật sự thành công nên không còn ném lỗi, và ca thử mất tác
        dụng đúng lúc cần nó nhất. Xoá lệ thuộc vào môi trường bằng cách bắt
        `nap_json` trả cấu hình rỗng — thiếu `sam2_checkpoint` luôn ném
        `ValueError` trước khi code kịp đụng tới `torch`/`sam2`."""
        monkeypatch.setattr(registry, "_DA_DUNG", {})
        monkeypatch.setattr("vision.providers.chung.nap_json", lambda ten: {})
        with pytest.raises(NotImplementedError) as loi:
            registry.lay_provider("local_cv")
        assert "SAM2" in str(loi.value)
