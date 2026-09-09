# TRẠNG THÁI — đọc tệp này đầu tiên

**Cập nhật:** 2026-09-09 · **Dự án:** FloraOS SaaS — nền tảng đa tenant cho cửa hàng hoa

> Tệp này tồn tại để **bất kỳ phiên làm việc nào — tài khoản Claude khác, Cursor, Copilot, hay người thật — tiếp tục được từ đúng chỗ đang dừng.** Bộ nhớ và lịch sử hội thoại không chuyển được giữa các tài khoản; repo thì chuyển được. Nên trạng thái sống ở đây, không sống trong một phiên chat.
>
> **Ai sửa gì trong dự án này thì cập nhật tệp này trong cùng lần đó.** Tệp lệch trạng thái còn tệ hơn không có tệp.

---

## 1. Đang ở đâu

**Giai đoạn: P4 viết mã xong, CHƯA xác minh trên Postgres thật.** P3 nghiệm thu xong
tuyệt đối (mục 1 cũ, xem nhật ký) — 35/35 `test:tenant` xanh, `npm test` domain thuần
cũng còn để xác nhận lại trong phiên P4 (chưa có lần chạy thật riêng cho nó).

Repo nằm ở `~/Projects/floraos-core`, remote `antranhub22/floraos-core`.

Đã có (P1): bảy bảng nền · `TenantContext` giải từ `sessions.organization_id` phía máy chủ · bộ gác lọc theo tổ chức ở tầng repository · bộ test cách ly.

Đã có (P2): thu hoạch R2 nguyên vẹn, `capability-catalog.ts` 113 mã, `permission-resolver.ts` ba lớp, `role_capabilities`/`capability_overrides`, 12 endpoint quyền.

Đã có (P3), nghiệm thu xong: `assets`/`generation_jobs`(+`idempotency_key`)/`job_events`/`usage`/`audit_logs` · bốn module `src/modules/{assets,jobs,usage,audit}/` · `enqueueJob` (kiểm hạn mức → ghi usage → tạo job → NOTIFY, một giao dịch) · `GenerationJobRepository.claimNext` (`SKIP LOCKED`) · SSE `GET /jobs/:id/events` · `LocalDiskStorageProvider` (adapter tạm, nợ #15). **35/35 `npm run test:tenant` xanh trên Postgres thật** sau ba lỗi tìm-và-sửa (chi tiết ở nhật ký mục 8).

**Mới (P4, hôm nay):** `business_profiles` và `brand_profiles` (đặc tả 07 mục 4, thu
hoạch E3 từ `SocialFlow/backend/brand_kit.py`) — tách đôi hồ sơ kinh doanh (pháp lý,
liên hệ) khỏi hồ sơ thương hiệu (màu, font, tông giọng, hashtag, CTA), mỗi tổ chức đúng
một bản ghi mỗi bảng (`@@unique([organization_id])`), khoá ngoại tới `organizations`
ngay từ đầu (không lặp lại nợ #8). Module mới `src/modules/profiles/`
(`domain/profile-rules.ts` — validate mã hex, `display_name` bắt buộc; hai repository
`upsert` theo ngữ nghĩa PUT-thay-toàn-bộ, trường vắng mặt thành `null`). Route
`GET · PUT /business-profile` và `GET · PUT /brand-profile` dưới `/api/v1/`, gác bằng
`F1`/`F2` **có sẵn từ P2** — không cần thêm mã năng lực nào (đặc tả 02 đã định nghĩa
F1 `org.read`/F2 `org.update` đủ rộng cho hồ sơ tổ chức). Thêm coverage cách ly tenant ở
cả hai tầng (`tests/tenant/cach-ly-repository.test.ts`, `cach-ly-endpoint.test.ts`) và
test domain thuần (`profile-rules.test.ts`).

**Chưa xác minh trên Postgres thật.** Cùng giới hạn sandbox đã ghi ở P3: `device_bash`
của phiên này là một VM Linux (Ubuntu 22.04, `aarch64`) không có Docker và không ra
mạng tới `binaries.prisma.sh`, còn `node_modules` mang nhị phân `rollup-darwin-arm64`
(đồng bộ từ máy Mac thật) nên `vitest` không khởi động được ở đây. Không tự chạy được
`prisma generate`/`prisma db push`/`npm test`/`npm run test:tenant`/`tsc --noEmit` cho
phần chạm kiểu Prisma mới (`business_profiles`/`brand_profiles` chưa có trong client sinh
sẵn). Bốn cột Json? (`social_links`/`operating_hours`/`hashtags`/`cta_templates`/`forbidden_styles`)
dùng `as never` giống quy ước tạm của P3 (asset-repository.ts/usage-repository.ts/
audit-log-repository.ts) — đổi lại `InputJsonValue` khi có client thật, cùng đợt với việc
đó của P3 nếu còn tồn đọng.

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

1. **Chạy bốn lệnh xác minh P4 ở máy có mạng** — mã đã viết đủ (mục 1), chưa chạy được:
   ```bash
   docker compose up -d
   npx prisma generate && npx prisma db push
   npm test && npm run test:tenant
   npx tsc --noEmit
   ```
   Sau khi `prisma generate` sinh client thật: kiểm lại kiểu của
   `business_profiles`/`brand_profiles`, đổi `as never` ở
   `business-profile-repository.ts`/`brand-profile-repository.ts` sang `as InputJsonValue`
   nếu client cho phép (cùng việc còn treo từ P3 ở bốn tệp asset/usage/audit — làm chung
   một đợt nếu tiện). Tích các ô P4 ở `Checklist_Thuc_Thi.md` chỉ sau khi cả bốn lệnh xanh
   (hiện đã tích trước theo mã, cần xác nhận lại nếu có sửa).
2. Sau khi P4 xanh thật: **P5** — M01 (phụ thuộc P3, đã xong) nếu bộ ảnh vàng đã sẵn sàng.
3. Song song, không chặn ai: **bộ ảnh vàng 50–100 ảnh** theo `BO_ANH_VANG.md`, gán nhãn theo `QUY_UOC_DEM.md`. Bước đầu tiên là gom ảnh từ kho vận hành AVI GIFT.
4. Khi làm P6: chốt cách tính chi phí lá và cành trang trí, vì quy ước đếm để loại này không có số lượng.
5. Xác nhận với chủ sản phẩm giá trị mặc định của công tắc `cho_phep_tu_duyet` (`docs/dac-ta/TECHNICAL_DEBT.md` #12) trước khi màn hình duyệt đầu tiên đi vào sản xuất.
6. Xác nhận với chủ sản phẩm bảng giá `cost_credit` theo `feature` — hiện là hằng số đoán hợp lý trong mã, không phải quyết định kinh doanh đã chốt (`TECHNICAL_DEBT.md` #14).
7. Khi có UI onboarding thật cho M05 (LocalBudd): xác nhận `logo_asset_id` của
   `brand_profiles` có bắt buộc trỏ tới một `assets.kind = MASTER` đã duyệt hay chấp nhận
   bất kỳ asset nào — schema hiện không ràng buộc khoá ngoại (đặc tả 07 mục 4 khai
   `String?` thường), đây là quyết định UX chưa cần thiết ở P4.

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
