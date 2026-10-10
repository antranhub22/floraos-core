# Mục 9: Hồ Sơ Cửa Hàng (/ho-so) — Danh Tính Doanh Nghiệp & Nhận Diện Thương Hiệu

> **Đường dẫn**: `/ho-so`
> **Nhóm Sidebar**: Thiết lập
> **Trạng thái Production**: ✅ **Đang hoạt động**
> **Tài liệu SSOT liên quan**: `src/components/profiles/`, `src/modules/profiles/`

---

## 1. Cấu trúc trang (Page Structure)

Màn hình Hồ Sơ Cửa Hàng là nơi định hình toàn bộ "bộ mặt thương hiệu" của tiệm hoa trên không gian số, từ thông tin pháp lý, số tài khoản VietQR nhận tiền, đến bảng màu nhận diện và chính sách bán hàng. Hệ thống hỗ trợ 2 chế độ:
- **Chế độ Hành trình (`ProfileJourneyWorkspace`)**: Hướng dẫn từng bước thiết lập cho tiệm mới.
- **Chế độ Chuyên gia** (`isExpertMode` lưu `localStorage` với key `floraos_profile_expert_mode`): Bảng cấu hình 5 tab toàn diện kèm `TabActionHeader`.

### 1.1. Tab 1: Hồ sơ kinh doanh (`business`)
- **Thông tin cơ bản**: Tên pháp lý cửa hàng, Tên thương hiệu hiển thị, Mã số thuế, Hotline chính, Hotline phụ, Email liên hệ, Website.
- **Địa chỉ kinh doanh**: Địa chỉ cửa hàng, Quận/Huyện, Tỉnh/Thành phố (dùng để tính phí ship và hiển thị trên thiệp A6).
- **Tài khoản ngân hàng & VietQR**: Tên ngân hàng, Số tài khoản, Tên chủ tài khoản (đồng bộ trực tiếp sang mã QR thanh toán trên Thẻ chào và Đơn hàng).

### 1.2. Tab 2: Nhận diện thương hiệu (`brand`)
- **Bảng màu ngũ hành 5 màu Hex** (Huy hiệu *"5 Màu Hex"*): Màu chủ đạo (Primary), Màu phụ (Secondary), Màu nhấn (Accent), Màu nền (Background), Màu chữ (Text).
- **Logo cửa hàng**: Logo vuông (Avatar), Logo ngang (Header website), Favicon.
- **Khẩu hiệu thương hiệu (Slogan)** & Phong cách hoa đặc trưng (Hàn Quốc, Cổ điển Châu Âu, Hiện đại).

### 1.3. Tab 3: Tài nguyên thương hiệu (`assets`)
- Quản lý tài nguyên số thương hiệu (`BrandAssetsManagerTab`, huy hiệu *"Master"*): Khung ảnh thiệp chúc mừng, phông nền in ấn, mẫu băng rôn khai trương độc quyền của tiệm hoa.

### 1.4. Tab 4: Chính sách & Cam kết (`sales`)
Tích hợp toàn diện 6 phân khu cấu hình nghiệp vụ bán hàng:
1. **Ưu đãi, Cam kết & Thỏa thuận (`StorePoliciesSection`)**: Quản lý cam kết đổi trả, ảnh nghiệm thu, thỏa thuận dịch vụ (lưu tập trung tại `floraos_store_policies`).
2. **Chính sách thanh toán (`PaymentPolicySection`)**: Giao hoa có cần thu đủ trước, thời hạn thanh toán sau khi đặt.
3. **Mức đặt cọc theo bậc (`DepositLevelsSection`)**: Quy định tỷ lệ cọc (50% hoặc 100%) theo từng phân khúc giá trị đơn hàng.
4. **Thời hạn & Tự động hủy đơn (`BrochureStepTimeoutSettings`)**: Cấu hình thời gian tối đa khách được giữ đơn qua link trước khi hệ thống tự động hủy.
5. **Quà tặng & Cam kết mặc định (`SalesDefaultsForm`)**: Quà tặng kèm (thiệp mừng, banner) và câu kêu gọi hành động CTA.
6. **Câu chào mở đầu Zalo tùy chỉnh (`GreetingLineOverrideForm`)**: Ghi đè câu chào mở đầu trong kịch bản tư vấn Zalo phù hợp với văn hóa của tiệm.

### 1.5. Tab 5: Dịp lễ & Giọng văn (`occasions`)
- Cấu hình các dịp lễ cửa hàng phục vụ trong năm (20/10, 8/3, Valentine, Nhà giáo Việt Nam 20/11...).
- Chọn giọng văn AI mặc định khi tư vấn (`OccasionsSettingsForm`): Thân thiện ngọt ngào, Trang trọng lịch thiệp, hay Tươi vui tràn đầy năng lượng.

---

## 2. Tính năng chi tiết từng thành phần

### 2.1. Cấu Hình Tài Khoản Nhận Cọc VietQR
- Tích hợp chuẩn VietQR Napas 247: Khi khách bấm cọc từ Thẻ chào `/the-chao`, mã QR tự động ghép số tài khoản của tiệm + số tiền cọc chính xác + mã đơn hàng. Tiệm nhận tiền ngay lập tức không qua trung gian.

### 2.2. Đồng Bộ Tự Động Toàn Hệ Thống
- Mọi thay đổi về hotline, địa chỉ hoặc logo ở trang này lập tức tự động cập nhật sang:
  - Header của Thẻ chào khách hàng.
  - Phiếu in đơn hàng A6 / Hóa đơn giao hoa.
  - Lời chào cuối tin nhắn tư vấn AI.

---

## 3. Luồng nghiệp vụ & Tình huống sử dụng thực tế

### Tình huống 1: Chủ tiệm hoa mới mở tài khoản FloraOS
1. Chủ tiệm vào `/ho-so`.
2. Điền tên tiệm: *"Flora Boutique Hanoi"*, hotline: *"0988.123.456"*.
3. Tải logo tiệm lên, nhập số tài khoản Techcombank của chủ tiệm.
4. Bấm **"Lưu hồ sơ"**.
5. Kể từ giây phút này, mọi link gửi cho khách đều hiển thị thương hiệu Flora Boutique chuyên nghiệp.

### Tình huống 2: Thiết lập chính sách cọc trước dịp lễ 20/10
1. Vào tab **"Chính sách & Cam kết"**.
2. Đổi mức cọc thành 100% đối với các đơn ngày 19 và 20/10 để đảm bảo không bị bom hoa.
3. Bấm **"Lưu thay đổi"**. Toàn bộ link thẻ chào tạo trong dịp lễ sẽ tự động yêu cầu cọc 100%.

---

## 4. Lợi ích cho Cửa hàng Hoa

- **Tạo dựng niềm tin tuyệt đối với khách**: Khách nhận được link mang logo, màu sắc và tài khoản ngân hàng chính chủ của tiệm, không còn cảm giác lo lắng bị lừa đảo.
- **Tự động hóa hoàn toàn khâu thu cọc**: Không cần nhân viên phải ngồi nhắn số tài khoản và cú pháp chuyển khoản cho từng khách.
- **Bảo vệ quyền lợi tiệm hoa**: Chính sách hoàn hủy rõ ràng giúp giải quyết êm đẹp mọi tranh chấp với khách hàng khó tính.

---

## 5. Quyền truy cập & Phân quyền (RBAC)

- **Xem thông tin**: Toàn bộ nhân viên.
- **Sửa đổi hồ sơ & tài khoản ngân hàng**: Chỉ dành riêng cho Chủ tiệm / Quản trị viên cấp cao nhất (`store_admin` / `dieu_hanh`).

---

## 6. Mối liên kết với các mục khác trong hệ thống

- 🔗 **Liên kết với Thẻ Chào (`/the-chao`)**: Cung cấp dữ liệu logo, hotline, tài khoản VietQR và chính sách cọc.
- 🔗 **Liên kết với Đơn Hàng (`/don-hang`)**: Dữ liệu tài khoản để in hóa đơn và đối soát thanh toán.
- 🔗 **Liên kết với Cài đặt (`/cai-dat`)**: Liên kết sâu giữa 2 màn hình quản trị hệ thống.

---

## 7. Trạng thái hoàn thiện & Hạn chế trên Production

- **Trạng thái**: Hoàn thiện 100%, có cơ chế kiểm tra tính sẵn sàng (`ShopProfileReadiness`) để nhắc nhở chủ tiệm hoàn thiện hồ sơ nếu còn thiếu thông tin nhận tiền.
