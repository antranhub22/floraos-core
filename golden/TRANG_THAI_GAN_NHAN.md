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
