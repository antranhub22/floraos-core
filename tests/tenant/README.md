# Test cách ly tenant

Chạy bằng `npm run test:tenant`. Bắt buộc xanh trước mọi merge.

Hình dạng của bộ test: với mỗi endpoint, dựng hai tổ chức và gọi endpoint của tổ chức A bằng ngữ cảnh phiên của tổ chức B. Kết quả phải là không tìm thấy — không phải lỗi quyền, vì lỗi quyền đã tiết lộ rằng bản ghi có tồn tại.

Phải phủ: route đọc, route ghi, route duyệt, đường dẫn lưu trữ, và dòng job từ lúc tạo tới lúc worker đọc.

Bộ test thuộc P1. Đến khi có, `npm run test:tenant` cố tình thất bại thay vì báo xanh giả.
