# Hướng dẫn xử lý tình huống — Thẻ chào mẫu hoa

> **Tài liệu sinh tự động — không sửa tay.** Nguồn duy nhất (SSOT): `src/modules/greeting-card/domain/guidance/`.
> Sửa danh mục rồi chạy `npm run gen:guide:the-chao`; test `npm test` báo lỗi nếu tài liệu lệch danh mục,
> nếu loại việc trong Hộp việc / bước quy trình mới chưa có hướng dẫn, hoặc nhãn nút trong hướng dẫn không còn trên màn hình.
> Dành cho 3 vai nhân viên: Điều hành, Sale, Điều phối. Giao diện đọc cùng dữ liệu này để hiện "Bước tiếp theo".

## Theo vai

**Điều hành** (19): [Đơn chọn mẫu chưa niêm yết giá — chờ báo giá](#order-awaiting-quote) · [Khách báo đã chuyển khoản — chờ xác nhận tiền](#first-payment-reported) · [Điều phối đã nhận đơn — Điều hành chưa ghi nhận tiền](#deposit-pending-admin-approval) · [Khách báo đã chuyển phần còn lại](#second-payment-reported) · [Đã giao còn nợ](#post-delivery-debt) · [Có khoản tiền vào chưa khớp đơn](#unmatched-bank-transfer) · [Chưa nhận đơn được: tiệm yêu cầu thu tiền trước khi cắm](#accept-blocked-by-payment) · [Khách xin đổi thông tin đơn](#customer-change-request-pending) · [Sale xin giảm giá cho đơn](#discount-request-pending) · [Khách cần hoá đơn VAT](#vat-invoice-request) · [Đơn kẹt quá thời gian chuẩn của bước](#step-stuck) · [Đề xuất huỷ / hoàn tiền chờ duyệt](#cancellation-proposal-pending) · [Đơn tự huỷ vì Điều hành không duyệt kịp](#cancellation-auto-approved) · [Cần hoàn tiền / liên hệ khách sau khi huỷ](#cancellation-refund-due) · [Đơn đã huỷ nhưng khách báo đã chuyển khoản](#cancelled-reported-payment) · [Điều hành huỷ đơn trực tiếp](#ledger-direct-cancel) · [Ghi nhận hoàn tiền trên sổ thu](#ledger-refund) · [Chờ duyệt bỏ hiển thị đơn/link chưa trả tiền](#dismissal-pending) · [Đã bỏ hiển thị — có thể khôi phục](#dismissed-restorable)

**Sale** (11): [Đã tạo link — chưa gửi khách](#link-created-not-sent) · [Đã gửi link — khách chưa mở](#link-sent-not-opened) · [Khách đang xem / đã chọn mẫu nhưng chưa đặt](#customer-browsing) · [Đơn mới chưa có Sale phụ trách](#order-unassigned-sale) · [Đã đặt đơn — chờ khách chuyển khoản](#order-placed-awaiting-transfer) · [Hoa xong — chờ khách trả phần còn lại](#second-payment-due) · [Đã giao còn nợ](#post-delivery-debt) · [Giao không thành công — hẹn giao lại](#delivery-failed) · [Đơn kẹt quá thời gian chuẩn của bước](#step-stuck) · [Cần huỷ hoặc hoàn tiền một đơn](#cancellation-propose) · [Sale báo khách: đơn khách đã đặt bị huỷ](#sale-cancellation-reminder)

**Điều phối** (14): [Điều phối được tự duyệt tiền cọc](#coordinator-deposit-approval) · [Khách báo đã chuyển phần còn lại](#second-payment-reported) · [Đơn chờ Điều phối nhận](#order-awaiting-accept) · [Đã nhận đơn — chờ giao thợ cắm](#order-accepted-awaiting-florist) · [Thợ đang cắm hoa](#arranging-in-progress) · [Hoa xong — giao cho shipper](#ready-to-dispatch) · [Đang giao — chờ ảnh người nhận](#delivering) · [Giao không thành công — hẹn giao lại](#delivery-failed) · [Không làm được đúng mẫu — đề xuất mẫu khác](#substitute-proposal) · [Khách đã trả lời đề xuất mẫu khác](#substitute-answered) · [Khách xin đổi thông tin đơn](#customer-change-request-pending) · [Đơn kẹt quá thời gian chuẩn của bước](#step-stuck) · [Cần huỷ hoặc hoàn tiền một đơn](#cancellation-propose) · [Điều phối không nhận được đơn](#coordinator-rejects-order)

## Link và khách đang xem

### Đã tạo link — chưa gửi khách

<a id="link-created-not-sent"></a>Mã: `LINK_CREATED_NOT_SENT`

- **Nhận biết:** Link riêng đã tạo nhưng chưa ai bấm sao chép để gửi khách.
- **Ai làm:** Sale
- **Bước tiếp theo:**
  - **Sale:** Sao chép link và gửi khách qua Zalo/Messenger. Link gắn tên bạn — đơn từ link tính cho bạn. *(Bán hàng → nút "Copy link")*
- **Hệ thống tự làm:** Khách không mở trong thời gian Điều hành đặt (mặc định 24 giờ từ lúc tạo) thì link tự thu hồi.
- **Tiếp theo có thể là:** [Đã gửi link — khách chưa mở](#link-sent-not-opened) · [Link hết hạn hoặc đã thu hồi](#link-expired)

### Đã gửi link — khách chưa mở

<a id="link-sent-not-opened"></a>Mã: `LINK_SENT_NOT_OPENED`

- **Nhận biết:** Link đã được sao chép gửi đi, khách chưa mở.
- **Ai làm:** Sale
- **Bước tiếp theo:**
  - **Sale:** Nhắc khách mở link (gọi, Zalo hoặc nhắn tin từ thẻ đơn ở tab Bán hàng).
- **Hạn:** Mặc định 5 phút sau khi gửi — quá hạn thì Hộp việc báo kẹt.
- **Hệ thống tự làm:** Chưa mở quá thời gian Điều hành đặt (mặc định 24 giờ) thì link tự thu hồi.
- **Tiếp theo có thể là:** [Khách đang xem / đã chọn mẫu nhưng chưa đặt](#customer-browsing) · [Link hết hạn hoặc đã thu hồi](#link-expired)

### Khách đang xem / đã chọn mẫu nhưng chưa đặt

<a id="customer-browsing"></a>Mã: `CUSTOMER_BROWSING`

- **Nhận biết:** Khách đã mở link, đang lướt mẫu hoặc đã chọn một mẫu mà chưa gửi đơn.
- **Ai làm:** Sale
- **Bước tiếp theo:**
  - **Sale:** Hỏi khách cần tư vấn mẫu nào, giải đáp giá, giờ giao.
  - **Sale:** Ghi tên (và SĐT) khách lên link để nhớ đã gửi cho ai. *(Chi tiết đơn → nút "Ghi tên khách")*
- **Hạn:** Mặc định 30 phút từ lúc khách mở link.
- **Hệ thống tự làm:** Khách bỏ dở quá thời gian Điều hành đặt (mặc định 12 giờ không thao tác) thì link tự thu hồi.
- **Tiếp theo có thể là:** [Đã đặt đơn — chờ khách chuyển khoản](#order-placed-awaiting-transfer) · [Đơn chọn mẫu chưa niêm yết giá — chờ báo giá](#order-awaiting-quote) · [Link hết hạn hoặc đã thu hồi](#link-expired)

### Link hết hạn hoặc đã thu hồi

<a id="link-expired"></a>Mã: `LINK_EXPIRED`

- **Nhận biết:** Thẻ ghi "Hết hạn mở link", "Hết hạn chọn mẫu" hoặc "Tự huỷ: …"; khách mở lại sẽ không vào được.
- **Ai làm:** Không ai — chờ khách hoặc hệ thống
- **Cần biết:** Sale
- **Bước tiếp theo:**
  - **Sale:** Khách vẫn muốn mua: tạo link mới và gửi lại. *(Bán hàng → nút "Tạo Link Ngay")*
- **Tiếp theo có thể là:** [Đã tạo link — chưa gửi khách](#link-created-not-sent)
- **Lưu ý:** Link đã hết hạn không mở lại được; chỉ link bị bỏ hiển thị mới khôi phục được.

## Tiếp nhận đơn

### Đơn mới chưa có Sale phụ trách

<a id="order-unassigned-sale"></a>Mã: `ORDER_UNASSIGNED_SALE`

- **Nhận biết:** Đơn đặt từ link chung không gắn Sale nào (và tiệm chưa có người phụ trách mặc định).
- **Ai làm:** Sale
- **Bước tiếp theo:**
  - **Sale:** Bấm nhận đơn ngay trong Hộp việc để ghi tên mình làm Sale phụ trách. *(Hộp việc → nút "Nhận đơn")*
  - **Sale:** Mở đơn và liên hệ khách xác nhận thông tin.
- **Tiếp theo có thể là:** [Đã đặt đơn — chờ khách chuyển khoản](#order-placed-awaiting-transfer)
- **Lưu ý:** Hai người bấm cùng lúc thì chỉ một người nhận được; người sau thấy báo "Đơn đã có Sale khác nhận".
- **Lưu ý:** Sale chỉ xem khách của mình vẫn thấy và nhận được đơn chưa có ai phụ trách.

### Đã đặt đơn — chờ khách chuyển khoản

<a id="order-placed-awaiting-transfer"></a>Mã: `ORDER_PLACED_AWAITING_TRANSFER`

- **Nhận biết:** Khách đã gửi đơn có giá, chưa báo chuyển khoản, đơn chưa thu đồng nào.
- **Ai làm:** Sale
- **Cần biết:** Điều hành
- **Bước tiếp theo:**
  - **Điều hành:** Tiền đã vào tài khoản dù khách chưa báo: ghi nhận ngay trên dòng đơn ở tab Điều hành (nút "Thu tiền…"). *(Điều hành)*
  - **Sale:** Nhắc khách quét mã QR chuyển khoản trên thẻ chào (gọi, Zalo hoặc nhắn tin) — tiền cọc hoặc trả đủ tuỳ đơn. *(Hộp việc → nút "Nhắc chuyển khoản")*
- **Hạn:** Mặc định 15 phút — quá hạn Hộp việc của Sale báo kẹt.
- **Hệ thống tự làm:** Quá hạn giữ đơn: hệ thống nhắc khách một lần; tiệm bật tự huỷ hoặc hạn thanh toán thì đơn tự huỷ (khách đã báo chuyển khoản thì không huỷ).
- **Tiếp theo có thể là:** [Khách báo đã chuyển khoản — chờ xác nhận tiền](#first-payment-reported) · [Đơn tự huỷ vì quá hạn thanh toán](#payment-timeout-cancelled)

### Đơn chọn mẫu chưa niêm yết giá — chờ báo giá

<a id="order-awaiting-quote"></a>Mã: `ORDER_AWAITING_QUOTE`

- **Nhận biết:** Khách đặt mẫu chưa có giá; tổng đơn bằng 0.
- **Ai làm:** Điều hành
- **Cần biết:** Sale
- **Bước tiếp theo:**
  - **Điều hành:** Nhập giá cho đơn — khách nhận báo giá và mã QR thanh toán. *(Điều hành → nút "Báo giá")*
- **Hệ thống tự làm:** Sau khi báo giá, hạn giữ đơn tính từ lúc báo giá.
- **Tiếp theo có thể là:** [Đã đặt đơn — chờ khách chuyển khoản](#order-placed-awaiting-transfer)
- **Lưu ý:** Chưa báo giá thì không thu tiền, không xuất VAT, không xin giảm giá được.

### Đơn tự huỷ vì quá hạn thanh toán

<a id="payment-timeout-cancelled"></a>Mã: `PAYMENT_TIMEOUT_CANCELLED`

- **Nhận biết:** Thẻ ghi "Tự huỷ: Hết hạn thanh toán cọc" — khách không chuyển khoản trong hạn tiệm đặt.
- **Ai làm:** Không ai — chờ khách hoặc hệ thống
- **Cần biết:** Sale, Điều hành
- **Bước tiếp theo:**
  - **Sale:** Khách vẫn muốn mua: tạo link mới. Khách báo đã chuyển khoản trễ: báo Điều hành kiểm tài khoản.
- **Hệ thống tự làm:** Tiền chuyển trễ vào tài khoản (nếu tiệm nối ngân hàng) hiện ở mục "khoản tiền vào chưa khớp đơn".
- **Tiếp theo có thể là:** [Có khoản tiền vào chưa khớp đơn](#unmatched-bank-transfer)

### Đơn chờ Điều phối nhận

<a id="order-awaiting-accept"></a>Mã: `ORDER_AWAITING_ACCEPT`

- **Nhận biết:** Khách đã trả tiền (hoặc đã gửi bill chuyển khoản), đơn chưa được Điều phối nhận và thợ chưa bắt đầu.
- **Ai làm:** Điều phối
- **Cần biết:** Sale
- **Bước tiếp theo:**
  - **Điều phối:** Kiểm hoa và lịch giao. Làm được thì nhận đơn. *(Điều phối → nút "Xác nhận Nhận đơn")*
  - **Điều phối:** Không làm được thì từ chối kèm lý do — đơn chuyển thành đề xuất huỷ cho Điều hành. *(Điều phối → nút "Từ chối (Hoàn tiền)")*
- **Hạn:** Mặc định 30 phút từ lúc tiền về (Điều hành đổi được trong Cài đặt thời gian chuẩn).
- **Hệ thống tự làm:** Nhận đơn mà khách đã gửi bill nhưng chưa ai xác nhận: hệ thống tự ghi nhận tiền cọc nếu tiệm cho Điều phối duyệt cọc.
- **Tiếp theo có thể là:** [Đã nhận đơn — chờ giao thợ cắm](#order-accepted-awaiting-florist) · [Điều phối không nhận được đơn](#coordinator-rejects-order) · [Chưa nhận đơn được: tiệm yêu cầu thu tiền trước khi cắm](#accept-blocked-by-payment)
- **Lưu ý:** Hộp việc của Điều phối hiện việc "Thẩm định nhận đơn" với nút "Gán thợ".

### Chưa nhận đơn được: tiệm yêu cầu thu tiền trước khi cắm

<a id="accept-blocked-by-payment"></a>Mã: `ACCEPT_BLOCKED_BY_PAYMENT`

- **Nhận biết:** Tiệm bật "thu tiền trước khi cắm" mà đơn chưa ghi nhận đồng nào.
- **Ai làm:** Điều hành
- **Cần biết:** Điều phối
- **Bước tiếp theo:**
  - **Điều hành:** Kiểm tài khoản; tiền đã về thì xác nhận ở tab Điều hành. *(Điều hành)*
  - **Điều phối:** Chờ Điều hành xác nhận tiền. Đơn hoả tốc hoặc tiệm cho phép thì Điều phối tự duyệt cọc ngay trên thẻ đơn. *(Điều phối)*
- **Tiếp theo có thể là:** [Đơn chờ Điều phối nhận](#order-awaiting-accept)

### Đơn kẹt quá thời gian chuẩn của bước

<a id="step-stuck"></a>Mã: `STEP_STUCK`

- **Nhận biết:** Hộp việc hiện "<việc cần làm> — quá N phút"; thẻ đơn có viền đỏ "Quá hạn".
- **Ai làm:** Sale, Điều hành, Điều phối
- **Bước tiếp theo:**
  - **Điều hành:** Bước của Điều hành (khách đã báo chuyển khoản): kiểm tài khoản và xác nhận tiền. *(Hộp việc → nút "Xử lý")*
  - **Sale:** Bước của Sale (khách chưa mở link, chưa đặt, chưa chuyển khoản): liên hệ khách ngay. *(Hộp việc → nút "Xử lý")*
  - **Điều phối:** Bước của Điều phối (nhận đơn, cắm, giao ship, đang giao): làm ngay việc ghi trong tin. *(Hộp việc → nút "Xử lý")*
- **Hạn:** Thời gian chuẩn từng bước do Điều hành đặt trong Cài đặt (bật/tắt từng bước).

## Thanh toán

### Khách báo đã chuyển khoản — chờ xác nhận tiền

<a id="first-payment-reported"></a>Mã: `FIRST_PAYMENT_REPORTED`

- **Nhận biết:** Khách bấm "Tôi đã chuyển khoản" (thường kèm ảnh bill), đơn chưa ghi nhận đồng nào. Lọc "Khách báo đã chuyển" ở tab Điều hành.
- **Ai làm:** Điều hành
- **Cần biết:** Điều phối, Sale
- **Bước tiếp theo:**
  - **Điều hành:** Mở ảnh bill, đối chiếu sao kê ngân hàng (số tiền, tài khoản nhận, nội dung chuyển khoản) rồi bấm "Phê duyệt…" trên dòng đơn. *(Điều hành)*
  - **Điều hành:** Sao kê không có khoản này: báo khách chưa nhận được tiền — khách được nhắc chuyển lại. *(Điều hành → nút "Chưa nhận được tiền")*
  - **Điều phối:** Có thể nhận đơn trước khi Điều hành xác nhận tiền (xem tình huống "Đơn chờ Điều phối nhận").
- **Hạn:** Mặc định 15 phút.
- **Hệ thống tự làm:** Tiệm bật "AI đọc bill" và "tự duyệt bill khớp": bill khớp 100% được tự xác nhận sau 15 phút. Nhãn bill: Khớp bill / Thiếu–Thừa / Sai STK nhận / Bill nghi vấn / Ảnh mờ; chưa có kết quả đọc tự động thì đối chiếu tay.
- **Tiếp theo có thể là:** [Đã thu tiền (cọc hoặc đủ) — đơn vào xưởng](#deposit-paid-waiting-production) · [Đơn chờ Điều phối nhận](#order-awaiting-accept) · [Điều phối được tự duyệt tiền cọc](#coordinator-deposit-approval) · [Đã đặt đơn — chờ khách chuyển khoản](#order-placed-awaiting-transfer)
- **Lưu ý:** Báo "Chưa nhận được tiền" cho khách thêm một hạn thanh toán mới đủ số phút tiệm cài, tính từ lúc báo — quá hạn mới mà vẫn chưa có tiền thì đơn tự huỷ.

### Điều phối đã nhận đơn — Điều hành chưa ghi nhận tiền

<a id="deposit-pending-admin-approval"></a>Mã: `DEPOSIT_PENDING_ADMIN_APPROVAL`

- **Nhận biết:** Thẻ đơn ghi "Đơn do Điều phối xác nhận – Điều hành chưa duyệt đã nhận tiền".
- **Ai làm:** Điều hành
- **Bước tiếp theo:**
  - **Điều hành:** Hộp việc báo "Điều phối đã nhận đơn — xác nhận tiền khách đã chuyển": bấm vào để mở đơn. *(Hộp việc → nút "Xử lý")*
  - **Điều hành:** Đối chiếu sao kê rồi phê duyệt khoản khách đã chuyển trên dòng đơn (lọc "Khách báo đã chuyển"). *(Điều hành)*
- **Tiếp theo có thể là:** [Đã thu tiền (cọc hoặc đủ) — đơn vào xưởng](#deposit-paid-waiting-production)

### Điều phối được tự duyệt tiền cọc

<a id="coordinator-deposit-approval"></a>Mã: `COORDINATOR_DEPOSIT_APPROVAL`

- **Nhận biết:** Khách đã gửi bill cọc và tiệm cho Điều phối duyệt cọc (đơn hoả tốc, tiệm không bắt Điều hành duyệt, hoặc đã quá hạn và cho phép uỷ quyền).
- **Ai làm:** Điều phối
- **Bước tiếp theo:**
  - **Điều phối:** Xem bill, kiểm tiền về rồi xác nhận ngay trên thẻ đơn. *(Điều phối → nút "Xác nhận Tiền Cọc Đợt 1")*
- **Tiếp theo có thể là:** [Đơn chờ Điều phối nhận](#order-awaiting-accept)

### Đã thu tiền (cọc hoặc đủ) — đơn vào xưởng

<a id="deposit-paid-waiting-production"></a>Mã: `DEPOSIT_PAID_WAITING_PRODUCTION`

- **Nhận biết:** Đơn đã ghi nhận tiền lần 1; dòng đơn ghi "Đã cọc · Chờ hoa xong", "Đã cọc · Thu sau giao" hoặc "Đã thu đủ".
- **Ai làm:** Không ai — chờ khách hoặc hệ thống
- **Cần biết:** Điều phối, Sale
- **Hệ thống tự làm:** Khách được báo đã nhận tiền; đơn chờ Điều phối nhận và cắm.
- **Tiếp theo có thể là:** [Đơn chờ Điều phối nhận](#order-awaiting-accept) · [Hoa xong — chờ khách trả phần còn lại](#second-payment-due)

### Hoa xong — chờ khách trả phần còn lại

<a id="second-payment-due"></a>Mã: `SECOND_PAYMENT_DUE`

- **Nhận biết:** Đơn đặt cọc, hoa đã xong, khách chưa báo chuyển phần còn lại. Nút giao ship của Điều phối ghi "Chờ TT lần 2".
- **Ai làm:** Sale
- **Cần biết:** Điều phối, Điều hành
- **Bước tiếp theo:**
  - **Điều hành:** Tiền đã về: ghi nhận phần còn lại trên dòng đơn (nút "Thu lần 2…"). *(Điều hành)*
  - **Sale:** Gửi ảnh hoa và nhắc khách chuyển phần còn lại. *(Hộp việc → nút "Nhắc thanh toán")*
  - **Điều phối:** Chép tin nhắc gửi khách nếu cần; chờ tiền về mới giao ship. *(Điều phối → nút "Chép tin nhắc lần 2")*
- **Hạn:** Mặc định 30 phút từ lúc hoa xong (tính chung bước giao ship).
- **Tiếp theo có thể là:** [Khách báo đã chuyển phần còn lại](#second-payment-reported)
- **Lưu ý:** Tiệm cho shipper thu tiền mặt và không bắt thu đủ trước khi giao: được giao trước, thu sau giao.

### Khách báo đã chuyển phần còn lại

<a id="second-payment-reported"></a>Mã: `SECOND_PAYMENT_REPORTED`

- **Nhận biết:** Đơn đã cọc, khách báo đã chuyển lần 2 (thường kèm bill).
- **Ai làm:** Điều hành, Điều phối
- **Bước tiếp theo:**
  - **Điều hành:** Đối chiếu sao kê rồi bấm "Phê duyệt đợt 2…" trên dòng đơn. *(Điều hành)*
  - **Điều hành:** Sao kê không có khoản lần 2: báo khách chưa nhận được tiền — bill lần 2 bị bỏ, khách được nhắc chuyển lại. *(Điều hành → nút "Chưa nhận được tiền")*
  - **Điều phối:** Tiệm cho phép thì xác nhận ngay trên thẻ đơn để giao hoa; nếu thẻ ghi "Chờ Điều hành xác nhận" thì chờ Điều hành. *(Điều phối → nút "Xác nhận Đã Nhận Đủ Tiền (Lần 2)")*
- **Tiếp theo có thể là:** [Hoa xong — giao cho shipper](#ready-to-dispatch) · [Hoa xong — chờ khách trả phần còn lại](#second-payment-due)

### Đã giao còn nợ

<a id="post-delivery-debt"></a>Mã: `POST_DELIVERY_DEBT`

- **Nhận biết:** Đơn đã giao xong nhưng chưa thu đủ (lọc "Đã giao còn nợ" ở tab Điều hành).
- **Ai làm:** Điều hành, Sale
- **Bước tiếp theo:**
  - **Điều hành:** Tiền về thì ghi nhận trên dòng đơn (nút "Thu lần 2…" / "Thu tiền…"). *(Điều hành)*
  - **Sale:** Liên hệ khách nhắc thanh toán phần còn lại.
- **Hệ thống tự làm:** Việc nằm trong Hộp việc tới khi thu đủ, càng lâu càng xếp lên trên.

### Có khoản tiền vào chưa khớp đơn

<a id="unmatched-bank-transfer"></a>Mã: `UNMATCHED_BANK_TRANSFER`

- **Nhận biết:** Tiệm nối ngân hàng; có giao dịch không khớp mã đơn, vào đơn đã huỷ, hoặc đơn đã trả đủ.
- **Ai làm:** Điều hành
- **Bước tiếp theo:**
  - **Điều hành:** Tìm đúng đơn theo số tiền, nội dung chuyển khoản; ghi nhận tiền trên dòng đơn đó (hoặc hoàn cho khách nếu đơn đã huỷ). *(Điều hành)*
  - **Điều hành:** Xử lý xong thì đánh dấu giao dịch. *(Điều hành → nút "Đánh dấu đã xử lý")*
- **Lưu ý:** Khách chuyển thừa: hệ thống ghi đúng số còn thiếu và ghi chú phần thừa cần hoàn.

## Cắm hoa và duyệt ảnh

### Đã nhận đơn — chờ giao thợ cắm

<a id="order-accepted-awaiting-florist"></a>Mã: `ORDER_ACCEPTED_AWAITING_FLORIST`

- **Nhận biết:** Điều phối đã nhận đơn, chưa giao cho thợ.
- **Ai làm:** Điều phối
- **Bước tiếp theo:**
  - **Điều phối:** Chọn thợ và ghi chú yêu cầu cắm rồi giao việc. *(Điều phối → nút "Giao Florist")*
- **Hạn:** Tính chung thời gian chuẩn bước nhận đơn (mặc định 30 phút).
- **Tiếp theo có thể là:** [Thợ đang cắm hoa](#arranging-in-progress)

### Thợ đang cắm hoa

<a id="arranging-in-progress"></a>Mã: `ARRANGING_IN_PROGRESS`

- **Nhận biết:** Đơn đã giao cho thợ, chưa có ảnh hoa thành phẩm.
- **Ai làm:** Điều phối
- **Bước tiếp theo:**
  - **Điều phối:** Hỏi thợ tiến độ. Cắm xong thì chụp 1–5 ảnh (và tối đa 2 video) hoa thành phẩm. *(Điều phối → nút "Chụp thành phẩm")*
  - **Điều phối:** Khách cần gấp và tiệm cho phép: bỏ qua ảnh để giao ngay. *(Điều phối → nút "Giao gấp — Bỏ qua")*
- **Hạn:** Mặc định 120 phút.
- **Hệ thống tự làm:** Có ảnh: khách được báo hoa đã xong và thấy ảnh trên thẻ chào.
- **Tiếp theo có thể là:** [Chờ khách duyệt ảnh hoa thành phẩm](#photo-awaiting-customer-approval) · [Hoa xong — giao cho shipper](#ready-to-dispatch) · [Không làm được đúng mẫu — đề xuất mẫu khác](#substitute-proposal)
- **Lưu ý:** Tiệm chọn gói vận hành nghiêm ngặt thì không bỏ qua ảnh được.

### Chờ khách duyệt ảnh hoa thành phẩm

<a id="photo-awaiting-customer-approval"></a>Mã: `PHOTO_AWAITING_CUSTOMER_APPROVAL`

- **Nhận biết:** Đã có ảnh hoa, khách chưa bấm duyệt và còn trong thời gian chờ (thẻ ghi "Chờ khách duyệt ảnh — còn N phút").
- **Ai làm:** Không ai — chờ khách hoặc hệ thống
- **Cần biết:** Điều phối, Sale
- **Bước tiếp theo:**
  - **Sale:** Nhắc khách mở thẻ chào và duyệt ảnh nếu cần giao sớm.
  - **Điều phối:** Chờ — nút giao ship tạm mờ. Khách cần gấp thì nhờ Sale nhắc khách duyệt.
- **Hạn:** Mặc định 10 phút (tiệm bắt khách duyệt: tối thiểu 30 phút).
- **Hệ thống tự làm:** Hết giờ hệ thống tự coi như khách đồng ý.
- **Tiếp theo có thể là:** [Hoa xong — giao cho shipper](#ready-to-dispatch)

## Giao hoa

### Hoa xong — giao cho shipper

<a id="ready-to-dispatch"></a>Mã: `READY_TO_DISPATCH`

- **Nhận biết:** Hoa đã xong, khách đã duyệt ảnh (hoặc hết giờ chờ), tiền đủ điều kiện giao.
- **Ai làm:** Điều phối
- **Cần biết:** Sale
- **Bước tiếp theo:**
  - **Sale:** Gửi ảnh hoa thành phẩm cho khách nếu khách chưa xem. *(Hộp việc → nút "Gửi ảnh hoa")*
  - **Điều phối:** Giao cho shipper và ghi thông tin vận chuyển (tên, SĐT shipper hoặc mã vận đơn). *(Điều phối → nút "Giao Ship")*
- **Hạn:** Mặc định 30 phút.
- **Hệ thống tự làm:** Khách được báo hoa đang giao.
- **Tiếp theo có thể là:** [Đang giao — chờ ảnh người nhận](#delivering)

### Đang giao — chờ ảnh người nhận

<a id="delivering"></a>Mã: `DELIVERING`

- **Nhận biết:** Đơn đã giao cho shipper, chưa có xác nhận giao thành công.
- **Ai làm:** Điều phối
- **Bước tiếp theo:**
  - **Điều phối:** Shipper giao xong thì tải ảnh người nhận cầm hoa. *(Điều phối → nút "Ảnh người nhận")*
  - **Điều phối:** Không giao được (không nghe máy, vắng nhà, sai địa chỉ, từ chối nhận…) thì ghi nhận lý do. *(Điều phối → nút "Giao không thành công")*
- **Hạn:** Mặc định 120 phút.
- **Hệ thống tự làm:** Giao thành công: đơn hoàn tất, khách được báo.
- **Tiếp theo có thể là:** [Đã giao thành công](#delivered-completed) · [Giao không thành công — hẹn giao lại](#delivery-failed)

### Giao không thành công — hẹn giao lại

<a id="delivery-failed"></a>Mã: `DELIVERY_FAILED`

- **Nhận biết:** Lần giao gần nhất ghi "không thành công"; thẻ đơn ghi "Giao lần N chưa thành công".
- **Ai làm:** Điều phối, Sale
- **Bước tiếp theo:**
  - **Sale:** Gọi khách và người nhận để hẹn lại giờ hoặc địa chỉ. Khách đổi được giờ/địa chỉ trên thẻ chào. *(Hộp việc → nút "Liên hệ khách")*
  - **Điều phối:** Có lịch mới thì giao lại cho shipper. *(Điều phối → nút "Giao lại")*
- **Hạn:** Mặc định 30 phút từ lúc ghi nhận giao hỏng.
- **Hệ thống tự làm:** Nếu bật tính phí giao lại, phí được cộng vào đơn — đơn đã trả đủ sẽ cần thu thêm phần phí trước khi giao lại.
- **Tiếp theo có thể là:** [Đang giao — chờ ảnh người nhận](#delivering) · [Hoa xong — chờ khách trả phần còn lại](#second-payment-due)

### Đã giao thành công

<a id="delivered-completed"></a>Mã: `DELIVERED_COMPLETED`

- **Nhận biết:** Đã có ảnh người nhận (hoặc giao gấp bỏ qua ảnh); đơn hoàn tất.
- **Ai làm:** Không ai — chờ khách hoặc hệ thống
- **Hệ thống tự làm:** Khách được báo đã giao. Đơn còn nợ thì chuyển sang việc thu sau giao.
- **Tiếp theo có thể là:** [Đã giao còn nợ](#post-delivery-debt)

## Huỷ đơn và hoàn tiền

### Đề xuất huỷ / hoàn tiền chờ duyệt

<a id="cancellation-proposal-pending"></a>Mã: `CANCELLATION_PROPOSAL_PENDING`

- **Nhận biết:** Sale hoặc Điều phối đã gửi đề xuất huỷ đơn, huỷ và hoàn toàn bộ, hoặc hoàn một phần; Điều hành chưa quyết.
- **Ai làm:** Điều hành
- **Cần biết:** Sale, Điều phối
- **Bước tiếp theo:**
  - **Điều hành:** Đọc lý do, xem đơn đã thu bao nhiêu rồi phê duyệt hoặc từ chối. Phê duyệt chỉ đổi trạng thái đơn — tiền hoàn chuyển ở bước riêng. *(Điều hành → nút "Phê duyệt")*
  - **Điều hành:** Không đồng ý thì từ chối và ghi lý do để người đề xuất biết. *(Điều hành → nút "Từ chối")*
- **Hạn:** Đề xuất "từ chối nhận đơn" của Điều phối: hệ thống tự duyệt sau thời gian Điều hành đặt trong Cài đặt (mặc định 15 phút). Đề xuất huỷ / hoàn tiền khác (của Sale hay Điều phối): không có hạn, luôn cần người duyệt.
- **Hệ thống tự làm:** Đơn đang giao không tự duyệt — cần Điều hành hoặc một Điều phối khác duyệt. Người đề xuất nhận tin kết quả.
- **Tiếp theo có thể là:** [Cần hoàn tiền / liên hệ khách sau khi huỷ](#cancellation-refund-due) · [Đơn tự huỷ vì Điều hành không duyệt kịp](#cancellation-auto-approved) · [Sale báo khách: đơn khách đã đặt bị huỷ](#sale-cancellation-reminder)
- **Lưu ý:** Đơn đang giao: Điều phối có quyền giao hàng duyệt được ở tab Điều phối, nhưng không tự duyệt đề xuất của chính mình.
- **Lưu ý:** Hoàn một phần chỉ Điều hành duyệt.

### Cần huỷ hoặc hoàn tiền một đơn

<a id="cancellation-propose"></a>Mã: `CANCELLATION_PROPOSE`

- **Nhận biết:** Khách đổi ý, tiệm không làm được, hoặc khách chọn "Huỷ đơn" khi được đề xuất mẫu khác. Đơn chưa giao xong và thợ chưa bắt đầu cắm.
- **Ai làm:** Sale, Điều phối
- **Bước tiếp theo:**
  - **Điều hành:** Điều hành huỷ thẳng từ sổ thu (biểu tượng huỷ trên dòng đơn) — không cần đề xuất. *(Điều hành → nút "Huỷ đơn hàng")*
  - **Sale:** Mở chi tiết đơn, gửi đề xuất kèm lý do cho Điều hành duyệt. *(Chi tiết đơn → nút "Đề xuất Hủy / Hoàn tiền đơn này")*
  - **Điều phối:** Trên thẻ đơn ở tab Điều phối (hoặc chi tiết đơn), gửi đề xuất kèm lý do. *(Điều phối → nút "Đề xuất Hủy / Hoàn tiền đơn này")*
- **Tiếp theo có thể là:** [Đề xuất huỷ / hoàn tiền chờ duyệt](#cancellation-proposal-pending) · [Điều hành huỷ đơn trực tiếp](#ledger-direct-cancel)
- **Lưu ý:** Không đề xuất được khi đơn đã huỷ, đã giao xong, hoặc thợ đang cắm — máy chủ cũng chặn, và thẻ đơn ở tab Điều phối ghi lý do thay cho đường dẫn.
- **Lưu ý:** Mỗi đơn chỉ một đề xuất đang chờ duyệt; đơn đã giao xong cần hoàn một phần thì Điều hành ghi hoàn trên sổ thu.
- **Lưu ý:** Hoàn tiền chỉ chọn được khi đơn đã thu tiền; hoàn một phần phải nhỏ hơn số đã thu.

### Điều phối không nhận được đơn

<a id="coordinator-rejects-order"></a>Mã: `COORDINATOR_REJECTS_ORDER`

- **Nhận biết:** Đơn đã thu tiền (hoặc khách đã gửi bill) đang chờ Điều phối nhận, nhưng tiệm không làm được (hết hoa, quá tải…).
- **Ai làm:** Điều phối
- **Bước tiếp theo:**
  - **Điều phối:** Bấm từ chối, chọn hoặc ghi lý do — hệ thống gửi đề xuất huỷ (có hoàn tiền nếu đã thu) cho Điều hành. *(Điều phối → nút "Từ chối (Hoàn tiền)")*
- **Hạn:** Quyết trong thời gian chuẩn bước "Xác nhận tiền về" (mặc định 30 phút).
- **Tiếp theo có thể là:** [Đề xuất huỷ / hoàn tiền chờ duyệt](#cancellation-proposal-pending)
- **Lưu ý:** Chỉ từ chối được khi đơn còn chờ nhận; đơn đã nhận, đang cắm hay đang giao thì dùng "Đề xuất Hủy / Hoàn tiền" (không tự duyệt khi quá hạn).

### Đơn tự huỷ vì Điều hành không duyệt kịp

<a id="cancellation-auto-approved"></a>Mã: `CANCELLATION_AUTO_APPROVED`

- **Nhận biết:** Đề xuất "từ chối nhận đơn" của Điều phối quá thời gian duyệt — hệ thống đã tự huỷ đơn và báo Điều hành.
- **Ai làm:** Điều hành
- **Cần biết:** Sale
- **Bước tiếp theo:**
  - **Điều hành:** Xử lý việc "Cần hoàn tiền" / "Đơn tự huỷ — cần liên hệ khách" trong Hộp việc. *(Hộp việc)*
- **Hệ thống tự làm:** Hệ thống kiểm mỗi phút, chỉ với đề xuất từ chối nhận đơn; đơn đã huỷ, đang giao hoặc đã giao bị bỏ qua (không tự huỷ).
- **Tiếp theo có thể là:** [Cần hoàn tiền / liên hệ khách sau khi huỷ](#cancellation-refund-due) · [Sale báo khách: đơn khách đã đặt bị huỷ](#sale-cancellation-reminder)

### Cần hoàn tiền / liên hệ khách sau khi huỷ

<a id="cancellation-refund-due"></a>Mã: `CANCELLATION_REFUND_DUE`

- **Nhận biết:** Đề xuất huỷ đã duyệt (hoặc tự duyệt) và còn tiền phải hoàn, hoặc đơn tự huỷ cần báo khách.
- **Ai làm:** Điều hành
- **Bước tiếp theo:**
  - **Điều hành:** Chuyển khoản hoàn cho khách, ghi mã giao dịch vào ô ghi chú rồi xác nhận ngay trong Hộp việc — sổ thu ghi khoản hoàn lúc này. *(Hộp việc → nút "Đã hoàn tiền cho khách")*
  - **Điều hành:** Không có tiền phải hoàn: gọi báo khách rồi đánh dấu xong. *(Hộp việc → nút "Đã xử lý xong")*
- **Hạn:** Khách được hứa liên hệ (và hoàn tiền) trong 2 tiếng kể từ lúc duyệt huỷ — khi đơn bị Điều phối huỷ.
- **Lưu ý:** Trong lúc chờ, sổ thu không cho bấm "Hoàn tiền" trên đơn này để tránh hoàn hai lần.

### Sale báo khách: đơn khách đã đặt bị huỷ

<a id="sale-cancellation-reminder"></a>Mã: `SALE_CANCELLATION_REMINDER`

- **Nhận biết:** Hộp việc của Sale phụ trách có việc "Báo khách: đơn #… đã bị huỷ" — đơn khách đã đặt bị nhân viên huỷ (sổ thu, duyệt đề xuất huỷ) hoặc đề xuất huỷ của Điều phối được tự duyệt.
- **Ai làm:** Sale
- **Cần biết:** Điều hành
- **Bước tiếp theo:**
  - **Sale:** Gọi hoặc nhắn khách báo đơn bị huỷ. Khách đã chuyển tiền thì báo Điều hành hoàn — Sale không tự ghi hoàn.
  - **Sale:** Báo xong thì bấm xác nhận ngay trong Hộp việc để đóng việc. *(Hộp việc → nút "Đã báo khách")*
- **Hạn:** Trong 2 tiếng kể từ lúc huỷ — quá hạn việc lên đầu Hộp việc như đơn kẹt.
- **Hệ thống tự làm:** Thẻ chào của khách tự hiện thông báo huỷ và hạn liên hệ (khi Điều phối huỷ). Không tạo việc cho đơn hệ thống tự huỷ vì quá hạn thanh toán hay đơn bỏ hiển thị; việc chỉ nhắc trong 7 ngày.
- **Tiếp theo có thể là:** [Cần hoàn tiền / liên hệ khách sau khi huỷ](#cancellation-refund-due)

### Đơn đã huỷ nhưng khách báo đã chuyển khoản

<a id="cancelled-reported-payment"></a>Mã: `CANCELLED_REPORTED_PAYMENT`

- **Nhận biết:** Đơn bị huỷ khi khách đã báo chuyển khoản (hoặc gửi bill) mà tiệm chưa ghi nhận đồng nào — sổ thu 0 đ nên không có việc hoàn tiền thường.
- **Ai làm:** Điều hành
- **Cần biết:** Sale
- **Bước tiếp theo:**
  - **Điều hành:** Mở ảnh bill, kiểm sao kê. Đã nhận tiền thì chuyển hoàn cho khách, nhập số tiền đã hoàn rồi xác nhận ngay trong Hộp việc — sổ thu ghi cả khoản vào lẫn khoản hoàn. *(Hộp việc → nút "Đã hoàn tiền cho khách")*
  - **Điều hành:** Sao kê không có khoản này thì đóng việc. *(Hộp việc → nút "Không nhận được tiền")*
- **Hệ thống tự làm:** Việc tự hiện cho mọi đơn huỷ trong 60 ngày gần nhất có tình trạng này, tới khi Điều hành chốt.

### Điều hành huỷ đơn trực tiếp

<a id="ledger-direct-cancel"></a>Mã: `LEDGER_DIRECT_CANCEL`

- **Nhận biết:** Điều hành cần huỷ một đơn chưa giao xong mà không qua đề xuất.
- **Ai làm:** Điều hành
- **Bước tiếp theo:**
  - **Điều hành:** Ở sổ thu tab Điều hành, bấm biểu tượng huỷ trên dòng đơn, ghi lý do rồi xác nhận. *(Điều hành → nút "Huỷ đơn hàng")*
  - **Điều hành:** Đơn đã thu tiền: huỷ không tự hoàn — chuyển khoản hoàn cho khách rồi ghi nhận trên dòng đơn. *(Điều hành → nút "Hoàn tiền")*
- **Tiếp theo có thể là:** [Ghi nhận hoàn tiền trên sổ thu](#ledger-refund)
- **Lưu ý:** Đơn đang giao phải xác nhận thêm cảnh báo trước khi huỷ.

### Ghi nhận hoàn tiền trên sổ thu

<a id="ledger-refund"></a>Mã: `LEDGER_REFUND`

- **Nhận biết:** Đơn đã thu tiền, cần hoàn một phần hoặc toàn bộ, và không có khoản hoàn đang chờ ở Hộp việc.
- **Ai làm:** Điều hành
- **Bước tiếp theo:**
  - **Điều hành:** Chuyển khoản cho khách trước, rồi ghi số tiền và lý do hoàn trên dòng đơn. *(Điều hành → nút "Hoàn tiền")*
- **Lưu ý:** Số hoàn không vượt số đã thu. Trạng thái đơn và số còn phải thu không đổi — hoàn tiền không tạo nợ "Đã giao còn nợ".

### Chờ duyệt bỏ hiển thị đơn/link chưa trả tiền

<a id="dismissal-pending"></a>Mã: `DISMISSAL_PENDING`

- **Nhận biết:** Sale hoặc Điều phối đề xuất bỏ hiển thị một link hoặc đơn chưa trả đồng nào (khách đổi ý, chỉ hỏi giá, trùng…).
- **Ai làm:** Điều hành
- **Bước tiếp theo:**
  - **Điều hành:** Hộp việc hiện đề xuất kèm lý do và người đề xuất: duyệt hoặc từ chối ngay tại đó. *(Hộp việc → nút "Duyệt bỏ hiển thị")*
  - **Điều hành:** Hoặc ở chế độ Kanban của tab Theo dõi đơn, xem lý do trên thẻ rồi duyệt hoặc từ chối. *(Theo dõi đơn → nút "Duyệt")*
  - **Sale:** Đề xuất: bấm biểu tượng bỏ hiển thị trên thẻ đơn ở Kanban, chọn lý do. *(Theo dõi đơn → nút "Xác nhận bỏ hiển thị")*
  - **Điều phối:** Đề xuất như Sale. *(Theo dõi đơn → nút "Xác nhận bỏ hiển thị")*
- **Hạn:** 5 phút — quá hạn hệ thống tự duyệt.
- **Hệ thống tự làm:** Duyệt xong: đơn chưa trả tiền chuyển Đã huỷ, link bị khoá.
- **Tiếp theo có thể là:** [Đã bỏ hiển thị — có thể khôi phục](#dismissed-restorable)

### Đã bỏ hiển thị — có thể khôi phục

<a id="dismissed-restorable"></a>Mã: `DISMISSED_RESTORABLE`

- **Nhận biết:** Link/đơn chưa trả tiền đã được bỏ hiển thị, nhưng khách quay lại muốn đặt.
- **Ai làm:** Điều hành
- **Bước tiếp theo:**
  - **Điều hành:** Bấm khôi phục trên thẻ ở Kanban tab Theo dõi đơn — đơn về trạng thái cũ, link mở lại 7 ngày. *(Theo dõi đơn → nút "Khôi phục")*

## Khách xin đổi, giảm giá, đổi mẫu, hoá đơn

### Không làm được đúng mẫu — đề xuất mẫu khác

<a id="substitute-proposal"></a>Mã: `SUBSTITUTE_PROPOSAL`

- **Nhận biết:** Hết hoa hoặc không làm được mẫu khách chọn; đơn chưa giao cho shipper.
- **Ai làm:** Điều phối
- **Cần biết:** Sale
- **Bước tiếp theo:**
  - **Điều phối:** Chọn 1–3 mẫu cùng bộ sưu tập, giữ nguyên giá, gửi khách chọn. *(Điều phối → nút "Đề xuất mẫu khác")*
- **Hệ thống tự làm:** Khách nhận thông báo và trả lời ngay trên thẻ chào.
- **Tiếp theo có thể là:** [Khách đã trả lời đề xuất mẫu khác](#substitute-answered)

### Khách đã trả lời đề xuất mẫu khác

<a id="substitute-answered"></a>Mã: `SUBSTITUTE_ANSWERED`

- **Nhận biết:** Điều phối nhận tin trả lời của khách: chọn một mẫu, để tiệm quyết, hoặc huỷ đơn.
- **Ai làm:** Điều phối
- **Bước tiếp theo:**
  - **Điều phối:** Khách chọn mẫu: đơn đã tự đổi sang mẫu mới — báo thợ cắm theo mẫu mới.
  - **Điều phối:** Khách để tiệm quyết: chọn mẫu tương đương và báo thợ.
  - **Điều phối:** Khách muốn huỷ: gửi đề xuất huỷ (có hoàn tiền) cho Điều hành. *(Điều phối → nút "Đề xuất Hủy / Hoàn tiền đơn này")*
- **Tiếp theo có thể là:** [Thợ đang cắm hoa](#arranging-in-progress) · [Đề xuất huỷ / hoàn tiền chờ duyệt](#cancellation-proposal-pending)

### Khách xin đổi thông tin đơn

<a id="customer-change-request-pending"></a>Mã: `CUSTOMER_CHANGE_REQUEST_PENDING`

- **Nhận biết:** Khách gửi yêu cầu đổi giờ giao, người nhận, địa chỉ, lời chúc… từ thẻ chào (thợ chưa bắt đầu cắm, hoặc vừa giao không thành công).
- **Ai làm:** Điều phối, Điều hành
- **Cần biết:** Sale
- **Bước tiếp theo:**
  - **Điều hành:** Duyệt như Điều phối khi cần. *(Hộp việc → nút "Đồng ý cập nhật")*
  - **Điều phối:** Xem thay đổi và phí phát sinh ngay trong Hộp việc rồi đồng ý. *(Hộp việc → nút "Đồng ý cập nhật")*
  - **Điều phối:** Không đổi được thì từ chối kèm lời nhắn cho khách. *(Hộp việc → nút "Không đồng ý")*
- **Hệ thống tự làm:** Duyệt xong khách thấy thông tin mới trên thẻ chào; Sale phụ trách nhận tin kết quả.
- **Lưu ý:** Thợ đã bắt đầu cắm thì không duyệt được nữa — hãy từ chối và liên hệ khách.

### Sale xin giảm giá cho đơn

<a id="discount-request-pending"></a>Mã: `DISCOUNT_REQUEST_PENDING`

- **Nhận biết:** Sale gửi "Xin giảm giá" (phần trăm hoặc số tiền, kèm lý do) trong trao đổi của đơn.
- **Ai làm:** Điều hành
- **Cần biết:** Sale
- **Bước tiếp theo:**
  - **Điều hành:** Chọn duyệt như xin, duyệt mức khác hoặc không duyệt (bắt buộc ghi chú) rồi xác nhận ngay trong Hộp việc. *(Hộp việc → nút "Xác nhận duyệt")*
  - **Sale:** Gửi yêu cầu: mở "Nhắn tin" của đơn, bật "Xin giảm giá", ghi lý do. *(Chi tiết đơn → nút "Gửi Điều hành duyệt")*
- **Lưu ý:** Mức giảm không vượt trần Điều hành đặt (mặc định 25%) và không làm tổng nhỏ hơn số đã thu.

### Khách cần hoá đơn VAT

<a id="vat-invoice-request"></a>Mã: `VAT_INVOICE_REQUEST`

- **Nhận biết:** Khách xin xuất hoá đơn; đơn chưa huỷ, chưa hoàn tất và đã có giá.
- **Ai làm:** Điều hành
- **Bước tiếp theo:**
  - **Điều hành:** Mở chi tiết đơn, nhập thông tin công ty, chọn thuế suất rồi lưu — tổng đơn tự tính lại. *(Chi tiết đơn → nút "Lưu hoá đơn VAT")*
- **Lưu ý:** Đổi VAT sau khi khách đã gửi bill: đối chiếu tay vì số tiền khách chuyển sẽ lệch tổng mới.
