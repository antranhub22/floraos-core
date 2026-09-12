#!/usr/bin/env python3
"""Ma trận chi tiết chọn công nghệ — local_cv vs người.

Đọc golden/labels/ (người) + golden/ai-proposals/ (local_cv)
+ 01_NHAP-LIEU.xlsx (ĐVT chuẩn), tính chỉ số theo BO_ANH_VANG.md mục 9.

Cách dùng:
    python3 scripts/ma-tran-chi-tiet.py
"""

import json
import sys
from pathlib import Path

import openpyxl

GOLDEN_DIR = Path(__file__).resolve().parent.parent / "golden"
PROPOSALS_DIR = GOLDEN_DIR / "ai-proposals"
LABELS_DIR = GOLDEN_DIR / "labels"
EXCEL_PATH = Path("/Users/tuan/Projects/FloraOS/FloraOS Vận hành/01_NHAP-LIEU.xlsx")

FIELDS = ["flower_count", "bud_count", "damaged_count"]


def load_dvt_catalog():
    """Đọc ĐVT chuẩn cho từng loài từ Excel."""
    if not EXCEL_PATH.exists():
        return {}
    wb = openpyxl.load_workbook(EXCEL_PATH, read_only=True, data_only=True)
    ws = wb["02 Danh mục loại"]
    rows = list(ws.iter_rows(values_only=True))
    header = rows[0]
    data = rows[1:]

    ma_idx = header.index("Mã loại")
    ten_idx = header.index("Tên chuẩn")
    dtvt_idx = header.index("ĐVT chuẩn")
    cn_idx = header.index("Công năng")
    nhom_idx = header.index("Nhóm")
    dd_idx = header.index("Đặc điểm phân biệt")
    tk_idx = header.index("Tên gọi khác")

    catalog = {}
    for row in data:
        ten = row[ten_idx]
        dtvt = row[dtvt_idx]
        if ten and dtvt in ("Bông", "Cành"):
            ten_khac = row[tk_idx]
            tk_list = []
            if ten_khac:
                tk_str = str(ten_khac)
                if ";" in tk_str:
                    tk_list = [t.strip() for t in tk_str.split(";")]
                else:
                    tk_list = [tk_str]
            catalog[str(ten).strip().lower()] = {
                "dvt": dtvt,
                "ten_chuan": str(ten),
                "ten_khac": tk_list,
                "cong_nang": row[cn_idx],
                "nhom": row[nhom_idx],
                "dac_diem": row[dd_idx],
            }
    wb.close()
    return catalog


def find_dvt(name, catalog):
    """Tra ĐVT cho tên loài."""
    if not name:
        return None
    name_lower = str(name).strip().lower()
    # Exact match on ten_chuan
    if name_lower in catalog:
        return catalog[name_lower]["dvt"]
    # Match on ten_khac
    for code, info in catalog.items():
        for tk in info.get("ten_khac", []):
            if name_lower == tk.lower() or name_lower in tk.lower() or tk.lower() in name_lower:
                return info["dvt"]
    return None


def analyze_proposal(proposal, catalog):
    """Phân tích 1 proposal với ĐVT normalization."""
    ai_raw = proposal.get("ai_raw", {})
    bom = ai_raw.get("bom", {})
    flowers = bom.get("flowers", []) if bom else []

    # Group by name
    name_groups = {}
    for f in flowers:
        raw_name = f.get("name") or "Chưa xác định được tên giống"
        normalized = raw_name.replace(" ", "").lower()
        if normalized not in name_groups:
            name_groups[normalized] = {"raw_name": raw_name, "count": 0, "color": f.get("color")}
        name_groups[normalized]["count"] += 1

    # Add ĐVT
    for key, group in name_groups.items():
        group["dvt"] = find_dvt(group["raw_name"], catalog)
        group["matched"] = group["dvt"] is not None

    return {
        "image_id": proposal.get("image_id"),
        "file": proposal.get("file"),
        "flower_count_ai": ai_raw.get("flower_count"),
        "bud_count_ai": ai_raw.get("bud_count"),
        "damaged_count_ai": ai_raw.get("damaged_count"),
        "confidence": ai_raw.get("confidence"),
        "flower_groups": name_groups,
    }


def main():
    catalog = load_dvt_catalog()
    print(f"Danh mục ĐVT: {len(catalog)} loài")
    print(f"  Bông: {sum(1 for i in catalog.values() if i['dvt']=='Bông')}")
    print(f"  Cành: {sum(1 for i in catalog.values() if i['dvt']=='Cành')}")
    print()

    proposals = sorted(PROPOSALS_DIR.glob("*.json"))

    # Summary table
    print("=" * 100)
    print("MA TRẬN CHI TIẾT — local_cv")
    print("=" * 100)
    print()
    print(f"{'Ảnh':<8} {'AI_flower':>10} {'AI_bud':>8} {'AI_dmg':>7} {'Conf':>6} {'Loài_khớp':>11} {'Loài_không':>11} {'ĐVT_Bông':>9} {'ĐVT_Cành':>9}")
    print(f"{'-'*8} {'-'*10} {'-'*8} {'-'*7} {'-'*6} {'-'*11} {'-'*11} {'-'*9} {'-'*9}")

    total_ai_flowers = 0
    total_matched = 0
    total_unmatched = 0
    total_dtvt_bong = 0
    total_dtvt_cahn = 0

    for pf in proposals:
        with open(pf) as f:
            proposal = json.load(f)
        analysis = analyze_proposal(proposal, catalog)

        image_id = analysis["image_id"]
        ai_fc = analysis["flower_count_ai"] or 0
        ai_bud = analysis["bud_count_ai"]
        ai_dmg = analysis["damaged_count_ai"]
        conf = analysis["confidence"]

        matched = sum(1 for g in analysis["flower_groups"].values() if g["matched"])
        unmatched = sum(1 for g in analysis["flower_groups"].values() if not g["matched"])
        dtvt_bong = sum(g["count"] for g in analysis["flower_groups"].values() if g["dvt"] == "Bông")
        dtvt_cahn = sum(g["count"] for g in analysis["flower_groups"].values() if g["dvt"] == "Cành")

        print(f"{image_id:<8} {ai_fc:>10} {ai_bud if ai_bud is not None else 'N/A':>8} {ai_dmg if ai_dmg is not None else 'N/A':>7} {conf or 'N/A':>6} {matched:>11} {unmatched:>11} {dtvt_bong:>9} {dtvt_cahn:>9}")

        total_ai_flowers += ai_fc
        total_matched += matched
        total_unmatched += unmatched
        if dtvt_bong > 0:
            total_dtvt_bong += 1
        if dtvt_cahn > 0:
            total_dtvt_cahn += 1

    print(f"{'-'*8} {'-'*10} {'-'*8} {'-'*7} {'-'*6} {'-'*11} {'-'*11} {'-'*9} {'-'*9}")
    print(f"{'TỔNG':<8} {total_ai_flowers:>10} {'':>8} {'':>7} {'':>6} {total_matched:>11} {total_unmatched:>11} {'':>9} {'':>9}")

    print()
    print("=" * 100)
    print("PHÂN TÍCH CHI TIẾT TỪNG ẢNH")
    print("=" * 100)

    for pf in proposals:
        with open(pf) as f:
            proposal = json.load(f)
        analysis = analyze_proposal(proposal, catalog)

        image_id = analysis["image_id"]
        label_path = LABELS_DIR / f"{image_id}.json"

        print(f"\n--- {image_id} ---")
        print(f"  AI flower_count: {analysis['flower_count_ai']}")
        print(f"  AI confidence: {analysis['confidence']}")

        if analysis["flower_groups"]:
            print(f"  {'Loài AI':<35} {'Số':>5} {'ĐVT':>8} {'Khớp':>6}")
            print(f"  {'-'*35} {'-'*5} {'-'*8} {'-'*6}")
            for key, group in sorted(analysis["flower_groups"].items()):
                dvt_str = group["dvt"] if group["dvt"] else "?"
                match_str = "✅" if group["matched"] else "❌"
                print(f"  {group['raw_name']:<35} {group['count']:>5} {dvt_str:>8} {match_str:>6}")

        if label_path.exists():
            with open(label_path) as f:
                label = json.load(f)
            print(f"  Nhãn người:")
            print(f"    flower_count: {label.get('flower_count', 'null')}")
            print(f"    bud_count: {label.get('bud_count', 'null')}")
            print(f"    damaged_count: {label.get('damaged_count', 'null')}")
            comps = label.get("components", [])
            if comps:
                flower_comps = [c for c in comps if c["category"] in ("flower", "bud")]
                print(f"    Components ({len(flower_comps)} loài):")
                for c in flower_comps:
                    dvt = find_dvt(c.get("canonical_component", ""), catalog)
                    dvt_str = dvt if dvt else "?"
                    count_str = str(c.get("count")) if c.get("count") is not None else "null"
                    print(f"      {c['canonical_component']:<30} {count_str:>6} {dvt_str:>8} {c['color'] or '?'}")

    print()
    print("=" * 100)
    print("CÁC CHỈ SỐ THEO BO_ANH_VANG.md MỤC 9")
    print("=" * 100)
    print()
    print("1. Tỉ lệ đếm đúng tuyệt đối: KHÔNG TÍNH ĐƯỢC")
    print("   → flower_count người = ước tính, AI = theo loại/cụm, khác đơn vị")
    print()
    print("2. Sai số tuyệt đối trung bình: KHÔNG TÍNH ĐƯỢC")
    print("   → cần người đếm chính xác (không ước tính)")
    print()
    print("3. Độ khớp cấu phần (loài hoa):")
    print(f"   → {total_matched}/{total_matched+total_unmatched} loài AI khớp danh mục ({total_matched/(total_matched+total_unmatched)*100:.1f}%)")
    print()
    print("4. Độ khớp màu: CẦN NGƯỜI ĐÁNH GIÁ")
    print()
    print("5. Chi phí và thời gian:")
    print("   → local_cv: không gửi ảnh, chạy trên máy tổ chức")
    print("   → openai_structured: gửi ảnh + bảng màu, 2 lượt, chậm nhất")
    print("   → openai_direct: gửi ảnh + lược đồ, 1 lượt, nhanh nhất")
    print()
    print("=" * 100)
    print("KHUYẾN NGHỊ")
    print("=" * 100)
    print("1. Cải thiện nhận diện loài Florence-2 (nợ #56/#24)")
    print("2. Chạy openai_structured + openai_direct trên ảnh vàng")
    print("3. Người đếm chính xác 3-5 ảnh (không ước tính) → đo Tỉ lệ/Sai số")
    print("4. Chốt phương pháp đếm: cành hay bông theo ĐVT chuẩn")


if __name__ == "__main__":
    main()
