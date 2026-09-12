#!/usr/bin/env python3
"""Chạy OpenAI Structured trên 4 ảnh vàng đã gán nhãn.

Cách dùng:
    cd workers && .venv-local-cv/bin/python ../scripts/chay-openai-golden.py

Kết quả lưu golden/ai-proposals-openai/gNNN.json
"""

import json
import os
import sys
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent
WORKERS_DIR = PROJECT_DIR / "workers"
sys.path.insert(0, str(WORKERS_DIR))

# Load .env
env_file = PROJECT_DIR / ".env"
if env_file.exists():
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if line and "=" in line and not line.startswith("#"):
            key, _, val = line.partition("=")
            key = key.strip()
            val = val.strip().strip('"')
            if key and val:
                os.environ.setdefault(key, val)

from vision.providers.openai_structured import OpenAIStructuredProvider
from vision.providers.base import VisionAnalyzer

GOLDEN_DIR = PROJECT_DIR / "golden"
IMAGES_DIR = GOLDEN_DIR / "images"
OUTPUT_DIR = GOLDEN_DIR / "ai-proposals-openai"
IMAGES = ["g001", "g002", "g010", "g011"]

os.makedirs(OUTPUT_DIR, exist_ok=True)


def main():
    provider = OpenAIStructuredProvider()
    print(f"Model: {provider.model_version}")
    print()

    for name in IMAGES:
        image_path = IMAGES_DIR / f"{name}.jpeg"
        if not image_path.exists():
            print(f"[{name}] KHÔNG TÌM THẤY ảnh")
            continue

        output_path = OUTPUT_DIR / f"{name}.json"
        if output_path.exists():
            print(f"[{name}] Đã có → bỏ qua")
            continue

        print(f"[{name}] Đang chạy...", flush=True)
        try:
            image_bytes = image_path.read_bytes()
            result = provider.analyze(image_bytes, {})
            with open(output_path, "w") as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
            fc = result.get("flower_count") or (result.get("bom") or {}).get("flowers")
            conf = result.get("confidence")
            print(f"  OK → confidence={conf}, flower_count={fc}")
        except Exception as e:
            print(f"  LỖI: {e}")


if __name__ == "__main__":
    main()
