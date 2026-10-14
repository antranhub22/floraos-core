# Mục 8: Kho Dữ Liệu (/kho-du-lieu) — Trung Tâm Lưu Trữ 3 Phân Vùng Chuẩn & Thùng Rác Quản Lý

> **Đường dẫn**: `/kho-du-lieu`
> **Nhóm Sidebar**: Sản phẩm
> **Trạng thái Production**: ✅ **Đang hoạt động**
> **Tài liệu SSOT liên quan**: `src/components/storage/account-storage-hub.tsx`

---

## 1. Cấu trúc trang (Page Structure)

Màn hình Kho Dữ Liệu đóng vai trò là kho lưu trữ số trung tâm của tiệm hoa. Giao diện gồm thanh tiêu đề trên cùng và **Bộ điều hướng phân vùng (`AccountStorageHub`)** phân cấp theo vai trò người dùng:
- **Tiêu đề trang**: `Kho Dữ Liệu Sản Phẩm` — *"Kho lưu trữ trung tâm phân loại 3 phân vùng độc lập cho tài khoản của bạn."*
- **Nút tác vụ nhanh**: `+ Tải ảnh mới để phân tích` (Dẫn thẳng sang `/tai-anh`).
- **3 Phân vùng chuẩn hóa** (Hiển thị cho toàn bộ nhân viên) + **1 Phân vùng Thùng rác** (Dành riêng cho Quản lý / Điều hành):

### 1.1. Phân vùng 1: 1. Ảnh Gốc (`tab: "raw"`)
- **Nội dung**: Lưu trữ các file ảnh chụp thô tải lên từ máy tính hoặc điện thoại nhưng chưa đưa vào máy quét thị giác AI.
- **Tính năng**: Hiển thị lưới ảnh thẻ (`AssetThumb`), kích thước tệp, ngày tải lên, nút xem ảnh lớn và nút *"Đưa vào phân tích AI"* để chuyển tiếp sang `/tai-anh`.

### 1.2. Phân vùng 2: 2. Ảnh Đã Duyệt (M01a) (`tab: "approved"`)
- **Nội dung**: Các bản ghi phân tích thị giác đã được nhân viên kiểm tra và bấm "Duyệt".
- **Thông tin hiển thị**: Ảnh hoa đã nhận diện, mã hoa, tên hoa, dáng cắm, tông màu, danh sách thành phần hoa (BOM).
- **Tác vụ nhanh**: Nút *"Tạo nội dung thương mại (M01b)"* hoặc *"Tạo kịch bản bán hàng (M01c)"*.

### 1.3. Phân vùng 3: 3. Sale Pitch Hoàn Thành (`tab: "finalized"`)
- **Nội dung**: Danh sách toàn bộ các bộ kịch bản tư vấn bán hàng và thẻ báo giá đã kết xuất hoàn chỉnh.
- **Tính năng**:
  - Xem nhanh thông số hoa, giá bán VNĐ, đối tượng khách hàng mục tiêu.
  - Nút **"Sao chép kịch bản Zalo"** (Copy 1 chạm): Tạo chuỗi tin nhắn Zalo chuẩn mực để nhân viên dán ngay cho khách.

### 1.4. Phân vùng 4: 4. Thùng Rác (30 ngày) (`tab: "trash"`)
- **Điều kiện hiển thị**: **Chỉ hiển thị cho vai trò Điều hành / Quản lý** (`isExecutive`: `dieu_hanh`, `store_admin`, `G3`, `L4`).
- **Nội dung**: Quản lý các ảnh và sản phẩm đã bị xóa tạm (`StorageTrashTab`).
- **Cơ chế an toàn**: Tự động hiển thị huy hiệu số lượng tài nguyên trong thùng rác (`badgeTone: "danger"`), cho phép Khôi phục lại hoặc Xóa vĩnh viễn.

---

## 2. Tính năng chi tiết từng thành phần

### 2.1. Thanh Điều Hướng Tab Chuẩn (`TabActionHeader`)
- Tích hợp các tab kèm huy hiệu số lượng bản ghi tương ứng (`badge`).
- Ô tìm kiếm thời gian thực (`Search Box`): Tìm kiếm xuyên suốt theo tên mẫu hoa, mô tả, phong cách thiết kế, dịp lễ hoặc loài hoa thành phần.
- Nút tác vụ nhanh góc trên bên phải thay đổi linh hoạt theo từng tab (vd: `+ Tải ảnh mới` ở tab Ảnh gốc).

### 2.2. Modal Xác Nhận Xóa An Toàn (`TrashConfirmModal`)
- Chỉ cho phép Điều hành (`isExecutive`) xóa tài nguyên; mọi thao tác xóa đều yêu cầu xác nhận rõ ràng loại tài nguyên và chuyển vào Thùng rác 30 ngày trước khi xóa vĩnh viễn.

---

## 3. Luồng nghiệp vụ & Tình huống sử dụng thực tế

### Tình huống 1: Nhân viên tìm lại nội dung tư vấn hoa đã duyệt tuần trước
1. Khách hàng hỏi thông tin về bó hoa mà tiệm từng đăng bán tuần trước.
2. Nhân viên vào `/kho-du-lieu`, chọn tab **"Dữ liệu AI đã duyệt"**.
3. Tìm kiếm tên bó hoa, bấm nút **"Sao chép kịch bản Zalo"**.
4. Dán ngay vào khung chat với khách, toàn bộ câu chuyện và thông số hoa được gửi đi mượt mà.

### Tình huống 2: Quản lý dọn dẹp các ảnh chụp thử nghiệm
1. Quản lý vào tab **"Ảnh gốc"**, chọn các ảnh mờ, góc chụp xấu và bấm chuyển vào Thùng rác.
2. Dữ liệu gọn gàng, tiết kiệm dung lượng lưu trữ của cửa hàng.

---

## 4. Lợi ích cho Cửa hàng Hoa

- **Tài nguyên tập trung, không phân mảnh**: Toàn bộ tài sản số của tiệm (ảnh chụp, bài viết, công thức) được lưu giữ vĩnh viễn trên đám mây, nhân viên nghỉ việc không lo mất dữ liệu.
- **Tái sử dụng nội dung (Content Reuse)**: Không cần phải viết lại bài bán hàng cho các mẫu hoa quen thuộc.
- **An toàn dữ liệu tối đa**: Cơ chế thùng rác 2 lớp bảo vệ tiệm khỏi những sơ suất xóa nhầm của nhân viên mới.

---

## 5. Quyền truy cập & Phân quyền (RBAC)

- **Xem và tìm kiếm tài nguyên**: Toàn bộ nhân viên.
- **Phê duyệt dữ liệu AI**: Quản lý danh mục, Điều hành.
- **Xóa vĩnh viễn trong thùng rác**: Chỉ Quản trị viên cửa hàng (`store_manager`).

---

## 6. Mối liên kết với các mục khác trong hệ thống

- 🔗 **Liên kết với Quét ảnh hoa (`/tai-anh`)**: Nút tải ảnh mới dẫn sang `/tai-anh`; ảnh quét xong tự động lưu về kho này.
- 🔗 **Liên kết với Sản phẩm & Giá (`/san-pham`)**: Đồng bộ dữ liệu với phân vùng Sản phẩm hoàn thiện.
- 🔗 **Liên kết với Thẻ Chào (`/the-chao`)**: Cung cấp nguồn ảnh và dữ liệu cho các Bộ sưu tập mẫu hoa.

---

## 7. Trạng thái hoàn thiện & Hạn chế trên Production

- **Trạng thái**: Hoàn thiện 100%, hỗ trợ phân trang và tìm kiếm theo thời gian thực.
