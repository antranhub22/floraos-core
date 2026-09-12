#!/usr/bin/env python3
"""Ma trận chọn công nghệ — local_cv vs người trên bộ ảnh vàng.

Đọc golden/ai-proposals/ (local_cv) và golden/labels/ (người),
tính các chỉ số theo BO_ANH_VANG.md mục 9.

Cách dùng:
    python3 scripts/ma-tran-chon-cong-nghe.py
"""

import json
import sys
from pathlib import Path

GOLDEN_DIR = Path(__file__).resolve().parent.parent / "golden"
PROPOSALS_DIR = GOLDEN_DIR / "ai-proposals"
LABELS_DIR = GOLDEN_DIR / "labels"

FIELDS = ["flower_count", "bud_count", "damaged_count"]


def main():
    proposal_files = sorted(PROPOSALS_DIR.glob("*.json"))
    print("=" * 80)
    print("MA TRẬN CHỌN CÔNG NGHỆ — local_cv vs NHÂNG (bộ ảnh vàng)")
    print("=" * 80)
    print()

    for pf in proposal_files:
        image_id = pf.stem
        label_path = LABELS_DIR / f"{image_id}.json"

        with open(pf) as f:
            proposal = json.load(f)

        if not label_path.exists():
            print(f"[{image_id}] KHÔNG CÓ NHÃN NGƯỜI")
            continue

        with open(label_path) as f:
            label = json.load(f)

        ai_raw = proposal.get("ai_raw", {})

        print(f"[{image_id}] {label.get('file', '?')}")
        print(f"  difficulty: {label.get('difficulty', '?')} | occluded: {label.get('occluded', '?')}")

        for field in FIELDS:
            ai_val = ai_raw.get(field)
            human_val = label.get(field)
            if ai_val is not None and human_val is not None:
                match = "✅" if ai_val == human_val else f"❌ sai {abs(ai_val - human_val)}"
                print(f"  {field}: AI={ai_val}, Người={human_val} {match}")
            elif ai_val is not None:
                print(f"  {field}: AI={ai_val}, Người=chưa đếm")
            elif human_val is not None:
                print(f"  {field}: AI=không phát hiện, Người={human_val}")
            else:
                print(f"  {field}: AI=không phát hiện, Người=chưa đếm")

        # Components comparison (simplified)
        ai_bom = ai_raw.get("bom", {})
        ai_flowers = ai_bom.get("flowers", []) if ai_bom else []
        human_components = label.get("components", [])

        ai_flower_names = set()
        for item in ai_flowers:
            name = item.get("name") or item.get("canonical_component") or "unknown"
            ai_flower_names.add(name)

        human_flower_names = set()
        for comp in human_components:
            if comp.get("category") in ("flower", "bud"):
                name = comp.get("canonical_component") or "unknown"
                human_flower_names.add(name)

        overlap = ai_flower_names & human_flower_names
        ai_only = ai_flower_names - human_flower_names
        human_only = human_flower_names - ai_flower_names

        if ai_flower_names or human_flower_names:
            print(f"  Cấu phần (loại hoa): AI={len(ai_flower_names)}, Người={len(human_flower_names)}")
            if overlap:
                print(f"    Trùng: {sorted(overlap)}")
            if ai_only:
                print(f"    AI có, Người thiếu: {sorted(ai_only)}")
            if human_only:
                print(f"    Người có, AI thiếu: {sorted(human_only)}")

        print()

    print("=" * 80)
    print("GHI CHÚ:")
    print("- local_cv chỉ có 6 ảnh (g001-g006), 8 ảnh còn lại chưa có AI proposal")
    print("- openai_structured và openai_direct CHƯA có dữ liệu")
    print("- flower_count: AI đếm theo loại/cụm (5-10), Người ước tính theo cành (33-75)")
    print("  → khác biệt phương pháp, không so sánh trực tiếp được")
    print("- bud_count, damaged_count: AI phát hiện hạn chế (chỉ g001)")
    print("=" * 80)


if __name__ == "__main__":
    main()
