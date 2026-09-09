# Nợ kỹ thuật

Mỗi dòng: điều đang nợ, vì sao chấp nhận, và điều kiện trả.

| # | Nợ | Vì sao chấp nhận | Trả khi nào |
|---|---|---|---|
| 1 | `npm run test:tenant` cố tình thất bại | Cổng merge báo xanh khi chưa kiểm gì thì tệ hơn không có cổng | P1 — thay bằng bộ test thật |
| 2 | Tài liệu kiến trúc V2 ghi 26 mã trần cứng, mã nguồn có 18 | Sửa tài liệu Level 1 cần chủ sản phẩm xác nhận, không tự sửa | Khi chủ sản phẩm xác nhận con số đúng |
| 3 | Tài liệu V2 ghi dải `E1–E7`, mã nguồn là `E1–E8` | Như trên | Cùng lúc với dòng 2 |
| 4 | `HARVEST_MANIFEST.md` xếp `count_engine.py` là EXTEND với lý do không đúng mã thật | Bản đồ thu hoạch là tài liệu đã duyệt | Khi cập nhật bản đồ theo `RA_SOAT_THU_HOACH.md` |
| 5 | `bom.wrapping` trong hợp đồng Vision không có trường `quantity`, nhưng quy ước đếm yêu cầu đếm bao bì | Hợp đồng chỉ được thêm trường, và việc thêm cần xác nhận đếm cái gì | P5 — thêm `quantity` vào `wrapping`, hoặc sửa quy ước đếm |
| 6 | Không có bộ chọn chi nhánh trên giao diện | Bản đầu phục vụ một cửa hàng; RBAC vẫn đỡ sẵn phạm vi chi nhánh | Khi có tổ chức Chuỗi thật dùng hệ thống |
| 7 | `LocalBudd` ở Prisma 5, core ở Prisma 7 | Core theo bản mới; nâng `LocalBudd` giữa lúc đang phát triển M05/M06 là xáo trộn không cần thiết | P7, khi hai repo nối nhau |
| 8 | Quyết định D3 chưa chốt; đang chạy theo mặc định hoàn credit khi `REJECTED` | Lược đồ đỡ cả hai hướng, đổi chỉ là đổi một giá trị | P3 |
| 9 | Hạn mức tính bằng truy vấn tổng hợp trên `usage` mỗi lần tạo job | Đơn giản và đúng; chỉ thành vấn đề khi bảng lớn | Khi một tổ chức vượt vài trăm nghìn dòng usage |
