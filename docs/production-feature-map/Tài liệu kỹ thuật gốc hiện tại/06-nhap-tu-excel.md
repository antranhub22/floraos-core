# Mục 6: Nhập từ Excel & Ảnh (/san-pham/nhap-hang-loat) — Nạp Dữ Liệu Sản Phẩm Hàng Loạt

> **Đường dẫn**: `/san-pham/nhap-hang-loat`
> **Nhóm Sidebar**: Sản phẩm
> **Trạng thái Production**: ✅ **Đang hoạt động**
> **Tài liệu SSOT liên quan**: `src/components/products/bulk-import/`

---

## 1. Cấu trúc trang (Page Structure)

Màn hình Nhập từ Excel & Ảnh giải quyết bài toán lớn nhất của các cửa hàng hoa khi mới chuyển đổi số: **làm thế nào để đưa hàng trăm mẫu hoa đang có vào hệ thống mà không phải gõ tay từng sản phẩm**. Bố cục gồm 4 giai đoạn logic:

### 1.1. Header & Tải File Mẫu Chuẩn (`BulkImportHeader`)
- **Tải file mẫu Excel**: Cung cấp nút tải trực tiếp file mẫu chuẩn: `/templates/FloraOS_Template_Master_Kho_San_Pham.xlsx`.
- **Nút quay lại**: Về màn hình Sản phẩm & Giá.
- **Nút Đặt lại (Reset)**: Xóa toàn bộ phiên nhập hiện tại để làm lại từ đầu.

### 1.2. Khu vực Kéo Thả Kép (`ImportDropzones`)
Gồm 2 ô dropzone độc lập nhưng đồng bộ tự động:
1. **Dropzone 1: Tải file Excel**: Chọn file `.xlsx` hoặc `.xls` chứa danh mục sản phẩm (mã hoa, tên hoa, giá bán, danh mục, tên file ảnh tương ứng).
2. **Dropzone 2: Tải thư mục / nhiều file ảnh**: Cho phép chọn cùng lúc hàng chục hoặc hàng trăm file ảnh hoa từ máy tính.

### 1.3. Bảng Đối Chiếu & Xem Trước Dữ Liệu (`ImportPreview`)
- **Tự động ghép nối ảnh thông minh (`matchImages`)**:
  - Ưu tiên 1: Tên file ảnh khớp chính xác với cột "Tên file ảnh" trong Excel.
  - Ưu tiên 2: Tên file ảnh khớp với Mã sản phẩm (SKU/Code).
  - Ưu tiên 3: Liên kết Google Drive (nếu có cột link Drive trong Excel).
- **Thống kê trạng thái nạp (`importStats`)**:
  - Số dòng hợp lệ sẵn sàng nạp.
  - Số dòng đã khớp ảnh thành công (`MATCHED`).
  - Số dòng thiếu ảnh (`NO_IMAGE`).
  - Số dòng lỗi dữ liệu (`ERROR`).
- **Xem trước ảnh thumbnail**: Hiển thị ảnh thật ngay trên từng dòng dữ liệu để nhân viên kiểm tra trực quan.

### 1.4. Bảng Tiến Trình & Kết Quả Nạp (`ImportResultPanel`)
- Thanh tiến độ nạp theo thời gian thực (hiển thị phần trăm và số lượng đã nạp).
- Thống kê chi tiết sau khi hoàn thành: Số sản phẩm tạo mới thành công, số sản phẩm cập nhật giá, danh sách dòng bị lỗi (nếu có).

---

## 2. Tính năng chi tiết từng thành phần

### 2.1. Thuật Toán Tự Khớp Ảnh Thông Minh
- Nhân viên không cần ngồi chọn từng ảnh cho từng sản phẩm. Chỉ cần đặt tên file ảnh trùng với mã hoa (vd: `BO-01.jpg` ứng với mã sản phẩm `BO-01`), hệ thống tự động nhận diện và gán đúng 100%.

### 2.2. Bảo Lưu Phiên Làm Việc (`import-session-storage`)
- Khi nhân viên đang tải file dở nhưng vô tình tải lại trang hoặc mất mạng, hệ thống tự động lưu trạng thái vào `sessionStorage` theo đúng `organization_id`. Khi mở lại trang, toàn bộ danh sách xem trước sẽ được khôi phục nguyên vẹn.

---

## 3. Luồng nghiệp vụ & Tình huống sử dụng thực tế

### Tình huống 1: Tiệm hoa mới gia nhập FloraOS nạp 200 mẫu hoa cũ
1. Quản lý tải file `FloraOS_Template_Master_Kho_San_Pham.xlsx`.
2. Điền thông tin 200 mẫu hoa vào Excel, cột ảnh điền `hoa-01.jpg`, `hoa-02.jpg`...
3. Vào `/san-pham/nhap-hang-loat`:
   - Thả file Excel vào ô thứ nhất.
   - Chọn toàn bộ 200 tấm ảnh trong máy tính thả vào ô thứ hai.
4. Hệ thống tự động ghép ảnh vào từng dòng. Quản lý kiểm tra lướt qua thấy xanh 100%.
5. Nhấn **"Bắt đầu nhập dữ liệu"**. Trong 1-2 phút, toàn bộ 200 mẫu hoa được tạo thành công trên hệ thống.

---

## 4. Lợi ích cho Cửa hàng Hoa

- **Tiết kiệm hàng chục giờ nhập liệu**: Giảm 95% thời gian so với việc tạo thủ công từng sản phẩm.
- **Không bao giờ nhầm lẫn ảnh sản phẩm**: Thuật toán khớp tên file tự động loại bỏ rủi ro gán nhầm ảnh giỏ hoa này vào giá của bó hoa khác.
- **Chuyển đổi số trong 1 ngày**: Giúp tiệm hoa chuyển đổi toàn bộ danh mục từ sổ sách hoặc Excel cũ lên FloraOS chỉ sau một buổi sáng.

---

## 5. Quyền truy cập & Phân quyền (RBAC)

- **Quyền nhập hàng loạt**: Bắt buộc quyền Quản lý danh mục (`L1`) hoặc Quản trị viên cửa hàng (`store_manager`).
- **An toàn dữ liệu đa tổ chức**: Bộ nhớ tạm và quy trình nạp luôn được cô lập chặt chẽ theo `organization_id`.

---

## 6. Mối liên kết với các mục khác trong hệ thống

- 🔗 **Liên kết với Sản phẩm & Giá (`/san-pham`)**: Nút tắt "Nhập Excel & Ảnh" dẫn đến màn hình này; sau khi nhập xong dữ liệu sẽ hiển thị ngay tại kho sản phẩm.
- 🔗 **Liên kết với Thẻ Chào (`/the-chao`)**: Các mẫu hoa vừa nạp hàng loạt có thể đưa ngay vào các Bộ sưu tập bán hàng.

---

## 7. Trạng thái hoàn thiện & Hạn chế trên Production

- **Trạng thái**: Hoàn thiện 100%, có cơ chế thu hồi bộ nhớ (revoke Blob URLs) chống tràn RAM trình duyệt khi tải hàng trăm ảnh dung lượng lớn.
