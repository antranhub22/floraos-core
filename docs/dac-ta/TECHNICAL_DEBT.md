# Nợ kỹ thuật

| # | Nợ | Vì sao chấp nhận | Trả khi nào |
|---|---|---|---|
| 1 | `npm run test:tenant` cố tình thất bại | Cổng merge báo xanh khi chưa kiểm gì thì tệ hơn không có cổng | P1 |
| 2 | `bom.wrapping` chưa có trường `quantity`, nhưng quy ước đếm yêu cầu đếm số lớp giấy gói | Hợp đồng Vision chỉ được thêm trường; việc thêm thuộc phạm vi M01 | P5 |
| 3 | Không có bộ chọn chi nhánh trên giao diện | Bản đầu phục vụ một cửa hàng; RBAC vẫn đỡ sẵn phạm vi chi nhánh | Khi có tổ chức Chuỗi thật |
| 4 | `LocalBudd` ở Prisma 5, core ở Prisma 7 | Nâng `LocalBudd` giữa lúc M05/M06 đang chạy là xáo trộn không cần thiết | P7 |
| 5 | Hạn mức tính bằng truy vấn tổng hợp trên `usage` mỗi lần tạo job | Đơn giản và đúng; chỉ thành vấn đề khi bảng lớn | Khi một tổ chức vượt vài trăm nghìn dòng usage |
| 6 | `ORG_docx` của `LocalBudd` vẫn mô tả năm bảng sẽ chuyển sang core | Sửa cả 12 tệp giữa lúc M05/M06 đang chạy là xáo trộn; đã dán một trang cảnh báo ở đầu | P7 |

Đã trả ngày 09/09: con số trần cứng (18) · dải mã `E1–E8` · đường dẫn `maChucNang.ts` · hạng thu hoạch `count_engine` và `color_engine` · quyết định D1, D2, D3, D4.
