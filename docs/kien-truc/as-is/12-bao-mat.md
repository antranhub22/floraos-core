# 12. Security & Access Control — As-Is

Chỉ mô tả cơ chế đang có trong mã. Không đánh giá tốt/xấu.

## 12.1 Authentication

| Cơ chế | Chi tiết | Bằng chứng |
|---|---|---|
| Mật khẩu | `bcryptjs`, cost 12; tối thiểu 10 ký tự; email chuẩn hoá chữ thường; sai email và sai mật khẩu cùng một thông báo | `src/modules/organization/infra/password-hasher.ts:4`, `domain/credentials.ts`, `use-cases/log-in.ts` |
| Phiên | Token 32 byte ngẫu nhiên (base64url) gửi trong cookie `floraos_session`; CSDL chỉ giữ `HMAC-SHA256(SESSION_SECRET, token)`; hạn 30 ngày; mỗi lần đăng nhập thu hồi mọi phiên còn sống của tài khoản (một phiên/tài khoản) | `infra/session-token.ts`, `domain/session-policy.ts`, `use-cases/log-in.ts` |
| Cookie | `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` khi `NODE_ENV=production`, host-only | `src/core/http/cookies.ts` |
| Kiểm phiên mỗi request | `resolveSession`: tra `sessions` theo hash → kiểm hạn/thu hồi → tra user → kiểm lại membership `ACTIVE` → dựng `TenantContext` (kèm 3 lớp quyền) | `src/modules/organization/use-cases/resolve-session.ts` |
| Phiên bị thay | Phân biệt `SESSION_SUPERSEDED` với hết hạn; giao diện chuyển `/dang-nhap?ly-do=thiet-bi-khac` | `resolve-session.ts`, `src/app/(app)/layout.tsx` |
| JWT liên-app | HS256 tự viết (không thư viện), khoá `SSO_SESSION_SECRET`, hạn 15 phút, claim `sub/org/email/iat/exp` (không mang quyền) | `src/modules/sso/infra/sso-jwt.ts`, `domain/sso-claims.ts` |
| Token máy-máy | Token ngẫu nhiên, CSDL giữ `HMAC-SHA256(INTEGRATION_TOKEN_SECRET, token)`; có hạn, thu hồi, xoay song song | `src/modules/integration/infra/token-crypto.ts` |
| Khoá webhook SePay | Khoá `brk_…` sinh ngẫu nhiên, hiện một lần; CSDL giữ SHA-256 + 4 ký tự gợi nhớ | `src/modules/greeting-card/use-cases/payment-webhook.ts` |
| Chủ phiên Thẻ chào | Cookie giá trị `HMAC-SHA256(SESSION_SECRET, "brochure-owner:<sendCode>")`, 30 ngày | `src/modules/greeting-card/infra/session-owner-token.ts`, `src/app/s/[code]/mo/route.ts` |
| Tra cứu đơn của khách | Mã đơn + 4 số cuối SĐT; kết quả che tên, chỉ hiện khu vực địa chỉ | `src/modules/greeting-card/domain/tracking-privacy.ts` |
| Không có | Quên mật khẩu tự phục vụ, xác minh email, MFA, khoá tài khoản sau nhiều lần sai, rate limit đăng nhập/đăng ký | Không tìm thấy mã; trang đăng nhập ghi "liên hệ quản trị" |

## 12.2 Authorization

- Tổ chức: mã năng lực 3 lớp (mặc định vai → ghi đè tổ chức → trần cứng), kiểm bằng `requireCapability` ở route/use-case; xem [02](02-vai-tro-va-quyen.md).
- Nền tảng: `PlatformContext` tách kiểu khỏi `TenantContext`; mã `N*`; người không phải operator → 403.
- Tích hợp: token (phạm vi theo `client`) hoặc SSO (năng lực thật trừ `L5`).
- Cách ly tổ chức: `organization_id` chỉ lấy từ phiên/token/JWT; `scopedWhere`/`scopedData` cấm tự khai; bản ghi tổ chức khác → 404. Duy nhất `POST /session/organization` nhận id tổ chức từ client và đối chiếu `memberships`.
- Route không gác mã năng lực được liệt kê có lý do trong `tests/unit/architecture/route-capability-guard.test.ts` (`NO_CAPABILITY_GUARD`, 19 mục, trong đó 3 mục ghi "nợ #170").
- Giao diện ẩn/hiện theo `can(code)`; 1 mã (`C23`) chỉ được kiểm ở giao diện.

## 12.3 Bí mật & cấu hình

| Bí mật | Dùng cho | Nơi đọc |
|---|---|---|
| `SESSION_SECRET` (≥ 16 ký tự, bắt buộc) | HMAC token phiên, chữ ký URL kho tệp, cookie chủ phiên Thẻ chào | `src/lib/env.ts`, `session-token.ts`, `assets/infra/storage-signing.ts`, `session-owner-token.ts` |
| `INTEGRATION_TOKEN_SECRET` (bắt buộc) | HMAC token tích hợp; khoá gốc HKDF-SHA256 cho mã hoá AES-256-GCM cấu hình thông báo | `token-crypto.ts`, `src/core/security/secret-box.ts` |
| `SSO_SESSION_SECRET` (bắt buộc) | Ký/xác minh JWT SSO | `sso-jwt.ts` |
| Khoá nhà cung cấp | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `ELEVENLABS_API_KEY`, `FAL_KEY`, `REPLICATE_API_TOKEN`, `PHOTOROOM_API_KEY`, `STABILITY_API_KEY`, `RUNWAYML_API_SECRET`, `SERPAPI_API_KEY`, `MINIMAX_*`, `DIFY_API_KEY`, `HEYGEN_API_KEY`, `GOOGLE_VEO_API_KEY` | `process.env` ở core và worker; `render.yaml` khai `sync: false` |
| Token kênh chat | FB page token, Zalo OA token/secret | Lưu trong cột JSON `chat_channel_integrations.config` (không thấy mã hoá ở repository) |
| Cấu hình thông báo khách | Khoá Zalo ZNS / eSMS | Mã hoá AES-256-GCM trong `greeting_integrations.notify_config_encrypted` |

`src/lib/env.ts` kiểm bằng `zod` lúc khởi động: thiếu biến bắt buộc → tiến trình không lên. Một số biến được đọc trực tiếp `process.env` ngoài schema (`DIFY_*`, `OLLAMA_URL`, `MINIMAX_*`, `FB_WEBHOOK_VERIFY_TOKEN`, `STORAGE_REGION`, `GREETING_CARD_SWEEP`, `NEXT_PUBLIC_*`).

## 12.4 Input validation

- Body/query xác thực bằng `zod` ở route handler (giới hạn độ dài, regex SĐT, enum). Trường khách nhập ở Thẻ chào có trần độ dài (`ORDER_FIELD_MAX`) và kiểm ngày giao.
- Đường dẫn lưu trữ do máy chủ sinh (`org/<org>/<product>/<asset>.<ext>`), client không chọn.
- Proxy: danh sách trắng tiền tố đường dẫn theo client, chặn `.`/`..` (`src/modules/proxy/domain/proxy-rules.ts`).
- Asset tham chiếu trong thao tác (ảnh QC, POD, ảnh xưởng) phải thuộc tổ chức (`ensureAssetsOwned`, `ownedAssetsMeta`); giới hạn 1–5 ảnh + 0–2 video cho tác vụ xưởng Thẻ chào.
- Kiểm từ cấm cho nội dung sinh (`flower-content-guard.ts`).

## 12.5 Các kiểm soát khác

| Kiểm soát | Chi tiết | Bằng chứng |
|---|---|---|
| Rate limit endpoint công khai | Cửa sổ cố định, Redis `INCR`+`PEXPIRE` hoặc Map trong bộ nhớ; IP lấy từ `x-forwarded-for` theo số proxy tin cậy (`RATE_LIMIT_TRUSTED_PROXY_HOPS`). 18 phạm vi, ví dụ: `brochure-order` 10/10 phút, `brochure-open` 30/phút, `brochure-tracking` 60/phút, `greeting-share-open` 30/10 phút, `sepay-webhook` 600/phút, `csp-report` 60/phút | `src/core/http/rate-limit.ts`, các route `public/*` |
| Trần tần suất tạo job | Mặc định 60 job / 60 giây / tổ chức, đếm ở CSDL | `src/modules/jobs/domain/rate-limit.ts`, `enqueue-job.ts` |
| Idempotency | `Idempotency-Key` bắt buộc khi tạo job; khoá duy nhất `(organization_id, feature, idempotency_key)`; webhook SePay theo `external_id`; thông báo theo `(order, event_key)` | `enqueue-job.ts`, `schema.prisma` |
| Header bảo mật | `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `Content-Security-Policy-Report-Only` (chỉ ghi nhận, báo về `/api/v1/public/csp-report`); tắt `X-Powered-By` | `next.config.ts` |
| Lỗi không lộ chi tiết | Lỗi ngoài `AppError` → 500 `{code: "INTERNAL", message: "Lỗi hệ thống"}` | `src/core/http/response.ts` |
| Nhật ký không ghi dữ liệu nhạy cảm | `log()` bỏ các khoá `password`, `secret`, `token`, `apiKey`, `authorization`, `cookie`, `phone`, `address`… | `src/core/observability/log.ts` |
| Ngưỡng riêng tư AI | `ai_capabilities.privacy_floor` + `ai_policies.privacy_floor`; bộ định tuyến không chọn mô hình dưới sàn; mô hình cần đủ 4 ô giấy phép | `src/core/ai/domain/routing.ts`, `privacy.ts` |
| Cam kết nhân bản giọng / giấy phép nhạc | Lưu `consent_text`, `consented_by/at`; `license_type/source`, `attested_by/at` | `schema.prisma` (`voice_clones`, `music_tracks`) |
| Guard hook phát triển | `.claude/hooks/guard-bash.mjs` chặn `vitest run` trần và hỏi trước lệnh Prisma ghi vào DB không cục bộ (công cụ cho agent, không phải runtime) | `.claude/settings.json` |
| CSRF | Không có token CSRF riêng; dựa vào `SameSite=Lax` và API JSON cùng origin | `src/core/http/cookies.ts` |
| Webhook chat | Facebook GET kiểm `hub.verify_token` (giá trị mặc định cứng khi thiếu env); POST Facebook và Zalo không kiểm chữ ký | `src/app/api/v1/chat/webhooks/*/route.ts` |
