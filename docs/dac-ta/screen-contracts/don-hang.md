# Screen Contract — Quản lý Đơn hàng & Vận hành Xưởng (`/don-hang`)

**Tuyến:** `/don-hang` · **Tệp chính:** `src/app/(app)/don-hang/page.tsx` · **Cập nhật:** 26/09/2026 · **Thẻ:** T5.B2

## 1. Vai và mục đích
- **Vai chính (03b):** `florist`, `store_manager`, `sales`, `delivery_lead`.
- **Phạm vi:** organization (điều phối sản xuất cắm hoa và giao vận đơn hàng).
- **Việc chính:** Theo dõi luồng đơn hàng từ khi tiếp nhận → phân công cắm hoa → đóng gói vận chuyển → giao hàng hoàn tất.
- **Câu hỏi chính:** "Đơn nào cần tôi làm tiếp?" → **Nút chính:** "Tạo đơn mới".
- **Mật độ:** MEDIUM-HIGH (Kanban 4 cột trên desktop, danh sách có tab trạng thái trên mobile).

## 2. Hiện trạng (audit)
- **API gọi:**
  - `GET /api/v1/orders` → `R1` (`order.read`)
  - `POST /api/v1/orders` → `R2` (`order.create`)
  - `GET /api/v1/orders/:id` → `R1`
  - `PATCH /api/v1/orders/:id` → `R3` (`order.update`)
- **Khối chính:**
  - Header chuẩn: 1 nút chính "Tạo đơn mới", 2 nút phụ "Làm mới", "Trang chủ".
  - Feature guidance card: `OrderGuidanceCard`.
  - Bộ lọc & tìm kiếm nhanh: ô input tìm kiếm theo mã đơn, tên người nhận, SĐT.
  - Vùng hiển thị đơn hàng: 4 cột Kanban trên Desktop (`lg:`), Danh sách phân tab trạng thái trên Mobile (< `lg:`).
- **Trạng thái:** Tải (`loading`), Rỗng (`EmptyState` kèm nút hành động "Tạo đơn mới"), Modals (`CreateOrderModal`, `OrderDetailModal`).

## 3. Thứ bậc thông tin
| Lớp | Nội dung | Vị trí hiển thị |
|---|---|---|
| L0 Thiết yếu | Header trang, Nút chính "Tạo đơn mới", Thanh tìm kiếm & bộ lọc | Đỉnh trang |
| L1 Luồng công việc | 4 trạng thái: 1. Mới tiếp nhận, 2. Đang cắm hoa, 3. Vận chuyển, 4. Hoàn tất / Đã giao | 4 cột Kanban hoặc Tab chọn lọc trên mobile |
| L2 Thẻ đơn hàng | Mã đơn, người nhận, địa chỉ, món hoa chính, thiệp chúc mừng, tổng tiền VND | Trong từng cột / danh sách |
| L3 Chi tiết & SLA | Modal chi tiết đơn, BOM danh mục hoa, tiến độ SLA | Mở qua `OrderDetailModal` |

## 4. Hành động
- **Chính:** "Tạo đơn mới" (`variant="primary"`).
- **Phụ:** "Làm mới" (`variant="outline"`), "Trang chủ" (`variant="ghost"`).
- **Tương tác thẻ:** Mỗi thẻ đơn hàng là một `<button type="button">` có `min-h-11`, nhấp để mở `OrderDetailModal`.

## 5. Responsive
- **390px (Mobile):** Tự động chuyển đổi từ bảng Kanban 4 cột thành thanh Tab viên thuốc chọn trạng thái (`Tất cả`, `Mới`, `Đang cắm`, `Vận chuyển`, `Hoàn tất`) kèm số lượng đơn, hiển thị dạng danh sách thẻ dọc chạm thao tác dễ dàng bằng một tay.
- **1280px (Desktop):** Lưới Kanban 4 cột (`lg:grid lg:grid-cols-4`) trực quan, hỗ trợ điều phối toàn diện xưởng hoa.

## 6. Trợ năng
- Toàn bộ thẻ đơn hàng là thẻ `<button type="button">` có `min-h-11`, `focus-visible:outline-2 focus-visible:outline-primary`.
- Không sử dụng màu sắc đơn độc để biểu thị trạng thái (kết hợp nhãn chữ và số đếm rõ ràng).
- Biểu tượng trang trí có `aria-hidden="true"`.

## 7. QA Matrix (03a §34)
| Chiều | Kết quả | Ghi chú |
|---|---|---|
| Vai | PASS | Đạt chuẩn cho Florist, Store Manager, Sales |
| Việc | PASS | Trả lời "Đơn nào cần tôi làm tiếp?" |
| IA | PASS | Khung Kanban 4 cột -> Chi tiết đơn |
| Mật độ | PASS | 390px tab lọc, 1280px 4 cột |
| Thứ bậc | PASS | Tiêu đề -> Tìm kiếm -> Bảng điều phối |
| CTA | PASS | Tạo đơn mới là nút chính duy nhất |
| Luồng | PASS | /don-hang -> Chi tiết đơn modal -> Cập nhật |
| Trạng thái | PASS | Tải, rỗng có nút đi tiếp, chi tiết |
| Responsive | PASS | 390px dạng tab lọc, 1280px 4 cột hoàn hảo |
| Trợ năng | PASS | Button đạt touch target ≥ 44px, focus visible |
| Dữ liệu | PASS | Kết nối API Orders thật |
| Quyền | PASS | Gating theo R1, R2, R3 |
| Nhất quán | PASS | 100% token Semantic, font token chuẩn |
