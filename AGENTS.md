# floraos-core — ngữ cảnh cho agent

Nền tảng SaaS đa tenant cho cửa hàng hoa. `src/` (Next.js + Prisma/Postgres) → `workers/` (Python, xử lý ảnh) → Postgres dùng chung.

**Đọc trước khi làm bất cứ việc gì:** `docs/kien-truc/FLORAOS_SAAS_TARGET_ARCHITECTURE_V2.md` (Level 1) và `docs/kien-truc/TRANG_THAI.md` (đang ở đâu).

## Lệnh

| Việc | Lệnh |
|---|---|
| Cài | `docker compose up -d && npm i && npx prisma generate && npx prisma db push && npx prisma db seed` |
| Chạy web | `npm run dev` |
| Chạy worker | `cd workers && python -m media_ai.worker` |
| Test web | `npm test` |
| Test đầu cuối | `npm run test:e2e` |
| Test worker | `cd workers && python3 -m pytest tests -q` |
| Typecheck | `npx tsc --noEmit` |
| Dựng CSDL cho test | `npm run db:test:setup` — **chạy một lần** sau `docker compose up -d` |
| Test cách ly tenant | `npm run test:tenant` — *bắt buộc xanh trước mọi merge* |

## Quy ước

- **Lược đồ `snake_case` tiếng Anh.** Mã nguồn tiếng Anh. Thuật ngữ nghiệp vụ tiếng Việt chỉ nằm ở nhãn giao diện và tài liệu, không vào lược đồ. *(Khác FloraOS cũ — repo ấy dùng PascalCase tiếng Việt.)*
- **Mọi bản ghi thuộc tenant có `organization_id`.** Không ngoại lệ, kể cả bảng tra cứu và demo workspace. Kiểm ở tầng repository, không ở route.
- **`organization_id` giải từ phiên đăng nhập phía máy chủ.** Không bao giờ nhận từ body/query của client.
- `domain/` không được import Prisma. Đó là điều kiện để test luật nghiệp vụ không cần cơ sở dữ liệu.
- Mọi module đủ bốn thư mục `domain/ use-cases/ infra/ adapters/`. Viết `use-cases`, không viết `usecases`.
- Route dưới `/api/v1/`. Endpoint duyệt tách khỏi endpoint sinh kết quả (`/x/[id]/approve`).
- Quyền theo mã năng lực, không theo vai UI. Ba lớp cắt: mặc định → bảng công tắc → **trần cứng cắt sau cùng**.
- Đường dẫn lưu trữ: `org/<organization_id>/<product_id>/<asset_id>.<ext>`.
- Job: ba trục `status` / `stage` / `result` tách rời. `COMPLETED + result=REJECTED` **không phải** `FAILED`.
- `usage` ghi ở phía core **tại điểm tạo job**, không ghi ở worker.
- Worker Python lấy việc bằng `SELECT … FOR UPDATE SKIP LOCKED` + `LISTEN/NOTIFY`. **Cấm `subprocess` + parse stdout. Cấm chạy job qua HTTP.**
- Provider AI chỉ gọi qua cổng — mười cổng ở `src/core/ports/`. Không module nào gọi thẳng API nhà cung cấp.
- **Mã nghiệp vụ gọi một NĂNG LỰC, không gọi một nhà cung cấp** (D15). Mọi lời gọi AI đi qua cổng AI ở `src/core/ai/`; SDK của nhà cung cấp chỉ được xuất hiện trong `adapters/`. Mô hình là một hàng trong `ai_models`, không phải một hằng trong mã.
- **Mô hình không vào production khi thiếu một trong bốn ô giấy phép** (D18): `license`, `commercial_use`, `territory`, `allowed_use`. Bộ lọc nằm ở `eligibleModels()`, nên mô hình thiếu ô không lộ ra cả trong danh sách để chọn.
- **Sàn quyền riêng tư cắt sau cùng**, cùng tính chất với trần cứng của RBAC: lời gọi `SENSITIVE` không có đường nào ra nhà cung cấp ngoài, kể cả qua bước dự phòng.

## Thứ tự pha — điều kiện chặn

Lộ trình P0–P12 ở `FLORAOS_SAAS_TARGET_ARCHITECTURE_V2.md` mục 15.

**Không tạo bảng, route, job hay đường dẫn lưu trữ thật của bất kỳ module nào trước khi P1 (tenant) và P2 (RBAC) đạt nghiệm thu.** Làm ngược sẽ sinh ra lược đồ thiếu `organization_id`, rồi phải migration lại toàn bộ khi đã có dữ liệu thật. Đây là lỗi tốn kém nhất của cả lộ trình.

Lộ trình có thêm hai tuyến kể từ 09/11: **Tuyến B** (P13–P23, bộ tính năng hoàn
chỉnh cho cửa hàng hoa; bảy pha đầu là MVP) và **Tuyến C** (AI-1…AI-4, nền AI —
cắt ngang mọi pha). Bảng đầy đủ ở `FLORAOS_SAAS_TARGET_ARCHITECTURE_V2.md` mục
15; đặc tả nền AI ở `docs/dac-ta/10-ai-orchestration.md`.

Trạng thái hiện tại: **AI-1 đợt một — hoàn tất 09/12.** Năm bảng mới, mười cổng, `src/core/ai/` + `src/modules/ai-governance/`, bốn route, `U1`–`U4`. `npm test` **258/258 xanh thật** (41 ca mới), `npx eslint` sạch. `npx tsc --noEmit` **SẠCH** (sau `prisma generate` + `prisma db push` + `db:seed`). `npm run test:tenant` **123/123 xanh thật** (14 tệp). Chưa làm, cố ý: lớp Python `workers/ai/`, chuyển ba adapter Vision sang sau cổng, lượt quét CI chặn import SDK, hai đường Integration API. Chi tiết ở `docs/dac-ta/Checklist_Thuc_Thi.md` mục AI-1.

Trạng thái trước đó: **P8 — nạp dữ liệu AVI GIFT, phần danh mục giá viết mã
xong, chưa xác minh trên Postgres thật** — module `src/modules/avi-gift-import/`
(`domain/catalog-mapping.ts` thuần + `use-cases/{bootstrap-avi-gift-organization,
import-catalog}.ts`), `scripts/nap-avi-gift/doc-excel.py` (Python, đọc Excel
thật → `catalog.json`) + `scripts/nap-avi-gift-vao-core.ts` (orchestrator).
1.316 SKU, `npm test` 140/140. Còn lại: 9–14 sản phẩm có ảnh thật chưa nạp
(nợ #34), lượt nạp thật + đối chiếu `BAN_GIAO.md` chưa chạy. Chi tiết đầy đủ
ở `docs/kien-truc/TRANG_THAI.md` mục 1.

P7 (`floraos-core`) nghiệm thu xong trước đó trên Postgres thật (`test:tenant`
69/69) — token máy gọi máy (`integration_tokens`, `YC-T8`), mã năng lực mới
`F9` (114 mã, 31 trần cứng), sáu route `/api/v1/integration/*` (đặc tả 06
mục 11).

P6 nghiệm thu xong trước đó. M02
(`quotePrice`/`checkPriceInvariants`/`checkPriceGuard`, thu hoạch R3/R4/R5) +
`pricing_rules` CRUD chèn-chỉ (`effective_from` giữ lịch sử) + `GET·PUT
/pricing-rules` (`L5`/`L6`). M03 (`filterProductLookup`) + `GET·POST /products` +
`GET·PATCH /products/:id`. Phạm vi hẹp lại theo xác nhận chủ sản phẩm 09/10:
không dựng luồng "thẻ chào giá" (`pricing_card`, C1–C28 — nợ #26), chi phí
lá/cành trang trí để nợ kỹ thuật (#27). Anh Tony chạy bốn lệnh xác minh trên
Terminal Mac thật — xanh toàn bộ, không phát sinh lỗi phải sửa (`npm test`
117/117 gồm 36 ca mới, `npm run test:tenant` gồm 10 ca mới của P6).

P5 nghiệm thu phần lõi trước đó — 49/49 `test:tenant` xanh, 43/43 `pytest`
xanh, trên Postgres thật. M01 — hợp đồng Vision + `OpenAIStructuredProvider` +
`count_engine`/`color_engine` chuyển sang + worker `SKIP LOCKED`/`LISTEN` +
route `/vision/analyses*`, đã xác minh trên máy thật của anh Tony. Còn hai
việc chặn P5 nghiệm thu tuyệt đối, không chặn P6: bộ ảnh vàng chưa gán nhãn
thật (khung 100 ảnh đã dựng, `scripts/xay-dung-bo-anh-vang.py` —
`docs/kien-truc/BO_ANH_VANG.md` mục 8, nợ #24) và ma trận chọn công nghệ chưa
làm. Chi tiết đầy đủ ở `docs/kien-truc/TRANG_THAI.md` mục 1 và
`TECHNICAL_DEBT.md` #19-29.

## Luật thu hoạch

Mã lấy từ `FloraOS` cũ, `LocalBudd` hoặc `SocialFlow` **phải có hạng trong `HARVEST_MANIFEST.md`**: REUSE / EXTEND / ADAPTER. Chép mã sang mà không xếp hạng là lỗi chặn ở review.

**Luật nghiệp vụ đi kèm test khoá nó.** Test xanh trên repo này thì mới coi là chuyển xong. Chưa có test thì chưa xong, dù mã đã chạy.

Xếp hạng sai chiều nào cũng tốn. Bản đồ thu hoạch từng xếp `count_engine.py` là EXTEND vì cho rằng nó phụ thuộc `openpyxl`; mã thật chỉ import `numpy` và `scipy`. Đọc mã trước khi xếp hạng, đừng xếp theo trí nhớ.

## Chín câu hỏi trước khi viết mã

1. Hạng mục này xếp hạng gì trong REUSE / EXTEND / ADAPTER / BUILD?
2. Nếu REUSE hoặc EXTEND: nguồn ở repo nào, tệp nào, bao nhiêu dòng?
3. Luật nghiệp vụ đi kèm được khoá bởi test nào? Test đó đã chép sang chưa?
4. Entity chạm tới thuộc core hay thuộc engine ngoài?
5. Đã có `organization_id` chưa?
6. Thao tác này dài bao lâu — có phải là job không?
7. Có ghi `usage` không?
8. Kết quả có cần duyệt trước khi thành dữ liệu chính thức không?
9. Năng lực nào gác nó? Năng lực duyệt có tách riêng không?
10. Hạng mục có gọi AI không? Nếu có: năng lực nào trong `ai_capabilities`, cổng nào trong mười cổng, và lời gọi đi qua `callCapability` chứ không qua SDK nhà cung cấp?
11. Mô hình định dùng đã có hàng trong `ai_models` với đủ bốn ô giấy phép chưa? Mức quyền riêng tư của dữ liệu đi vào là gì?

Xếp hạng BUILD cho thứ đã tồn tại ở một trong ba repo là lỗi phải chặn ở review.

## Bản đồ

*(Điền dần khi có mã thật.)*

| Vùng | Đường dẫn | Ghi chú |
|---|---|---|
| Ngữ cảnh tenant | `src/core/tenancy/tenant-context.ts` | `TenantContext`, `scopedWhere`, `scopedData` — luật thuần, không import hạ tầng |
| Client cơ sở dữ liệu | `src/core/tenancy/infra/prisma.ts` | thể hiện `PrismaClient` duy nhất; chỉ tệp trong `infra/` được import |
| Hình dạng lỗi và cookie | `src/core/http/` | `AppError` tám mã · cookie phiên · `handle()` bọc route |
| Năng lực & quyền | `src/core/rbac/` | `capability-catalog.ts` (**119 mã, 34 trần cứng** — 113 tới P2, `F9` ở P7, `H4` theo D5-d, `U1`–`U4` ở AI-1) · `permission-resolver.ts` (trần cứng) · `capabilities.ts` (`hasCapability`/`requireCapability`) |
| Harvest R2 | `src/lib/maChucNang.ts` + `tests/maChucNang.test.ts` | nguyên vẹn từ `FloraOS/floraos-web/src/lib/`, xanh qua `npm run test:harvest` (`node:test`, không qua vitest/tsc — xem `vitest.config.ts`, `tsconfig.json`, `eslint.config.mjs`) |
| Bảng quyền | `src/modules/organization/infra/capability-repository.ts` | `role_capabilities` (lớp một) · `capability_overrides` (lớp hai, theo tổ chức) |
| Công tắc tự duyệt | `src/modules/organization/domain/self-approval-policy.ts` | `cho_phep_tu_duyet`, đọc từ `organizations.settings` |
| Cổng ra ngoài | `src/core/ports/` | Mười cổng: `VisionAnalyzer` · `LLMProvider` · `StorageProvider` · `QueueProvider` · `PublisherProvider` · `SegmentationProvider` · `ImageProvider` · `VideoProvider` · `SpeechProvider` · `EmbeddingProvider`, cộng kiểu dùng chung ở `shared-media.ts`. **Adapter không ghi kho tệp** — nó trả byte hoặc handle tạm, use-case ghi qua `StorageProvider` |
| Nền AI (AI-1) | `src/core/ai/` | `domain/ai-capabilities.ts` (34 năng lực `AIC-01`–`AIC-34`, nguồn của lượt seed) · `domain/routing.ts` (năm ràng buộc D17; `cascade` chỉ bật khi có ngưỡng) · `domain/privacy.ts` (sàn cắt sau cùng) · `domain/evaluation.ts` (điểm tổng = kênh THẤP NHẤT; thiếu kênh là KHÔNG HỢP LỆ chứ không phải điểm 0) · `gateway.ts` (`callCapability`, không import Prisma) · `wiring.ts` (chỗ duy nhất nối repo thật) · `infra/` (bốn repository + `seed-ai-registry.ts`) |
| Chính sách AI của tổ chức | `src/modules/ai-governance/` | `domain/policy-rules.ts` (chính sách là TRẦN, chỉ siết được, không nới) · use-case `get/put-ai-policy`, `list-ai-requests`. Route `/api/v1/{ai-policy,ai-capabilities,ai-requests,ai-requests/summary}` (`U1`/`U2`/`U3`); đổi `AIC-01` đòi thêm `H4` và kiểm trong use-case, không ở route |
| Module tổ chức | `src/modules/organization/` | đăng ký, đăng nhập, phiên, đổi tổ chức; repository của cả bảy bảng nền |
| Module | `src/modules/<tên>/` | bốn thư mục mỗi module |
| API | `src/app/api/v1/` | `auth/{signup,login,logout,me}` · `organizations` · `session/organization` (P1) · `organizations/current` · `members` · `roles` · `branches` · `workspaces` (P2) |
| Lược đồ | `prisma/schema.prisma` | 27 bảng. Năm bảng nền AI thêm ở AI-1: `ai_capabilities`/`ai_models` **không mang `organization_id`** (sổ đăng ký cấp nền tảng, ngoại lệ có chủ đích của Luật 1, ghi ở đặc tả 07 mục 15), còn `ai_policies`/`ai_requests`/`ai_evaluations` thuộc tenant như mọi bảng khác. Worker đọc bản sinh sẵn, không tự khai bảng |
| Chuỗi kết nối | `prisma.config.ts` | Prisma 7 không nhận `url` trong `schema.prisma` nữa |
| Vai hệ thống | `prisma/seed.ts` | bốn vai, `organization_id = null` |
| Worker phân tích ảnh | `workers/vision/` | M01 — P5. `contracts/` (Schema.json/Prompt.md nguyên vẹn) · `analyzer/` (`count_engine.py`/`color_engine.py`/`tu_dien.py`, REUSE/EXTEND) · `providers/` (`base.py` cổng, `openai_structured.py` BUILD) · `jobs/worker.py` (`SKIP LOCKED`+`LISTEN`, D6-1). Test: `workers/tests/vision/` |
| Module sản phẩm | `src/modules/products/` | `products`/`product_variants`/`product_images`/`product_analyses`/`pricing_rules` (đặc tả 07 mục 9). `product-analysis-rules.ts` (thuần: `canEditAnalysis`/`canApproveAnalysis`/`resolveEffectiveAnalysis` = `edited ?? raw`). Route `/api/v1/vision/analyses*` (`H1`/`H2`/`H3`) — duyệt ghi Product Master + `audit_logs` trong một giao dịch |
| M02 giá (P6) | `src/modules/products/domain/{pricing,price-guard,pricing-input,pricing-rules}.ts` | `quotePrice`/`checkPriceInvariants` (thu hoạch R3+R4) · `checkPriceGuard` (R5, chỉ phần `chanGia.ts` — `sanTran.ts` không thuần, nợ #29) · `pricing-rules.ts` (danh mục 4 khoá, hợp nhất tổ chức/chi nhánh). `infra/pricing-rule-repository.ts` CHÈN-CHỈ (`effective_from`, không `upsert`). Route `GET·PUT /pricing-rules` (`L5`/`L6`). KHÔNG có luồng "thẻ chào giá" (`pricing_card`, nợ #26) |
| M03 tra cứu (P6) | `src/modules/products/domain/product-lookup.ts` | `filterProductLookup` — cắt khối `pricing` theo `L5`, thu hoạch hình dạng từ `locTraCuu.ts` (dữ liệu giá đã tính sẵn theo mã, thuộc `pricing_card`, không mang sang). Route `GET /products` (lọc `branch_id`/`status`/`category`, phân trang con trỏ) + `GET·PATCH /products/:id` (`L1`/`L3`, `ARCHIVED` đòi thêm `L4`) + `POST /products` (`L2`) |
| Dựng bộ ảnh vàng | `scripts/xay-dung-bo-anh-vang.py` | Chọn ảnh rõ nhất mỗi sản phẩm từ `BoAnhVang/` (ngoài git), ghi khung `golden/images`+`golden/labels`+`manifest.csv`. KHÔNG tự đếm — xem `docs/kien-truc/BO_ANH_VANG.md` |
| Worker tối ưu ảnh | `workers/media_ai/` | M04a — P9 |
| Test cách ly tenant | `tests/tenant/` | sáu tệp (bốn của P1/P2, cộng `skip-locked-claim.test.ts` và `enqueue-job.test.ts` của P3); `npm run test:tenant` |
| Đồ dùng cho test | `tests/helpers/` | dọn bảng (mười bốn bảng từ P3), dựng hai tổ chức bằng đúng luồng đăng ký thật |
| Module asset | `src/modules/assets/` | `AssetRepository`, `LocalDiskStorageProvider` (adapter tạm — nợ #15), route `/api/v1/assets*`, `/api/v1/storage/[...key]` |
| Module job | `src/modules/jobs/` | `GenerationJobRepository` (`claimNext` = `SKIP LOCKED`), `JobEventRepository`, `PostgresQueueProvider`, `enqueueJob`, route `/api/v1/jobs*` (gồm SSE `events`) |
| Module usage | `src/modules/usage/` | `UsageRepository`, bảng giá `domain/pricing.ts` (nợ #14), route `/api/v1/usage*` |
| Module audit | `src/modules/audit/` | `AuditLogRepository`, `recordAuditLog` — chưa có nơi gọi tới khi duyệt đầu tiên ở P5 |
| Module hồ sơ | `src/modules/profiles/` | `BusinessProfileRepository`/`BrandProfileRepository` — một bản ghi mỗi tổ chức (`@@unique([organization_id])`), `upsert` = ngữ nghĩa PUT (trường vắng mặt thành null). Route `business-profile`/`brand-profile` dưới `/api/v1/`, gác bằng `F1`/`F2` sẵn có |
| Quét job treo | `scripts/scan-stuck-jobs.ts` | `YC-J10`, chạy bằng cron ngoài, chưa gắn lịch thật |
| Module tích hợp (P7) | `src/modules/integration/` | `integration_tokens` (`YC-T8`, HMAC `INTEGRATION_TOKEN_SECRET`) · `resolve-integration-context.ts` (`requireIntegrationContext` + `toTenantContext` — tái dùng thẳng use-case của phiên người dùng, `capabilities` luôn rỗng) · `issue/rotate/revoke/list-integration-token.ts` (`F9`) · `get-master-image.ts` · `check-capabilities.ts`. Route quản trị `/api/v1/integration-tokens*` (`F9`) · route máy gọi máy `/api/v1/integration/*` (products, products/:id/master-image, business-profile, brand-profile, jobs, usage, capabilities/check) |
| Module nạp AVI GIFT (P8) | `src/modules/avi-gift-import/` | `domain/catalog-mapping.ts` thuần (`mapCatalogRowToProduct`/`deriveProductStatus`/`validateCatalogRow`) · `use-cases/bootstrap-avi-gift-organization.ts` (tổ chức `SINGLE`, KHÔNG tái dùng `signUp` vì đó cố định `EXPERIENCE`+trial) · `use-cases/import-catalog.ts` (idempotent theo `code`, gọi thẳng `ProductRepository`). Nguồn Excel đọc bằng Python NGOÀI `src/` — xem `scripts/nap-avi-gift/doc-excel.py` |
| Tài liệu kiến trúc | `docs/kien-truc/` | 8 tệp, xem `TRANG_THAI.md` |

## Bẫy

*(Mỗi lần một điều bất ngờ làm mất hơn một giờ, thêm một dòng.)*
- `excel_parser.py`/`ket_qua_phan_tich.py` bản gốc (v1) dò cột ảnh qua bốn tên đoán — không tên nào khớp dữ liệu thật của AVI GIFT (`Đường dẫn ảnh`). Đọc tên cột thật từ chính workbook (`ws.iter_rows` lấy hàng tiêu đề) trước khi viết adapter đọc Excel, đừng tin tên cột trong mã nguồn v1 — điểm lệch #12, `RA_SOAT_THU_HOACH.md`.
- Thư mục dữ liệu vận hành của một khách hàng thật (vd `FloraOS Vận hành/`) có thể chứa khoá API thật ở dạng thô (`he_thong.json` của AVI GIFT có `openai_api_key` — nợ #36). Đọc CÓ CHỌN LỌC đúng những tệp cần cho việc đang làm, không `cat`/liệt kê toàn bộ nội dung một thư mục dữ liệu khách hàng khi chưa cần — và không bao giờ chép các tệp dạng `he_thong.json`/`.env` vào `scripts/` hay bất kỳ đường dẫn nào sẽ commit.

- Bộ ảnh vàng là điều kiện nghiệm thu P5. Không có nó thì không đổi được provider và không hồi quy được phần thu hoạch. Quy cách ở `docs/kien-truc/BO_ANH_VANG.md`.
- Prisma 7 **không đọc `url` trong `schema.prisma`** nữa. Chuỗi kết nối nằm ở `prisma.config.ts` cho lệnh dòng lệnh, và ở driver adapter `@prisma/adapter-pg` cho `PrismaClient`. Bỏ qua điều này thì `prisma generate` dừng ở `P1012`.
- `prisma.config.ts` cũng không tự nạp `.env`. Nó gọi `process.loadEnvFile` khi tệp có mặt; trên CI biến nằm sẵn trong môi trường.
- `prisma generate` và `prisma db push` **tải nhị phân schema-engine từ `binaries.prisma.sh`**. Máy không ra được host đó thì hai lệnh này không chạy, dù mọi thứ khác offline được. Sinh lược đồ ở nơi có mạng, hoặc mở host đó trên proxy.
- Prisma 7 BỎ cờ `--skip-generate` của `prisma db push`. Truyền vào thì CLI in trang trợ giúp và không đẩy gì cả — nhưng database vẫn được tạo, nên lỗi chỉ lộ ra rất muộn dưới dạng `relation "..." does not exist` lúc chạy test. Mọi script gọi `db push` nên kiểm lại bằng một truy vấn `to_regclass` thay vì tin mã thoát.
- `npm run test:tenant` XOÁ SẠCH database nó trỏ tới (`TRUNCATE` 22 bảng trước mỗi ca thử). Tới 09/10 nó dùng chung database với môi trường phát triển, nên cổng bắt buộc này cuốn mất tổ chức AVI GIFT cùng 1.316 SKU — hai lần trong một tối. Nay nó trỏ sang `floraos_test` và `tests/helpers/database.ts` TỪ CHỐI chạy nếu tên database không kết thúc bằng `_test`. Dựng database đó một lần bằng `npm run db:test:setup`; nếu quên, lỗi đầu tiên anh gặp sẽ nói thẳng phải chạy lệnh gì.
- Biến `DATABASE_URL` export ra shell theo `cd` sang repo khác, và `process.loadEnvFile()` KHÔNG ghi đè biến đã có sẵn. Chạy `set -a && source .env` trong `LocalBudd` rồi `cd` sang đây là đủ để `npx prisma db push` của core trỏ vào Supabase của LocalBudd — suýt xảy ra 09/10. Trước mọi lệnh Prisma: `echo "[$DATABASE_URL]"` phải rỗng, và nhìn dòng `Datasource "db"` nó in ra.
- `prisma generate` KHÔNG chạy được trong VM của `device_bash`: nó tải nhị phân từ `binaries.prisma.sh` và host đó trả 403 qua proxy của VM (`PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1` không giúp — bước sau vẫn phải tải chính tệp engine). Hệ quả cụ thể: thêm model vào `schema.prisma` thì `npx tsc --noEmit` báo `Property 'x' does not exist on type 'DbClient'` cho tới khi ai đó chạy `prisma generate` trên Terminal Mac thật. Phân loại lỗi `tsc` trước khi đi sửa: lỗi dạng đó là lỗi CHỜ, không phải lỗi mã.
- `npm test` loại `tests/tenant/**` theo thiết kế; gọi thẳng `npx vitest run` sẽ kéo cả bộ test cách ly vào và nó TỪ CHỐI chạy vì database không kết thúc bằng `_test`. Dùng đúng hai lệnh: `npm test` và `npm run test:tenant`.
- `npm run lint` từng dừng ngay vì repo thiếu `eslint.config.mjs` — cổng thứ hai của CI chưa từng chạy trong suốt P0. Thêm một cổng vào CI thì chạy thử nó một lần tại máy.
- Sandbox `device_bash` từng chặn `npx vitest`/`npx tsc` bằng lỗi `Cannot find module '@rollup/rollup-linux-arm64-gnu'` (kiến trúc gói sai trong `node_modules` cài sẵn). Sửa bằng `npm install @rollup/rollup-linux-arm64-gnu --no-save` — chạy được thật `vitest`/`tsc --noEmit` trong sandbox từ đó, không cần đợi anh Tony chạy trên máy thật mới biết type có sai không.
- Tên tệp/thư mục tiếng Việt có dấu qua cầu nối máy Mac (`device_bash`) ở dạng Unicode **NFD** (tổ hợp dấu rời), còn chuỗi gõ trong mã nguồn ở đây là **NFC**. So khớp chuỗi trực tiếp (`"giỏ" in ten_thu_muc`) luôn sai lặng lẽ, không báo lỗi. Luôn `unicodedata.normalize("NFC", ...)` cả hai phía trước khi so — xem `scripts/xay-dung-bo-anh-vang.py`.
- `BoAnhVang/` (ảnh thô để dựng bộ ảnh vàng) từng KHÔNG có trong `.gitignore` — ảnh sản phẩm của khách hàng đã có nguy cơ vào git nếu ai đó lỡ `git add -A`. Đã thêm vào `.gitignore` ngày 09/09. Mọi thư mục chứa ảnh khách hàng ngoài `golden/images/` cần rà lại `.gitignore` trước khi coi là an toàn.

## Kết thúc mỗi việc — bắt buộc

Việc chưa ghi lại là việc lần sau không ai biết đã làm. Trước khi báo xong, làm đủ ba bước, **trong cùng lần đó**:

1. **Tích ô trong `docs/dac-ta/Checklist_Thuc_Thi.md`.** Đổi `- [ ]` thành `- [x]` cho đúng những ô vừa làm xong. Không tích trước, không tích ô chỉ làm một nửa.
2. **Nếu ô vừa tích là ô cuối của một pha** — cập nhật `docs/kien-truc/TRANG_THAI.md`: mục 1 (đang ở đâu), mục 6 (việc kế tiếp), và thêm một dòng vào mục 8 (nhật ký).
3. **Commit cả mã lẫn tài liệu trong cùng một commit.** Tách ra là tạo ra khoảng thời gian mã và tài liệu lệch nhau.

Phát sinh thêm việc chưa có trong checklist thì **thêm ô mới** vào đúng pha, đừng làm âm thầm. Gặp thứ phải chấp nhận tạm thì thêm một dòng vào `docs/dac-ta/TECHNICAL_DEBT.md` kèm điều kiện trả.

Đầu mỗi phiên làm việc: đọc `TRANG_THAI.md` rồi tới `Checklist_Thuc_Thi.md`. Ô chưa tích đầu tiên chính là việc kế tiếp.

## Quy tắc làm việc

- Nêu tên các tệp định mở trước khi mở.
- Vá bằng diff. Không in lại phần mã không đổi.
- Hỏng hai lần thì ngừng vá: nêu điều mà thất bại chứng minh là sai trong hình dung về mã, rồi mở đúng tệp giải quyết được điều đó.
- Cần tìm kiếm toàn repo lần thứ hai trong một việc nghĩa là bản đồ thiếu một dòng — bổ sung dòng đó trước khi kết thúc.
- Gặp mâu thuẫn giữa tài liệu Level 1 và Level 2 → **dừng và báo chủ sản phẩm**, không tự chọn bên nào.
