# BẢN ĐỒ NỘI DUNG UI — 06. NHẬP TỪ EXCEL & ẢNH (`/san-pham/nhap-hang-loat`)

> **Màn hình**: Nhập Hàng Loạt Từ Bảng Tính Excel & Thư Mục Ảnh  
> **Tuyến đường**: `/san-pham/nhap-hang-loat`  
> **Mã phân hệ**: `IMPORT`  
> **Trạng thái**: Chờ PO duyệt & chuẩn hóa câu chữ mới.

---

## 1. Thanh tiêu đề & Tác vụ trên cùng (`BulkImportHeader`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `IMP-HDR-01` | `HDR` | Breadcrumb | `Quay lại Sản phẩm & Giá` | | Link về `/san-pham` |
| `IMP-HDR-02` | `HDR` | Tiêu đề chính trang | `Nhập Mẫu Hoa Hàng Loạt từ Excel & Ảnh` | | Tiêu đề lớn `H1` |
| `IMP-HDR-03` | `HDR` | Mô tả phụ trang | `Tải lên bảng tính sản phẩm kèm thư mục ảnh để hệ thống tự động khớp nối và nạp vào kho` | | Hướng dẫn tính năng |
| `IMP-BTN-01` | `BTN` | Nút tải template | `Tải file mẫu Excel chuẩn` | | File mẫu `.xlsx` |
| `IMP-BTN-02` | `BTN` | Nút làm lại | `Làm lại từ đầu` | | Xóa phiên nhập |

---

## 2. Khu vực kéo thả kép (`ImportDropzones`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `IMP-DZ1-01` | `HDR` | Tiêu đề ô 1 | `1. Bảng tính danh mục sản phẩm (.xlsx)` | | Kéo file Excel |
| `IMP-DZ1-02` | `LBL` | Hướng dẫn ô 1 | `Kéo thả file Excel vào đây hoặc bấm để chọn` | | Hỗ trợ `.xlsx, .xls` |
| `IMP-DZ1-03` | `LBL` | Chú thích ô 1 | `Chứa tên hoa, mã sản phẩm, giá bán, danh mục và tên file ảnh` | | Cột dữ liệu |
| `IMP-DZ2-01` | `HDR` | Tiêu đề ô 2 | `2. Thư mục ảnh mẫu hoa (Tùy chọn)` | | Kéo ảnh hoa |
| `IMP-DZ2-02` | `LBL` | Hướng dẫn ô 2 | `Kéo thả nhiều ảnh cùng lúc hoặc bấm để chọn tệp` | | PNG, JPG, WebP |
| `IMP-DZ2-03` | `LBL` | Chú thích ô 2 | `Tên file ảnh nên trùng với Mã sản phẩm hoặc Cột ảnh trong Excel` | | Quy tắc khớp tự động |

---

## 3. Bảng đối chiếu & Xem trước dữ liệu (`ImportPreview`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `IMP-ST-01`  | `LBL` | Thống kê: Hợp lệ | `{{count}} dòng hợp lệ` | | Sẵn sàng nạp |
| `IMP-ST-02`  | `LBL` | Thống kê: Khớp ảnh | `{{count}} dòng khớp ảnh` | | Đã có ảnh |
| `IMP-ST-03`  | `LBL` | Thống kê: Thiếu ảnh | `{{count}} dòng chưa có ảnh` | | Cảnh báo |
| `IMP-ST-04`  | `LBL` | Thống kê: Lỗi | `{{count}} dòng lỗi dữ liệu` | | Cần sửa |
| `IMP-TH-01`  | `TH`  | Tiêu đề cột 1 | `Ảnh` | | Thumbnail |
| `IMP-TH-02`  | `TH`  | Tiêu đề cột 2 | `Mã hoa` | | SKU |
| `IMP-TH-03`  | `TH`  | Tiêu đề cột 3 | `Tên mẫu hoa` | | Tên sản phẩm |
| `IMP-TH-04`  | `TH`  | Tiêu đề cột 4 | `Danh mục` | | Bó/Giỏ/Kệ... |
| `IMP-TH-05`  | `TH`  | Tiêu đề cột 5 | `Giá niêm yết` | | VNĐ |
| `IMP-TH-06`  | `TH`  | Tiêu đề cột 6 | `Trạng thái khớp` | | Thành công/Thiếu ảnh |
| `IMP-BTN-03` | `BTN` | Nút kích hoạt nhập | `Bắt đầu nạp vào kho sản phẩm` | | Nút chính submit |

---

## 4. Kết quả & Tiến trình nạp (`ImportResultPanel`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `IMP-PRG-01` | `HDR` | Tiêu đề tiến trình | `Đang xử lý nạp dữ liệu...` | | Đang chạy |
| `IMP-RES-01` | `HDR` | Tiêu đề hoàn thành | `Nhập dữ liệu thành công!` | | Đã nạp xong |
| `IMP-RES-02` | `LBL` | Chi tiết số lượng | `Đã thêm mới {{created}} mẫu hoa và cập nhật {{updated}} sản phẩm.` | | Tổng kết |
| `IMP-BTN-04` | `BTN` | Nút xem kho | `Xem kho sản phẩm ngay` | | Về `/san-pham` |
