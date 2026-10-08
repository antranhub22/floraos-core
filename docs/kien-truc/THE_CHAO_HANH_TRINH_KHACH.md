# Thẻ chào mẫu hoa — Hành trình khách trên link bộ sưu tập

**Phạm vi:** trang khách `/b/<mã phiên>` (và `/s/<mã>` dẫn vào đó) · **Cập nhật:** 08/10/2026 · **Nhánh:** `Caitien_Tinhhuong_TheChaomauhoa`
**Quan hệ:** bổ sung cho [`HIEN_TRANG_THE_CHAO.md`](HIEN_TRANG_THE_CHAO.md) §4 (luồng) và §10 (bảo mật). Đợt A + B của yêu cầu "Customer Journey – Shared Collection Link"; đợt C (đổi schema) chưa làm — xem §5.

## 1. Chủ phiên — link chuyển tiếp không lộ phiên người trước

- URL bộ sưu tập là công khai; phiên của khách thì không. Trình duyệt **đầu tiên chạy trang** `/b/<mã>` nhận cookie chủ phiên `fl_b_<MÃ>` (HttpOnly, 90 ngày, giá trị = HMAC(`SESSION_SECRET`, mã phiên)) qua `POST /api/v1/public/brochure/[sendCode]/claim`. Mốc lưu ở `greeting_journey_events` (`OWNER_CLAIMED`), khoá `pg_advisory_xact_lock` theo phiên để hai tab cùng lúc chỉ một bên nhận.
- Máy quét xem trước link (Zalo/Facebook) không chạy JavaScript → không chiếm được phiên; trang khi chưa nhận chỉ trả màn chờ, không chứa dữ liệu phiên.
- `/s/<mã>/mo` tạo phiên mới và trao chủ ngay; đặt từ link chung `/g` · `/bst` và "Đặt thêm đơn" cũng trao chủ cho phiên mới.
- Người khác mở cùng `/b/<mã>`: phiên sinh từ link chia sẻ → chuyển về `/s/<mã chia sẻ>/mo` để có phiên riêng; link riêng của sale → màn "Link này đã được mở trên thiết bị khác" kèm Gọi/Zalo của tiệm.
- Nhân viên đăng nhập của chính tiệm mở link (nút "Mở link" ở bảng sale) → xem trước, không chiếm phiên, không ghi sự kiện.
- Mọi API `/api/v1/public/brochure/[sendCode]/*` (xem, chọn mẫu, báo giá, đặt đơn, báo đã chuyển khoản, đặt thêm, sự kiện) trả **404** khi thiếu cookie chủ phiên. Theo dõi đơn `?link=` chỉ trả bản đầy đủ cho chủ phiên.
- Phiên mở trước khi triển khai chưa có mốc chủ → trình duyệt đầu tiên mở lại sau triển khai nhận chủ.

## 2. Xem mẫu (kiểu Facebook Story — PO 07/10/2026)

Trạng thái lưu trên máy khách (`localStorage`, 7 ngày, theo đường dẫn trang), domain thuần `collection-session.ts`:
`sessionId, collectionId, currentProductId, likedProductIds, skippedProductIds, viewedProductIds, lastActivityAt, orderId` (+ `onboarded`). Lịch sử vuốt của bản cũ được chuyển sang tự động.

| Tình huống | Hành vi |
|---|---|
| Mở lần đầu | Hướng dẫn 3 bước + nút **Bắt đầu xem**; chỉ hiện một lần |
| Mẫu sau | Chạm **2/3 bên phải** ảnh, vuốt **sang trái**, nút › hoặc phím → |
| Mẫu trước | Chạm **1/3 bên trái** ảnh, vuốt **sang phải**, nút ‹ hoặc phím ←; giữ nguyên tim đã thả |
| Xem chi tiết | **Chỉ** bấm nút ⓘ (chạm ảnh không mở chi tiết) |
| Thả tim | Nút ♥ bật/tắt trên mẫu đang xem, không tự chuyển mẫu; hiện "♥ Đã thả tim". Mỗi khách tối đa 1 tim/mẫu; cộng vào bảng **Mẫu được thả tim nhiều nhất** của bộ sưu tập (cả link riêng và link công khai) |
| Thanh tiến trình | Vạch đã xem và đang xem tô đầy như Story; tối đa 12 vạch, kèm số "3 / 20" |
| Đặt ngay | "Đặt mẫu này" luôn có, không cần xem hết |
| Cuối bộ sưu tập, có mẫu đã thả tim | Danh sách mẫu đã thả tim, đặt từng mẫu |
| Cuối bộ sưu tập, chưa thả tim mẫu nào | Xem thêm mẫu · Chọn theo khoảng giá · Nhắn Zalo cho cửa hàng · Yêu cầu thiết kế riêng |
| Mở lại link đã xem dở (đã qua mẫu đầu, chưa có đơn) | Hỏi **Tiếp tục xem** / **Xem lại từ đầu** |
| Mẫu tạm hết hàng | Vẫn hiện, khoá "Đặt mẫu này"; **Xem mẫu tương tự** · **Liên hệ shop**. Máy chủ vẫn chặn chọn/đặt (409) |
| Gọi / Zalo | Kèm mẫu đang xem: chép sẵn tin nhắn "Tôi muốn hỏi về mẫu FL-8075 (Tên) – 650.000đ." rồi mở Zalo (link `zalo.me` không nhận nội dung soạn sẵn) |
| Tải lại / Back / Forward | Giữ tiến độ; Back/Forward đi giữa các bước xem mẫu ↔ điền đơn; đơn đã gửi thì không quay lại form |

## 3. Đặt hàng

Luồng không đổi: chọn mẫu → thông tin giao → xem lại đơn → thanh toán QR → theo dõi (mã đơn). Chống đơn trùng: phiên đã có đơn trả lại đúng đơn đó; hai lần gửi **đồng thời** (hai tab) — giao dịch chỉ cho một đơn gắn vào phiên (`order_id IS NULL`), lần kia được trả lại chính đơn thắng thay vì báo lỗi.

**Quay lại sau khi báo chuyển khoản** (chưa được xác nhận): trang `/b` mở thẳng màn thanh toán và hiện "Đã báo chuyển khoản — đang chờ Điều hành xác nhận" (theo trạng thái phiên `PAYMENT_REPORTED` ở máy chủ), không hiện lại nút báo. Đặt từ link chung `/g` · `/bst`: máy khách nhớ mã phiên của đơn theo bộ sưu tập (30 ngày) — mở lại đúng link cũ được chuyển sang `/b/<mã phiên>` thay vì quay lại xem mẫu.

**Mở lại đúng chỗ đã dừng** (nhớ trên máy khách, theo trang; máy chủ thắng khi đã có đơn — `domain/customer-step.ts`):

| Dừng ở | Mở lại |
|---|---|
| Đang lướt mẫu N / màn cuối / đang lọc khoảng giá | Hỏi "Tiếp tục xem" → mẫu N, giữ bộ lọc |
| Form đặt hoa | Về form, giữ thông tin đã gõ + size, số lượng, khu vực, mã giảm giá |
| Bước "Xem lại đơn" | Về bước Xem lại |
| Đã chọn mẫu nhưng quay lại xem mẫu khác | Về xem mẫu (không bị ép vào form) |
| Thanh toán / đã báo chuyển khoản / Theo dõi đơn | Về đúng màn đó (đơn đã trả đủ hoặc huỷ → Theo dõi) |
| Link chung `/g` · `/bst`: xem mẫu đã chọn / form | Về đúng màn, nếu mẫu còn bán |

## 4. Sự kiện hành trình

`POST /api/v1/public/brochure/[sendCode]/event` (chủ phiên, giới hạn 240 lần/10 phút), lưu `greeting_journey_events` với tên viết hoa:
`collection_opened, product_viewed, product_liked, product_skipped, product_revisited, contact_zalo_clicked, contact_call_clicked, order_started, checkout_started, checkout_abandoned`. `order_completed` = mốc `SUBMIT_ORDER` máy chủ tự ghi khi tạo đơn. Dòng thời gian và bảng theo dõi của nhân viên bỏ qua các sự kiện lướt mẫu này (`BROWSING_EVENT_TYPES`).

## 4b. Thời hạn link gửi khách

- Điều hành cài trong **Cài đặt Thẻ chào → Thời hạn link gửi khách**: số giờ nguyên 1–720, mặc định **24 giờ**, áp dụng cho cả tiệm (`organizations.settings.brochure_link_lifetime_hours`, domain `link-lifetime.ts`). Sale không còn tự chọn hạn (bỏ 7/30/90 ngày, "Không hết hạn").
- Link riêng tính từ lúc tạo; phiên mở từ link chia sẻ `/s/` tính từ lúc từng khách mở; "Đặt thêm đơn" nhận hạn mới (không kế thừa hạn link cũ). Chỉ áp dụng cho link tạo sau khi lưu.
- Hết hạn mà chưa có đơn: trang `/b` hiện "Link đã hết hạn — vui lòng liên hệ {cửa hàng} để nhận link mới" kèm Gọi/Zalo (trước bước nhận chủ phiên). Link thu hồi / bộ sưu tập ngừng giữ lời nhắn chung. Link đã có đơn vẫn mở được.

## 4b. Ghi chú trên form đặt hoa & trang theo dõi (08/10/2026)

- Form đặt hoa có **ba loại ghi chú tách riêng** (`order-notes-fields.tsx`): lời nhắn thiệp (có bộ đếm `n/500 ký tự`) → `orders.card_message`; ghi chú cho cửa hàng / thợ cắm hoa (`senderNote`) → `orders.internal_note`; ghi chú cho người giao hoa (`deliveryNote`, tối đa 300 ký tự) → `orders.delivery_address.notes`.
- Ô **Link vị trí trên Google Maps** (không bắt buộc, `mapUrl`) → `orders.delivery_address.mapUrl`. Chỉ nhận `https` trên host Google Maps (`maps.app.goo.gl`, `maps.google.com[.vn]`, `goo.gl/maps`, `[www.]google.com[.vn]/maps`); link khác báo lỗi ở form và bị máy chủ bỏ (`domain/delivery-note.ts`). Thẻ đơn ở màn Điều phối hiện "Người giao lưu ý" + nút "Mở bản đồ". Không dùng API bản đồ trả phí.
- Trang theo dõi có **5 bước**: Tiếp nhận → **Đã xác nhận** → Cắm hoa → Đang giao → Hoàn tất (`mapOrderStatusToTrackingStep`, `tracking-steps.tsx`). "Đã xác nhận" khi đơn rời `DRAFT` (tiệm ghi nhận tiền/cọc) hoặc đã phân công thợ; `QUALITY_CHECK` tính là bước Cắm hoa.

## 4c. Khách xin đổi thông tin đơn sau khi đặt (08/10/2026)

- Trang theo dõi (bản đầy đủ — mở từ link của đơn hoặc đã nhập 4 số cuối SĐT) có khối **"Thay đổi thông tin đơn"**: nút "Đổi giờ giao, địa chỉ hoặc người nhận" mở form điền sẵn thông tin hiện tại (SĐT người nhận để trống = giữ số cũ — trang theo dõi không trả SĐT). Đổi được: ngày + khung giờ (cùng luật giờ chốt/chuẩn bị như lúc đặt), tên/SĐT người nhận, địa chỉ 5 ô, khu vực giao, lời nhắn thiệp, ghi chú cho người giao, link bản đồ, kèm lời nhắn cho cửa hàng.
- Gửi xong đơn **chưa đổi**: yêu cầu (`greeting_messages.kind = ORDER_CHANGE_REQUEST`, người gửi `customer`, gửi Điều phối) chờ nhân viên có `R3` duyệt trong **Hộp việc** (xem trước → sau từng ô; từ chối phải ghi lời nhắn cho khách). Mỗi đơn chỉ một yêu cầu chờ.
- **Khoá từ lúc bắt đầu cắm hoa** (PO chốt 08/10/2026): `production_status` khác `WAITING`/`ASSIGNED`, đã giao ship, đã xong hoặc đã huỷ → không gửi được, yêu cầu đang chờ cũng không duyệt được (chỉ từ chối).
- Đổi khu vực giao: phí **tăng** → cộng phần chênh vào tổng (khách trả qua mã QR phần còn lại); phí **giảm** → giữ nguyên tổng (PO chốt).
- Khách thấy **thông báo** kết quả gần nhất (đã cập nhật / chưa đổi + lời nhắn của cửa hàng) và **lịch sử thay đổi** (trước → sau, giờ gửi, giờ xử lý). Sale phụ trách nhận tin `ORDER_CHANGE_DECISION`; audit `greeting_card.order_change.approve|reject`.
- Chưa có: tin SMS/Zalo báo khách khi đơn được cập nhật (khách xem trên trang theo dõi).

## 4d. Giao không thành công / hẹn giao lại (08/10/2026)

- Thẻ đơn ở tab Điều phối có nút **"Giao không thành công"** (chỉ khi đơn đang giao): chọn lý do (không nghe máy · không có ai nhận · sai địa chỉ · từ chối nhận · lý do khác — bắt buộc ghi rõ), ghi chú, và có **tính phí giao lại** không (mặc định có; bỏ chọn khi lỗi do cửa hàng/shipper).
- Đơn sang `delivery_status = FAILED`, mỗi lần hỏng lưu vào `delivery_window.failures`. Thẻ đơn hiện "Giao lần N chưa thành công…", nút "Giao Ship" đổi thành **"Giao lại"**; Hộp việc của Điều phối có việc "Giao không thành công — hẹn giao lại".
- **Phí giao lại** Điều hành cài trong Cài đặt → Khu vực, phí giao & giờ nhận đơn (`brochure_shipping.redelivery_fee_vnd`, bỏ trống = không thu). Có tính thì cộng vào tổng đơn (khách trả qua QR phần còn lại); đơn chờ báo giá không tính.
- Khách thấy trên trang theo dõi: bước "Giao hoa chưa thành công", lý do (ghi chú của shipper chỉ khi đã xác minh), phí giao lại nếu có, và được **đổi giờ / địa chỉ / người nhận** qua "Thay đổi thông tin đơn" dù hoa đã cắm xong — trừ lời nhắn thiệp (thiệp đã in). Tin SMS/Zalo mốc `DELIVERY_FAILED` (tiệm bật thông báo; ZNS cần đăng ký mẫu cho mốc này).
- Chưa có: "mang về tiệm chờ khách đến nhận"; tin nhắn mỗi mốc chỉ gửi **một lần cho mỗi đơn**, nên lần giao hỏng thứ hai và lần giao lại không gửi tin mới (khách xem trên trang theo dõi).

## 4e. Quy định ngày lễ (08/10/2026)

- Điều hành khai trong **Cài đặt Thẻ chào → Ngày lễ** (`organizations.settings.brochure_holidays.days`): tên, ngày (lặp hằng năm `MM-DD` — có nút thêm nhanh 14/02, 08/03, 20/10, 20/11, 24/12 — hoặc ngày cụ thể `YYYY-MM-DD` cho Tết âm lịch), giờ chốt nhận đơn giao trong ngày, số đơn tối đa (mặc định **500**), phụ phí.
- **Áp cả tiệm** (PO chốt): giờ chốt ngày lễ thay giờ chốt thường; ngày lễ đã đủ số đơn tối đa (đếm mọi đơn chưa huỷ giao ngày đó) → form đặt hoa và yêu cầu dời ngày đều bị từ chối "cửa hàng đã nhận đủ đơn". Hai đơn gửi đúng cùng lúc có thể vượt trần một vài đơn (không khoá).
- **Phụ phí theo bộ sưu tập**: chỉ cộng khi bộ sưu tập bật "Áp dụng phụ phí ngày lễ" (Chính sách & Cam kết của bộ sưu tập → `filters.appliedPolicies.applyHolidaySurcharge`). Báo giá gửi kèm ngày giao; dòng "Phụ phí ngày lễ (tên)" hiện ở form, bước xem lại và khi Điều hành đối chiếu thanh toán. Khách dời sang ngày lễ có phụ phí → cộng phần tăng khi duyệt; dời khỏi ngày lễ → giữ nguyên tổng.
- Chưa có: ô chọn khung giờ trên form khách chưa ẩn sẵn khung đã qua giờ chốt ngày lễ (máy chủ vẫn chặn và báo lỗi); bật phụ phí ngay trong hộp thoại tạo bộ sưu tập (hiện bật ở phần chính sách của bộ sưu tập sau khi tạo).

## 4f. Đề xuất mẫu thay thế (08/10/2026)

- Tiệm không làm được mẫu khách chọn (hết hoa, hoa về kém): thẻ đơn ở tab Điều phối có nút **"Đề xuất mẫu khác"** (người có quyền sửa đơn) → chọn 1–3 mẫu **còn bán trong cùng bộ sưu tập** + lý do khách sẽ đọc. Khoá khi hoa đã giao shipper, đã giao xong hoặc đơn đã huỷ; mỗi đơn chỉ một đề xuất chờ trả lời.
- Khách được báo (SMS/Zalo mốc `SUBSTITUTE_PROPOSED` nếu tiệm bật; ZNS cần đăng ký mẫu) và trả lời trên trang theo dõi (đã xác minh): **chọn một mẫu** · **nhờ tiệm chọn mẫu tương đương** · **xin huỷ đơn** (bắt buộc ghi lý do). Câu trả lời + thời điểm lưu lại làm bằng chứng khách đã đồng ý, và hiện lại trên trang theo dõi.
- **Tổng tiền giữ nguyên** (khung thoả thuận "ưu tiên hoa tương đương hoặc giá trị cao hơn"). Chọn mẫu → đơn đổi sang mẫu mới (ảnh, tên trên trang theo dõi và thẻ Điều phối); mọi lựa chọn ghi một dòng `[Đổi mẫu]` vào ghi chú nội bộ cho thợ cắm và báo Điều phối. Xin huỷ → tiệm liên hệ và dùng luồng **đề xuất huỷ / hoàn tiền** hiện có (không tự huỷ).
- Chưa có: việc "Khách đã trả lời đổi mẫu" riêng trong Hộp việc (hiện là tin nhắn gửi Điều phối + dòng ghi chú trên đơn); đề xuất mẫu ngoài bộ sưu tập; chênh lệch giá khi khách muốn trả thêm cho mẫu đắt hơn.

## 5. Chưa làm (đợt C — cần PO duyệt đổi schema)

- Phân biệt "Tạm hết" và "Hết hẳn"; lựa chọn "Cho phép thay thế tương đương" khi đặt.
- Lưu phiên lướt mẫu lên máy chủ / khôi phục trên thiết bị khác (định danh khách).
- Link chung `/g` · `/bst` (không có phiên trước khi đặt) chưa dùng hướng dẫn/tiếp tục/sự kiện mới.

## 6. Mã nguồn

`src/modules/greeting-card/domain/{session-owner,collection-session,collection-browse,customer-journey-events,delivery-note,order-change-request,delivery-failure,holiday-policy,substitute-proposal}.ts` · `use-cases/{order-change,substitute}.ts` · `infra/{order-change-repository,delivery-failure-repository,substitute-repository}.ts` · `use-cases/{brochure-owner,customer-journey,staff-viewer}.ts` · `infra/{session-owner-repository,session-owner-token}.ts` · `src/app/b/[sendCode]/page.tsx` · `src/components/greeting-card/customer/{brochure-claim-gate,journey-context,use-journey-tracker,use-step-history}.tsx?` · `templates/swipe/{use-swipe-journey,journey-intro,unavailable-panel}.tsx?`
