# Hướng dẫn gán nhãn bộ ảnh vàng

## Mục đích
Đánh giá độc lập 100 ảnh hoa. Kết quả dùng làm **đáp án chuẩn** để chấm điểm accuracy của `count_engine`/`color_engine` và quyết định bộ máy phân tích nào chạy tốt hơn.

## Ai làm
- **Người A**: Đánh giá tất cả 100 ảnh (độc lập, KHÔNG xem ai khác)
- **Người B**: Kiểm chứng (30% toàn bộ, 70% ngẫu nhiên)

## Ưu tiên chất lượng
Chậm hơn một chút nhưng chính xác hơn. Đừng vội.

## Chuẩn bị
1. Đọc `golden/QUY_UOC_DEM.md` — 6 quy ước đếm, 4 trường số
2. Mở ảnh trong `golden/images/gNNN.jpeg`
3. Điền vào `golden/labels/gNNN.json` (template sẵn có)
4. Không xem `golden/ai-proposals/` khi đánh giá

## Các trường cần điền

| Trường | Ý nghĩa | Ví dụ |
|---|---|---|
| `flower_count` | Số cành hoa nhìn thấy | 17 |
| `bud_count` | Số nụ chưa nở | 3 |
| `damaged_count` | Số cành hỏng (đã tính trong flower_count) | 1 |
| `order_count` | Số trên đơn hàng (để trống nếu không biết) | 20 |
| `components` | Danh sách cấu phần (hoa, nụ, lá, gói) | xem ví dụ |
| `notes` | Ghi chú đặc biệt | "Có người cầm bên phải" |

## Quy ước đếm (đọc kỹ `QUY_UOC_DEM.md`)
- **Đơn vị**: Cành (không phải bông)
- **Nụ chưa nở**: đếm riêng vào `bud_count`
- **Lá/cành trang trí**: ghi tên, `quantity` để trống
- **Hoa hỏng**: vẫn tính, ghi ở `damaged_count`

## Ví dụ một dòng `components`
```json
{
  "canonical_component": "hoa-hong-do",
  "category": "flower",
  "count": 17,
  "color": "do"
}
```

## Các danh mục cấu phần
- `flower` — hoa
- `bud` — nụ
- `foliage` — lá, cành trang trí
- `packaging` — giấy gói, ruy băng, giỏ, hộp

## Xác nhận
Khi hoàn thành 100 ảnh:
1. Ghi `labeled_by` [tên bạn]
2. Ghi `labeled_at` [ngày]
3. Gửi cho Người B kiểm tra

## Lỗi thường gặp
- Nhầm bông với cành → đếm theo cành
- Quên nụ → đếm riêng
- Tính hoa hỏng hai lần → damaged_count đã nằm trong flower_count
- Đếm quá nhanh → chậm lại, đếm kỹ hơn
