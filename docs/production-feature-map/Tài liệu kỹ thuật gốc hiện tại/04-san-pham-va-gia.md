# Mục 4: Sản Phẩm & Giá (/san-pham) — Quản Trị Kho Mẫu Hoa

> **Đường dẫn**: `/san-pham`
> **Nhóm Sidebar**: Sản phẩm
> **Trạng thái Production**: ✅ **Đang hoạt động**
> **Tài liệu SSOT liên quan**: `src/components/products/`, `src/modules/product/`

---

## 1. Cấu trúc trang (Page Structure)

Màn hình Sản Phẩm & Giá là kho lưu trữ toàn bộ các mẫu hoa, thiết kế và bảng giá niêm yết của tiệm:

### 1.1. Top-Right Action Header
- **Tiêu đề phân hệ**: Nhãn `Kho sản phẩm của hàng` + Tiêu đề lớn `Mẫu hoa`.
- **Tác vụ chính hiển thị trực tiếp**:
  - `Tải lại danh sách` (`button` icon `RefreshCw`): Tải lại kho sản phẩm tức thì.
  - `Nhập Excel & Ảnh` (`button` icon `FileSpreadsheet`): Nhập hàng loạt danh mục từ bảng tính Excel và thư mục ảnh (`/san-pham/nhap-hang-loat`).
  - `Phân tích AI` (`button` icon `Sparkles`): Chuyển sang màn hình quét ảnh hoa để AI tự động bóc tách loài hoa và định giá (`/tai-anh`).
  - `Thêm sản phẩm` (`Button variant="primary"` icon `Plus`): Điều hướng sang màn hình tạo mẫu hoa mới thủ công (`/san-pham/tao-moi`).

### 1.2. Thanh tìm kiếm & Bộ lọc Đa Chiều (`ProductSearchFilterBar`)
- **Ô tìm kiếm**: Tìm theo tên mẫu hoa, mã sản phẩm (`code`), hoặc từ khóa thành phần hoa (tích hợp debounce).
- **Bộ lọc Danh mục**: Tất cả, Bó hoa, Giỏ hoa, Kệ khai trương, Hoa chia buồn, Hộp hoa, Bình hoa... (tự động gộp thêm các danh mục mới từ kho sản phẩm thực tế của tiệm).
- **Bộ lọc Dịp lễ (Occasion)**: Sinh nhật, Khai trương, Tình yêu/Valentine, Chúc mừng, Chia buồn...
- **Bộ lọc Khoảng giá**: Dưới 500k, 500k - 1 triệu, 1 triệu - 2 triệu, Trên 2 triệu.
- **Sắp xếp**: Mới nhất, Giá tăng dần, Giá giảm dần, Tên A-Z.
- **Công tắc hiển thị**: Chuyển đổi linh hoạt giữa **Dạng Lưới (Grid View)** và **Dạng Bảng (Table View)**.

### 1.3. Khu vực hiển thị danh sách sản phẩm & Phân trang
- **Dạng Lưới (Grid)**: Thẻ sản phẩm trực quan gồm ảnh đại diện sắc nét (`ProductThumb`), mã hoa (`#code`), tên hoa, giá niêm yết (`PriceLabel`), danh mục, badge trạng thái (`StatusBadge`), và nút đưa vào thùng rác dành riêng cho Điều hành.
- **Dạng Bảng (Table)**: Xem dạng danh sách chi tiết nhiều cột cho kế toán và quản lý kiểm soát giá hàng loạt.
- **Cơ chế Phân trang**: Sử dụng Cursor-based Pagination (`nextCursor`), nút "Tải thêm" hiển thị khi còn sản phẩm tiếp theo.
- **Modal xác nhận Thùng rác (`TrashConfirmModal`)**: Ngăn chặn xóa nhầm, cho phép đưa vào khu lưu trữ tạm trước khi xóa vĩnh viễn.

### 1.4. Trang Chi Tiết Sản Phẩm (`/san-pham/[id]`)
Khi nhấp vào bất kỳ mẫu hoa nào trên lưới hoặc bảng, hệ thống chuyển sang trang chi tiết chuyên sâu:
- **Header**: Nút quay lại danh sách (`ArrowLeft`), Tên sản phẩm, và nút Lối tắt *"Mở Studio Tính Năng"* (`/san-pham/[id]/tinh-nang`).
- **Thẻ Tổng quan**: Tên hoa, Mã định danh, Huy hiệu trạng thái xuất bản (`Đang bán`, `Nháp`, `Lưu trữ`).
- **Định dạng thiết kế hoa**: Danh mục (`category`), Kiểu dáng (`shape`), Hướng nhìn (`facing`), Vật chứa/giấy gói (`container`).
- **Thông số kỹ thuật & BOM**: Thuộc tính mở rộng (`attributes`), giá bán VNĐ, ngày tạo, ngày cập nhật.

---

## 2. Tính năng chi tiết từng thành phần

### 2.1. Thẻ Sản Phẩm (`ProductCard`)
| Thành phần trên thẻ | Ý nghĩa nghiệp vụ |
|---|---|
| **Ảnh đại diện (`masterImageUrl`)** | Ảnh hoa chất lượng cao đã qua xử lý nền hoặc chụp tại tiệm |
| **Mã hoa (`code`)** | Mã duy nhất của tiệm (vd: `BH-001`, `GH-204`) để thợ và khách đối chiếu |
| **Giá bán (`price`)** | Giá bán niêm yết bằng VNĐ |
| **Badge Trạng thái** | `Đang bán` (Hiển thị cho khách), `Nháp` (Đang soạn), `Lưu trữ` (Hết mùa) |
| **Nút thùng rác (Trash)** | Chỉ hiển thị cho Điều hành (`isExecutive`) để bảo vệ dữ liệu sản phẩm |

### 2.2. Bộ lọc thông minh theo Dịp (`Occasion`)
- Cho phép nhân viên sale lọc nhanh: Khi khách hỏi *"Em ơi có giỏ hoa nào mừng khai trương tầm 1 triệu không?"*, nhân viên chọn ngay Dịp *"Khai trương"* + Giá *"1 - 2 triệu"* để tìm ra các mẫu phù hợp trong 3 giây.

---

## 3. Luồng nghiệp vụ & Tình huống sử dụng thực tế

### Tình huống 1: Nhân viên tìm mẫu hoa báo giá cho khách đang đứng tại quầy
1. Khách muốn xem các mẫu bình hoa phong lan tặng tân gia.
2. Nhân viên vào `/san-pham`, chọn danh mục **"Bình hoa"**.
3. Chuyển sang chế độ **Dạng Lưới (Grid)**, đưa máy tính bảng hoặc màn hình cho khách xem hình ảnh to, rõ ràng kèm giá công khai.

### Tình huống 2: Quản lý điều chỉnh giá danh mục hoa trước mùa Lễ 20/10
1. Quản lý vào `/san-pham`, chuyển sang **Dạng Bảng (Table)**.
2. Lọc danh mục **"Bó hoa"**.
3. Rà soát danh sách giá niêm yết để cập nhật lại các mẫu hoa hồng ngoại nhập khẩu theo biến động giá chợ đầu mối.

---

## 4. Lợi ích cho Cửa hàng Hoa

- **Tổ chức kho dữ liệu mẫu hoa chuyên nghiệp**: Không còn tình trạng ảnh mẫu hoa lưu rải rác trên Zalo cá nhân của từng nhân viên gây thất lạc.
- **Tra cứu mẫu hoa tức thì**: Bộ lọc đa chiều theo Dịp, Danh mục, Khoảng giá giúp nhân viên tìm mẫu trong tích tắc.
- **Bảo toàn tính toàn vẹn dữ liệu**: Cơ chế phân quyền xóa sản phẩm chỉ dành riêng cho Chủ tiệm/Quản lý.

---

## 5. Quyền truy cập & Phân quyền (RBAC)

- **Xem và tìm kiếm sản phẩm**: Tất cả nhân viên cửa hàng.
- **Thêm mới & Chỉnh sửa sản phẩm**: Quyền Quản trị danh mục (`L1`) hoặc Điều hành.
- **Xóa sản phẩm vào thùng rác**: Bắt buộc quyền Quản lý (`isExecutive` / `G3` / `L4`).

---

## 6. Mối liên kết với các mục khác trong hệ thống

- 🔗 **Liên kết với Tạo mẫu hoa mới (`/san-pham/tao-moi`)**: Nút "Thêm sản phẩm".
- 🔗 **Liên kết với Nhập Excel & Ảnh (`/san-pham/nhap-hang-loat`)**: Nhập danh mục đồng loạt.
- 🔗 **Liên kết với Quét ảnh hoa (`/tai-anh`)**: Phân tích AI ảnh hoa mới để thêm vào kho.
- 🔗 **Liên kết với Thẻ Chào (`/the-chao`)**: Chọn mẫu hoa từ kho này để đưa vào Bộ sưu tập gửi khách.

---

## 7. Trạng thái hoàn thiện & Hạn chế trên Production

- **Trạng thái**: Hoàn thiện 100%, hỗ trợ phân trang Cursor-based Pagination mượt mà khi kho hoa lên đến hàng ngàn sản phẩm.
- **Tương thích Mobile**: Tự động co giãn lưới từ 2 cột trên điện thoại đến 5 cột trên màn hình máy tính lớn.
