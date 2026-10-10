# Mục 10: Cài Đặt (/cai-dat) & Quản Lý Thành Viên — Quản Trị Hệ Thống & Phân Quyền Nhân Sự

> **Đường dẫn**: `/cai-dat` và `/cai-dat/thanh-vien`
> **Nhóm Sidebar**: Thiết lập
> **Trạng thái Production**: ✅ **Đang hoạt động**
> **Tài liệu SSOT liên quan**: `src/modules/organization/`, `docs/dac-ta/03b-role-ux.md`

---

## 1. Cấu trúc trang (Page Structure)

Mục Cài Đặt là trung tâm quản trị tối cao của cửa hàng hoa, chia làm 2 tầng giao diện:

### 1.1. Trang Cài Đặt Chung (`/cai-dat`)
- **Khối Hướng Dẫn Nghiệp Vụ (`FeatureGuidanceCard`)**: Nhãn *"TRUNG TÂM CÀI ĐẶT TIỆM"*, tiêu đề *"Cấu Hình Hoạt Động & Liên Kết Thiết Lập Chuyên Sâu"*.
- **Khối Thông tin vận hành cơ bản**:
  - Tên cửa hàng hiển thị (`displayName`).
  - Hotline liên hệ chính (`phone`).
  - Địa chỉ tiệm hoa (`address`).
  - Khung giờ mở cửa hoạt động (`openingHours` - mặc định `07:30 - 21:30`).
  - Nút Lưu cài đặt (`Save`), hỗ trợ quyền chỉnh sửa (`F2` hoặc `H4`).
- **Lưới 5 Liên Kết Thiết Lập Chuyên Sâu (Deep Navigation Cards)**:
  1. **Hồ Sơ & Thương Hiệu** (`/ho-so`): 5 mã màu hex, nhận diện thương hiệu, cam kết & dịp lễ (✅ Hoạt động).
  2. **Chính Sách AI** (`/cai-dat-ai`): Sàn bảo mật PII, trần chi phí credit & ưu tiên nhà cung cấp (🔒 Sắp ra mắt).
  3. **Kênh Mạng Xã Hội** (`/ket-noi`): Kết nối Facebook, Instagram, TikTok & Zalo OA (🔒 Sắp ra mắt).
  4. **Bộ Máy Phân Tích** (`/bo-may`): Động cơ nhận diện thị giác Vision Engine tổ chức (🔒 Sắp ra mắt).
  5. **Đội Ngũ & Phân Quyền** (`/cai-dat/thanh-vien`): Mời nhân viên mới, phân vai trò và gán chi nhánh chuỗi tiệm (✅ Hoạt động).

### 1.2. Phân hệ Quản Lý Thành Viên (`/cai-dat/thanh-vien`)
- **Header**:
  - Nút quay lại Cài đặt (`ArrowLeft` → `/cai-dat`).
  - Nút **"+ Thêm nhân viên"** (`AddStaffDialog` - Yêu cầu quyền `A3` cho Điều hành).
  - Nút **"Làm mới danh sách"** (`RefreshCw`).
  - Ô tìm kiếm thời gian thực theo tên, email hoặc vai trò nhân sự.
- **Thống kê nhân sự**: Thẻ đếm số nhân viên Đang hoạt động (`ACTIVE`) và Chờ kích hoạt (`INVITED`).
- **Bảng danh sách thành viên (`MemberTable`)**:
  - Cột Thành viên (Tên, Email đăng nhập).
  - Cột Chi nhánh cửa hàng (gán theo danh sách chi nhánh `branches`).
  - Cột Vai trò phân quyền (Chủ tiệm, Điều hành, Bán hàng, Thợ cắm hoa...).
  - Cột Trạng thái (`ACTIVE` / `INVITED` / `SUSPENDED`).
  - Cột Thao tác: Đổi vai trò (`ChangeRoleDialog` - Quyền `F5`), Đặt lại mật khẩu, Tạm khóa tài khoản, Xóa nhân viên (`F4`).
  - **Tự động bảo vệ**: Ẩn các nút khóa/xóa đối với tài khoản đang đăng nhập của chính người dùng (`currentUserId`).

---

## 2. Tính năng chi tiết từng thành phần

### 2.1. Thêm Nhân Viên Dùng Ngay (`AddStaffDialog` - Quyền `A3`)
- Thay vì gửi email xác nhận rườm rà dễ bị vào hòm thư rác, Chủ tiệm có thể trực tiếp tạo tài khoản cho nhân viên:
  - Nhập họ tên, email đăng nhập, mật khẩu khởi tạo.
  - Gán chi nhánh làm việc.
  - Chọn vai trò chuẩn (`roleId`):
    - **Quản lý cửa hàng (Store Manager)**: Quyền cao nhất trong tiệm.
    - **Nhân viên Bán hàng (Sales)**: Chỉ xem và tạo đơn, gửi thẻ chào, không xem báo cáo tài chính ẩn.
    - **Thợ cắm hoa (Florist)**: Chỉ xem công thức hoa và trạng thái cắm hoa trên Kanban.
- Tài khoản sau khi tạo có thể đăng nhập ngay lập tức.

### 2.2. Cơ Chế Tự Bảo Vệ Tài Khoản Quản Trị
- Hệ thống tự động ẩn nút "Tạm khóa" hoặc "Xóa" trên chính dòng tài khoản của người đang đăng nhập, chống tình trạng chủ tiệm tự khóa tài khoản của chính mình.

---

## 3. Luồng nghiệp vụ & Tình huống sử dụng thực tế

### Tình huống 1: Cửa hàng tuyển nhân viên bán hàng mới
1. Chủ tiệm vào `/cai-dat`, bấm vào thẻ **"Đội ngũ & Phân quyền"**.
2. Bấm nút **"+ Thêm nhân viên"**.
3. Điền tên: *"Nguyễn Thu Hà"*, email: *"ha.sales@tiemhoa.vn"*, mật khẩu ban đầu: *"HoaTuoi@2026"*.
4. Chọn vai trò: **"Bán hàng (Sales)"**.
5. Bấm **"Tạo tài khoản"**. Thu Hà có thể đăng nhập ngay và chỉ nhìn thấy các màn hình được cấp phép.

### Tình huống 2: Nhân viên nghỉ việc cần thu hồi quyền truy cập
1. Chủ tiệm vào `/cai-dat/thanh-vien`.
2. Tìm tên nhân viên đã nghỉ.
3. Bấm menu ba chấm `...`, chọn **"Tạm khóa tài khoản"** hoặc **"Xóa thành viên"**.
4. Toàn bộ phiên đăng nhập của nhân viên đó lập tức bị hủy bỏ trên máy chủ, ngăn rò rỉ danh sách khách hàng.

---

## 4. Lợi ích cho Cửa hàng Hoa

- **Bảo mật thông tin kinh doanh tuyệt đối**: Nhân viên bán hàng hay thợ cắm hoa không thể xem được lợi nhuận, cấu hình ngân hàng hay xóa tài nguyên tiệm.
- **Vận hành trơn tru theo chi nhánh**: Dễ dàng phân chia nhân viên theo từng cơ sở (Cơ sở 1, Cơ sở 2) để quản lý chấm công và giao đơn.
- **Tiết kiệm thời gian cấp phát tài khoản**: Tạo tài khoản trong 10 giây dùng được ngay.

---

## 5. Quyền truy cập & Phân quyền (RBAC)

- **Xem danh sách thành viên**: Nhân viên có quyền xem tổ chức.
- **Tạo nhân viên mới**: Quyền `A3` (Chủ tiệm / Điều hành).
- **Đổi vai trò nhân sự**: Quyền `F5`.
- **Xóa / Khóa thành viên**: Quyền `F4` (Cắt cứng phía server, kiểm tra nghiêm ngặt).

---

## 6. Mối liên kết với các mục khác trong hệ thống

- 🔗 **Liên kết với Hồ sơ cửa hàng (`/ho-so`)**: Liên kết chuyển đổi nhanh giữa Cài đặt và Hồ sơ.
- 🔗 **Tác động đến toàn hệ thống**: Phân quyền tại trang này sẽ quyết định nhân viên nhìn thấy tab nào trên thanh Sidebar và nút nào trong Thẻ Chào, Đơn Hàng.

---

## 7. Trạng thái hoàn thiện & Hạn chế trên Production

- **Trạng thái**: Hoàn thiện 100%, bảo đảm tuân thủ nguyên tắc cách ly tổ chức (`organization_id`) và Zero-Trust Security.
