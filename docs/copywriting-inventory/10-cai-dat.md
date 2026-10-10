# BẢN ĐỒ NỘI DUNG UI — 10. CÀI ĐẶT & QUẢN LÝ THÀNH VIÊN (`/cai-dat`)

> **Màn hình**: Cài Đặt Hệ Thống & Quản Lý Thành Viên  
> **Tuyến đường**: `/cai-dat` và `/cai-dat/thanh-vien`  
> **Mã phân hệ**: `SETTING`  
> **Trạng thái**: Chờ PO duyệt & chuẩn hóa câu chữ mới.

---

## 1. Màn hình Cài đặt chung (`/cai-dat`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SET-GDC-01` | `BDG` | Huy hiệu hướng dẫn | `TRUNG TÂM CÀI ĐẶT TIỆM` | | Khối `FeatureGuidanceCard` |
| `SET-GDC-02` | `HDR` | Tiêu đề hướng dẫn | `Cấu Hình Hoạt Động & Liên Kết Thiết Lập Chuyên Sâu` | | Tiêu đề thẻ hướng dẫn |
| `SET-LBL-01` | `LBL` | Tên tiệm | `Tên cửa hàng hiển thị` | | Ô nhập |
| `SET-LBL-02` | `LBL` | Hotline | `Hotline liên hệ chính` | | Ô nhập |
| `SET-LBL-03` | `LBL` | Địa chỉ | `Địa chỉ tiệm hoa` | | Ô nhập |
| `SET-LBL-04` | `LBL` | Giờ mở cửa | `Khung giờ mở cửa hoạt động` | | Mặc định `07:30 - 21:30` |
| `SET-BTN-01` | `BTN` | Nút lưu | `Lưu cài đặt vận hành` | | Nút submit |

---

## 2. Lưới thẻ liên kết chuyên sâu (Deep Navigation Cards)

| Mã Copy | Loại | Tên thẻ | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Trạng thái Production |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SET-NAV-01T`| `HDR` | Thẻ 1 | `Hồ Sơ & Thương Hiệu` | | ✅ Hoạt động (`/ho-so`) |
| `SET-NAV-01D`| `LBL` | Mô tả 1 | `5 mã màu hex, nhận diện thương hiệu, cam kết & dịp lễ` | | ✅ Hoạt động |
| `SET-NAV-02T`| `HDR` | Thẻ 2 | `Chính Sách AI` | | 🔒 Sắp ra mắt (`/cai-dat-ai`) |
| `SET-NAV-02D`| `LBL` | Mô tả 2 | `Sàn bảo mật PII, trần chi phí credit & ưu tiên nhà cung cấp` | | 🔒 Sắp ra mắt |
| `SET-NAV-03T`| `HDR` | Thẻ 3 | `Kênh Mạng Xã Hội` | | 🔒 Sắp ra mắt (`/ket-noi`) |
| `SET-NAV-03D`| `LBL` | Mô tả 3 | `Kết nối Facebook, Instagram, TikTok & Zalo OA` | | 🔒 Sắp ra mắt |
| `SET-NAV-04T`| `HDR` | Thẻ 4 | `Bộ Máy Phân Tích` | | 🔒 Sắp ra mắt (`/bo-may`) |
| `SET-NAV-04D`| `LBL` | Mô tả 4 | `Động cơ nhận diện thị giác Vision Engine tổ chức` | | 🔒 Sắp ra mắt |
| `SET-NAV-05T`| `HDR` | Thẻ 5 | `Đội Ngũ & Phân Quyền` | | ✅ Hoạt động (`/cai-dat/thanh-vien`) |
| `SET-NAV-05D`| `LBL` | Mô tả 5 | `Mời nhân viên mới, phân vai trò và gán chi nhánh chuỗi tiệm`| | ✅ Hoạt động |

---

## 3. Quản lý thành viên & Phân quyền (`/cai-dat/thanh-vien`)

| Mã Copy | Loại | Vị trí hiển thị | Nội dung HIỆN TẠI trên UI | Nội dung BẠN CHUẨN HÓA (Mới) | Ghi chú ngữ cảnh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `MEM-HDR-01` | `HDR` | Breadcrumb | `Quay lại Cài đặt` | | Link về `/cai-dat` |
| `MEM-HDR-02` | `HDR` | Tiêu đề lớn `H1` | `Đội Ngũ Nhân Sự & Phân Quyền` | | Tiêu đề chính |
| `MEM-BTN-01` | `BTN` | Nút thêm nhân viên | `+ Thêm nhân viên` | | Mở dialog tạo tài khoản |
| `MEM-BTN-02` | `BTN` | Nút làm mới | `Làm mới danh sách` | | Revalidate SWR |
| `MEM-PH-01`  | `PH`  | Ô tìm kiếm nhân viên | `Tìm nhân viên theo tên, email, vai trò...` | | Search bar |
| `MEM-TH-01`  | `TH`  | Tiêu đề cột 1 | `Thành viên` | | Tên & Avatar |
| `MEM-TH-02`  | `TH`  | Tiêu đề cột 2 | `Email đăng nhập` | | Email |
| `MEM-TH-03`  | `TH`  | Tiêu đề cột 3 | `Chi nhánh` | | Cơ sở làm việc |
| `MEM-TH-04`  | `TH`  | Tiêu đề cột 4 | `Vai trò` | | Chức danh |
| `MEM-TH-05`  | `TH`  | Tiêu đề cột 5 | `Trạng thái` | | Đang hoạt động / Khóa |
| `MEM-TH-06`  | `TH`  | Tiêu đề cột 6 | `Thao tác` | | Đổi vai trò, khóa, xóa |
