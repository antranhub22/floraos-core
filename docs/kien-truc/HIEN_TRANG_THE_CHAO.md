# Thẻ chào mẫu hoa (Swipe Brochure) — Đặc tả hiện trạng (Current State Baseline)

**Phạm vi:** module `greeting-card` · trang nội bộ `/the-chao` · trang khách `/b`, `/s`, `/g`, `/bst` · **Ngày soát:** 06/10/2026 · **Nhánh soát:** `main` @ `ecb5aa3`
**Loại tài liệu:** ảnh chụp hiện trạng để làm đầu vào Gap Analysis (Enterprise Grade → Commercial Ready). **Không** phải SSOT, **không** đề xuất thiết kế lại.
**Nguyên tắc:** chỉ kết luận theo mã và tài liệu trong repo; chỗ mã ≠ tài liệu ghi rõ ở §16.3; chỗ thiếu bằng chứng ghi ở §17.

> Không nhầm với "Thẻ chào sản phẩm A6 / M01c" (`sales-pitch-template.ts`, tab ở `/tai-anh`) — đó là thẻ in/ảnh tĩnh, ngoài phạm vi tài liệu này.

---

## 1. Executive Summary

- Thẻ chào là **kênh bán hàng tự phục vụ**: tiệm gom mẫu hoa (từ Product Master) thành **bộ sưu tập**, gửi khách một **link**; khách lướt mẫu trên điện thoại (20 giao diện), chọn mẫu, điền đơn, nhận **QR VietQR** để chuyển khoản, theo dõi đơn tới lúc giao kèm ảnh thật.
- Phía tiệm có **quy trình 9 bước** chia cho 3 vai suy từ năng lực (Sale / Điều hành / Điều phối), **thời gian chuẩn từng bước** báo "kẹt", **Hộp việc** gom việc + tin nhắn nội bộ có người nhận, **xin/duyệt giảm giá**, **đối soát ngân hàng tự động (SePay)**, **thông báo khách qua Zalo ZNS / eSMS**, phễu chuyển đổi theo sale và theo kênh.
- Quy mô mã: ~21.300 dòng (module + routes + components), 11 bảng `greeting_*`, 44 handler trong 34 tệp route `/api/v1/greeting-card/*` + 11 handler công khai (`/public/brochure`, `/public/greeting-catalog`, `/public/payments/sepay`) + 4 trang công khai. Toàn bộ dựng trong **04–06/10/2026** (37 commit).
- Kiểm chứng trong lượt soát này: unit **26 tệp / 160 ca xanh**; tenant (Postgres 16 thật, DB `floraos_test`) **11 tệp / 58 ca xanh**. E2E (`tests/e2e/brochure-swipe.spec.ts`) **chưa chạy**.
- Điểm đáng chú ý nhất cho bước Gap (chi tiết §13, §10.4): phễu/thống kê không áp quyền "chỉ khách của mình"; sale mặc định có `R9` nên ghi nhận/báo giá được tiền đơn của mọi sale; trang `/b/<mã>` đánh dấu "khách đã mở" cả khi máy quét xem trước link mở; khách đã cọc mở lại link không còn thấy QR phần còn lại; thông báo khách chạy nền trong tiến trình (không hàng đợi bền); bảng theo dõi/hộp việc chỉ đọc 100 đơn + 50 link mới nhất; trang theo dõi công khai trả địa chỉ đầy đủ + lời nhắn thiệp cho bất kỳ ai có mã đơn.

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
**3.4 Giá & thanh toán** — giá luôn tính lại ở server từ Product Master; mẫu chưa có giá vẫn đặt được (tổng 0, chờ báo giá); cọc theo %; giữ đơn có đồng hồ đếm ngược; xác nhận thu (cọc/thu nốt) có khoá lạc quan + audit; báo giá; huỷ (trả mã giảm giá); hoàn tiền (không vượt số đã thu). **I**
**3.5 Đối soát ngân hàng tự động** — webhook SePay, khoá API băm SHA-256, tìm mã đơn trong nội dung CK, idempotent theo mã giao dịch, giao dịch không khớp vào hàng chờ xử lý tay. Chỉ SePay. **P** (nợ #173d)
**3.6 Xưởng & giao hàng** — phân công thợ → ảnh thành phẩm (1–5 ảnh + 0–2 video ≤ 15 giây) → giao ship → ảnh người nhận (đóng đơn); chặn sai thứ tự + chặn theo chính sách tiền. **I**
**3.7 Theo dõi tiến độ** — quy trình 9 bước cho cả link chưa có đơn và đơn; thời gian chuẩn từng bước (mặc định 5–120 phút, bật/tắt từng bước); lọc theo bước/sale/kênh/tìm kiếm; báo cáo bảng. **I** (giới hạn 100 đơn + 50 link — §12)
**3.8 Hộp việc & tin nhắn nội bộ** — việc cần làm theo vai, tin gửi cho vai/người, trả lời về đúng người, đã đọc lưu server; xin giảm giá (% hoặc số tiền, trần mặc định 25%) và duyệt/sửa mức/từ chối ngay trong hộp. **I** (thông báo đẩy/Zalo cho nhân viên: **M**, Screen Contract §14)
**3.9 Quyền xem của sale** — mặc định ALL/OWN + chọn riêng từng sale. **P** (không áp cho thống kê, thao tác tiền — §10.4)
**3.10 Thông báo khách** — 7 mốc (nhận đơn, nhận cọc, thanh toán đủ, cắm xong, đang giao, đã giao, huỷ) qua ZNS hoặc eSMS; mỗi mốc gửi 1 lần, FAILED gửi lại ở lần kích hoạt sau; gửi thử. **P** (không hàng đợi bền, không mốc "đã báo giá")
**3.11 Phân tích** — phễu theo sale (gửi→mở→chọn→đặt→thu, doanh thu) 7/30/90 ngày; phễu link chung theo kênh `?kenh=` (khách không trùng, 1 lần/khách/bước/ngày). **I**
**3.12 Cờ tắt tính năng** `GREETING_CARD_ENABLED` — khai trong env nhưng **không nơi nào kiểm**. **D**

## 4. End-to-End User Flow

**4.1 Sale gửi link riêng (chế độ "Gửi nhanh", mặc định khi vào `/the-chao`)** — `journey/journey-wizard.tsx`
1. Bước 1: chọn/tạo/nhân bản bộ sưu tập, thêm mẫu, chọn giao diện khách xem.
2. Bước 2: (tuỳ chọn) tên + SĐT khách, hạn link → `POST /greeting-card/send-links` (R2).
3. Bước 3: sao chép link `/b/<mã>` → `POST /send-links/:mã/copied` ghi mốc gửi (lỗi mạng không chặn chép).
   Chế độ "Quản lý" có 5 tab: Bộ sưu tập · Theo dõi tiến độ · Bán hàng · Điều hành · Điều phối.

**4.2 Link bộ sưu tập mang tên người sao chép** — bấm "Sao chép" → `POST /share-links` tạo **mã mới mỗi lần bấm** (`share/tracked-copy.ts:22`) → khách mở `/s/<mã>` (thẻ meta xem trước, không tạo phiên) → JS chuyển `/s/<mã>/mo` (giới hạn 30 lần/10 phút/IP) → tạo phiên `SL-…` tính cho người sao chép, sự kiện `SHARE_OPEN`, cookie `fl_s_<mã>` → 302 sang `/b/<mã phiên>`.

**4.3 Khách trên link riêng** — `customer/brochure-customer-experience.tsx`
1. Mở `/b/<mã>`: phiên `CREATED` → `OPENED` (+ sự kiện `OPEN`). Link sai/hết hạn/thu hồi/bộ sưu tập ẩn (chưa có đơn) → trang "link không còn hiệu lực" kèm liên hệ tiệm.
2. Chọn mẫu → `POST …/select` (chỉ `productId`; ảnh chụp mẫu dựng ở server) → `SELECTED`.
3. Form → báo giá trực tiếp `POST …/quote` → "Xem lại đơn" → `POST …/order` (server tính lại giá, kiểm giờ chốt; idempotent theo phiên) → phiên `ORDER_SUBMITTED`, đơn `orders.source = BROCHURE`, `status = DRAFT`.
4. Màn thanh toán: QR (cọc/đủ), đếm ngược giữ đơn (nếu bật), tự hỏi trạng thái định kỳ; "Tôi đã chuyển khoản" → `PAYMENT_REPORTED` (+ `CLICK_PAID`).
5. Theo dõi (làm mới 15 giây), "Đặt thêm đơn" → `POST …/reorder` tạo phiên mới cùng sale/khách.

**4.4 Khách trên link chung `/g`, `/bst`** — xem không tạo phiên; ghi sự kiện VIEW/DETAIL/FORM_OPEN theo kênh; đặt đơn `POST /public/greeting-catalog/:id/order` → tạo phiên `PUB-…` ở trạng thái `SELECTED` (người phụ trách mặc định) rồi tạo đơn; ghi sự kiện `ORDER`. **Không idempotent** — mỗi lần gửi là một phiên + một đơn mới (chỉ có giới hạn 10 lần/10 phút/IP).

**4.5 Điều hành** — tab Điều hành: đơn còn phải thu/đã thu/…; với mỗi đơn: đối chiếu giá (giá công bố vs giá chốt + lý do: size, số lượng, mã giảm, giảm duyệt tay, phí giao, báo giá), Báo giá · Ghi nhận đã nhận tiền · Huỷ · Hoàn tiền; bảng tiền vào chưa khớp; ngăn "Cài đặt" 9 mục (thời gian chuẩn, quyền xem sale, trần giảm giá, người phụ trách mặc định, tài khoản nhận tiền, đối soát ngân hàng, chính sách cọc/chặn xưởng/giữ đơn, khu vực & phí giao/giờ chốt, kênh thông báo).

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
| B22 | Thông báo: SMS không dấu, ≤ 306 ký tự; ZNS cần mã mẫu cho từng mốc, thiếu mẫu = bỏ qua mốc đó | `domain/customer-notifications.ts`; `use-cases/notify-customer.ts:30` |

## 6. States & State Transitions

**6.1 Phiên/link (`greeting_sessions.status`)** — bảng chuyển hợp lệ ở `greeting-card-rules.ts:76` nhưng **chỉ được dùng khi chọn mẫu**; các nơi khác ghi thẳng.

| Từ → Đến | Kích hoạt | Ghi chú |
|---|---|---|
| (mới) → `CREATED` | Sale tạo link riêng | |
| (mới) → `OPENED` | Mở `/s/…/mo` hoặc "đặt thêm đơn" | |
| (mới) → `SELECTED` | Đặt từ link chung (`PUB-…`) | |
| `CREATED` → `OPENED` | Bất kỳ ai tải `/b/<mã>` — **kể cả `generateMetadata` của máy quét xem trước** | `src/app/b/[sendCode]/page.tsx:11`, `get-greeting-catalog.ts:54` |
| → `SELECTED` | Khách chọn mẫu (chặn nếu đã có đơn) | |
| `SELECTED` → `ORDER_SUBMITTED` | Tạo đơn (nguyên tử với đơn) | |
| `ORDER_SUBMITTED` → `PAYMENT_REPORTED` | Khách bấm "đã chuyển" | chỉ từ `ORDER_SUBMITTED` |
| bất kỳ → `COMPLETED` | **Bất kỳ lần ghi thu nào, kể cả cọc** | `brochure-payment-repository.ts:93` |
| `BROWSING` | Khai báo, hiển thị, **không nơi nào ghi** | D |

Thu hồi/hết hạn là cột riêng (`revoked_at`, `expires_at`), không phải trạng thái.

**6.2 Đơn (dùng chung bảng `orders`)** — Thẻ chào chỉ dùng: `status` `DRAFT → CONFIRMED` (thu lần đầu) `→ COMPLETED` (ảnh người nhận), `→ CANCELLED` (khi chưa giao xong); `production_status` `WAITING → ARRANGING → READY`; `delivery_status` `PENDING → DELIVERING → DELIVERED`. Giá trị enum không bao giờ được Thẻ chào ghi: `PROCESSING`, `DELIVERED`(status), `ASSIGNED`, `QUALITY_CHECK`, `DISPATCHED`, `FAILED`. Mã còn so `production_status === "DONE"` — giá trị **không có trong enum** (`get-tracking-pipeline.ts:51`, `coordinator-progress.ts`). Hoàn tiền không đổi trạng thái đơn.

**6.3 Quy trình 9 bước (suy ra, không lưu)** — `get-tracking-pipeline.ts`: giao xong → B9; đang giao → B8; `READY` → B7; `ARRANGING` → B6; `CONFIRMED` hoặc thu đủ → B5; khách báo CK hoặc đã thu một phần → B4; còn lại → B3 (đổi tên "Đã đặt đơn — chờ khách chuyển khoản"). Link: báo CK → B4; có đơn → B3; mở/chọn → B2; chưa mở → B1. Hệ quả: đơn đã **cọc** (`CONFIRMED`) nhảy thẳng B5 "Xác nhận tiền".

**6.4 Khác** — giao dịch ngân hàng `RECEIVED → MATCHED | UNMATCHED | IGNORED` (`UNMATCHED → IGNORED` khi xử lý tay); thông báo `SENDING → SENT | FAILED | SKIPPED` (`FAILED → SENDING` khi mốc được kích hoạt lại); yêu cầu giảm giá (trong `payload`) `PENDING → APPROVED | REJECTED`.

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

**7.2 Cấu hình trong `organizations.settings`** (Json, hợp nhất nông theo khoá qua `PATCH /organizations/current`, F2): `brochure_payment`, `brochure_policy`, `brochure_shipping`, `brochure_step_sla`, `brochure_visibility`, `brochure_discount`, `brochure_default_owner`, `greetingCardDisplay`.

**7.3 Phân tầng** — đúng quy ước: `domain/` (25 tệp thuần), `infra/` (14 repository, Prisma), `adapters/` (ZNS, eSMS, VietQR), `use-cases/` (33), `contracts/` (zod công khai, phân trang). Lược đồ chỉ đẩy bằng `prisma db push`, không có migration (nợ #173a/#143).

## 8. UI/UX Behavior

- **Trang `/the-chao`** (`page.tsx`): 2 chế độ "Gửi nhanh" (mặc định) / "Quản lý"; 5 tab **luôn hiện cho mọi người có R1** (`page.tsx:68`), không ẩn theo quyền — tab thiếu quyền sẽ hiện lỗi API. Nút đầu trang: Hộp việc · Chế độ · Làm mới.
- **Tầng gọi API**: SWR (`greeting-api.ts`), làm mới khi quay lại tab; danh sách phân trang con trỏ + "Tải thêm"; lỗi đọc `error.details` tiếng Việt (`api-error.ts`).
- **Làm mới định kỳ**: Hộp việc 20s, trao đổi 15s, Theo dõi tiến độ 30s, danh sách việc 60s; trang khách: thanh toán (đến khi đủ), theo dõi 15s.
- **Trang khách**: thanh liên hệ tiệm, 20 giao diện (`templates/greeting-template-renderer.tsx`), bước xem lại trước khi gửi, sao chép STK/số tiền/nội dung, đồng hồ giữ đơn, thông báo quyền riêng tư, nút đặt thêm đơn, trang "link không còn hiệu lực" có liên hệ tiệm.
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
| Bị phụ thuộc | Đơn Thẻ chào nằm chung bảng `orders` — `OrderRepository.list` không lọc `source` (`src/modules/orders/infra/order-repository.ts:187`) nên đơn có thể xuất hiện/bị thao tác ở module Đơn hàng | tương tác chéo: **U** |

## 10. Permissions & Security

**10.1 Xác thực** — route nội bộ: `requireTenantContext()` (tổ chức chỉ lấy từ phiên). Route công khai: tổ chức suy từ mã gửi / id bộ sưu tập / mã link / băm khoá webhook.

**10.2 Năng lực** (`domain/greeting-card-capabilities.ts`; vai mặc định theo `core/rbac/capability-catalog.ts`)

| Thao tác | Mã | Vai mặc định có mã |
|---|---|---|
| Xem bộ sưu tập, ảnh ghép | L1 | dieu_hanh, dieu_phoi, sale, product_manager, marketing, crm |
| Tạo/sửa bộ sưu tập, link, gửi tin, xin giảm | R2 | dieu_hanh, dieu_phoi, sale |
| Xem đơn, theo dõi, hộp việc, tin, thống kê, tích hợp (đọc) | R1 | + crm, customer_service |
| Ghi thu, báo giá, xem/xử lý giao dịch không khớp | R9 | dieu_hanh, dieu_phoi, **sale** |
| Phân công thợ · ảnh thành phẩm · giao ship/ảnh người nhận | R4 · R3 · R5 | dieu_hanh, dieu_phoi |
| Huỷ · hoàn tiền (trần cứng) | R6 · R10 | dieu_hanh |
| Cấu hình tích hợp, quyền xem sale, duyệt giảm giá | F2 | dieu_hanh |
| Cài đặt chính sách/khu vực/tài khoản (`PATCH /organizations/current`) | F2 | dieu_hanh |
| `GET/PUT /greeting-card/display-settings` | **không gác** (nợ #170, có trong danh sách khoá `route-capability-guard.test.ts:45`) | mọi thành viên |

**10.3 Cơ chế bảo mật đã có** — giá chỉ tính ở server; sản phẩm/ảnh/asset phải cùng tiệm (404 nếu khác); cross-tenant trả 404; trang khách không trả SĐT khách/id tổ chức/id sale; mã gửi & mã đơn ngẫu nhiên; giới hạn tần suất mọi route công khai (10–120 lần/phút hoặc /10 phút/IP); khoá webhook chỉ lưu băm; credentials ZNS/eSMS mã hoá, không đọc ngược; khoá lạc quan cho thu/hoàn/báo giá/huỷ/duyệt giảm; audit cho thu, hoàn, báo giá, huỷ, duyệt/từ chối giảm giá; khách hiển thị IP băm trong khoá giới hạn, phễu kênh dùng mã khách băm.

**10.4 Rủi ro/khoảng hở hiện có (quan sát, chưa đánh giá)**
1. `GET /greeting-card/stats` và `/stats/channels` không áp `resolveSaleScope` — sale chế độ OWN vẫn thấy phễu + doanh thu mọi sale (`use-cases/get-sales-funnel.ts:8`).
2. Thao tác tiền (`confirm-payment`, `quote`, `payment-events`) không áp phạm vi sale; sale mặc định có R9 (`capability-catalog.ts:223`) → ghi thu/báo giá được đơn của sale khác; Screen Contract mô tả việc này là của Điều hành.
3. Trang theo dõi công khai theo mã đơn trả `deliveryAddress.street` (địa chỉ đầy đủ), tên người nhận, lời nhắn thiệp, ảnh (`get-brochure-tracking.ts:55-57`); chú thích trong mã nói "địa chỉ đã rút gọn". Ai có mã đơn (cũng là nội dung chuyển khoản) đều xem được.
4. `GET /organizations/current` (F1, có ở vai sale/điều phối) được các tab Thẻ chào gọi để đọc `settings` → trả toàn bộ cài đặt tổ chức (gồm tài khoản nhận tiền) cho client.
5. Webhook SePay không đối chiếu `accountNumber` với tài khoản cấu hình; khoá API hợp lệ là đủ để ghi thu theo mã đơn.
6. Hoạt động xưởng (phân công, ảnh, giao, hoàn tất) chỉ ghi `order_events`, **không** ghi `audit_logs`; người thao tác webhook ghi `system:sepay`.
7. Độ dài video chỉ kiểm phía trình duyệt.

## 11. Error Handling & Edge Cases

- Lỗi chuẩn qua `handle()`/`AppError` (400 theo trường, 401 webhook, 404, 409, 422, 429). Thông báo tiếng Việt.
- **Đã xử lý**: gửi đơn 2 lần (idempotent theo phiên); 2 người thu tiền cùng lúc / webhook gửi lại; xử lý dở ở `RECEIVED` được làm tiếp; mã giảm giá dùng đồng thời (409); trùng mã khách `KH-xxxx` (đuôi ngẫu nhiên); mã gửi cũ trùng giữa 2 tiệm (404); lỗi gửi thông báo không làm hỏng thao tác chính; lỗi ghi sự kiện ORDER không làm hỏng đơn; ảnh ghép bỏ qua ảnh hỏng/WEBP; thu hồi link đã thu hồi (idempotent), link đã có đơn (409).
- **Chưa xử lý / hành vi đáng chú ý**:
  - Khách đã **cọc**: phiên thành `COMPLETED` → mở lại link vào thẳng màn Theo dõi (`brochure-customer-experience.tsx:40`), không còn QR phần còn lại; trang theo dõi chỉ ghi "Chờ xác nhận chuyển khoản".
  - Đơn chờ báo giá: tiệm báo giá xong **không có thông báo** cho khách (không có mốc thông báo tương ứng); đồng hồ giữ đơn tính từ lúc tạo đơn nên có thể đã hết khi QR mới xuất hiện.
  - Đặt từ link chung không idempotent (bấm lại = đơn trùng).
  - Thông báo kẹt `SENDING` nếu tiến trình tắt giữa lúc gửi; `FAILED` chỉ gửi lại khi chính mốc đó được kích hoạt lại (nợ #173b).
  - Hoàn tiền toàn bộ không đổi trạng thái đơn; hoàn tiền không kiểm đơn đã huỷ hay chưa.
  - Chuyển khoản thừa: chỉ ghi chú "cần hoàn", không có tác vụ theo dõi riêng.
  - Huỷ đơn không tự hoàn tiền (thiết kế: hoàn bằng thao tác R10 riêng).
  - Máy quét xem trước (Zalo/Facebook) mở `/b/<mã>` → link bị đánh dấu "khách đã mở" (chỉ `/s/` tránh được).

## 12. Performance & Scalability

| Điểm | Hiện trạng | Bằng chứng |
|---|---|---|
| Bảng theo dõi & Hộp việc | Mỗi lần gọi đọc tối đa **100 đơn** (kèm toàn bộ items, payments, events, qc_records, sessions+events) + **50 link**, tính lại toàn bộ trong bộ nhớ; đơn/link ngoài cửa sổ này **không xuất hiện** và không sinh việc | `infra/tracking-pipeline-repository.ts:33,46` |
| Tần suất | Hộp việc gọi lại pipeline mỗi 20s/người dùng đang mở trang; theo dõi 30s; danh sách việc 60s; trao đổi 15s | `inbox/use-inbox.ts:17` |
| Danh sách link bộ sưu tập | Đọc tới 10.000 sự kiện `SHARE_OPEN` 30 ngày rồi đếm trong bộ nhớ | `share-link-repository.ts:70` |
| Phễu | `groupBy` ở DB cho phiên; đơn đã thu tối đa 10.000; phễu kênh `groupBy` tới 50.000 nhóm | `greeting-stats-repository.ts`, `catalog-event-repository.ts` |
| Quyền xem sale | N+1: mỗi thành viên 3 truy vấn (vai, năng lực, user) | `use-cases/sale-visibility.ts:29` |
| Trang khách | Mỗi lần tải ký URL cho toàn bộ ảnh của bộ sưu tập; trang `/b` gọi use-case 2 lần (metadata + trang) | `src/app/b/[sendCode]/page.tsx` |
| Giới hạn tần suất | Redis nếu có `REDIS_URL`, không thì bộ nhớ từng instance | `core/http/rate-limit.ts:73` |
| Việc nền | Promise trong tiến trình Node (không hàng đợi, không worker) | `core/runtime/background.ts:12` |
| Danh sách khác | Phân trang con trỏ 1–100 (`contracts/list-query.ts`); tin nhắn ≤ 500/đơn, hộp thư ≤ 300 tin/30 ngày | |

## 13. Current Limitations

1. Chỉ một cổng đối soát (SePay); không Casso/ngân hàng khác (nợ #173d).
2. Không hàng đợi bền cho thông báo; không bộ lập lịch nhắc/tự huỷ khi quá hạn giữ đơn (nợ #173b, #178-10b).
3. Chưa có hướng dẫn đăng ký mẫu ZNS (nợ #173c); không thông báo nhân viên ngoài Hộp việc (Screen Contract §14).
4. Không migration cho 11 bảng (nợ #173a/#143); ràng buộc duy nhất của mã gửi vẫn theo tổ chức (nợ #173e).
5. Một đơn = một mẫu (một `order_items`); không giỏ nhiều mẫu, không quà kèm (nợ #178-8).
6. Không điền sẵn tên/SĐT khách trên link riêng (nợ #176); không lưu "đã thích", không nhiều ảnh/mẫu, không AI gợi ý lời chúc, không nhắc dịp năm sau (nợ #177).
7. Đề xuất UX còn treo: huy hiệu cam kết, lọc dịp/giá, "tôi là người nhận"/giấu tên, deeplink ngân hàng, biên nhận, đánh giá sau giao, "đặt lại mẫu này", ghi bước khách bỏ dở (nợ #178).
8. Không đa ngôn ngữ/đa tiền tệ (chỉ VNĐ, SĐT Việt Nam, giờ UTC+7 cố định).
9. Không xuất dữ liệu (CSV) ngoài bảng báo cáo trên màn hình; không SLA theo khung giờ làm việc (đồng hồ chạy 24/7).
10. Pipeline/hộp việc giới hạn 100 đơn + 50 link gần nhất (§12).
11. Cờ `GREETING_CARD_ENABLED` không có tác dụng — không tắt được tính năng theo môi trường.

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
| CRUD bộ sưu tập, gắn sản phẩm cùng tiệm | I | tenant `greeting-card.test.ts`, `hardening` |
| Giao diện khách 20 mẫu + bật/tắt trường hiển thị | I | unit `greeting-templates.test.tsx`, `display-fields.test.ts` |
| Ảnh ghép xem trước (OG) | I | `catalog-collage.test.ts` |
| Link riêng: tạo, hạn dùng, thu hồi, mốc sao chép | I | tenant `hardening`, `share-links` |
| Link `/s/` mang tên người sao chép | I | tenant `greeting-card-share-links.test.ts` |
| Link chung `/g`, `/bst` + phễu kênh | I | tenant `greeting-catalog-products-events.test.ts` |
| Chọn mẫu, báo giá, đặt đơn, idempotent (link riêng) | I | tenant `checkout`, `quote`, `hardening` |
| Đặt đơn link chung idempotent | M | §11 |
| Size, số lượng, khu vực, miễn phí giao, mã giảm giá | I | tenant `checkout` |
| Giờ chốt/giờ chuẩn bị | I | `delivery-schedule.ts` (unit qua `customer-journey-upgrades.test.ts`) |
| Mẫu chưa giá → báo giá sau | I | tenant `quote` |
| Cọc %, chặn xưởng, giữ đơn có đếm ngược | P | tenant `payments`; giữ đơn chỉ hiển thị, không tự nhắc/huỷ |
| QR thanh toán phần còn lại sau cọc trên trang khách | P | §11 — không hiện sau khi phiên `COMPLETED` |
| Xác nhận thu, hoàn, huỷ, audit | I | tenant `hardening`, `payments` |
| Đối soát SePay | P | tenant `bank-sync`; chỉ một nhà cung cấp |
| Thứ tự xưởng + ảnh/video | I | tenant `reorder-photos`, `hardening` |
| Quy trình 9 bước + thời gian chuẩn + kẹt | I | unit `step-sla-visibility`, `tracking-pipeline`, `worklist` |
| Hộp việc, tin nhắn, đã đọc | I | tenant `messages` |
| Xin/duyệt giảm giá | I | tenant `messages` |
| Quyền xem sale OWN | P | áp cho đơn/link/tin/theo dõi; không áp thống kê & thao tác tiền |
| Thông báo khách ZNS/eSMS | P | tenant `notifications`; không hàng đợi bền |
| Thông báo khi báo giá xong | M | không có `NotifyEvent` tương ứng |
| Thông báo đẩy cho nhân viên | M | Screen Contract §14 |
| Phễu theo sale | I | tenant `hardening` (cách ly tổ chức) |
| Đặt thêm đơn từ link đã có đơn | I | tenant `reorder-photos` |
| Ẩn tab theo quyền trên `/the-chao` | M | Screen Contract §2 nói có; `page.tsx:68` hiện cả 5 tab |
| Gác năng lực `display-settings` | M | nợ #170 |
| Cờ `GREETING_CARD_ENABLED` | D | `feature-flags.ts:14` không ai gọi |
| `GreetingNotificationRepository.listForOrder`, `BrochureOrderRepository.assetBelongsToTenant` | D | không nơi gọi |
| Sự kiện `SWIPE_NEXT/PREV`, `OPEN_ORDER_FORM`, `TRACK_VIEW`, `INTERNAL_NOTE`; trạng thái phiên `BROWSING`; nhánh `production_status "DONE"` | D | khai báo/so sánh nhưng không ghi |
| `VALID_SESSION_TRANSITIONS` | P | chỉ dùng ở `select-brochure-product.ts` |
| Tương tác đơn Thẻ chào trong module Đơn hàng/Điều phối chung | U | §9, §17 |
| E2E `brochure-swipe.spec.ts` | U | không chạy trong lượt soát |

## 16. Evidence / Code References

**16.1 Điểm vào chính** — trang: `src/app/(app)/the-chao/page.tsx`, `src/app/b/[sendCode]/page.tsx`, `src/app/s/[code]/page.tsx`, `src/app/s/[code]/mo/route.ts:19`, `src/app/g/[id]/page.tsx`, `src/app/bst/[orgSlug]/[catalogCode]/page.tsx` · API nội bộ: `src/app/api/v1/greeting-card/**` (44 handler, 34 tệp) · API công khai: `src/app/api/v1/public/brochure/**`, `public/greeting-catalog/**`, `public/payments/sepay/route.ts` · Use-case lõi: `place-brochure-order.ts`, `submit-brochure-order.ts:33`, `submit-public-catalog-order.ts:34`, `confirm-brochure-payment.ts:15,36,86`, `update-brochure-order-status.ts`, `payment-webhook.ts:50`, `get-tracking-pipeline.ts:77`, `get-inbox.ts`, `internal-messages.ts`, `discount-requests.ts`, `share-links.ts:37`, `notify-customer.ts:30` · Repository lõi: `brochure-checkout-repository.ts:99`, `brochure-payment-repository.ts:40,128`, `brochure-order-repository.ts:106`, `discount-repository.ts:43`, `greeting-card-repository.ts:19,123`.

**16.2 Kiểm chứng đã chạy (06/10/2026, lượt soát này)**
- `npm test -- src/modules/greeting-card tests/unit/greeting-card src/components/greeting-card` → **26 tệp, 160 ca, xanh**.
- Tenant trên Postgres 16 cục bộ, DB `floraos_test` (lược đồ `prisma db push` vào DB rỗng, bí mật ngẫu nhiên chỉ cho phiên test): 11 tệp `tests/tenant/greeting-*.test.ts` → **58 ca, xanh**.
- Không chạy: E2E Playwright, `typecheck`, `lint`, `build` (tài liệu này không đổi mã).

**16.3 Mã ↔ tài liệu lệch nhau**

| Tài liệu nói | Mã thực tế |
|---|---|
| Đặc tả 06 §25.2 (`06-api-specification.md:809`): mọi `/greeting-card/*` "chưa gác", `send_code` "tuần tự theo prefix", `confirm-payment {reference?, note?}`, `product-photo {assetId}` | Đã gác L1/R1–R6/R9/R10/F2 (trừ `display-settings`); mã ngẫu nhiên; `confirm-payment` nhận cả `amountVnd`; ảnh nhận `assetIds[]`. §23b (`:738`) và nợ #170 đúng; §25.2 là bảng cũ chưa xoá |
| Đặc tả 07 §28 (`07-database-specification.md:2160`): "Bảy bảng" | 11 bảng `greeting_*` |
| Đặc tả 07 §28 (`:2174`) + chú thích schema: `greeting_journey_events` chứa `INTERNAL_NOTE` | Ghi chú kiểu cũ đã bỏ 06/10 (chính §28 dòng trên cũng nói vậy); không nơi nào ghi `INTERNAL_NOTE` |
| Screen Contract §2: "không quyền ☑ (API 403, tab ẩn theo quyền máy chủ kiểm)" | 5 tab luôn hiện (`page.tsx:68`) |
| Screen Contract §4: Điều hành duyệt tiền; quy trình gán bước 4 cho Điều hành | R9 có ở vai sale và điều phối; route chỉ kiểm R9 |
| `get-brochure-tracking.ts:9` chú thích "địa chỉ đã rút gọn (không SĐT)" | Trả nguyên `street` (địa chỉ đầy đủ đã ghép) |
| `catalog-product-price.ts:18` "dùng chung … để cùng một mẫu luôn hiện cùng một giá" | Khung xem trước nội bộ dùng `resolveCatalogProductPrice` (chỉ `attributes.price`, thiếu → 0); trang khách dùng `resolveProductPriceVnd` (thêm `price_vnd`, thiếu → `null`) — có thể lệch giá giữa xem trước và trang khách |
| Chú thích repository nói route `/g/[orgSlug]/[catalogCode]` | Route thật là `/bst/[orgSlug]/[catalogCode]` |
| Chú thích `greeting_catalog_events` trong schema | Bị đặt lệch phía trên `greeting_share_links` (`schema.prisma` ~2749) |

## 17. Open Questions & Unclear Areas

1. Đơn `source = BROCHURE` khi bị sửa qua module Đơn hàng/Điều phối chung (Kanban `/don-hang`, `/dieu-phoi` tower) — luật thứ tự xưởng, chính sách tiền, thông báo khách có còn được áp không? Chưa soát module đó.
2. Ý đồ phân quyền thu tiền: sale (R9 mặc định) được phép xác nhận tiền/báo giá đơn Thẻ chào hay chỉ Điều hành? Tài liệu (Screen Contract, quy trình) và catalog năng lực (ĐP-4a: "Sales ghi DEPOSIT lúc nhận đơn") nói khác nhau.
3. Chế độ OWN có cần áp cho phễu/doanh thu theo sale không — không có tài liệu nói rõ.
4. Mức công khai mong muốn của trang theo dõi theo mã đơn (địa chỉ, lời nhắn thiệp, ảnh người nhận).
5. Hành vi mong muốn sau khi cọc: phiên chuyển `COMPLETED` ngay là cố ý hay sót?
6. Hành vi E2E thực tế (`tests/e2e/brochure-swipe.spec.ts`, 8 bước) — chưa chạy; có còn khớp UI hiện tại không.
7. Số liệu vận hành thật (số tiệm dùng, số đơn, tỷ lệ chuyển đổi) — không có trong repo; giá trị kinh doanh ở §14 chỉ theo ý đồ.
8. Có tiệm nào đang dùng ZNS thật và mẫu ZNS đã duyệt chưa — không có bằng chứng.
9. `crm`/`customer_service` có R1 → vào được `/the-chao`, hộp việc coi họ như Sale (nhận tin gửi vai Sale) — có chủ đích không.
10. Ranh giới với "Catalog & QR" (`/catalog`, `catalog_links`, M06) — hai cơ chế bộ sưu tập công khai song song; chưa có tài liệu chốt quan hệ.
