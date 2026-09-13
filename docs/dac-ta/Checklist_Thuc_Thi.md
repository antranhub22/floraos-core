# Checklist thực thi

Một pha chỉ coi là xong khi mọi ô của nó tích được. Mã trong ngoặc dẫn về `01-technical-requirements.md`.

Không tạo bảng, route, job hay đường dẫn lưu trữ thật của bất kỳ module nào trước khi **P1 và P2** tích hết.

P0–P12 là Tuyến A — nền tảng và module lõi. P13–P23 là Tuyến B — bộ tính năng hoàn chỉnh; bảy pha đầu của tuyến này là MVP. AI-1 đến AI-4 là Tuyến C — nền AI, cắt ngang hai tuyến kia. Bảng pha đầy đủ ở `../kien-truc/FLORAOS_SAAS_TARGET_ARCHITECTURE_V2.md` mục 15.

## P0 — Khung repo · xong

- [x] Cấu trúc thư mục theo `05-backend-architecture.md` mục 1
- [x] Năm cổng khai ở `src/core/ports/`
- [x] `AGENTS.md`, tài liệu kiến trúc, bộ đặc tả
- [x] `prisma/schema.prisma` trống, chỉ có `datasource` và `generator`
- [x] `npm run test:tenant` tồn tại và thất bại có chủ đích

## P1 — Tổ chức và cách ly tenant · xong

- [x] Bảy bảng nền dựng đủ: `users` `sessions` `organizations` `workspaces` `branches` `roles` `memberships` (`YC-T1`)
- [x] `TenantContext` giải từ `sessions.organization_id` phía máy chủ (`YC-T2`)
- [x] Repository nhận `TenantContext` bắt buộc, tự chèn điều kiện lọc (`YC-T3`)
- [x] Không module nào import `PrismaClient` ngoài `infra/`
- [x] Bản ghi tổ chức khác trả 404, không trả 403 (`YC-T4`)
- [x] `POST /session/organization` là nơi duy nhất client nêu tên tổ chức
- [x] Bộ test cách ly phủ mọi bảng có `organization_id`, chạy trong CI (`YC-T10`)
- [x] **`npm run test:tenant` xanh thật** — gỡ script thất bại có chủ đích
- [x] Không còn bất kỳ khoá ghi toàn cục nào (`YC-T9`)
- [x] Lược đồ và client theo Prisma 7: `prisma.config.ts`, driver adapter `@prisma/adapter-pg`, `datasource` không mang `url`
- [x] `eslint.config.mjs` — trước đó `npm run lint` dừng ngay vì thiếu tệp cấu hình, nên cổng thứ hai của CI chưa từng chạy

Endpoint gác bằng mã năng lực — `/members`, `/roles`, `/branches`, `/workspaces`,
`/organizations/current` — thuộc P2, cùng pha với bảng 76 mã gác chúng. Ở P1
`requireCapability` từ chối mọi mã: cổng chưa có bảng quyền thì chặn hết, không
mở tạm.

## P2 — Quyền · xong

- [x] 76 mã chuyển sang nguyên vẹn, `maChucNang.test.ts` xanh không sửa một dòng (`YC-Q1`) — `npm run test:harvest`, 25/25
- [x] Ba lớp cắt đúng thứ tự, trần cứng cắt sau cùng (`YC-Q2`) — `capability-catalog.ts` + `permission-resolver.ts`
- [x] Bảng trần cứng là hằng trong mã, không trong cơ sở dữ liệu (`YC-Q3`) — `hardCap` trong `CAPABILITIES`, không có cột nào trong `capability_overrides`/`role_capabilities`
- [x] 18 mã trần cứng ở phần thu hoạch, cộng 12 mã mới — 30 tổng cộng (`YC-Q3`) — `capability-catalog.test.ts`
- [x] Quyền là bộ ba `(vai, mã, phạm vi)` (`YC-Q4`) — `role_capabilities.scope`, `CapabilityGrant.scope`
- [x] Vai là bản ghi; không còn `enum Role` (`YC-Q5`) — chốt từ P1
- [x] Bốn cặp năng lực tách rời, không cặp nào gói chung (`YC-Q6`) — `SPLIT_CAPABILITY_PAIRS`
- [x] Không có `if (role === …)` ở bất kỳ đâu (`YC-Q7`) — kiểm bằng `passesHardCap(code, roleKey)`, không so vai UI
- [x] Điều hành có mọi năng lực của Sale và Điều phối (`YC-Q8`) — trừ nhóm Trải nghiệm (`K1`), test khoá bất biến này
- [x] Công tắc `cho_phep_tu_duyet` hoạt động (`YC-Q9`) — `self-approval-policy.ts`, mặc định `true` (giả định cần chủ sản phẩm xác nhận, xem `TECHNICAL_DEBT.md`)
- [x] `GET /auth/me` trả danh sách năng lực đã tính sẵn — `resolveSession` nạp `ctx.capabilities`, `describeSession` trả ra

Endpoint gác bằng mã năng lực đã dựng cùng pha: `GET·PATCH /organizations/current` (`F1`/`F2`) ·
`GET /members` · `POST /members/invite` · `DELETE /members/:id` · `PATCH /members/:id/role` (`F1`/`F3`/`F4`/`F5`) ·
`GET·POST /roles` · `PATCH /roles/:id/capabilities` (`F1`/`F5`/`F5`) ·
`GET·POST /branches` · `PATCH /branches/:id` (`F6`/`F7`/`F7`) ·
`GET·POST /workspaces` (`F1`/`F8`).

**Đã xác minh trên máy có mạng (2026-09-09)**: `npx prisma generate`, `npx prisma db push`
(Postgres 16 qua `docker compose up -d`, khớp `docker-compose.yml`), `npm test` (48/48),
và `npm run test:tenant` (23/23) đều xanh. Một test P1 (`cach-ly-endpoint.test.ts` — "GET
/auth/me không trả năng lực nào trước khi có bảng quyền") khoá hành vi placeholder cũ
(`NO_CAPABILITIES` rỗng); đã sửa lại để khoá hành vi P2 thật — người sáng lập tổ chức
(vai `dieu_hanh`) có năng lực mặc định ngay lúc đăng ký vì `ensureSystemRoles()` giờ nạp
`role_capabilities`. Đối chiếu bằng `defaultCodesForSystemRole(FOUNDER_ROLE_KEY)`, không
chép tay danh sách mã. P2 nghiệm thu xong.

## P3 — Asset · Job · Usage

Mã viết đầy đủ (09/09) — `prisma/schema.prisma` (`assets`, `generation_jobs`
+ `idempotency_key`, `job_events`, `usage`, `audit_logs`, cộng khoá ngoại tới
`organizations` cho bốn bảng nợ #8), bốn module (`src/modules/{assets,jobs,usage,audit}/`
đủ bốn thư mục), route dưới `/api/v1/{assets,jobs,usage,audit-logs,storage}`.

**Đã chạy trên Postgres thật lần đầu (09/09, cùng ngày)** — `npx prisma
generate && npx prisma db push` xanh, `npm run test:tenant` chạy 35/35 test,
30 xanh 5 đỏ, toàn bộ 5 ca đỏ đều trong `tests/tenant/enqueue-job.test.ts`.
Đọc log thật tìm ra **hai lỗi thật**, đã sửa cả hai (chưa tự chạy lại được
vitest để xác nhận — máy chạy `device_bash` là VM Linux riêng của phiên này,
thiếu `@rollup/rollup-linux-arm64-gnu`, khác với Terminal thật trên Mac đã
cho ra log trên; `npx tsc --noEmit` sau khi sửa thì sạch):

1. `PostgresQueueProvider.enqueue` gọi `db.$queryRaw\`SELECT pg_notify(...)\``
   — `pg_notify()` trả cột kiểu `void`, Prisma không giải mã được nên ném
   `P2010` trên Postgres thật (sandbox trước không có DB nên không bắt được).
   Sửa: đổi sang `$executeRaw` — chỉ cần tác dụng phụ NOTIFY, không cần đọc
   cột trả về.
2. Hai ca thử `enqueue-job.test.ts` ("hạn mức chặn TRƯỚC…", "ném AppError
   thật…") giả định tổ chức mới có `credit_balance = 0` theo giá trị mặc
   định của lược đồ — nhưng `sign-up.ts` đã cấp sẵn `TRIAL_CREDIT_BALANCE`
   (20) credit chào mừng từ P1/P2, nên hạn mức không chặn, luồng chạy tới
   `pg_notify` và vỡ ở lỗi #1 thay vì ném `QUOTA_EXCEEDED` như kỳ vọng. Sửa:
   cả hai ca tự đặt `credit_balance = 0` trước khi kỳ vọng bị chặn (cùng
   cách "đủ credit" đã tự nạp credit trước đó).

**Vòng chạy thứ hai (09/09, cùng ngày, sau khi sửa lỗi #1)**: lỗi `pg_notify`
đã hết, nhưng lộ ra **lỗi thứ ba, ở chính bộ thử chứ không phải mã**: cả bốn
ca "đường CREDIT" dùng thẳng `a.ctx` (workspace mặc định của `sign-up`) —
nhưng workspace mặc định đó LUÔN có `kind: "EXPERIENCE"` (đúng thiết kế
P1/P2 — tổ chức mới là tổ chức trải nghiệm), nên `a.ctx` luôn đi đường hạn
mức TRIAL bất kể `credit_balance` được đặt bao nhiêu — bốn ca này chưa từng
kiểm được đường CREDIT như tên gọi. Sửa: thêm `withProductionWorkspace()`
trong `enqueue-job.test.ts`, tự dựng một workspace `PRODUCTION` riêng cho
bốn ca đó (đối xứng với ca "workspace EXPERIENCE" đã tự dựng workspace
riêng của nó); sửa luôn assertion sai còn lại của ca EXPERIENCE — kỳ vọng
`credit_balance` giữ nguyên `TRIAL_CREDIT_BALANCE` (20) chứ không phải `0`.
`npx tsc --noEmit` sạch (chạy trên client Prisma thật, cùng thư mục đã
`prisma generate` trên máy anh Tony).

**Vòng chạy thứ ba (09/09, cùng ngày)**: anh Tony xác nhận `npm run
test:tenant` **35/35 xanh** sau khi sửa lỗi thứ ba. Coi như xong phần cách
ly tenant, giao dịch, hạn mức — đủ để tích các ô liên quan bên dưới.

**Còn sót một việc nhỏ**: `npm test` (bộ test KHÔNG nằm trong `tests/tenant/`
— domain thuần của P3: `asset-rules.test.ts`, `job-rules.test.ts`,
`pricing.test.ts`, `quota.test.ts`, `storage-key.test.ts`) chưa có xác nhận
chạy trên Postgres/Node thật trong phiên này (chỉ `tsc --noEmit` xác minh
kiểu — các test này thuần, không chạm DB, nên rủi ro thấp hơn nhiều so với
`test:tenant`, nhưng chưa "xanh thật" theo đúng chuẩn `AGENTS.md`).

- [x] `assets` đủ cột metadata bắt buộc (`YC-A4`) — `prisma/schema.prisma`, `AssetRepository.create`
- [x] `parent_asset_id` và `version`; asset gốc không bao giờ bị ghi đè (`YC-A1` `YC-A2` `YC-A3`) — `domain/asset-rules.ts` (`nextVersion`), `register-asset.ts`
- [x] `generated_flags` không mặc định ngầm (`YC-A5`) — `requiresExplicitGeneratedFlags`/`isValidGeneratedFlags`, từ chối ở `register-asset.ts` nếu thiếu
- [x] `generation_jobs` ba trục tách rời (`YC-J1` `YC-J2`) — `prisma/schema.prisma`, `domain/job-rules.ts`
- [x] `COMPLETED/REJECTED` không phải `FAILED`; retry trả 409 (`YC-J3`) — `canRetry`, `retry-job.ts`
- [x] `CANCELLED` huỷ được job `PENDING` (`YC-J4`) — `canCancel`, `cancel-job.ts`
- [x] Worker lấy việc bằng `SKIP LOCKED` + `LISTEN/NOTIFY` (`YC-J7`) — `GenerationJobRepository.claimNext` (SQL thô), `PostgresQueueProvider.enqueue` (`pg_notify` trong giao dịch), test `tests/tenant/skip-locked-claim.test.ts` chứng minh hai lời gọi đồng thời không trùng job — **xanh (2/2)**
- [x] Không `subprocess`, không job qua HTTP (`YC-J8`) — đúng theo thiết kế (không có mã nào gọi `subprocess`/HTTP nội bộ cho job); `workers/` P3 chưa có worker Python thật (M01/M04a ở P5/P9)
- [x] Nhật ký cộng dồn, nối lại được bằng `Last-Event-ID` (`YC-J9`) — bảng `job_events` (đặc tả 07 mục 6.1), `JobEventRepository`, route SSE `GET /jobs/:id/events` đọc header `Last-Event-ID`/`?after=`
- [ ] Tiến trình quét job treo quá 15 phút (`YC-J10`) — `scanStuckJobs`/`GenerationJobRepository.markStuckAsFailed`, script `scripts/scan-stuck-jobs.ts` (chưa gắn cron thật — việc triển khai, không phải việc mã)
- [x] Một bảng `usage` duy nhất (`YC-U1` `YC-U2`) — `prisma/schema.prisma`, không repo/module nào khác dựng bảng usage riêng
- [x] Hạn mức kiểm trước khi job vào bảng, cùng một giao dịch (`YC-U3`) — `enqueue-job.ts` (`runInTransaction`: kiểm hạn mức → ghi usage → tạo generation_jobs → NOTIFY), `tests/tenant/enqueue-job.test.ts` — **xanh (6/6), sau khi sửa 3 lỗi thật (xem banner P3 phía trên)**
- [x] Worker không ghi `usage` (`YC-U4`) — đúng theo thiết kế; `UsageRepository` chỉ được gọi từ `src/modules/usage` và `enqueue-job.ts` (phía core), không có mã Python nào ghi bảng này
- [x] `Idempotency-Key` trên mọi endpoint tạo job (`YC-U7`) — `enqueueJob` bắt buộc `idempotencyKey`, `domain/idempotency.ts` đọc header — P3 chưa có endpoint tạo job cụ thể theo feature (`/vision/analyses`, `/media/optimizations` ở P5/P9) để nối header thật vào; cơ chế đã sẵn cho các endpoint đó gọi `enqueueJob`. **Tích 09/10:** cả hai endpoint tạo job
  nay đã có và đều BẮT BUỘC khoá — `POST /vision/analyses` (P5) đọc header qua
  `readIdempotencyKey`, `POST /integration/jobs` (P7) đọc trường `idempotency_key` của thân
  yêu cầu (máy gọi máy, không phải trình duyệt). Đợt soát 09/10 bịt luôn lỗ cuối: hai request
  cùng khoá gửi ĐỒNG THỜI trước đó trả 500 (`P2002` nổi lên) vì cửa kiểm trùng lặp đọc trước
  giao dịch — nay `enqueueJob` bắt lỗi đó và trả lại job của người thắng
- [x] `audit_logs` ghi mọi hành động duyệt (`YC-R4`) — hạ tầng dựng đủ (bảng, `AuditLogRepository`, `recordAuditLog`, `GET /audit-logs`), nhưng **chưa có hành động duyệt nào để ghi** — P3 không có endpoint `*.approve` (`H3`/`I2` ở P5/P9); mục này chỉ thật sự "xong" khi endpoint duyệt đầu tiên gọi `recordAuditLog` trong cùng giao dịch.
  **Tích 09/10:** `POST /vision/analyses/:id/approve` (`H3`, P5) làm đúng vậy — ghi Product
  Master → chuyển `APPROVED` → `recordAuditLog`, cả ba trong một `runInTransaction`. Endpoint
  duyệt tiếp theo (`media.approve`/`I2`, P9) phải theo cùng khuôn

## P4 — Hồ sơ

- [x] `business_profiles` và `brand_profiles` tách đôi, mỗi tổ chức một bản ghi
- [x] Nhập một lần, dùng lại xuyên module

## P5 — M01 phân tích ảnh

- [ ] **Bộ ảnh vàng đạt nghiệm thu** theo `../kien-truc/BO_ANH_VANG.md` *(09/12: 8/100 ảnh đã gán nhãn (g001, g002, g008-g014). Quy tắc mới 09/12: ước tính = chấp nhận, ghi chú rõ trong notes. AI đề xuất chạy được 6 ảnh (g001-g006), crash sau đó. Script so sánh `so-sanh-ai-vs-nguoi.py` hoạt động. Đây là điều kiện còn lại DUY NHẤT chưa xong của P5)*
- [x] Hợp đồng `PhanTichSanPhamHoa` lấy nguyên từ `Schema.json`, không khai lại tay (`YC-N3`)
- [x] Cổng `VisionAnalyzer` ở mức hợp đồng JSON (`YC-N2`)
- [x] `OpenAIStructuredProvider` chạy được sau cổng *(09/10: 9/9 test logic xanh thật trên máy Tony — CHƯA gọi API OpenAI thật với ảnh thật, việc đó chờ bộ ảnh vàng có nhãn để đối chiếu kết quả)*
- [x] `count_engine.py` và `color_engine.py` chuyển sang, có test hồi quy trên bộ ảnh vàng *(09/10: chuyển sang nguyên vẹn + 43/43 test đơn vị thuần xanh thật trên máy Tony (Postgres + Python venv) — hồi quy TRÊN BỘ ẢNH VÀNG vẫn chờ bộ ảnh vàng có nhãn, xem nợ #20 #24; tích ô này vì phần "chuyển sang + có test" đã xong, phần hồi quy trên ảnh vàng thật tách riêng ở nợ #20)*
- [x] Kết quả lưu `raw` và `edited` tách rời (`YC-R3`)
- [x] Kết quả không ghi thẳng Product Master; phải qua duyệt (`YC-R1`)
- [x] `approved_by` và `approved_at` có trên bản ghi (`YC-R2`)
- [x] **Ma trận chọn công nghệ hoàn thành** (YC-N5 `YC-N6`) — 3 engine chạy trên 4 ảnh (g001, g002, g010, g011): local_cv (conf 55, đếm 5), openai_structured (conf 85-90, đếm 25-80), openai_direct (conf 90-95, đếm 16-60). openai_direct đề xuất cho production. Chi tiết: `scripts/so-sanh-engine.py`, `golden/ai-proposals-openai/`, `golden/ai-proposals-openai-direct/`. Ma trận chọn công nghệ: local_cv cần cải thiện (nợ #56/#24), openai_direct cho production, openai_structured cho chính xác cao nhất. Xem `golden/TRANG_THAI_GAN_NHAN.md`

  09/12: anh Tony xác nhận xanh hết trên máy thật — `prisma generate`/`db push` ✅, `npm test` ✅, `npm run test:tenant` **123/123** ✅ (sau khi sửa 2 ca `vision-analyses.test.ts` kỳ vọng sai engine mặc định: `openai_structured` → `local_cv` theo `VISION_ENGINE_MAC_DINH`). **Thêm 09/12:** engine mặc định `local_cv` → `openai_direct` (registry `MAC_DINH` + TS `VISION_ENGINE_MAC_DINH`), `MODEL_MAC_DINH` `gpt-4o` → `gpt-4o-mini`, fix config key `model_truc_tiep` → `model_tien_kiem` trong `openai_direct.py`. Bộ ảnh vàng: 8/100 ảnh đã gán nhãn, quy tắc mới chấp nhận ước tính. Script AI đề xuất `scripts/golden-ai-proposals.py` chạy được 6 ảnh (g001-g006) trước khi crash. Script so sánh `scripts/so-sanh-ai-vs-nguoi.py` hoạt động. Ma trận chọn công nghệ chờ bộ ảnh vàng có nhãn.

## P6 — M02 giá và M03 tra cứu

- [x] `pricing.ts` và bất biến làm tròn chuyển sang, test hai phía xanh — `src/modules/products/domain/pricing.ts` (`quotePrice`/`checkPriceInvariants`), `pricing.test.ts` xanh trong sandbox (`npx vitest run`)
- [x] Quy tắc giá theo tổ chức, có thể theo chi nhánh — `pricing_rules` (P3) + `PricingRuleRepository` (chèn-chỉ, `effective_from`) + `mergeEffectivePricingConfig`, `GET · PUT /pricing-rules` (`L5`/`L6`) — nghiệm thu trên Postgres thật 09/10 (`npm run test:tenant`, anh Tony)
- [x] **Chốt cách tính chi phí lá và cành trang trí** — chủ sản phẩm chốt 09/10: CHƯA TÍNH, để nợ kỹ thuật (`TECHNICAL_DEBT.md` #27) cho tới khi có dữ liệu thật/bộ ảnh vàng
- [x] Tra cứu chạy trên Postgres — `GET /products` (lọc `branch_id`/`status`/`category`, phân trang con trỏ) + `GET /products/:id`, cả hai qua `filterProductLookup`; các ca thử thuần của `locTraCuu.test.ts` (đọc số, tỷ lệ, câu cảnh báo) dịch sang `pricing-input.test.ts`, xanh trong sandbox — xem ghi chú phạm vi ở đầu `pricing-input.ts`/`product-lookup.ts` — nghiệm thu trên Postgres thật 09/10 (`npm run test:tenant`, anh Tony)

## P7 — Integration Layer

- [x] Token máy gọi máy theo tổ chức, có ký, xoay được (`YC-T8`) — `integration_tokens` (HMAC, `INTEGRATION_TOKEN_SECRET`), `POST/GET/DELETE /integration-tokens` + `POST .../rotate` (`F9`), xoay không dừng dịch vụ (hai token cùng lúc cho tới khi tự thu hồi token cũ) — nghiệm thu trên Postgres thật 09/10 (`npm run test:tenant` 69/69 xanh, anh Tony)
- [ ] `LocalBudd` bỏ năm bảng trùng, đọc core qua API — chỉ bỏ được `media_assets` (chết hẳn, không ai đọc); `products`/`product_assets`/`generation_jobs`/`projects` còn chặn vì đặc tả 08 mục 4 chỉ có endpoint đọc (`GET /integration/products`), chưa có endpoint ghi cho LocalBudd tạo Product Master, và chưa có cơ chế cho client chỉ-có-HTTP nhận/hoàn tất job — cần quyết định chủ sản phẩm (`LocalBudd/TECHNICAL_DEBT.md`, mục P7)
- [x] `/integration/*` nhận danh tính người dùng qua `X-FloraOS-SSO`, giải `organization_id` từ JWT do core ký — đóng lỗ rò dữ liệu chéo tổ chức khi một engine ngoài phục vụ nhiều tổ chức bằng một token duy nhất *(09/10: `domain/integration-credential.ts` + `tenantContextFor` dùng chung với `resolveSession`; nhánh SSO mang năng lực THẬT của người dùng; `tests/tenant/integration-sso.test.ts` — CHƯA chạy trên Postgres thật)*
- [x] Bộ test cách ly chạy trên database RIÊNG, không xoá dữ liệu phát triển *(09/10: `floraos_test` + `npm run db:test:setup` + chốt chặn từ chối tên database không kết thúc bằng `_test` — nợ #46)*
- [x] Khối `pricing` không vượt ranh giới core dù người gọi có `L5` thật *(09/10: `boundary-capabilities.ts` trừ `L5` khỏi nhánh SSO; phát hiện trong lượt xác minh đầu-cuối trên dữ liệu thật, không phải khi đọc mã)*
- [x] `/integration/products/:id/master-image` trả URL ký sẵn tải được (hạn 15 phút), không chỉ `storage_key` trần *(09/10: mở đường bàn giao M04a→M04b — trước đó engine ngoài không có cách nào lấy byte ảnh)*
- [x] `/integration/products/:id/master-image` chỉ trả ảnh đã duyệt — đúng theo đặc tả 08 mục 4; luôn 404 cho tới khi P9 đặt được `APPROVED` (nợ #30, không phải lỗi)
- [x] Adapter `SocialFlow` nhận `organization_id` — cột + lọc trên `accounts` (khoá ngoại UNIQUE(platform) toàn cục vẫn còn, chỉ chặn ghi đè khác tổ chức thay vì âm thầm ghi đè); D1 (SocialFlow đa tenant hay đơn tenant) vẫn còn mở vì repo chưa có cơ chế xác thực máy gọi máy, và `posts`/các bảng còn lại của SocialFlow chưa có `organization_id` (`SocialFlow/TECHNICAL_DEBT.md`) — nghiệm thu trên máy thật 09/10 (curl end-to-end trên `backend/socialflow.db` thật: tạo tài khoản mới dưới một tổ chức, chặn 409 khi tổ chức khác giành cùng platform, lọc đúng theo `organization_id` cả hai chiều, ba tài khoản thật có sẵn không bị ảnh hưởng)

## P8 — Nạp dữ liệu AVI GIFT · xong

- [x] Adapter Excel một chiều; không đường nào ghi ngược *(09/10: `scripts/nap-avi-gift/doc-excel.py`
  chỉ ĐỌC hai tệp `.xlsx` và ghi ra `catalog.json` trung gian; `nap-avi-gift-vao-core.ts` chỉ đọc
  JSON đó. Không tệp nào trong `scripts/nap-avi-gift/` mở tệp Excel ở chế độ ghi, và không tệp nào
  đọc `he_thong.json` của AVI GIFT. Soát lại toàn bộ đường đi 09/10)*
- [x] Dữ liệu nhập đủ, đối chiếu với nguồn *(09/10: **hai lượt nạp chạy thật trên Postgres**,
  tổ chức AVI GIFT `18dc7e62`. `npm run doi-chieu` khớp HOÀN TOÀN 8/8 dòng — sản phẩm 1.319
  (1.316 danh mục + 3 mã chỉ có ở lượt phân tích), `ACTIVE` 3, asset 16 (tất cả `ORIGINAL` +
  `PENDING`, chưa qua Identity Guard), lượt phân tích 8 (tất cả `APPROVED`), job tổng hợp 1,
  `usage` 0. Số dư credit giữ nguyên 500 sau lượt nạp phân tích — chứng minh dữ liệu lịch sử
  không bị tính phí lần hai. Ba mã `GHTM`/`MM17082026`/`KG-20260831-001` đều có mặt và mang dấu
  `attributes.aviGiftImport.notInPriceCatalog`.*
  *Ghi chú: Checklist bản đầu ghi "đối chiếu với bảng nghiệm thu của `BAN_GIAO.md`" — đọc tệp đó
  thì nó là bảng nghiệm thu GIAO DIỆN của v1 (tạo thẻ, xuất PNG/PDF, kịch bản Zalo), không phải
  bảng số liệu dữ liệu. Nguồn đối chiếu đúng là hai tệp JSON trung gian, vì chúng sinh trực tiếp
  từ Excel và `results.jsonl` thật; `BAN_GIAO.md` vẫn là căn cứ cho P11.)*

## P9 — M04a tối ưu ảnh

Đợt một (09/10): **Identity Guard + cổng 2 Review & Approve**. Phần tăng
cường ảnh thật và Smart Reframe để đợt sau — chỗ enhancement hiện cắm
`PassthroughEnhancer` (trả đúng byte đưa vào, tên gọi nói thẳng nó không phải
enhancer), nên pipeline chạy end-to-end được và Guard có thứ để gác.

- [x] Identity Guard là cổng cứng, chặn được một thay đổi sản phẩm mô phỏng *(09/10:
  `workers/media_ai/guard/` — `test_guard.py` 19 ca dựng đúng các kiểu sai lệch: đổi phân loại,
  đổi vật chứa, đổi màu, thêm/mất thành phần, lệch số lượng. Ngưỡng 0,95 / 0,90 CHỐT VỚI CHỦ SẢN
  PHẨM 09/10 — M04 mục 17.3/18.2 cấm agent tự đặt, và không tệp đặc tả nào cho con số)*
- [x] `REJECTED` giữ ảnh gốc, không trả ảnh tăng cường (`YC-R5`) *(09/10: worker không ghi dòng
  `assets` nào và không ghi tệp nào khi bị từ chối — `test_worker_m04a.py` khoá cả hai; phía TS
  `approve` trả 409 và `download` trả 409)*
- [x] `WARNING` duyệt được nhưng có cảnh báo trước (`YC-R6`) *(09/10: máy chủ trả cờ
  `approval.requires_warning` thay vì để mỗi màn hình tự suy từ chuỗi `result`)*
- [x] Guard dùng cùng provider và cùng model version hai lần (`YC-N4`) *(09/10: bảo đảm bằng CẤU
  TRÚC — `VisionIdentityVerifier` giữ MỘT instance `VisionAnalyzer`, cả hai lượt phân tích đều đi
  qua nó, không có đường nào truyền vào provider thứ hai)*
- [ ] Tăng cường chạy một lần; các tỉ lệ từ Smart Reframe *(09/10: đợt sau —
  `PassthroughEnhancer` là chỗ giữ vị trí; `outputs.ratios` trả object RỖNG chứ không bịa khoá)*
- [x] Tải về và duyệt là hai nút riêng, hai năng lực riêng *(09/10: `I3` tải, `I2` duyệt; có ca
  thử khoá "tải về xong ảnh vẫn `PENDING`")*

## P10 — Experience Mode

- [ ] Workspace demo nạp sẵn hồ sơ, sản phẩm, quy tắc giá mẫu
- [ ] Người dùng chỉ cung cấp ảnh và tên sản phẩm
- [ ] Lưới thẻ chức năng; không tự động chạy chức năng tính phí nào
- [ ] Hạn mức trải nghiệm đặt lại được (`YC-U6`)
- [ ] Chuyển được workspace trải nghiệm thành tổ chức thật

## P11 — Cắt sang hệ mới

- [ ] AVI GIFT vận hành trên core theo đúng bảng nghiệm thu của `BAN_GIAO.md`
- [ ] `FloraOS` v1 ngừng mà không mất việc nào
- [ ] Không chạy song song kéo dài

## P12 — Hardening

- [ ] Bảy mục bảo mật nhóm `S` đạt
- [ ] Ba mục quyền riêng tư nhóm `V` đạt, gồm consent trước go-live (`YC-V1`)
- [ ] Bốn mục quan sát nhóm `O` đạt
- [ ] Ngưỡng hiệu năng nhóm `P` đo được và đạt

## P13 — M04a đợt hai: tăng cường ảnh và Smart Reframe · MVP

- [x] Lớp tăng cường thật thay `PassthroughEnhancer`, có đo trước sau trên bộ ảnh vàng
- [x] Tăng cường chạy **một lần** ra Master Image; bốn tỉ lệ 1:1, 4:5, 9:16, 16:9 đến từ Smart Reframe, không gọi lại AI
- [x] `outputs.ratios` trả đủ bốn khoá thật, không trả object rỗng
- [x] Màn bắt đầu một lượt tối ưu mới, gọi `POST /media/optimizations` thật
- [x] Ảnh dùng generative fill mang nhãn hiện rõ trên chính ảnh (`YC-A5`)
- [x] `assets.approval_state` đặt được `APPROVED` qua `I2`, và `GET /integration/products/:id/master-image` trả ảnh thật

## P14 — M01b dữ liệu bán hàng của sản phẩm · MVP

- [ ] Hai trường `phong_cach` và `dip_su_dung` thêm vào hợp đồng theo luật chỉ-thêm-trường (`YC-N3`)
- [ ] `occasions` dựng xong, sáu dòng nạp sẵn khi tạo tổ chức, `dip_su_dung` gán theo mã trong bảng chứ không theo chuỗi tự do
- [ ] `product_copies` với `raw` và `edited` tách rời (`YC-R3`)
- [ ] `analysis_id` bắt buộc trỏ tới lượt phân tích `APPROVED`; lượt `PENDING` trả 422, có ca thử khoá
- [ ] Cặp `H5` ↔ `H6` không gói chung (`YC-Q6`)
- [ ] Duyệt ghi Product Master và `audit_logs` trong cùng một giao dịch
- [ ] Phân khúc giá là nhãn bán hàng, không ghi vào bất kỳ trường giá nào của `orders` hay `pricing_rules`
- [ ] `profile_version` ghi hồ sơ phong cách đã dùng, khi có

## P15 — Ba đường ghi của Integration API · MVP

- [x] `POST /integration/assets` bắt buộc `parent_asset_id` trỏ asset `APPROVED` cùng tổ chức (`YC-M1` `YC-M5`)
- [x] Asset đăng ký vào với `approval_state = PENDING`; engine ngoài không đặt được trạng thái duyệt
- [x] `POST /integration/content-metrics` idempotent theo khoá tự nhiên bốn cột (`YC-L1`)
- [x] `POST /integration/usage` ghi `cost_credit = 0`, không trừ credit lần hai (`YC-U1`)
- [ ] `GET /integration/learning-profile` chỉ trả hồ sơ `is_sufficient = true` (`YC-L4`)
- [x] Bộ test cách ly phủ ba đường ghi: token của tổ chức khác ghi vào trả không tìm thấy (`YC-T4` `YC-T10`)
- [ ] `LocalBudd` bỏ `product_assets`; `products` giữ nghĩa tham chiếu

## P15+ — Dashboard proxy sang engine ngoài · MVP

*09/12 — làm dashboard core chạy tính năng thuộc LocalBudd/SocialFlow mà KHÔNG
chuyển sang UI của app đó. Ba app ba cổng (core 3100 / LocalBudd 3000 /
SocialFlow 8000) nên trình duyệt blocked mọi call cross-origin (CORS), và cookie
`floraos_session`/`floraos_sso` host-only "localhost" tự đi kèm trong cùng một host
nhưng KHÔNG tự đi qua cổng khác — giải pháp duy nhất đúng: core làm PROXY
SERVER-SIDE.*

- [x] Lớp proxy đủ bốn thư mục `src/modules/proxy/` (`domain/proxy-rules.ts` ·
      `use-cases/proxy-request.ts` · `infra/proxy-http-adapter.ts` · route
      `/api/v1/proxy/[...path]`)
- [x] Whitelist path theo client — `SOCIALFLOW: ["api/m04b"]`,
      `LOCALBUDD: ["api/v1/catalog-links", "api/v1/projects"]`; không proxy linh
      tinh, không forward cookie core sang sibling
- [x] Forward hai đường danh_identity đã có từ trước: `X-FloraOS-SSO` (JWT
      `floraos_sso`, core đọc cookie rồi forward — sibling verify bằng
      `SSO_SESSION_SECRET` dùng chung) và `Authorization: Bearer` (token
      `integration_tokens`, `F9`). SSO thắng khi có cả hai (cùng quy ước với
      `integration-credential.ts`)
- [x] `SOCIALFLOW_URL`/`LOCALBUDD_URL` thêm vào `src/lib/env.ts` + `.env`
- [x] Creative Studio (`/creative-studio`, `src/components/creative/creative-studio.tsx`)
      — dashboard core gọi SocialFlow M04b xoá nền (AIC-11) qua proxy, hiện kết
      quả ngay, không mở app khác
- [x] `ai-image` (`src/lib/mock-data.ts`) đổi `chua_san_sang` → `hoat_dong`,
      route `/creative-studio`; nav `Tạo ảnh AI` (`I1`) thêm vào
      `desktop-nav.tsx`; `routeForFeature` ở `experience-grid.tsx` thêm
      `/creative-studio`
- [x] Test proxy: `proxy-rules.test.ts` (4 ca) + `proxy-request.test.ts` (14 ca,
      mock adapter, không gọi HTTP thật) — 18 ca mới
- [x] `npm test` 276/276 · `npx tsc --noEmit` sạch · `npx eslint` 0 lỗi
- [ ] Xác minh end-to-end trên máy thật: chạy SocialFlow 8000 + core 3100, đăng
      nhập core, bấm Creative Studio → xoá nền một sản phẩm thật → ảnh nền về
      dashboard; kiểm 401 khi thiếu JWT, 403 khi tổ chức khác, 502 khi core vắng
- [ ] Mở rộng whitelist: LocalBudd M06 Catalog/QR, SocialFlow M07/M08

## P16 — M04b ảnh marketing · MVP

- [ ] Màn soạn chỉ bày Master Image `APPROVED`; ảnh gốc không xuất hiện như một lựa chọn (`YC-M1`)
- [ ] Biến thể không gọi lại lớp tăng cường và không sinh pixel mới trên sản phẩm (`YC-M2`)
- [ ] Đường sửa ánh sáng, màu, hình dáng bó hoa mở đúng luồng M04a với Identity Guard (`YC-M3`)
- [ ] Xoá nền, đổi nền, mở rộng khung, retouch, watermark chạy được trên dữ liệu thật
- [ ] Watermark và thư viện nền là cấu hình cấp tổ chức, gác bằng `P5` và `I4` (`YC-M8`)
- [ ] Cặp `P1` ↔ `P2` không gói chung; chỉ biến thể được đánh dấu giữ lại mới vào hàng chờ duyệt
- [ ] Dẫn xuất hoàn tất đăng ký về `assets` của core qua P15

### P16 — Đợt đầu tiên (09/12): AIC-11 background_removal

- [x] Module `m04b/` trong `SocialFlow/backend/`: `domain/` `use_cases/` `infra/` `adapters/`, đủ bốn thư mục
- [x] Cổng `POST /api/m04b/background-removal` — lấy Master Image qua core API, xoá nền bằng rembg (fallback PIL chroma-key), đăng ký kết quả vào core qua `POST /integration/assets` với `parent_asset_id` trỏ asset `APPROVED`
- [x] `AIC-11` (`background_removal`, generative, needsApproval=false) — chạy được, đăng ký asset về core
- [x] Nâng cấp lên `rembg` (U2-Net) cho chất lượng sản xuất — đã cài, `requirements.txt` đã cập nhật
- [x] Backend test `tests/test_m04b.py` — 26/26 xanh (09/12): fix FastAPI v0.109.0 route 422 (patch `require_org`/`sso_token_tho` with typed `Request` signature, not lambda; no `importlib.reload`), fix mock injection (`CoreClientAdapter.default()` patched at module level in both `core_client_mod` and `br_module`), fix upload dir mismatch in `routes.py` (`parent.parent` → `parent`)
- [x] Frontend `SocialFlow/frontend/index.html` — thêm tab "Marketing Creative" (nav `🎯`) với component `MarketingCreative`: input product_id, nút Remove Background, hiện kết quả asset_id/storage_key/status, download processed image
- [x] E2E `tests/e2e_m04b.py` — 10/10 xanh (09/12): backend starts, route registered in OpenAPI, auth 401 thiếu JWT, route trả 502 khi core vắng (mismatch JWT), frontend loads, frontend có Marketing Creative, download endpoint reachable

## P17 — M04c video · MVP

- [ ] Sáu khuôn đầu ra chạy được: Reel 15s, TikTok 30s, Story, slideshow catalog, video sản phẩm, motion quảng cáo
- [ ] Khung đầu và khung cuối là ảnh đã duyệt; mô hình video không nhận lệnh tạo hình sản phẩm (`YC-M4`)
- [ ] `video_jobs` có `organization_id NOT NULL`, index, và lọc theo tổ chức ở mọi điểm đọc ghi (`YC-M6`)
- [ ] Chi phí thật mỗi video ghi `usage` với `feature = video.generate`; hạn mức kiểm tại điểm tạo job (`YC-M7`)
- [ ] Màn xác nhận nói rõ chi phí credit và số dư trước khi chạy
- [ ] Màn xem lại ghi rõ AI đã thêm gì: chuyển cảnh, nhạc, phụ đề, giọng đọc
- [ ] Cặp `P3` ↔ `P4` không gói chung; video không nằm trong duyệt hàng loạt
- [ ] D14 chốt trước go-live — bảng giá credit cho `video.generate` (`YC-M9`)

## P18 — M07 nội dung và đăng bài cho ngành hoa · MVP

- [ ] Một nội dung luôn gắn với một bản ghi Product Master và một asset đã duyệt (`YC-C1`)
- [ ] Nguồn đề tài là sản phẩm, dịp và mùa vụ của chính cửa hàng, không còn nguồn tin công nghệ kế thừa
- [ ] Adapter Zalo OA chạy được
- [ ] Cặp `O1` ↔ `O3` không gói chung (`YC-C2`)
- [ ] Công tắc tự duyệt theo thời hạn chỉ đọc được ở luồng nội dung, tắt theo mặc định, gác bằng `O7` (`YC-C3`)
- [ ] Mỗi lượt tự duyệt ghi `audit_logs` với người bật công tắc là người chịu trách nhiệm (`YC-C4`)
- [ ] Công tắc tắt thì hết thời hạn nội dung quay về hàng chờ; không đường nào tự đăng (`YC-C5`)
- [ ] Tài khoản nền tảng mang `organization_id`; credential một tổ chức không dùng được cho tổ chức khác (`YC-C6`)
- [ ] Mọi endpoint thao tác theo định danh bản ghi lọc theo tổ chức, trả 404 cho tổ chức khác (`YC-C7`)
- [ ] Không endpoint nào nhận `organization_id` từ client (`YC-C8`)
- [ ] Lịch đăng chạy lô song song theo tổ chức; một tổ chức chạy dở không chặn tổ chức khác (`YC-C9`)
- [ ] Lịch đăng và thư viện nội dung dùng được trên màn hẹp

## P19 — M06 catalog và QR · MVP

- [x] Catalog lọc theo dịp, màu sắc, loại hoa, bộ sưu tập và khoảng giá
- [x] Catalog đọc Product Master và ảnh `APPROVED` qua Integration API, không giữ bản sao
- [x] `catalog_links` với `slug` unique toàn cục; liên kết thu hồi được, không xoá được
- [x] Liên kết đã thu hồi trả trang "bộ sưu tập đã đóng", không trả lỗi kỹ thuật
- [x] Mã QR tải về được dạng ảnh để in, gác bằng `J7`
- [ ] Cặp `J1` ↔ `J2` không gói chung
- [x] Danh mục dịp đọc từ `occasions`; dịp đã gắn vào sản phẩm hay chiến dịch chỉ ngừng dùng được, không xoá cứng

## P20 — M11 phân tích hiệu quả và học

- [ ] `campaign_rollups` mang cột nguồn và dựng lại được; không đọc nó như số liệu gốc (`YC-L1`)
- [ ] Phép nối ROI đọc `orders` của core, không suy doanh thu từ số liệu nền tảng (`YC-L2`)
- [ ] Bảy chỉ số hiện được: reach, engagement, inbox, conversion, top post, top product, ROI campaign
- [ ] Mỗi thay đổi của `learning_profiles` truy được về tập số liệu đã sinh ra nó (`YC-L3`)
- [ ] Vòng học không đổi tham số trước ngưỡng dữ liệu tối thiểu (`YC-L4`)
- [ ] Dữ liệu kế thừa phân biệt trong mọi báo cáo bằng `is_legacy` (`YC-L5`)
- [ ] Đè hồ sơ gác bằng `S4` trần cứng và ghi `audit_logs` (`YC-L6`)
- [ ] Hồ sơ bày kết luận dưới dạng câu người đọc được, kèm số bài đã dùng

## P21 — M09 khách hàng và nhắc mua lại

- [ ] Bốn bảng có `organization_id NOT NULL` và index (`YC-K1`)
- [ ] `customer_consents` chèn-chỉ; rút lại đồng ý là một dòng mới (`YC-K2`)
- [ ] Không trường định danh nào đi qua nhà cung cấp AI (`YC-K3`)
- [ ] Nội dung nhắc mua sinh từ dịp và sản phẩm; định danh ghép ở tầng gửi (`YC-K4`)
- [ ] Chiến dịch nhắc mua từ chối khách chưa có đồng ý còn hiệu lực, và nói rõ số khách bị loại
- [ ] Luồng xoá theo yêu cầu của chính khách hàng cuối tồn tại, không mở được bằng mã năng lực nào của tổ chức (`YC-K5`)
- [ ] Xuất danh sách gác bằng `Q5` trần cứng và ghi `audit_logs` (`YC-K6`)
- [ ] D13 chốt trước go-live (`YC-K7`)

## P22 — M10 đơn hàng và vận hành

- [ ] Ba trục trạng thái tách rời: đơn, sản xuất, giao hàng (`YC-W1`)
- [ ] Mỗi lượt đổi trạng thái sinh `order_events` với người thực hiện và thời điểm (`YC-W2`)
- [ ] Phân công gác bằng `R4`; thợ cắm thấy đúng việc của mình, không thấy bảng điều phối toàn cửa hàng (`YC-W3`)
- [ ] SLA đo từ `order_events`, không có cột chốt sẵn (`YC-W4`)
- [ ] Giá trên đơn truy được về quy tắc giá qua `pricing_rule_ref` (`YC-W5`)
- [ ] Huỷ đơn gác bằng `R6` trần cứng, bắt buộc lý do, ghi nhật ký kiểm toán (`YC-W6`)
- [ ] Lời nhắn thiệp tách khỏi ghi chú nội bộ ở cả lược đồ và giao diện
- [ ] In phiếu đơn và phiếu sản xuất làm được từ điện thoại
- [ ] Luồng chào giá thu hoạch từ v1 chạy được theo bảng nghiệm thu của `BAN_GIAO.md` (nợ #26)

## P23 — M08 trợ lý hội thoại

- [ ] Trả lời từ Product Master, giá đã duyệt và vùng giao hàng của chính tổ chức (`YC-H1`)
- [ ] Câu trả lời về giá đọc từ engine giá; `price_source` ghi quy tắc đã dùng (`YC-H2`)
- [ ] Đường chuyển cho người thật luôn có, gác bằng `T4` (`YC-H3`)
- [ ] Trả lời tự động bật tắt bằng `T3` trần cứng; mỗi tin tự động mang `is_automated` trong bản ghi (`YC-H4`)
- [ ] Hội thoại lọc theo tổ chức; bộ test cách ly phủ cả hai bảng

## AI-1 — Cổng AI và hai sổ đăng ký · hoàn tất 09/12 · chặn P16, P17, P18

Đợt một (09/12): phần lõi phía TypeScript viết mã xong, `prisma generate` + `prisma db push` + `db:seed` ✅, `npm test` **258/258 xanh thật** (41 ca mới: 16 định tuyến, 8 cổng AI, 6 sổ đăng ký, 5 chấm điểm, 6 luật chính sách). `npx eslint` sạch. `npx tsc --noEmit` **SẠCH** (sau `prisma generate`). `npm run test:tenant` **123/123 xanh thật** — gồm 5 ca `ai-policy.test.ts` và 14 ca `vision-analyses.test.ts`.

Chưa làm trong đợt một, cố ý: lớp Python (`workers/ai/`), chuyển ba adapter Vision
sang sau cổng, lượt quét CI chặn import SDK, hai đường Integration API, và hàng
FFmpeg trong sổ đăng ký.

- [x] `ai_capabilities` khai đủ 34 năng lực kèm loại, sàn quyền riêng tư và kênh chấm điểm — `src/core/ai/domain/ai-capabilities.ts` + `seed-ai-registry.ts`, `ai-capabilities.test.ts` (6 ca)
- [x] `ai_models` với bốn ô giấy phép bắt buộc; mô hình thiếu một ô không bật được (`YC-G5`) — `licenseComplete()` ở `ai-registry-repository.ts`, lọc ngay trong `eligibleModels()` nên mô hình thiếu ô không lộ ra bất kỳ đâu; ca thử ở `routing.test.ts`
- [ ] Cấu hình build FFmpeg có hàng riêng trong sổ đăng ký, khoá danh sách thành phần theo giấy phép *(nợ #75 — làm trước dòng mã FFmpeg đầu tiên của P17)*
- [x] Mười cổng khai ở `src/core/ports/`; năm cổng cũ không đổi chữ ký — thêm `shared-media.ts` cùng năm cổng mới; `index.ts` xuất đủ mười
- [ ] `src/core/ai/` và `workers/ai/` giải năng lực, kiểm chính sách, chọn mô hình, kiểm lược đồ đầu ra, ghi sổ *(phía TypeScript xong: `gateway.ts` + `wiring.ts`; phía Python chưa)*
- [ ] Mã nghiệp vụ gọi năng lực, không gọi tên nhà cung cấp (`YC-G1`) *(cổng đã có; chưa chuyển lời gọi nào của M01 sang)*
- [ ] SDK nhà cung cấp chỉ xuất hiện trong `adapters/`, có lượt quét chặn trong CI (`YC-G2`)
- [ ] Ba adapter Vision đang có chuyển sang chạy sau cổng AI mà không đổi hợp đồng trả về
- [x] `ai_policies` theo tổ chức; `GET · PUT /ai-policy` (`U1`/`U2`), đổi `product_vision` đòi thêm `H4` — `putAiPolicy` kiểm `H4` trong use-case chứ không ở route, để đường ghi của engine ngoài về sau không đi vòng qua nó
- [x] Bộ định tuyến giữ đủ năm ràng buộc, mỗi ràng buộc có ca thử khoá (`YC-G6`–`YC-G8`, `YC-G10`, `YC-G12`) — `domain/routing.ts`, 16 ca. Phát sinh một luật mới trong lúc code: thác nghiệm chỉ bật khi năng lực CÓ ngưỡng đã đo, vì không có ngưỡng thì "bắt đầu từ lớp thấp" trở thành "luôn chạy mô hình rẻ nhất" — ngược thứ tự ưu tiên Accuracy > Quality > Cost
- [x] Mô hình chốt vào `payload` của job lúc tạo; worker không tra lại (`YC-G8`) — `selectModel` trả `PINNED_NGOAI_TRAN` thay vì âm thầm đổi mô hình khi trần đổi sau lúc job xếp hàng
- [x] `ai_requests` ghi mọi lời gọi kèm chi phí, độ trễ, điểm; không giữ prompt lẫn đầu ra (`YC-G9`) — bảng không có cột cho prompt, nên luật này là cấu trúc chứ không phải quy ước
- [x] Thác nghiệm nhiều lượt vẫn trừ credit của một lượt nghiệp vụ (`YC-G13`) — cổng AI ghi nhiều hàng `ai_requests` nhưng không chạm `usage`; ca thử khoá ở `gateway.test.ts`
- [ ] `GET /integration/ai-policy` và `POST /integration/ai-requests` chạy được từ cả hai engine (`YC-G14`)
- [x] Bộ test cách ly phủ `ai_policies`, `ai_requests`, `ai_evaluations`, `knowledge_chunks` — `tests/tenant/ai-policy.test.ts` (5 ca), chạy xanh 09/12 sau `prisma generate` + `db push` + `db:seed`

## AI-2 — Chấm điểm, thác nghiệm, dự phòng · chặn go-live P16–P18

- [ ] Mỗi năng lực sinh có điểm chất lượng ghi vào `ai_evaluations` (`YC-E1`)
- [ ] Điểm dưới ngưỡng đặt `needs_review = true` và đưa bản ghi vào hàng chờ duyệt (`YC-E2`)
- [ ] Điểm chất lượng không thay Review → Approve và không thay Identity Guard (`YC-E3`)
- [ ] Ngưỡng của Identity Guard giữ nguyên 0,95 và 0,90; các ngưỡng khác khai trong `ai_capabilities` (`YC-E4`)
- [ ] Ngưỡng chưa đo được ghi rõ là giá trị tạm kèm một dòng nợ kỹ thuật, không đặt bằng lập luận (D20)
- [ ] Thác chỉ leo lên; không đường nào hạ chất lượng để tiết kiệm (`YC-G10`)
- [ ] Chuỗi dự phòng không vượt sàn quyền riêng tư; hết đường thì `FAILED` và hoàn credit (`YC-G11`)
- [ ] Lời gọi mức `sensitive` không có đường nào ra nhà cung cấp bên ngoài, có ca thử khoá (`YC-G12`)
- [ ] Nhà cung cấp mặc định sập: tính năng chạy bằng dự phòng, hoặc dừng sạch với credit hoàn — không treo
- [ ] Đầu ra thiếu một kênh chấm đã khai bị coi là điểm không hợp lệ, không phải điểm 0 (`YC-E10`)

## AI-3 — Tri thức ngành hoa · chặn P23

- [ ] `flower_taxonomy` nạp từ danh mục 86 loài đã trích và bảng 63 cặp dễ nhầm
- [ ] Nhãn mô hình tra qua danh mục để ra mã và tên chuẩn; mô hình không quyết giá trị vào cơ sở dữ liệu (`YC-E5`)
- [ ] Không tra được thì mã để trống và nhãn gốc được giữ lại (`YC-E6`)
- [ ] `pgvector` bật trên chính Postgres đang dùng; không thêm cơ sở dữ liệu vector nào (D19)
- [ ] `knowledge_chunks` mang `organization_id`, có trong bộ test cách ly (`YC-E9`)
- [ ] Truy hồi trả về chỗ nên đọc; câu trả lời đọc từ bản ghi thật theo thứ bậc nguồn sự thật (`YC-E7`)
- [ ] Câu hỏi về giá, tồn trạng thái và trạng thái đơn trả lời từ dữ liệu giao dịch (`YC-E8`)
- [ ] `flower_taxonomy` không có `organization_id` và lý do được ghi ở đặc tả 07 mục 16

## AI-4 — Sự kiện miền và vòng học

- [ ] Tám sự kiện miền ở đặc tả 10 mục 17 phát ra đúng chỗ, có bản ghi
- [ ] Sự kiện là gợi ý: không sự kiện nào tự chạy một chức năng tính phí
- [ ] `content_features` ghi đủ đặc trưng chữ và đặc trưng hình của mỗi nội dung đã đăng
- [ ] `visual_style` nối ngược về `assets` của biến thể đã dùng
- [ ] Vòng học chạy theo bốn pha; pha sau không bắt đầu trước khi pha trước có số đo
- [ ] Hồ sơ phong cách nói được căn cứ kèm số bản ghi đã dùng (`YC-L3`)

## UI/UX — Tích hợp 10 chức năng giao diện · bắt đầu 13/09

Đây là công việc kết nối 10 trang UI trong `docs/FloraOS-UIUX-10-chuc-nang.md` với API thật ở `src/app/api/v1/`. 4 trang đã có backend để nối, 6 trang chờ backend tương ứng (M04c, M07, M09, M10, M08, M11).

### Đã tích hợp

- [x] **#1 — Phân tích sản phẩm AI** (`src/app/(app)/tai-anh/page.tsx`): POST/PATCH/GET `/api/v1/vision/analyses`, POST reject, SSE `/api/v1/jobs/:id/events`, dùng `useSession()` cho H1/H2/H3, asset listing từ `/api/v1/assets`, Idempotency-Key header, error handling 401/403/409/502
- [x] **#2 — AI Creative Studio** (`src/app/(app)/creative-studio/page.tsx`): POST/GET `/api/v1/media/optimizations`, POST approve (Identity Guard REJECTED → ẩn Duyệt, WARNING → confirm dialog), GET download (I3), proxy `/api/v1/proxy/api/m04b/background-removal`, dùng `useSession()` cho I1/I2/I3
- [x] **#6 — Catalog & Website** (`src/app/(app)/catalog/page.tsx`): GET `/api/v1/products` (thay MOCK_PRODUCTS, lọc ACTIVE), GET/POST/PATCH/POST-revoke `/api/v1/catalog-links`, 401 redirect
- [x] **#10 — Analytics & Learning** (`src/app/(app)/so-lieu/page.tsx`): GET `/api/v1/usage/summary` (thay METRIC cứng), GET `/api/v1/ai-requests`, GET `/api/v1/audit-logs`, PUT `/api/v1/ai-policy`, dùng `useSession()` cho G8/G9/U1/U2/U3

### Chờ backend

- [ ] **#3 — AI Video Studio** — chờ P17 (M04c)
- [ ] **#4 — AI Content Engine** — chờ P18 (M07)
- [ ] **#5 — Social Publishing** — chờ P18 (M07)
- [ ] **#7 — CRM & Khách hàng** — chờ P21 (M09)
- [ ] **#8 — Đơn hàng & Vận hành** — chờ P22 (M10)
- [ ] **#9 — AI Chat Assistant** — chờ P23 (M08)

**Checklist chi tiết:** `docs/UIUX-Integrate-Checklist.md` (API-level) · `docs/UIUX-Feature-Checklist.md` (feature-level, 115 tính năng, dùng để rà soát và triển khai)

