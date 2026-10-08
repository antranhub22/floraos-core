# Thẻ chào mẫu hoa — Báo cáo khắc phục đợt commercial-ready (06/10/2026)

**Đầu vào:** 18 hạng mục P0/P1 rút từ bản audit [`HIEN_TRANG_THE_CHAO.md`](HIEN_TRANG_THE_CHAO.md). **Nhánh:** `claude/sweet-fermat-ovs11r`.
**PO chốt trước khi làm (06/10/2026):** (1) ~~giữ `R9` cho Sale/Điều phối nhưng áp phạm vi "chỉ khách của mình" cho thao tác tiền~~ — **ĐÃ THAY bởi quyết định PO 08/10/2026: chỉ Điều hành xác nhận tiền/báo giá (`R11`, trần cứng), xem [`KE_HOACH_THE_CHAO_LE_20_10.md`](KE_HOACH_THE_CHAO_LE_20_10.md) Q4**; (2) sale "chỉ khách của mình" chỉ thấy số liệu của mình; (3) trang theo dõi công khai rút gọn + xác minh 4 số cuối SĐT; (4) không đổi hạ tầng (không sửa `render.yaml`, không sửa `schema.prisma`).

## 1. Kết quả theo hạng mục

| # | Vấn đề (audit) | Đã làm | Bằng chứng mã | Test |
|---|---|---|---|---|
| 1 | Sale `R9` thao tác tiền đơn của sale khác | `assertOrderInScope` cho xác nhận thu, báo giá, huỷ, hoàn; tiền chưa khớp ẩn với sale OWN | `use-cases/order-scope.ts`, `confirm-brochure-payment.ts`, `payment-webhook.ts` | tenant `greeting-card-scope` |
| 2 | Cọc xong mất QR phần còn lại | Phiên chỉ `COMPLETED` khi thu đủ; trang khách theo số tiền thật; màn thanh toán báo "đã nhận cọc" + xem QR phần còn lại; khách báo chuyển phần còn lại được ghi lại | `infra/brochure-payment-repository.ts`, `customer/brochure-customer-experience.tsx`, `customer/brochure-payment-view.tsx` | tenant `greeting-card-storefront` |
| 3 | Lộ địa chỉ/lời nhắn qua mã đơn | Mặc định rút gọn (tên viết tắt, phường + tỉnh, không lời nhắn, không ảnh người nhận); đầy đủ khi mở từ link của khách hoặc đúng 4 số cuối SĐT (5 lần/15 phút) | `domain/tracking-privacy.ts`, `use-cases/get-brochure-tracking.ts`, route `public/brochure/tracking/[code]`, `customer/tracking-verify-form.tsx` | tenant `storefront`, E2E 6b |
| 4 | Pipeline cắt 100 đơn + 50 link | Đọc mọi đơn còn việc + hoàn tất 7 ngày + link còn hạn 30 ngày, chỉ cột cần; trần 2000 có log cảnh báo | `infra/tracking-pipeline-repository.ts` | tenant `scope` (150 đơn mới hơn) |
| 5 | Đơn trùng ở link chung | Cùng SĐT + mẫu + người nhận + ngày giao trong 10 phút → trả lại đơn cũ | `domain/order-guard.ts`, `use-cases/submit-public-catalog-order.ts` | tenant `storefront` |
| 6 | Thông báo không bền; báo giá không báo khách | Bộ quét nền mỗi phút: `SENDING` > 5 phút → `FAILED`, gửi lại cách 30 phút trong 6 giờ; mốc mới `QUOTED` | `src/instrumentation.ts`, `use-cases/background-sweep*.ts`, `domain/background-sweep.ts` | unit + tenant `greeting-card-sweep` |
| 7 | Máy quét xem trước tính là khách mở | Dựng trang chỉ đọc; trình duyệt gọi `POST /public/brochure/:sendCode/open` | `use-cases/get-greeting-catalog.ts`, route `[sendCode]/open` | tenant `storefront`, E2E 2a |
| 8 | 11 bảng không có migration | Migration idempotent `20261006120000_greeting_card` (IF NOT EXISTS) | `prisma/migrations/20261006120000_greeting_card/migration.sql` | Postgres 16: áp lên DB đủ bảng không đổi gì; xoá bảng rồi áp → `migrate diff` rỗng |
| 9 | Phễu tính cọc là "đã thu", doanh thu = tổng đơn | `paid` = thu đủ, doanh thu = `paid_vnd`; phễu theo phạm vi xem | `infra/greeting-stats-repository.ts`, `get-sales-funnel.ts`, `catalog-channel-events.ts` | tenant `scope` |
| 10 | Hai hàm giá lệch nhau | Xem trước nội bộ dùng `resolveProductPriceVnd`; chưa giá = `null` | `domain/catalog-product-price.ts` | unit `catalog-product-price` |
| 11 | `display-settings` không gác quyền | GET `L1`, PUT `R2`; bỏ khỏi danh sách miễn gác | route `display-settings`, `route-capability-guard.test.ts` | unit kiến trúc |
| 12 | Không kiểm tồn kho | Ẩn + chặn mẫu `OUT_OF_STOCK` / hết số lượng ở chi nhánh của sản phẩm (cùng luật Master Index) | `domain/product-availability.ts`, `brochure-product-mapper.ts` | unit + tenant `storefront` |
| 13 | Không chống đơn rác | Ô bẫy ẩn `website` + tối đa 5 đơn/giờ/SĐT (không để lại phiên mồ côi) | `contracts/public-order-schema.ts`, `place-brochure-order.ts`, `customer/honeypot-field.tsx` | unit + tenant `storefront` |
| 14 | Tác vụ xưởng không audit | `audit_logs` `greeting_card.order.<sự kiện>` trong cùng giao dịch | `infra/brochure-order-repository.ts` | tenant `scope` |
| 15 | Tab hiện cho mọi người | Tab theo năng lực (`L1`, `R1`, `R2`, `R9`/`F2`, `R3`/`R4`/`R5`) | `src/app/(app)/the-chao/page.tsx` | typecheck, lint:ux |
| 16 | Không nhắc / tự huỷ quá hạn giữ | Hết hạn → `PAYMENT_REMINDER` một lần; tiệm bật `auto_cancel_unpaid` → tự huỷ sau thêm 60 phút nếu khách chưa báo chuyển (audit `system:hold-expiry`) | `domain/background-sweep.ts`, `admin/brochure-policy-settings.tsx` | unit + tenant `sweep` |
| 17 | Tài liệu lệch, thiếu hướng dẫn ZNS | Đặc tả 06 §23b/07 §28, Screen Contract, nợ #170/#173/#178, nợ mới #179, `TRANG_THAI` §8; hướng dẫn mẫu ZNS trong Cài đặt | `admin/zns-template-guide.tsx`, `docs/` | `check:docs` |
| 18 | Chưa chạy E2E; sổ đơn chung lách luật | E2E chạy thật + thêm 2 bước; sổ đơn chung trả 409 cho đơn Thẻ chào (Điều phối vốn không thấy đơn này) | `orders/domain/order-rules.ts` `brochureLockReason`, 3 use-case đơn | E2E 11/11, tenant `scope` |

## 2. Cổng chất lượng (chạy 06/10/2026 trên nhánh)

| Cổng | Kết quả |
|---|---|
| `npm run typecheck` | sạch |
| `npm run lint:ratchet` | đạt — không lỗi mới (46 lỗi cũ, nợ #172) |
| `npm run lint:ux -- --check` | đạt — không tăng (3 vi phạm cũ) |
| `npm test` (có biến môi trường như CI) | 224/224 tệp · 1664/1664 ca |
| `npm run test:tenant` (Postgres 16, `floraos_test`) | 354/356 — 2 ca `product-copies` đỏ **y hệt trên `main`** (gọi AI, lỗi cũ, không thuộc đợt này) |
| Tenant Thẻ chào riêng | 14 tệp, tất cả xanh (3 tệp mới: `scope`, `storefront`, `sweep`) |
| `npx playwright test tests/e2e/brochure-swipe.spec.ts` | 11/11 (DB `floraos_e2e` cục bộ, Chromium có sẵn) |
| `npm run check:docs` | khớp mã |
| `npm run build` + `npm run start` | build xanh; máy chủ lên, route mới trả đúng 404 cho mã rác |

## 3. Còn mở (không thuộc 18 hạng mục hoặc cần PO)

- Nợ #179: cờ `GREETING_CARD_ENABLED` chỉ tắt bộ quét nền; giới hạn xác minh theo IP × mã đơn; chưa captcha; chú thích `schema.prisma` lỗi thời; bộ quét chạy trong tiến trình web.
- Nợ #173d (thêm cổng đối soát ngoài SePay), #173e (ràng buộc duy nhất `send_code` toàn hệ thống), #176–#178 (tính năng giai đoạn sau).
- Chưa kiểm trên production thật: gửi ZNS/eSMS thật, webhook SePay thật, tải nhiều tiệm đồng thời.
