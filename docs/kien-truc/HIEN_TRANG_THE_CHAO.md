# Thẻ chào mẫu hoa (Swipe Brochure) — Đặc tả hiện trạng (Current State Baseline)

**Phạm vi:** module `greeting-card` · trang nội bộ `/the-chao` · trang khách `/b`, `/s`, `/g`, `/bst` · **Cập nhật:** 06/10/2026 · **Nhánh:** `claude/sweet-fermat-ovs11r` (PR antranhub22/floraos-core#27)
**Phiên bản:** v2 — hiện trạng SAU đợt commercial-ready (18 hạng mục, chi tiết [`KHAC_PHUC_THE_CHAO.md`](KHAC_PHUC_THE_CHAO.md)). Baseline trước khắc phục (v1, soát `main` @ `ecb5aa3`, đã gộp bản audit thứ hai) giữ nguyên ở commit `f1d1eb8` của tệp này.
**Loại tài liệu:** ảnh chụp hiện trạng để làm đầu vào Gap Analysis (Enterprise Grade → Commercial Ready). **Không** phải SSOT, **không** đề xuất thiết kế lại.
**Nguyên tắc:** chỉ kết luận theo mã và tài liệu trong repo; chỗ mã ≠ tài liệu ghi rõ ở §16.3; chỗ thiếu bằng chứng ghi ở §17.

> **Cập nhật 06/10/2026:** chủ phiên `/b` (link chuyển tiếp không lộ phiên), hướng dẫn lần đầu / tiếp tục xem, quay lại mẫu trước, mẫu hết hàng, liên hệ kèm mẫu, sự kiện hành trình — xem [`THE_CHAO_HANH_TRINH_KHACH.md`](THE_CHAO_HANH_TRINH_KHACH.md).

> Không nhầm với "Thẻ chào sản phẩm A6 / M01c" (`sales-pitch-template.ts`, tab ở `/tai-anh`) — đó là thẻ in/ảnh tĩnh, ngoài phạm vi tài liệu này.


## 1. Executive Summary

- Thẻ chào là **kênh bán hàng tự phục vụ**: tiệm gom mẫu hoa (từ Product Master) thành **bộ sưu tập**, gửi khách một **link**; khách lướt mẫu trên điện thoại (20 giao diện), chọn mẫu, điền đơn, nhận **QR VietQR** để chuyển khoản, theo dõi đơn tới lúc giao kèm ảnh thật.
- Phía tiệm có **quy trình 9 bước** chia cho 3 vai suy từ năng lực (Sale / Điều hành / Điều phối), **thời gian chuẩn từng bước** báo "kẹt", **Hộp việc** gom việc + tin nhắn nội bộ, **xin/duyệt giảm giá**, **đối soát SePay tự động**, **thông báo khách qua Zalo ZNS / eSMS** có **bộ quét nền** gửi lại tin lỗi, nhắc chuyển khoản và (tuỳ chọn) tự huỷ đơn quá hạn giữ, phễu theo sale và theo kênh.
- Quy mô: 11 bảng `greeting_*` (có migration idempotent), 44 handler / 34 tệp route `/api/v1/greeting-card/*` + 13 handler công khai + 4 trang công khai + bộ quét nền khởi động từ `src/instrumentation.ts`.
- Kiểm chứng 06/10/2026: `npm test` 224/224 tệp · 1664 ca; tenant Thẻ chào 14 tệp xanh (toàn bộ tenant 354/356 — 2 ca `product-copies` đỏ y hệt trên `main`); E2E `brochure-swipe` 11/11; typecheck, lint ratchet, UX lint, `check:docs`, `build` đạt.
- Sau khắc phục, các khoảng hở P0/P1 của v1 đã đóng (phạm vi tiền & phễu, QR sau cọc, đếm "đã mở", dữ liệu trang theo dõi, pipeline cắt 100/50, đơn trùng/rác, tồn kho, thông báo bền, migration, audit xưởng, tab theo quyền, sổ đơn chung lách luật). Còn mở: nợ #179 (cờ tắt tính năng, xác minh theo IP, captcha, chú thích schema, bộ quét trong tiến trình web), #173d/e, cache trang khách, các tính năng giai đoạn sau (#176–#178).

## 2. Feature Overview & Purpose

| Mục | Hiện trạng | Bằng chứng |
|---|---|---|
| Mục đích (tài liệu) | "Gửi khách một bộ sưu tập để lướt xem, chọn mẫu và tự đặt hoa, thanh toán ngay trên điện thoại" | `src/app/(app)/the-chao/page.tsx` (tiêu đề trang); Screen Contract `docs/dac-ta/screen-contracts/the-chao.md` §1 |
| Người dùng nội bộ | Điều hành (`dieu_hanh`), Sale (`sale`), Điều phối (`dieu_phoi`) — vai *suy từ năng lực* F2 > R4/R5 > R2 | `domain/internal-message.ts:15` |
| Người dùng ngoài | Khách mua hoa (không đăng nhập), người nhận hoa (chỉ thấy ảnh qua khách) | routes `/api/v1/public/*` |
| Vị trí trong hệ thống | Menu nhóm "Bán hàng", mục "Thẻ chào mẫu hoa", hiện khi có `R1` | `src/components/layout/nav-model.ts:92` |
| Nhúng ở nơi khác | Tab Sale + Điều hành trong `/don-hang`; tab Điều phối trong `/dieu-phoi` | `src/app/(app)/don-hang/page.tsx:173-174`, `src/app/(app)/dieu-phoi/page.tsx:100` |
| Đăng ký tài liệu | Có Screen Contract + đặc tả 06 §23b/§25 + đặc tả 07 §28 + nợ #170–#178. **Không** có trong PRD, function catalog, Registry, `TRANG_THAI.md` §4–6 | grep `docs/` |

## 3. Current Capabilities

Ký hiệu trạng thái: **I** Implemented · **P** Partial · **M** Missing · **D** Dead Code · **U** Unclear (định nghĩa đầy đủ ở §15).

**3.1 Bộ sưu tập (catalog)** — tạo (mã link riêng, dịp `STANDARD` hoặc riêng khách `CLIENT`), sửa tên/mô tả/`filters`, ẩn mềm, thêm/bớt sản phẩm (chỉ sản phẩm cùng tiệm), nhân bản (client đọc rồi tạo mới), chọn giao diện khách xem (`filters.templateId`), bật/tắt 7 trường hiển thị theo từng giao diện, ảnh ghép PNG 1200×630 làm ảnh xem trước. **I**
**3.2 Link gửi khách** — 3 loại: *link riêng* `/b/<PREFIX-8 ký tự>` (sale tạo, kèm tên/SĐT khách, hạn 7/30/90 ngày/không hạn); *link bộ sưu tập mang tên người sao chép* `/s/<10 ký tự>` (mỗi khách mở = 1 phiên riêng, cookie 30 ngày); *link chung* `/g/<id>` và `/bst/<slug>/<mã>` (đơn giao cho "người phụ trách mặc định"). Thu hồi link chưa có đơn; ghi mốc "đã sao chép". **I**
**3.3 Trải nghiệm khách** — 20 giao diện (14 dạng vuốt dùng chung một engine + 6 deck), thanh liên hệ tiệm (gọi/Zalo), chọn mẫu → form (5 ô địa chỉ, ngày/khung giờ có giờ chốt, size, số lượng ≤ 20, khu vực giao, mã giảm giá, lời nhắn thiệp) → xem lại → QR + sao chép STK/số tiền/nội dung → báo đã chuyển → theo dõi (ảnh thành phẩm, ảnh người nhận) → đặt thêm đơn. Lưu nháp form trong `localStorage`. **I**
**3.4 Giá & thanh toán** — giá luôn tính lại ở server bằng MỘT hàm (`resolveProductPriceVnd`, cả trang khách lẫn xem trước nội bộ); mẫu chưa có giá vẫn đặt được (tổng 0, chờ báo giá, báo khách mốc `QUOTED`); cọc theo %, sau cọc khách vẫn thấy QR phần còn lại; giữ đơn có đếm ngược + nhắc + tự huỷ tuỳ chọn; xác nhận thu có khoá lạc quan + audit; huỷ (trả mã giảm giá); hoàn tiền. Mẫu hết hàng ở chi nhánh (`product_inventory`) ẩn và không đặt được. **I**
**3.5 Đối soát ngân hàng tự động** — webhook SePay, khoá API băm SHA-256, tìm mã đơn trong nội dung CK, idempotent theo mã giao dịch, giao dịch không khớp vào hàng chờ xử lý tay. Chỉ SePay. **P** (nợ #173d)
**3.6 Xưởng & giao hàng** — phân công thợ → ảnh thành phẩm (1–5 ảnh + 0–2 video ≤ 15 giây) → giao ship → ảnh người nhận (đóng đơn); chặn sai thứ tự + chặn theo chính sách tiền. **I**
**3.7 Theo dõi tiến độ** — quy trình 9 bước cho link chưa có đơn và đơn; thời gian chuẩn từng bước; lọc theo bước/sale/kênh/tìm kiếm; báo cáo bảng. Đọc mọi đơn còn việc + đơn xong 7 ngày + link còn hạn 30 ngày (trần an toàn 2000). **I**
**3.8 Hộp việc & tin nhắn nội bộ** — việc cần làm theo vai, tin gửi cho vai/người, trả lời về đúng người, đã đọc lưu server; xin giảm giá (% hoặc số tiền, trần mặc định 25%) và duyệt/sửa mức/từ chối ngay trong hộp. **I** (thông báo đẩy/Zalo cho nhân viên: **M**, Screen Contract §14)
**3.9 Quyền xem của sale** — mặc định ALL/OWN + chọn riêng từng sale; áp cho đơn, link, tin, theo dõi, thao tác tiền (thu, báo giá, huỷ, hoàn, tiền chưa khớp) và phễu. **I**
**3.10 Thông báo khách** — 9 mốc (nhận đơn, đã báo giá, nhắc chuyển khoản, nhận cọc, thanh toán đủ, cắm xong, đang giao, đã giao, huỷ) qua ZNS hoặc eSMS; mỗi mốc gửi 1 lần; bộ quét nền đưa tin kẹt `SENDING` > 5 phút về `FAILED` và gửi lại cách 30 phút trong 6 giờ; gửi thử; hướng dẫn đăng ký mẫu ZNS trong Cài đặt. **I** (bền ở mức tiến trình web, chưa hàng đợi riêng — nợ #179e)
**3.11 Phân tích** — phễu theo sale (gửi→mở→chọn→đặt→thu đủ, tiền thật đã thu `paid_vnd`) 7/30/90 ngày; phễu link chung theo kênh `?kenh=`; sale OWN chỉ thấy số của mình. "Đã mở" chỉ ghi khi trình duyệt khách gọi `POST …/open`. **I**
**3.12 Cờ tắt tính năng** `GREETING_CARD_ENABLED` — `false` chỉ tắt bộ quét nền; chưa ẩn menu/route/API (nợ #179a). **P**
**3.13 Chống lạm dụng trang khách** — giới hạn theo IP mọi route công khai, ô bẫy ẩn `website`, tối đa 5 đơn/giờ/SĐT, chống đơn trùng link chung (10 phút); chưa captcha. **P**

## 4. End-to-End User Flow

**4.1 Sale gửi link riêng (chế độ "Gửi nhanh", mặc định khi vào `/the-chao`)** — `journey/journey-wizard.tsx`
1. Bước 1: chọn/tạo/nhân bản bộ sưu tập, thêm mẫu, chọn giao diện khách xem.
2. Bước 2: (tuỳ chọn) tên + SĐT khách, hạn link → `POST /greeting-card/send-links` (R2).
3. Bước 3: sao chép link `/b/<mã>` → `POST /send-links/:mã/copied` ghi mốc gửi (lỗi mạng không chặn chép).
   Chế độ "Quản lý" có 5 tab: Bộ sưu tập · Theo dõi tiến độ · Bán hàng · Điều hành · Điều phối.

**4.2 Link bộ sưu tập mang tên người sao chép** — bấm "Sao chép" → `POST /share-links` tạo **mã mới mỗi lần bấm** (`share/tracked-copy.ts:22`) → khách mở `/s/<mã>` (thẻ meta xem trước, không tạo phiên) → JS chuyển `/s/<mã>/mo` (giới hạn 30 lần/10 phút/IP) → tạo phiên `SL-…` tính cho người sao chép, sự kiện `SHARE_OPEN`, cookie `fl_s_<mã>` → 302 sang `/b/<mã phiên>`.

**4.3 Khách trên link riêng** — `customer/brochure-customer-experience.tsx`
1. Mở `/b/<mã>`: dựng trang chỉ đọc; trình duyệt gọi `POST …/open` → `CREATED` → `OPENED` (+ `OPEN`) đúng một lần (máy quét xem trước không tính). Link sai/hết hạn/thu hồi/bộ sưu tập ẩn (chưa có đơn) → trang "link không còn hiệu lực" kèm liên hệ tiệm.
2. Chọn mẫu → `POST …/select` (chỉ `productId`; ảnh chụp mẫu dựng ở server) → `SELECTED`.
3. Form → báo giá trực tiếp `POST …/quote` → "Xem lại đơn" → `POST …/order` (server tính lại giá, kiểm giờ chốt; idempotent theo phiên) → phiên `ORDER_SUBMITTED`, đơn `orders.source = BROCHURE`, `status = DRAFT`.
4. Màn thanh toán: QR (cọc/đủ/phần còn lại), đếm ngược giữ đơn (nếu bật), tự hỏi trạng thái định kỳ; "Tôi đã chuyển khoản" → `PAYMENT_REPORTED` (+ `CLICK_PAID`; báo chuyển phần còn lại ghi `purpose: BALANCE`). Tiệm nhận cọc → màn báo "đã nhận cọc" + nút xem QR phần còn lại.
5. Theo dõi (làm mới 15 giây; mở từ link của khách nên thấy đầy đủ), "Đặt thêm đơn" → `POST …/reorder` tạo phiên mới cùng sale/khách.

**4.4 Khách trên link chung `/g`, `/bst`** — xem không tạo phiên; ghi sự kiện VIEW/DETAIL/FORM_OPEN theo kênh; đặt đơn `POST /public/greeting-catalog/:id/order` → tạo phiên `PUB-…` ở trạng thái `SELECTED` (người phụ trách mặc định) rồi tạo đơn; ghi sự kiện `ORDER`. Gửi lại cùng SĐT + mẫu + người nhận + ngày giao trong 10 phút → trả lại đơn cũ; ô bẫy + 5 đơn/giờ/SĐT + 10 lần/10 phút/IP.

**4.4b Người chỉ có mã đơn** — `GET /public/brochure/tracking/:code` trả bản rút gọn; nhập 4 số cuối SĐT người đặt (`POST`, 5 lần/15 phút) → bản đầy đủ.

**4.5 Điều hành** — tab Điều hành: đơn còn phải thu/đã thu/…; với mỗi đơn: đối chiếu giá (giá công bố vs giá chốt + lý do: size, số lượng, mã giảm, giảm duyệt tay, phí giao, báo giá), Báo giá · Ghi nhận đã nhận tiền · Huỷ · Hoàn tiền; bảng tiền vào chưa khớp; ngăn "Cài đặt" 9 mục (thời gian chuẩn, quyền xem sale, trần giảm giá, người phụ trách mặc định, tài khoản nhận tiền, đối soát ngân hàng, chính sách cọc/chặn xưởng/giữ đơn/tự huỷ quá hạn, khu vực & phí giao/giờ chốt, kênh thông báo).

**4.6 Điều phối** — tab Điều phối (hoặc `/dieu-phoi`): việc kẹt lên đầu; Giao Florist (ghi chú) → Ảnh thành phẩm → Giao Ship (ghi chú shipper/mã vận đơn) → Ảnh người nhận (hoàn tất đơn). Ảnh tải qua `/api/v1/assets/upload-url` rồi gắn vào đơn.

**4.7 Hộp việc (🔔, mọi tab)** — làm mới 20 giây; "Xử lý" mở đúng tab, cuộn tới thẻ đơn (thử 20 lần × 200 ms); trao đổi theo đơn làm mới 15 giây; Ctrl/⌘+Enter gửi.

## 5. Business Logic & Rules

| # | Luật | Nơi thực thi |
|---|---|---|
| B1 | Mã link riêng `PREFIX(2–6)-8 ký tự Crockford`; mã cũ `T01-001` vẫn nhận; tra công khai trùng giữa 2 tiệm → 404 | `domain/greeting-card-rules.ts:17-48`; `infra/greeting-card-repository.ts:19,123` |
| B2 | Mã đơn `DH<yymmdd>-<8 ngẫu nhiên>` — vừa là nội dung CK vừa là khoá tra cứu công khai | `greeting-card-rules.ts:50` |
| B3 | Hạn link mặc định 30 ngày, kẹp 1–365, `null` = không hạn; hết hạn/thu hồi chỉ chặn link **chưa có đơn** | `greeting-card-rules.ts:252-273` |
| B4 | Giá = `attributes.price` → `attributes.price_vnd` → giá biến thể đầu; không có → `null` ("Liên hệ"), đơn tổng 0 chờ báo giá, không nhận mã giảm giá, không QR | `domain/brochure-commerce-rules.ts:24`; `use-cases/brochure-quote.ts` |
| B5 | Giá size = `variant.attributes.price` hoặc giá gốc × `multiplier`; tối đa 10 biến thể | `domain/brochure-pricing.ts:33`; `greeting-catalog-repository.ts` |
| B6 | Tổng = đơn giá × SL(1–20) − giảm (mã, có trần) + phí khu vực (miễn khi sau giảm ≥ ngưỡng); tối đa 30 khu vực | `brochure-pricing.ts:153` |
| B7 | Mã giảm giá: chưa dùng, chưa hết hạn, đúng khách (theo SĐT), đạt đơn tối thiểu; đánh dấu đã dùng trong cùng giao dịch tạo đơn; huỷ đơn trả mã | `brochure-pricing.ts:105`; `brochure-checkout-repository.ts:99`; `brochure-payment-repository.ts` `cancel` |
| B8 | Kiểm đơn: tên ≤ 100, SĐT `^(0\|+84)[35789]\d{8}$`, ngày giao hôm nay(giờ VN)…+365, địa chỉ 5–300 (form mới: 4 ô bắt buộc + quận tuỳ chọn, ≤ 120/ô, server tự ghép), thiệp/ghi chú ≤ 500 | `greeting-card-rules.ts:136`; `domain/delivery-address.ts` |
| B9 | Giờ chốt giao trong ngày (1–23h) + giờ chuẩn bị (≤ 24) loại khung giờ không kịp; kiểm cả khi gọi thẳng API | `domain/delivery-schedule.ts:48` |
| B10 | Cọc: lần đầu `ceil(total×%/1000)×1000`, các lần sau = phần còn lại | `domain/brochure-payment-policy.ts:49` |
| B11 | Chặn xưởng: (tuỳ tiệm) chưa thu đồng nào thì không phân công/chụp thành phẩm; chưa thu đủ (hoặc chưa báo giá) thì không giao ship | `brochure-payment-policy.ts:64` |
| B12 | Thứ tự xưởng: không phân công khi đã cắm xong/đã giao; giao ship cần `READY`; ảnh người nhận cần đang giao; đơn huỷ/xong thì chặn hết | `brochure-commerce-rules.ts:77` |
| B13 | Ghi thu: đơn chưa huỷ, đã có giá, còn phải thu, số nguyên dương ≤ phần còn lại; `DRAFT → CONFIRMED` ở lần thu đầu; khoá lạc quan trên `paid_vnd` | `brochure-payment-repository.ts:40` |
| B14 | Webhook: chuyển thừa → ghi đúng phần còn lại + ghi chú "cần hoàn"; đơn huỷ/đã đủ/không thấy → UNMATCHED | `domain/bank-transfer-matching.ts:25` |
| B15 | Báo giá chỉ cho đơn tổng 0 chưa huỷ, 1đ–1 tỷ; lý do ≤ 300 | `brochure-payment-policy.ts` `quoteBlocker` |
| B16 | Xin giảm: đúng một trong %/số tiền, đơn đã có giá, ≤ trần (`brochure_discount.max_percent`, mặc định 25, 0 = tắt) tính trên giá trước mọi lần giảm; mỗi đơn 1 yêu cầu chờ; duyệt lần sau **thay** lần trước; tổng sau giảm ≥ số đã thu; từ chối bắt buộc ghi chú ≥ 3 ký tự | `domain/discount-request.ts:42`; `infra/discount-repository.ts:43` |
| B17 | Vai: F2 → Điều hành; R4/R5 → Điều phối; R2 → Sale; không vai → hộp việc coi như Sale | `internal-message.ts:15`; `use-cases/get-inbox.ts:30` |
| B18 | Quyền xem OWN chỉ áp cho người **không** có R4/R5/F2 (R9 cố ý không tính) | `domain/order-visibility.ts:20` |
| B19 | Người phụ trách link chung: người Điều hành chọn (nếu còn hoạt động) → người có vai `dieu_hanh` vào sớm nhất → thành viên đầu tiên | `domain/link-ownership.ts`; `infra/share-link-repository.ts:106` |
| B20 | Kẹt = thời gian ở bước hiện tại > thời gian chuẩn; link riêng chưa sao chép không tính kẹt; mốc bước của đơn = sự kiện đơn/phiếu thu/QC mới nhất | `domain/step-sla.ts`; `domain/pipeline-clock.ts` |
| B21 | Media xưởng: 1–5 ảnh JPG/PNG/WEBP ≤ 10MB, 0–2 video MP4/MOV/WEBM ≤ 50MB; **độ dài video ≤ 15s chỉ kiểm ở trình duyệt** | `domain/media-limits.ts` |
| B22 | Thông báo: SMS không dấu, ≤ 306 ký tự; ZNS cần mã mẫu cho từng mốc, thiếu mẫu = bỏ qua mốc đó; mốc đòi tiền (`QUOTED`, `PAYMENT_REMINDER`) gửi số còn phải trả | `domain/customer-notifications.ts`; `use-cases/notify-customer.ts` |
| B23 | Thao tác trên đơn (thu, báo giá, huỷ, hoàn) chỉ trong phạm vi xem của người làm; ngoài phạm vi → 404 | `use-cases/order-scope.ts` `assertOrderInScope` |
| B24 | Theo dõi công khai: mặc định tên viết tắt + phường/tỉnh, không lời nhắn, không ảnh người nhận; đầy đủ khi `?link=` đúng hoặc đúng 4 số cuối SĐT; không bao giờ trả SĐT | `domain/tracking-privacy.ts`; `use-cases/get-brochure-tracking.ts` |
| B25 | Chống đơn trùng/rác: trùng = cùng SĐT, mẫu, người nhận, ngày giao trong 10 phút; ô bẫy có chữ → 400; ≥ 5 đơn/giờ/SĐT → 429 | `domain/order-guard.ts` |
| B26 | Tồn kho: dòng `product_inventory` đúng chi nhánh của sản phẩm `OUT_OF_STOCK` hoặc số lượng 0 (trừ `PRE_ORDER_ONLY`) → ẩn + 409 | `domain/product-availability.ts` |
| B27 | Giữ đơn: hết hạn (từ lúc đặt, hoặc lúc báo giá) → nhắc 1 lần; tiệm bật `auto_cancel_unpaid` + quá thêm 60 phút + khách chưa báo chuyển → tự huỷ | `domain/background-sweep.ts` `holdAction` |
| B28 | Đơn `source = BROCHURE` không sửa/huỷ/phân công được qua sổ đơn chung → 409 | `orders/domain/order-rules.ts` `brochureLockReason` |

## 6. States & State Transitions

**6.1 Phiên/link (`greeting_sessions.status`)** — bảng chuyển hợp lệ ở `greeting-card-rules.ts:76` nhưng **chỉ được dùng khi chọn mẫu**; các nơi khác ghi thẳng.

| Từ → Đến | Kích hoạt | Ghi chú |
|---|---|---|
| (mới) → `CREATED` | Sale tạo link riêng | |
| (mới) → `OPENED` | Mở `/s/…/mo` hoặc "đặt thêm đơn" | |
| (mới) → `SELECTED` | Đặt từ link chung (`PUB-…`) | |
| `CREATED` → `OPENED` | Trình duyệt khách gọi `POST /public/brochure/:sendCode/open` (một lần, `updateMany` có điều kiện) | `get-greeting-catalog.ts` `markBrochureOpened` |
| → `SELECTED` | Khách chọn mẫu (chặn nếu đã có đơn) | |
| `SELECTED` → `ORDER_SUBMITTED` | Tạo đơn (nguyên tử với đơn) | |
| `ORDER_SUBMITTED` → `PAYMENT_REPORTED` | Khách bấm "đã chuyển" | chỉ từ `ORDER_SUBMITTED` |
| bất kỳ → `COMPLETED` | Lần ghi thu làm đơn **thu đủ** (cọc không đổi trạng thái phiên) | `brochure-payment-repository.ts` |
| `BROWSING` | Khai báo, hiển thị, **không nơi nào ghi** | D |

Thu hồi/hết hạn là cột riêng (`revoked_at`, `expires_at`), không phải trạng thái.

**6.2 Đơn (dùng chung bảng `orders`)** — Thẻ chào chỉ dùng: `status` `DRAFT → CONFIRMED` (thu lần đầu) `→ COMPLETED` (ảnh người nhận), `→ CANCELLED` (khi chưa giao xong); `production_status` `WAITING → ARRANGING → READY`; `delivery_status` `PENDING → DELIVERING → DELIVERED`. Giá trị enum không bao giờ được Thẻ chào ghi: `PROCESSING`, `DELIVERED`(status), `ASSIGNED`, `QUALITY_CHECK`, `DISPATCHED`, `FAILED`. Mã còn so `production_status === "DONE"` — giá trị **không có trong enum** (`get-tracking-pipeline.ts:51`, `coordinator-progress.ts`). Hoàn tiền không đổi trạng thái đơn. Tự huỷ bởi bộ quét: `DRAFT → CANCELLED` (audit `system:hold-expiry`). Sổ đơn chung không đổi được đơn Thẻ chào (B28).

**6.3 Quy trình 9 bước (suy ra, không lưu)** — `get-tracking-pipeline.ts`: giao xong → B9; đang giao → B8; `READY` → B7; `ARRANGING` → B6; `CONFIRMED` hoặc thu đủ → B5; khách báo CK hoặc đã thu một phần → B4; còn lại → B3 (đổi tên "Đã đặt đơn — chờ khách chuyển khoản"). Link: báo CK → B4; có đơn → B3; mở/chọn → B2; chưa mở → B1. Hệ quả: đơn đã **cọc** (`CONFIRMED`) nhảy thẳng B5 "Xác nhận tiền".

**6.4 Khác** — giao dịch ngân hàng `RECEIVED → MATCHED | UNMATCHED | IGNORED` (`UNMATCHED → IGNORED` khi xử lý tay); thông báo `SENDING → SENT | FAILED | SKIPPED`; bộ quét: `SENDING` > 5 phút → `FAILED`, `FAILED → SENDING` cách 30 phút trong 6 giờ; yêu cầu giảm giá (trong `payload`) `PENDING → APPROVED | REJECTED`.

## 7. Data & Architecture

**7.1 Bảng** (`prisma/schema.prisma:2602-2846`; tất cả có `organization_id` + index, cascade xoá theo tổ chức)

| Bảng | Vai trò | Ràng buộc chính |
|---|---|---|
| `greeting_catalogs` | Bộ sưu tập; `filters` Json (`templateId`, bộ lọc) | unique `(org, code)` |
| `greeting_catalog_products` | Mẫu trong bộ sưu tập → `products` | unique `(catalog, product)` |
| `greeting_sessions` | Link/phiên khách; `product_snapshot` Json; `sale_id` = chủ link hoặc `"public"` | unique `(org, send_code)` — tính duy nhất toàn hệ thống chỉ ở use-case |
| `greeting_share_links` | Link `/s/<mã>` mang tên người sao chép | unique `code` |
| `greeting_journey_events` | Sự kiện phiên: `OPEN, SELECT_PRODUCT, SUBMIT_ORDER, CLICK_PAID, ADMIN_CONFIRMED_PAYMENT, LINK_COPIED, SHARE_OPEN, LINK_REVOKED, REORDER` | |
| `greeting_catalog_events` | Phễu link chung theo kênh, `visitor_hash` | |
| `greeting_messages` / `greeting_message_reads` | Tin nội bộ; `kind` MESSAGE / DISCOUNT_REQUEST / DISCOUNT_DECISION; trạng thái giảm giá nằm trong `payload` Json | unique `(message, user)` |
| `greeting_integrations` | 1 dòng/tiệm: băm khoá webhook, kênh thông báo, credentials mã hoá | unique `organization_id`, `payment_webhook_key_hash` |
| `greeting_payment_events` | Giao dịch SePay | unique `(org, provider, external_id)` |
| `greeting_notifications` | Nhật ký tin gửi khách | unique `(org, order, event_key)` |

Bảng dùng chung: `orders` (+ `source`, `source_session_id`, `pricing_rule_ref` Json chứa báo giá/giảm tay, `delivery_address` Json gồm cả SĐT người nhận), `order_items` (`metadata` = ảnh chụp mẫu + biến thể), `order_payments`, `order_events`, `order_qc_records` (ảnh; `notes` = loại ảnh), `customers` (tạo theo SĐT), `vouchers`, `assets`, `audit_logs`.

**7.2 Cấu hình trong `organizations.settings`** (Json, hợp nhất nông theo khoá qua `PATCH /organizations/current`, F2): `brochure_payment`, `brochure_policy` (+ `hold_minutes`, `auto_cancel_unpaid`), `brochure_shipping`, `brochure_step_sla`, `brochure_visibility`, `brochure_discount`, `brochure_default_owner`, `greetingCardDisplay`.

**7.3 Phân tầng** — đúng quy ước: `domain/` (31 tệp thuần + 17 tệp test), `infra/` (14 repository, Prisma), `adapters/` (ZNS, eSMS, VietQR), `use-cases/` (33), `contracts/` (zod công khai, phân trang). Build vẫn `prisma db push`; có migration idempotent `20261006120000_greeting_card` (đã kiểm `migrate diff` rỗng). Bộ quét nền: `use-cases/background-sweep*.ts` + `infra/background-sweep-repository.ts`, khởi động ở `src/instrumentation.ts`.

## 8. UI/UX Behavior

- **Trang `/the-chao`** (`page.tsx`): 2 chế độ "Gửi nhanh" (mặc định) / "Quản lý"; 5 tab hiện theo năng lực (Bộ sưu tập `L1`, Theo dõi `R1`, Bán hàng `R2`, Điều hành `R9`/`F2`, Điều phối `R3`/`R4`/`R5`). Nút đầu trang: Hộp việc · Chế độ · Làm mới.
- **Tầng gọi API**: SWR (`greeting-api.ts`), làm mới khi quay lại tab; danh sách phân trang con trỏ + "Tải thêm"; lỗi đọc `error.details` tiếng Việt (`api-error.ts`).
- **Làm mới định kỳ**: Hộp việc 20s, trao đổi 15s, Theo dõi tiến độ 30s, danh sách việc 60s; trang khách: thanh toán (đến khi đủ), theo dõi 15s.
- **Trang khách**: thanh liên hệ tiệm, 20 giao diện (`templates/greeting-template-renderer.tsx`), bước xem lại trước khi gửi, sao chép STK/số tiền/nội dung, đồng hồ giữ đơn, ô nhập 4 số cuối SĐT ở theo dõi, ô bẫy ẩn ở form, thông báo quyền riêng tư, nút đặt thêm đơn, trang "link không còn hiệu lực" có liên hệ tiệm.
- **Trợ năng/responsive** (theo Screen Contract, đối chiếu mã): bảng trượt toàn màn hình, Esc đóng, Ctrl/⌘+Enter gửi, `aria-live` số việc và trao đổi — có trong `inbox/*`.
- **Lệch quy ước dự án**: `templates/template-selector-split-pane.tsx` 498 dòng (> 350); `swipe/swipe-themes.ts` dùng 48 mã màu hex (giao diện khách theo chủ đề).

## 9. Integrations & Dependencies

| Loại | Thành phần | Ghi chú |
|---|---|---|
| Ngân hàng | SePay webhook `POST /public/payments/sepay` | `Authorization: Apikey`, khoá sinh 1 lần, giới hạn 600/phút/IP; không đối chiếu số tài khoản nhận với cấu hình tiệm |
| QR | `img.vietqr.io` (ảnh QR do bên thứ ba dựng từ URL) | `adapters/vietqr-helper.ts:25` — STK, tên, số tiền, mã đơn nằm trong URL ảnh |
| Thông báo | Zalo ZNS (OAuth refresh 1 lần dùng, tự lưu cặp token mới), eSMS brandname | circuit breaker `core/http/circuit-breaker` |
| Lưu trữ | `assets` + URL ký HMAC 7 ngày `/api/v1/storage/...`; storage provider cho ảnh ghép | `greeting-catalog-repository.ts` |
| Nội bộ | Product Master (`products`, biến thể, ảnh MAIN, bản phân tích APPROVED → `master-index-fields`), `customers`, `vouchers`, `orders*`, `audit`, `organization` (thành viên, vai, năng lực), `core/rbac`, `core/tenancy`, `core/http/rate-limit` (Redis hoặc bộ nhớ), `core/security/secret-box` (AES-256-GCM + HKDF), `core/runtime/background` |
| Bị phụ thuộc | Đơn Thẻ chào hiện trong sổ đơn chung (`OrderRepository.list` không lọc `source`) nhưng sửa/huỷ/phân công ở đó trả 409; route Điều phối không thấy đơn này (cần `order_coordinations`) | B28 |

## 10. Permissions & Security

**10.1 Xác thực** — route nội bộ: `requireTenantContext()` (tổ chức chỉ lấy từ phiên). Route công khai: tổ chức suy từ mã gửi / id bộ sưu tập / mã link / băm khoá webhook.

**10.2 Năng lực** (`domain/greeting-card-capabilities.ts`; vai mặc định theo `core/rbac/capability-catalog.ts`)

| Thao tác | Mã | Vai mặc định có mã |
|---|---|---|
| Xem bộ sưu tập, ảnh ghép | L1 | dieu_hanh, dieu_phoi, sale, product_manager, marketing, crm |
| Tạo/sửa bộ sưu tập, link, gửi tin, xin giảm | R2 | dieu_hanh, dieu_phoi, sale |
| Xem đơn, theo dõi, hộp việc, tin, thống kê, tích hợp (đọc) | R1 | + crm, customer_service |
| Ghi thu, báo giá, xem/xử lý giao dịch không khớp | R9 + phạm vi xem (B23) | dieu_hanh, dieu_phoi, sale (PO 06/10/2026: giữ) |
| Phân công thợ · ảnh thành phẩm · giao ship/ảnh người nhận | R4 · R3 · R5 | dieu_hanh, dieu_phoi |
| Huỷ · hoàn tiền (trần cứng) | R6 · R10 | dieu_hanh |
| Cấu hình tích hợp, quyền xem sale, duyệt giảm giá | F2 | dieu_hanh |
| Cài đặt chính sách/khu vực/tài khoản (`PATCH /organizations/current`) | F2 | dieu_hanh |
| `GET` · `PUT /greeting-card/display-settings` | L1 · R2 | như hai dòng đầu |

**10.3 Cơ chế bảo mật đã có** — giá chỉ tính ở server; sản phẩm/ảnh/asset phải cùng tiệm (404 nếu khác); cross-tenant trả 404; trang khách không trả SĐT khách/id tổ chức/id sale; mã gửi & mã đơn ngẫu nhiên; giới hạn tần suất mọi route công khai (10–120 lần/phút hoặc /10 phút/IP); khoá webhook chỉ lưu băm; credentials ZNS/eSMS mã hoá, không đọc ngược; khoá lạc quan cho thu/hoàn/báo giá/huỷ/duyệt giảm; audit cho thu, hoàn, báo giá, huỷ, duyệt/từ chối giảm giá và mọi tác vụ xưởng; theo dõi công khai rút gọn + xác minh (B24); chống đơn rác (B25); khách hiển thị IP băm trong khoá giới hạn, phễu kênh dùng mã khách băm.

**10.4 Rủi ro/khoảng hở hiện có (quan sát, chưa đánh giá)**

1. `GET /organizations/current` (F1, có ở vai sale/điều phối) được các tab Thẻ chào gọi để đọc `settings` → trả toàn bộ cài đặt tổ chức (gồm tài khoản nhận tiền) cho client.
2. Webhook SePay không đối chiếu `accountNumber` với tài khoản cấu hình; khoá API hợp lệ là đủ để ghi thu theo mã đơn.
3. Độ dài video chỉ kiểm phía trình duyệt.
4. Chưa có captcha; chống bot dựa vào ô bẫy + trần theo SĐT + giới hạn IP (nợ #179c).
5. Xác minh 4 số cuối SĐT giới hạn 5 lần/15 phút theo IP × mã đơn — kẻ dò dùng nhiều IP vẫn thử được nhiều hơn (nợ #179b).
6. CSRF: không có token hay kiểm `Origin`; route nội bộ dựa vào cookie phiên `HttpOnly; Secure; SameSite=Lax` (`src/core/http/cookies.ts`). Route công khai không dùng cookie đăng nhập.

## 11. Error Handling & Edge Cases

- Lỗi chuẩn qua `handle()`/`AppError` (400 theo trường, 401 webhook, 404, 409, 422, 429). Thông báo tiếng Việt.
- **Đã xử lý**: gửi đơn 2 lần (link riêng: theo phiên; link chung: theo SĐT + mẫu + người nhận + ngày, 10 phút); 2 người thu tiền cùng lúc / webhook gửi lại; giao dịch dở ở `RECEIVED` được làm tiếp; mã giảm giá dùng đồng thời (409); trùng mã khách; mã gửi cũ trùng giữa 2 tiệm (404); lỗi gửi thông báo không làm hỏng thao tác chính và được gửi lại có giới hạn; tin kẹt `SENDING`; khách đã cọc mở lại link (QR phần còn lại); báo giá xong báo khách, giữ đơn tính từ lúc báo giá; máy quét xem trước không tính là mở; mẫu vừa hết hàng (409); nhiều instance cùng quét (mỗi bước ghi là `updateMany` có điều kiện).
- **Chưa xử lý / hành vi đáng chú ý**:
  - Hoàn tiền toàn bộ không đổi trạng thái đơn; hoàn tiền không kiểm đơn đã huỷ hay chưa.
  - Chuyển khoản thừa: chỉ ghi chú "cần hoàn", không có tác vụ theo dõi riêng.
  - Huỷ đơn không tự hoàn tiền (thiết kế: hoàn bằng thao tác R10 riêng).
  - Instance web tắt → bộ quét dừng tới khi instance khác chạy (nợ #179e).

## 12. Performance & Scalability

| Điểm | Hiện trạng | Bằng chứng |
|---|---|---|
| Bảng theo dõi & Hộp việc | Đọc mọi đơn còn việc + đơn xong 7 ngày + link còn hạn hoạt động 30 ngày, chỉ cột cần; trần an toàn 2000 dòng mỗi loại, chạm trần ghi log cảnh báo; tính trong bộ nhớ | `infra/tracking-pipeline-repository.ts` |
| Tần suất | Hộp việc gọi lại pipeline mỗi 20s/người dùng đang mở trang; theo dõi 30s; danh sách việc 60s; trao đổi 15s | `inbox/use-inbox.ts:17` |
| Danh sách link bộ sưu tập | Đọc tới 10.000 sự kiện `SHARE_OPEN` 30 ngày rồi đếm trong bộ nhớ | `share-link-repository.ts:70` |
| Phễu | `groupBy` ở DB cho phiên; đơn đã thu tối đa 10.000; phễu kênh `groupBy` tới 50.000 nhóm | `greeting-stats-repository.ts`, `catalog-event-repository.ts` |
| Quyền xem sale | N+1: mỗi thành viên 3 truy vấn (vai, năng lực, user) | `use-cases/sale-visibility.ts:29` |
| Trang khách | Mỗi lần tải ký URL cho toàn bộ ảnh của bộ sưu tập; trang `/b` gọi use-case 2 lần (metadata + trang), cả hai chỉ đọc | `src/app/b/[sendCode]/page.tsx` |
| Giới hạn tần suất | Redis nếu có `REDIS_URL`, không thì bộ nhớ từng instance | `core/http/rate-limit.ts:73` |
| Việc nền · danh sách khác | Gửi tin ngay là Promise trong tiến trình; bộ quét nền mỗi phút (bỏ lượt nếu vòng trước chưa xong, `unref`) quét tin lỗi + đơn chưa thu 7 ngày (≤ 500/vòng); phân trang con trỏ 1–100 (`contracts/list-query.ts`); tin nhắn ≤ 500/đơn, hộp thư ≤ 300 tin/30 ngày | `core/runtime/background.ts:12` |
| Cache | Không có: cả 5 điểm vào công khai `/b`, `/s`, `/s/…/mo`, `/g`, `/bst` đặt `dynamic = "force-dynamic"`; mỗi lượt xem đọc DB và ký lại URL ảnh | `src/app/b/[sendCode]/page.tsx:48`, `g/[id]/page.tsx:45`, `bst/…/page.tsx:50` |
| Quan sát | Log có cấu trúc chỉ ở 5 điểm (`log.warn/error`: lỗi ghi thu SePay, lỗi gửi thông báo, mã gửi trùng, lỗi ghi sự kiện ORDER, việc nền lỗi); không có metric, không tracing (không OpenTelemetry/Sentry trong repo) | `payment-webhook.ts`, `notify-customer.ts`, `greeting-card-repository.ts` |

## 13. Current Limitations

1. Chỉ một cổng đối soát (SePay); không Casso/ngân hàng khác (nợ #173d); ràng buộc duy nhất của mã gửi vẫn theo tổ chức (nợ #173e).
2. Bộ quét nền chạy trong tiến trình web, chưa hàng đợi/worker riêng (nợ #179e); không thông báo nhân viên ngoài Hộp việc (Screen Contract §14).
3. Chuỗi migration chung vẫn chưa dựng được CSDL từ rỗng (nợ #143) — migration Thẻ chào idempotent không đổi điều đó.
4. Một đơn = một mẫu; không giỏ nhiều mẫu, không quà kèm (nợ #178-8).
5. Không điền sẵn tên/SĐT khách trên link riêng (nợ #176); không lưu "đã thích", không nhiều ảnh/mẫu, không AI gợi ý lời chúc, không nhắc dịp năm sau (nợ #177).
6. Đề xuất UX còn treo: huy hiệu cam kết, lọc dịp/giá, "tôi là người nhận"/giấu tên, deeplink ngân hàng, biên nhận, đánh giá sau giao, "đặt lại mẫu này", ghi bước khách bỏ dở (nợ #178).
7. Không đa ngôn ngữ/đa tiền tệ (chỉ VNĐ, SĐT Việt Nam, giờ UTC+7 cố định).
8. Không xuất dữ liệu (CSV); không SLA theo khung giờ làm việc (đồng hồ chạy 24/7).
9. Cờ `GREETING_CARD_ENABLED` chỉ tắt bộ quét nền (nợ #179a).
10. Không email cho khách; không tạo link hàng loạt / hẹn giờ gửi; không A/B test giao diện; không cache trang công khai (`force-dynamic`).
11. QR là ảnh do `img.vietqr.io` dựng; dịch vụ lỗi thì không có QR — khách vẫn thấy STK/số tiền/nội dung kèm nút sao chép.
12. Chú thích cột `schema.prisma` lỗi thời (nợ #179d); `template-selector-split-pane.tsx` 498 dòng (> 350).

## 14. Business Value & Benefits

Theo mục tiêu ghi trong mã/tài liệu (không có số liệu vận hành thật trong repo):
- **Khách**: chọn hoa bằng thao tác vuốt trên điện thoại, thấy giá đúng, thanh toán QR không cần gõ, theo dõi đơn kèm ảnh thật thành phẩm và lúc trao.
- **Sale**: một link thay cho gửi ảnh từng mẫu; biết khách mở/chọn/đặt lúc nào; được nhắc khi khách "kẹt"; xin giảm giá có quy trình.
- **Điều hành**: đối chiếu giá chốt vs giá công bố trước khi xác nhận tiền; tự khớp chuyển khoản; kiểm soát cọc, chặn xưởng, trần giảm giá, quyền xem; phễu theo sale và theo kênh.
- **Điều phối**: danh sách việc theo thứ tự xưởng, chặn sai bước, ảnh làm bằng chứng giao.
- **Doanh nghiệp**: thêm kênh bán tự phục vụ; dữ liệu khách vào `customers`; đơn vào sổ đơn chung; đo được chuyển đổi.

## 15. Implementation Status Matrix

**I** Implemented · **P** Partial · **M** Missing · **D** Dead Code · **U** Unclear

| Năng lực / phát hiện | TT | Bằng chứng / ghi chú |
|---|---|---|
| CRUD bộ sưu tập, gắn sản phẩm cùng tiệm; 20 giao diện + trường hiển thị; ảnh ghép OG | I | tenant `greeting-card`, `hardening`; unit templates, `display-fields`, `catalog-collage` |
| Link riêng / link `/s/` / link chung + phễu kênh | I | tenant `hardening`, `share-links`, `greeting-catalog-products-events` |
| Chọn mẫu, báo giá, đặt đơn, idempotent (link riêng và link chung) | I | tenant `checkout`, `quote`, `hardening`, `storefront` |
| Size, số lượng, khu vực, mã giảm giá, giờ chốt | I | tenant `checkout`; unit `customer-journey-upgrades` |
| Một hàm giá cho mọi nơi; mẫu chưa giá → báo giá sau + báo khách | I | unit `catalog-product-price`; tenant `quote` |
| Cọc, chặn xưởng, QR phần còn lại sau cọc | I | tenant `payments`, `storefront` |
| Giữ đơn: đếm ngược + nhắc + tự huỷ tuỳ chọn | I | unit `background-sweep`; tenant `sweep` |
| Xác nhận thu, hoàn, huỷ + audit; audit tác vụ xưởng | I | tenant `hardening`, `payments`, `scope` |
| Đối soát SePay | P | tenant `bank-sync`; chỉ một nhà cung cấp |
| Thứ tự xưởng + ảnh/video | I | tenant `reorder-photos`, `hardening` |
| Quy trình 9 bước + thời gian chuẩn + kẹt, không cắt 100/50 | I | unit `step-sla-visibility`, `tracking-pipeline`; tenant `scope` |
| Hộp việc, tin nhắn, xin/duyệt giảm giá | I | tenant `messages` |
| Quyền xem OWN cho đơn, tin, theo dõi, tiền, phễu | I | tenant `messages`, `scope` |
| Phễu tính tiền thật đã thu | I | tenant `scope` |
| Thông báo khách ZNS/eSMS + gửi lại có giới hạn | I | tenant `notifications`, `sweep` (bền ở mức tiến trình) |
| Thông báo đẩy cho nhân viên | M | Screen Contract §14 |
| "Đã mở" do trình duyệt báo | I | tenant `storefront`; E2E 2a |
| Theo dõi công khai rút gọn + xác minh | I | tenant `storefront`; E2E 6b |
| Chống đơn rác (ô bẫy, trần SĐT, IP) · captcha | I · M | unit `storefront-guards`; tenant `storefront` |
| Ẩn/chặn mẫu hết hàng | I | unit + tenant `storefront` |
| Ẩn tab theo năng lực; gác `display-settings` | I | `page.tsx`; unit `route-capability-guard` |
| Sổ đơn chung không lách luật Thẻ chào | I | tenant `scope` |
| Migration 11 bảng | I | migration idempotent, `migrate diff` rỗng |
| Cờ `GREETING_CARD_ENABLED` | P | chỉ tắt bộ quét nền |
| Sự kiện `SWIPE_NEXT/PREV`, `OPEN_ORDER_FORM`, `TRACK_VIEW`, `INTERNAL_NOTE`; trạng thái `BROWSING`; nhánh `production_status "DONE"` | D | khai báo/so sánh nhưng không ghi |
| `VALID_SESSION_TRANSITIONS` | P | chỉ dùng ở `select-brochure-product.ts` |
| E2E `brochure-swipe.spec.ts` | I | 11/11 trên máy chủ thật |
| Chống CSRF tường minh · log có cấu trúc · cache · email · link hàng loạt · A/B | P · P · M · M · M · M | §10.4, §12, §13 |

## 16. Evidence / Code References

**16.1 Điểm vào chính** — trang: `src/app/(app)/the-chao/page.tsx`, `src/app/b/[sendCode]/page.tsx`, `src/app/s/[code]/page.tsx`, `src/app/s/[code]/mo/route.ts:19`, `src/app/g/[id]/page.tsx`, `src/app/bst/[orgSlug]/[catalogCode]/page.tsx` · API nội bộ: `src/app/api/v1/greeting-card/**` (44 handler, 34 tệp) · API công khai: `src/app/api/v1/public/brochure/**`, `public/greeting-catalog/**`, `public/payments/sepay/route.ts` · Use-case lõi: `place-brochure-order.ts`, `submit-brochure-order.ts:33`, `submit-public-catalog-order.ts:34`, `confirm-brochure-payment.ts:15,36,86`, `update-brochure-order-status.ts`, `payment-webhook.ts:50`, `get-tracking-pipeline.ts:77`, `get-inbox.ts`, `internal-messages.ts`, `discount-requests.ts`, `share-links.ts:37`, `notify-customer.ts:30` · Repository lõi: `brochure-checkout-repository.ts:99`, `brochure-payment-repository.ts:40,128`, `brochure-order-repository.ts:106`, `discount-repository.ts:43`, `greeting-card-repository.ts:19,123`.

**16.2 Kiểm chứng đã chạy (06/10/2026, lượt soát này)**

- `npm test` (biến môi trường như CI) → 224/224 tệp, 1664 ca.
- `npm run test:tenant` trên Postgres 16 (`floraos_test`) → 354/356; 2 ca `product-copies` đỏ y hệt trên `main` (lỗi cũ). Tenant Thẻ chào: 14 tệp xanh.
- E2E `brochure-swipe.spec.ts` (DB `floraos_e2e`, Chromium có sẵn) → 11/11.
- `typecheck`, `lint:ratchet`, `lint:ux --check`, `check:docs`, `build`, `start` → đạt.

**16.3 Mã ↔ tài liệu lệch nhau**

Các điểm lệch của v1 (đặc tả 06 §25.2, đặc tả 07 "Bảy bảng", Screen Contract về tab, chú thích theo dõi "rút gọn", hai hàm giá) **đã sửa cùng đợt**. Còn lại:

| Tài liệu / chú thích | Mã thực tế |
|---|---|
| Chú thích cột `greeting_journey_events` trong schema ghi `INTERNAL_NOTE` | Không còn ghi; sửa khi có đợt đổi schema (nợ #179d) |
| Chú thích `greeting_catalog_events` | Đặt lệch phía trên `greeting_share_links` (nợ #179d) |
| Chú thích repository nói route `/g/[orgSlug]/[catalogCode]` | Route thật là `/bst/[orgSlug]/[catalogCode]` |

## 17. Open Questions & Unclear Areas

Đã PO chốt 06/10/2026 (v1 câu 2–5): sale giữ `R9` nhưng theo phạm vi xem; OWN áp cho phễu; theo dõi công khai rút gọn + xác minh; cọc không làm phiên "hoàn tất". Đã kiểm (v1 câu 1, 6): sổ đơn chung bị khoá với đơn Thẻ chào; E2E chạy 11/11. Còn mở:

1. Số liệu vận hành thật (số tiệm dùng, số đơn, tỷ lệ chuyển đổi) — không có trong repo; giá trị kinh doanh ở §14 chỉ theo ý đồ.
2. Có tiệm nào đang dùng ZNS thật và mẫu ZNS đã duyệt chưa; webhook SePay thật — chưa kiểm trên production.
3. `crm`/`customer_service` có R1 → vào được `/the-chao`, hộp việc coi họ như Sale — có chủ đích không.
4. Ranh giới với "Catalog & QR" (`/catalog`, `catalog_links`, M06) — hai cơ chế bộ sưu tập công khai song song.
5. Có cần công tắc tắt tính năng thật (nợ #179a) và captcha (#179c) trước khi mở rộng không.

## Phụ lục A. Bản audit thứ hai

Đối chiếu chi tiết với `greeting-card-feature-spec.md` (13 kết luận sửa theo mã, 9 mục giữ lại) nằm ở v1 của tệp này (commit `f1d1eb8`). Các mục giữ lại đã phản ánh ở §10.4, §12, §13, §15.
