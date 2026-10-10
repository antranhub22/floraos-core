# BẢN ĐỒ NỘI DUNG UI — 05. TẠO MẪU HOA MỚI (`/san-pham/tao-moi`)

> **Màn hình**: Tạo Mẫu Hoa Mới & Thành Phần Hoa  
> **Tuyến đường**: `/san-pham/tao-moi`  
> **Mã phân hệ**: `CREATE`  
> **Trạng thái**: Đã chuẩn hóa 100% theo Từ điển SSOT.

---

## 1. Thanh tiêu đề & Tác vụ lưu (Header & Action)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `CRT-HDR-01` | `HDR` | Breadcrumb | `Quay lại Sản phẩm & Giá` | `Quay lại Mẫu hoa & giá` | Link về `/san-pham` |
| `CRT-HDR-02` | `HDR` | Tiêu đề chính trang | `Tạo Mẫu Hoa Mới` | `Tạo mẫu hoa mới` | Sentence case |
| `CRT-HDR-03` | `HDR` | Mô tả phụ trang | `Khai báo công thức thành phần hoa (BOM), kiểu dáng và bảng giá niêm yết` | `Nhập thành phần hoa, kiểu dáng và giá bán của mẫu hoa.` | Bỏ từ BOM, rõ nghĩa |
| `CRT-BTN-01` | `BTN` | Nút lưu nháp | `Lưu bản nháp` | `Lưu bản nháp` | Lưu nháp |
| `CRT-BTN-02` | `BTN` | Nút lưu & xuất bản | `Lưu & Xuất bản` | `Lưu và đăng bán` | Dùng "đăng bán" thay "xuất bản" |

---

## 2. Cột trái: Tải ảnh & Mã sản phẩm

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `CRT-IMG-01` | `LBL` | Tiêu đề ô tải ảnh | `Ảnh đại diện mẫu hoa *` | `Ảnh đại diện mẫu hoa` | Dấu `*` do component render |
| `CRT-IMG-02` | `LBL` | Dòng hướng dẫn kéo thả | `Kéo thả ảnh vào đây hoặc bấm để chọn tệp` | `Kéo thả ảnh vào đây hoặc bấm để chọn file` | Dùng "file" theo từ điển |
| `CRT-IMG-03` | `HLP` | Giới hạn dung lượng | `Hỗ trợ JPG, PNG, WebP tối đa 10MB` | `Hỗ trợ JPG, PNG, WebP, tối đa 10 MB` | Chuẩn hóa khoảng trắng đơn vị |
| `CRT-IMG-04` | `BTN` | Nút đổi ảnh | `Thay đổi ảnh` | `Đổi ảnh` | Ngắn gọn |
| `CRT-IMG-05` | `BTN` | Nút xóa ảnh | `Xóa ảnh` | `Xóa ảnh` | Gỡ ảnh đã tải |
| `CRT-LBL-01` | `LBL` | Nhãn mã sản phẩm | `Mã sản phẩm *` | `Mã mẫu hoa (tự động tạo)` | Mã tự sinh `FL-xxxx`, không bắt buộc |
| `CRT-PH-01`  | `PH`  | Ô mã sản phẩm | `VD: BH-001, GH-102` | `Để trống để hệ thống tự tạo mã (hoặc nhập BH-001)` | Hướng dẫn rõ ràng |
| `CRT-LBL-02` | `LBL` | Nhãn trạng thái | `Trạng thái xuất bản` | `Trạng thái bán` | Đang bán / Bản nháp |

---

## 3. Cột phải: Thông số thiết kế & Bảng giá

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `CRT-LBL-03` | `LBL` | Nhãn tên mẫu hoa | `Tên mẫu hoa *` | `Tên mẫu hoa` | Bắt buộc (component thêm `*`) |
| `CRT-PH-02`  | `PH`  | Ô tên hoa | `VD: Giỏ Hoa Nắng Ban Mai, Bó Hoa Hồng Ohara Đỏ` | `Ví dụ: Giỏ Hoa Nắng Ban Mai, Bó Hoa Hồng Ohara Đỏ` | Bỏ viết tắt "VD:" |
| `CRT-LBL-04` | `LBL` | Nhãn danh mục | `Danh mục thiết kế *` | `Danh mục` | Ngắn gọn |
| `CRT-CAT-01` | `OPT` | Tùy chọn: Bó hoa | `Bó hoa` | `Bó hoa` | Danh mục |
| `CRT-CAT-02` | `OPT` | Tùy chọn: Giỏ hoa | `Giỏ hoa` | `Giỏ hoa` | Danh mục |
| `CRT-CAT-03` | `OPT` | Tùy chọn: Hộp hoa | `Hộp hoa` | `Hộp hoa` | Danh mục |
| `CRT-CAT-04` | `OPT` | Tùy chọn: Kệ hoa | `Kệ hoa khai trương` | `Kệ hoa khai trương` | Danh mục |
| `CRT-CAT-05` | `OPT` | Tùy chọn: Bình hoa | `Bình hoa` | `Bình hoa` | Danh mục |
| `CRT-CAT-06` | `OPT` | Tùy chọn: Hoa viếng | `Hoa chia buồn` | `Hoa chia buồn` | Danh mục |
| `CRT-LBL-05` | `LBL` | Nhãn dáng cắm | `Dáng cắm` | `Kiểu dáng cắm` | Rõ ràng |
| `CRT-SHP-01` | `OPT` | Dáng tròn | `Dáng tròn` | `Tròn` | Bỏ lặp từ "Dáng" |
| `CRT-SHP-02` | `OPT` | Dáng tam giác | `Dáng tam giác` | `Tam giác` | Bỏ lặp từ "Dáng" |
| `CRT-SHP-03` | `OPT` | Dáng tự nhiên | `Dáng tự nhiên / Phong cách Hàn Quốc` | `Tự nhiên (phong cách Hàn Quốc)` | Dùng ngoặc đơn |
| `CRT-SHP-04` | `OPT` | Dáng dài | `Dáng dài / Dáng thẳng` | `Dài, thẳng` | Bỏ lặp từ "Dáng" |
| `CRT-SHP-05` | `OPT` | Dáng thác nước | `Dáng thác nước` | `Thác nước` | Bỏ lặp từ "Dáng" |
| `CRT-LBL-06` | `LBL` | Nhãn hướng nhìn | `Hướng nhìn` | `Mặt nhìn` | Thuật ngữ thợ hoa |
| `CRT-FAC-01` | `OPT` | Hướng nhìn 1 | `Một mặt` | `Một mặt` | Mặt nhìn |
| `CRT-FAC-02` | `OPT` | Hướng nhìn 2 | `Đa hướng (360 độ)` | `Nhiều mặt (360°)` | Mặt nhìn |
| `CRT-LBL-07` | `LBL` | Nhãn bao bì/vật chứa | `Bình / Hộp / Giấy gói (Container)` | `Vật chứa / bao bì` | Xóa bỏ "Container" |
| `CRT-PH-03`  | `PH`  | Ô bao bì | `VD: Giấy gói xi măng Hàn Quốc, giỏ mây tròn` | `Ví dụ: giấy gói Hàn Quốc, giỏ mây tròn` | Bỏ viết tắt "VD:" |
| `CRT-LBL-08` | `LBL` | Nhãn giá niêm yết | `Giá niêm yết (VNĐ) *` | `Giá niêm yết (₫)` | Đơn vị tiền tệ chuẩn `₫` |
| `CRT-PH-04`  | `PH`  | Ô giá niêm yết | `VD: 650000` | `Ví dụ: 650.000` | Gợi ý định dạng tiền |

---

## 4. Bảng Thành phần hoa (Thành phần hoa & Phụ liệu)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `CRT-BOM-01` | `HDR` | Tiêu đề bảng thành phần | `Công thức thành phần hoa (BOM)` | `Thành phần hoa` | Xóa bỏ hoàn toàn "BOM" |
| `CRT-BOM-02` | `LBL` | Mô tả phụ | `Khai báo chi tiết các loại hoa, số lượng và vai trò để chuẩn bị nguyên liệu cắm` | `Liệt kê chi tiết các loại hoa, lá phụ và số lượng để thợ chuẩn bị cắm hoa.` | Bỏ từ "khai báo" |
| `CRT-BOM-03` | `TH`  | Tiêu đề cột 1 | `Tên hoa / lá phụ` | `Tên hoa, lá phụ` | Dùng dấu phẩy |
| `CRT-BOM-04` | `TH`  | Tiêu đề cột 2 | `Số lượng` | `Số lượng` | Cột số lượng |
| `CRT-BOM-05` | `TH`  | Tiêu đề cột 3 | `Đơn vị` | `Đơn vị` | cành, bông, nhánh... |
| `CRT-BOM-06` | `TH`  | Tiêu đề cột 4 | `Màu sắc` | `Tông màu` | Thống nhất "tông màu" |
| `CRT-BOM-07` | `TH`  | Tiêu đề cột 5 | `Vai trò` | `Vai trò` | Hoa chính, hoa phụ, lá đệm... |
| `CRT-BTN-03` | `BTN` | Thêm dòng thành phần | `+ Thêm cành hoa` | `Thêm thành phần hoa` | Bỏ dấu `+`, bao hàm cả lá |

---

## 5. Câu chuyện & Mô tả mẫu hoa

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `CRT-LBL-09` | `LBL` | Tiêu đề ô mô tả | `Câu chuyện & Thông điệp mẫu hoa` | `Câu chuyện và thông điệp mẫu hoa` | Dùng "và" thay cho `&` |
| `CRT-PH-05`  | `PH`  | Ô mô tả | `Mô tả cảm xúc, ý nghĩa loài hoa hoặc lời khuyên bảo quản giúp hoa tươi lâu...` | `Mô tả ý nghĩa mẫu hoa, cảm xúc gửi gắm hoặc hướng dẫn chăm sóc giúp hoa tươi lâu…` | Gợi ý viết bài tự nhiên |
