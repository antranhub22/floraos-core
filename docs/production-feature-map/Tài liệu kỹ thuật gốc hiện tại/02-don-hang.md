# Mục 2: Đơn Hàng (/don-hang) — Vận Hành & Kênh Chào Bán

> **Đường dẫn**: `/don-hang`
> **Nhóm Sidebar**: Bán hàng & Khách
> **Trạng thái Production**: ✅ **Đang hoạt động**
> **Tài liệu SSOT liên quan**: `docs/dac-ta/03b-role-ux.md` (Vai Sale & Điều hành), `src/modules/greeting-card/`

---

## 1. Cấu trúc trang (Page Structure)

Màn hình Đơn Hàng là trung tâm xử lý doanh thu và điều phối sản xuất của tiệm hoa. Bố cục gồm 3 tầng chính:

### 1.1. Top-Right Action Header (Thanh tác vụ trên cùng)
- **Tiêu đề phân hệ**: Nhãn `Bán hàng & Vận hành đơn` + Tiêu đề lớn `Đơn Hàng & Kênh Chào Bán`.
- **Tác vụ chính hiển thị trực tiếp**:
  - `Tạo đơn mới` (`Button variant="primary"`): Mở modal `CreateOrderModal` tạo đơn hàng thủ công đầy đủ trường.
  - `Tạo từ chat` (`Button variant="outline"`): Mở `ChatOrderCheckoutModal` bóc tách thông tin khách gửi qua Zalo/Facebook vào đơn hàng tự động.
  - `Làm mới` (`Button variant="outline"`): Tải lại danh sách đơn hàng tức thời (`RefreshCw`).
  - `Trang chủ` (`Button variant="ghost"`): Quay lại dashboard (`ArrowLeft`).
  - `Xuất Excel` (`ExportOrdersButton`): Chỉ hiển thị cho tài khoản có quyền Quản trị (`R1`).

### 1.2. Hệ thống 3 Tab Chuyên Biệt
1. **Tab 1: Tất cả đơn hàng (Kanban)** — Bảng quản lý tiến độ 4 cột chuẩn vận hành hoa tươi, tích hợp `OrderGuidanceCard` và thanh tìm kiếm, bộ lọc pill tabs mobile.
2. **Tab 2: Thẻ Chào & Link Chào Khách (Sale)** (`SalesBrochureTab`) — Quản lý các brochure giới thiệu mẫu hoa đã gửi cho khách, xem lượt click và đơn khách đặt.
3. **Tab 3: Duyệt TT Thẻ Chào (Điều hành)** (`AdminBrochurePaymentTab`) — Dành riêng cho Chủ tiệm/Kế toán có quyền `R11` duyệt chuyển khoản hoặc cọc từ khách đặt qua brochure.

---

## 2. Tính năng chi tiết từng thành phần

### 2.1. Bảng Kanban Tiến Độ Đơn Hàng (4 Cột Chuẩn)
- **Thẻ Hướng Dẫn Thao Tác (`OrderGuidanceCard`)**: Hướng dẫn quy trình tiếp nhận, chuyển cắm hoa và bàn giao shipper.
- **Thanh tìm kiếm & Thống kê**: Ô tìm kiếm theo mã đơn, tên người nhận, SĐT, hoặc tên sản phẩm hoa; hiển thị tổng số đơn lọc được.
- **Bộ lọc Trạng thái Mobile (< lg)**: Dạng viên thuốc cuộn ngang (Tất cả, Mới, Đang cắm, Vận chuyển, Hoàn tất) kèm huy hiệu số lượng.
- **Phân nhóm 4 cột Kanban**:
| Cột Kanban | Trạng thái kỹ thuật | Ý nghĩa trong tiệm hoa | Hành động tại chỗ |
|---|---|---|---|
| **1. Mới & Chờ cọc** | `DRAFT`, `CONFIRMED` | Khách mới đặt, đang chờ nhân viên gọi chốt hoặc đợi ting ting tiền cọc | Xem chi tiết, xác nhận cọc, hủy đơn |
| **2. Đang cắm hoa** | `PROCESSING` + `WAITING` / `ASSIGNED` / `ARRANGING` | Đã cọc, phiếu chuyển cho Thợ cắm hoa thực hiện | Gán thợ, đổi trạng thái sang "Đã cắm xong" |
| **3. Sẵn sàng & Giao hàng** | `READY`, `DISPATCHED`, `DELIVERING` | Hoa đã chụp ảnh nghiệm thu, Shipper đang đi giao | Xem ảnh nghiệm thu, gọi Shipper, cập nhật lộ trình |
| **4. Hoàn tất & Đã hủy** | `COMPLETED`, `CANCELLED`, `DELIVERED` | Khách đã nhận hoa, thu đủ tiền còn lại hoặc đơn hủy | Xem lại lịch sử thanh toán, hóa đơn |

### 2.2. Modal Chi Tiết Đơn Hàng (`OrderDetailModal`)
Nhấp vào bất kỳ thẻ đơn hàng nào trên bảng Kanban sẽ mở Modal chi tiết gồm 3 tab nghiệp vụ:
- **Tab 1: Tổng quan (`overview`)**: Hiển thị toàn bộ thông số đơn (mã đơn, người nhận, SĐT, địa chỉ giao, danh sách món hoa, tổng tiền, ghi chú, nội dung thiệp/băng rôn, đồng hồ tính SLA giao hàng).
- **Tab 2: Phiếu Thợ cắm hoa (`florist`)**: Hiển thị `FloristTicketCard` phục vụ in ấn hoặc đưa màn hình cho thợ cắm hoa (gồm công thức cắm hoa BOM, ghi chú phong cách, thời gian cần hoàn thành).
- **Tab 3: Phiếu Giao hàng (`delivery`)**: Hiển thị `DeliveryReceiptCard` để in kèm đơn giao cho Shipper và khách ký nhận.
- **Tác vụ quản lý đơn**: Nút chuyển trạng thái quy trình (`OrderActionButtons`) và Dialog hủy đơn hàng (`OrderCancelDialog`).

### 2.3. Modal "Tạo từ chat" (`ChatOrderCheckoutModal`)
- **Mục đích**: Nhân viên copy đoạn chat chốt đơn của khách trên Zalo (vd: *"Anh lấy bó hồng đỏ 500k giao 10h sáng mai đến 123 Lê Lợi cho chị Lan 0901234567"*).
- **Trích xuất thông tin**:
  - Tên người nhận, Số điện thoại, Địa chỉ giao hoa.
  - Thời gian giao hàng (ngày, khung giờ).
  - Nội dung thiệp/băng rôn chúc mừng.
  - Sản phẩm và ghi chú cắm hoa.

### 2.4. Tab "Thẻ Chào & Link Chào Khách" (`SalesBrochureTab`)
- Xem danh sách các brochure nhân viên đã tạo từ mục Thẻ Chào (`/the-chao`).
- Thống kê lượt khách mở link (`view_count`), lượt tương tác với mẫu hoa.
- Danh sách đơn đặt hàng phát sinh từ link chào hàng này.

### 2.5. Tab "Duyệt TT Thẻ Chào" (`AdminBrochurePaymentTab`)
- **Quyền hạn**: Chỉ người dùng có mã năng lực `R11` (Chủ tiệm / Quản lý) mới nhìn thấy và bấm được.
- **Tính năng**:
  - Hiển thị danh sách khách quét mã QR chuyển khoản đặt cọc từ Brochure.
  - So khớp mã giao dịch, số tiền cọc thực tế.
  - Nút **"Xác nhận đã nhận tiền"**: Chuyển ngay đơn từ `DRAFT` sang `CONFIRMED` để đẩy xuống bếp cắm hoa.

---

## 3. Luồng nghiệp vụ & Tình huống sử dụng thực tế

### Tình huống 1: Khách đặt hoa nhanh qua Zalo
1. Nhân viên chat với khách trên Zalo, khách đồng ý mẫu bó hướng dương 650k.
2. Nhân viên vào `/don-hang`, bấm **"Tạo từ chat"**, dán nội dung tin nhắn.
3. Hệ thống điền sẵn thông tin nhận hoa, nhân viên kiểm tra 5 giây rồi bấm **"Tạo đơn"**.
4. Đơn xuất hiện ở cột **"Mới & Chờ cọc"**.

### Tình huống 2: Khách tự chọn mẫu và cọc qua Link Thẻ Chào
1. Sale gửi link Thẻ chào cho khách doanh nghiệp chọn hoa sinh nhật sếp.
2. Khách mở link trên điện thoại, bấm chọn giỏ hoa 1.200.000đ, quét VietQR cọc 500.000đ.
3. Đơn hàng tự động nhảy vào hệ thống ở Tab **"Duyệt TT Thẻ Chào"**.
4. Quản lý kiểm tra tài khoản báo có, bấm **"Duyệt thanh toán"**.
5. Đơn tự động nhảy sang cột **"Đang cắm hoa"** trên bảng Kanban để thợ làm.

---

## 4. Lợi ích cho Cửa hàng Hoa

- **Loại bỏ tình trạng quên đơn / sót đơn**: Bảng Kanban 4 cột trực quan giúp cả tiệm từ Sale, Thợ cắm hoa đến Shipper nhìn chung một bức tranh thời gian thực.
- **Tiết kiệm 80% thời gian gõ đơn**: Tính năng trích xuất đơn từ chat giúp nhân viên không phải gõ tay từng dòng địa chỉ, số điện thoại.
- **Bảo mật dòng tiền tuyệt đối**: Tách biệt rõ ràng quyền giữa Sale (chỉ được gửi link và tư vấn) và Điều hành (duyệt tiền cọc thực tế).

---

## 5. Quyền truy cập & Phân quyền (RBAC)

- **Xem và thao tác Kanban**: Nhân viên bán hàng (`sales`), Thợ cắm hoa (`florist`), Điều hành (`store_manager`).
- **Xuất file Excel báo cáo**: Chỉ Quản trị viên/Chủ tiệm có quyền `R1`.
- **Duyệt chuyển khoản tiền cọc**: Bắt buộc năng lực `R11` (Cắt cứng phía server, kiểm tra tại API).

---

## 6. Mối liên kết với các mục khác trong hệ thống

- 🔗 **Liên kết với Thẻ Chào (`/the-chao`)**: Khách đặt hoa từ Brochure thẻ chào sẽ đổ thẳng về Tab 2 và Tab 3 của màn hình này.
- 🔗 **Liên kết với Sản phẩm & Giá (`/san-pham`)**: Chọn mẫu hoa trong kho khi bấm "Tạo đơn mới".
- 🔗 **Liên kết với Hồ sơ cửa hàng (`/ho-so`)**: Lấy thông tin tài khoản ngân hàng và mã QR thanh toán của tiệm.

---

## 7. Trạng thái hoàn thiện & Hạn chế trên Production

- **Trạng thái**: Hoàn thiện 100%, đáp ứng đầy đủ chu trình O2O (Online to Offline) từ tư vấn đến giao nhận.
- **Tối ưu Mobile**: Tích hợp thanh lọc trạng thái con nhộng (Pill tabs) mượt mà cho nhân viên thao tác trên điện thoại thông minh khi ở ngoài cửa hàng.
