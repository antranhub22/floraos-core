#!/usr/bin/env python3
"""Dựng bảng so sánh từ `golden/so-sanh-5-6/ket-qua.jsonl`.

Sinh ba tệp trong cùng thư mục:
  · chi-phi.csv        — một dòng mỗi tổ hợp: tiền, thời gian, token, số lượt gọi
  · so-sanh-truong.csv — một dòng mỗi tổ hợp × ảnh: các trường then chốt
  · bao-cao.md         — bảng đọc được bằng mắt, dán thẳng vào tài liệu

Không gọi mạng, không tốn tiền. Chạy lại bao nhiêu lần cũng được.
"""

from __future__ import annotations

import csv
import json
import statistics
from collections import defaultdict
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
RA_DIR = GOC / "golden" / "so-sanh-5-6"
TY_GIA = 26300  # khớp ô "Tỉ giá USD → VNĐ" của Chi-phi-3-bo-may-phan-tich.xlsx

TEN_CO_CHE = {"day-du": "Đầy đủ", "gon": "Gọn"}


def _tb(xs):
    xs = [x for x in xs if isinstance(x, (int, float))]
    return round(statistics.mean(xs), 4) if xs else None


def main() -> int:
    tep = RA_DIR / "ket-qua.jsonl"
    if not tep.exists():
        print(f"Chưa có {tep} — chạy `python3 scripts/so-sanh-5-6.py --chay` trước.")
        return 1

    ban_ghi = [json.loads(d) for d in tep.read_text(encoding="utf-8").splitlines() if d.strip()]
    # Ô chạy lại thì bản ghi sau thắng bản ghi trước.
    theo_khoa = {b["khoa"]: b for b in ban_ghi}
    tot = [b for b in theo_khoa.values() if not b.get("loi")]
    loi = [b for b in theo_khoa.values() if b.get("loi")]

    nhom = defaultdict(list)
    for b in tot:
        nhom[(b["co_che"], b["model"], b["effort"] or "-")].append(b)

    # ── chi-phi.csv ──────────────────────────────────────────────────
    cot = ["co_che", "model", "muc_suy_luan", "so_anh_do", "usd_moi_anh", "vnd_moi_anh",
           "giay_moi_anh", "token_vao", "token_ra", "token_suy_luan", "token_cache",
           "lan_goi_moi_anh", "ty_le_day_truong"]
    dong_chi_phi = []
    for (co_che, model, effort), bs in sorted(nhom.items()):
        usd = _tb([b.get("cost_usd") for b in bs])
        dong_chi_phi.append({
            "co_che": TEN_CO_CHE.get(co_che, co_che), "model": model, "muc_suy_luan": effort,
            "so_anh_do": len(bs),
            "usd_moi_anh": usd,
            "vnd_moi_anh": round(usd * TY_GIA) if usd is not None else None,
            "giay_moi_anh": _tb([b.get("giay") for b in bs]),
            "token_vao": _tb([b.get("input_tokens") for b in bs]),
            "token_ra": _tb([b.get("output_tokens") for b in bs]),
            "token_suy_luan": _tb([b.get("reasoning_tokens") for b in bs]),
            "token_cache": _tb([b.get("cache_tokens") for b in bs]),
            "lan_goi_moi_anh": _tb([b.get("so_lan_goi") for b in bs]),
            "ty_le_day_truong": _tb([(b.get("tom_tat") or {}).get("ty_le_day_truong") for b in bs]),
        })
    with (RA_DIR / "chi-phi.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cot)
        w.writeheader()
        w.writerows(dong_chi_phi)

    # ── so-sanh-truong.csv ───────────────────────────────────────────
    cot2 = ["anh", "co_che", "model", "muc_suy_luan", "flower_count", "bud_count",
            "damaged_count", "nguoi_bud_count", "nguoi_damaged_count", "so_dong_hoa",
            "so_dong_la", "so_dong_phu_kien", "so_lop_goi", "category", "shape",
            "phong_cach", "dip_su_dung", "confidence", "ty_le_day_truong"]
    with (RA_DIR / "so-sanh-truong.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cot2)
        w.writeheader()
        for b in sorted(tot, key=lambda x: (x["anh"], x["co_che"], x["model"], x["effort"] or "")):
            t = b.get("tom_tat") or {}
            n = b.get("nhan_nguoi") or {}
            w.writerow({
                "anh": b["anh"], "co_che": TEN_CO_CHE.get(b["co_che"], b["co_che"]),
                "model": b["model"], "muc_suy_luan": b["effort"] or "-",
                "nguoi_bud_count": n.get("bud_count"), "nguoi_damaged_count": n.get("damaged_count"),
                **{k: t.get(k) for k in cot2 if k in t},
            })

    # ── bao-cao.md ───────────────────────────────────────────────────
    ra = ["# So sánh GPT-5.6 với mô hình đang chạy — M01 Vision", ""]
    ra.append(f"Ô đo được: {len(tot)} · ô lỗi: {len(loi)} · tỉ giá {TY_GIA:,} đ/USD".replace(",", ".") + "  ")
    ra += ["", "## Chi phí và tốc độ", "",
           "| Cơ chế | Mô hình | Suy luận | Ảnh | USD/ảnh | VNĐ/ảnh | Giây/ảnh | Token vào | Token ra | Token suy luận | Lượt gọi | Đầy trường |",
           "|---|---|---|---|---|---|---|---|---|---|---|---|"]
    def o(v, fmt="{}"):
        """Ô trống là "—", không phải 0: chưa đo được khác hẳn đo được và bằng 0."""
        return "—" if v is None else fmt.format(v)

    def nghin(v):
        return "—" if v is None else f"{v:,.0f}".replace(",", ".")

    for d in dong_chi_phi:
        ra.append(
            f"| {d['co_che']} | {d['model']} | {d['muc_suy_luan']} | {d['so_anh_do']} | "
            f"{o(d['usd_moi_anh'], '{:.5f}')} | {nghin(d['vnd_moi_anh'])} | "
            f"{o(d['giay_moi_anh'], '{:.1f}')} | {nghin(d['token_vao'])} | {nghin(d['token_ra'])} | "
            f"{nghin(d['token_suy_luan'])} | {o(d['lan_goi_moi_anh'], '{:.2f}')} | "
            f"{o(d['ty_le_day_truong'], '{:.1%}')} |"
        )

    ra += ["", "## Kết quả phân tích — từng ảnh", ""]
    for anh in sorted({b["anh"] for b in tot}):
        n = next((b.get("nhan_nguoi") for b in tot if b["anh"] == anh and b.get("nhan_nguoi")), {})
        ra.append(f"### {anh}" + (f" — nhãn người: {n}" if n else " — chưa có nhãn người"))
        ra += ["", "| Cơ chế | Mô hình | Suy luận | Hoa | Nụ | Hỏng | Dòng hoa | Dòng lá | Phụ kiện | Lớp gói | Dáng | Tin cậy |",
               "|---|---|---|---|---|---|---|---|---|---|---|---|"]
        for b in sorted([x for x in tot if x["anh"] == anh], key=lambda x: (x["co_che"], x["model"], x["effort"] or "")):
            t = b.get("tom_tat") or {}
            g = lambda k: "—" if t.get(k) is None else t.get(k)  # noqa: E731
            ra.append(
                f"| {TEN_CO_CHE.get(b['co_che'], b['co_che'])} | {b['model']} | {b['effort'] or '-'} | "
                f"{g('flower_count')} | {g('bud_count')} | {g('damaged_count')} | {g('so_dong_hoa')} | "
                f"{g('so_dong_la')} | {g('so_dong_phu_kien')} | {g('so_lop_goi')} | {g('shape')} | {g('confidence')} |"
            )
        ra.append("")

    if loi:
        ra += ["## Ô lỗi", ""]
        for b in loi:
            ra.append(f"- `{b['khoa']}` — {b['loi']}")
        ra.append("")

    canh_bao = {c for b in tot for c in (b.get("canh_bao_tham_so") or [])}
    if canh_bao:
        ra += ["## Tham số bị nhà cung cấp chê (đã tự bỏ rồi gọi lại)", ""]
        ra += [f"- {c}" for c in sorted(canh_bao)] + [""]

    (RA_DIR / "bao-cao.md").write_text("\n".join(ra) + "\n", encoding="utf-8")
    print(f"Đã ghi:\n  {RA_DIR/'chi-phi.csv'}\n  {RA_DIR/'so-sanh-truong.csv'}\n  {RA_DIR/'bao-cao.md'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
