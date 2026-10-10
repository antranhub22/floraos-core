# Mục 3: Thẻ Chào Mẫu Hoa (/the-chao) — Kênh Bán Hàng Di Động & Brochure Khách Hàng

> **Đường dẫn**: `/the-chao`
> **Nhóm Sidebar**: Bán hàng & Khách
> **Trạng thái Production**: ✅ **Đang hoạt động (Trọng tâm cốt lõi)**
> **Tài liệu SSOT liên quan**: `src/modules/greeting-card/`, `docs/dac-ta/03b-role-ux.md`

---

## 1. Cấu trúc trang (Page Structure)

Thẻ Chào Mẫu Hoa là vũ khí bán hàng chủ lực của FloraOS trên Production. Hệ thống cung cấp 2 chế độ làm việc linh hoạt:

### 1.1. Chế độ "Gửi nhanh" (`JourneyWizard`)
Luồng wizard 3 bước tinh gọn giúp nhân viên sale tạo và gửi link chào hoa cho khách chỉ trong 30 giây:
- **Bước 1: Chọn Bộ Sưu Tập / Mẫu hoa**: Chọn chủ đề (Sinh nhật, Khai trương, Chia buồn, Valentine...).
- **Bước 2: Cá nhân hóa thông điệp**: Điền tên khách hàng, lời đề tặng riêng của cửa hàng.
- **Bước 3: Tạo Link & Mã QR**: Tự động sinh link di động độc quyền và mã QR để gửi qua Zalo, Messenger, SMS.

### 1.2. Chế độ "Quản lý" (`viewMode = "manager"`)
Hệ thống 5 Tab chuyên sâu tương ứng với các vai trò trong tiệm hoa (tự động lọc theo năng lực của tài khoản):
1. **Tab 1: Bộ sưu tập (`catalog` - Quyền `L1`)**: `CatalogListTab` & `CatalogDetailPanel` — Tạo và quản lý danh mục mẫu hoa kèm bảng giá, mô tả, hiển thị huy hiệu số lượng bộ sưu tập (`catalogCount`).
2. **Tab 2: Theo dõi tiến độ (`tracking` - Quyền `R1`)**: `BrochureOrderTrackingTab` — Giám sát phễu chuyển đổi từ lúc gửi link đến khi khách cọc tiền.
3. **Tab 3: Bán hàng (`sales` - Quyền `R2`)**: `SalesBrochureTab` — Danh sách các phiên gửi link của nhân viên sale, quản lý tương tác của khách, hiển thị huy hiệu số lượt gửi (`sessionCount`).
4. **Tab 4: Điều hành (`payment` - Quyền `R11`)**: `AdminBrochurePaymentTab` — Duyệt tiền cọc và xử lý yêu cầu hủy/hoàn cọc từ khách, hiển thị huy hiệu số yêu cầu hủy chờ duyệt (`pendingCancelCount`).
5. **Tab 5: Điều phối (`coordinator` - Quyền `R3` \| `R4` \| `R5`)**: `CoordinatorBrochureTab` — Giao việc cắm hoa, chỉ định thợ theo dõi đơn phát sinh từ thẻ chào.

### 1.3. Các thành phần hỗ trợ trên Header
- **Breadcrumb**: Đường dẫn quay về Sổ đơn hàng (`/don-hang`).
- **Nút Hướng dẫn sử dụng (`BrochureUserGuideModal`)**: Cẩm nang bỏ túi cho nhân viên.
- **Hộp việc (`InboxButton` / `InboxPanel`)**: Nhắc việc tự động (đơn mới cần gọi, đơn khách yêu cầu hủy, cọc chờ duyệt). Nhấp vào sẽ chuyển tab và cuộn mượt đến thẻ đơn cần xử lý.
- **Bộ chuyển đổi chế độ làm việc (`role="tablist"`)**: 2 nút con nhộng chuyển qua lại giữa "Gửi nhanh" (`Wand2`) và "Quản lý" (`LayoutList`).
- **Nút Làm mới (`RefreshCw`)**: Kích hoạt SWR revalidation toàn trang.
- **Xuất Excel đơn hàng (`ExportOrdersButton`)**: Chỉ hiển thị cho tài khoản có quyền Điều hành hoặc Quản trị (`R11` hoặc `R1`).
- **Thanh sẵn sàng hồ sơ tiệm (`ShopProfileReadiness`)**: Cảnh báo nếu tiệm chưa cài đặt tài khoản ngân hàng nhận tiền cọc hoặc thiếu hotline.

---

## 2. Tính năng chi tiết từng thành phần

### 2.1. Trải nghiệm Khách hàng trên Điện thoại (Web Mobile Brochure)
Khi khách nhận link từ nhân viên:
- **Giao diện như App sang trọng**: Lướt xem ảnh hoa chuẩn tỷ lệ vàng, kèm video chuyển động nếu có.
- **Thông tin hoa minh bạch**: Chi tiết loài hoa, kích thước, tông màu, phụ kiện tặng kèm (thiệp, banner).
- **Tự chọn & Tùy biến**: Khách chọn mẫu ưng ý, nhập lời chúc trên thiệp mừng.
- **Thanh toán VietQR động**: Khách quét mã chuyển khoản đặt cọc chính xác đến từng đồng, hệ thống tự động nhận diện giao dịch.

### 2.2. Tab Bộ Sưu Tập (`CatalogListTab`)
- **Tạo danh mục linh hoạt**: Đặt tên bộ sưu tập, chọn ảnh đại diện, gắn tag sự kiện.
- **Quản lý danh sách mẫu hoa**: Thêm/xóa sản phẩm từ kho hoa của tiệm vào bộ sưu tập.
- **Cập nhật giá theo thời điểm**: Điều chỉnh giá bán hiển thị riêng cho từng dịp lễ mà không làm hỏng giá gốc của sản phẩm.

### 2.3. Hộp việc Thông minh (`InboxButton`)
- Gom toàn bộ tác vụ phát sinh từ kênh Thẻ chào theo thời gian thực:
  - Thông báo: *"Khách [Nguyễn Văn A] vừa đặt cọc 500k cho mẫu Giỏ Hoa Nắng Mai"*.
  - Thông báo: *"Khách [Chị Mai] yêu cầu đổi giờ giao sang 15h"*.
  - Cảnh báo: *"Yêu cầu hủy đơn & hoàn cọc cần duyệt"*.

---

## 3. Luồng nghiệp vụ & Tình huống sử dụng thực tế

### Tình huống 1: Tư vấn khách VIP đặt hoa khai trương công ty
1. Khách nhắn qua Zalo: *"Gửi cho mình mấy mẫu kệ hoa khai trương tầm 1.5 đến 2 triệu"*.
2. Sale vào `/the-chao`, chế độ **Gửi nhanh**:
   - Chọn bộ sưu tập *"Kệ Hoa Khai Trương Hồng Phát"*.
   - Nhập tên khách: *"Anh Hùng - Cty Bất Động Sản Á Châu"*.
   - Nhấn "Tạo link" → Copy link gửi ngay vào Zalo cho anh Hùng.
3. Anh Hùng mở link trên điện thoại, thấy giao diện mang thương hiệu riêng của tiệm hoa, lướt xem 6 mẫu kệ hoa cực nét.
4. Anh Hùng bấm chọn mẫu kệ 1.800.000đ, điền nội dung băng rôn: *"Công ty CP Á Châu chúc mừng khai trương hồng phát"*, quét QR cọc 500k.
5. Cả tiệm nhận ting ting, đơn tự động vào hệ thống.

---

## 4. Lợi ích cho Cửa hàng Hoa

- **Tỷ lệ chốt đơn (Conversion Rate) tăng gấp 3 lần**: Thay vì gửi 20 tấm ảnh rời rạc qua Zalo khiến khách bị rối, gửi 1 link sang trọng giúp khách ra quyết định nhanh hơn 70%.
- **Chấm dứt việc khách "bùng cọc"**: Khách đặt qua link bắt buộc phải quét mã cọc tiền thì đơn mới kích hoạt.
- **Chuẩn hóa thông tin chữ trên băng rôn/thiệp**: Khách tự tay gõ chữ chúc mừng, không bao giờ xảy ra lỗi nhân viên ghi sai chính tả tên người nhận.

---

## 5. Quyền truy cập & Phân quyền (RBAC)

- **Gửi nhanh & Xem bộ sưu tập**: Nhân viên bán hàng (`R2`), Điều phối (`R3`, `R4`, `R5`).
- **Tạo & Sửa Bộ sưu tập**: Quản lý danh mục (`L1`).
- **Duyệt tiền cọc & Yêu cầu hủy**: Chủ tiệm / Điều hành (`R11`).
- **Xem toàn bộ tiến độ & Xuất Excel**: Quản trị viên cấp cao (`R1`).

---

## 6. Mối liên kết với các mục khác trong hệ thống

- 🔗 **Liên kết với Đơn Hàng (`/don-hang`)**: Đơn phát sinh từ thẻ chào tự động xuất hiện trên Kanban đơn hàng.
- 🔗 **Liên kết với Sản Phẩm & Giá (`/san-pham`)**: Lấy dữ liệu hoa, ảnh mẫu và giá niêm yết đưa vào Bộ sưu tập.
- 🔗 **Liên kết với Hồ sơ cửa hàng (`/ho-so`)**: Hiển thị logo tiệm, địa chỉ, hotline và tài khoản VietQR trên link gửi khách.

---

## 7. Trạng thái hoàn thiện & Hạn chế trên Production

- **Trạng thái**: Hoàn thiện 100%, là tính năng mũi nhọn đang vận hành thực tế hiệu quả nhất trên Production.
- **Hạ tầng Realtime**: Tích hợp SWR revalidation chu kỳ 20 giây cho các cảnh báo tài chính và hủy cọc, đảm bảo không trễ lệnh.
