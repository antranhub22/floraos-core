# Ngữ cảnh tenant

Nội dung của thư mục này thuộc **P1**, pha đầu tiên sau khi dựng khung.

Ba thứ phải có trước khi bất kỳ module nào tạo bảng thật:

1. Giải `organization_id` từ phiên đăng nhập phía máy chủ. Không có đường nào nhận giá trị này từ body hay query của client.
2. Bộ gác truy vấn ở **tầng repository**, không ở route. Route quên kiểm là chuyện thường; repository quên kiểm là lỗ hổng.
3. Bộ test cách ly chạy trong CI: mỗi endpoint bị thử với ngữ cảnh tổ chức khác và phải trả về không tìm thấy. Xem `tests/tenant/`.
