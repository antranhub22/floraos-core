# BẢN ĐỒ NỘI DUNG UI — 04. SẢN PHẨM & GIÁ (`/san-pham`)

> **Màn hình**: Quản Trị Kho Mẫu Hoa & Bảng Giá  
> **Tuyến đường**: `/san-pham`  
> **Mã phân hệ**: `PRODUCT`  
> **Trạng thái**: Đã chuẩn hóa 100% theo Từ điển SSOT.

---

## 1. Thanh tiêu đề & Tác vụ góc trên phải (Top Action Header)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PROD-HDR-01` | `HDR` | Phân nhóm tiêu đề | `Kho sản phẩm của hàng` | `Kho mẫu hoa` | Sửa lỗi chính tả "của hàng" (P0) |
| `PROD-HDR-02` | `HDR` | Tiêu đề chính `H1` | `Mẫu hoa` | `Mẫu hoa` | Tiêu đề lớn |
| `PROD-BTN-01` | `BTN` | Nút làm mới | `Tải lại danh sách` | `Làm mới` | Thống nhất "Làm mới" theo từ điển |
| `PROD-BTN-02` | `BTN` | Nút nhập hàng loạt | `Nhập Excel & Ảnh` | `Nhập từ Excel` | Tên ngắn gọn |
| `PROD-BTN-03` | `BTN` | Nút quét AI | `Phân tích AI` | `Quét ảnh hoa` | Đồng bộ tên màn hình `/tai-anh` |
| `PROD-BTN-04` | `BTN` | Nút tạo thủ công | `Thêm sản phẩm` | `Thêm mẫu hoa` | Thống nhất đối tượng "mẫu hoa" |

---

## 2. Thanh tìm kiếm & Bộ lọc đa chiều (`ProductSearchFilterBar`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PROD-PH-01`  | `PH`  | Ô tìm kiếm hoa | `Tìm kiếm mẫu hoa theo tên, mã sản phẩm...` | `Tìm theo tên hoặc mã mẫu hoa…` | Gợi ý tìm kiếm ngắn gọn |
| `PROD-CAT-01` | `LBL` | Danh mục: Tất cả | `Tất cả danh mục` | `Tất cả danh mục` | Dropdown danh mục |
| `PROD-CAT-02` | `LBL` | Danh mục: Bó hoa | `Bó hoa` | `Bó hoa` | Dropdown |
| `PROD-CAT-03` | `LBL` | Danh mục: Giỏ hoa | `Giỏ hoa` | `Giỏ hoa` | Dropdown |
| `PROD-CAT-04` | `LBL` | Danh mục: Kệ hoa | `Kệ khai trương` | `Kệ hoa khai trương` | Đồng bộ với form tạo mới |
| `PROD-CAT-05` | `LBL` | Danh mục: Bình hoa | `Bình hoa` | `Bình hoa` | Dropdown |
| `PROD-CAT-06` | `LBL` | Danh mục: Hộp hoa | `Hộp hoa` | `Hộp hoa` | Dropdown |
| `PROD-CAT-07` | `LBL` | Danh mục: Chia buồn | `-` | `Hoa chia buồn` | Bổ sung đồng bộ với form tạo |
| `PROD-OCC-01` | `LBL` | Dịp lễ: Khai trương | `Khai trương` | `Khai trương` | Bộ lọc dịp tặng hoa |
| `PROD-OCC-02` | `LBL` | Dịp lễ: Sinh nhật | `Sinh nhật` | `Sinh nhật` | Bộ lọc dịp tặng hoa |
| `PROD-OCC-03` | `LBL` | Dịp lễ: Tình yêu | `Tình yêu / Valentine` | `Tình yêu và Valentine` | Dùng "và" thay cho gạch chéo |
| `PROD-OCC-04` | `LBL` | Dịp lễ: Chia buồn | `Chia buồn` | `Chia buồn` | Bộ lọc dịp tặng hoa |
| `PROD-OCC-05` | `LBL` | Dịp lễ: 8/3 & 20/10 | `-` | `Ngày 8/3 và 20/10` | Bổ sung theo PO Decision 4 |
| `PROD-OCC-06` | `LBL` | Dịp lễ: 20/11 | `-` | `Ngày 20/11` | Bổ sung theo PO Decision 4 |
| `PROD-OCC-07` | `LBL` | Dịp lễ: Tốt nghiệp | `-` | `Tốt nghiệp` | Bổ sung theo PO Decision 4 |
| `PROD-PRC-01` | `LBL` | Khoảng giá: < 500k | `Dưới 500.000 đ` | `Dưới 500.000 ₫` | Đơn vị tiền tệ chuẩn `₫` |
| `PROD-PRC-02` | `LBL` | Khoảng giá: 500k-1M | `500.000 đ - 1.000.000 đ` | `500.000–1.000.000 ₫` | Đơn vị tiền tệ chuẩn `₫` |
| `PROD-PRC-03` | `LBL` | Khoảng giá: 1M-2M | `1.000.000 đ - 2.000.000 đ` | `1.000.000–2.000.000 ₫` | Đơn vị tiền tệ chuẩn `₫` |
| `PROD-PRC-04` | `LBL` | Khoảng giá: > 2M | `Trên 2.000.000 đ` | `Trên 2.000.000 ₫` | Đơn vị tiền tệ chuẩn `₫` |

---

## 3. Thẻ sản phẩm & Trạng thái (`ProductCard`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PROD-BDG-01` | `BDG` | Trạng thái: Đang bán | `Đang bán` | `Đang bán` | Huy hiệu màu xanh lá |
| `PROD-BDG-02` | `BDG` | Trạng thái: Nháp | `Bản nháp` | `Bản nháp` | Huy hiệu màu vàng |
| `PROD-BDG-03` | `BDG` | Trạng thái: Lưu trữ | `Đã lưu trữ` | `Đã lưu trữ` | Huy hiệu màu xám |
| `PROD-ACT-01` | `BTN` | Thao tác xóa | `Đưa vào thùng rác` | `Chuyển vào thùng rác` | Rõ nghĩa xóa mềm 30 ngày |
| `PROD-BTN-05` | `BTN` | Chân trang phân trang | `Tải thêm sản phẩm` | `Xem thêm mẫu hoa` | Thống nhất từ "mẫu hoa" |

---

## 4. Modal xác nhận xóa sản phẩm (`TrashConfirmModal`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PROD-DEL-01` | `HDR` | Tiêu đề modal | `Xác nhận chuyển vào thùng rác` | `Chuyển “{{name}}” vào thùng rác?` | Nêu rõ tên mẫu hoa được xóa |
| `PROD-DEL-02` | `LBL` | Nội dung cảnh báo | `Mẫu hoa này sẽ bị ẩn khỏi danh sách bán và catalog. Bạn có thể khôi phục sau trong phần Thùng rác.` | `Mẫu hoa sẽ được ẩn khỏi danh sách bán và bộ sưu tập. Bạn có thể khôi phục trong Thùng rác trong vòng 30 ngày.` | Nêu rõ hệ quả và thời hạn 30 ngày |
| `PROD-DEL-03` | `BTN` | Nút hủy | `Giữ lại` | `Hủy` | Chuẩn nút hủy |
| `PROD-DEL-04` | `BTN` | Nút đồng ý | `Đồng ý chuyển` | `Chuyển vào thùng rác` | Động từ hành động rõ ràng |
