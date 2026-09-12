# Tiến độ gán nhãn bộ ảnh vàng

## Trạng thái
- [ ] Người A hoàn thành 100 ảnh (g001-g100)
- [ ] Người B kiểm chứng 30% (30 ảnh) + spot-check 70%
- [ ] AI so sánh và báo sai
- [ ] Hoàn thiện manifest.csv
- [ ] Nộp vào checklist P5

## Nhật ký
| Ngày | Việc | Người |
|---|---|---|
| 09/12 | Khởi tạo script AI đề xuất | Agent |
| 09/12 | Chạy AI trên 100 ảnh (background) | Agent |
| | Người A bắt đầu đánh giá | |
| | Người B kiểm chứng | |
| | Hoàn tất | |

## Theo dõi AI vs Người
Sau khi có nhãn từ Người A, so sánh với `golden/ai-proposals/`:
- AI đúng bao nhiêu %
- AI sai ở trường nào (flower_count, components, ...)
- Ghi vào `golden/ai-accuracy-report.csv`

**Công cụ:** `scripts/so-sanh-ai-vs-nguoi.py` — tự động so sánh 3 trường số giữa AI và người, xuất CSV. Chạy sau khi cả hai nguồn có dữ liệu.

## Trạng thái hiện tại (09/12)

- [x] **Quy tắc ước tính đã được chấp nhận** — BO_ANH_VANG.md mục 7 cập nhật 09/12: "Ảnh nào không chốt được số chính xác vẫn giữ lại, ghi chú rõ là ước tính"
- [x] **8 ảnh đã gán nhãn:** g001, g002, g008, g009, g010, g011, g013, g014 — tất cả đều có `labeled_by` (chờ `labeled_at`)
- [x] **Ma trận chọn công nghệ hoàn chỉnh** — 3 engine trên 4 ảnh: local_cv (conf 55), openai_structured (conf 85-90), openai_direct (conf 90-95). openai_direct đề xuất cho production. Xem `scripts/so-sanh-engine.py`
- [ ] Người A hoàn thành phần còn lại (KHÔNG xem AI)
- [ ] Người B kiểm chứng (sau khi Người A xong)
- [ ] So sánh AI vs Người (đã có công cụ)
- [ ] Hoàn thiện manifest.csv (đã có đủ 100 dòng metadata, chỉ thiếu labeled_by/verified_by)
