#!/usr/bin/env python3
"""So sánh nhãn AI đề xuất vs nhãn người → golden/ai-accuracy-report.csv

Cách dùng:
    python3 scripts/so-sanh-ai-vs-nguoi.py                # tất cả 100 ảnh
    python3 scripts/so-sanh-ai-vs-nguoi.py --limit 5      # test 5 ảnh

Yêu cầu: golden/labels/gNNN.json đã có số (flower_count, bud_count,
damaged_count) và golden/ai-proposals/gNNN.json đã có.

Output: golden/ai-accuracy-report.csv gồm các cột:
    image_id, field, ai_value, human_value, match, diff_abs
"""

import csv
import json
import sys
from pathlib import Path

GOLDEN_DIR = Path(__file__).resolve().parent.parent / "golden"
LABELS_DIR = GOLDEN_DIR / "labels"
PROPOSALS_DIR = GOLDEN_DIR / "ai-proposals"
REPORT_PATH = GOLDEN_DIR / "ai-accuracy-report.csv"

COMPARE_FIELDS = ["flower_count", "bud_count", "damaged_count"]


def get_images(limit=None):
    labels = sorted(LABELS_DIR.iterdir())
    if limit:
        labels = labels[:limit]
    return labels


def _is_empty(v):
    return v is None or v == ""


def main():
    limit = None
    if "--limit" in sys.argv:
        idx = sys.argv.index("--limit")
        limit = int(sys.argv[idx + 1])

    images = get_images(limit)
    rows = []

    for label_path in images:
        image_id = label_path.stem
        proposal_path = PROPOSALS_DIR / f"{image_id}.json"

        if not proposal_path.exists():
            continue

        with open(label_path) as f:
            label = json.load(f)
        with open(proposal_path) as f:
            proposal = json.load(f)

        ai_raw = proposal.get("ai_raw", {})
        for field in COMPARE_FIELDS:
            ai_value = ai_raw.get(field)
            human_value = label.get(field)
            ai_present = not _is_empty(ai_value)
            human_present = not _is_empty(human_value)
            if ai_present and human_present:
                if ai_value == human_value:
                    match = "YES"
                    diff_abs = 0
                else:
                    match = "NO"
                    diff_abs = abs(ai_value - human_value)
            elif ai_present and not human_present:
                match = "AI_ONLY"
                diff_abs = ""
            elif human_present and not ai_present:
                match = "HUMAN_ONLY"
                diff_abs = ""
            else:
                match = "PENDING"
                diff_abs = ""
            rows.append({
                "image_id": image_id,
                "field": field,
                "ai_value": ai_value if ai_present else "",
                "human_value": human_value if human_present else "",
                "match": match,
                "diff_abs": diff_abs if diff_abs != "" else "",
            })

    total = len(rows)
    if total == 0:
        print("Chưa có dữ liệu để so sánh (cần cả nhãn người và AI proposal)")
        return

    with open(REPORT_PATH, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["image_id", "field", "ai_value", "human_value", "match", "diff_abs"])
        writer.writeheader()
        for r in rows:
            writer.writerow(r)

    matches = sum(1 for r in rows if r["match"] == "YES")
    mismatches = sum(1 for r in rows if r["match"] == "NO")
    ai_only = sum(1 for r in rows if r["match"] == "AI_ONLY")
    human_only = sum(1 for r in rows if r["match"] == "HUMAN_ONLY")
    pending = sum(1 for r in rows if r["match"] == "PENDING")
    print(f"{matches}/{total} trùng, {mismatches} sai, {ai_only} AI_chưa_người, {human_only} Người_chưa_AI, {pending} chờ")
    for field in COMPARE_FIELDS:
        field_rows = [r for r in rows if r["field"] == field]
        f_yes = sum(1 for r in field_rows if r["match"] == "YES")
        f_no = sum(1 for r in field_rows if r["match"] == "NO")
        f_ai_only = sum(1 for r in field_rows if r["match"] == "AI_ONLY")
        f_human_only = sum(1 for r in field_rows if r["match"] == "HUMAN_ONLY")
        f_total = len(field_rows)
        if f_total > 0:
            print(f"  {field}: {f_yes}/{f_total} trùng, {f_no} sai, {f_ai_only} AI_only, {f_human_only} Người_only")
        else:
            print(f"  {field}: chưa có dữ liệu")
    print(f"Báo cáo: {REPORT_PATH}")


if __name__ == "__main__":
    main()
