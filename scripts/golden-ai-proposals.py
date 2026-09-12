#!/usr/bin/env python3
"""
Gán nhãn AI đề xuất cho bộ ảnh vàng — Phase 1.

Chạy local_cv (SAM2 + Florence-2) trên các ảnh golden/images/,
lưu kết quả đề xuất vào golden/ai-proposals/gNNN.json.

Cách dùng:
    cd workers && python3 ../scripts/golden-ai-proposals.py              # cả 100 ảnh
    cd workers && python3 ../scripts/golden-ai-proposals.py --limit 5    # test 5 ảnh

LƯU Ý: Kết quả CHỈ là đề xuất. Người gán nhãn PHẢI đánh giá
độc lập (không xem file này khi chấm).
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

WORKERS_DIR = Path(__file__).resolve().parent.parent / "workers"
sys.path.insert(0, str(WORKERS_DIR))

GOLDEN_DIR = WORKERS_DIR.parent / "golden"
IMAGES_DIR = GOLDEN_DIR / "images"
PROPOSALS_DIR = GOLDEN_DIR / "ai-proposals"
CONFIG_PATH = WORKERS_DIR / "vision" / "contracts" / "config.json"

from vision.providers.registry import lay_provider  # noqa: E402


def load_config():
    with open(CONFIG_PATH) as f:
        return json.load(f)


def get_images(limit=None):
    images = sorted(IMAGES_DIR.iterdir())
    if limit:
        images = images[:limit]
    return images


def _now():
    return datetime.now(timezone.utc).isoformat()


def main():
    limit = None
    if "--limit" in sys.argv:
        idx = sys.argv.index("--limit")
        limit = int(sys.argv[idx + 1])

    cfg = load_config()
    images = get_images(limit)
    PROPOSALS_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Phân tích {len(images)} ảnh (limit={limit})")
    print(f"Checkpoint SAM2: {cfg.get('sam2_checkpoint', 'CHƯA CÓ')}")
    print(f"Model Florence-2: {cfg.get('florence2_model_id', 'CHƯA CÓ')}")

    # Dựng provider (nạp trọng số SAM2 + Florence-2) — có thể mất vài phút
    print("Đang dựng bộ máy local_cv ...")
    try:
        provider = lay_provider("local_cv")
        print("Bộ máy sẵn sàng.")
    except NotImplementedError as e:
        print(f"KHÔNG THỂ DỰNG BỘ MÁY: {e}")
        print("Kiểm tra workers/requirements-local-cv.txt và hướng dẫn trong comments.")
        sys.exit(1)

    for i, img_path in enumerate(images, 1):
        print(f"[{i}/{len(images)}] {img_path.name} ...", end=" ", flush=True)
        try:
            image_bytes = img_path.read_bytes()
            result = provider.analyze(image_bytes, {
                "asset_id": img_path.stem,
                "product_id": None,
                "organization_id": None,
            })
            proposal = {
                "image_id": img_path.stem,
                "file": img_path.name,
                "source": str(img_path.parent.relative_to(GOLDEN_DIR.parent)),
                "ai_raw": result,
                "proposed_by": "local_cv",
                "proposed_at": _now(),
                "note": "Đề xuất AI — người gán nhãn PHẢI đánh giá độc lập",
            }
            out_path = PROPOSALS_DIR / f"{img_path.stem}.json"
            with open(out_path, "w") as f:
                json.dump(proposal, f, ensure_ascii=False, indent=2, default=str)
            print("OK")
        except Exception as e:
            print(f"LỖI: {e}")
            out_path = PROPOSALS_DIR / f"{img_path.stem}.json"
            with open(out_path, "w") as f:
                json.dump({
                    "image_id": img_path.stem,
                    "file": img_path.name,
                    "error": str(e),
                    "proposed_by": "local_cv",
                    "proposed_at": _now(),
                }, f, ensure_ascii=False, indent=2)

    print(f"\nHoàn thành. Kết quả trong {PROPOSALS_DIR}/")


if __name__ == "__main__":
    main()
