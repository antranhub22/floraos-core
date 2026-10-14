# BẢN ĐỒ NỘI DUNG UI — 06. NHẬP TỪ EXCEL & ẢNH (`/san-pham/nhap-hang-loat`)

> **Màn hình**: Nhập Mẫu Hoa Hàng Loạt từ Excel & Ảnh  
> **Tuyến đường**: `/san-pham/nhap-hang-loat`  
> **Mã phân hệ**: `IMPORT`  
> **Trạng thái**: Đã chuẩn hóa 100% theo Từ điển SSOT.

---

## 1. Thanh tiêu đề & Tác vụ trên cùng (`BulkImportHeader`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `IMP-HDR-01` | `HDR` | Breadcrumb | `Quay lại Sản phẩm & Giá` | `Quay lại Mẫu hoa & giá` | Link về `/san-pham` |
| `IMP-HDR-02` | `HDR` | Tiêu đề chính trang | `Nhập Mẫu Hoa Hàng Loạt từ Excel & Ảnh` | `Nhập mẫu hoa từ Excel và ảnh` | Sentence case, dùng "và" |
| `IMP-HDR-03` | `HDR` | Mô tả phụ trang | `Tải lên bảng tính sản phẩm kèm thư mục ảnh để hệ thống tự động khớp nối và nạp vào kho` | `Tải lên file Excel và ảnh mẫu hoa, hệ thống sẽ tự ghép ảnh và thêm vào kho mẫu hoa.` | Bỏ từ dịch máy "khớp nối", "nạp" |
| `IMP-BTN-01` | `BTN` | Nút tải template | `Tải file mẫu Excel chuẩn` | `Tải file Excel mẫu` | Ngắn gọn, tự nhiên |
| `IMP-BTN-02` | `BTN` | Nút làm lại | `Làm lại từ đầu` | `Bắt đầu lại` | Kèm hộp thoại xác nhận hủy |

---

## 2. Khu vực kéo thả kép (`ImportDropzones`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `IMP-DZ1-01` | `HDR` | Tiêu đề ô 1 | `1. Bảng tính danh mục sản phẩm (.xlsx)` | `File Excel danh sách mẫu hoa (.xlsx, .xls)` | Bỏ số thứ tự cứng, ghi đủ .xls |
| `IMP-DZ1-02` | `LBL` | Hướng dẫn ô 1 | `Kéo thả file Excel vào đây hoặc bấm để chọn` | `Kéo thả file Excel vào đây hoặc bấm để chọn file` | Dùng "file" |
| `IMP-DZ1-03` | `HLP` | Chú thích ô 1 | `Chứa tên hoa, mã sản phẩm, giá bán, danh mục và tên file ảnh` | `File cần có các cột: mã mẫu hoa, tên, danh mục, giá bán và tên file ảnh.` | Rõ ràng cấu trúc cột |
| `IMP-DZ2-01` | `HDR` | Tiêu đề ô 2 | `2. Thư mục ảnh mẫu hoa (Tùy chọn)` | `Ảnh mẫu hoa (không bắt buộc)` | Bỏ từ "thư mục", bỏ số thứ tự |
| `IMP-DZ2-02` | `LBL` | Hướng dẫn ô 2 | `Kéo thả nhiều ảnh cùng lúc hoặc bấm để chọn tệp` | `Kéo thả nhiều ảnh hoặc bấm để chọn file` | Dùng "file" |
| `IMP-DZ2-03` | `HLP` | Chú thích ô 2 | `Tên file ảnh nên trùng với Mã sản phẩm hoặc Cột ảnh trong Excel` | `Đặt tên file ảnh trùng với mã mẫu hoa hoặc tên ghi ở cột ảnh trong file Excel.` | Hướng dẫn ghép ảnh rõ ràng |

---

## 3. Bảng đối chiếu & Xem trước dữ liệu (`ImportPreview`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `IMP-ST-01`  | `LBL` | Thống kê: Hợp lệ | `{{count}} dòng hợp lệ` | `{{count}} dòng hợp lệ` | Sẵn sàng thêm vào kho |
| `IMP-ST-02`  | `LBL` | Thống kê: Khớp ảnh | `{{count}} dòng khớp ảnh` | `{{count}} dòng đã ghép ảnh` | Tự nhiên |
| `IMP-ST-03`  | `LBL` | Thống kê: Thiếu ảnh | `{{count}} dòng chưa có ảnh` | `{{count}} dòng chưa có ảnh` | Cảnh báo |
| `IMP-ST-04`  | `LBL` | Thống kê: Lỗi | `{{count}} dòng lỗi dữ liệu` | `{{count}} dòng có lỗi` | Ngắn gọn |
| `IMP-TH-01`  | `TH`  | Tiêu đề cột 1 | `Ảnh` | `Ảnh` | Thumbnail |
| `IMP-TH-02`  | `TH`  | Tiêu đề cột 2 | `Mã hoa` | `Mã mẫu hoa` | Thống nhất "Mã mẫu hoa" |
| `IMP-TH-03`  | `TH`  | Tiêu đề cột 3 | `Tên mẫu hoa` | `Tên mẫu hoa` | Tên mẫu hoa |
| `IMP-TH-04`  | `TH`  | Tiêu đề cột 4 | `Danh mục` | `Danh mục` | Bó/Giỏ/Kệ... |
| `IMP-TH-05`  | `TH`  | Tiêu đề cột 5 | `Giá niêm yết` | `Giá niêm yết (₫)` | Kèm đơn vị tiền tệ `₫` |
| `IMP-TH-06`  | `TH`  | Tiêu đề cột 6 | `Trạng thái khớp` | `Ghép ảnh` | Tình trạng ảnh |
| `IMP-BTN-03` | `BTN` | Nút kích hoạt nhập | `Bắt đầu nạp vào kho sản phẩm` | `Thêm vào kho mẫu hoa` | Bỏ từ "nạp" |

---

## 4. Kết quả & Tiến trình nạp (`ImportResultPanel`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `IMP-PRG-01` | `HDR` | Tiêu đề tiến trình | `Đang xử lý nạp dữ liệu...` | `Đang thêm mẫu hoa vào kho…` | Bỏ từ "nạp" |
| `IMP-RES-01` | `HDR` | Tiêu đề hoàn thành | `Nhập dữ liệu thành công!` | `Đã nhập xong` | Ngắn gọn, không dùng "!" |
| `IMP-RES-02` | `LBL` | Chi tiết số lượng | `Đã thêm mới {{created}} mẫu hoa và cập nhật {{updated}} sản phẩm.` | `Đã thêm {{created}} mẫu hoa mới và cập nhật {{updated}} mẫu hoa hiện có.` | Thống nhất từ "mẫu hoa" |
| `IMP-BTN-04` | `BTN` | Nút xem kho | `Xem kho sản phẩm ngay` | `Xem kho mẫu hoa` | Thống nhất "kho mẫu hoa" |
