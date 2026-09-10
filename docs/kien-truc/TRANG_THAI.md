# TRẠNG THÁI — đọc tệp này đầu tiên

**Cập nhật:** 2026-09-10 (P7) · **Dự án:** FloraOS SaaS — nền tảng đa tenant cho cửa hàng hoa

> Tệp này tồn tại để **bất kỳ phiên làm việc nào — tài khoản Claude khác, Cursor, Copilot, hay người thật — tiếp tục được từ đúng chỗ đang dừng.** Bộ nhớ và lịch sử hội thoại không chuyển được giữa các tài khoản; repo thì chuyển được. Nên trạng thái sống ở đây, không sống trong một phiên chat.
>
> **Ai sửa gì trong dự án này thì cập nhật tệp này trong cùng lần đó.** Tệp lệch trạng thái còn tệ hơn không có tệp.

---

## 1. Đang ở đâu

**Giai đoạn: P7 — Integration Layer, phần `floraos-core` nghiệm thu xong trên
Postgres thật (09/10, `npm run test:tenant` 69/69 xanh).** `integration_tokens` (token máy gọi máy, ký
HMAC bằng `INTEGRATION_TOKEN_SECRET`, tách khỏi `SESSION_SECRET` — `YC-T8`),
xoay không dừng dịch vụ (token mới không tự thu hồi token cũ, đúng đặc tả 08
mục 3). Mã năng lực mới `F9` (`integration.token.manage`, trần cứng
`dieu_hanh`) gác bốn endpoint quản trị token
`POST/GET /integration-tokens` · `DELETE /integration-tokens/:id` ·
`POST /integration-tokens/:id/rotate` — tổng catalog 113→114 mã, 30→31 trần
cứng (`capability-catalog.test.ts`).

Sáu route máy gọi máy dưới `/api/v1/integration/*` (đặc tả 06 mục 11, đặc tả
08 mục 4), module mới `src/modules/integration/`: `GET products` (luôn lọc
`status=ACTIVE`, bỏ qua giá trị client gửi) · `GET products/:id/master-image`
(lọc `approval_state=APPROVED` — luôn 404 cho tới khi P9/Identity Guard xây
xong, nợ #30) · `GET business-profile` (chỉ token `LOCALBUDD`, `SocialFlow`
bị chặn 403 — đặc tả 08 mục 4) · `GET brand-profile` (cả hai loại token) ·
`POST jobs` (tái dùng thẳng `enqueueJob` của P3 — cùng đường hạn mức/credit,
không có đường tắt cho engine ngoài) · `POST usage` (ghi mức dùng phát sinh ở
engine ngoài, `cost_credit` luôn 0 — không trừ credit lần hai) ·
`POST capabilities/check` ("hỏi một người có năng lực gì", trả rỗng-hết nếu
`user_id` không thuộc tổ chức của token, không rò rỉ theo `YC-T4`).

Thiết kế cốt lõi: `IntegrationContext` (giải từ token) dựng lại thành một
`TenantContext` với `capabilities` RỖNG rồi TÁI DÙNG thẳng
`listProducts`/`getBusinessProfile`/`getBrandProfile`/`enqueueJob` đã có sẵn
— phạm vi quyền của token không đi qua 114 mã năng lực của người dùng, nó cố
định theo `client` và áp trực tiếp trong từng route, đúng đặc tả 08 mục 3
("token có phạm vi hẹp hơn năng lực người dùng").

Đã hỏi và chốt với anh Tony ba câu 09/10 (AskUserQuestion):
(1) `assets.approval_state` — thêm cột rỗng ngay ở P7, dựng đúng endpoint đọc
theo đặc tả, để nợ kỹ thuật việc ĐẶT giá trị cho P9 (nợ #30) thay vì hoãn cả
endpoint; (2) quản lý token qua endpoint gác `F9`, không phải script dòng
lệnh; (3) làm cả ba việc của P7 (core + `LocalBudd` + `SocialFlow`) trong
cùng phiên, hết mức có thể.

12 test mới: `token-rules.test.ts` (7, thuần — `npm test`, xanh thật trong
sandbox) · `tests/tenant/integration.test.ts` (9 ca, cần Postgres) · một ca
mới trong `cach-ly-repository.test.ts` cho `IntegrationTokenRepository`.
`npx tsc --noEmit` sạch (chỉ còn lỗi CHỜ `prisma generate` chạy lại — sandbox
phiên này không có mạng ra `binaries.prisma.sh`, cùng giới hạn P3–P6) ·
`npx eslint` sạch · `npm test` **124/124** xanh thật (117 cũ + 7 mới).
`npm run test:tenant` KHÔNG chạy được trong sandbox này (không có `docker`) —
bốn lệnh xác minh ở mục 6.

Riêng phần `LocalBudd` và `SocialFlow` của P7 — cả ba việc (core/`LocalBudd`/
`SocialFlow`) đã làm trong cùng phiên 09/10, hết mức có thể theo xác nhận của
anh Tony. `LocalBudd` chỉ bỏ được bảng chết `media_assets`; bốn bảng còn lại
(`products`/`product_assets`/`generation_jobs`/`projects`) vẫn chặn vì đặc tả
08 mục 4 chưa có endpoint GHI cho core, chỉ có endpoint đọc — cần chủ sản
phẩm quyết định (`LocalBudd/TECHNICAL_DEBT.md`). `SocialFlow` đã nhận
`organization_id` trên bảng `accounts` (cột mới + lọc mọi endpoint CRUD tài
khoản, chặn ghi đè khác tổ chức bằng 409) nhưng đây KHÔNG phải là ranh giới
bảo mật thật — repo không có cơ chế xác thực máy gọi máy nào, và các bảng
nghiệp vụ còn lại (`posts` và tương tự) chưa có `organization_id` — D1 (đa
tenant hay đơn tenant) vẫn còn mở (`SocialFlow/TECHNICAL_DEBT.md`). Xem mục 6
cho việc còn lại.

**Giai đoạn trước đó — P6 nghiệm thu xong: M02 (giá) + M03 (tra cứu sản phẩm).** Anh
Tony chạy bốn lệnh xác minh trên Terminal Mac thật (`docker compose up -d` ·
`prisma generate`/`db push` · `npm test` · `npm run test:tenant`) — **xanh
toàn bộ**, không phát sinh lỗi phải sửa. Trước đó trong sandbox: `npx tsc
--noEmit` sạch, `npm test` 117/117 (36 ca mới của P6: `pricing.test.ts` 11 ·
`price-guard.test.ts` 7 · `pricing-input.test.ts` 5 · `pricing-rules.test.ts`
9 · `product-lookup.test.ts` 4), `npx eslint` sạch — `test:tenant` chỉ chạy
được thật trên máy anh Tony vì sandbox không có Postgres (cùng giới hạn đã
gặp ở P3/P4/P5).

Phạm vi P6 đã hẹp lại so với đọc đầu tiên của `HARVEST_MANIFEST.md`, chốt với
anh Tony qua hai câu hỏi 09/10: (1) chỉ dựng ENGINE giá cốt lõi
(`quotePrice`/`checkPriceInvariants`/`checkPriceGuard` + `pricing_rules` CRUD
theo tổ chức/chi nhánh + `GET/PUT /pricing-rules`), KHÔNG dựng luồng "thẻ chào
giá" (nhóm năng lực `pricing_card`, C1–C28, đã có sẵn trong `capability-catalog.ts`
từ R2 nhưng ngoài phạm vi PRD/Checklist P6 — nợ #26); (2) chi phí lá/cành
trang trí CHƯA TÍNH, để nợ kỹ thuật thay vì đoán một con số kinh doanh — nợ
#27. Soát nguồn harvest cho P6 còn lật ra hai điểm lệch tài liệu/mã mới
(`mucThu.ts`/`uocPhi.ts` xếp nhầm M02, `sanTran.ts` không thuần như tưởng) —
điểm lệch #10, #11 ở `RA_SOAT_THU_HOACH.md`, nợ #28/#29, đã sửa
`HARVEST_MANIFEST.md` mục 3.1 theo mã thật.

Đã có (P6), **viết mã xong CHƯA xác minh trên Postgres thật**: `src/modules/products/domain/`
thêm `pricing.ts` (`quotePrice`/`checkPriceInvariants`, thu hoạch R3+R4) ·
`price-guard.ts` (`checkPriceGuard`, thu hoạch R5 phần `chanGia.ts`) ·
`pricing-input.ts` (đọc số/tỷ lệ/câu cảnh báo, thu hoạch từ `locTraCuu.ts`) ·
`pricing-rules.ts` (danh mục bốn khoá `pricing_rules`, giá trị mặc định, hợp
nhất tổ chức/chi nhánh) · `product-lookup.ts` (`filterProductLookup`, M03 —
cắt khối `pricing` theo `L5`). `infra/pricing-rule-repository.ts`
(CHÈN-CHỈ, `effective_from` giữ lịch sử giá, không `upsert`) ·
`product-repository.ts` thêm `list`/`update`. Năm use-case mới (`list-products`,
`create-product`, `get-product`, `update-product`, `get-pricing-rules`,
`put-pricing-rules`). Ba route: `GET·POST /products`, `GET·PATCH /products/:id`
(chuyển `ARCHIVED` đòi thêm `L4`, không chỉ `L3`), `GET·PUT /pricing-rules`.
36 test domain thuần + 10 test cách ly tenant mới (`tests/tenant/products-pricing.test.ts`).

**P5** vẫn còn hai việc mở, không chặn P6: bộ ảnh vàng chưa gán nhãn thật và
ma trận chọn công nghệ chưa làm (nợ #24, mục 6 dưới đây).

**P4 nghiệm thu xong trước đó: anh Tony chạy bốn lệnh xác minh trên Terminal Mac thật
ngay sau khi mã viết xong — xanh hoàn toàn, không phát sinh lỗi nào phải sửa (khác
P3, vốn mất ba vòng tìm-và-sửa). `npm run test:tenant` **41/41** (35 cũ của P1–P3 + 6 ca
mới cho `business_profiles`/`brand_profiles`, đúng số dự kiến) · `npm test` (domain
thuần, gồm `profile-rules.test.ts`) xanh · `npx tsc --noEmit` sạch · `prisma
generate`/`db push` xanh.

Repo nằm ở `~/Projects/floraos-core`, remote `antranhub22/floraos-core`.

Đã có (P1): bảy bảng nền · `TenantContext` giải từ `sessions.organization_id` phía máy chủ · bộ gác lọc theo tổ chức ở tầng repository · bộ test cách ly.

Đã có (P2): thu hoạch R2 nguyên vẹn, `capability-catalog.ts` 113 mã, `permission-resolver.ts` ba lớp, `role_capabilities`/`capability_overrides`, 12 endpoint quyền.

Đã có (P3), nghiệm thu xong: `assets`/`generation_jobs`(+`idempotency_key`)/`job_events`/`usage`/`audit_logs` · bốn module `src/modules/{assets,jobs,usage,audit}/` · `enqueueJob` (kiểm hạn mức → ghi usage → tạo job → NOTIFY, một giao dịch) · `GenerationJobRepository.claimNext` (`SKIP LOCKED`) · SSE `GET /jobs/:id/events` · `LocalDiskStorageProvider` (adapter tạm, nợ #15).

Đã có (P4), nghiệm thu xong: `business_profiles`/`brand_profiles` (đặc tả 07 mục 4, thu
hoạch E3 từ `SocialFlow/backend/brand_kit.py`) — tách đôi hồ sơ kinh doanh khỏi hồ sơ
thương hiệu, mỗi tổ chức đúng một bản ghi mỗi bảng (`@@unique([organization_id])`), khoá
ngoại tới `organizations` ngay từ đầu. Module `src/modules/profiles/`
(`domain/profile-rules.ts` — validate mã hex, `display_name` bắt buộc; hai repository
`upsert` theo ngữ nghĩa PUT-thay-toàn-bộ, trường vắng mặt thành `null`, dùng
`InputJsonValue` đúng quy ước P2 — không còn nợ `as never` như P3). Route
`GET · PUT /business-profile` và `GET · PUT /brand-profile` dưới `/api/v1/`, gác bằng
`F1`/`F2` có sẵn từ P2, không thêm mã năng lực mới.

Đang có (P5), **viết mã xong CHƯA xác minh trên Postgres thật**: hợp đồng
`PhanTichSanPhamHoa` (`workers/vision/contracts/`, nguyên vẹn từ v1) · cổng
`VisionAnalyzer` (`workers/vision/providers/base.py`) · `OpenAIStructuredProvider`
(BUILD — 2 lượt gọi + đồng thuận trung vị qua `chot()`, CHƯA gọi API thật) ·
`count_engine.py`/`color_engine.py`/`tu_dien.py` chuyển sang nguyên vẹn (E5/E6) · worker
`workers/vision/jobs/worker.py` (`SKIP LOCKED` + `LISTEN/NOTIFY`, đúng D6-1) · module
`src/modules/products/` (bốn thư mục domain/use-cases/infra/adapters) · route
`POST /vision/analyses`, `GET · PATCH /vision/analyses/:id`,
`POST /vision/analyses/:id/approve` (`H1`/`H2`/`H3`) · duyệt ghi Product Master + audit
log trong một giao dịch, không ghi thẳng. 43 test Python + 9 test TS mới chạy xanh thật
trong sandbox (sự cố `@rollup/rollup-linux-arm64-gnu` đã sửa, xem `TECHNICAL_DEBT.md`).
Đã xác minh xanh trên Postgres thật (09/10): `prisma generate`/`db push`, `npm test`,
`npm run test:tenant` 49/49, `python3 -m pytest` (workers/) 43/43. Còn lại: chưa gọi
`OpenAIStructuredProvider` với API OpenAI thật (ảnh thật), và bộ ảnh vàng chưa đạt nghiệm
thu — xem mục 6 và `TECHNICAL_DEBT.md` #19–25.

## 2. Đọc theo thứ tự này

| # | Tệp | Đọc để biết |
|---|---|---|
| 1 | `TRANG_THAI.md` (tệp này) | Đang ở đâu, làm gì tiếp |
| 2 | `FLORAOS_SAAS_TARGET_ARCHITECTURE_V2.md` | **Level 1 — thắng tuyệt đối.** Kiến trúc đích, lộ trình P0–P12, quyết định |
| 3 | `floraos-core/docs/dac-ta/` | **Bộ đặc tả 13 tệp** — PRD, yêu cầu kỹ thuật, danh mục năng lực, UX, frontend, backend, API, cơ sở dữ liệu, tích hợp, checklist, lộ trình, nợ kỹ thuật |
| 4 | `HARVEST_MANIFEST.md` | Cái gì thu hoạch từ repo nào, hạng REUSE/EXTEND/ADAPTER/BUILD |
| 5 | `M01_FLORAOS_VISION_CODING_AGENT_GUIDE.md` · `M04_FLORAOS_PRODUCT_IMAGE_OPTIMIZER_FULL.md` | Level 2 — chỉ đọc khi làm đúng module đó |
| 6 | `BO_ANH_VANG.md` · `QUY_UOC_DEM.md` | Quy cách bộ ảnh vàng và quy ước đếm — điều kiện nghiệm thu P5 |
| 7 | `RA_SOAT_THU_HOACH.md` | Đối chiếu tài liệu với mã thật ba repo. Chín điểm lệch |

`AGENTS.md` của `floraos-core` đã dựng từ bản khung; bản khung không còn hiệu lực.

Bản V1 (`FLORAOS_SAAS_TARGET_ARCHITECTURE.md`, không có `_V2`) **đã bị xoá khỏi cây làm việc ngày 09/09** vì gây nhầm lẫn. Nó vẫn nằm trong lịch sử git tại commit `c224a0f`. Lấy lại bằng:

```bash
cd ~/Projects/FloraOS
git -c core.quotepath=false show \
  "c224a0f:$(git -c core.quotepath=false ls-tree -r --name-only c224a0f \
             | grep 'TARGET_ARCHITECTURE\.md$')" > /tmp/V1.md
```

> **Vì sao lệnh trên phải qua `ls-tree` chứ không gõ thẳng đường dẫn:** commit `c224a0f` có trước lần đổi tên thư mục, nên trong lịch sử nó vẫn mang tên cũ `Nâng cấp WebApp Saas/` ở dạng **NFD** (macOS tách chữ có dấu thành ký tự tổ hợp, còn chuỗi gõ ở terminal là NFC). Gõ thẳng sẽ **không khớp và im lặng trả về rỗng** — git không báo lỗi. Từ commit `6cf108f` trở đi mọi đường dẫn trong git đều là ASCII nên gõ thẳng được.

## 3. Bốn repo

| Repo | Vai trò | Git |
|---|---|---|
| **`floraos-core`** | Core mới — Org/RBAC/Product/Asset/Job/Usage + M01, M02, M03, M04a | ✓ `antranhub22/floraos-core` (riêng tư) |
| `FloraOS` | v1, nghỉ hưu. Phục vụ AVI GIFT tới ngày cắt. **Nguồn thu hoạch.** | ✓ `antranhub22/floraos-v1` (riêng tư) |
| `LocalBudd` | M05 Landing Page · M06 Catalog | ✓ `antranhub22/localbudd` (riêng tư) |
| `SocialFlow` | M04b Marketing Creative · M07 Social Publishing | ✓ có remote GitHub |

Cả bốn repo đều có bản sao ngoài máy. Nhánh chính của cả bốn là `main`.

Branch protection trên `main` của `floraos-core` bật khi P1 xong, với điều kiện `npm run test:tenant` phải xanh. Đây là cổng duy nhất chặn được lỗi cách ly tenant.

## 4. Đã chốt

| # | Quyết định | Ngày |
|---|---|---|
| **Đường A** | Dựng repo core MỚI, chép khuôn kiến trúc LocalBudd + luật nghiệp vụ FloraOS + thiết kế Asset/brand SocialFlow. Giữ tách ba repo. FloraOS v1 nghỉ hưu, không migrate dần | 09/09 |
| **D5-c** | Cổng Vision ở mức Hợp đồng JSON (`VisionAnalyzer.analyze → ProductAnalysis`). Adapter GPT-4o trước, Florence-2+SAM2 sau, chỉ đổi khi thắng trên bộ ảnh vàng. **Thay quy tắc 4 cũ của M01** | 09/09 |
| **D6-1** | Worker Python lấy việc từ `generation_jobs` bằng `SKIP LOCKED` + `LISTEN/NOTIFY`. `floraos-core` chứa cả `src/` (TS) và `workers/` (Python), chung một Postgres. Cấm `subprocess`+stdout, cấm job qua HTTP | 09/09 |
| **D1** | SocialFlow là worker đơn tenant, nhận `organization_id` từ core | 09/09 |
| **D2** | Nền tảng giữ khoá nhà cung cấp AI, tính credit theo tổ chức | 09/09 |
| **D3** | Job bị Identity Guard từ chối không tính phí khách; credit hoàn lại | 09/09 |
| **D4** | `FloraOS` v1 đóng băng tính năng từ 09/09. Không ngoại lệ. Chỉ sửa lỗi chặn vận hành tới ngày cắt | 09/09 |
| **Quy ước đếm** | Đơn vị là cành. Nụ đếm riêng; số chuẩn là số nhìn thấy trong ảnh, số đơn hàng ghi song song; lá trang trí không đếm; bao bì đếm như hoa; hoa hỏng vẫn tính kèm số hỏng riêng. Chi tiết ở `QUY_UOC_DEM.md` | 09/09 |

## 5. Còn mở — chặn việc

Không còn quyết định nào chặn. D1 · D2 · D3 · D4 chốt ngày 09/09, xem mục 4.

## 6. Việc kế tiếp

**P7 — `LocalBudd` bỏ bốn bảng còn lại** (`products`/`product_assets`/
`generation_jobs`/`projects`) — chặn thật, không phải việc chưa làm: đặc tả
08 mục 4 chỉ định nghĩa `GET /integration/products` (đọc), không có endpoint
GHI nào cho LocalBudd tạo Product Master qua core, và không có cơ chế nào
cho một client chỉ-có-HTTP (không có Postgres trực tiếp) nhận/hoàn tất
`generation_jobs` (core lấy job bằng `SELECT ... FOR UPDATE SKIP LOCKED`,
đòi quyền truy cập DB trực tiếp). Cần chủ sản phẩm chốt: (a) core có thêm
endpoint ghi Product Master hay không, hay (b) LocalBudd bỏ hẳn luồng nhập
sản phẩm thủ công và chỉ đọc từ core. Xem `LocalBudd/TECHNICAL_DEBT.md` mục
P7.

**P7 — `SocialFlow` nhận `organization_id`: đã làm phần schema/CRUD của
`accounts`, D1 vẫn mở.** Cột `organization_id` + lọc trên mọi endpoint CRUD
tài khoản, cộng cờ chặn 409 khi hai tổ chức tranh cùng một `platform` (khoá
UNIQUE(platform) toàn cục từ lúc tạo bảng, không sửa được bằng
`ALTER TABLE` — không rebuild bảng trong phiên này theo đúng quy tắc
forward-only của `migrations.py`). Việc còn lại để quyết định D1 thật sự:
(a) một cơ chế xác thực máy gọi máy (SocialFlow hiện không có session/JWT/API
key nào), và (b) `organization_id` trên toàn bộ bảng nghiệp vụ còn lại
(`posts`, `templates`, `signals`, `campaigns`, …). Xem
`SocialFlow/TECHNICAL_DEBT.md`.

Nghiệm thu trên máy thật 09/10: chạy server qua `venv/bin/python -m uvicorn main:app` (cổng khác 8000, vì 8000 đã bị một dịch vụ khác trên máy chiếm), curl end-to-end trên `backend/socialflow.db` thật (đã có sẵn ba tài khoản `linkedin`/`instagram`/`facebook` dưới tổ chức mặc định) — tạo tài khoản mới dưới tổ chức khác thành công, tổ chức thứ hai giành cùng platform bị chặn đúng 409, lọc theo `organization_id` đúng cả hai chiều, không rò rỉ tài khoản thật ra tổ chức khác hay ngược lại. Việc còn lại để quyết định D1 vẫn như trên.

1. **Gán nhãn thật cho bộ ảnh vàng** — khung 100 ảnh đã dựng ở `golden/` (`scripts/xay-dung-bo-anh-vang.py`), còn thiếu đúng phần việc của người: mở từng `golden/labels/g*.json`, đếm theo `QUY_UOC_DEM.md`, điền `labeled_by`; người thứ hai gán độc lập ≥30% để đối chiếu (`BO_ANH_VANG.md` mục 7) rồi mới điền `verified_by`. Đây là điều kiện DUY NHẤT còn chặn P5 nghiệm thu tuyệt đối và điều kiện đổi provider Vision (D5-c) — chưa có nhãn thật thì chưa đo được gì. Đã hỏi và từ chối để AI tự làm việc này (nợ #24) — cần người thật.
2. Sau khi có nhãn: chạy `OpenAIStructuredProvider` với `OPENAI_API_KEY` thật trên đúng các ảnh trong `golden/images/`, so kết quả máy với nhãn người theo `BO_ANH_VANG.md` mục 9 — đây mới là phép đo thật đầu tiên của M01.
3. Làm ma trận chọn công nghệ (`Checklist_Thuc_Thi.md` mục cuối P5, `YC-N5` `YC-N6`) — mục còn lại duy nhất khác của P5.
4. Xác nhận với anh Tony các giả định đã ghi ở `TECHNICAL_DEBT.md` #19-25 của P5 (ngưỡng đồng thuận, tự tạo `products` khi duyệt không có `product_id`, khoá PATCH sau khi duyệt, quy ước chữ cái đầu mã sản phẩm suy ra `product_form`, "kệ" xếp vào "lẵng").
5. Xác nhận với chủ sản phẩm giá trị mặc định của công tắc `cho_phep_tu_duyet` (`docs/dac-ta/TECHNICAL_DEBT.md` #12) trước khi màn hình duyệt đầu tiên đi vào sản xuất.
6. Xác nhận với chủ sản phẩm bảng giá `cost_credit` theo `feature` — hiện là hằng số đoán hợp lý trong mã, không phải quyết định kinh doanh đã chốt (`TECHNICAL_DEBT.md` #14).
7. Khi có UI onboarding thật cho M05 (LocalBudd): xác nhận `logo_asset_id` của
   `brand_profiles` có bắt buộc trỏ tới một `assets.kind = MASTER` đã duyệt hay chấp nhận
   bất kỳ asset nào — schema hiện không ràng buộc khoá ngoại (đặc tả 07 mục 4 khai
   `String?` thường), đây là quyết định UX chưa cần thiết ở P4.
8. Khi quyết định xây luồng "thẻ chào giá" (`pricing_card`, C1–C28, nợ #26): chốt nguồn
   `effectiveCostVnd` (giá vốn hiệu lực) — `gia_von.py` chưa xếp vào đợt harvest nào.

## 7. Làm việc bằng nhiều tài khoản Claude cùng lúc

Được, với ba điều kiện:

1. **Mỗi tài khoản một nhánh git riêng.** Hai agent sửa cùng tệp trên cùng nhánh là xung đột, và không agent nào biết agent kia vừa làm gì.
2. **Mỗi phiên bắt đầu bằng `git pull` và đọc tệp này.** Bộ nhớ của tài khoản khác không thấy được gì ở đây.
3. **Mỗi phiên kết thúc bằng: cập nhật tệp này + commit + push.** Việc chưa push là việc chưa tồn tại với tài khoản khác.

Phân việc theo **pha**, không theo tệp — P1 (tenant) và bộ ảnh vàng chạy song song được; P5 và P6 thì không, P6 phụ thuộc P5.

## 8. Nhật ký

| Ngày | Việc |
|---|---|
| 09/09 | Rà soát FloraOS: phát hiện Excel là nguồn sự thật + khoá ghi toàn cục → bác bỏ hướng nâng cấp tại chỗ. hồ sơ `SAAS_GAP_ANALYSIS.md`, nay chỉ còn trong git |
| 09/09 | Rà soát LocalBudd và SocialFlow: ba repo làm ba mảnh khác nhau của cùng kiến trúc. Chốt Đường A. `HARVEST_MANIFEST.md` |
| 09/09 | Viết `FLORAOS_SAAS_TARGET_ARCHITECTURE_V2.md`, thay thế V1 |
| 09/09 | Chốt D5-c và D6-1. Đồng bộ M01 và M04 lên V1.2 |
| 09/09 | `FloraOS` vào git lần đầu (loại kho vận hành + khoá API). `LocalBudd` commit toàn bộ phần đã xây (loại `cookies.txt` chứa session thật) |
| 09/09 | PRD `01_PRD-FloraOS-Core.md` |
| 09/09 | Dựng khung `floraos-core`: cấu trúc theo V2 mục 3, `AGENTS.md`, năm cổng ở `src/core/ports/`, khung worker Python, `docs/kien-truc/`. Chưa có bảng, chưa có route |
| 09/09 | `BO_ANH_VANG.md` — quy cách bộ ảnh vàng |
| 09/09 | Bốn repo lên GitHub riêng tư dưới `antranhub22`, nhánh chính `main` |
| 09/09 | Chốt D4 — `FloraOS` v1 đóng băng tính năng, không ngoại lệ |
| 09/09 | Chốt quy ước đếm, `QUY_UOC_DEM.md`. Lược đồ nhãn bộ ảnh vàng đồng bộ theo |
| 09/09 | Rà soát mã thật ba repo; bộ đặc tả 13 tệp ở `floraos-core/docs/dac-ta/` |
| 09/09 | Chốt D1, D2, D3. Sửa V2 và bản đồ thu hoạch theo mã thật: 18 mã trần cứng, dải E1–E8, count_engine và color_engine là REUSE |
| 09/09 | **P1 xong.** Bảy bảng nền, `TenantContext`, bộ gác ở tầng repository, sáu endpoint phiên và tổ chức, bộ test cách ly 21 trường hợp. Lược đồ và client chuyển sang cách khai của Prisma 7 (`prisma.config.ts` + driver adapter); thêm `eslint.config.mjs` vì `npm run lint` trước đó dừng ngay khi chạy |
| 09/09 | **P2 xong.** Thu hoạch R2 nguyên vẹn (`maChucNang.ts` + test, 25/25 qua `npm run test:harvest`) · `capability-catalog.ts` 113 mã sinh từ chính bản harvest, không gõ tay phần A–E · `permission-resolver.ts` ba lớp · `role_capabilities`/`capability_overrides` · `resolveSession` nạp năng lực thật, `GET /auth/me` trả ra · công tắc `cho_phep_tu_duyet` · 12 endpoint tổ chức/thành viên/vai/chi nhánh/workspace gác bằng mã năng lực · sửa một lỗi ở `handle()` (`src/core/http/response.ts`) không truyền được `context.params` cho route động của Next 16 — phát hiện khi viết endpoint đầu tiên có `[id]`. Chưa chạy được `prisma generate`/`db push`/`test:tenant` trong phiên này — sandbox chặn `binaries.prisma.sh` |
| 09/09 | **P2 verify xong trên máy có mạng.** `prisma generate`/`db push` (Postgres 16 qua Docker), `npm test` 48/48, `npm run test:tenant` 23/23. Sửa 1 lỗi type thật (`organization-repository.ts`, cột `settings` Json vs `exactOptionalPropertyTypes`) + thêm `InputJsonValue` vào `entities.ts`. Sửa 1 test P1 lỗi thời (`cach-ly-endpoint.test.ts` khoá hành vi "năng lực luôn rỗng" — nay sai vì P2 nạp `role_capabilities` thật lúc đăng ký), đối chiếu lại bằng `defaultCodesForSystemRole`. Không còn việc tồn đọng của P2 |
| 09/09 | **P3 viết mã xong, CHƯA xác minh.** `assets`/`generation_jobs`(+`idempotency_key`)/`job_events`/`usage`/`audit_logs` + khoá ngoại nợ #8. Bốn module `assets`/`jobs`/`usage`/`audit`. `enqueueJob` (kiểm hạn mức → ghi usage → tạo job → NOTIFY, một giao dịch) · `GenerationJobRepository.claimNext` (`SKIP LOCKED`) · `PostgresQueueProvider` (`pg_notify` trong giao dịch) · SSE `GET /jobs/:id/events` (`Last-Event-ID`) · `LocalDiskStorageProvider` (adapter tạm cho `POST /assets/upload-url`) · `scripts/scan-stuck-jobs.ts` (`YC-J10`). Sandbox phiên này không có Docker/mạng ra `binaries.prisma.sh`, và `node_modules` sai kiến trúc máy (thiếu `@rollup/rollup-linux-arm64-gnu`) nên không chạy được `prisma generate`/`db push`/`npm test`/`npm run test:tenant` — chỉ `tsc --noEmit` (phần không chạm kiểu Prisma). Xem mục 6 việc kế tiếp và `TECHNICAL_DEBT.md` #14–18 |
| 09/09 | **P3 chạy Postgres thật lần đầu, sửa 2 lỗi.** Anh Tony chạy `docker compose up -d` · `prisma generate/db push` · `npm run test:tenant` trên Terminal Mac thật — 30/35 xanh, 5 đỏ (đều trong `enqueue-job.test.ts`). Sửa: (1) `PostgresQueueProvider` — `pg_notify` qua `$queryRaw` ném `P2010` vì cột `void` không giải mã được, đổi `$executeRaw`; (2) hai ca thử sai giả định `credit_balance` mặc định 0 — bỏ sót `TRIAL_CREDIT_BALANCE` (20) `sign-up.ts` cấp sẵn, sửa test tự đặt lại 0 trước khi kỳ vọng chặn hạn mức. `tsc --noEmit` sạch; chưa tự chạy lại `vitest` được (VM `device_bash` khác Terminal thật, thiếu `@rollup/rollup-linux-arm64-gnu`) — chờ anh Tony chạy lại xác nhận 35/35 rồi tích `Checklist_Thuc_Thi.md` |
| 09/09 | **P3 chạy Postgres thật lần hai, sửa lỗi thứ ba (ở bộ thử).** Sau khi sửa `pg_notify`, anh Tony chạy lại `npm run test:tenant` — vẫn 30/35, 5 đỏ nhưng đổi triệu chứng hoàn toàn (không còn `P2010`). Nguyên nhân: workspace mặc định `sign-up` tạo luôn `kind: "EXPERIENCE"`, nên bốn ca "đường CREDIT" của `enqueue-job.test.ts` dùng `a.ctx` chưa từng kiểm đúng đường CREDIT — luôn rơi vào đường TRIAL. Sửa: thêm `withProductionWorkspace()` tự dựng workspace `PRODUCTION` riêng cho bốn ca đó, sửa luôn assertion sai của ca EXPERIENCE (`credit_balance` phải giữ `TRIAL_CREDIT_BALANCE`, không phải `0`). `tsc --noEmit` sạch trên client Prisma thật — chờ anh Tony chạy lại lần ba xác nhận 35/35 |
| 09/09 | **P3 nghiệm thu phần lõi — 35/35 `test:tenant` xanh.** Anh Tony chạy lại lần ba, xác nhận xanh hoàn toàn sau ba lỗi tìm-và-sửa (raw query `pg_notify`, hai test sai giả định credit mặc định, bốn test chưa kiểm đúng đường CREDIT vì workspace mặc định là EXPERIENCE). Tích các ô liên quan ở `Checklist_Thuc_Thi.md`. Còn `npm test` (domain thuần P3) chưa chạy thật xác nhận trong phiên này — mục còn lại duy nhất trước khi coi P3 xong tuyệt đối |
| 09/09 | **P4 viết mã xong, CHƯA xác minh.** `business_profiles`/`brand_profiles` (đặc tả 07 mục 4, thu hoạch E3 từ `SocialFlow/backend/brand_kit.py`), khoá ngoại tới `organizations` ngay từ đầu. Module `src/modules/profiles/` (domain/use-cases/infra/adapters đủ bốn thư mục) — `BusinessProfileRepository`/`BrandProfileRepository.upsert` theo ngữ nghĩa PUT-thay-toàn-bộ. Route `GET · PUT /business-profile`, `GET · PUT /brand-profile` dưới `/api/v1/`, gác bằng `F1`/`F2` có sẵn từ P2 — không thêm mã năng lực. Test domain (`profile-rules.test.ts`) + cách ly tenant ở cả hai tầng repository/endpoint. Cùng giới hạn sandbox của P3 (không Docker, không mạng tới `binaries.prisma.sh`, `node_modules` sai kiến trúc máy) nên chưa tự chạy được `prisma generate`/`db push`/`npm test`/`npm run test:tenant` trong phiên này — bốn lệnh xác minh ở mục 6 |
| 09/09 | **P4 nghiệm thu xong — 41/41 `test:tenant` xanh, xanh ngay lần đầu.** Anh Tony chạy bốn lệnh xác minh trên Terminal Mac thật (`docker compose up -d` · `prisma generate/db push` · `npm test` · `npm run test:tenant`) ngay sau khi mã viết xong — không phát sinh lỗi nào phải sửa, khác P3 (ba vòng tìm-và-sửa). 41 = 35 cũ + 6 ca mới cho hồ sơ, đúng số dự kiến. Nhân tiện đổi `as never` sang `as InputJsonValue` ở hai repository mới (`business-profile-repository.ts`/`brand-profile-repository.ts`) vì lúc này đã có client thật để đối chiếu — không còn nợ kiểu JSON như bốn tệp P3. `tsc --noEmit`/`eslint` sạch |
| 09/09 | **Bộ ảnh vàng: dựng khung tự động.** Anh Tony bỏ ảnh thô vào `BoAnhVang/` (845 tệp, 335 thư mục sản phẩm, đã sắp theo dịp/dạng). Viết `scripts/xay-dung-bo-anh-vang.py`: chọn ảnh rõ nhất mỗi sản phẩm (phương sai Laplace), lấy mẫu 100 ảnh theo đúng tỉ trọng thư mục cha, suy `product_form` từ tên thư mục hoặc chữ cái đầu mã sản phẩm (B=bó, G=giỏ, K=lẵng — nợ #25). Sửa một lỗi Unicode giữa chừng: tên thư mục qua cầu nối máy Mac ở dạng NFD, so khớp chuỗi phải chuẩn hoá NFC trước. Ghi `golden/images/`(100, ngoài git) + `golden/labels/*.json` RỖNG + `manifest.csv` + `golden/QUY_UOC_DEM.md` (bản sao). Thêm `BoAnhVang/` vào `.gitignore` (ảnh khách hàng, trước đó chưa bị loại — rủi ro thật nếu ai đó `git add -A`). KHÔNG tự đếm — đếm là việc của người theo `BO_ANH_VANG.md` mục 7, xem nợ #24 |
| 09/09 | **P5 viết mã xong, CHƯA xác minh trên Postgres thật.** Xem mục 1 "Đang ở đâu" và "Đang có (P5)" ở trên cho danh sách đầy đủ. Quyết định của anh Tony: viết mã ngay phần REUSE/EXTEND không cần bộ ảnh vàng, không chờ nghiệm thu bộ ảnh. Sandbox phiên này không có Postgres (cổng 5432 đóng) và không có mạng ra `binaries.prisma.sh` — giống giới hạn đã ghi ở P3/P4. Điểm khác P3/P4: sự cố `@rollup/rollup-linux-arm64-gnu` đã tìm ra cách sửa (`npm install @rollup/rollup-linux-arm64-gnu --no-save`), nên lần này chạy được thật `vitest`/`tsc --noEmit` trong sandbox, không chỉ viết rồi để đó — 43 test Python (`workers/tests/vision/`, mới) + 9 test TS (`product-analysis-rules.test.ts`, mới) xanh thật. Bốn lệnh xác minh còn lại ở mục 6 |
| 09/10 | **P6 nghiệm thu xong.** Anh Tony chạy bốn lệnh xác minh trên Terminal Mac thật (`docker compose up -d` · `prisma generate`/`db push` · `npm test` · `npm run test:tenant`) — xanh toàn bộ, không phát sinh lỗi phải sửa. Không còn việc tồn đọng của P6 |
| 09/10 | **P5 nghiệm thu phần lõi — 49/49 `test:tenant` xanh, 43/43 `pytest` xanh, trên máy thật.** Anh Tony chạy đủ bốn lệnh xác minh (`prisma generate`/`db push` · `npm test` · `npm run test:tenant` · `python3 -m pytest`). Giữa chừng máy hết dung lượng ổ đĩa lúc cài `pip install` — dọn Trash xong cài lại được, không phải lỗi mã. `npm run test:tenant` lần đầu 48/49, một ca đỏ: `vision-analyses.test.ts` kiểm `cost_credit` giả định đường CREDIT nhưng workspace mặc định của `sign-up` luôn là EXPERIENCE (đường TRIAL, `cost_credit=0` đúng thiết kế) — cùng dạng lỗi đã gặp ba lần ở P3. Sửa bằng cách đổi `kind` của chính workspace mặc định (sớm nhất theo `created_at`) sang `PRODUCTION` trong test, vì route đi qua phiên thật luôn giải ra workspace sớm nhất (`findDefaultForSessionOrganization`), không phải workspace tạo thêm — khác cách `enqueue-job.test.ts` làm (gọi thẳng `enqueueJob()`, tự truyền `ctx`). Còn hai việc chặn P5 nghiệm thu tuyệt đối: bộ ảnh vàng chưa gán nhãn (nợ #24 — anh Tony hỏi AI có tự làm được không, đã từ chối vì phá giá trị phép đo) và ma trận chọn công nghệ chưa làm |
| 09/10 | **P7 (`floraos-core`) viết mã xong, CHƯA xác minh trên Postgres thật.** `integration_tokens` (`YC-T8`, HMAC ký bằng `INTEGRATION_TOKEN_SECRET`, xoay không tự thu hồi token cũ) · mã năng lực mới `F9` (114 mã, 31 trần cứng) · bốn endpoint quản trị token (`/api/v1/integration-tokens*`) · sáu route máy gọi máy dưới `/api/v1/integration/*` (đặc tả 06 mục 11): products (lọc ACTIVE) · master-image (lọc APPROVED, nợ #30 — luôn 404 tới khi P9 xong) · business-profile (chỉ LOCALBUDD) · brand-profile (cả hai) · jobs (tái dùng `enqueueJob`) · capabilities/check. `assets.approval_state` thêm ở P7 (nợ #30). Ba câu hỏi chốt với anh Tony 09/10: cách xử lý cột `approval_state` chưa ai đặt được, quản lý token qua endpoint `F9` thay vì script, và làm cả ba phần (core/LocalBudd/SocialFlow) trong phiên. `npx tsc --noEmit` sạch (trừ lỗi chờ `prisma generate`) · `npx eslint` sạch · `npm test` 124/124 (117 cũ + 7 mới). `npm run test:tenant` chưa chạy được — sandbox phiên này không có `docker`, cùng giới hạn P3–P6. Bốn lệnh xác minh ở mục 6 |
| 09/10 | **P6 viết mã xong, CHƯA xác minh trên Postgres thật.** M02 (`quotePrice`/`checkPriceInvariants`/`checkPriceGuard`, thu hoạch R3/R4/R5 phần `chanGia.ts`) + `pricing_rules` CRUD chèn-chỉ (`effective_from` giữ lịch sử) + `GET·PUT /pricing-rules` (`L5`/`L6`). M03 (`filterProductLookup`, cắt khối `pricing` theo `L5`) + `GET /products` (lọc `branch_id`/`status`/`category`, phân trang con trỏ) + `GET·PATCH /products/:id` (chuyển `ARCHIVED` đòi thêm `L4`) + `POST /products`. Phạm vi hẹp lại theo xác nhận của anh Tony (hai câu hỏi 09/10): không dựng luồng "thẻ chào giá" (`pricing_card`, C1–C28, nợ #26), chi phí lá/cành trang trí để nợ kỹ thuật (#27) thay vì đoán số. Soát nguồn harvest lật ra hai điểm lệch tài liệu/mã mới (`mucThu.ts`/`uocPhi.ts` xếp nhầm M02, `sanTran.ts` không thuần) — điểm lệch #10/#11 `RA_SOAT_THU_HOACH.md`, nợ #28/#29, sửa `HARVEST_MANIFEST.md` mục 3.1 theo mã thật. `tsc --noEmit` sạch · `npm test` 117/117 (36 ca mới) · `eslint` sạch · `products-pricing.test.ts` (10 ca mới) dừng đúng ở "Can't reach database server" — sandbox phiên này không có `docker`/cổng 5432 đóng, cùng giới hạn đã gặp ở P3/P4/P5. Bốn lệnh xác minh trên Postgres thật ở mục 6 |


| 09/10 | **P7 — `LocalBudd` và `SocialFlow`, hết mức có thể trong phiên.** `LocalBudd`: bỏ `media_assets` (chết hẳn, không ai đọc), thêm `FloraOsCoreClient` (client HTTP thật, bốn thao tác READ đúng đặc tả); `products`/`product_assets`/`generation_jobs`/`projects` KHÔNG bỏ được — đặc tả 08 mục 4 chỉ định nghĩa endpoint đọc, không có endpoint ghi cho LocalBudd tạo Product Master, và không có cơ chế cho client chỉ-có-HTTP nhận/hoàn tất `generation_jobs` (core lấy job bằng `SELECT ... FOR UPDATE SKIP LOCKED`, cần Postgres trực tiếp) — ghi vào `LocalBudd/TECHNICAL_DEBT.md`, cần chủ sản phẩm quyết định. `SocialFlow`: `accounts` nhận cột `organization_id` qua `migrations.py` (đúng lệ forward-only của repo, không sửa UNIQUE(platform) cũ), mọi endpoint CRUD tài khoản (`GET/POST /api/accounts`, `login`, `check`, `delete`, `login-extended`, và `manual_login.py`) lọc theo tổ chức, `add_account` chặn 409 khi hai tổ chức tranh cùng platform (sửa luôn một lỗi thật: `INSERT OR REPLACE` cũ âm thầm ghi đè tài khoản tổ chức khác). Đây KHÔNG phải ranh giới bảo mật — SocialFlow không có cơ chế xác thực máy gọi máy nào, và D1 (đa tenant hay đơn tenant) vẫn còn mở vì `posts` và các bảng nghiệp vụ khác chưa có `organization_id` — ghi vào `SocialFlow/TECHNICAL_DEBT.md` (mới tạo). Xác minh: `ast.parse` (cú pháp) trên ba tệp sửa của SocialFlow, chạy `run_migrations()` thật trên bản sao `socialflow.db` (thêm cột + index sạch, idempotent); không khởi động được `uvicorn`/import `fastapi` trong sandbox này vì `backend/venv` là virtualenv macOS thật (symlink `python3` trỏ `/Library/Developer/CommandLineTools/...`), không phải lỗi mã. Đã tích lại `Checklist_Thuc_Thi.md` cho đúng thực tế (SocialFlow tích, LocalBudd chưa tích, cả hai kèm chú thích) |
| 09/10 | **P7 — `SocialFlow` nghiệm thu trên máy thật.** Chạy `main.py` qua `venv/bin/python -m uvicorn main:app` trên máy Mac thật (cổng 8001, vì cổng 8000 bị một dịch vụ khác trên máy chiếm từ trước). Test end-to-end bằng curl trên `backend/socialflow.db` thật (đã có sẵn ba tài khoản `linkedin`/`instagram`/`facebook`, tất cả `organization_id = NULL`): tạo tài khoản `twitter` dưới một tổ chức khác — thành công; tổ chức thứ hai giành cùng platform — chặn đúng 409; `GET /api/accounts?organization_id=...` lọc đúng cả hai chiều (tổ chức test không thấy ba tài khoản thật, tổ chức mặc định không thấy tài khoản test); xoá tài khoản test sau khi xác minh, ba tài khoản thật không bị ảnh hưởng. Cập nhật `SocialFlow/TECHNICAL_DEBT.md` mục xác minh |
