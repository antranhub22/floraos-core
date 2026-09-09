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
**CHƯA xác minh** — sandbox phiên này không có Docker, không ra được mạng tới
`binaries.prisma.sh` (`npx prisma generate`/`db push` đều 403 ngay ở bước tải
`schema-engine`), và `node_modules` cài cho kiến trúc khác máy chạy hiện tại
(thiếu `@rollup/rollup-linux-arm64-gnu`, nên cả `npm test` lẫn `npm run
test:tenant` đều không khởi động được). Chỉ chạy được `npx tsc --noEmit` cho
phần không chạm kiểu sinh từ Prisma. Trước khi tích các ô dưới, người tiếp
theo (tài khoản Claude khác hoặc người thật, trên máy có mạng — xem mục 7 của
`TRANG_THAI.md`) chạy:

```bash
docker compose up -d
npx prisma generate && npx prisma db push
npm test && npm run test:tenant
npx tsc --noEmit
```

...và sửa mọi lỗi phát sinh. Đã tự đọc lại toàn bộ mã theo đúng quy ước của
`branches`/`workspaces` (P1) và đối chiếu từng trường với `07-database-specification.md`,
nhưng đó không thay được một lần chạy thật — xem `TECHNICAL_DEBT.md` #18.

- [ ] `assets` đủ cột metadata bắt buộc (`YC-A4`) — `prisma/schema.prisma`, `AssetRepository.create`
- [ ] `parent_asset_id` và `version`; asset gốc không bao giờ bị ghi đè (`YC-A1` `YC-A2` `YC-A3`) — `domain/asset-rules.ts` (`nextVersion`), `register-asset.ts`
- [ ] `generated_flags` không mặc định ngầm (`YC-A5`) — `requiresExplicitGeneratedFlags`/`isValidGeneratedFlags`, từ chối ở `register-asset.ts` nếu thiếu
- [ ] `generation_jobs` ba trục tách rời (`YC-J1` `YC-J2`) — `prisma/schema.prisma`, `domain/job-rules.ts`
- [ ] `COMPLETED/REJECTED` không phải `FAILED`; retry trả 409 (`YC-J3`) — `canRetry`, `retry-job.ts`
- [ ] `CANCELLED` huỷ được job `PENDING` (`YC-J4`) — `canCancel`, `cancel-job.ts`
- [ ] Worker lấy việc bằng `SKIP LOCKED` + `LISTEN/NOTIFY` (`YC-J7`) — `GenerationJobRepository.claimNext` (SQL thô), `PostgresQueueProvider.enqueue` (`pg_notify` trong giao dịch), test `tests/tenant/skip-locked-claim.test.ts` chứng minh hai lời gọi đồng thời không trùng job — **chưa chạy được**
- [ ] Không `subprocess`, không job qua HTTP (`YC-J8`) — đúng theo thiết kế (không có mã nào gọi `subprocess`/HTTP nội bộ cho job); `workers/` P3 chưa có worker Python thật (M01/M04a ở P5/P9)
- [ ] Nhật ký cộng dồn, nối lại được bằng `Last-Event-ID` (`YC-J9`) — bảng `job_events` (đặc tả 07 mục 6.1), `JobEventRepository`, route SSE `GET /jobs/:id/events` đọc header `Last-Event-ID`/`?after=`
- [ ] Tiến trình quét job treo quá 15 phút (`YC-J10`) — `scanStuckJobs`/`GenerationJobRepository.markStuckAsFailed`, script `scripts/scan-stuck-jobs.ts` (chưa gắn cron thật — việc triển khai, không phải việc mã)
- [ ] Một bảng `usage` duy nhất (`YC-U1` `YC-U2`) — `prisma/schema.prisma`, không repo/module nào khác dựng bảng usage riêng
- [ ] Hạn mức kiểm trước khi job vào bảng, cùng một giao dịch (`YC-U3`) — `enqueue-job.ts` (`runInTransaction`: kiểm hạn mức → ghi usage → tạo generation_jobs → NOTIFY), `tests/tenant/enqueue-job.test.ts` — **chưa chạy được**
- [ ] Worker không ghi `usage` (`YC-U4`) — đúng theo thiết kế; `UsageRepository` chỉ được gọi từ `src/modules/usage` và `enqueue-job.ts` (phía core), không có mã Python nào ghi bảng này
- [ ] `Idempotency-Key` trên mọi endpoint tạo job (`YC-U7`) — `enqueueJob` bắt buộc `idempotencyKey`, `domain/idempotency.ts` đọc header — P3 chưa có endpoint tạo job cụ thể theo feature (`/vision/analyses`, `/media/optimizations` ở P5/P9) để nối header thật vào; cơ chế đã sẵn cho các endpoint đó gọi `enqueueJob`
- [ ] `audit_logs` ghi mọi hành động duyệt (`YC-R4`) — hạ tầng dựng đủ (bảng, `AuditLogRepository`, `recordAuditLog`, `GET /audit-logs`), nhưng **chưa có hành động duyệt nào để ghi** — P3 không có endpoint `*.approve` (`H3`/`I2` ở P5/P9); mục này chỉ thật sự "xong" khi endpoint duyệt đầu tiên gọi `recordAuditLog` trong cùng giao dịch

## P4 — Hồ sơ

- [ ] `business_profiles` và `brand_profiles` tách đôi, mỗi tổ chức một bản ghi
- [ ] Nhập một lần, dùng lại xuyên module

## P5 — M01 phân tích ảnh

- [ ] **Bộ ảnh vàng 50–100 ảnh đạt nghiệm thu** theo `../kien-truc/BO_ANH_VANG.md`
- [ ] Hợp đồng `PhanTichSanPhamHoa` lấy nguyên từ `Schema.json`, không khai lại tay (`YC-N3`)
- [ ] Cổng `VisionAnalyzer` ở mức hợp đồng JSON (`YC-N2`)
- [ ] `OpenAIStructuredProvider` chạy được sau cổng
- [ ] `count_engine.py` và `color_engine.py` chuyển sang, có test hồi quy trên bộ ảnh vàng
- [ ] Kết quả lưu `raw` và `edited` tách rời (`YC-R3`)
- [ ] Kết quả không ghi thẳng Product Master; phải qua duyệt (`YC-R1`)
- [ ] `approved_by` và `approved_at` có trên bản ghi (`YC-R2`)
- [ ] Ma trận chọn công nghệ hoàn thành, có cột soát cách ly tenant (`YC-N5` `YC-N6`)

## P6 — M02 giá và M03 tra cứu

- [ ] `pricing.ts` và bất biến làm tròn chuyển sang, test hai phía xanh
- [ ] Quy tắc giá theo tổ chức, có thể theo chi nhánh
- [ ] **Chốt cách tính chi phí lá và cành trang trí** — quy ước đếm để loại này không có số lượng
- [ ] Tra cứu chạy trên Postgres; `locTraCuu.test.ts` xanh

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
