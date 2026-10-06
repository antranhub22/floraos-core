# Thẻ chào mẫu hoa — Hành trình khách trên link bộ sưu tập

**Phạm vi:** trang khách `/b/<mã phiên>` (và `/s/<mã>` dẫn vào đó) · **Cập nhật:** 06/10/2026 · **Nhánh:** `Caitien_Tinhhuong_TheChaomauhoa`
**Quan hệ:** bổ sung cho [`HIEN_TRANG_THE_CHAO.md`](HIEN_TRANG_THE_CHAO.md) §4 (luồng) và §10 (bảo mật). Đợt A + B của yêu cầu "Customer Journey – Shared Collection Link"; đợt C (đổi schema) chưa làm — xem §5.

## 1. Chủ phiên — link chuyển tiếp không lộ phiên người trước

- URL bộ sưu tập là công khai; phiên của khách thì không. Trình duyệt **đầu tiên chạy trang** `/b/<mã>` nhận cookie chủ phiên `fl_b_<MÃ>` (HttpOnly, 90 ngày, giá trị = HMAC(`SESSION_SECRET`, mã phiên)) qua `POST /api/v1/public/brochure/[sendCode]/claim`. Mốc lưu ở `greeting_journey_events` (`OWNER_CLAIMED`), khoá `pg_advisory_xact_lock` theo phiên để hai tab cùng lúc chỉ một bên nhận.
- Máy quét xem trước link (Zalo/Facebook) không chạy JavaScript → không chiếm được phiên; trang khi chưa nhận chỉ trả màn chờ, không chứa dữ liệu phiên.
- `/s/<mã>/mo` tạo phiên mới và trao chủ ngay; đặt từ link chung `/g` · `/bst` và "Đặt thêm đơn" cũng trao chủ cho phiên mới.
- Người khác mở cùng `/b/<mã>`: phiên sinh từ link chia sẻ → chuyển về `/s/<mã chia sẻ>/mo` để có phiên riêng; link riêng của sale → màn "Link này đã được mở trên thiết bị khác" kèm Gọi/Zalo của tiệm.
- Nhân viên đăng nhập của chính tiệm mở link (nút "Mở link" ở bảng sale) → xem trước, không chiếm phiên, không ghi sự kiện.
- Mọi API `/api/v1/public/brochure/[sendCode]/*` (xem, chọn mẫu, báo giá, đặt đơn, báo đã chuyển khoản, đặt thêm, sự kiện) trả **404** khi thiếu cookie chủ phiên. Theo dõi đơn `?link=` chỉ trả bản đầy đủ cho chủ phiên.
- Phiên mở trước khi triển khai chưa có mốc chủ → trình duyệt đầu tiên mở lại sau triển khai nhận chủ.

## 2. Lướt mẫu (bộ thẻ vuốt)

Trạng thái lưu trên máy khách (`localStorage`, 7 ngày, theo đường dẫn trang), domain thuần `collection-session.ts`:
`sessionId, collectionId, currentProductId, likedProductIds, skippedProductIds, viewedProductIds, lastActivityAt, orderId` (+ `onboarded`). Lịch sử vuốt của bản cũ được chuyển sang tự động.

| Tình huống | Hành vi |
|---|---|
| Mở lần đầu | Hướng dẫn 3 bước + nút **Bắt đầu xem**; chỉ hiện một lần |
| Thích / Bỏ qua | Nút ♥ / ✕ hoặc vuốt; Thích hiện "♥ Đã lưu mẫu" |
| Mẫu trước | Nút ‹ (hoặc ↓): quay lại, **giữ** Thích/Bỏ qua. Nút Hoàn tác: quay lại và xoá lựa chọn |
| Đặt ngay | "Đặt mẫu này" luôn có, không cần xem hết |
| Cuối bộ sưu tập, có mẫu thích | Danh sách mẫu đã thích, đặt từng mẫu |
| Cuối bộ sưu tập, chưa thích mẫu nào | Xem thêm mẫu · Chọn theo khoảng giá · Nhắn Zalo cho cửa hàng · Yêu cầu thiết kế riêng |
| Mở lại link đã lướt dở (chưa có đơn) | Hỏi **Tiếp tục xem** / **Xem lại từ đầu** |
| Mẫu tạm hết hàng | Vẫn hiện, khoá "Đặt mẫu này"; **Xem mẫu tương tự** · **Liên hệ shop**. Máy chủ vẫn chặn chọn/đặt (409) |
| Gọi / Zalo | Kèm mẫu đang xem: chép sẵn tin nhắn "Tôi muốn hỏi về mẫu FL-8075 (Tên) – 650.000đ." rồi mở Zalo (link `zalo.me` không nhận nội dung soạn sẵn) |
| Tải lại / Back / Forward | Giữ tiến độ; Back/Forward đi giữa các bước xem mẫu ↔ điền đơn; đơn đã gửi thì không quay lại form |

## 3. Đặt hàng

Luồng không đổi: chọn mẫu → thông tin giao → xem lại đơn → thanh toán QR → theo dõi (mã đơn). Chống đơn trùng: phiên đã có đơn trả lại đúng đơn đó; hai lần gửi **đồng thời** (hai tab) — giao dịch chỉ cho một đơn gắn vào phiên (`order_id IS NULL`), lần kia được trả lại chính đơn thắng thay vì báo lỗi.

**Quay lại sau khi báo chuyển khoản** (chưa được xác nhận): trang `/b` mở thẳng màn thanh toán và hiện "Đã báo chuyển khoản — đang chờ Điều hành xác nhận" (theo trạng thái phiên `PAYMENT_REPORTED` ở máy chủ), không hiện lại nút báo. Đặt từ link chung `/g` · `/bst`: máy khách nhớ mã phiên của đơn theo bộ sưu tập (30 ngày) — mở lại đúng link cũ được chuyển sang `/b/<mã phiên>` thay vì quay lại xem mẫu.

## 4. Sự kiện hành trình

`POST /api/v1/public/brochure/[sendCode]/event` (chủ phiên, giới hạn 240 lần/10 phút), lưu `greeting_journey_events` với tên viết hoa:
`collection_opened, product_viewed, product_liked, product_skipped, product_revisited, contact_zalo_clicked, contact_call_clicked, order_started, checkout_started, checkout_abandoned`. `order_completed` = mốc `SUBMIT_ORDER` máy chủ tự ghi khi tạo đơn. Dòng thời gian và bảng theo dõi của nhân viên bỏ qua các sự kiện lướt mẫu này (`BROWSING_EVENT_TYPES`).

## 4b. Thời hạn link gửi khách

- Điều hành cài trong **Cài đặt Thẻ chào → Thời hạn link gửi khách**: số giờ nguyên 1–720, mặc định **24 giờ**, áp dụng cho cả tiệm (`organizations.settings.brochure_link_lifetime_hours`, domain `link-lifetime.ts`). Sale không còn tự chọn hạn (bỏ 7/30/90 ngày, "Không hết hạn").
- Link riêng tính từ lúc tạo; phiên mở từ link chia sẻ `/s/` tính từ lúc từng khách mở; "Đặt thêm đơn" nhận hạn mới (không kế thừa hạn link cũ). Chỉ áp dụng cho link tạo sau khi lưu.
- Hết hạn mà chưa có đơn: trang `/b` hiện "Link đã hết hạn — vui lòng liên hệ {cửa hàng} để nhận link mới" kèm Gọi/Zalo (trước bước nhận chủ phiên). Link thu hồi / bộ sưu tập ngừng giữ lời nhắn chung. Link đã có đơn vẫn mở được.

## 5. Chưa làm (đợt C — cần PO duyệt đổi schema)

- Phân biệt "Tạm hết" và "Hết hẳn"; lựa chọn "Cho phép thay thế tương đương" khi đặt.
- Lưu phiên lướt mẫu lên máy chủ / khôi phục trên thiết bị khác (định danh khách).
- Link chung `/g` · `/bst` (không có phiên trước khi đặt) chưa dùng hướng dẫn/tiếp tục/sự kiện mới.

## 6. Mã nguồn

`src/modules/greeting-card/domain/{session-owner,collection-session,collection-browse,customer-journey-events}.ts` · `use-cases/{brochure-owner,customer-journey,staff-viewer}.ts` · `infra/{session-owner-repository,session-owner-token}.ts` · `src/app/b/[sendCode]/page.tsx` · `src/components/greeting-card/customer/{brochure-claim-gate,journey-context,use-journey-tracker,use-step-history}.tsx?` · `templates/swipe/{use-swipe-journey,journey-intro,unavailable-panel}.tsx?`
