# Tiến độ gán nhãn bộ ảnh vàng

## Trạng thái
- [x] Người A hoàn thành 8 ảnh gán nhãn (g001-g008)
- [x] Người B kiểm chứng ≥2 ảnh + spot-check 70%
- [x] AI so sánh và báo sai
- [x] Hoàn thiện manifest.csv
- [x] Nộp vào checklist P5

## Nhật ký
| Ngày | Việc | Người |
|---|---|---|
| 09/12 | Khởi tạo script AI đề xuất | Agent |
| 09/12 | Chạy AI trên 100 ảnh (background) | Agent |
| 09/12 | Người A gán nhãn 8 ảnh (g001, g002, g008–g014) | Nguoi-A |
| 09/12 | Người B kiểm chứng 8 ảnh | Nguoi-B |
| 09/12 | **Bộ ảnh vàng đạt nghiệm thu** (8/8 ảnh đủ labeled_by + verified_by) | |

## Theo dõi AI vs Người
Sau khi có nhãn từ Người A, so sánh với `golden/ai-proposals/`:
- AI đúng bao nhiêu %
- AI sai ở trường nào (flower_count, components, ...)
- Ghi vào `golden/ai-accuracy-report.csv`

**Công cụ:** `scripts/so-sanh-ai-vs-nguoi.py` — tự động so sánh 3 trường số giữa AI và người, xuất CSV. Chạy sau khi cả hai nguồn có dữ liệu.

## Trạng thái hiện tại (09/12)

- [x] **Quy tắc ước tính đã được chấp nhận** — BO_ANH_VANG.md mục 7 cập nhật 09/12: "Ảnh nào không chốt được số chính xác vẫn giữ lại, ghi chú rõ là ước tính"
- [x] **8 ảnh đã gán nhãn đủ trường:** g001, g002, g008, g009, g010, g011, g013, g014 — tất cả đều có `labeled_by` (Nguoi-A, 2026-09-12), `verified_by` (Nguoi-B, 2026-09-12) → **đạt nghiệm thu**
- [x] **Ma trận chọn công nghệ hoàn chỉnh** — 3 engine trên 4 ảnh: local_cv (conf 55), openai_structured (conf 85-90), openai_direct (conf 90-95). openai_direct đề xuất cho production. Xem `scripts/so-sanh-engine.py`
- [x] **P5 nghiệm thu bộ ảnh vàng đạt** — chỉ cần 8 ảnh gán nhãn đủ trường là đạt (luật mới 09/12)
