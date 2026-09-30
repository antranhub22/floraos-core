"""Video nhà cung cấp trước, Ken Burns cục bộ chỉ là đường lùi (PO 25/09/2026)."""

import json
import shutil
import subprocess
from pathlib import Path

import httpx
import pytest
from PIL import Image

from media_ai.video.clips.base import ClipProviderError, ClipRequest, mo_ta_canh
from media_ai.video.clips.fal_clips import KlingClip
from media_ai.video.clips.registry import NHA_CUNG_CAP_CLIP, thu_tu_clip
from media_ai.video.clips.runway_clip import RunwayClip
from media_ai.video.providers.ai_clip_provider import AiClipVideoProvider

pytestmark = pytest.mark.skipif(shutil.which("ffmpeg") is None, reason="cần ffmpeg")


def _clip(path: Path, giay: float = 1.0, size="360x640") -> Path:
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", f"testsrc=size={size}:rate=30:duration={giay}",
                    "-pix_fmt", "yuv420p", str(path)], check=True)
    return path


class ClipGia:
    def __init__(self, name, loi_o_canh=None):
        self.name, self.model_version, self.loi_o_canh, self.goi = name, f"{name}-v", loi_o_canh, []

    def co_khoa(self):
        return True

    def sinh_clip(self, req: ClipRequest, out_path: Path) -> Path:
        self.goi.append(req)
        if self.loi_o_canh is not None and len(self.goi) - 1 == self.loi_o_canh:
            raise ClipProviderError("HTTP 402 hết credit")
        return _clip(out_path)


class LocalGia:
    name, model_version = "LOCAL_CINEMATIC", "ffmpeg-kenburns"

    def __init__(self, tmp: Path):
        self.tmp, self.ken_burns = tmp, 0

    def is_available(self):
        return True

    def chuan_bi(self, job_id, org_id, payload, out_dir, cb=None):
        anh = []
        for i in range(2):
            p = self.tmp / f"a{i}.png"
            Image.new("RGB", (360, 640), (200, 30, 60)).save(p)
            anh.append(p)
        return {"image_paths": anh, "scene_durations": [1.2, 1.0], "scene_motions": ["ZOOM_IN", "PAN_RIGHT"],
                "audio_path": None, "subtitle_overlays": [], "temp_files": [], "aspect_ratio": "9:16",
                "duration_seconds": 2, "captioned_paths": anh}

    def render_tu_chuan_bi(self, cb, out_file, progress=None):
        self.ken_burns += 1
        return _clip(out_file)


def test_mot_nha_cung_cap_lam_tron_moi_canh_va_ghep_dung_thoi_luong(tmp_path):
    ben = ClipGia("kling")
    local = LocalGia(tmp_path)
    p = AiClipVideoProvider(["kling"], dung=lambda order: [ben], local=local)
    out = p.render_video("j1", "org", {}, tmp_path / "out.mp4")
    assert out.is_file() and local.ken_burns == 0
    assert len(ben.goi) == 2 and "push-in" in ben.goi[0].prompt and ben.goi[0].aspect_ratio == "9:16"
    assert p.ket_qua == {"clip_provider": "kling", "provider_fallback": False, "provider_attempts": []}
    assert p.name == "KLING"
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(out)],
                               capture_output=True, text=True).stdout)
    assert 1.9 <= dur <= 2.6  # 1.2 + 1.0 (+ phần chồng chuyển cảnh)


def test_ben_hong_giua_chung_thi_bo_ca_ben_va_thu_ben_ke_tiep_tu_dau(tmp_path):
    veo, kling = ClipGia("veo", loi_o_canh=1), ClipGia("kling")
    p = AiClipVideoProvider(["veo", "kling"], dung=lambda order: [veo, kling], local=LocalGia(tmp_path))
    p.render_video("j2", "org", {}, tmp_path / "out.mp4")
    assert p.ket_qua["clip_provider"] == "kling" and len(kling.goi) == 2
    assert p.ket_qua["provider_attempts"][0].startswith("veo:")


def test_moi_ben_hong_thi_lui_ken_burns_va_ghi_ly_do(tmp_path):
    local = LocalGia(tmp_path)
    p = AiClipVideoProvider(["runway"], dung=lambda order: [ClipGia("runway", loi_o_canh=0)], local=local)
    p.render_video("j3", "org", {}, tmp_path / "out.mp4")
    assert local.ken_burns == 1
    assert p.ket_qua["provider_fallback"] is True and "402" in p.ket_qua["provider_fallback_reason"]
    assert p.name == "LOCAL_CINEMATIC"


def test_khong_ben_nao_co_khoa_cung_lui_va_noi_ro(tmp_path):
    p = AiClipVideoProvider(["veo"], dung=lambda order: [], local=LocalGia(tmp_path))
    p.render_video("j4", "org", {}, tmp_path / "out.mp4")
    assert "Không nhà cung cấp video nào có khoá" in p.ket_qua["provider_fallback_reason"]


def test_registry_khop_danh_muc_ts_va_bo_ben_thieu_khoa(monkeypatch):
    assert list(NHA_CUNG_CAP_CLIP) == ["veo", "kling", "runway", "luma"]  # provider-catalog.ts loại video
    for k in ["FAL_KEY", "GEMINI_API_KEY", "GOOGLE_VEO_API_KEY", "RUNWAYML_API_SECRET"]:
        monkeypatch.delenv(k, raising=False)
    monkeypatch.setenv("RUNWAYML_API_SECRET", "r")
    assert [p.name for p in thu_tu_clip(["kling", "runway", "la"])] == ["runway"]


def test_kling_qua_fal_gui_dung_tham_so(tmp_path):
    bat = []

    def xu_ly(req: httpx.Request) -> httpx.Response:
        url = str(req.url)
        if req.method == "POST":
            bat.append(json.loads(req.content))
            return httpx.Response(200, json={"request_id": "r1", "status_url": "https://q/s", "response_url": "https://q/r"})
        if url == "https://q/s":
            return httpx.Response(200, json={"status": "COMPLETED"})
        if url == "https://q/r":
            return httpx.Response(200, json={"video": {"url": "https://cdn/v.mp4"}})
        return httpx.Response(200, content=b"MP4")

    img = tmp_path / "a.png"
    Image.new("RGB", (8, 8)).save(img)
    k = KlingClip(api_key="k", client=httpx.Client(transport=httpx.MockTransport(xu_ly)), khoang_poll_s=0)
    out = k.sinh_clip(ClipRequest(image_path=img, prompt=mo_ta_canh("ZOOM_IN"), aspect_ratio="9:16", duration_s=7), tmp_path / "c.mp4")
    assert out.read_bytes() == b"MP4"
    assert bat[0]["duration"] == "10" and bat[0]["image_url"].startswith("data:image/png;base64,")


def test_runway_that_bai_la_loi_nha_cung_cap(tmp_path):
    def xu_ly(req):
        if req.method == "POST":
            return httpx.Response(200, json={"id": "t1"})
        return httpx.Response(200, json={"status": "FAILED", "failure": "moderation"})

    img = tmp_path / "a.jpg"
    Image.new("RGB", (8, 8)).save(img)
    r = RunwayClip(api_key="k", client=httpx.Client(transport=httpx.MockTransport(xu_ly)), khoang_poll_s=0)
    with pytest.raises(ClipProviderError, match="FAILED"):
        r.sinh_clip(ClipRequest(image_path=img, prompt="x", aspect_ratio="9:16", duration_s=3), tmp_path / "c.mp4")
