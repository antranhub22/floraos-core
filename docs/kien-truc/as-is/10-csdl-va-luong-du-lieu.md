# 10. Database & Data Flow — As-Is

## 10.1 Tổng quan

| Hạng mục | As-is | Bằng chứng |
|---|---|---|
| CSDL | PostgreSQL (16 trong CI và `render.yaml`; Docker local: ảnh tự dựng có `pg_cron`) | `.github/workflows/ci.yml`, `render.yaml`, `docker-compose.yml`, `docker/postgres-pgcron.Dockerfile` |
| ORM | Prisma 7 (`prisma-client`, output `src/generated/prisma`, driver adapter `@prisma/adapter-pg`); URL ở `prisma.config.ts` | `prisma/schema.prisma:15-24`, `prisma.config.ts` |
| Quy mô | 90 model, 45 enum; 66 bảng có cột `organization_id` | `prisma/schema.prisma` |
| Truy cập từ worker Python | `psycopg` SQL trực tiếp trên cùng bảng (không ORM) | `workers/requirements.txt`, `workers/*/jobs/*.py` |
| Đồng bộ lược đồ | `prisma db push` (CI, `render.yaml` dùng `--accept-data-loss`); thư mục `prisma/migrations/` có 21 migration (`0_init` → `20261007120000_greeting_catalog_event_product`). Migration có khớp lược đồ hiện tại hay không: NOT VERIFIED | `render.yaml` buildCommand, `prisma/migrations/` |
| Seed | `npm run db:seed`: 8 vai hệ thống + mã mặc định, sổ năng lực/mô hình AI, `decision_registry`; nếu `NODE_ENV !== production` hoặc `SEED_DEV_DATA=true` thì nạp thêm tổ chức mẫu "Tiệm Hoa Mộc Lan" (tài khoản, hồ sơ, 6 sản phẩm) | `prisma/seed.ts`, `prisma/seed/dev-shop-moclan.ts` |
| Tiện ích DB | `pg_cron` lập lịch lượt nghiên cứu thị trường (chỉ trong ảnh Docker local) | `docker/pg_cron_market_intelligence.sql` |

## 10.2 Ràng buộc chung có trong mã

- Lọc theo tổ chức ở tầng repository: `scopedWhere`/`scopedData` ném `TenantScopeViolation` nếu `where`/`data` tự khai `organization_id`; `ownedByTenant` trả `null` → 404 (`src/core/tenancy/tenant-context.ts`).
- Ba trục của job (`status`/`stage`/`result`) tách cột (`prisma/schema.prisma` chú thích đầu tệp).
- 24 bảng không có cột `organization_id`: `users`, `organizations`, `role_capabilities`, `platform_operators`, `platform_role_capabilities`, `platform_audit_logs`, `job_events` (thuộc job), `video_scenes` (thuộc video job), `flower_taxonomy`, `flower_confusable_pairs`, `ai_capabilities`, `ai_models`, `field_definitions`, `field_catalogs`, `field_catalog_values`, `market_sources`, `trend_signals`, `trend_timeseries`, `topics`, `topic_signals`, `topic_scores`, `research_runs`, `provider_health`, `decision_registry`. `sessions.organization_id` và `roles.organization_id` là nullable (phiên chưa chọn tổ chức; vai hệ thống).
- Danh sách bảng được test cách ly bỏ qua vì "chưa nối" ghi tay ở `scripts/check-docs.mjs` (`SCHEMA_ONLY_CHUA_NOI`): `product_variants`, `product_images`, `product_inventory`, `vouchers`, `journey_runs`.

## 10.3 Kiểm kê bảng

Cột FK chỉ liệt kê quan hệ khai `@relation(fields: …)`; nhiều cột `*_id` khác (vd `orders.voucher_id`, `assets.product_id`, `generation_jobs.workspace_id`) là chuỗi không có khoá ngoại. `onDelete` không ghi = mặc định Prisma.

### Danh tính, tổ chức, quyền

| Bảng | `organization_id` | PK | FK (onDelete) | Unique | Index | Ghi chú |
|---|---|---|---|---|---|---|
| `users` | — | id | — | (email) | — |  |
| `sessions` | có | id | user_id→users (Cascade) | (token_hash) | (user_id) |  |
| `organizations` | — | id | — | (slug) | — |  |
| `workspaces` | có | id | organization_id→organizations | — | (organization_id) |  |
| `branches` | có | id | organization_id→organizations | (organization_id, code) | (organization_id) |  |
| `roles` | có | id | — | (organization_id, key) | (organization_id) |  |
| `role_capabilities` | — | id | role_id→roles (Cascade) | (role_id, capability_code) | — |  |
| `capability_overrides` | có | id | organization_id→organizations | (organization_id, role_id, capability_code) | (organization_id) |  |
| `memberships` | có | id | user_id→users (Cascade); organization_id→organizations | (organization_id, user_id) | (organization_id); (user_id) |  |
| `platform_operators` | — | id | user_id→users (Cascade) | (user_id) | (user_id) |  |
| `platform_role_capabilities` | — | id | operator_id→platform_operators (Cascade) | (operator_id, capability_code) | — |  |
| `platform_audit_logs` | — | id | — | — | (created_at); (entity_type, entity_id) |  |
| `integration_tokens` | có | id | organization_id→organizations | (token_hash) | (organization_id); (organization_id, client) |  |

### Asset, job, mức dùng, kiểm toán

| Bảng | `organization_id` | PK | FK (onDelete) | Unique | Index | Ghi chú |
|---|---|---|---|---|---|---|
| `assets` | có | id | organization_id→organizations | — | (organization_id); (organization_id, product_id); (parent_asset_id); (output_sha256); (organization_id, product_id, kind, approval_state) |  |
| `generation_jobs` | có | id | organization_id→organizations | (organization_id, feature, idempotency_key) | (organization_id); (status, created_at); (organization_id, user_id); (organization_id, job_group_id) |  |
| `job_events` | — | id | job_id→generation_jobs (Cascade) | (job_id, seq) | (job_id, seq) |  |
| `usage` | có | id | organization_id→organizations | — | (organization_id, created_at); (job_id) |  |
| `audit_logs` | có | id | organization_id→organizations | — | (organization_id, created_at); (entity_type, entity_id) |  |

### Hồ sơ, sản phẩm, giá, phân tích

| Bảng | `organization_id` | PK | FK (onDelete) | Unique | Index | Ghi chú |
|---|---|---|---|---|---|---|
| `business_profiles` | có | id | organization_id→organizations | (organization_id) | — |  |
| `brand_profiles` | có | id | organization_id→organizations | (organization_id) | — |  |
| `products` | có | id | organization_id→organizations | (organization_id, code) | (organization_id) |  |
| `product_variants` | có | id | organization_id→organizations; product_id→products | — | (organization_id, product_id) | chỉ seed dev + thùng rác |
| `product_images` | có | id | organization_id→organizations; product_id→products | (organization_id, product_id, asset_id, role) | (organization_id, product_id) |  |
| `product_inventory` | có | id | organization_id→organizations; product_id→products; branch_id→branches | (organization_id, product_id, branch_id) | (organization_id, branch_id) | chỉ thùng rác |
| `product_analyses` | có | id | organization_id→organizations; product_id→products | (job_id, asset_id) | (organization_id); (organization_id, product_id); (job_id) |  |
| `pricing_rules` | có | id | organization_id→organizations | — | (organization_id, key) |  |
| `product_copies` | có | id | organization_id→organizations | (analysis_id) | (organization_id); (organization_id, product_id); (approval_state) |  |
| `occasions` | có | id | organization_id→organizations | (organization_id, code) | (organization_id) |  |
| `template_overrides` | có | id | organization_id→organizations | (organization_id, template_key, field_key) | (organization_id) |  |
| `catalog_links` | có | id | organization_id→organizations | (slug) | (organization_id); (slug) |  |
| `flower_taxonomy` | — | ma_loai | — | — | (ten_chuan); (nhom) | chỉ script `nap:loai` |
| `flower_confusable_pairs` | — | ma_cap | ma_loai_a→flower_taxonomy; ma_loai_b→flower_taxonomy | — | (ma_loai_a); (ma_loai_b); (muc_do_nham) | chỉ script `nap:loai` |

### AI

| Bảng | `organization_id` | PK | FK (onDelete) | Unique | Index | Ghi chú |
|---|---|---|---|---|---|---|
| `ai_capabilities` | — | code | — | — | — |  |
| `ai_models` | — | id | — | (key) | — |  |
| `ai_policies` | có | id | organization_id→organizations; capability_code→ai_capabilities | (organization_id, capability_code) | (organization_id) |  |
| `ai_requests` | có | id | organization_id→organizations | — | (organization_id, created_at); (organization_id, capability_code, model_key); (job_id) |  |
| `ai_evaluations` | có | id | organization_id→organizations | — | (organization_id, entity_type, entity_id); (organization_id, capability_code) |  |

### Nội dung, video, âm thanh, creative

| Bảng | `organization_id` | PK | FK (onDelete) | Unique | Index | Ghi chú |
|---|---|---|---|---|---|---|
| `content_metrics` | có | id | organization_id→organizations | (organization_id, platform, content_id, metric_date) | (organization_id); (organization_id, metric_date) |  |
| `video_jobs` | có | id | organization_id→organizations | — | (organization_id); (organization_id, product_id); (stage); (script_approval); (video_approval) |  |
| `video_scenes` | — | id | video_job_id→video_jobs (Cascade) | (video_job_id, scene_index) | (video_job_id) |  |
| `campaign_packages` | có | id | organization_id→organizations (Cascade) | — | (organization_id, created_at); (organization_id, master_asset_id); (organization_id, status) |  |
| `content_drafts` | có | id | organization_id→organizations (Cascade) | (organization_id, asset_id, topic_id, mode) | (organization_id, updated_at) |  |
| `content_generations` | có | id | organization_id→organizations (Cascade) | — | (organization_id, asset_id, topic_id, mode); (organization_id, created_at) |  |
| `voice_clones` | có | id | organization_id→organizations (Cascade) | — | (organization_id, status) |  |
| `music_tracks` | có | id | organization_id→organizations (Cascade) | — | (organization_id, mood) |  |

### Đơn hàng, điều phối

| Bảng | `organization_id` | PK | FK (onDelete) | Unique | Index | Ghi chú |
|---|---|---|---|---|---|---|
| `orders` | có | id | organization_id→organizations; customer_id→customers | (organization_id, code) | (organization_id, status); (organization_id, production_status); (organization_id, source) |  |
| `order_items` | có | id | organization_id→organizations; order_id→orders (Cascade) | — | (organization_id, order_id) |  |
| `order_assignments` | có | id | organization_id→organizations; order_id→orders (Cascade) | — | (organization_id, assignee_id); (organization_id, order_id) |  |
| `order_events` | có | id | organization_id→organizations; order_id→orders (Cascade) | — | (organization_id, order_id, created_at) |  |
| `partners` | có | id | organization_id→organizations (Cascade) | (organization_id, code) | (organization_id, is_active) |  |
| `order_coordinations` | có | id | organization_id→organizations (Cascade); order_id→orders (Cascade); partner_id→partners | (order_id) | (organization_id, stage); (organization_id, risk_level) |  |
| `order_payments` | có | id | organization_id→organizations (Cascade); order_id→orders (Cascade) | — | (organization_id, order_id) |  |
| `order_info_requests` | có | id | organization_id→organizations (Cascade); order_id→orders (Cascade) | — | (organization_id, order_id); (organization_id, status) | không có mã đọc/ghi |
| `order_change_requests` | có | id | organization_id→organizations (Cascade); order_id→orders (Cascade) | — | (organization_id, order_id); (organization_id, status) | không có mã đọc/ghi |
| `order_qc_records` | có | id | organization_id→organizations (Cascade); order_id→orders (Cascade) | — | (organization_id, order_id) |  |
| `order_exceptions` | có | id | organization_id→organizations (Cascade); order_id→orders (Cascade) | (organization_id, code) | (organization_id, order_id); (organization_id, status) |  |

### CRM, hội thoại

| Bảng | `organization_id` | PK | FK (onDelete) | Unique | Index | Ghi chú |
|---|---|---|---|---|---|---|
| `customers` | có | id | organization_id→organizations | (organization_id, phone); (organization_id, code) | (organization_id, tier); (organization_id, name) |  |
| `customer_occasions` | có | id | organization_id→organizations; customer_id→customers (Cascade) | — | (organization_id, customer_id); (organization_id, date) |  |
| `customer_consents` | có | id | organization_id→organizations; customer_id→customers (Cascade) | (customer_id, channel) | (organization_id, customer_id) |  |
| `vouchers` | có | id | organization_id→organizations; customer_id→customers | (organization_id, code) | (organization_id, customer_id) | đọc/tiêu thụ ở Thẻ chào, không có đường tạo |
| `chat_conversations` | có | id | organization_id→organizations; customer_id→customers | — | (organization_id, status); (organization_id, customer_id) |  |
| `chat_messages` | có | id | organization_id→organizations; conversation_id→chat_conversations (Cascade) | — | (organization_id, conversation_id, created_at) |  |
| `chat_channel_integrations` | có | id | organization_id→organizations | (organization_id, channel) | (organization_id, is_enabled) |  |

### Thẻ chào

| Bảng | `organization_id` | PK | FK (onDelete) | Unique | Index | Ghi chú |
|---|---|---|---|---|---|---|
| `greeting_catalogs` | có | id | organization_id→organizations (Cascade) | (organization_id, code) | (organization_id) |  |
| `greeting_catalog_products` | có | id | organization_id→organizations (Cascade); catalog_id→greeting_catalogs (Cascade); product_id→products (Cascade) | (catalog_id, product_id) | (organization_id, catalog_id); (product_id) |  |
| `greeting_sessions` | có | id | organization_id→organizations (Cascade); catalog_id→greeting_catalogs (Cascade); order_id→orders (SetNull) | (organization_id, send_code) | (organization_id, catalog_id); (organization_id, sale_id); (send_code) |  |
| `greeting_integrations` | có | id | organization_id→organizations (Cascade) | (organization_id); (payment_webhook_key_hash) | (organization_id) |  |
| `greeting_payment_events` | có | id | organization_id→organizations (Cascade) | (organization_id, provider, external_id) | (organization_id, status) |  |
| `greeting_notifications` | có | id | organization_id→organizations (Cascade) | (organization_id, order_id, event_key) | (organization_id, order_id) |  |
| `greeting_share_links` | có | id | organization_id→organizations (Cascade); catalog_id→greeting_catalogs (Cascade) | (code) | (organization_id, owner_id, created_at); (organization_id, catalog_id) |  |
| `greeting_messages` | có | id | organization_id→organizations (Cascade) | — | (organization_id, order_id); (organization_id, session_id); (organization_id, to_user_id, created_at); (organization_id, to_role, created_at) |  |
| `greeting_message_reads` | có | id | organization_id→organizations (Cascade); message_id→greeting_messages (Cascade) | (message_id, user_id) | (organization_id, user_id) |  |
| `greeting_catalog_events` | có | id | organization_id→organizations (Cascade); catalog_id→greeting_catalogs (Cascade) | — | (organization_id, catalog_id, created_at); (organization_id, channel); (organization_id, catalog_id, product_id) |  |
| `greeting_journey_events` | có | id | organization_id→organizations (Cascade); session_id→greeting_sessions (Cascade) | — | (organization_id, session_id) |  |

### Trường dữ liệu

| Bảng | `organization_id` | PK | FK (onDelete) | Unique | Index | Ghi chú |
|---|---|---|---|---|---|---|
| `field_definitions` | — | id | — | (key) | (entity); (catalog_key) |  |
| `field_catalogs` | — | id | — | (key) | — |  |
| `field_catalog_values` | — | id | catalog_key→field_catalogs (Cascade) | (catalog_key, code) | (catalog_key) |  |
| `field_config_overrides` | có | id | organization_id→organizations (Cascade) | (organization_id, target, override_key) | (organization_id) |  |

### Nghiên cứu thị trường

| Bảng | `organization_id` | PK | FK (onDelete) | Unique | Index | Ghi chú |
|---|---|---|---|---|---|---|
| `market_sources` | — | id | — | (provider, platform) | — |  |
| `trend_signals` | — | id | source_id→market_sources (Cascade) | (source_id, platform, country_code, topic_raw, captured_at) | (source_id); (platform, country_code); (captured_at); (industry) |  |
| `trend_timeseries` | — | id | topic_id→topics (Cascade) | (topic_id, platform, geo_scope, date) | (topic_id); (date) |  |
| `topics` | — | id | — | (canonical_name, industry) | (status); (industry); (last_seen_at) |  |
| `topic_signals` | — | id | topic_id→topics (Cascade); source_id→market_sources (Cascade) | — | (topic_id); (source_id) |  |
| `topic_scores` | — | id | topic_id→topics (Cascade) | — | (topic_id); (period); (content_opportunity_score) |  |
| `content_opportunities` | có | id | organization_id→organizations (Cascade); topic_id→topics (Cascade) | — | (organization_id, content_opportunity_score); (organization_id); (topic_id) |  |
| `product_analysis_runs` | có | id | organization_id→organizations (Cascade) | — | (organization_id, created_at) |  |
| `research_runs` | — | id | — | — | (status, created_at) |  |
| `provider_health` | — | id | — | (provider) | (status) |  |

### Khác

| Bảng | `organization_id` | PK | FK (onDelete) | Unique | Index | Ghi chú |
|---|---|---|---|---|---|---|
| `journey_runs` | có | id | organization_id→organizations (Cascade) | — | (organization_id, manifest_id); (organization_id, status) | không có mã đọc/ghi |
| `decision_registry` | — | decision_id | — | — | — | chỉ seed + script lint |

## 10.4 Vòng đời dữ liệu (as-is)

| Kiểu | Bảng / cơ chế | Bằng chứng |
|---|---|---|
| Xoá cứng | `customers` (cascade `customer_occasions`, `customer_consents`), `memberships` (gỡ thành viên), `assets` (`DELETE /assets/:id`), thùng rác "xoá vĩnh viễn", `template_overrides` | `crm/infra/customer-repository.ts:135-143`, `storage/infra/trash-repository.ts` |
| Xoá mềm / vô hiệu | `products.status = ARCHIVED` (+ `attributes.trashed_at`), `assets.state = ARCHIVED` (+ `metadata.trashed_at`), `branches.is_active`, `occasions.is_active`, `partners.is_active`, `field_definitions.status = INACTIVE`, `voice_clones.deleted_at`, `music_tracks.deleted_at`, `catalog_links.is_revoked`, `greeting_sessions.revoked_at`, `integration_tokens.revoked_at`, `sessions.revoked_at`, `platform_operators.revoked_at` | use-case tương ứng |
| Chỉ chèn (append-only) | `pricing_rules` (dòng mới theo khoá), `order_events`, `job_events`, `audit_logs`, `platform_audit_logs`, `usage` (hoàn tiền = dòng mới), `order_payments`, `ai_requests`, `greeting_journey_events`, `greeting_catalog_events` | `products/use-cases/put-pricing-rules.ts`, `usage/use-cases/refund-*.ts` |
| Bất biến một phần | `product_analyses.raw`, `product_copies.raw` (chỉ sửa `edited`); asset gốc (dẫn xuất là bản ghi mới) | `products/use-cases/edit-analysis.ts`, `assets/use-cases/register-asset.ts` |
| Thùng rác 30 ngày | Mục quá 30 ngày bị xoá vĩnh viễn **khi ai đó mở danh sách thùng rác** (không có tiến trình định kỳ) | `storage/infra/trash-repository.ts:44-51,84-91` |
| Dữ liệu cá nhân | Không có cơ chế ẩn danh hoá/soft-delete khách hàng trong mã (xem mâu thuẫn ở [16](16-quan-sat-hien-thuc.md)) | `crm/use-cases/delete-customer.ts` |

## 10.5 Luồng dữ liệu chính

```text
[Ảnh] trình duyệt ──PUT URL ký──► kho tệp (S3-compatible | đĩa cục bộ)
      └─POST /assets──► assets(ORIGINAL)
[Job] POST /vision/analyses ─► (1 giao dịch) usage(ENQUEUED) + organizations.credit_balance−n | workspaces.trial_count+1
                                + generation_jobs(PENDING) + pg_notify('floraos_job_<feature>')
      worker ─► SELECT … FOR UPDATE SKIP LOCKED ─► đọc tệp từ kho ─► nhà cung cấp AI ─►
              product_analyses / assets(dẫn xuất) / video_jobs / voice_clones ─► generation_jobs(COMPLETED|FAILED) + job_events
      UI đọc GET /jobs/:id ─► (media/video) hoàn credit chênh: usage(REFUNDED|PARTIAL_REFUND) + credit_balance+n
[Duyệt] POST …/approve ─► (1 giao dịch) products.attributes/… + approval_state=APPROVED + audit_logs
[AI tại chỗ] use-case ─► callCapability ─► ai_policies + ai_models (lọc) ─► nhà cung cấp ─► ai_requests (+ ai_evaluations)
[Đơn] POST /orders | coordinator | Thẻ chào ─► orders + order_items ─► order_events (mỗi trục đổi) ─► order_payments ─► orders.paid_vnd/balance_vnd
[Thẻ chào] greeting_sessions(send_code) ─► orders(source=BROCHURE) ─► SePay webhook ─► greeting_payment_events ─► order_payments
           ─► greeting_notifications ─► Zalo ZNS | eSMS
[Thị trường] pg_cron | POST research-runs ─► research_runs ─► NOTIFY ─► worker TS ─► trend_signals/topics/topic_scores ─► content_opportunities(theo tổ chức)
[Engine ngoài] LocalBudd/SocialFlow ─► /api/v1/integration/* ─► assets, generation_jobs, usage, content_metrics, catalog_links
```

Bằng chứng: `src/modules/jobs/use-cases/enqueue-job.ts`, `src/modules/jobs/infra/transaction.ts`, `workers/media_ai/jobs/worker.py`, `src/modules/products/use-cases/approve-analysis.ts`, `src/core/ai/gateway.ts`, `src/modules/greeting-card/use-cases/payment-webhook.ts`, `src/modules/market-intelligence/infra/worker.ts`.
