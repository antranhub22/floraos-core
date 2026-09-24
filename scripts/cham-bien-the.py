#!/usr/bin/env python3
"""Bộ đo chất lượng ảnh biến thể Khu vực D (Chặng 06c) — Đợt 0 kế hoạch
nâng cấp chất lượng ảnh biến thể (24/09/2026).

Chạy ĐÚNG hàm `dung_bien_the` của worker trên ảnh thật (không qua DB, không
qua hàng đợi) và đo từng ảnh "styled":

    dai_dem        phần diện tích khung là dải màu phẳng do đệm (0 = không có)
    chu_the_px     chiều cao bó hoa trong khung cuối (điểm ảnh)
    phong_to       chu_the_px / chiều cao bó hoa ở ảnh gốc (> 1 = bị phóng, mềm ảnh)
    do_trung       Subject Integrity (lõi bó hoa trùng ảnh gốc)
    thoi_gian_s    thời gian dựng một biến thể

Xuất `ket-qua.csv` + `index.html` (lưới ảnh, có cột để PO chấm mắt 1–5) vào
`var/cham-bien-the/<nhan>/`. Chạy trước và sau mỗi đợt để so.

    python3 scripts/cham-bien-the.py --nhan truoc-dot1
    python3 scripts/cham-bien-the.py --nhan sau-dot1 --ratio 9:16,4:5
    python3 scripts/cham-bien-the.py --nhan cloud --cloud --so-anh 4   # gọi Stability THẬT, tốn credit

Mặc định dùng bộ phông cục bộ (0 credit). `--cloud` cần STABILITY_API_KEY.
"""

from __future__ import annotations

import argparse
import csv
import html
import inspect
import os
import sys
import time
from io import BytesIO
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "workers"))

import numpy as np  # noqa: E402
from PIL import Image  # noqa: E402

from media_ai.jobs import variant_worker as vw  # noqa: E402

# Cảnh thử: preset phông cục bộ + lời nhắc hậu cảnh (tiếng Anh) cho nhánh cloud,
# kèm ánh sáng / bố cục như kịch bản Chặng 05 hay sinh ra.
CANH_THU = [
    {
        "preset": "studio_white",
        "scene_prompt": "clean seamless white studio sweep, soft even light, minimal",
        "shot": "medium",
        "lighting": "left",
    },
    {
        "preset": "wedding",
        "scene_prompt": "warm bokeh restaurant table at dusk, candle light, romantic evening",
        "shot": "wide",
        "lighting": "right",
    },
    {
        "preset": "wood_minimal",
        "scene_prompt": "minimal light oak tabletop by a window, morning sun, linen fabric",
        "shot": "close",
        "lighting": "left",
    },
]


def chon_anh(so_anh: int) -> list[Path]:
    """Ảnh "-1" của từng sản phẩm trong BoAnhVang (ảnh chính), sắp theo tên."""
    tat_ca = sorted((REPO / "BoAnhVang").glob("*.jp*g"))
    chinh = [p for p in tat_ca if p.stem.replace(" ", "").endswith("-1")]
    return (chinh or tat_ca)[:so_anh]


def dai_dem(anh: Image.Image, nguong: int = 2) -> float:
    """Phần diện tích là dải phẳng liền mạch ở bốn mép (hàng/cột gần như một màu)."""
    a = np.asarray(anh.convert("RGB")).astype(np.int16)
    h, w, _ = a.shape

    def phang(dai: np.ndarray) -> bool:
        return int((dai.max(axis=0) - dai.min(axis=0)).max()) <= nguong

    tren = next((i for i in range(h) if not phang(a[i])), h)
    duoi = next((i for i in range(h) if not phang(a[h - 1 - i])), h)
    trai = next((j for j in range(w) if not phang(a[:, j])), w)
    phai = next((j for j in range(w) if not phang(a[:, w - 1 - j])), w)
    tren, duoi = min(tren, h // 2), min(duoi, h // 2)
    trai, phai = min(trai, w // 2), min(phai, w // 2)
    dien_tich = (tren + duoi) * w + (trai + phai) * (h - tren - duoi)
    return round(dien_tich / (w * h), 4)


def hop_chu_the(alpha: Image.Image) -> tuple[int, int, int, int] | None:
    # Cùng ngưỡng với hộp bố cục của worker (NGUONG_HOP_BO_CUC) để hai phép đo so được.
    return alpha.point(lambda p: 255 if p > getattr(vw, "NGUONG_HOP_BO_CUC", 32) else 0).getbbox()


def chay(args: argparse.Namespace) -> None:
    ra = REPO / "var" / "cham-bien-the" / args.nhan
    ra.mkdir(parents=True, exist_ok=True)
    ratios = [r.strip() for r in args.ratio.split(",") if r.strip()]
    canh = CANH_THU[: args.so_canh]
    hau_canh_provider = None
    if args.cloud:
        from media_ai.providers.background.stability_background import resolve_background_provider

        hau_canh_provider = resolve_background_provider("stability")

    ky = inspect.signature(vw.dung_bien_the).parameters
    dong: list[dict] = []
    for anh_path in chon_anh(args.so_anh):
        master_bytes = anh_path.read_bytes()
        master = Image.open(BytesIO(master_bytes)).convert("RGB")
        _, alpha = vw._doan_chu_the(master, None, None)
        hop = hop_chu_the(alpha)
        cao_goc = (hop[3] - hop[1]) if hop else master.height
        for c in canh:
            for ratio in ratios:
                kw: dict = {}
                # Tham số của Đợt 1 — chỉ truyền khi worker đã hỗ trợ.
                if "composition" in ky:
                    kw["composition"] = {"shot": c["shot"], "placement": "center"}
                if "lighting" in ky:
                    kw["lighting"] = {"direction": c["lighting"]}
                if "fill_mode" in ky:
                    kw["fill_mode"] = args.fill_mode
                hau_canh = None
                if hau_canh_provider is not None:
                    if "nguon_hau_canh" in ky and args.fill_mode == "full_frame":
                        from media_ai.providers.background.base import BackgroundRequest

                        def _nguon(r: str, rong: int, cao: int, _c=c):
                            return hau_canh_provider.generate(
                                BackgroundRequest(ratio=r, rong=rong, cao=cao, scene_prompt=_c["scene_prompt"],
                                                  lighting_direction=_c["lighting"], shot=_c["shot"])
                            ).anh

                        kw["nguon_hau_canh"] = _nguon
                    else:
                        kq = hau_canh_provider.sinh_hau_canh(c["scene_prompt"], master.width, master.height)
                        hau_canh = kq["image"]
                t0 = time.monotonic()
                bien_the, do_trung, _ = vw.dung_bien_the(
                    master_bytes, c["preset"], ratio, watermark=False, logo_bytes=None, ten_tiem=None,
                    hau_canh_bytes=hau_canh, **kw,
                )
                giay = round(time.monotonic() - t0, 2)
                styled = next((b for b in bien_the if b["key"] == "styled"), None)
                if styled is None:
                    continue
                anh = styled["image"].convert("RGB")
                if styled.get("subject_box"):
                    chu_the_px = int(styled["subject_box"][3])
                else:  # hành vi cũ: khung làm việc = ảnh gốc, rồi co giãn đệm vào khung đích
                    rd, cd = vw.RATIO_PRESETS[ratio]
                    chu_the_px = int(cao_goc * min(rd / master.width, cd / master.height))
                ten = f"{anh_path.stem.replace(' ', '')}_{c['preset']}_{ratio.replace(':', 'x')}.jpg"
                anh.save(ra / ten, quality=90)
                dong.append(
                    {
                        "anh": anh_path.name,
                        "canh": c["preset"],
                        "ratio": ratio,
                        "tep": ten,
                        "khung": f"{anh.width}x{anh.height}",
                        "dai_dem": dai_dem(anh),
                        "chu_the_px": chu_the_px,
                        "phong_to": round(chu_the_px / max(1, cao_goc), 2),
                        "do_trung": round(float(do_trung), 4),
                        "thoi_gian_s": giay,
                        "diem_po_1_5": "",
                    }
                )
                print(f"{ten}: dai_dem={dong[-1]['dai_dem']} phong_to={dong[-1]['phong_to']} do_trung={dong[-1]['do_trung']} {giay}s")

    if not dong:
        print("Không có ảnh nào được dựng.")
        return
    with (ra / "ket-qua.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(dong[0].keys()))
        w.writeheader()
        w.writerows(dong)

    tb = lambda k: round(sum(float(d[k]) for d in dong) / len(dong), 3)  # noqa: E731
    co_dem = sum(1 for d in dong if d["dai_dem"] > 0.02)
    tom_tat = (
        f"{len(dong)} ảnh · dải đệm TB {tb('dai_dem') * 100:.1f}% · ảnh có dải đệm >2%: {co_dem} · "
        f"phóng to TB ×{tb('phong_to')} · do_trung TB {tb('do_trung')} · {tb('thoi_gian_s')}s/ảnh"
    )
    the = "".join(
        f"<figure><img src='{html.escape(d['tep'])}' loading='lazy'><figcaption>{html.escape(d['anh'])} · {d['canh']} · {d['ratio']}"
        f"<br>dải đệm {d['dai_dem'] * 100:.1f}% · phóng ×{d['phong_to']} · trùng {d['do_trung']}<br>Điểm PO: ___ / 5</figcaption></figure>"
        for d in dong
    )
    (ra / "index.html").write_text(
        "<!doctype html><meta charset='utf-8'><title>Chấm biến thể — " + html.escape(args.nhan) + "</title>"
        "<style>body{font:14px system-ui;margin:16px;background:#f4f2ee}figure{display:inline-block;width:220px;margin:6px;vertical-align:top}"
        "img{width:100%;border:1px solid #ccc;background:#fff}figcaption{font-size:12px}</style>"
        f"<h1>Chấm biến thể — {html.escape(args.nhan)}</h1><p>{html.escape(tom_tat)}</p>{the}",
        encoding="utf-8",
    )
    print("\n" + tom_tat + f"\n→ {ra}")


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--nhan", default="goc", help="Tên lượt đo (thư mục kết quả)")
    p.add_argument("--so-anh", type=int, default=12)
    p.add_argument("--so-canh", type=int, default=3)
    p.add_argument("--ratio", default="9:16,4:5")
    p.add_argument("--fill-mode", default="full_frame", choices=["full_frame", "pad"])
    p.add_argument("--cloud", action="store_true", help="Gọi Stability thật (tốn credit)")
    chay(p.parse_args())
