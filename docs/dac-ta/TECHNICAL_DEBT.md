# Nợ kỹ thuật

| # | Nợ | Vì sao chấp nhận | Trả khi nào |
|---|---|---|---|
| 2 | `bom.wrapping` chưa có trường `quantity`, nhưng quy ước đếm yêu cầu đếm số lớp giấy gói | Hợp đồng Vision chỉ được thêm trường; việc thêm thuộc phạm vi M01 | P5 |
| 3 | Không có bộ chọn chi nhánh trên giao diện | Bản đầu phục vụ một cửa hàng; RBAC vẫn đỡ sẵn phạm vi chi nhánh | Khi có tổ chức Chuỗi thật |
| 4 | `LocalBudd` ở Prisma 5, core ở Prisma 7 | Nâng `LocalBudd` giữa lúc M05/M06 đang chạy là xáo trộn không cần thiết | P7 |
| 5 | Hạn mức tính bằng truy vấn tổng hợp trên `usage` mỗi lần tạo job | Đơn giản và đúng; chỉ thành vấn đề khi bảng lớn | Khi một tổ chức vượt vài trăm nghìn dòng usage |
| 6 | `ORG_docx` của `LocalBudd` vẫn mô tả năm bảng sẽ chuyển sang core | Sửa cả 12 tệp giữa lúc M05/M06 đang chạy là xáo trộn; đã dán một trang cảnh báo ở đầu | P7 |
| 7 | Vai hệ thống không có ràng buộc duy nhất ở tầng cơ sở dữ liệu | `@@unique([organization_id, key])` không chặn được trùng khi `organization_id` là NULL — Postgres coi mọi NULL là phân biệt, và Prisma 7 chưa khai được `NULLS NOT DISTINCT`. Hiện chặn bằng khoá tư vấn trong `ensureSystemRoles`, có test khoá | Khi Prisma khai được chỉ mục duy nhất riêng phần, hoặc khi vai hệ thống chuyển thành hằng trong mã ở P2 |
| 8 | Bốn bảng thuộc tenant chưa có khoá ngoại về `organizations` | Lược đồ ở đặc tả 07 mục 3 khai `organization_id` là cột thường; bộ gác và bộ test cách ly đang giữ tính đúng đắn | Cùng đợt với P3, khi số bảng thuộc tenant tăng gấp đôi |
| 9 | Người mở tổ chức nhận vai `dieu_hanh`, không phải `experience_user` | Vai `experience_user` chỉ có `K1` và `K2` nên người vừa đăng ký sẽ không đọc nổi tổ chức của chính mình. Đây là một dòng hằng ở `domain/system-roles.ts` | P10, khi Experience Mode chốt ai nhận vai nào |
| 10 | Chưa giới hạn tần suất trên endpoint đăng nhập (`YC-S5`) | Cần một kho đếm dùng chung mà bản này chưa có | P12 |

Đã trả ngày 09/09 (P1): nợ #1 — `npm run test:tenant` nay xanh thật trên bộ test cách ly, tệp thất bại có chủ đích đã gỡ.

Đã trả ngày 09/09: con số trần cứng (18) · dải mã `E1–E8` · đường dẫn `maChucNang.ts` · hạng thu hoạch `count_engine` và `color_engine` · quyết định D1, D2, D3, D4.
