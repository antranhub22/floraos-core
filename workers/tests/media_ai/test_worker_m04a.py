"""Test cho `workers/media_ai/jobs/worker.py` — mô phỏng `psycopg.Connection`
bằng đối tượng giả, cùng khuôn `tests/vision/test_worker.py`.

Kiểm phần điều phối và hai bất biến quan trọng nhất của cổng:

  - bị từ chối thì job vẫn `COMPLETED` (không phải `FAILED`), và KHÔNG có
    dòng `assets` nào được ghi;
  - qua cổng thì có đúng một `assets` mới, `kind = MASTER`,
    `approval_state = PENDING` (Guard PASS không thay được Approve).

KHÔNG kiểm hành vi thật của SKIP LOCKED/LISTEN dưới tải đồng thời — việc đó
cần Postgres thật.
"""

import json

import pytest

from media_ai.jobs import worker
from media_ai.providers.enhancement.passthrough import PassthroughEnhancer
from media_ai.guard.verifier import VisionIdentityVerifier


def _normalize(sql):
    return " ".join(sql.split())


class _FakeCursor:
    def __init__(self, conn, row_factory=None):
        self.conn = conn
        self.row_factory = row_factory

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def execute(self, sql, params=None):
        self.conn.executed.append((_normalize(sql), params))
        return self

    def fetchone(self):
        if self.conn.fetchone_queue:
            return self.conn.fetchone_queue.pop(0)
        return None


class FakeConnection:
    def __init__(self, fetchone_queue=None):
        self.executed = []
        self.fetchone_queue = list(fetchone_queue or [])
        self.committed = 0
        self.rolled_back = 0

    def cursor(self, row_factory=None):
        return _FakeCursor(self, row_factory=row_factory)

    def commit(self):
        self.committed += 1

    def rollback(self):
        self.rolled_back += 1

    def cau_lenh(self, tu_khoa):
        return [sql for sql, _ in self.executed if tu_khoa in sql]

    def tham_so(self, tu_khoa):
        return [p for sql, p in self.executed if tu_khoa in sql]


def phan_tich_mau(category="Bó hoa"):
    return {
        "identity": {
            "category": category, "shape": "Tròn",
            "facing": "Một mặt", "container": "Giấy gói",
        },
        "bom": {"flowers": [{"name": "Cẩm chướng", "color": "Hồng đậm", "quantity": 30}]},
    }


class AnalyzerGia:
    name = "gia"
    model_version = "v1"

    def __init__(self, doi_san_pham_o_luot_hai=False):
        self.doi = doi_san_pham_o_luot_hai
        self.so_luot = 0

    def analyze(self, image, context):
        self.so_luot += 1
        if self.doi and self.so_luot >= 2:
            return phan_tich_mau(category="Giỏ hoa")
        return phan_tich_mau()


JOB = {
    "id": "job-1",
    "organization_id": "org-1",
    "user_id": "user-1",
    "payload": {"asset_id": "asset-goc"},
}
ASSET_GOC = {
    "id": "asset-goc",
    "product_id": "sp-1",
    "storage_key": "org/org-1/sp-1/asset-goc.jpg",
    "mime_type": "image/jpeg",
    "version": 1,
}


@pytest.fixture
def gia_lap_kho(monkeypatch):
    """Kho tệp trong bộ nhớ — không chạm đĩa."""
    da_ghi = {}
    monkeypatch.setattr(worker, "_read_bytes", lambda key: b"byte-anh-goc")
    monkeypatch.setattr(worker, "_write_bytes", lambda key, data: da_ghi.__setitem__(key, data))
    return da_ghi


def _chay(conn, analyzer, gia_lap_kho):
    worker.process_job(
        conn,
        dict(JOB),
        VisionIdentityVerifier(analyzer=analyzer),
        PassthroughEnhancer(),
    )


class TestQuaCong:
    def test_ghi_dung_mot_master_image_o_trang_thai_cho_duyet(self, gia_lap_kho):
        conn = FakeConnection(fetchone_queue=[dict(ASSET_GOC)])
        _chay(conn, AnalyzerGia(), gia_lap_kho)

        chen_asset = conn.tham_so("INSERT INTO assets")
        assert len(chen_asset) == 1
        p = chen_asset[0]
        assert p["parent_asset_id"] == "asset-goc"  # ảnh gốc không bị ghi đè
        assert p["version"] == 2
        assert p["identity_score"] == 1.0
        # Guard PASS chỉ cho phép XEM. Ghi vào Product Master là việc của
        # cổng 2 (`media.approve`/`I2`).
        assert "'PENDING'" in conn.cau_lenh("INSERT INTO assets")[0]
        assert json.loads(p["generated_flags"]) == {
            "generative_fill_used": False, "requires_reshoot_warning": False,
        }
        assert len(gia_lap_kho) == 1

    def test_job_completed_voi_result_safe(self, gia_lap_kho):
        conn = FakeConnection(fetchone_queue=[dict(ASSET_GOC)])
        _chay(conn, AnalyzerGia(), gia_lap_kho)
        ket = [p for p in conn.tham_so("UPDATE generation_jobs SET status = 'COMPLETED'")]
        assert ket and ket[0][0] == "SAFE"

    def test_phat_su_kien_guard_de_phia_ts_doc_lai_duoc(self, gia_lap_kho):
        conn = FakeConnection(fetchone_queue=[dict(ASSET_GOC)])
        _chay(conn, AnalyzerGia(), gia_lap_kho)
        su_kien = [p for p in conn.tham_so("INSERT INTO job_events") if p["event"] == "guard"]
        assert len(su_kien) == 1
        khoi = json.loads(su_kien[0]["payload"])
        assert khoi["result"] == "SAFE"
        assert khoi["provider"] == "gia"
        assert khoi["model_version"] == "v1"


class TestBiTuChoi:
    def test_khong_ghi_asset_nao_va_khong_ghi_tep_nao(self, gia_lap_kho):
        conn = FakeConnection(fetchone_queue=[dict(ASSET_GOC)])
        _chay(conn, AnalyzerGia(doi_san_pham_o_luot_hai=True), gia_lap_kho)

        # "Giữ Original, không trả ảnh đã enhance" — không có dòng assets nào
        # thì không có đường nào để `/download` lấy được ảnh đó.
        assert conn.tham_so("INSERT INTO assets") == []
        assert gia_lap_kho == {}

    def test_van_la_completed_khong_phai_failed(self, gia_lap_kho):
        conn = FakeConnection(fetchone_queue=[dict(ASSET_GOC)])
        _chay(conn, AnalyzerGia(doi_san_pham_o_luot_hai=True), gia_lap_kho)

        # `REJECTED` là PHÁN QUYẾT, không phải hỏng kỹ thuật. Ánh xạ sang
        # FAILED làm retry chạy lại vô ích và làm sai kế toán.
        assert conn.cau_lenh("UPDATE generation_jobs SET status = 'FAILED'") == []
        ket = conn.tham_so("UPDATE generation_jobs SET status = 'COMPLETED'")
        assert ket and ket[0][0] == "REJECTED"
        assert conn.rolled_back == 0

    def test_ghi_ly_do_de_nguoi_dung_biet_vi_sao(self, gia_lap_kho):
        conn = FakeConnection(fetchone_queue=[dict(ASSET_GOC)])
        _chay(conn, AnalyzerGia(doi_san_pham_o_luot_hai=True), gia_lap_kho)
        log = [p for p in conn.tham_so("INSERT INTO job_events") if p["event"] == "log"]
        payload = json.loads(log[-1]["payload"])
        assert any("Phân loại đổi" in ly for ly in payload["ly_do"])


class TestHongKyThuat:
    def test_asset_thuoc_to_chuc_khac_thi_job_failed(self, gia_lap_kho):
        # `_doc_asset` lọc theo `organization_id` — không thấy thì ném, và
        # ĐÂY mới là trường hợp `FAILED` đúng nghĩa.
        conn = FakeConnection(fetchone_queue=[])  # không trả dòng nào
        _chay(conn, AnalyzerGia(), gia_lap_kho)

        assert conn.cau_lenh("UPDATE generation_jobs SET status = 'FAILED'")
        assert conn.tham_so("INSERT INTO assets") == []


class TestKenhNotify:
    def test_ten_kenh_khop_voi_phia_ts(self):
        assert worker.notify_channel_for("media.optimize") == "floraos_job_media_optimize"
