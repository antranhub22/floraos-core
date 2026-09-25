#!/usr/bin/env python3
"""Thử THẬT luồng nhà cung cấp trọn gói (PO 25/09/2026) — tốn credit nhà cung cấp.

Máy của agent không gọi được fal.ai / Stability (chính sách mạng), nên các
adapter mới chỉ được kiểm bằng HTTP giả lập. Script này chạy ĐÚNG hàm của worker
(`dung_bien_the_nha_cung_cap`) trên ảnh thật để:
  1. xác nhận lược đồ API của từng nhà cung cấp (tên tham số, dạng kết quả);
  2. lấy số đo thật (hình dáng / cấu trúc / màu) để hiệu chỉnh ngưỡng
     `PERCEPTUAL_THRESHOLDS` — hiện đặt thận trọng, chưa có số thật.

    workers/.venv/bin/python scripts/thu-nha-cung-cap-canh.py                    # 2 ảnh × mọi bên có khoá
    workers/.venv/bin/python scripts/thu-nha-cung-cap-canh.py --ncc fal --so-anh 1
    workers/.venv/bin/python scripts/thu-nha-cung-cap-canh.py --upscale 2x

Mỗi ảnh × mỗi bên ≈ 3 lượt gọi (tách nền Master, dựng cảnh, tách nền ảnh ra để đo)
— thêm 1 lượt khi --upscale 2x. Kết quả: var/cham-bien-the/nha-cung-cap/<bên>/.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "workers"))


def _nap_env(tep: Path) -> None:
    if not tep.is_file():
        return
    for dong in tep.read_text(encoding="utf-8").splitlines():
        dong = dong.strip()
        if not dong or dong.startswith("#") or "=" not in dong:
            continue
        k, _, v = dong.removeprefix("export ").partition("=")
        v = v.strip()
        if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
            v = v[1:-1]
        os.environ.setdefault(k.strip(), v)


_nap_env(REPO / ".env")

from media_ai.jobs.variant_nha_cung_cap import TatCaNhaCungCapLoi, dung_bien_the_nha_cung_cap  # noqa: E402
from media_ai.providers.scene.registry import NHA_CUNG_CAP  # noqa: E402

CANH = {
    "scene_prompt": "warm wooden table by a bright window, soft morning light, linen fabric",
    "composition": {"shot": "medium", "placement": "center"},
    "lighting": {"direction": "left"},
    "palette": ["kem", "gỗ"],
    "seed": 1234,
    "style": "natural",
    "quality": "standard",
}


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--ncc", default=",".join(NHA_CUNG_CAP), help="Danh sách bên, cách nhau dấu phẩy")
    p.add_argument("--so-anh", type=int, default=2)
    p.add_argument("--ratio", default="9:16")
    p.add_argument("--upscale", default="none", choices=["none", "2x"])
    a = p.parse_args()

    anh = sorted(x for x in (REPO / "BoAnhVang").glob("*.jp*g") if x.stem.replace(" ", "").endswith("-1"))[: a.so_anh]
    tong: list[dict] = []
    for ten in [t.strip() for t in a.ncc.split(",") if t.strip()]:
        ncc = NHA_CUNG_CAP[ten]()
        if not ncc.co_khoa():
            print(f"[{ten}] bỏ qua — chưa có khoá trong .env")
            continue
        ra = REPO / "var" / "cham-bien-the" / "nha-cung-cap" / ten
        ra.mkdir(parents=True, exist_ok=True)
        for f in anh:
            t0 = time.monotonic()
            try:
                kq = dung_bien_the_nha_cung_cap(f.read_bytes(), "wood_minimal", a.ratio, False, None, None, [ncc],
                                                {**CANH, "upscale": a.upscale})
            except TatCaNhaCungCapLoi as exc:
                print(f"[{ten}] {f.name}: LỖI — {exc}")
                tong.append({"ncc": ten, "anh": f.name, "loi": str(exc)})
                continue
            styled = next(b for b in kq.bien_the if b["key"] == "styled")
            ten_tep = f"{f.stem.replace(' ', '')}_{a.ratio.replace(':', 'x')}.jpg"
            styled["image"].convert("RGB").save(ra / ten_tep, quality=92)
            dong = {"ncc": ten, "anh": f.name, "tep": ten_tep, "giay": round(time.monotonic() - t0, 1),
                    **{k: kq.khoi_do.get(k) for k in ("result", "structure_ssim", "color_delta_e", "shape_iou", "ly_do")},
                    "bo_qua": kq.nguon.get("provider_ignored"), "tham_my": (styled.get("aesthetic") or {}).get("score")}
            tong.append(dong)
            print(f"[{ten}] {f.name}: {dong['result']} ssim={dong['structure_ssim']} ΔE={dong['color_delta_e']} "
                  f"iou={dong['shape_iou']} ({dong['giay']}s)")
    out = REPO / "var" / "cham-bien-the" / "nha-cung-cap" / "ket-qua.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(tong, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n→ {out}  (gửi file này cho agent để hiệu chỉnh ngưỡng)")


if __name__ == "__main__":
    main()
