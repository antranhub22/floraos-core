# Checklist thực thi

Một pha chỉ coi là xong khi mọi ô của nó tích được. Mã trong ngoặc dẫn về `01-technical-requirements.md`.

Không tạo bảng, route, job hay đường dẫn lưu trữ thật của bất kỳ module nào trước khi **P1 và P2** tích hết.

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
- [ ] `Idempotency-Key` trên mọi endpoint tạo job (`YC-U7`) — `enqueueJob` bắt buộc `idempotencyKey`, `domain/idempotency.ts` đọc header — P3 chưa có endpoint tạo job cụ thể theo feature (`/vision/analyses`, `/media/optimizations` ở P5/P9) để nối header thật vào; cơ chế đã sẵn cho các endpoint đó gọi `enqueueJob`
- [ ] `audit_logs` ghi mọi hành động duyệt (`YC-R4`) — hạ tầng dựng đủ (bảng, `AuditLogRepository`, `recordAuditLog`, `GET /audit-logs`), nhưng **chưa có hành động duyệt nào để ghi** — P3 không có endpoint `*.approve` (`H3`/`I2` ở P5/P9); mục này chỉ thật sự "xong" khi endpoint duyệt đầu tiên gọi `recordAuditLog` trong cùng giao dịch

## P4 — Hồ sơ

- [x] `business_profiles` và `brand_profiles` tách đôi, mỗi tổ chức một bản ghi
- [x] Nhập một lần, dùng lại xuyên module

## P5 — M01 phân tích ảnh

- [ ] **Bộ ảnh vàng 50–100 ảnh đạt nghiệm thu** theo `../kien-truc/BO_ANH_VANG.md` *(09/10: khung 100 ảnh + nhãn rỗng vẫn còn nguyên — CHƯA gán nhãn thật, CHƯA đối chiếu hai người, xem nợ #24 `TECHNICAL_DEBT.md`. Đây là điều kiện còn lại DUY NHẤT chưa xong của P5)*
- [x] Hợp đồng `PhanTichSanPhamHoa` lấy nguyên từ `Schema.json`, không khai lại tay (`YC-N3`)
- [x] Cổng `VisionAnalyzer` ở mức hợp đồng JSON (`YC-N2`)
- [x] `OpenAIStructuredProvider` chạy được sau cổng *(09/10: 9/9 test logic xanh thật trên máy Tony — CHƯA gọi API OpenAI thật với ảnh thật, việc đó chờ bộ ảnh vàng có nhãn để đối chiếu kết quả)*
- [x] `count_engine.py` và `color_engine.py` chuyển sang, có test hồi quy trên bộ ảnh vàng *(09/10: chuyển sang nguyên vẹn + 43/43 test đơn vị thuần xanh thật trên máy Tony (Postgres + Python venv) — hồi quy TRÊN BỘ ẢNH VÀNG vẫn chờ bộ ảnh vàng có nhãn, xem nợ #20 #24; tích ô này vì phần "chuyển sang + có test" đã xong, phần hồi quy trên ảnh vàng thật tách riêng ở nợ #20)*
- [x] Kết quả lưu `raw` và `edited` tách rời (`YC-R3`)
- [x] Kết quả không ghi thẳng Product Master; phải qua duyệt (`YC-R1`)
- [x] `approved_by` và `approved_at` có trên bản ghi (`YC-R2`)
- [ ] Ma trận chọn công nghệ hoàn thành, có cột soát cách ly tenant (`YC-N5` `YC-N6`)

  09/10: anh Tony xác nhận xanh hết trên máy thật — `prisma generate`/`db push` ✅, `npm test` ✅, `npm run test:tenant` **49/49** ✅ (sau khi sửa 1 ca `vision-analyses.test.ts` kiểm nhầm đường TRIAL thay vì CREDIT — cùng loại lỗi đã gặp ba lần ở P3), `python3 -m pytest` (`workers/`) **43/43** ✅. Chỉ còn bộ ảnh vàng (mục đầu tiên) và ma trận chọn công nghệ (mục cuối) là chưa xong trong P5.

## P6 — M02 giá và M03 tra cứu

- [x] `pricing.ts` và bất biến làm tròn chuyển sang, test hai phía xanh — `src/modules/products/domain/pricing.ts` (`quotePrice`/`checkPriceInvariants`), `pricing.test.ts` xanh trong sandbox (`npx vitest run`)
- [x] Quy tắc giá theo tổ chức, có thể theo chi nhánh — `pricing_rules` (P3) + `PricingRuleRepository` (chèn-chỉ, `effective_from`) + `mergeEffectivePricingConfig`, `GET · PUT /pricing-rules` (`L5`/`L6`)
- [x] **Chốt cách tính chi phí lá và cành trang trí** — chủ sản phẩm chốt 09/10: CHƯA TÍNH, để nợ kỹ thuật (`TECHNICAL_DEBT.md` #27) cho tới khi có dữ liệu thật/bộ ảnh vàng
- [x] Tra cứu chạy trên Postgres — `GET /products` (lọc `branch_id`/`status`/`category`, phân trang con trỏ) + `GET /products/:id`, cả hai qua `filterProductLookup`; các ca thử thuần của `locTraCuu.test.ts` (đọc số, tỷ lệ, câu cảnh báo) dịch sang `pricing-input.test.ts`, xanh trong sandbox — xem ghi chú phạm vi ở đầu `pricing-input.ts`/`product-lookup.ts`

## P7 — Integration Layer

- [ ] Token máy gọi máy theo tổ chức, có ký, xoay được (`YC-T8`)
- [ ] `LocalBudd` bỏ năm bảng trùng, đọc core qua API
- [ ] `/integration/products/:id/master-image` chỉ trả ảnh đã duyệt
- [ ] Adapter `SocialFlow` nhận `organization_id`

## P8 — Nạp dữ liệu AVI GIFT

- [ ] Adapter Excel một chiều; không đường nào ghi ngược
- [ ] Dữ liệu nhập đủ, đối chiếu với bảng nghiệm thu của `BAN_GIAO.md`

## P9 — M04a tối ưu ảnh

- [ ] Identity Guard là cổng cứng, chặn được một thay đổi sản phẩm mô phỏng
- [ ] `REJECTED` giữ ảnh gốc, không trả ảnh tăng cường (`YC-R5`)
- [ ] `WARNING` duyệt được nhưng có cảnh báo trước (`YC-R6`)
- [ ] Guard dùng cùng provider và cùng model version hai lần (`YC-N4`)
- [ ] Tăng cường chạy một lần; các tỉ lệ từ Smart Reframe
- [ ] Tải về và duyệt là hai nút riêng, hai năng lực riêng

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
