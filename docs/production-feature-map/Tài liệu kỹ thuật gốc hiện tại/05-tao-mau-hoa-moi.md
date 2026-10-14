# Mục 5: Tạo Mẫu Hoa Mới (/san-pham/tao-moi) — Định Danh & Cấu Trúc Thành Phần Hoa (BOM)

> **Đường dẫn**: `/san-pham/tao-moi`
> **Nhóm Sidebar**: Sản phẩm
> **Trạng thái Production**: ✅ **Đang hoạt động**
> **Tài liệu SSOT liên quan**: Chuẩn Atomic Disaggregated Fields, `src/modules/product/`

---

## 1. Cấu trúc trang (Page Structure)

Màn hình Tạo mẫu hoa mới được thiết kế chuẩn chuyên ngành hoa tươi với bố cục 2 cột (Two-Column Master-Detail Layout):

### 1.1. Cột trái: Tải ảnh & Xem trước (Visual Column - 1/3 độ rộng)
- **Khu vực Tải ảnh đại diện**: Hỗ trợ kéo thả hoặc chọn file ảnh hoa thực tế từ máy tính/điện thoại (PNG, JPEG, WebP).
  - Quy trình xử lý asset chuẩn 3 bước: Lấy signed upload URL từ `/api/v1/assets/upload-url` → Upload file trực tiếp lên storage → Đăng ký tài nguyên tại `/api/v1/assets` lấy `asset_id` liên kết vào sản phẩm.
- **Xem trước ảnh trực quan**: Hiển thị ảnh kèm nút xóa/đổi ảnh (tự động thu hồi Blob URL để tránh rò rỉ bộ nhớ).
- **Mã sản phẩm tự động**: Tự động sinh mã ngẫu nhiên định dạng `FL-xxxx` (vd: `FL-4821`) ngay khi mở trang, nhân viên có thể chỉnh sửa theo mã riêng của tiệm.
- **Trạng thái xuất bản**: Chọn xuất bản ngay (`Đang bán - ACTIVE`) hoặc lưu tạm (`Bản nháp - DRAFT`).

### 1.2. Cột phải: Thông số nghiệp vụ & Công thức hoa (Data Column - 2/3 độ rộng)
- **Khối 1: Thông tin cơ bản & Quy cách thiết kế**:
  - Tên mẫu hoa (bắt buộc).
  - Danh mục chuẩn (7 mục): Bó hoa, Giỏ hoa, Hộp hoa, Kệ hoa khai trương, Bình hoa, Hoa chia buồn, Cây cảnh / Quà tặng.
  - Dáng cắm (6 dáng): Dáng tròn, Dáng tam giác, Dáng tự nhiên / Phong cách Hàn, Dáng dài, Dáng thác nước, Dáng quạt.
  - Hướng nhìn (3 hướng): Một mặt, Đa hướng (360 độ), Hai mặt.
  - Bình / Hộp / Giấy gói (Container): Mô tả bao bì (vd: Giấy gói xi măng Hàn Quốc, Giỏ mây đan).
  - Tông màu chủ đạo & Giá niêm yết (VNĐ).
- **Khối 2: Công thức thành phần hoa (BOM - Bill of Materials)**:
  - Phân rã nguyên tử (Atomic Disaggregated Fields): Tên hoa, Số lượng, Đơn vị (cành/bông/nhánh), Màu sắc, Vai trò (`Chủ đạo`, `Phụ`, `Điểm nhấn`, `Lấp đầy`).
  - Nút thêm dòng thành phần hoa, nút xóa từng dòng.
- **Khối 3: Câu chuyện & Mô tả mẫu hoa**:
  - Đoạn văn mô tả cảm xúc, ý nghĩa phong thủy hoặc hướng dẫn chăm sóc hoa tươi lâu.

---

## 2. Tính năng chi tiết từng thành phần

### 2.1. Chuẩn Hóa Phân Rã Thành Phần Hoa (Atomic BOM)
Hệ thống tuân thủ nghiêm ngặt chuẩn kiến trúc không gộp chuỗi:
- Thay vì ghi chung chuỗi tự do *"Hồng đỏ 10 cành, baby trắng 2 nhánh"*, hệ thống bắt buộc phân tách thành các ô độc lập:
  - Cột 1: Tên hoa (Text) — vd: *"Hoa hồng đỏ Ecuador"*.
  - Cột 2: Số lượng (Number) — vd: `10`.
  - Cột 3: Đơn vị (Text) — vd: *"cành"*.
  - Cột 4: Màu sắc (Text) — vd: *"Đỏ nhung"*.
  - Cột 5: Vai trò (Dropdown) — `Chủ đạo` / `Phụ` / `Điểm nhấn` / `Lấp đầy`.
- **Lợi ích**: Giúp thợ cắm hoa nhìn vào là biết ngay cần chuẩn bị bao nhiêu bông, và sau này hệ thống tự động trừ kho nguyên liệu chính xác.

### 2.2. Kiểm tra dữ liệu & Xử lý lỗi (Validation)
- Tự động kiểm tra các trường bắt buộc (Tên hoa, Giá bán, Ảnh hoa).
- Hiển thị thông báo lỗi trực quan ngay dưới ô nhập liệu nếu thiếu thông tin trước khi gửi lên server.

---

## 3. Luồng nghiệp vụ & Tình huống sử dụng thực tế

### Tình huống 1: Thợ cắm hoa vừa sáng tạo ra một mẫu giỏ hoa mới tại tiệm
1. Thợ cắm xong giỏ hoa, dùng điện thoại chụp 1 tấm ảnh đẹp.
2. Mở FloraOS vào `/san-pham/tao-moi`, tải ảnh vừa chụp lên.
3. Nhập tên: *"Giỏ Hoa Ban Mai Rực Rỡ"*, giá: `850.000đ`.
4. Chọn Dáng cắm: *"Dáng tự nhiên / Phong cách Hàn"*, Hướng nhìn: *"Đa hướng (360 độ)"*.
5. Khai báo thành phần:
   - Hướng dương: 5 cành (Chủ đạo).
   - Hoa hồng vàng: 8 cành (Phụ).
   - Hoa baby trắng: 3 nhánh (Điểm nhấn).
   - Lá bạc (Eucalyptus): 5 nhánh (Lấp đầy).
6. Bấm **"Lưu & Xuất bản"**. Mẫu hoa lập tức có mặt trong kho để Sale tư vấn cho khách.

---

## 4. Lợi ích cho Cửa hàng Hoa

- **Chuẩn hóa công thức cắm hoa**: Khi có nhiều thợ hoặc thuê thợ thời vụ mùa lễ, bất kỳ thợ nào nhìn vào công thức BOM cũng có thể cắm ra sản phẩm giống 95% mẫu gốc.
- **Tính toán giá vốn chính xác (Costing)**: Tách bạch từng loại hoa giúp chủ tiệm kiểm soát biên lợi nhuận của từng mẫu hoa (đảm bảo không bị bán lỗ khi hoa nguyên liệu lên giá).
- **Hình ảnh chuyên nghiệp đồng bộ**: Lưu trữ đầy đủ thuộc tính dáng cắm, hướng nhìn giúp khách hàng online hiểu rõ sản phẩm trước khi mua.

---

## 5. Quyền truy cập & Phân quyền (RBAC)

- **Quyền tạo sản phẩm**: Thợ cắm hoa chính (`florist`), Quản lý danh mục (`L1`), Quản trị cửa hàng (`store_manager`).
- **Lưu ý**: Dữ liệu lưu vào CSDL luôn được gắn chặt với `organization_id` của tiệm, bảo mật tuyệt đối không lộ mẫu sang tiệm khác.

---

## 6. Mối liên kết với các mục khác trong hệ thống

- 🔗 **Liên kết với Sản phẩm & Giá (`/san-pham`)**: Nút quay lại danh sách hoặc tự động chuyển hướng sau khi lưu thành công.
- 🔗 **Liên kết với Thẻ Chào (`/the-chao`)**: Mẫu hoa tạo xong có thể đưa ngay vào các Bộ sưu tập gửi khách.
- 🔗 **Liên kết với Kho dữ liệu (`/kho-du-lieu`)**: Ảnh hoa tải lên được lưu vào phân vùng asset riêng của tiệm.

---

## 7. Trạng thái hoàn thiện & Hạn chế trên Production

- **Trạng thái**: Hoàn thiện 100%, hoạt động ổn định trên cả máy tính để bàn và điện thoại di động.
- **Tối ưu UX**: Cơ chế tự sinh mã sản phẩm ngẫu nhiên giúp tiết kiệm thao tác khi nhân viên cần nhập nhanh nhiều mẫu.
