"""Đọc `ket-qua/results.jsonl` + kiểm kê thư mục `images/` của AVI GIFT
(FloraOS v1), gộp thành một tệp JSON trung gian để nạp vào floraos-core
(P8, nợ #34 — `docs/dac-ta/TECHNICAL_DEBT.md`).

Đây là lượt nạp thứ HAI của P8. Lượt một (`doc-excel.py`) nạp danh mục giá
1.316 SKU, tất cả `status = DRAFT` vì chưa có ảnh. Lượt này nạp phần có ẢNH
THẬT và phân tích nhận diện đầy đủ đã chạy ở v1.

Nguồn sự thật là `ket-qua/results.jsonl`, KHÔNG phải `ket-qua/Product_Master.xlsx`:
tệp jsonl là đầu ra MÁY của v1 (`schema_version` 10, mỗi dòng một lượt phân
tích), còn Product_Master.xlsx là bản trình bày suy ra từ nó cho người đọc.
Nạp bản trình bày rồi gọi nó là `product_analyses.raw` là ghi sai nguồn.

Ghi chú lỗi dữ liệu của v1, KHÔNG mang sang: cột `Mã sản phẩm` của
Product_Master.xlsx ghi `BHSK0001/BHSK0001` — dính cả tên thư mục. Ở đây mã
suy từ TÊN TỆP ảnh (`BHSK0001-1.jpg` → `BHSK0001`), không suy từ cột đó.

Đồng bộ MỘT CHIỀU: chỉ đọc, không có đường nào ghi ngược vào nguồn.

Chạy: python3 doc-phan-tich.py <thư_mục "FloraOS Vận hành"> <thư_mục xuất JSON>
"""

import hashlib
import json
import re
import sys
import unicodedata
from pathlib import Path

# Thư mục kho ảnh thô dùng để dựng bộ ảnh vàng — không phải ảnh sản phẩm đã
# phân tích, bỏ qua khi kiểm kê.
THU_MUC_BO_QUA = {"Dữ liệu hình ảnh"}

DUOI_ANH = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
            ".webp": "image/webp", ".gif": "image/gif"}

# `-1.jpg`, `-2.jpeg`, ` - 2.json`… đuôi thứ tự ảnh trong cùng một mã.
HAU_TO_THU_TU = re.compile(r"\s*-\s*\d+$")


def nfc(s):
    return unicodedata.normalize("NFC", s) if isinstance(s, str) else s


def ma_tu_ten_tep(ten_tep):
    """`BHSK0001/BHSK0001-1.jpg` → `BHSK0001`. Cắt thư mục, cắt đuôi, cắt
    hậu tố thứ tự. Một số dòng của `results.jsonl` ghi kèm thư mục, một số
    chỉ ghi tên tệp trần — xử lý được cả hai."""
    ten = Path(nfc(ten_tep)).name
    return HAU_TO_THU_TU.sub("", Path(ten).stem).strip()


def kich_thuoc_anh(duong_dan):
    """Rộng × cao, hoặc (None, None) nếu không đọc được. Pillow là tuỳ chọn:
    hai cột này `nullable` trong lược đồ (`assets.width`/`height`), thiếu thì
    lượt nạp vẫn chạy — không đáng bắt cài thêm thư viện."""
    try:
        from PIL import Image
    except ImportError:
        return None, None
    try:
        with Image.open(duong_dan) as im:
            return im.width, im.height
    except Exception:
        return None, None


def sha256_tep(duong_dan):
    h = hashlib.sha256()
    with open(duong_dan, "rb") as f:
        for khoi in iter(lambda: f.read(1 << 20), b""):
            h.update(khoi)
    return h.hexdigest()


def kiem_ke_anh(thu_muc_san_pham):
    anh = []
    for tep in sorted(thu_muc_san_pham.iterdir()):
        if not tep.is_file() or tep.name.startswith("."):
            continue
        mime = DUOI_ANH.get(tep.suffix.lower())
        if not mime:
            continue
        rong, cao = kich_thuoc_anh(tep)
        anh.append({
            "fileName": nfc(tep.name),
            "absolutePath": str(tep.resolve()),
            "mimeType": mime,
            "fileSize": tep.stat().st_size,
            "width": rong,
            "height": cao,
            "sha256": sha256_tep(tep),
        })
    return anh


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(2)

    goc = Path(sys.argv[1]).expanduser()
    ra = Path(sys.argv[2]).expanduser()
    ra.mkdir(parents=True, exist_ok=True)

    tep_ket_qua = goc / "ket-qua" / "results.jsonl"
    thu_muc_anh = goc / "images"
    if not tep_ket_qua.exists():
        sys.exit(f"Không thấy {tep_ket_qua}")
    if not thu_muc_anh.is_dir():
        sys.exit(f"Không thấy {thu_muc_anh}")

    ban_ghi = []
    canh_bao = []
    for so_dong, dong in enumerate(tep_ket_qua.read_text(encoding="utf-8").splitlines(), 1):
        if not dong.strip():
            continue
        try:
            r = json.loads(dong)
        except json.JSONDecodeError as e:
            canh_bao.append(f"Dòng {so_dong} của results.jsonl không phải JSON hợp lệ: {e}")
            continue

        # Chỉ nạp lượt phân tích THÀNH CÔNG. Lượt lỗi ở v1 không phải dữ liệu
        # vận hành, nạp vào chỉ làm bẩn Product Master.
        if r.get("status") != "OK":
            canh_bao.append(f"Bỏ qua {r.get('file')}: status = {r.get('status')}")
            continue
        du_lieu = r.get("data")
        if not isinstance(du_lieu, dict) or not du_lieu:
            canh_bao.append(f"Bỏ qua {r.get('file')}: không có khối `data`")
            continue

        ma = ma_tu_ten_tep(r["file"])
        ten_anh = nfc(Path(r["file"]).name)
        thu_muc = thu_muc_anh / ma
        if not thu_muc.is_dir():
            canh_bao.append(f"Bỏ qua {ma}: không thấy thư mục ảnh {thu_muc}")
            continue

        anh = kiem_ke_anh(thu_muc)
        if not anh:
            canh_bao.append(f"Bỏ qua {ma}: thư mục ảnh rỗng")
            continue
        if not any(a["fileName"] == ten_anh for a in anh):
            canh_bao.append(
                f"Bỏ qua {ma}: ảnh đã phân tích ({ten_anh}) không còn trong thư mục"
            )
            continue

        ban_ghi.append({
            "code": ma,
            "analyzedFileName": ten_anh,
            "analyzedAt": r.get("at"),
            "schemaVersion": r.get("schema_version"),
            "images": anh,
            "analysis": du_lieu,
        })

    # Thư mục sản phẩm có ảnh nhưng KHÔNG có lượt phân tích nào — nêu ra để
    # người soát biết, không tự nạp (ảnh chưa qua M01 thì chưa có gì để duyệt).
    da_co = {b["code"] for b in ban_ghi}
    for thu_muc in sorted(thu_muc_anh.iterdir()):
        if not thu_muc.is_dir() or nfc(thu_muc.name) in THU_MUC_BO_QUA:
            continue
        ma = nfc(thu_muc.name)
        if ma in da_co:
            continue
        so_anh = len(kiem_ke_anh(thu_muc))
        canh_bao.append(
            f"{ma}: có thư mục ({so_anh} ảnh) nhưng không có lượt phân tích nào trong results.jsonl"
        )

    (ra / "analyses.json").write_text(
        json.dumps(ban_ghi, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    (ra / "analyses-warnings.json").write_text(
        json.dumps(canh_bao, ensure_ascii=False, indent=1), encoding="utf-8"
    )

    tong_anh = sum(len(b["images"]) for b in ban_ghi)
    print(f"Đọc {len(ban_ghi)} lượt phân tích, {tong_anh} ảnh, ghi vào {ra / 'analyses.json'}")
    for c in canh_bao:
        print(f"  cảnh báo: {c}")


if __name__ == "__main__":
    main()
