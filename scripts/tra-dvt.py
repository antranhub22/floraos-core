#!/usr/bin/env python3
"""Tra ĐVT chuẩn từ Excel cho các loài trong AI proposals.

Đọc danh mục loài từ 01_NHAP-LIEU.xlsx, tra ĐVT chuẩn (Bông/Cành)
cho từng loài Florence-2 nhận diện trong golden/ai-proposals/.

Cách dùng:
    python3 scripts/tra-dvt.py                # tất cả proposals
    python3 scripts/tra-dvt.py --limit 5      # test 5 proposals
    python3 scripts/tra-dvt.py --image g001   # 1 ảnh
"""

import argparse
import json
import sys
from pathlib import Path

import openpyxl

GOLDEN_DIR = Path(__file__).resolve().parent.parent / "golden"
PROPOSALS_DIR = GOLDEN_DIR / "ai-proposals"
LABELS_DIR = GOLDEN_DIR / "labels"
EXCEL_PATH = Path("/Users/tuan/Projects/FloraOS/FloraOS Vận hành/01_NHAP-LIEU.xlsx")


def load_species_catalog():
    """Đọc danh mục loài từ Excel, trả về {tên_chuẩn: ĐVT_chuẩn}."""
    if not EXCEL_PATH.exists():
        print(f"KHÔNG TÌM THẤY Excel: {EXCEL_PATH}")
        return {}

    wb = openpyxl.load_workbook(EXCEL_PATH, read_only=True, data_only=True)
    ws = wb["02 Danh mục loại"]

    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        return {}

    header = rows[0]
    data = rows[1:]

    ma_idx = header.index("Mã loại")
    ten_idx = header.index("Tên chuẩn")
    dtvt_idx = header.index("ĐVT chuẩn")
    cong_nang_idx = header.index("Công năng")
    nhom_idx = header.index("Nhóm")
    dac_diem_idx = header.index("Đặc điểm phân biệt")
    ten_khac_idx = header.index("Tên gọi khác")

    catalog = {}
    for row in data:
        ten = row[ten_idx]
        dtvt = row[dtvt_idx]
        cong_nang = row[cong_nang_idx]
        nhom = row[nhom_idx]
        dac_diem = row[dac_diem_idx]
        ten_khac = row[ten_khac_idx]
        if ten:
            ten_khac_list = []
            if ten_khac:
                ten_khac_str = str(ten_khac)
                if ";" in ten_khac_str:
                    ten_khac_list = [t.strip() for t in ten_khac_str.split(";")]
                else:
                    ten_khac_list = [ten_khac_str]
            catalog[str(ten).strip()] = {
                "dvt": dtvt,
                "cong_nang": cong_nang,
                "nhom": nhom,
                "dac_diem": dac_diem,
                "ten_khac": ten_khac_list,
            }
    wb.close()
    return catalog


def load_proposals(limit=None):
    """Đọc tất cả AI proposals."""
    proposals = []
    for f in sorted(PROPOSALS_DIR.glob("*.json")):
        if limit and len(proposals) >= limit:
            break
        with open(f) as fh:
            proposals.append(json.load(fh))
    return proposals


def match_species(flower_name, catalog, json_catalog=None):
    """Tìm loài trong catalog khớp với tên AI nhận diện."""
    flower_name_lower = str(flower_name).strip().lower()
    matches = []

    for ten_chuan, info in catalog.items():
        ten_chuan_lower = str(ten_chuan).lower()
        ten_khac = info.get("ten_khac", []) if isinstance(info, dict) else []
        ten_khac_lower = [str(t).strip().lower() for t in ten_khac] if ten_khac else []

        if flower_name_lower == ten_chuan_lower:
            matches.append((ten_chuan, info, "exact"))
        elif flower_name_lower in ten_chuan_lower or ten_chuan_lower in flower_name_lower:
            matches.append((ten_chuan, info, "partial"))
        else:
            for tk in ten_khac_lower:
                if flower_name_lower == tk or flower_name_lower in tk or tk in flower_name_lower:
                    matches.append((ten_chuan, info, "alias"))
                    break

    if json_catalog:
        for entry in json_catalog.get("loai", []):
            ten_chuan = entry.get("ten_chuan")
            ten_khac = entry.get("ten_khac", [])
            dvt = entry.get("dvt_chuan")
            dac_diem = entry.get("dac_diem_phan_biet")
            if ten_chuan and dvt:
                ten_chuan_lower = str(ten_chuan).lower()
                if flower_name_lower == ten_chuan_lower:
                    already = any(m[0] == ten_chuan for m in matches)
                    if not already:
                        matches.append((ten_chuan, {"dvt": dvt, "dac_diem": dac_diem, "ten_khac": ten_khac}, "json_exact"))
                else:
                    for tk in ten_khac if isinstance(ten_khac, list) else []:
                        tk_lower = str(tk).strip().lower()
                        if flower_name_lower == tk_lower or flower_name_lower in tk_lower or tk_lower in flower_name_lower:
                            already = any(m[0] == ten_chuan for m in matches)
                            if not already:
                                matches.append((ten_chuan, {"dvt": dvt, "dac_diem": dac_diem, "ten_khac": ten_khac}, "json_alias"))
                            break

    return matches


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--image", type=str, default=None)
    args = parser.parse_args()

    catalog = load_species_catalog()
    print(f"Danh mục loài: {len(catalog)} loài")
    print(f"  Bông: {sum(1 for i in catalog.values() if i['dvt'] == 'Bông')}")
    print(f"  Cành: {sum(1 for i in catalog.values() if i['dvt'] == 'Cành')}")
    print(f"  Khác: {sum(1 for i in catalog.values() if i['dvt'] not in ('Bông', 'Cành'))}")
    print()

    proposals = load_proposals(args.limit)
    if args.image:
        proposals = [p for p in proposals if p.get("image_id") == args.image]

    for proposal in proposals:
        image_id = proposal.get("image_id", "?")
        ai_raw = proposal.get("ai_raw", {})
        bom = ai_raw.get("bom", {})
        flowers = bom.get("flowers", []) if bom else []

        print(f"{'='*60}")
        print(f"[{image_id}] {proposal.get('file', '?')}")
        print(f"  flower_count AI: {ai_raw.get('flower_count')}")
        print(f"  Số hoa AI phát hiện: {len(flowers)}")
        print()

        # Group flowers by name
        name_count = {}
        for f in flowers:
            name = f.get("name") or "unknown"
            name_count[name] = name_count.get(name, 0) + 1

        print(f"  {'Tên AI':<30} {'Số':>5} {'ĐVT':>8} {'Loại':>6} {'Trạng thái':>15}")
        print(f"  {'-'*30} {'-'*5} {'-'*8} {'-'*6} {'-'*15}")

        for name, count in sorted(name_count.items()):
            matches = match_species(name, catalog)
            if not matches:
                print(f"  {name:<30} {count:>5} {'?':>8} {'?':>6} {'CHƯA CÓ TRONG DANH MỤC':>15}")
            else:
                best = matches[0]
                ten_chuan, info, loai = best
                dvt = info["dvt"]
                status = "✅ khớp" if loai == "exact" else "🔍 gần đúng" if loai == "partial" else "??"
                print(f"  {name:<30} {count:>5} {dvt:>8} {loai:>6} {status:>15}")
                if loai != "exact":
                    # Show all matches
                    for ten_chuan, _, loai2 in matches[1:]:
                        print(f"    → '{ten_chuan}' ({loai2})")

        # Check labeled fields
        label_path = LABELS_DIR / f"{image_id}.json"
        if label_path.exists():
            with open(label_path) as fh:
                label = json.load(fh)
            print()
            print(f"  Nhãn người: flower_count={label.get('flower_count')}, bud_count={label.get('bud_count')}, damaged_count={label.get('damaged_count')}")
            labeled_count = label.get("flower_count")
            if labeled_count is not None:
                print(f"  → Người đếm: {labeled_count}")
                # Check if consistent with ĐVT
                print(f"  (Kiểm tra: người đếm theo đơn vị nào?)")

        print()

    print("=" * 60)
    print("LƯU Ý:")
    print("- ĐVT chuẩn Bông = đếm mỗi bông hoa là 1")
    print("- ĐVT chuẩn Cành = đếm mỗi cành hoa là 1 (một cành nhiều bông vẫn tính 1)")
    print("- AI Florence-2 nhận diện theo loại hoa, cần chuyển sang ĐVT chuẩn theo danh mục")
    print("- Ảnh vàng người đếm theo cành (QUY_UOC_DEM.md) → so sánh với AI cần đổi đơn vị")


if __name__ == "__main__":
    main()
