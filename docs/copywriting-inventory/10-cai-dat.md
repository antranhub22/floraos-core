# BẢN ĐỒ NỘI DUNG UI — 10. CÀI ĐẶT & QUẢN LÝ THÀNH VIÊN (`/cai-dat`)

> **Màn hình**: Cài Đặt Hệ Thống & Quản Lý Thành Viên  
> **Tuyến đường**: `/cai-dat` và `/cai-dat/thanh-vien`  
> **Mã phân hệ**: `SETTING`  
> **Trạng thái**: Đã chuẩn hóa 100% theo Từ điển SSOT.

---

## 1. Màn hình Cài đặt chung (`/cai-dat`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SET-GDC-01` | `BDG` | Huy hiệu hướng dẫn | `TRUNG TÂM CÀI ĐẶT TIỆM` | `CÀI ĐẶT CỬA HÀNG` | Thống nhất "cửa hàng" (PO Decision 3) |
| `SET-GDC-02` | `HDR` | Tiêu đề hướng dẫn | `Cấu Hình Hoạt Động & Liên Kết Thiết Lập Chuyên Sâu` | `Quản lý thông tin chung và các thiết lập nâng cao của cửa hàng.` | Bỏ từ ngữ sáo rỗng, Sentence case |
| `SET-LBL-01` | `LBL` | Tên tiệm | `Tên cửa hàng hiển thị` | `Tên cửa hàng` | Ngắn gọn |
| `SET-LBL-02` | `LBL` | Hotline | `Hotline liên hệ chính` | `Hotline liên hệ` | Ngắn gọn |
| `SET-LBL-03` | `LBL` | Địa chỉ | `Địa chỉ tiệm hoa` | `Địa chỉ cửa hàng` | Thống nhất "cửa hàng" |
| `SET-LBL-04` | `LBL` | Giờ mở cửa | `Khung giờ mở cửa hoạt động` | `Giờ mở cửa` | Ngắn gọn |
| `SET-BTN-01` | `BTN` | Nút lưu | `Lưu cài đặt vận hành` | `Lưu thay đổi` | Chuẩn hóa nút lưu |

---

## 2. Lưới thẻ liên kết chuyên sâu (Deep Navigation Cards)

| Mã Copy | Loại | Tên thẻ | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Trạng thái Production |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SET-NAV-01T`| `HDR` | Thẻ 1 | `Hồ Sơ & Thương Hiệu` | `Hồ sơ và thương hiệu` | ✅ Hoạt động (`/ho-so`) |
| `SET-NAV-01D`| `LBL` | Mô tả 1 | `5 mã màu hex, nhận diện thương hiệu, cam kết & dịp lễ` | `Logo, màu sắc thương hiệu, chính sách cọc, cam kết và dịp lễ.` | Bỏ "mã màu hex" |
| `SET-NAV-02T`| `HDR` | Thẻ 2 | `Chính Sách AI` | `Thiết lập AI` | 🔒 Sắp ra mắt (`/cai-dat-ai`) |
| `SET-NAV-02D`| `LBL` | Mô tả 2 | `Sàn bảo mật PII, trần chi phí credit & ưu tiên nhà cung cấp` | `Bảo vệ thông tin khách hàng, giới hạn chi phí dùng AI và chọn nhà cung cấp AI.` | Bỏ PII, credit |
| `SET-NAV-03T`| `HDR` | Thẻ 3 | `Kênh Mạng Xã Hội` | `Kết nối mạng xã hội` | 🔒 Sắp ra mắt (`/ket-noi`) |
| `SET-NAV-03D`| `LBL` | Mô tả 3 | `Kết nối Facebook, Instagram, TikTok & Zalo OA` | `Kết nối Facebook, Instagram, TikTok và Zalo OA.` | Dùng "và" |
| `SET-NAV-04T`| `HDR` | Thẻ 4 | `Bộ Máy Phân Tích` | `Phân tích ảnh hoa` | 🔒 Sắp ra mắt (`/bo-may`) |
| `SET-NAV-04D`| `LBL` | Mô tả 4 | `Động cơ nhận diện thị giác Vision Engine tổ chức` | `Chọn cách AI nhận diện ảnh hoa cho toàn bộ cửa hàng.` | Bỏ Vision Engine, thị giác |
| `SET-NAV-05T`| `HDR` | Thẻ 5 | `Đội Ngũ & Phân Quyền` | `Thành viên và phân quyền` | ✅ Hoạt động (`/cai-dat/thanh-vien`) |
| `SET-NAV-05D`| `LBL` | Mô tả 5 | `Mời nhân viên mới, phân vai trò và gán chi nhánh chuỗi tiệm`| `Mời thành viên mới, phân vai trò và chi nhánh làm việc.` | Thống nhất "thành viên" |

---

## 3. Quản lý thành viên & Phân quyền (`/cai-dat/thanh-vien`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `MEM-HDR-01` | `HDR` | Breadcrumb | `Quay lại Cài đặt` | `Quay lại Cài đặt` | Link về `/cai-dat` |
| `MEM-HDR-02` | `HDR` | Tiêu đề lớn `H1` | `Đội Ngũ Nhân Sự & Phân Quyền` | `Thành viên và phân quyền` | Thống nhất từ "Thành viên" |
| `MEM-BTN-01` | `BTN` | Nút thêm nhân viên | `+ Thêm nhân viên` | `Thêm thành viên` | Bỏ dấu `+`, rõ nghĩa |
| `MEM-BTN-02` | `BTN` | Nút làm mới | `Làm mới danh sách` | `Làm mới` | Thống nhất "Làm mới" |
| `MEM-PH-01`  | `PH`  | Ô tìm kiếm nhân viên | `Tìm nhân viên theo tên, email, vai trò...` | `Tìm theo tên, email hoặc vai trò…` | Gợi ý tìm kiếm |
| `MEM-TH-01`  | `TH`  | Tiêu đề cột 1 | `Thành viên` | `Thành viên` | Tên & Avatar |
| `MEM-TH-02`  | `TH`  | Tiêu đề cột 2 | `Email đăng nhập` | `Email` | Ngắn gọn |
| `MEM-TH-03`  | `TH`  | Tiêu đề cột 3 | `Chi nhánh` | `Chi nhánh` | Cơ sở làm việc |
| `MEM-TH-04`  | `TH`  | Tiêu đề cột 4 | `Vai trò` | `Vai trò` | Điều hành, Nhân viên bán hàng, Điều phối viên, Thợ cắm hoa |
| `MEM-TH-05`  | `TH`  | Tiêu đề cột 5 | `Trạng thái` | `Trạng thái` | Đang hoạt động · Đã khóa |
| `MEM-TH-06`  | `TH`  | Tiêu đề cột 6 | `Thao tác` | `Thao tác` | Đổi vai trò, khóa, xóa |
