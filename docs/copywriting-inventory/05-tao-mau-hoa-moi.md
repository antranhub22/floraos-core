# BẢN ĐỒ NỘI DUNG UI — 05. TẠO MẪU HOA MỚI (`/san-pham/tao-moi`)

> **Màn hình**: Tạo Mẫu Hoa Mới & Công Thức Thành Phần (BOM)  
> **Tuyến đường**: `/san-pham/tao-moi`  
> **Mã phân hệ**: `CREATE`  
> **Trạng thái**: Chờ PO duyệt & chuẩn hóa câu chữ mới.

---

## 1. Thanh tiêu đề & Tác vụ lưu (Header & Action)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `CRT-HDR-01` | `HDR` | Breadcrumb | `Quay lại Sản phẩm & Giá` | | Link về `/san-pham` |
| `CRT-HDR-02` | `HDR` | Tiêu đề chính trang | `Tạo Mẫu Hoa Mới` | | Tiêu đề `H1` |
| `CRT-HDR-03` | `HDR` | Mô tả phụ trang | `Khai báo công thức thành phần hoa (BOM), kiểu dáng và bảng giá niêm yết` | | Hướng dẫn nhập liệu |
| `CRT-BTN-01` | `BTN` | Nút lưu nháp | `Lưu bản nháp` | | Chưa công khai cho khách |
| `CRT-BTN-02` | `BTN` | Nút lưu & xuất bản | `Lưu & Xuất bản` | | Nút chính màu đỏ |

---

## 2. Cột trái: Tải ảnh & Mã sản phẩm

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `CRT-IMG-01` | `LBL` | Tiêu đề ô tải ảnh | `Ảnh đại diện mẫu hoa *` | | Khối upload |
| `CRT-IMG-02` | `LBL` | Dòng hướng dẫn kéo thả | `Kéo thả ảnh vào đây hoặc bấm để chọn tệp` | | PNG, JPG, WebP |
| `CRT-IMG-03` | `LBL` | Giới hạn dung lượng | `Hỗ trợ JPG, PNG, WebP tối đa 10MB` | | Chú thích định dạng |
| `CRT-IMG-04` | `BTN` | Nút đổi ảnh | `Thay đổi ảnh` | | Khi đã có ảnh xem trước |
| `CRT-IMG-05` | `BTN` | Nút xóa ảnh | `Xóa ảnh` | | Gỡ ảnh đã tải |
| `CRT-LBL-01` | `LBL` | Nhãn mã sản phẩm | `Mã sản phẩm *` | | Tự động sinh `FL-xxxx` |
| `CRT-PH-01`  | `PH`  | Ô mã sản phẩm | `VD: BH-001, GH-102` | | Gợi ý mã riêng của tiệm |
| `CRT-LBL-02` | `LBL` | Nhãn trạng thái | `Trạng thái xuất bản` | | Radio/Select |

---

## 3. Cột phải: Thông số thiết kế & Bảng giá

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `CRT-LBL-03` | `LBL` | Nhãn tên mẫu hoa | `Tên mẫu hoa *` | | Bắt buộc |
| `CRT-PH-02`  | `PH`  | Ô tên hoa | `VD: Giỏ Hoa Nắng Ban Mai, Bó Hoa Hồng Ohara Đỏ` | | Gợi ý tên thương mại |
| `CRT-LBL-04` | `LBL` | Nhãn danh mục | `Danh mục thiết kế *` | | Chọn loại cắm |
| `CRT-CAT-01` | `LBL` | Tùy chọn: Bó hoa | `Bó hoa` | | Danh mục |
| `CRT-CAT-02` | `LBL` | Tùy chọn: Giỏ hoa | `Giỏ hoa` | | Danh mục |
| `CRT-CAT-03` | `LBL` | Tùy chọn: Hộp hoa | `Hộp hoa` | | Danh mục |
| `CRT-CAT-04` | `LBL` | Tùy chọn: Kệ hoa | `Kệ hoa khai trương` | | Danh mục |
| `CRT-CAT-05` | `LBL` | Tùy chọn: Bình hoa | `Bình hoa` | | Danh mục |
| `CRT-CAT-06` | `LBL` | Tùy chọn: Hoa viếng | `Hoa chia buồn` | | Danh mục |
| `CRT-LBL-05` | `LBL` | Nhãn dáng cắm | `Dáng cắm` | | Kiểu dáng |
| `CRT-SHP-01` | `LBL` | Dáng tròn | `Dáng tròn` | | Dropdown |
| `CRT-SHP-02` | `LBL` | Dáng tam giác | `Dáng tam giác` | | Dropdown |
| `CRT-SHP-03` | `LBL` | Dáng tự nhiên | `Dáng tự nhiên / Phong cách Hàn Quốc` | | Dropdown |
| `CRT-SHP-04` | `LBL` | Dáng dài | `Dáng dài / Dáng thẳng` | | Dropdown |
| `CRT-SHP-05` | `LBL` | Dáng thác nước | `Dáng thác nước` | | Dropdown |
| `CRT-LBL-06` | `LBL` | Nhãn hướng nhìn | `Hướng nhìn` | | 1 mặt hoặc 360 độ |
| `CRT-FAC-01` | `LBL` | Hướng nhìn 1 | `Một mặt` | | Dropdown |
| `CRT-FAC-02` | `LBL` | Hướng nhìn 2 | `Đa hướng (360 độ)` | | Dropdown |
| `CRT-LBL-07` | `LBL` | Nhãn bao bì/vật chứa | `Bình / Hộp / Giấy gói (Container)` | | Quy cách phụ liệu |
| `CRT-PH-03`  | `PH`  | Ô bao bì | `VD: Giấy gói xi măng Hàn Quốc, giỏ mây tròn` | | Gợi ý nhập |
| `CRT-LBL-08` | `LBL` | Nhãn giá niêm yết | `Giá niêm yết (VNĐ) *` | | Đơn giá bán |
| `CRT-PH-04`  | `PH`  | Ô giá niêm yết | `VD: 650000` | | Số tiền |

---

## 4. Công thức thành phần hoa (BOM - Bill of Materials)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `CRT-BOM-01` | `HDR` | Tiêu đề bảng BOM | `Công thức thành phần hoa (BOM)` | | Khối công thức |
| `CRT-BOM-02` | `LBL` | Mô tả phụ bảng BOM | `Khai báo chi tiết các loại hoa, số lượng và vai trò để chuẩn bị nguyên liệu cắm` | | Hướng dẫn cắm hoa |
| `CRT-BOM-03` | `TH`  | Tiêu đề cột 1 | `Tên hoa / lá phụ` | | Tên vật tư |
| `CRT-BOM-04` | `TH`  | Tiêu đề cột 2 | `Số lượng` | | Số lượng số |
| `CRT-BOM-05` | `TH`  | Tiêu đề cột 3 | `Đơn vị` | | cành, bông, nhánh... |
| `CRT-BOM-06` | `TH`  | Tiêu đề cột 4 | `Màu sắc` | | Tone màu |
| `CRT-BOM-07` | `TH`  | Tiêu đề cột 5 | `Vai trò` | | Chủ đạo, phụ, điểm nhấn... |
| `CRT-BTN-03` | `BTN` | Thêm dòng BOM | `+ Thêm cành hoa` | | Thêm dòng mới |

---

## 5. Câu chuyện & Mô tả mẫu hoa

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `CRT-LBL-09` | `LBL` | Tiêu đề ô mô tả | `Câu chuyện & Thông điệp mẫu hoa` | | Nội dung quảng bá |
| `CRT-PH-05`  | `PH`  | Ô mô tả | `Mô tả cảm xúc, ý nghĩa loài hoa hoặc lời khuyên bảo quản giúp hoa tươi lâu...` | | Gợi ý viết bài |
