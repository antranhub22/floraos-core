#!/usr/bin/env python3
"""So sánh tất cả engine trên 4 ảnh đã gán nhãn.

Đọc local_cv (ai-proposals/), openai_structured (ai-proposals-openai/),
và nhãn người (labels/), so sánh flower_count, species, confidence.
"""

import json
from pathlib import Path

GOLDEN_DIR = Path(__file__).resolve().parent.parent / "golden"
LOCAL_DIR = GOLDEN_DIR / "ai-proposals"
OPENAI_DIR = GOLDEN_DIR / "ai-proposals-openai"
LABELS_DIR = GOLDEN_DIR / "labels"
IMAGES = ["g001", "g002", "g010", "g011"]


def load_json(p):
    if p.exists():
        with open(p) as f:
            return json.load(f)
    return None


def species_names(proposal):
    """Lấy tên loài và số lượng từ proposal."""
    result = {}
    if proposal is None:
        return result
    bom = proposal.get("bom", {})
    for key in ("flowers", "foliage", "accessories", "wrapping"):
        items = bom.get(key, []) or []
        for item in items:
            name = item.get("name") or item.get("canonical_component") or "unknown"
            qty = item.get("quantity") or item.get("count")
            conf = item.get("confidence")
            if name and qty is not None:
                result[name] = {"qty": qty, "conf": conf}
    return result


def get_field(proposal, field):
    """Đọc trường từ proposal (local_cv → ai_raw, openai → top level)."""
    if proposal is None:
        return None
    val = proposal.get(field)
    if val is not None:
        return val
    ai_raw = proposal.get("ai_raw", {})
    return ai_raw.get(field)


def main():
    print("=" * 120)
    print("SO SÁNH TẤT CẢ ENGINE — 4 ảnh đã gán nhãn")
    print("=" * 120)
    print()

    for img in IMAGES:
        label = load_json(LABELS_DIR / f"{img}.json")
        local = load_json(LOCAL_DIR / f"{img}.json")
        openai = load_json(OPENAI_DIR / f"{img}.json")

        print(f"--- {img} ---")
        print(f"  {'Metric':<30} {'local_cv':>12} {'openai':>12} {'Người':>12}")
        print(f"  {'-'*30} {'-'*12} {'-'*12}")

        local_fc = get_field(local, "flower_count")
        openai_fc = get_field(openai, "flower_count")
        local_conf = get_field(local, "confidence")
        openai_conf = get_field(openai, "confidence")
        human_fc = label.get("flower_count") if label else None

        print(f"  {'flower_count':<30} {str(local_fc):>12} {str(openai_fc):>12} {str(human_fc):>12}")
        print(f"  {'confidence':<30} {str(local_conf):>12} {str(openai_conf):>12} {'N/A':>12}")
        print(f"  {'bud_count':<30} {str(get_field(local,'bud_count')):>12} {str(get_field(openai,'bud_count')):>12} {str(label.get('bud_count') if label else None):>12}")
        print(f"  {'damaged_count':<30} {str(get_field(local,'damaged_count')):>12} {str(get_field(openai,'damaged_count')):>12} {str(label.get('damaged_count') if label else None):>12}")

        # Species comparison
        local_species = species_names(local)
        openai_species = species_names(openai)
        human_components = [c for c in label.get("components", []) if c.get("category") in ("flower", "bud")]
        human_species = {c.get("canonical_component", ""): c for c in human_components}

        print()
        print(f"  {'Species':<35} {'local_cv':>12} {'openai':>12} {'Người':>12}")
        print(f"  {'-'*35} {'-'*12} {'-'*12} {'-'*12}")

        all_species = set(list(local_species.keys()) + list(openai_species.keys()) + list(human_species.keys()))
        for sp in sorted(all_species):
            lv = local_species.get(sp, {})
            ov = openai_species.get(sp, {})
            hv = human_species.get(sp, {})
            local_qty = f"qty={lv.get('qty')}, c={lv.get('conf')}" if lv else "—"
            openai_qty = f"qty={ov.get('qty')}, c={ov.get('conf')}" if ov else "—"
            human_qty = f"qty={hv.get('count')}, c={hv.get('color')}" if hv else "—"
            print(f"  {sp:<35} {local_qty:>12} {openai_qty:>12} {human_qty:>12}")

        local_names = set(local_species.keys())
        openai_names = set(openai_species.keys())
        human_names = set(human_species.keys())

        print()
        print(f"  Khớp loài: local_cv∩Người={len(local_names & human_names)}, openai∩Người={len(openai_names & human_names)}, local_cv∩openai={len(local_names & openai_names)}")
        if local_names & human_names:
            print(f"    local_cv ∩ Người: {local_names & human_names}")
        if openai_names & human_names:
            print(f"    openai ∩ Người: {openai_names & human_names}")
        if local_names & openai_names:
            print(f"    local_cv ∩ openai: {local_names & openai_names}")
        print()

    print("=" * 120)
    print("TỔNG KẾT")
    print("=" * 120)
    print()
    print("1. local_cv (SAM2+Florence-2): confidence=55, flower_count=5-10")
    print("2. openai_structured (gpt-4o): confidence=85-90, flower_count=25-80")
    print("3. Người gán nhãn: ước tính (chấp nhận), 2-5 loài, chưa đếm chính xác")
    print()
    print("flower_count so sánh (local_cv vs openai vs người):")
    for img in IMAGES:
        local = load_json(LOCAL_DIR / f"{img}.json")
        openai = load_json(OPENAI_DIR / f"{img}.json")
        label = load_json(LABELS_DIR / f"{img}.json")
        lv = get_field(local, "flower_count")
        ov = get_field(openai, "flower_count")
        hv = label.get("flower_count") if label else None
        print(f"  {img}: local_cv={lv}, openai={ov}, người={hv}")

    print()
    print("CẦN TIẾP THEO:")
    print("  1. Người đếm chính xác 3-5 ảnh (không ước tính)")
    print("  2. Chạy openai_direct → so sánh 2 engine OpenAI")
    print("  3. Component-level accuracy (cấu phần chi tiết)")


if __name__ == "__main__":
    main()
