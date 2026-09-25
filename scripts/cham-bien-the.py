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
    python3 scripts/cham-bien-the.py --nhan pa --so-anh 4 --phuong-an 3   # Đợt 2: 3 phương án/cảnh + độ khác nhau

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


def _nap_env(tep: Path) -> None:
    """Nạp `.env` như `npm run worker:media` (`set -a; . ../.env`) — không ghi
    đè biến đã có trong môi trường. Thiếu bước này thì `--cloud` báo "Thiếu
    STABILITY_API_KEY" dù khoá nằm sẵn trong `.env` (25/09/2026)."""
    if not tep.is_file():
        return
    for dong in tep.read_text(encoding="utf-8").splitlines():
        dong = dong.strip()
        if not dong or dong.startswith("#") or "=" not in dong:
            continue
        khoa, _, gia_tri = dong.removeprefix("export ").partition("=")
        khoa, gia_tri = khoa.strip(), gia_tri.strip()
        if len(gia_tri) >= 2 and gia_tri[0] == gia_tri[-1] and gia_tri[0] in "\"'":
            gia_tri = gia_tri[1:-1]
        os.environ.setdefault(khoa, gia_tri)


_nap_env(REPO / ".env")

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


# Phương án (Đợt 2, 25/09/2026) — cùng luật với `candidateDirections` phía TS
# (`src/modules/media/domain/variant-candidates.ts`): đám mây giữ chỉ đạo, đổi
# seed; cục bộ (không seed) xoay vị trí bó hoa và hướng sáng.
_VI_TRI = ("center", "left_third", "right_third")


def chi_dao_phuong_an(c: dict, n: int, cloud: bool, seed_goc: int) -> list[dict]:
    ds = []
    for i in range(n):
        # Seed: đám mây → seed hậu cảnh của nhà cung cấp; cục bộ → seed phông
        # (vùng sáng, bố cục bokeh). Cùng seed gốc → tái tạo đúng cả bộ.
        d = {"shot": c["shot"], "placement": "center", "lighting": c["lighting"], "seed": (seed_goc + i) % 4_294_967_295}
        if not cloud and i > 0:
            d["placement"] = _VI_TRI[i % len(_VI_TRI)]
            if i % 2 == 1:
                d["lighting"] = "left" if c["lighting"] == "right" else "right"
        ds.append(d)
    return ds


def do_khac_nhau(anh_list: list[Image.Image]) -> float | None:
    """Trung bình khác biệt từng cặp (0 = y hệt, ~0,3 = rất khác) trên ảnh thu nhỏ
    64×64 — đo "phương án khác nhau THẬT" chứ không phải n bản giống nhau."""
    if len(anh_list) < 2:
        return None
    nho = [np.asarray(a.convert("RGB").resize((64, 64), Image.BILINEAR)).astype(np.float32) / 255 for a in anh_list]
    cap = [float(np.abs(a - b).mean()) for k, a in enumerate(nho) for b in nho[k + 1:]]
    return round(sum(cap) / len(cap), 4)


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
    khac_nhau: list[float] = []
    for anh_path in chon_anh(args.so_anh):
        master_bytes = anh_path.read_bytes()
        master = Image.open(BytesIO(master_bytes)).convert("RGB")
        _, alpha = vw._doan_chu_the(master, None, None)
        hop = hop_chu_the(alpha)
        cao_goc = (hop[3] - hop[1]) if hop else master.height
        for c in canh:
            for ratio in ratios:
                nhom: list[Image.Image] = []
                for so_pa, d in enumerate(chi_dao_phuong_an(c, args.phuong_an, bool(args.cloud), args.seed), start=1):
                    kw: dict = {}
                    # Tham số của Đợt 1 — chỉ truyền khi worker đã hỗ trợ.
                    if "composition" in ky:
                        kw["composition"] = {"shot": d["shot"], "placement": d["placement"]}
                    if "lighting" in ky:
                        kw["lighting"] = {"direction": d["lighting"]}
                    if "fill_mode" in ky:
                        kw["fill_mode"] = args.fill_mode
                    if "seed_phong" in ky and not args.cloud and args.phuong_an > 1:
                        kw["seed_phong"] = d["seed"]
                    # Đợt 3 (25/09/2026)
                    if "upscale" in ky:
                        kw["upscale"] = args.upscale
                    if "compose_mode" in ky:
                        kw["compose_mode"] = args.compose
                    if "mo_mep_cat" in ky:
                        kw["mo_mep_cat"] = not args.khong_mo_mep
                    hau_canh = None
                    if hau_canh_provider is not None:
                        if "nguon_hau_canh" in ky and args.fill_mode == "full_frame":
                            from media_ai.providers.background.base import BackgroundRequest

                            def _nguon(r: str, rong: int, cao: int, _c=c, _d=d):
                                return hau_canh_provider.generate(
                                    BackgroundRequest(ratio=r, rong=rong, cao=cao, scene_prompt=_c["scene_prompt"],
                                                      lighting_direction=_d["lighting"], shot=_d["shot"],
                                                      seed=_d["seed"], style=args.style,
                                                      **({"quality": args.quality} if args.quality != "standard" else {}))
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
                    nhom.append(anh)
                    if styled.get("subject_box"):
                        chu_the_px = int(styled["subject_box"][3])
                    else:  # hành vi cũ: khung làm việc = ảnh gốc, rồi co giãn đệm vào khung đích
                        rd, cd = vw.RATIO_PRESETS[ratio]
                        chu_the_px = int(cao_goc * min(rd / master.width, cd / master.height))
                    hau_to = f"_pa{so_pa}" if args.phuong_an > 1 else ""
                    ten = f"{anh_path.stem.replace(' ', '')}_{c['preset']}_{ratio.replace(':', 'x')}{hau_to}.jpg"
                    anh.save(ra / ten, quality=90)
                    dong.append(
                        {
                            "anh": anh_path.name,
                            "canh": c["preset"],
                            "ratio": ratio,
                            "phuong_an": so_pa,
                            "chi_dao": f"{d['shot']}/{d['placement']}/{d['lighting']}" + (f"/seed{d['seed']}" if args.cloud or args.phuong_an > 1 else ""),
                            "tep": ten,
                            "khung": f"{anh.width}x{anh.height}",
                            "dai_dem": dai_dem(anh),
                            "chu_the_px": chu_the_px,
                            "phong_to": round(chu_the_px / max(1, cao_goc), 2),
                            "do_trung": round(float(do_trung), 4),
                            "thoi_gian_s": giay,
                            "tham_my": (styled.get("aesthetic") or {}).get("score", ""),
                            "mo_mep": "|".join((styled.get("edge_fade") or {}).get("edges", [])),
                            "diem_po_1_5": "",
                        }
                    )
                    print(f"{ten}: dai_dem={dong[-1]['dai_dem']} phong_to={dong[-1]['phong_to']} do_trung={dong[-1]['do_trung']} {giay}s")
                kn = do_khac_nhau(nhom)
                if kn is not None:
                    khac_nhau.append(kn)

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
        f"phóng to TB ×{tb('phong_to')} · do_trung TB {tb('do_trung')} (min {min(float(d['do_trung']) for d in dong)}) · "
        f"{tb('thoi_gian_s')}s/ảnh"
    )
    diem_tm = [float(d["tham_my"]) for d in dong if d["tham_my"] != ""]
    if diem_tm:
        tom_tat += f" · chấm kỹ thuật TB {sum(diem_tm) / len(diem_tm):.1f}/100"
    so_mo = sum(1 for d in dong if d["mo_mep"])
    if so_mo:
        tom_tat += f" · làm mờ mép cắt {so_mo}/{len(dong)} ảnh"
    if khac_nhau:
        tom_tat += f" · độ khác nhau giữa phương án TB {sum(khac_nhau) / len(khac_nhau):.3f} (min {min(khac_nhau):.3f})"
    the = "".join(
        f"<figure><img src='{html.escape(d['tep'])}' loading='lazy'><figcaption>{html.escape(d['anh'])} · {d['canh']} · {d['ratio']}"
        f" · PA{d['phuong_an']} {html.escape(d['chi_dao'])}"
        f"<br>dải đệm {d['dai_dem'] * 100:.1f}% · phóng ×{d['phong_to']} · trùng {d['do_trung']} · kỹ thuật {d['tham_my']}"
        f"<br>Điểm PO: ___ / 5</figcaption></figure>"
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
    p.add_argument("--phuong-an", type=int, default=1, help="Số phương án mỗi cảnh (Đợt 2) — tính thêm độ khác nhau")
    p.add_argument("--style", default=None, choices=["natural", "cinematic", "film", "vivid"], help="Phong cách (chỉ nhánh --cloud)")
    p.add_argument("--seed", type=int, default=1000, help="Seed gốc cho --cloud --phuong-an (tái tạo được)")
    p.add_argument("--quality", default="standard", choices=["standard", "high"], help="Đợt 3 — high = Stability Ultra (chỉ --cloud)")
    p.add_argument("--upscale", default="none", choices=["none", "2x"], help="Đợt 3 — khung xuất ×2, tăng nét hậu cảnh")
    p.add_argument("--compose", default="paste", choices=["paste", "harmonize"], help="Đợt 3 — cách ghép")
    p.add_argument("--khong-mo-mep", action="store_true", help="Tắt làm mờ mép cắt (so với trước Đợt 3)")
    chay(p.parse_args())
