# 1. System Overview — As-Is

## 1.1 Mục đích ứng dụng (suy từ mã)

Ứng dụng web đa tổ chức (multi-tenant) phục vụ cửa hàng hoa và mạng lưới điện hoa tại Việt Nam. Các nhóm việc có mã thực thi:

- Quản lý tổ chức, thành viên, vai, chi nhánh, hồ sơ cửa hàng/thương hiệu.
- Danh mục sản phẩm hoa (Product Master), quy tắc giá, phân tích ảnh sản phẩm bằng AI, sinh dữ liệu bán hàng.
- Xử lý ảnh (tối ưu ảnh, biến thể marketing), video, âm thanh (giọng đọc, nhạc nền, nhân bản giọng).
- Sinh nội dung đăng mạng xã hội, kế hoạch cảnh/gói chiến dịch (Creative Studio).
- Đơn hàng, điều phối sản xuất/giao hàng (Control Tower), sổ thu tiền.
- "Thẻ chào" (Swipe Brochure): bộ sưu tập gửi link cho khách, khách chọn mẫu, đặt hàng, chuyển khoản, theo dõi đơn.
- CRM khách hàng, hội thoại tư vấn có AI, catalog công khai + QR.
- Nghiên cứu xu hướng thị trường.
- Console vận hành nền tảng (xuyên tổ chức) cho người vận hành SaaS.

Bằng chứng: danh sách module `src/modules/*` (29 thư mục), điều hướng `src/components/layout/nav-model.ts`, lược đồ `prisma/schema.prisma`.

## 1.2 Kiến trúc tổng thể

```text
Trình duyệt (nhân viên tiệm)        Trình duyệt (khách cuối, không đăng nhập)
   │  cookie floraos_session            │  /b/[sendCode] /g/[id] /bst/.. /c/[slug] /s/[code]
   ▼                                    ▼
┌───────────────────────── Next.js 16 (một tiến trình web) ─────────────────────────┐
│ App Router: (app) · (auth) · (platform) · trang công khai                          │
│ Route handlers /api/v1/* ──► use-cases (src/modules/*) ──► Prisma 7 ──► Postgres   │
│ AI gateway src/core/ai/gateway.ts (callCapability) ──► OpenAI / Anthropic / Gemini │
│ Proxy /api/v1/proxy/* ──► SocialFlow / LocalBudd (HTTP server-to-server)           │
│ instrumentation.ts ──► bộ quét nền Thẻ chào (setInterval 60s, trong tiến trình)    │
│ Rate limit ──► Redis (hoặc bộ nhớ tiến trình)  ·  Tệp ──► S3-compatible hoặc đĩa   │
└───────────────────────────────┬────────────────────────────────────────────────────┘
                                │ bảng generation_jobs + pg_notify (LISTEN/NOTIFY)
            ┌───────────────────┼─────────────────────────┬──────────────────────────┐
            ▼                   ▼                         ▼                          ▼
   workers/vision        workers/media_ai          media_ai.video.video_worker   MI worker (TypeScript)
   vision.analyze        media.optimize,           video.render                  research_runs +
                         media.variant(.cloud),                                  NOTIFY market_intelligence_research
                         audio.generate,
                         audio.voice_clone, video.render
```

Bằng chứng: `src/modules/jobs/infra/transaction.ts` (pg_notify trong giao dịch), `workers/README.md`, `workers/media_ai/jobs/worker.py:455-480` (các kênh LISTEN), `workers/media_ai/video/video_worker.py:29`, `src/modules/market-intelligence/infra/worker.ts:334-365`, `src/instrumentation.ts`.

## 1.3 Frontend

| Hạng mục | As-is | Bằng chứng |
|---|---|---|
| Framework | Next.js `16.3.4`, React `19.2.8`, App Router, `typedRoutes: true` | `package.json`, `next.config.ts` |
| Nhóm route | `(app)` — cần phiên tổ chức; `(auth)` — đăng nhập/đăng ký; `(platform)` — console vận hành; công khai: `/b`, `/bst`, `/c`, `/g`, `/s`, `/chinh-sach-bao-mat` | `src/app/` |
| Khung | Server Component `(app)/layout.tsx` giải phiên bằng `resolveAppSession`, không có phiên → `redirect("/dang-nhap")` | `src/app/(app)/layout.tsx` |
| Điều hướng | Một nguồn `NAV_ENTRIES` (30 mục, 5 nhóm, cộng mục "Trang chủ") lọc theo mã năng lực; `DesktopNav` + `BottomNav` (mobile) | `src/components/layout/nav-model.ts` |
| Dữ liệu | `fetch`/SWR gọi `/api/v1/*` cùng origin; một số trang Server Component gọi thẳng use-case | `src/lib/api.ts`, `src/app/b/[sendCode]/page.tsx` |
| UI kit | Tailwind CSS 4, Radix (select/separator/tooltip), `@base-ui/react`, `lucide-react`, `class-variance-authority`, `tailwind-merge` | `package.json`, `src/components/ui/` |
| Xuất tệp phía client | `jspdf`, `html-to-image`, `qrcode`, `xlsx` | `package.json` |
| Khoá tính năng | `NEXT_PUBLIC_APP_ENV=production` → 8 tiền tố tuyến hiện màn "Sắp ra mắt" | `src/lib/feature-lock.ts` |
| Middleware Next | Không có tệp `middleware.ts`/`proxy.ts` ở `src/`; kiểm phiên nằm ở layout và từng route handler | `ls src/*.ts` → chỉ `instrumentation.ts` |

## 1.4 Backend

| Hạng mục | As-is | Bằng chứng |
|---|---|---|
| API | 242 tệp `route.ts`: 241 dưới `/api/v1`, 1 là `/api/health` | `src/app/api/` |
| Phân lớp module | `domain/` (luật thuần) · `use-cases/` · `infra/` (Prisma) · `adapters/` (SDK/nhà cung cấp) | `src/modules/*`, `CLAUDE.md` mục Architecture |
| Ngữ cảnh tổ chức | `TenantContext {organizationId, workspaceId, userId, branchId, capabilities}` giải một lần ở biên | `src/core/tenancy/tenant-context.ts`, `src/modules/organization/use-cases/resolve-session.ts` |
| Lỗi HTTP | `AppError` + bảng mã → HTTP status; `handle()` bọc mọi handler | `src/core/http/errors.ts`, `src/core/http/response.ts` |
| Xác thực đầu vào | `zod` ở route handler | ví dụ `src/app/api/v1/public/payments/sepay/route.ts` |
| Việc nền trong tiến trình web | `runInBackground()` (promise không chờ) và bộ quét Thẻ chào mỗi 60 giây | `src/core/runtime/background.ts`, `src/modules/greeting-card/use-cases/background-sweep-scheduler.ts` |

## 1.5 Database

PostgreSQL (Postgres 16 trong CI và `render.yaml`; Docker local dựng ảnh có `pg_cron`). Prisma 7, client sinh ra `src/generated/prisma` (không nằm trong repo). 90 model, 45 enum. Chi tiết ở [10-csdl-va-luong-du-lieu.md](10-csdl-va-luong-du-lieu.md).

## 1.6 APIs

- `/api/v1/*` cho giao diện nội bộ (cookie phiên).
- `/api/v1/platform/*` cho console vận hành (cookie phiên + bản ghi `platform_operators`).
- `/api/v1/integration/*` cho app ngoài (token máy-máy hoặc JWT SSO).
- `/api/v1/public/*` cho khách cuối và webhook nhà cung cấp (không phiên; một phần có rate limit).
- `/api/v1/proxy/[...path]` chuyển tiếp sang SocialFlow/LocalBudd.
Chi tiết ở [09a](09a-api-a-i.md) và [09b](09b-api-j-w.md).

## 1.7 External services (tóm tắt — chi tiết ở [11-tich-hop.md](11-tich-hop.md))

OpenAI, Anthropic, Google Gemini/Imagen/Veo, Stability, fal.ai, Replicate, Photoroom, RunwayML, HeyGen, ElevenLabs, MiniMax, Dify, Ollama (cục bộ), IOPaint (tự dựng), SerpApi, Google Trends, YouTube/TikTok (qua tìm kiếm), Facebook Messenger, Zalo OA, Zalo ZNS, eSMS, SePay, VietQR (ảnh QR), Google Drive (ảnh thu nhỏ), S3-compatible storage, Redis.

## 1.8 Authentication (tóm tắt — chi tiết ở [12-bao-mat.md](12-bao-mat.md))

Email + mật khẩu (bcrypt), cookie phiên `floraos_session` (token ngẫu nhiên, CSDL giữ HMAC, hạn 30 ngày, một phiên/tài khoản), JWT liên-app `floraos_sso` (15 phút), token tích hợp máy-máy, khoá API webhook SePay theo tổ chức.

## 1.9 Deployment / infrastructure (tóm tắt — chi tiết ở [14-cau-hinh-trien-khai.md](14-cau-hinh-trien-khai.md))

`render.yaml` khai: 1 web service Node (`floraos-web`), 3 background worker Python (`media`, `video`, `vision`), 1 Redis (`keyvalue`), 1 Postgres — vùng `singapore`, deploy tự động từ nhánh `main`. Trạng thái các dịch vụ này trên Render: **NOT VERIFIED**.

## 1.10 Thành phần chính và quan hệ

| Thành phần | Phụ thuộc vào | Được dùng bởi |
|---|---|---|
| `src/core/tenancy` + `modules/organization` (phiên) | `sessions`, `memberships`, `roles`, `role_capabilities`, `capability_overrides` | Mọi route `/api/v1` có phiên |
| `src/core/rbac` | `capability-catalog.ts` (hằng) | `requireCapability` ở route/use-case, `can()` ở giao diện |
| `modules/jobs` + `modules/usage` | `generation_jobs`, `job_events`, `usage`, `organizations.credit_balance`, `workspaces.trial_*` | vision, media, video, audio, content-engine, creative-production, product-copies, MI |
| `src/core/ai/gateway.ts` | `ai_capabilities`, `ai_models`, `ai_policies`, `ai_requests`, `ai_evaluations` | content-engine, product-copies, creative-production, market-intelligence (không gồm chat-assistant — xem [11](11-tich-hop.md)) |
| `modules/assets` (+ `storage-provider-factory`) | `assets`, kho tệp | Hầu hết module có ảnh/video; worker đọc/ghi cùng kho |
| `modules/greeting-card` | `orders`, `order_payments`, `vouchers`, bảng `greeting_*` | Trang `/the-chao`, trang khách `/b` `/g` `/bst` `/s`, webhook SePay |
| `modules/coordinator` | `orders`, `order_coordinations`, `partners`, `order_qc_records`, `order_exceptions`, `order_payments`, `field-platform` | Trang `/dieu-phoi` |
| Workers Python | Cùng Postgres + cùng kho tệp + khoá nhà cung cấp | Job do core tạo |
