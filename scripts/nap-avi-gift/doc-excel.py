"""Đọc 01_NHAP-LIEU.xlsx + 02_KET-QUA.xlsx của AVI GIFT (FloraOS v1), gộp
thành một tệp JSON trung gian sạch để nạp vào floraos-core (P8, H7).

Nguồn: `docs/dac-ta/08-integration-specification.md` mục 6 — hạ cấp
`excel_parser.py`/`ket_qua_phan_tich.py` thành adapter nhập MỘT CHIỀU
(HARVEST_MANIFEST.md, A3). Không viết ngược lại hai tệp Excel.

Sheet 20 "Giá chào" là bản CHỐT (đúng ghi chú của `ket_qua_phan_tich.py`) —
lấy làm nguồn chính cho tên/giá/Sàn/Trần/giá vốn. Sheet 09 "Danh mục sản
phẩm" của 01_NHAP-LIEU chỉ bổ sung cột `Dịp` (Occasion) mà sheet 20 không có.
Sheet 21 "Cấu thành giá vốn" là BOM, nhiều dòng một mã.

Lệch so với `excel_parser.py` bản gốc, ghi vào `RA_SOAT_THU_HOACH.md`:
cột ảnh trong dữ liệu thật tên là "Đường dẫn ảnh", không phải "Link ảnh"/
"Link Ảnh"/"Link_Anh" như bản gốc dò — bản gốc sẽ luôn đọc rỗng trên dữ liệu
thật này.

Chạy: python3 doc-excel.py <thư_mục "FloraOS Vận hành"> <thư_mục xuất JSON>
"""

import json
import sys
import unicodedata
from pathlib import Path

import openpyxl


def nfc(s):
    return unicodedata.normalize("NFC", s) if isinstance(s, str) else s


def to_num(v):
    if v is None:
        return None
    if isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        return v
    s = str(v).strip().replace(",", ".").replace("%", "")
    if not s:
        return None
    try:
        return float(s)
    except ValueError:
        return None


def to_str(v):
    if v is None:
        return None
    s = nfc(str(v)).strip()
    return s if s else None


def read_sheet(path, sheet_name):
    wb = openpyxl.load_workbook(path, data_only=True, read_only=True)
    try:
        ws = wb[sheet_name]
        rows = ws.iter_rows(values_only=True)
        head = [to_str(c) or "" for c in next(rows)]
        out = []
        for r in rows:
            out.append(dict(zip(head, r)))
        return out
    finally:
        wb.close()


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
    src = Path(sys.argv[1])
    out_dir = Path(sys.argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)

    warnings = []

    # ---- Sheet 09: chỉ lấy 'Dịp' theo mã, bổ sung cho sheet 20 ----
    occasion_by_code = {}
    for row in read_sheet(src / "01_NHAP-LIEU.xlsx", "09 Danh mục sản phẩm"):
        code = to_str(row.get("Mã sản phẩm"))
        if not code:
            continue
        occasion = to_str(row.get("Dịp"))
        if occasion:
            occasion_by_code[code] = occasion

    # ---- Sheet 21: BOM, nhiều dòng một mã ----
    bom_by_code = {}
    bom_rows_total = 0
    for row in read_sheet(src / "02_KET-QUA.xlsx", "21 Cấu thành giá vốn"):
        code = to_str(row.get("Mã sản phẩm"))
        if not code:
            continue
        bom_rows_total += 1
        bom_by_code.setdefault(code, []).append({
            "group": to_str(row.get("Nhóm")),
            "componentCode": to_str(row.get("Mã thành phần")),
            "componentName": to_str(row.get("Tên thành phần")),
            "unit": to_str(row.get("ĐVT đếm")),
            "qty": to_num(row.get("Số lượng")),
            "qtyMin": to_num(row.get("Số lượng tối thiểu")),
            "qtyMax": to_num(row.get("Số lượng tối đa")),
            "source": to_str(row.get("Nguồn số lượng")),
            "confidencePercent": to_num(row.get("Độ tin cậy")),
            "lockStatus": to_str(row.get("Trạng thái chốt")),
            "unitPriceVnd": to_num(row.get("Đơn giá theo ĐVT đếm")),
            "lineTotalVnd": to_num(row.get("Thành tiền")),
        })

    # ---- Sheet 20: bản chốt — tên/giá/Sàn/Trần/giá vốn ----
    products = {}
    seen_order = []
    dup_skus = []
    for idx, row in enumerate(read_sheet(src / "02_KET-QUA.xlsx", "20 Giá chào")):
        code = to_str(row.get("Mã sản phẩm"))
        if not code:
            continue
        name = to_str(row.get("Tên sản phẩm"))
        if not name:
            warnings.append(f"Dòng {idx+2} sheet20: mã {code} không có Tên sản phẩm, bỏ qua.")
            continue

        if code in products:
            dup_skus.append(code)

        products[code] = {
            "code": code,
            "name": name,
            "styleRaw": to_str(row.get("Kiểu")),
            "styleDetailCode": to_str(row.get("Mã kiểu chi tiết")),
            "sizeCode": to_str(row.get("Cỡ")),
            "templateCode": to_str(row.get("Mã template")),
            "styleSource": to_str(row.get("Nguồn kiểu")),
            "occasion": occasion_by_code.get(code),
            "sellPriceVnd": to_num(row.get("Giá bán")),
            "costVnd": to_num(row.get("Giá vốn sản xuất")),
            "laborCostVnd": to_num(row.get("Chi phí công")),
            "priceStatus": to_str(row.get("Trạng thái giá")),
            "priceWarning": to_str(row.get("Cảnh báo giá")),
            "floorVnd": to_num(row.get("Giá chào thấp nhất")),
            "ceilingVnd": to_num(row.get("Giá chào cao nhất")),
            "profileStatus": to_str(row.get("Trạng thái hồ sơ")),
            "componentCount": to_num(row.get("Số loại")),
            "ingredientCount": to_num(row.get("Số thành phần")),
            "bom": bom_by_code.get(code, []),
        }
        if code not in seen_order:
            seen_order.append(code)

    if dup_skus:
        warnings.append(
            f"{len(set(dup_skus))} mã trùng lặp ở sheet 20, giữ dòng cuối cùng: "
            + ", ".join(sorted(set(dup_skus))[:20])
            + (" …" if len(set(dup_skus)) > 20 else "")
        )

    orphan_bom = set(bom_by_code) - set(products)
    if orphan_bom:
        warnings.append(
            f"{len(orphan_bom)} mã có BOM ở sheet 21 nhưng không có dòng ở sheet 20 "
            "(có thể là ảnh mới phân tích, chưa vào danh mục — xem Product_Master.xlsx)."
        )

    catalog = [products[c] for c in seen_order]

    (out_dir / "catalog.json").write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (out_dir / "warnings.json").write_text(
        json.dumps(warnings, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(f"products: {len(catalog)}")
    print(f"bom rows total (sheet21): {bom_rows_total}, distinct SKU: {len(bom_by_code)}")
    print(f"orphan BOM SKU (no sheet20 row): {len(orphan_bom)}")
    print(f"warnings: {len(warnings)}")
    for w in warnings[:10]:
        print(" -", w)


if __name__ == "__main__":
    main()
