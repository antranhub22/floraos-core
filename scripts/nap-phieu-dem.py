#!/usr/bin/env python3
"""Nạp phiếu đếm đã điền vào bộ nhãn của bộ ảnh vàng.

Đọc tệp JSON mà `golden/phieu-dem.html` tải về, soát theo `QUY_UOC_DEM.md`,
rồi ghi vào `golden/labels/<image_id>.json` và cập nhật `golden/manifest.csv`.

Hai vòng gán nhãn theo `BO_ANH_VANG.md` mục 7:
    vòng một  → `--vong 1`  ghi `labeled_by`
    vòng hai  → `--vong 2`  ghi `verified_by`, và ĐỐI CHIẾU với vòng một

Vòng hai KHÔNG ghi đè số của vòng một. Nó báo ra chỗ hai người lệch nhau và
dừng lại — lệch nhau là chuyện phải xử lý, không phải chuyện ghi đè. Tỉ lệ
lệch trên 10% nghĩa là quy ước đếm chưa đủ rõ, không phải người đếm cẩu thả.

    python3 scripts/nap-phieu-dem.py phieu-dem-tuan.json --vong 1
    python3 scripts/nap-phieu-dem.py phieu-dem-lan.json  --vong 2
    python3 scripts/nap-phieu-dem.py phieu-dem-tuan.json --vong 1 --that   # ghi thật
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from datetime import date
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
NHAN = GOC / "golden" / "labels"
MANIFEST = GOC / "golden" / "manifest.csv"

LOAI_HOP_LE = {"flower", "bud", "foliage", "packaging"}
NGUONG_LECH_PHAN_TRAM = 10


def soat_mot_anh(a: dict) -> list[str]:
    """Soát theo sáu quy ước. Trả về danh sách lỗi CHẶN."""
    loi: list[str] = []
    ma = a.get("image_id", "?")

    fc = a.get("flower_count")
    if fc is None:
        return [f"{ma}: chưa đếm số cành hoa"]
    if not isinstance(fc, int) or fc < 0:
        loi.append(f"{ma}: số cành hoa phải là số nguyên không âm, đang là {fc!r}")

    for khoa in ("bud_count", "damaged_count", "order_count"):
        v = a.get(khoa)
        if v is not None and (not isinstance(v, int) or v < 0):
            loi.append(f"{ma}: {khoa} phải là số nguyên không âm, đang là {v!r}")

    # Quy ước 6: cành hỏng ĐÃ NẰM TRONG tổng số cành.
    dm = a.get("damaged_count")
    if isinstance(dm, int) and isinstance(fc, int) and dm > fc:
        loi.append(f"{ma}: số cành hỏng ({dm}) lớn hơn tổng số cành ({fc}) — quy ước 6 nói hỏng nằm trong tổng")

    ten_da_gap: set[str] = set()
    for c in a.get("components") or []:
        ten = (c.get("canonical_component") or "").strip()
        loai = c.get("category")
        if not ten:
            loi.append(f"{ma}: có cấu phần chưa đặt tên")
            continue
        if loai not in LOAI_HOP_LE:
            loi.append(f"{ma}: cấu phần '{ten}' mang loại '{loai}' không thuộc {sorted(LOAI_HOP_LE)}")
        # Quy ước 4: lá và cành trang trí không đếm số.
        if loai == "foliage" and c.get("count") is not None:
            loi.append(f"{ma}: cấu phần lá '{ten}' không được có số lượng (quy ước 4)")
        if loai in {"flower", "bud", "packaging"} and c.get("count") is None:
            loi.append(f"{ma}: cấu phần '{ten}' loại '{loai}' thiếu số lượng")
        khoa = f"{ten}|{loai}"
        if khoa in ten_da_gap:
            loi.append(f"{ma}: cấu phần '{ten}' loại '{loai}' bị khai hai lần")
        ten_da_gap.add(khoa)

    return loi


def doc_nhan_cu(ma: str) -> dict:
    p = NHAN / f"{ma}.json"
    if not p.exists():
        return {}
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def doi_chieu(ma: str, cu: dict, moi: dict) -> list[str]:
    """Chỗ hai vòng lệch nhau. Không tự chốt bên nào đúng."""
    ra = []
    for khoa in ("flower_count", "bud_count", "damaged_count"):
        a, b = cu.get(khoa), moi.get(khoa)
        if a is None or b is None:
            continue
        if a != b:
            ra.append(f"{ma}.{khoa}: vòng một {a} — vòng hai {b} (lệch {abs(a - b)})")

    ten_cu = {(c.get("canonical_component"), c.get("category")) for c in cu.get("components") or []}
    ten_moi = {(c.get("canonical_component"), c.get("category")) for c in moi.get("components") or []}
    for t in sorted(ten_cu - ten_moi):
        ra.append(f"{ma}: vòng hai KHÔNG thấy cấu phần {t[0]} ({t[1]})")
    for t in sorted(ten_moi - ten_cu):
        ra.append(f"{ma}: vòng hai thấy THÊM cấu phần {t[0]} ({t[1]})")
    return ra


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("phieu", help="tệp JSON do phieu-dem.html tải về")
    ap.add_argument("--vong", type=int, choices=(1, 2), required=True)
    ap.add_argument("--that", action="store_true", help="ghi thật; bỏ cờ này thì chỉ soát và in ra")
    args = ap.parse_args()

    tep = Path(args.phieu)
    if not tep.is_absolute():
        tep = Path.cwd() / tep
    if not tep.exists():
        print(f"Không thấy tệp phiếu: {tep}", file=sys.stderr)
        return 2

    phieu = json.loads(tep.read_text(encoding="utf-8"))
    nguoi = (phieu.get("labeled_by") or "").strip()
    if not nguoi:
        print("Phiếu không ghi tên người đếm.", file=sys.stderr)
        return 2

    anh = [a for a in phieu.get("anh") or [] if a.get("flower_count") is not None]
    bo_trong = [a["image_id"] for a in phieu.get("anh") or [] if a.get("flower_count") is None]

    print(f"Phiếu của: {nguoi} · vòng {args.vong}")
    print(f"Ảnh đã đếm: {len(anh)} · bỏ trống: {len(bo_trong)}"
          + (f" ({', '.join(bo_trong)})" if bo_trong else ""))

    loi: list[str] = []
    for a in anh:
        loi += soat_mot_anh(a)
    if loi:
        print("\nLỖI CHẶN — không ghi gì cả:", file=sys.stderr)
        for l in loi:
            print("  · " + l, file=sys.stderr)
        return 1

    lech: list[str] = []
    so_anh_lech = 0
    if args.vong == 2:
        for a in anh:
            cu = doc_nhan_cu(a["image_id"])
            if not cu or cu.get("flower_count") is None:
                print(f"  ! {a['image_id']}: chưa có nhãn vòng một để đối chiếu")
                continue
            if cu.get("labeled_by") and cu["labeled_by"].strip().lower() == nguoi.lower():
                print(f"\nVÒNG HAI PHẢI LÀ NGƯỜI KHÁC. {a['image_id']} đã do '{nguoi}' đếm ở vòng một.",
                      file=sys.stderr)
                print("Hai người đếm độc lập là thứ làm bộ ảnh phát hiện được lỗi hệ thống —"
                      " cùng một người đếm hai lần chỉ lặp lại đúng cái nhìn đó.", file=sys.stderr)
                return 1
            d = doi_chieu(a["image_id"], cu, a)
            if d:
                so_anh_lech += 1
                lech += d

        if lech:
            print(f"\nLỆCH GIỮA HAI VÒNG — {so_anh_lech}/{len(anh)} ảnh:")
            for l in lech:
                print("  · " + l)
            ti_le = so_anh_lech / len(anh) * 100 if anh else 0
            print(f"\nTỉ lệ lệch: {ti_le:.0f}%")
            if ti_le > NGUONG_LECH_PHAN_TRAM:
                print(
                    f"Trên {NGUONG_LECH_PHAN_TRAM}% nghĩa là QUY ƯỚC ĐẾM chưa đủ rõ, không phải người đếm sai.\n"
                    "Sửa `golden/QUY_UOC_DEM.md` trước, rồi cả hai rà lại những ảnh chịu ảnh hưởng."
                )
            print("\nKhông ghi `verified_by` khi còn chỗ lệch. Chốt lại số đúng rồi chạy lại.")
            return 1

    if not args.that:
        print("\n(Mới soát, chưa ghi. Thêm cờ --that để ghi thật.)")
        return 0

    hom_nay = date.today().isoformat()
    NHAN.mkdir(parents=True, exist_ok=True)
    for a in anh:
        ma = a["image_id"]
        ban = doc_nhan_cu(ma)
        ban.update({
            "image_id": ma,
            "file": a.get("file") or ban.get("file"),
            "flower_count": a["flower_count"],
            "bud_count": a.get("bud_count"),
            "damaged_count": a.get("damaged_count"),
            "order_count": a.get("order_count"),
            "components": a.get("components") or [],
        })
        if a.get("ghi_chu"):
            ban["ghi_chu"] = a["ghi_chu"]
        if args.vong == 1:
            ban["labeled_by"] = nguoi
            ban["labeled_at"] = hom_nay
        else:
            ban["verified_by"] = nguoi
            ban["verified_at"] = hom_nay
        (NHAN / f"{ma}.json").write_text(
            json.dumps(ban, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )

    if MANIFEST.exists():
        with MANIFEST.open(encoding="utf-8-sig", newline="") as f:
            doc = csv.DictReader(f)
            cot = doc.fieldnames or []
            rows = list(doc)
        theo_ma = {a["image_id"]: a for a in anh}
        for r in rows:
            a = theo_ma.get(r["image_id"])
            if not a:
                continue
            for khoa in ("flower_count", "bud_count", "damaged_count", "order_count"):
                if khoa in cot and a.get(khoa) is not None:
                    r[khoa] = a[khoa]
            if args.vong == 1 and "labeled_by" in cot:
                r["labeled_by"] = nguoi
            if args.vong == 2 and "verified_by" in cot:
                r["verified_by"] = nguoi
        with MANIFEST.open("w", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, fieldnames=cot)
            w.writeheader()
            w.writerows(rows)

    print(f"\nĐã ghi {len(anh)} nhãn vào golden/labels/ và cập nhật manifest.csv")
    if args.vong == 1:
        print("Bước kế: một người KHÁC đếm độc lập cùng 10 ảnh, rồi chạy lại với --vong 2.")
    else:
        print("Bước kế: chấm ba bộ máy —")
        print("  python3 scripts/cham-bo-anh-vang.py --de-xuat golden/ai-proposals")
        print("  python3 scripts/cham-bo-anh-vang.py --de-xuat golden/ai-proposals-openai")
        print("  python3 scripts/cham-bo-anh-vang.py --de-xuat golden/ai-proposals-openai-direct")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
