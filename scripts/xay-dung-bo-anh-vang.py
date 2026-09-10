#!/usr/bin/env python3
"""Dựng KHUNG bộ ảnh vàng (BO_ANH_VANG.md mục 5-6) từ ảnh thô anh Tony bỏ
vào BoAnhVang/ (theo đúng hướng dẫn cũ trong BoAnhVang/DE-ANH-VAO-DAY.txt:
mỗi sản phẩm một thư mục con, tên thư mục là mã sản phẩm, một sản phẩm
nhiều ảnh cũng được, công cụ tự chọn ảnh rõ nhất).

CHỈ dựng KHUNG — ảnh đã chọn ảnh rõ nhất + tệp nhãn RỖNG (labels/*.json) +
manifest.csv. KHÔNG tự đếm flower_count/bud_count/components: đếm là việc
của người, theo đúng BO_ANH_VANG.md mục 7 (người A gán nhãn, người B gán
độc lập ít nhất 30%, đối chiếu, mới điền verified_by). Để máy tự đếm rồi
lấy chính máy đó chấm điểm máy là vô nghĩa — xem mục 1, hàng "Đổi provider
Vision": thước đo mất giá trị nếu suy từ chính cái nó đang đo.

Cách chạy:
    python3 scripts/xay-dung-bo-anh-vang.py            # chỉ in kế hoạch (dry run)
    python3 scripts/xay-dung-bo-anh-vang.py --apply    # ghi thật vào golden/

Chạy lại nhiều lần được — mỗi lần --apply sẽ XOÁ và dựng lại golden/images/
và golden/labels/*.json chưa có labeled_by (những nhãn đã có người điền
labeled_by sẽ được giữ nguyên, không ghi đè — xem giữ_nhan_da_dien()).
"""

from __future__ import annotations

import argparse
import csv
import json
import shutil
import unicodedata
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

REPO_ROOT = Path(__file__).resolve().parents[1]
SRC_ROOT = REPO_ROOT / "BoAnhVang"
GOLDEN_ROOT = REPO_ROOT / "golden"
IMG_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
MAC_DINH_LIMIT = 100

# Từ khoá thư mục -> product_form (BO_ANH_VANG.md mục 3: bó · giỏ · hộp · bình · lẵng)
# "kệ" (kệ hoa/kệ chia buồn/kệ khai trương — hoa đứng) không nằm trong 5 dạng
# liệt kê ở mục 3; xếp tạm vào "lang" (gần nhất về hình thái, hoa đứng có chân)
# — CẦN người xác nhận lại khi gán nhãn, xem TECHNICAL_DEBT.md nợ mới.
FORM_KEYWORDS = [
    ("bó", "bo"),
    ("giỏ", "gio"),
    ("hộp", "hop"),
    ("bình", "binh"),
    ("lẵng", "lang"),
    ("kệ", "lang"),
]


# Chữ cái đầu mã sản phẩm -> product_form, suy từ đúng quy ước đặt mã đang
# thấy trong BoAnhVang/ (B=Bó, G=Giỏ, K=Kệ — ví dụ BHC=Bó Hoa Cưới,
# GHKT=Giỏ Hoa Khai Trương, KHCB=Kệ Hoa Chia Buồn). Chỉ dùng khi không đoán
# được từ tên thư mục cha (đường dẫn không có chữ "bó/giỏ/hộp/bình/lẵng/kệ"
# tường minh, ví dụ "HOA CƯỚI /BHC0001" không có thư mục dạng riêng).
PREFIX_LETTER_FORM = {"B": "bo", "G": "gio", "K": "lang"}


def doan_tu_ma_san_pham(ten_thu_muc_la: str) -> str | None:
    chu_cai_dau = next((c for c in ten_thu_muc_la if c.isalpha()), None)
    if chu_cai_dau is None:
        return None
    return PREFIX_LETTER_FORM.get(chu_cai_dau.upper())


def doan_product_form(duong_dan: str, ten_thu_muc_la: str | None = None) -> str | None:
    # macOS (qua device bridge) trả tên tệp ở dạng Unicode NFD (tổ hợp dấu
    # rời) — "giỏ" gõ trong mã nguồn này là NFC nên so trực tiếp luôn trật.
    # Chuẩn hoá cả hai về NFC trước khi so khớp chuỗi con.
    t = unicodedata.normalize("NFC", duong_dan).lower()
    for tu_khoa, dang in FORM_KEYWORDS:
        if unicodedata.normalize("NFC", tu_khoa) in t:
            return dang
    if ten_thu_muc_la:
        return doan_tu_ma_san_pham(ten_thu_muc_la)
    return None


def do_net(duong_dan_anh: Path) -> float:
    """Độ nét thô — phương sai sau lọc Laplace trên ảnh xám, thu nhỏ cạnh dài
    nhất về 800px cho nhanh. Càng cao càng nét. Đây là thước đo mù nội dung
    (không nhận diện được cái gì trong ảnh), chỉ để chọn ảnh rõ nhất trong
    một sản phẩm nhiều ảnh — không phải một dạng "chấm điểm chất lượng ảnh"
    theo mục 3 (tốt/trung bình/kém), việc đó vẫn cần người xem.
    """
    try:
        with Image.open(duong_dan_anh) as im:
            a = im.convert("L")
            a.thumbnail((800, 800))
            lap = a.filter(ImageFilter.Kernel((3, 3), [0, 1, 0, 1, -4, 1, 0, 1, 0], scale=1))
            return float(np.array(lap, dtype=np.float64).var())
    except Exception:
        return -1.0


def tim_san_pham(goc: Path) -> list[tuple[Path, list[Path]]]:
    """Mỗi thư mục lá có ảnh trực tiếp bên trong coi là một sản phẩm. Bỏ qua
    ảnh rời nằm thẳng ở BoAnhVang/ (đã rà tay: trùng md5 với ảnh cùng mã đã
    nằm gọn trong thư mục con — là bản nháp cũ trước khi anh Tony sắp lại
    theo đúng thư mục, xem DE-ANH-VAO-DAY.txt).
    """
    ket_qua = []
    for thu_muc in sorted(p for p in goc.rglob("*") if p.is_dir()):
        anh = sorted(
            p for p in thu_muc.iterdir()
            if p.is_file() and p.suffix.lower() in IMG_EXTS
        )
        if anh:
            ket_qua.append((thu_muc, anh))
    return ket_qua


def chia_hang_muc(san_pham: list[tuple[Path, list[Path]]], limit: int) -> list[tuple[Path, list[Path]]]:
    """Lấy mẫu đại diện theo tỉ trọng thư mục cha trực tiếp (mục 3: "theo
    đúng tỉ trọng danh mục thật đang bán") khi số sản phẩm vượt limit. Trong
    một hạng mục, lấy đều theo thứ tự tên (không ngẫu nhiên) để chạy lại vẫn
    ra cùng một bộ.
    """
    if len(san_pham) <= limit:
        return san_pham

    theo_hang_muc: dict[Path, list[tuple[Path, list[Path]]]] = {}
    for thu_muc, anh in san_pham:
        theo_hang_muc.setdefault(thu_muc.parent, []).append((thu_muc, anh))

    tong = len(san_pham)
    da_chon: list[tuple[Path, list[Path]]] = []
    con_du = []
    for hang_muc, muc in theo_hang_muc.items():
        muc_sorted = sorted(muc, key=lambda x: x[0].name)
        so_luong = max(1, round(limit * len(muc) / tong))
        so_luong = min(so_luong, len(muc_sorted))
        da_chon.extend(muc_sorted[:so_luong])
        con_du.extend(muc_sorted[so_luong:])

    if len(da_chon) > limit:
        da_chon = sorted(da_chon, key=lambda x: str(x[0]))[:limit]
    elif len(da_chon) < limit:
        thieu = limit - len(da_chon)
        da_chon.extend(sorted(con_du, key=lambda x: str(x[0]))[:thieu])

    return sorted(da_chon, key=lambda x: str(x[0]))


def nhan_rong(image_id: str, file_name: str, nguon: str, product_name: str, product_form: str | None) -> dict:
    return {
        "image_id": image_id,
        "file": file_name,
        "source": nguon,
        "product_name": product_name,
        "product_form": product_form,
        "difficulty": None,
        "flower_count": None,
        "bud_count": None,
        "damaged_count": None,
        "order_count": None,
        "components": [],
        "occluded": None,
        "notes": "",
        "labeled_by": "",
        "labeled_at": "",
        "verified_by": "",
        "verified_at": "",
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=MAC_DINH_LIMIT)
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()

    if not SRC_ROOT.exists():
        print(f"Không thấy {SRC_ROOT} — chưa có ảnh thô để dựng.")
        return

    san_pham = tim_san_pham(SRC_ROOT)
    print(f"Tìm thấy {len(san_pham)} thư mục sản phẩm có ảnh trong {SRC_ROOT}.")

    chon = chia_hang_muc(san_pham, args.limit)
    print(f"Chọn {len(chon)} sản phẩm (limit={args.limit}) để dựng khung bộ ảnh vàng.")

    ke_hoach = []
    khong_doan_duoc_dang = []
    for thu_muc, anh in chon:
        anh_ro_nhat = max(anh, key=do_net)
        rel = thu_muc.relative_to(SRC_ROOT)
        product_form = doan_product_form(str(rel), thu_muc.name)
        if product_form is None:
            khong_doan_duoc_dang.append(str(rel))
        product_name = " / ".join(rel.parts)
        ke_hoach.append((thu_muc, anh_ro_nhat, str(rel), product_name, product_form))

    ke_hoach.sort(key=lambda x: x[2])

    if khong_doan_duoc_dang:
        print(f"CẢNH BÁO: {len(khong_doan_duoc_dang)} thư mục không đoán được product_form "
              f"từ tên (để trống, cần người điền tay): {khong_doan_duoc_dang[:10]}"
              + (" …" if len(khong_doan_duoc_dang) > 10 else ""))

    dem_dang: dict[str | None, int] = {}
    for *_rest, dang in ke_hoach:
        dem_dang[dang] = dem_dang.get(dang, 0) + 1
    print("Phân bổ product_form trong lựa chọn:", dem_dang)

    if not args.apply:
        print("\n(DRY RUN — chưa ghi gì. Chạy lại với --apply để ghi vào golden/.)")
        for _thu_muc, anh_chon, rel, product_name, product_form in ke_hoach[:10]:
            print(f"  {rel}  ->  chọn ảnh: {anh_chon.name}  (product_form={product_form})")
        if len(ke_hoach) > 10:
            print(f"  … và {len(ke_hoach) - 10} sản phẩm khác")
        return

    images_dir = GOLDEN_ROOT / "images"
    labels_dir = GOLDEN_ROOT / "labels"
    images_dir.mkdir(parents=True, exist_ok=True)
    labels_dir.mkdir(parents=True, exist_ok=True)

    manifest_rows = []
    so_giu_nguyen = 0
    for i, (_thu_muc, anh_chon, rel, product_name, product_form) in enumerate(ke_hoach, start=1):
        image_id = f"g{i:03d}"
        ten_tep_dich = f"{image_id}{anh_chon.suffix.lower()}"
        nhan_path = labels_dir / f"{image_id}.json"

        # Nhãn đã có người điền labeled_by thì GIỮ NGUYÊN, không ghi đè —
        # kịch bản chạy lại (thêm ảnh mới) không được xoá công gán nhãn cũ.
        if nhan_path.exists():
            try:
                nhan_cu = json.loads(nhan_path.read_text(encoding="utf-8"))
            except Exception:
                nhan_cu = {}
            if nhan_cu.get("labeled_by"):
                so_giu_nguyen += 1
                manifest_rows.append(nhan_cu)
                continue

        shutil.copy2(anh_chon, images_dir / ten_tep_dich)
        nhan = nhan_rong(
            image_id=image_id,
            file_name=ten_tep_dich,
            nguon=f"BoAnhVang/{rel}",
            product_name=product_name,
            product_form=product_form,
        )
        nhan_path.write_text(json.dumps(nhan, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        manifest_rows.append(nhan)

    with open(GOLDEN_ROOT / "manifest.csv", "w", newline="", encoding="utf-8") as f:
        cols = ["image_id", "file", "source", "product_name", "product_form", "difficulty",
                "flower_count", "bud_count", "damaged_count", "order_count",
                "occluded", "labeled_by", "verified_by"]
        w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        for row in manifest_rows:
            w.writerow(row)

    quy_uoc_nguon = REPO_ROOT / "docs" / "kien-truc" / "QUY_UOC_DEM.md"
    if quy_uoc_nguon.exists():
        noi_dung = quy_uoc_nguon.read_text(encoding="utf-8")
        header = ("<!-- BẢN SAO — nguồn thật ở docs/kien-truc/QUY_UOC_DEM.md, "
                   "sửa ở đó rồi chạy lại script này để đồng bộ. -->\n\n")
        (GOLDEN_ROOT / "QUY_UOC_DEM.md").write_text(header + noi_dung, encoding="utf-8")

    print(f"\nĐã ghi {len(ke_hoach) - so_giu_nguyen} ảnh + nhãn rỗng mới vào {GOLDEN_ROOT}/ "
          f"(giữ nguyên {so_giu_nguyen} nhãn đã có người gán).")
    print("Bước kế tiếp BẮT BUỘC là người, không phải máy: mở từng golden/labels/g*.json, "
          "đếm theo docs/kien-truc/QUY_UOC_DEM.md, điền flower_count/bud_count/damaged_count/"
          "components/labeled_by/labeled_at — rồi người thứ hai gán độc lập ít nhất 30% để đối "
          "chiếu (BO_ANH_VANG.md mục 7) trước khi điền verified_by.")


if __name__ == "__main__":
    main()
