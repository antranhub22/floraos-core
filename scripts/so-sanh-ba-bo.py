#!/usr/bin/env python3
"""Bảng so ba bộ máy trên cùng một tập ảnh.

KHÔNG phải bộ chấm điểm. Bộ chấm là `cham-bo-anh-vang.py`, và nó cần nhãn
người. Bảng này chỉ bày ba câu trả lời cạnh nhau để thấy chúng lệch nhau chỗ
nào — thấy được ba số khác nhau không cho biết số nào đúng.

    python3 scripts/so-sanh-ba-bo.py
    python3 scripts/so-sanh-ba-bo.py --loai      # kèm danh sách loài từng bộ
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
NHAN = GOC / "golden" / "labels"
BO = [("Cục bộ", "ai-proposals"), ("Đầy đủ", "ai-proposals-openai"), ("Gọn", "ai-proposals-openai-direct")]
MAC_DINH = ["g001", "g002", "g003", "g004", "g005", "g006", "g010", "g011"]


def doc(thu_muc: str, ma: str) -> dict | None:
    p = GOC / "golden" / thu_muc / f"{ma}.json"
    if not p.exists():
        return None
    try:
        d = json.loads(p.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None
    r = d.get("ai_raw")
    return r if isinstance(r, dict) else d


def nhan_nguoi(ma: str):
    p = NHAN / f"{ma}.json"
    if not p.exists():
        return None
    try:
        return json.loads(p.read_text(encoding="utf-8")).get("flower_count")
    except json.JSONDecodeError:
        return None


def loai_hoa(k: dict) -> list[str]:
    ra = []
    for h in (k.get("bom") or {}).get("flowers") or []:
        ten = h.get("name") or h.get("nhom_hoa") or h.get("ma") or "?"
        ra.append(f"{ten} ×{h.get('quantity')}")
    return ra


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--anh", default="")
    ap.add_argument("--loai", action="store_true", help="in kèm danh sách loài")
    args = ap.parse_args()
    ds = [m.strip() for m in args.anh.split(",") if m.strip()] or MAC_DINH

    print(f"{'ảnh':7}{'Cục bộ':>10}{'Đầy đủ':>10}{'Gọn':>10}{'Người':>10}{'chênh':>9}")
    print("-" * 56)
    co_nhan = 0
    for ma in ds:
        so = []
        for _, tm in BO:
            k = doc(tm, ma)
            so.append(None if k is None else k.get("flower_count"))
        ng = nhan_nguoi(ma)
        if ng is not None:
            co_nhan += 1
        thuc = [x for x in so if isinstance(x, int) and x > 0]
        chenh = f"{max(thuc) / min(thuc):.1f}×" if len(thuc) >= 2 and min(thuc) > 0 else "—"
        o = lambda x: "—" if x is None else str(x)
        print(f"{ma:7}{o(so[0]):>10}{o(so[1]):>10}{o(so[2]):>10}{o(ng):>10}{chenh:>9}")

    print()
    if co_nhan == 0:
        print("Cột Người trống ở mọi ảnh. Ba con số trên KHÔNG xếp hạng được bộ nào —")
        print("chúng chỉ cho thấy ba bộ đang bất đồng, không cho biết bộ nào đúng.")
        print("Đếm bằng golden/phieu-dem-1-tep.html rồi nạp bằng scripts/nap-phieu-dem.py.")
    else:
        print(f"Có nhãn người cho {co_nhan}/{len(ds)} ảnh. Chấm điểm thật:")
        for _, tm in BO:
            print(f"  python3 scripts/cham-bo-anh-vang.py --de-xuat golden/{tm}")

    if args.loai:
        for ma in ds:
            print(f"\n──── {ma} ────")
            for ten, tm in BO:
                k = doc(tm, ma)
                print(f"  {ten:8}: " + ("(chưa chạy)" if k is None else (", ".join(loai_hoa(k)) or "(không dòng hoa nào)")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
