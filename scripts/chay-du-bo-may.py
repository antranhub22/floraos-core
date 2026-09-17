#!/usr/bin/env python3
"""Chạy cho ĐỦ cả ba bộ máy trên cùng một tập ảnh vàng.

Hai script cũ mỗi cái ghim cứng một danh sách ảnh khác nhau, nên hôm nay bộ
Cục bộ có g001–g006 còn hai bộ OpenAI có g001, g002, g010, g011 — và chỉ hai
ảnh có đủ cả ba. So hai bộ trên hai tập ảnh khác nhau là so hai thứ không so
được: một bộ có thể thắng chỉ vì nó được chấm trên những ảnh dễ hơn.

Script này lấp đúng những ô còn trống, bỏ qua ô đã có, và ghi lại CHI PHÍ và
THỜI GIAN mỗi ảnh — chỉ số 6 của `BO_ANH_VANG.md` mục 9, thứ mà không lượt
chạy nào trước đây đo.

    # xem còn thiếu gì, không chạy, không tốn tiền
    python3 scripts/chay-du-bo-may.py --xem

    # chạy những gì còn thiếu — script tự tìm venv có đủ gói
    python3 scripts/chay-du-bo-may.py --bo tat-ca

    # hoặc chọn riêng từng bộ
    python3 scripts/chay-du-bo-may.py --bo day-du,gon
    python3 scripts/chay-du-bo-may.py --bo cuc-bo

Chạy từ thư mục gốc repo. `python3` nào cũng được: nếu nó thiếu gói, script
tự chuyển sang venv trong `workers/` rồi chạy lại.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
WORKERS = GOC / "workers"
ANH = GOC / "golden" / "images"
sys.path.insert(0, str(WORKERS))


# ── Tự tìm đúng trình thông dịch ───────────────────────────────────────────
# `python3` trên máy thật thường là Python của hệ điều hành hoặc Homebrew, và
# nó KHÔNG có thư viện của dự án. Bắt người chạy phải nhớ đường dẫn venv nào
# cho bộ máy nào là cách chắc chắn để lệnh hỏng — nên script tự tìm một venv
# trong `workers/` có đủ gói cho bộ máy được chọn, rồi chạy lại chính nó bằng
# venv đó.
GOI_CAN = {
    "cuc-bo": ("torch", "sam2", "PIL", "numpy"),
    "day-du": ("openai", "PIL", "numpy"),
    "gon": ("openai", "PIL", "numpy"),
}
CO_DOI_INTERPRETER = "FLORAOS_DA_DOI_PYTHON"


def _co_du_goi(python: Path, goi: tuple[str, ...]) -> bool:
    import subprocess
    ma = "import " + ", ".join(goi)
    try:
        r = subprocess.run([str(python), "-c", ma], capture_output=True, timeout=180)
        return r.returncode == 0
    except Exception:  # noqa: BLE001
        return False


TEN_PYTHON = ("python", "python3", "python3.13", "python3.12", "python3.11", "python3.10", "python3.9")


def _tim_python_trong_venv() -> tuple[list[Path], list[Path]]:
    """`(trình thông dịch chạy được, venv có symlink gãy)`.

    Không dùng `Path.glob(".venv*/bin/python")`: glob theo đường dẫn symlink
    GÃY sẽ coi như không tồn tại và bỏ qua lặng lẽ, nên một venv đầy đủ gói
    nhưng vừa mất trình thông dịch sẽ biến mất khỏi danh sách và người dùng
    nhận câu "không có venv nào" — sai sự thật và chỉ sai hướng sửa.
    """
    chay_duoc: list[Path] = []
    gay: list[Path] = []
    minh = Path(sys.executable).resolve() if Path(sys.executable).exists() else None

    for thu_muc in sorted(WORKERS.glob(".venv*")):
        if not thu_muc.is_dir():
            continue
        bin_dir = thu_muc / "bin"
        co_ai_do = False
        for ten in TEN_PYTHON:
            uv = bin_dir / ten
            if not os.path.lexists(uv):
                continue
            co_ai_do = True
            if not uv.exists():  # symlink gãy
                continue
            if minh is not None and uv.resolve() == minh:
                continue
            if os.access(uv, os.X_OK):
                chay_duoc.append(uv)
                break
        else:
            if co_ai_do:
                gay.append(thu_muc)

    return chay_duoc, gay


def doi_python_neu_can(chon: list[str]) -> None:
    """Chạy lại chính script này bằng venv có đủ gói, nếu cần."""
    if os.environ.get(CO_DOI_INTERPRETER):
        return  # đã đổi một lần rồi, không lặp vô hạn

    can: set[str] = set()
    for b in chon:
        can.update(GOI_CAN.get(b, ()))
    if not can:
        return

    if _co_du_goi(Path(sys.executable), tuple(sorted(can))):
        return

    ung_vien, gay = _tim_python_trong_venv()
    for uv in ung_vien:
        print(f"Thử {uv.relative_to(GOC)} ...", flush=True)
        if _co_du_goi(uv, tuple(sorted(can))):
            print(f"Dùng {uv.relative_to(GOC)}\n", flush=True)
            os.environ[CO_DOI_INTERPRETER] = "1"
            os.execv(str(uv), [str(uv), str(Path(__file__).resolve()), *sys.argv[1:]])

    print(f"Không venv nào trong workers/ có đủ {', '.join(sorted(can))}.", file=sys.stderr)
    print(f"Đã thử: {', '.join(str(u.relative_to(GOC)) for u in ung_vien) or '(không tìm thấy venv chạy được)'}",
          file=sys.stderr)
    if gay:
        # Phân biệt "không có venv" với "venv có nhưng hỏng" — hai tình huống
        # này sửa bằng hai cách khác hẳn nhau, và gộp chúng vào một câu báo
        # lỗi là đẩy người dùng đi dựng lại một venv vẫn còn dùng được.
        print("\nVenv có nhưng trình thông dịch là symlink GÃY (thường do nâng cấp Python "
              "của Homebrew) — dựng lại bằng:", file=sys.stderr)
        for g in gay:
            print(f"    rm -rf {g.relative_to(GOC)} && python3.11 -m venv {g.relative_to(GOC)}",
                  file=sys.stderr)
    print("\nBộ Đầy đủ và Gọn cần `openai`; bộ Cục bộ cần thêm `torch`, `transformers`, `sam2` "
          "(xem workers/requirements-local-cv.txt).", file=sys.stderr)
    raise SystemExit(2)

# Tám ảnh đang so. Thêm g040, g049 khi muốn phủ cả dạng bó.
MAC_DINH = ["g001", "g002", "g003", "g004", "g005", "g006", "g010", "g011"]

BO_MAY = {
    "cuc-bo":  {"khoa": "local_cv",          "thu_muc": "ai-proposals",               "boc": True,  "ten": "Cục bộ"},
    "day-du":  {"khoa": "openai_structured", "thu_muc": "ai-proposals-openai",        "boc": False, "ten": "Đầy đủ"},
    "gon":     {"khoa": "openai_direct",     "thu_muc": "ai-proposals-openai-direct", "boc": False, "ten": "Gọn"},
}


def nap_env() -> None:
    tep = GOC / ".env"
    if not tep.exists():
        return
    for dong in tep.read_text(encoding="utf-8").splitlines():
        dong = dong.strip()
        if not dong or dong.startswith("#") or "=" not in dong:
            continue
        k, _, v = dong.partition("=")
        k, v = k.strip(), v.strip().strip('"').strip("'")
        if k and v:
            os.environ.setdefault(k, v)


def duong_dan_anh(ma: str) -> Path | None:
    for duoi in (".jpeg", ".jpg", ".png", ".webp"):
        p = ANH / f"{ma}{duoi}"
        if p.exists():
            return p
    return None


def con_thieu(ds: list[str]) -> dict[str, list[str]]:
    ra: dict[str, list[str]] = {}
    for bo, cfg in BO_MAY.items():
        tm = GOC / "golden" / cfg["thu_muc"]
        ra[bo] = [m for m in ds if not (tm / f"{m}.json").exists()]
    return ra


def in_bang_thieu(ds: list[str]) -> None:
    thieu = con_thieu(ds)
    print(f"{'ảnh':8}" + "".join(f"{BO_MAY[b]['ten']:>10}" for b in BO_MAY))
    for m in ds:
        print(f"{m:8}" + "".join(f"{('thiếu' if m in thieu[b] else 'có'):>10}" for b in BO_MAY))
    print()
    for b, ds_thieu in thieu.items():
        print(f"{BO_MAY[b]['ten']:8}: còn thiếu {len(ds_thieu)} ảnh"
              + (f" ({', '.join(ds_thieu)})" if ds_thieu else ""))


def chay_mot_bo(bo: str, ds: list[str], chay_lai: bool) -> None:
    cfg = BO_MAY[bo]
    tm = GOC / "golden" / cfg["thu_muc"]
    tm.mkdir(parents=True, exist_ok=True)

    can = ds if chay_lai else [m for m in ds if not (tm / f"{m}.json").exists()]
    if not can:
        print(f"\n── {cfg['ten']}: đã đủ, không phải chạy gì.")
        return

    print(f"\n── {cfg['ten']} ({cfg['khoa']}): {len(can)} ảnh — {', '.join(can)}")

    from vision.providers.registry import lay_provider

    try:
        provider = lay_provider(cfg["khoa"])
    except NotImplementedError as e:
        print(f"   KHÔNG DỰNG ĐƯỢC BỘ MÁY: {e}")
        return
    except Exception as e:  # noqa: BLE001
        print(f"   KHÔNG DỰNG ĐƯỢC BỘ MÁY: {e}")
        return

    so_lieu = []
    for i, ma in enumerate(can, 1):
        p = duong_dan_anh(ma)
        if p is None:
            print(f"   [{i}/{len(can)}] {ma}: KHÔNG THẤY ẢNH")
            continue

        print(f"   [{i}/{len(can)}] {ma} ...", end=" ", flush=True)
        t0 = time.monotonic()
        try:
            kq = provider.analyze(p.read_bytes(), {
                "asset_id": ma, "product_id": None, "organization_id": None,
            })
        except Exception as e:  # noqa: BLE001
            print(f"LỖI: {e}")
            continue
        giay = time.monotonic() - t0

        ghi = kq
        if cfg["boc"]:
            ghi = {
                "image_id": ma, "file": p.name,
                "source": str(p.parent.relative_to(GOC)),
                "ai_raw": kq,
                "proposed_by": cfg["khoa"],
                "proposed_at": datetime.now(timezone.utc).isoformat(),
                "note": "Đề xuất AI — người gán nhãn PHẢI đánh giá độc lập",
            }
        (tm / f"{ma}.json").write_text(
            json.dumps(ghi, ensure_ascii=False, indent=2, default=str) + "\n", encoding="utf-8"
        )

        so_lieu.append(giay)
        print(f"OK · {kq.get('flower_count')} cành · tin {kq.get('confidence')} · {giay:.1f}s")

    if so_lieu:
        tb = sum(so_lieu) / len(so_lieu)
        (GOC / "golden" / f"so-lieu-{bo}.json").write_text(
            json.dumps({"bo_may": cfg["khoa"], "so_anh": len(so_lieu),
                        "giay_moi_anh": round(tb, 2), "usd_moi_anh": None,
                        "ghi_chu": "usd_moi_anh điền tay từ hoá đơn nhà cung cấp"},
                       ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"   Trung bình {tb:.1f} giây mỗi ảnh → golden/so-lieu-{bo}.json")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--bo", default="", help="cuc-bo,day-du,gon hoặc tat-ca")
    ap.add_argument("--anh", default="", help="danh sách mã ảnh, cách nhau bằng dấu phẩy")
    ap.add_argument("--xem", action="store_true", help="chỉ xem còn thiếu gì, không chạy")
    ap.add_argument("--chay-lai", action="store_true", help="chạy lại cả những ô đã có")
    args = ap.parse_args()

    ds = [m.strip() for m in args.anh.split(",") if m.strip()] or MAC_DINH

    if args.xem or not args.bo:
        in_bang_thieu(ds)
        if not args.bo:
            print("\nThêm --bo day-du,gon (hoặc tat-ca) để chạy thật.")
        return 0

    nap_env()
    chon = list(BO_MAY) if args.bo.strip() == "tat-ca" else [b.strip() for b in args.bo.split(",")]
    la = [b for b in chon if b not in BO_MAY]
    if la:
        print(f"Không biết bộ máy: {', '.join(la)}. Chọn trong: {', '.join(BO_MAY)}", file=sys.stderr)
        return 2

    doi_python_neu_can(chon)

    if any(b in ("day-du", "gon") for b in chon) and not os.environ.get("OPENAI_API_KEY"):
        print("Thiếu OPENAI_API_KEY — hai bộ OpenAI không chạy được.", file=sys.stderr)
        return 2

    for b in chon:
        chay_mot_bo(b, ds, args.chay_lai)

    print("\n── Còn lại ──")
    in_bang_thieu(ds)
    print("\nXong thì so ba bộ:")
    print("  python3 scripts/so-sanh-ba-bo.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
