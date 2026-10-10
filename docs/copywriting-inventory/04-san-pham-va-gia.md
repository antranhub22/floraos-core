# BẢN ĐỒ NỘI DUNG UI — 04. SẢN PHẨM & GIÁ (`/san-pham`)

> **Màn hình**: Quản Trị Kho Mẫu Hoa & Bảng Giá  
> **Tuyến đường**: `/san-pham`  
> **Mã phân hệ**: `PRODUCT`  
> **Trạng thái**: Chờ PO duyệt & chuẩn hóa câu chữ mới.

---

## 1. Thanh tiêu đề & Tác vụ góc trên phải (Top Action Header)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PROD-HDR-01` | `HDR` | Phân nhóm tiêu đề | `Kho sản phẩm của hàng` | | Nhãn nhỏ phía trên |
| `PROD-HDR-02` | `HDR` | Tiêu đề chính `H1` | `Mẫu hoa` | | Tiêu đề lớn |
| `PROD-BTN-01` | `BTN` | Nút làm mới | `Tải lại danh sách` | | Kèm icon `RefreshCw` |
| `PROD-BTN-02` | `BTN` | Nút nhập hàng loạt | `Nhập Excel & Ảnh` | | Điều hướng sang `/san-pham/nhap-hang-loat` |
| `PROD-BTN-03` | `BTN` | Nút quét AI | `Phân tích AI` | | Điều hướng sang `/tai-anh` |
| `PROD-BTN-04` | `BTN` | Nút tạo thủ công | `Thêm sản phẩm` | | Điều hướng sang `/san-pham/tao-moi` |

---

## 2. Thanh tìm kiếm & Bộ lọc đa chiều (`ProductSearchFilterBar`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PROD-PH-01`  | `PH`  | Ô tìm kiếm hoa | `Tìm kiếm mẫu hoa theo tên, mã sản phẩm...` | | Gợi ý ô search |
| `PROD-CAT-01` | `LBL` | Danh mục: Tất cả | `Tất cả danh mục` | | Dropdown danh mục |
| `PROD-CAT-02` | `LBL` | Danh mục: Bó hoa | `Bó hoa` | | Dropdown |
| `PROD-CAT-03` | `LBL` | Danh mục: Giỏ hoa | `Giỏ hoa` | | Dropdown |
| `PROD-CAT-04` | `LBL` | Danh mục: Kệ hoa | `Kệ khai trương` | | Dropdown |
| `PROD-CAT-05` | `LBL` | Danh mục: Bình hoa | `Bình hoa` | | Dropdown |
| `PROD-CAT-06` | `LBL` | Danh mục: Hộp hoa | `Hộp hoa` | | Dropdown |
| `PROD-OCC-01` | `LBL` | Dịp lễ: Khai trương | `Khai trương` | | Bộ lọc dịp tặng |
| `PROD-OCC-02` | `LBL` | Dịp lễ: Sinh nhật | `Sinh nhật` | | Bộ lọc dịp tặng |
| `PROD-OCC-03` | `LBL` | Dịp lễ: Tình yêu | `Tình yêu / Valentine` | | Bộ lọc dịp tặng |
| `PROD-OCC-04` | `LBL` | Dịp lễ: Chia buồn | `Chia buồn` | | Bộ lọc dịp tặng |
| `PROD-PRC-01` | `LBL` | Khoảng giá: < 500k | `Dưới 500.000 đ` | | Lọc giá |
| `PROD-PRC-02` | `LBL` | Khoảng giá: 500k-1M | `500.000 đ - 1.000.000 đ` | | Lọc giá |
| `PROD-PRC-03` | `LBL` | Khoảng giá: 1M-2M | `1.000.000 đ - 2.000.000 đ` | | Lọc giá |
| `PROD-PRC-04` | `LBL` | Khoảng giá: > 2M | `Trên 2.000.000 đ` | | Lọc giá |

---

## 3. Thẻ sản phẩm & Trạng thái (`ProductCard`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PROD-BDG-01` | `BDG` | Trạng thái: Đang bán | `Đang bán` | | Huy hiệu màu xanh lá |
| `PROD-BDG-02` | `BDG` | Trạng thái: Nháp | `Bản nháp` | | Huy hiệu màu vàng |
| `PROD-BDG-03` | `BDG` | Trạng thái: Lưu trữ | `Đã lưu trữ` | | Huy hiệu màu xám |
| `PROD-ACT-01` | `BTN` | Thao tác xóa | `Đưa vào thùng rác` | | Chỉ hiện cho Điều hành |
| `PROD-BTN-05` | `BTN` | Chân trang phân trang | `Tải thêm sản phẩm` | | Khi còn sản phẩm tiếp theo |

---

## 4. Modal xác nhận xóa sản phẩm (`TrashConfirmModal`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PROD-DEL-01` | `HDR` | Tiêu đề modal | `Xác nhận chuyển vào thùng rác` | | Popup cảnh báo |
| `PROD-DEL-02` | `LBL` | Nội dung cảnh báo | `Mẫu hoa này sẽ bị ẩn khỏi danh sách bán và catalog. Bạn có thể khôi phục sau trong phần Thùng rác.` | | Giải thích nghiệp vụ |
| `PROD-DEL-03` | `BTN` | Nút hủy | `Giữ lại` | | Đóng popup |
| `PROD-DEL-04` | `BTN` | Nút đồng ý | `Đồng ý chuyển` | | Xác nhận xóa tạm |
