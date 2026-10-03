# Screen Contract — Catalog & Website (`/catalog`)

**Tuyến:** `/catalog` · **Tệp chính:** `src/app/(app)/catalog/page.tsx`, `src/components/catalog/*` · **Cập nhật:** 27/09/2026 · **Thẻ:** T5.B5

## 1. Vai và mục đích
- **Vai chính (03b):** `store_manager`, `sales`, `marketer`.
- **Phạm vi:** organization (quản lý danh mục hoa công khai, xuất bản catalog số và trang landing page tiếp thị).
- **Việc chính:** Quản lý mẫu hoa hoạt động, tạo link catalog chia sẻ cho khách hàng qua QR Code/Zalo/Facebook, và phát hành landing page chiến dịch.
- **Câu hỏi chính:** "Catalog nào cần cập nhật hoặc chia sẻ cho khách hôm nay?"
- **Mật độ:** MEDIUM (Bộ lọc tìm kiếm, lưới chọn sản phẩm, danh sách link đã xuất bản).

## 2. Hiện trạng (audit)
- **API:**
  - `GET /api/v1/products` → `E1` (`catalog.read`)
  - `GET /api/v1/vision/analyses?approval_state=APPROVED` → `H3` (`vision.approve`)
  - `GET /api/v1/catalog-links?include_revoked=true` → `E1` (`catalog.read`)
  - `POST /api/v1/catalog-links` → `E2` (`catalog.write`)
  - `POST /api/v1/catalog-links/:slug/revoke` → `E2` (`catalog.write`)
- **Khối:** 3 khối chính (Hướng dẫn `CatalogGuidanceCard`, Bộ chọn sản phẩm & tạo link, Danh sách link đã xuất bản).
- **Nút primary:** 1 nút chính "Xuất bản Catalog mới".
- **FeatureGuidanceCard:** 1 khối duy nhất theo chuẩn K1 (`CatalogGuidanceCard`).
- **Modal:** `CreateCatalogModal` (dùng `Dialog`), `ShareCatalogModal` (dùng `Dialog`), `ProductDetailModal` (dùng `Dialog`).
- **Trạng thái có sẵn:** Tải (`SkeletonBlock`), Rỗng (thông báo khi chưa có link), Lỗi (banner cảnh báo).

## 3. Thứ bậc thông tin
| Lớp | Nội dung | Vị trí hiển thị |
|---|---|---|
| L0 Thiết yếu | Header trang "Catalog & Website", TabActionHeader chuyển đổi tab | Đỉnh trang |
| L1 Hành động | Thanh tìm kiếm + Bộ lọc dịp tặng / giá + Nút "Xuất bản Catalog mới" | Trên lưới sản phẩm |
| L2 Lưới sản phẩm | Thẻ sản phẩm kèm checkbox, mã hoa, danh mục và giá VNĐ | Giữa trang |
| L3 Danh sách xuất bản | Các link catalog đang mở/đã thu hồi kèm nút Xem trước, Chia sẻ MXH, Copy link, Tải QR, Thu hồi | Dưới lưới sản phẩm |

## 4. Hành động
- **Chính (1):** "Xuất bản Catalog mới ({N} SP)" (`variant="primary"`).
- **Phụ (≤ 2):**
  - "Chọn tất cả" / "Bỏ chọn tất cả" (`variant="ghost"`).
  - "Chia sẻ MXH" (`variant="ghost"`).
- **Menu/Tác vụ dòng:**
  - "Xem trước", "Copy link", "Tải QR", "Thu hồi".

## 5. Content budget
- Nút nổi: 1/3 (Xuất bản Catalog mới).
- Khối chính: 3/5.
- Nhóm thông tin: 2 tab nghiệp vụ rõ ràng ("Catalog số trực tuyến" và "Landing page chiến dịch").

## 6. Trạng thái
- Tải: `<SkeletonBlock lines={4} label="Đang tải danh mục sản phẩm" />`.
- Rỗng: Thông báo hướng dẫn chọn mẫu hoa và tạo catalog đầu tiên.
- Lỗi: Banner màu cảnh báo phía trên thanh tab.

## 7. Responsive
- **390px (Mobile):** Lưới sản phẩm co về 1 cột, các thẻ chọn có `min-h-11`, tương tác thuận tiện.
- **768px (Tablet):** Lưới sản phẩm 2 cột, thanh lọc chia 2 hàng.
- **1280px (Desktop):** Lưới sản phẩm 3 cột, hiển thị trực quan thông tin mã hoa và đơn giá.

## 8. Trợ năng
- Toàn bộ card chọn sản phẩm sử dụng `<button type="button" aria-pressed={isSelected}>` với focus-visible chuẩn (T1.7).
- Toàn bộ modal sử dụng `Dialog` từ `@/components/ui/dialog` (Focus trap, phím Escape, role="dialog").
- Giá tiền định dạng chuẩn `vi-VN` (VNĐ).

## 9. QA Matrix (03a §34)
| Chiều | Kết quả | Ghi chú |
|---|---|---|
| Vai | PASS | Đạt chuẩn cho Store Manager, Sales, Marketer |
| Việc | PASS | Xuất bản catalog số, lấy link và mã QR chia sẻ |
| IA | PASS | 2 tab nghiệp vụ tách bạch, không lẫn mã kỹ thuật |
| Mật độ | PASS | 1 màn hình có cấu trúc thẻ mạch lạc |
| Thứ bậc | PASS | Tiêu đề -> Hướng dẫn K1 -> Tab -> Lọc -> Danh sách |
| CTA | PASS | Tối đa 1 nút chính K2 ("Xuất bản Catalog mới") |
| Luồng | PASS | Chọn hoa -> Xuất bản -> Nhận link/QR -> Chia sẻ |
| Trạng thái | PASS | Skeleton tải thật, rỗng có gợi ý, lỗi có banner |
| Responsive | PASS | Chuẩn 390px mobile đến desktop |
| Trợ năng | PASS | Đạt chuẩn T1.7 button aria-pressed, Dialog Base-UI |
| Dữ liệu | PASS | Kết nối API sản phẩm và catalog links thật |
| Quyền | PASS | Gating theo E1, E2, H3 |
| Nhất quán | PASS | Dùng token semantic, tuân thủ K1 và K2 |

## 10. Kết quả
- Toàn bộ modal đã chuyển sang `Dialog`.
- `Card onClick` đã tuân thủ chuẩn T1.7.
- Không còn bất kỳ cảnh báo unused variable nào.
