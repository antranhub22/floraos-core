# Mục 7: Quét Ảnh Hoa (/tai-anh) — Thị Giác Máy Tính & Phân Tích AI

> **Đường dẫn**: `/tai-anh`
> **Nhóm Sidebar**: Sản phẩm
> **Trạng thái Production**: ✅ **Đang hoạt động**
> **Tài liệu SSOT liên quan**: `src/modules/products/`, `src/components/templates/product-analysis/`

---

## 1. Cấu trúc trang (Page Structure)

Màn hình Quét ảnh hoa là trung tâm ứng dụng Trí tuệ Nhân tạo Thị giác Máy tính (Computer Vision) của FloraOS. Bố cục gồm 3 chặng phân tích lũy tiến:

### 1.1. Chặng 1: Nhận diện & Bóc tách Thị giác (`M01a` - Vision Analysis)
- **Khối Hướng Dẫn Nghiệp Vụ (`M01aGuidanceCard`)**: Hướng dẫn tiêu chuẩn chụp ảnh hoa rõ nét, đủ ánh sáng và phông nền sạch.
- **Tải ảnh đầu vào**: Chụp trực tiếp từ camera hoặc tải ảnh mẫu hoa từ máy tính/điện thoại.
- **Hệ thống AI xử lý**:
  - Nhận diện loài hoa (Hoa hồng, Cẩm tú cầu, Hướng dương, Baby...).
  - Đếm số lượng cành ước tính và độ tin cậy (`confidence score`).
  - Phân tích màu sắc chủ đạo, phụ, điểm nhấn.
  - Nhận diện dáng cắm (tròn, tam giác, thác nước) và phong cách thiết kế.
  - Đánh giá chất lượng ảnh chụp (độ nét, ánh sáng, góc chụp).
- **Thẻ Kết quả Thị giác (`AnalysisResultCard`)**: Cho phép nhân viên chỉnh sửa trực tiếp từng thông số và duyệt bản phân tích.

### 1.2. Chặng 2: Sinh Nội Dung Thương Mại (`M01b` - Commercial Copy)
- **Khối Hướng Dẫn (`M01bGuidanceCard`)**: Hướng dẫn cách chọn góc tiếp cận cảm xúc cho bài đăng.
- **Sinh nội dung tự động (`CommercialContentCard`)**:
  - Đặt tên sản phẩm thương mại: AI tự động gợi ý các phương án tên sang trọng, hợp thị hiếu (vd: *"Vũ Khúc Nắng Mai"*, *"Thanh Âm Mùa Thu"*).
  - Soạn thảo mô tả bán hàng & Ý nghĩa câu chuyện hoa: Viết câu chuyện sản phẩm truyền cảm hứng, gợi ý đối tượng người nhận.
  - Bộ thẻ phân loại (Tags & Occasions): Gợi ý các dịp tặng hoa phù hợp (Sinh nhật, 20/10, Valentine, Chúc mừng...).
  - Điểm bán hàng độc nhất (Key Selling Points): Nhấn mạnh ưu điểm mẫu hoa.

### 1.3. Chặng 3: Kịch Bản Tư Vấn & Báo Giá (`M01c` - Sales Pitch)
- **Khối Hướng Dẫn (`M01cGuidanceCard`)**: Hướng dẫn tư vấn chốt đơn nhanh.
- **Thẻ Kịch Bản Bán Hàng (`SalesPitchCard`)**:
  - Kịch bản nói với khách (Sales Pitch): Soạn sẵn kịch bản Zalo hoàn chỉnh kèm nút sao chép 1 chạm.
  - Đồng bộ Hồ Sơ Tiệm Thật (`useTenantProfile`): Tự động điền tên tiệm, hotline, danh sách quà tặng (thiệp, banner), cam kết hoàn tiền, và câu chào mở đầu riêng của tiệm.
  - Tông giọng theo dịp lễ: Tự động điều chỉnh phong cách nói chuyện (trang trọng, tươi vui, ấm áp) dựa trên dịp lễ chọn lọc từ `/api/v1/occasions`.
  - Phân khúc giá gợi ý: Ước tính khoảng giá thị trường dựa trên công thức hoa nhận diện được.

---

## 2. Tính năng chi tiết từng thành phần

### 2.1. Thanh Điều Hướng Tiến Trình (`FlowSteps`)
- Hiển thị trực quan 3 bước phân tích tuần tự:
  1. *Bước 1: Quét ảnh & Nhận diện thị giác*
  2. *Bước 2: Sinh bài viết thương mại*
  3. *Bước 3: Kịch bản tư vấn Zalo & Báo giá*
- Nhân viên có thể chuyển đổi linh hoạt giữa các bước đã hoàn thành mà không bị mất dữ liệu.

### 2.2. Thẻ Kết Quả Phân Tích (`AnalysisResultCard` & `CommercialContentCard`)
- Hỗ trợ **chỉnh sửa trực tiếp tại chỗ (In-place Editing)** cho mọi trường thông tin (tên hoa, số lượng cành, màu sắc, phong cách, câu chuyện).
- Đánh giá độ an toàn dữ liệu (`JudgmentState: safe / warning`).

### 2.3. Bộ Chọn Bản Phân Tích Đã Duyệt (`ApprovedAnalysesSelector`)
- Nạp danh sách 50 ảnh hoa đã từng quét và duyệt trong quá khứ (`/api/v1/vision/analyses?approval_state=APPROVED&limit=50`).
- Cho phép nhân viên chọn lại bất kỳ mẫu hoa cũ nào để sinh ngay kịch bản bán hàng mới mà không cần quét lại từ đầu.

---

## 3. Luồng nghiệp vụ & Tình huống sử dụng thực tế

### Tình huống 1: Tiệm hoa nhập giống hoa mới chưa có mô tả
1. Thợ cắm một bó hoa mới với giống hồng ngoại lạ.
2. Mở `/tai-anh`, chụp ảnh bó hoa đưa lên hệ thống.
3. Trong 5-10 giây:
   - AI bóc tách chính xác loài hoa và số lượng.
   - AI viết sẵn bài đăng Facebook bán hàng cực kỳ cảm xúc.
   - AI gợi ý tên bó hoa: *"Hơi Thở Paris"*.
4. Nhân viên bấm duyệt, mẫu hoa tự động lưu vào kho và sẵn sàng đăng bán.

---

## 4. Lợi ích cho Cửa hàng Hoa

- **Giải phóng nhân viên khỏi việc "vắt óc" nghĩ bài viết**: Nhân viên bán hoa không cần giỏi văn chương vẫn có nội dung tư vấn và bài đăng bán hàng chuẩn mực.
- **Tiết kiệm thời gian tạo sản phẩm**: Tự động hóa 80% công đoạn gõ tên, đếm hoa, nhập thuộc tính.
- **Nâng tầm chất lượng tư vấn**: Cung cấp kịch bản tư vấn chuyên nghiệp giúp nhân viên mới tự tin chốt đơn.

---

## 5. Quyền truy cập & Phân quyền (RBAC)

- **Quyền quét ảnh và phân tích**: Thợ cắm hoa, Nhân viên bán hàng, Quản lý danh mục.
- **Chi phí**: Mỗi lượt quét tiêu hao credit AI theo cấu hình của hệ thống.

---

## 6. Mối liên kết với các mục khác trong hệ thống

- 🔗 **Liên kết với Sản phẩm & Giá (`/san-pham`)**: Nút "Phân tích AI" tại trang sản phẩm dẫn sang đây; kết quả sau khi duyệt có thể lưu thành sản phẩm mới.
- 🔗 **Liên kết với Kho dữ liệu (`/kho-du-lieu`)**: Ảnh sau khi phân tích được lưu trữ trong phân vùng Dữ liệu đã duyệt.

---

## 7. Trạng thái hoàn thiện & Hạn chế trên Production

- **Trạng thái**: Hoàn thiện 100%, hỗ trợ cơ chế Idempotency Key chống phân tích trùng lặp khi người dùng bấm liên tiếp.
