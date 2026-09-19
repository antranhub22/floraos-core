# So sánh GPT-5.6 với mô hình đang chạy — M01 Vision

Ô đo được: 53 · ô lỗi: 3 · tỉ giá 26.300 đ/USD  

## Chi phí và tốc độ

| Cơ chế | Mô hình | Suy luận | Ảnh | USD/ảnh | VNĐ/ảnh | Giây/ảnh | Token vào | Token ra | Token suy luận | Lượt gọi | Đầy trường |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Đầy đủ | gpt-4o | - | 4 | 0.02320 | 610 | 6.7 | 7.514 | 812 | 0 | 1.00 | 92.9% |
| Đầy đủ | gpt-5.6-luna | high | 4 | 0.01670 | 439 | 76.3 | 11.956 | 12.478 | 9.514 | 1.50 | 89.7% |
| Đầy đủ | gpt-5.6-luna | low | 4 | 0.00700 | 184 | 26.6 | 9.956 | 4.139 | 2.184 | 1.25 | 90.6% |
| Đầy đủ | gpt-5.6-sol | high | 1 | 0.15620 | 4.108 | 218.2 | 7.968 | 6.215 | 4.965 | 1.00 | 89.7% |
| Đầy đủ | gpt-5.6-sol | low | 4 | 0.10970 | 2.885 | 64.1 | 9.956 | 3.496 | 1.752 | 1.25 | 89.1% |
| Đầy đủ | gpt-5.6-terra | high | 4 | 0.10490 | 2.759 | 98.6 | 9.970 | 7.633 | 5.710 | 1.25 | 88.2% |
| Đầy đủ | gpt-5.6-terra | low | 4 | 0.06180 | 1.625 | 49.3 | 9.956 | 3.491 | 1.860 | 1.25 | 89.4% |
| Gọn | gpt-4o-mini | - | 4 | 0.00460 | 121 | 9.7 | 29.456 | 738 | 0 | 1.00 | 89.0% |
| Gọn | gpt-5.6-luna | high | 4 | 0.00830 | 218 | 36.9 | 5.176 | 6.053 | 4.764 | 1.00 | 89.7% |
| Gọn | gpt-5.6-luna | low | 4 | 0.00280 | 74 | 9.5 | 5.176 | 1.511 | 178 | 1.00 | 89.6% |
| Gọn | gpt-5.6-sol | high | 4 | 0.14780 | 3.887 | 130.2 | 5.176 | 6.354 | 4.753 | 1.00 | 89.4% |
| Gọn | gpt-5.6-sol | low | 4 | 0.05590 | 1.470 | 33.3 | 5.176 | 1.761 | 366 | 1.00 | 89.5% |
| Gọn | gpt-5.6-terra | high | 4 | 0.06360 | 1.673 | 52.2 | 5.176 | 4.435 | 3.016 | 1.00 | 89.3% |
| Gọn | gpt-5.6-terra | low | 4 | 0.03080 | 810 | 18.2 | 5.176 | 1.703 | 401 | 1.00 | 89.5% |

## Kết quả phân tích — từng ảnh

### g001 — nhãn người: {'bud_count': 3, 'damaged_count': 0}

| Cơ chế | Mô hình | Suy luận | Hoa | Nụ | Hỏng | Dòng hoa | Dòng lá | Phụ kiện | Lớp gói | Dáng | Tin cậy |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Đầy đủ | gpt-4o | - | 20 | 0 | 0 | 3 | 2 | 0 | 1 | Bán cầu | 85 |
| Đầy đủ | gpt-5.6-luna | high | 29 | 4 | 0 | 6 | 5 | 1 | 0 | Bán cầu | 82 |
| Đầy đủ | gpt-5.6-luna | low | 58 | 4 | 0 | 6 | 5 | 1 | 0 | Bán cầu | 86 |
| Đầy đủ | gpt-5.6-sol | low | 25 | 7 | 0 | 6 | 4 | 1 | 0 | Bán cầu | 87 |
| Đầy đủ | gpt-5.6-terra | high | 36 | 0 | 0 | 6 | 4 | 1 | 0 | Toả tia | 87 |
| Đầy đủ | gpt-5.6-terra | low | 19 | 0 | 0 | 6 | 4 | 1 | 0 | Toả tia | 85 |
| Gọn | gpt-4o-mini | - | 20 | 0 | 0 | 4 | 2 | 2 | 1 | Tròn | 90 |
| Gọn | gpt-5.6-luna | high | 22 | 2 | 0 | 5 | 4 | 2 | 0 | Tự do | 80 |
| Gọn | gpt-5.6-luna | low | 24 | 2 | 0 | 5 | 4 | 1 | 0 | Tự do | 84 |
| Gọn | gpt-5.6-sol | high | 29 | 10 | 0 | 6 | 5 | 2 | 0 | Toả tia | 76 |
| Gọn | gpt-5.6-sol | low | 31 | 6 | 0 | 6 | 5 | 1 | 2 | Tự do | 84 |
| Gọn | gpt-5.6-terra | high | 35 | 2 | 0 | 7 | 5 | 1 | 1 | Toả tia | 70 |
| Gọn | gpt-5.6-terra | low | 26 | 0 | 0 | 6 | 4 | 1 | 0 | Toả tia | 80 |

### g002 — nhãn người: {'damaged_count': 0}

| Cơ chế | Mô hình | Suy luận | Hoa | Nụ | Hỏng | Dòng hoa | Dòng lá | Phụ kiện | Lớp gói | Dáng | Tin cậy |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Đầy đủ | gpt-4o | - | 35 | 0 | 0 | 2 | 1 | 1 | 1 | Bán cầu | 85 |
| Đầy đủ | gpt-5.6-luna | high | 36 | 0 | 0 | 3 | 2 | 3 | 0 | Bán cầu | 84 |
| Đầy đủ | gpt-5.6-luna | low | 29 | 0 | 0 | 3 | 3 | 3 | 0 | Tự do | 87 |
| Đầy đủ | gpt-5.6-sol | high | 34 | 15 | 0 | 2 | 2 | 3 | 0 | Bán cầu | 88 |
| Đầy đủ | gpt-5.6-sol | low | 37 | 1 | 0 | 2 | 2 | 2 | 0 | Bán cầu | 89 |
| Đầy đủ | gpt-5.6-terra | high | 39 | 2 | 0 | 4 | 2 | 2 | 0 | Bán cầu | 77 |
| Đầy đủ | gpt-5.6-terra | low | 38 | 0 | 0 | 4 | 2 | 3 | 0 | Bán cầu | 87 |
| Gọn | gpt-4o-mini | - | 20 | 0 | 0 | 2 | 1 | 2 | 1 | Tròn | 90 |
| Gọn | gpt-5.6-luna | high | 29 | 8 | 0 | 2 | 2 | 2 | 1 | Bán cầu | 64 |
| Gọn | gpt-5.6-luna | low | 22 | 0 | 0 | 2 | 2 | 3 | 0 | Bán cầu | 82 |
| Gọn | gpt-5.6-sol | high | 29 | 1 | 0 | 2 | 3 | 3 | 0 | Bán cầu | 76 |
| Gọn | gpt-5.6-sol | low | 37 | 19 | 0 | 2 | 2 | 4 | 1 | Bán cầu | 87 |
| Gọn | gpt-5.6-terra | high | 37 | 0 | 0 | 3 | 2 | 3 | 0 | Bán cầu | 70 |
| Gọn | gpt-5.6-terra | low | 36 | 0 | 0 | 3 | 2 | 3 | 1 | Bán cầu | 83 |

### g009 — nhãn người: {'bud_count': 0, 'damaged_count': 0}

| Cơ chế | Mô hình | Suy luận | Hoa | Nụ | Hỏng | Dòng hoa | Dòng lá | Phụ kiện | Lớp gói | Dáng | Tin cậy |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Đầy đủ | gpt-4o | - | 40 | 5 | 0 | 1 | 1 | 1 | 1 | Bán cầu | 90 |
| Đầy đủ | gpt-5.6-luna | high | 34 | 4 | 0 | 2 | 1 | 2 | 2 | Bán cầu | 77 |
| Đầy đủ | gpt-5.6-luna | low | 51 | 5 | 0 | 2 | 1 | 1 | 2 | Tròn | 80 |
| Đầy đủ | gpt-5.6-sol | low | 41 | 3 | 0 | 2 | 2 | 2 | 0 | Bán cầu | 80 |
| Đầy đủ | gpt-5.6-terra | high | — | — | 0 | 1 | 1 | 1 | 0 | Bán cầu | 76 |
| Đầy đủ | gpt-5.6-terra | low | 74 | 2 | 0 | 1 | 1 | 3 | 0 | Bán cầu | 80 |
| Gọn | gpt-4o-mini | - | 30 | 0 | 0 | 1 | 1 | 2 | 1 | Tròn | 90 |
| Gọn | gpt-5.6-luna | high | 24 | 3 | 0 | 1 | 2 | 2 | 1 | Bán cầu | 62 |
| Gọn | gpt-5.6-luna | low | 28 | 4 | 0 | 1 | 1 | 2 | 2 | Bán cầu | 72 |
| Gọn | gpt-5.6-sol | high | 22 | 2 | 0 | 1 | 2 | 3 | 2 | Bán cầu | 68 |
| Gọn | gpt-5.6-sol | low | 24 | 5 | 0 | 1 | 2 | 3 | 2 | Bán cầu | 80 |
| Gọn | gpt-5.6-terra | high | 26 | — | 0 | 1 | 1 | 3 | 2 | Bán cầu | 70 |
| Gọn | gpt-5.6-terra | low | 37 | 8 | 0 | 2 | 1 | 3 | 0 | Bán cầu | 67 |

### g010 — nhãn người: {'bud_count': 0, 'damaged_count': 0}

| Cơ chế | Mô hình | Suy luận | Hoa | Nụ | Hỏng | Dòng hoa | Dòng lá | Phụ kiện | Lớp gói | Dáng | Tin cậy |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Đầy đủ | gpt-4o | - | 75 | 0 | 0 | 3 | 1 | 1 | 1 | Vòng tròn | 90 |
| Đầy đủ | gpt-5.6-luna | high | 66 | 0 | 0 | 5 | 1 | 2 | 2 | Vòng tròn | 80 |
| Đầy đủ | gpt-5.6-luna | low | 51 | 3 | 0 | 5 | 2 | 3 | 2 | Vòng tròn | 82 |
| Đầy đủ | gpt-5.6-sol | low | 39 | 0 | 1 | 5 | 1 | 5 | 0 | Tròn | 82 |
| Đầy đủ | gpt-5.6-terra | high | 73 | 0 | 0 | 5 | 1 | 3 | 2 | Vòng tròn | 80 |
| Đầy đủ | gpt-5.6-terra | low | 44 | 0 | 0 | 4 | 1 | 3 | 0 | Vòng tròn | 85 |
| Gọn | gpt-4o-mini | - | 35 | 0 | 0 | 3 | 1 | 2 | 1 | Tròn | 90 |
| Gọn | gpt-5.6-luna | high | 43 | 8 | 0 | 4 | 2 | 2 | 4 | Vòng tròn | 78 |
| Gọn | gpt-5.6-luna | low | 53 | 4 | 0 | 5 | 2 | 2 | 3 | Vòng tròn | 78 |
| Gọn | gpt-5.6-sol | high | 79 | 0 | 0 | 5 | 2 | 4 | 4 | Vòng tròn | 70 |
| Gọn | gpt-5.6-sol | low | 68 | 4 | 0 | 5 | 2 | 3 | 4 | Vòng tròn | 68 |
| Gọn | gpt-5.6-terra | high | 90 | 0 | 0 | 4 | 1 | 3 | 3 | Vòng tròn | 58 |
| Gọn | gpt-5.6-terra | low | 61 | 0 | 0 | 5 | 1 | 2 | 3 | Vòng tròn | 72 |

## Ô lỗi

- `day-du|gpt-5.6-sol|high|g001` — APITimeoutError: Request timed out.
- `day-du|gpt-5.6-sol|high|g009` — APITimeoutError: Request timed out.
- `day-du|gpt-5.6-sol|high|g010` — APITimeoutError: Request timed out.

