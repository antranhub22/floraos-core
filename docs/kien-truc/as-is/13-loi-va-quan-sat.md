# 13. Error Handling & Observability — As-Is

## 13.1 Xử lý lỗi

| Lớp | Cơ chế | Bằng chứng |
|---|---|---|
| API | `AppError(code, message, details?)` → `handle()` bọc handler → JSON `{ error: { code, message, details? } }` với HTTP theo bảng: `VALIDATION_FAILED` 400 · `UNAUTHENTICATED` 401 · `CAPABILITY_DENIED`/`ENTITLEMENT_REQUIRED` 403 · `NOT_FOUND` 404 · `CONFLICT` 409 · `QUOTA_EXCEEDED`/`UNPROCESSABLE_ENTITY` 422 · `RATE_LIMITED` 429 · `INTERNAL` 500. Lỗi khác → 500 "Lỗi hệ thống" + `console.error` | `src/core/http/errors.ts:20-29`, `src/core/http/response.ts` |
| Tenancy | Bản ghi tổ chức khác → `null` → 404 (không 403); tự khai `organization_id` → ném `TenantScopeViolation` (lỗi lập trình) | `src/core/tenancy/tenant-context.ts` |
| Webhook chat | `try/catch` riêng, luôn trả 200 cho nhà cung cấp, ghi `console.error` | `src/app/api/v1/chat/webhooks/*/route.ts` |
| Giao diện | `error.tsx`, `loading.tsx`, `not-found.tsx` cho nhóm `(app)` và `(platform)`; `global-error.tsx`, `not-found.tsx` ở gốc; `apiError()` lấy `error.message` từ JSON | `src/app/**`, `src/lib/api.ts` |
| Worker | Phân biệt `result = REJECTED` (job chạy đúng, phán quyết từ chối → `COMPLETED`) với lỗi thật (`FAILED`, `attempts+1`, `error`); sự kiện `done` vào `job_events` | `workers/media_ai/jobs/worker.py:17-21,429-435` |
| Đơn Thẻ chào | Gửi đơn đua hai lần → trả lại đơn thắng thay vì báo lỗi; webhook SePay idempotent | `submit-brochure-order.ts`, `payment-webhook.ts` |

## 13.2 Logging

| Thành phần | Cách ghi | Bằng chứng |
|---|---|---|
| Web (TS) | `log.debug/info/warn/error(event, ctx)` → một dòng JSON ra stdout/stderr (`ts`, `level`, `event`, `organizationId`, `jobId`, `feature`…); tự bỏ khoá nhạy cảm | `src/core/observability/log.ts` |
| Web (TS) — chỗ khác | Còn nhiều `console.error`/`console.log` trực tiếp (vd webhook chat, MI worker `[MI-Worker]`, `errorResponse`) | `grep console.` |
| Worker Python | `print(..., flush=True)` và module `logging` (biến `LOG_LEVEL`) | `workers/**` |
| Báo CSP | Trình duyệt gửi vi phạm về `POST /api/v1/public/csp-report` (rate limit 60/phút) | `next.config.ts`, route `public/csp-report` |

Không thấy bộ thu log/APM/error tracking bên ngoài (Sentry, Datadog, OpenTelemetry…) trong `package.json` hay `workers/requirements.txt`.

## 13.3 Monitoring & health

| Cơ chế | Chi tiết | Bằng chứng |
|---|---|---|
| `GET /api/health` | Trả `{status: "ok", timestamp}` tĩnh, không kiểm DB; dùng làm `healthCheckPath` của Render | `src/app/api/health/route.ts`, `render.yaml` |
| `GET /platform/health` (`N5`) | Đếm `generation_jobs` theo `status`, liệt kê job `PROCESSING` quá ngưỡng treo (15 phút); chỉ đọc | `src/modules/platform/infra/platform-query.ts:115-150` |
| `provider_health` | Bảng sức khoẻ nhà cung cấp dữ liệu thị trường; `GET /market-intelligence/health` (`V1`, không có màn gọi) | `src/modules/market-intelligence/` |
| Tiến độ job thời gian thực | `GET /jobs/:id/events` dạng `text/event-stream`, nối tiếp bằng `Last-Event-ID` | `src/app/api/v1/jobs/[id]/events/route.ts` |
| Sổ chi phí AI | `ai_requests` (mô hình, token, ảnh, giây GPU, `cost_usd`, độ trễ, kết quả) + `ai_evaluations`; xem ở `/so-lieu` | `src/core/ai/gateway.ts`, `workers/media_ai/providers/chung.py` |
| Mức dùng | `usage` theo tổ chức; `/muc-dung`, `/van-hanh/muc-dung` | `src/modules/usage/` |

## 13.4 Notifications

- Thông báo **khách cuối** (Zalo ZNS/eSMS) cho đơn Thẻ chào — xem [11](11-tich-hop.md).
- Thông báo **nội bộ**: tin nhắn nội bộ Thẻ chào (`greeting_messages`), hộp việc (`/greeting-card/inbox`), cảnh báo phiên bị thay. Không thấy kênh cảnh báo vận hành (email/Slack/pager) cho lỗi hệ thống.

## 13.5 Retry & giới hạn

| Cơ chế | Giới hạn | Bằng chứng |
|---|---|---|
| Chạy lại job | Thủ công `POST /jobs/:id/retry` (`G7`), chỉ job `FAILED` | `src/modules/jobs/domain/job-rules.ts` |
| Quét job treo | `PROCESSING` > 15 phút → `FAILED`; chạy bằng script (`npm run quet-job-treo`); `cron-job-entry.txt` trỏ đường dẫn máy cá nhân | `scripts/scan-stuck-jobs.ts`, `cron-job-entry.txt` |
| Cổng AI | Tối đa `maxAttempts` (mặc định 3, trần 5); thác nghiệm chỉ leo lên lớp chất lượng; dự phòng đổi nhà cung cấp không vượt sàn riêng tư | `src/core/ai/gateway.ts` |
| Content Engine | Viết lại tối đa `MAX_REWRITE_ROUNDS` vòng | `src/modules/content-engine/use-cases/generate-content.ts` |
| Worker media/vision | Chuỗi dự phòng nhà cung cấp (vd `VARIANT_PROVIDER_ORDER`, `lay_provider_co_du_phong`); lùi cục bộ khi nhà cung cấp lỗi + hoàn chênh credit | `workers/vision/providers/registry.py`, `workers/media_ai/providers/*/router.py` |
| Thông báo khách | Gửi lại tin lỗi mỗi 30 phút trong 6 giờ; tin kẹt "đang gửi" > 5 phút coi là lỗi | `src/modules/greeting-card/domain/background-sweep.ts` |
| Circuit breaker | 5 lỗi liên tiếp → mở 60 s, timeout 8 s; áp cho Zalo ZNS và eSMS | `src/core/http/circuit-breaker.ts`, `greeting-card/adapters/{zalo-zns,esms}-adapter.ts` |
| Proxy app anh em | Timeout 120 s | `src/modules/proxy/domain/proxy-rules.ts` |
| Rate limit Redis | Redis lỗi → rơi về đếm trong bộ nhớ + `log.warn("rate_limit.redis_fallback")` | `src/core/http/rate-limit.ts` |

## 13.6 Audit logs

| Bảng | Ghi bởi | Nội dung |
|---|---|---|
| `audit_logs` (theo tổ chức) | `recordAuditLog` — duyệt/từ chối phân tích, dữ liệu bán hàng, ảnh, biến thể, asset; huỷ đơn; điều phối (chuyển bước, sản xuất, QC, giao, đóng, huỷ, sự cố); chính sách AI; bộ máy vision; thứ tự nhà cung cấp; nội dung, gói chiến dịch; yêu cầu nâng cấp tổ chức | `action`, `entity_type/id`, `before`, `after`, `ip`, `user_agent`, `decision_id`, `ownership`, `decided_by` |
| `platform_audit_logs` (xuyên tổ chức) | `recordPlatformAuditLog` — thao tác quản trị trường dữ liệu (`field-platform`: tạo/sửa/tắt trường, giá trị danh mục, ghi đè tổ chức) | như trên, không có `organization_id` |
| `order_events`, `job_events`, `greeting_journey_events`, `greeting_catalog_events` | Use-case/worker tương ứng | Lịch sử trạng thái/sự kiện nghiệp vụ |

Đọc: `GET /audit-logs` (`G9`) ở `/audit`; `GET /platform/audit-logs` (`N6`) ở `/van-hanh/nhat-ky`.
