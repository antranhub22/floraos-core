# Rà soát đồng bộ & tích hợp ba repo — floraos-core · SocialFlow · LocalBudd

**Ngày rà soát:** 2026-09-10
**Phạm vi:** mọi mặt tiếp giáp giữa ba repo — SSO, Integration API, mô hình tenant, dữ liệu dùng chung, tài sản ảnh, hàng đợi job, hạn mức/usage, cấu hình môi trường, trạng thái git.
**Cách làm:** đọc mã thật trên máy anh, chạy `tsc`/`vitest`, đối chiếu từng hợp đồng JSON hai chiều — không dựa vào tài liệu tự khai.

---

## 0. Kết luận một dòng

Mã của mặt tiếp giáp **floraos-core ↔ LocalBudd** đã viết gần đủ và khớp nhau đến từng tên trường, **nhưng chưa từng chạy được một lần nào** — thiếu biến môi trường, sai cổng, Prisma client cũ làm LocalBudd không biên dịch nổi. Mặt tiếp giáp **floraos-core ↔ SocialFlow** thì **chưa tồn tại** ngoài các dòng chú thích. Chưa có commit nào ở cả ba repo chụp lại trạng thái này.

| Mặt tiếp giáp | Mức đồng bộ thực tế | Đánh giá |
|---|---|---|
| core ↔ LocalBudd | **~60%** | Hợp đồng đúng, đường dây chưa nối điện |
| core ↔ SocialFlow | **~5%** | Chỉ có chú thích trong mã, không có mã |
| LocalBudd ↔ SocialFlow (qua core) | **0%** | Ranh giới M04a→M04b chưa có đường đi thật |

---

## 0b. Cập nhật 2026-09-10 — Đợt 0 + 1 + 2 đã thực thi

Anh Tony chốt bốn quyết định (AskUserQuestion) và giao phạm vi Đợt 0+1+2. Phần dưới đây ghi lại cái gì đã sửa; các mục 2–4 giữ nguyên làm hồ sơ chẩn đoán, đọc kèm bảng này.

| Mục | Trạng thái sau đợt |
|---|---|
| 2.1 LocalBudd không biên dịch được | ⏳ **Chờ anh** — `npx prisma generate` + `db push`. Sandbox 403 với `binaries.prisma.sh`, cả từ máy anh lẫn từ container |
| 2.2 Thiếu biến môi trường nối sang core | ✅ Đã thêm vào `.env`, `.env.local`, `.env.example` của LocalBudd |
| 2.3 Cổng lệch ba chiều | ✅ Chốt 3100 / 3000 / 8000; `npm run dev` của core mang sẵn `-p 3100` |
| 2.4 Chưa commit gì | ✅ Commit cả ba repo, LocalBudd chuyển sang nhánh riêng |
| 2.5 SocialFlow ở tài khoản GitHub khác | ⏳ **Chờ anh** — việc sở hữu repo, không sửa bằng mã được |
| 3.1 Token toàn cục → rò dữ liệu chéo tổ chức | ✅ `/integration/*` nhận `X-FloraOS-SSO`; LocalBudd gửi JWT của chính người dùng. 7 ca test cách ly mới |
| 3.2 Hạn mức không chặn được gì | ✅ `ensureCoreAllowsJob()` — `await`, ba mã lỗi tách bạch (403/422/503) |
| 3.3 Master Image không tải được | ✅ Trả `url` ký sẵn tuyệt đối, hạn 15 phút |
| 3.4 Ba nguồn sự thật về thương hiệu | ◐ Core ↔ LocalBudd đã nối (`design_contract` dựng từ `brand_profiles`, `forbidden_styles` áp như ràng buộc cứng). SocialFlow còn nguyên — Đợt 3 |
| 3.5 Bốn lời gọi là mã chết | ✅ Cả bốn đã có nơi gọi |
| 3.6 Chi phí không chảy về core | ◐ Cổng chặn đã đóng; `POST /integration/usage` vẫn chưa ai gọi (nợ #44) |
| 3.7 / 3.8 SocialFlow không xác thực | ⏳ Đợt 3, ngoài phạm vi đã giao |
| 4.1 Mâu thuẫn D1 | ✅ Anh phân xử: đa tenant thật. Đặc tả 08 §2 sửa theo |
| 4.2 Năm bảng của LocalBudd | ✅ Đặc tả 08 §2 ghi đúng thực tế từng bảng |
| 4.3 `.env.example` lệch `env.ts` | ✅ |
| 4.4 Nhóm C/D chưa bắt đầu | ⏳ **Chờ anh chốt domain + hosting** |

**Cổng xác minh sau đợt:** core — `tsc` sạch, `eslint` 0 lỗi, `npm test` **175/175**. LocalBudd — `npm test` **14/14** (cổng test mới dựng), `eslint` 166 vấn đề (giảm 1 so với baseline 167), `tsc` còn đúng 20 lỗi client-Prisma-cũ. Test cần Postgres/Supabase sống vẫn chưa chạy được ở đây.

---

## 1. Những gì ĐÃ khớp — không phải làm lại

Phần này quan trọng ngang phần lỗi: đừng đụng vào những chỗ đã đúng.

**1.1 SSO core → LocalBudd khớp từng chi tiết.** Đã đối chiếu tay:

| Điểm | floraos-core | LocalBudd | Khớp |
|---|---|---|---|
| Tên cookie | `floraos_sso` (`core/http/cookies.ts`) | `floraos_sso` (`lib/auth.ts`) | ✅ |
| Thuật toán | HS256 viết tay, `node:crypto` | HS256 viết tay, `node:crypto` | ✅ |
| Khoá | `SSO_SESSION_SECRET` | `SSO_SESSION_SECRET` | ✅ **giá trị thật trên máy anh trùng nhau** (đã đối chiếu bằng SHA-256, 64 ký tự, cùng vân tay `ca811d82…`) |
| Nội dung claims | `sub`/`org`/`email`/`iat`/`exp` | cùng năm trường, chép lại | ✅ |
| Hạn | 15 phút + `POST /api/v1/sso/refresh` | đọc `exp`, từ chối khi hết hạn | ✅ |
| Chiều ký | chỉ core ký | chỉ verify, không có hàm `sign` | ✅ đúng thiết kế |

**1.2 Hợp đồng Integration API core ↔ LocalBudd khớp về hình dạng.** Đối chiếu từng lời gọi:

| Lời gọi | Client LocalBudd chờ | Core thật trả | Khớp |
|---|---|---|---|
| `GET /integration/products` | `{data[], next_cursor}` | `{data, next_cursor}` (`list-products.ts:59`) | ✅ |
| `GET /integration/products/:id/master-image` | `{master, ratios[]}`, 404 → `null` | đúng hình dạng, `notFound()` ba trường hợp | ✅ |
| `POST /integration/jobs` | `{deduped, usage:{costCredit, balanceAfter}}` | đúng (`enqueue-job.ts:22–25`) | ✅ |
| Mã feature `landing.generate` / `catalog.generate` | ánh xạ tay ở `report-generation-job-to-core.ts` | có đăng ký trong `pricing.ts` | ✅ |
| Xác thực | `Authorization: Bearer <token>` | `requireIntegrationContext` đọc đúng header | ✅ |
| Ai khai `organization_id` | không bao giờ khai | giải từ token, không nhận từ body | ✅ đúng đặc tả 08 §3 |

**1.3 floraos-core tự nó lành mạnh.** `npx tsc --noEmit` sạch; `vitest` 27 tệp / **168 test xanh**. (87 test cách ly tenant cần Postgres thật — không chạy được trong môi trường rà soát này, cần anh chạy lại trên máy có DB.)

**1.4 SocialFlow đã xong đa tenant nội bộ (D1 Pha 2, A1–A7).** `organization_id` có mặt trên `posts`/`signals`/`content_plans`/`content_queue`/`assets`/`brand_config`, sáu agent đã lọc theo tổ chức, `PipelineStatus` tách theo tổ chức, chạy lô song song có giới hạn. Nền tảng để nối SSO đã sẵn.

---

## 2. P0 — Chặn cứng: hôm nay ba repo KHÔNG chạy chung được

### 2.1 LocalBudd không biên dịch được — 20 lỗi TypeScript

Chạy thật `npx tsc --noEmit` trong `LocalBudd`: **20 lỗi**, tất cả cùng một gốc — Prisma client sinh sẵn trong `node_modules` còn theo lược đồ TRƯỚC Unified Shell B2, trong khi `prisma/schema.prisma` đã có `organization_id` và `core_product_id`.

Các tệp gãy: `lib/auth.ts`, `product.repository.ts`, `PrismaPageRepository.ts` (5 chỗ), `generate/landing`, `generate/catalogue`, `pages/route.ts`, `pages/[id]/qa`, hai use-case Generate.

Đã thử `npx prisma generate` trên máy anh: **403 Forbidden** khi tải engine từ `binaries.prisma.sh` — mạng của phiên này bị chặn. Anh phải chạy lệnh này ở terminal riêng của mình.

Kèm theo: **`LocalBudd/prisma/` không có thư mục `migrations/`**. Nghĩa là lược đồ chỉ tồn tại ở tệp `schema.prisma` và ở bất cứ thứ gì đang nằm trên Supabase — không có cách nào tái lập, không có cách nào biết DB thật đã có hai cột mới hay chưa.

### 2.2 Thiếu hẳn biến môi trường nối sang core

`LocalBudd/src/lib/env.ts` khai báo `FLORAOS_CORE_BASE_URL` và `FLORAOS_CORE_INTEGRATION_TOKEN`. Nhưng:

```
grep FLORAOS_CORE  LocalBudd/.env  LocalBudd/.env.local  LocalBudd/.env.example
→ KHÔNG CÓ Ở CẢ BA TỆP
```

Hệ quả cụ thể, không phải lý thuyết:
- `FLORAOS_CORE_BASE_URL` rơi về mặc định `http://localhost:3100/api/v1` — không có gì chạy ở cổng 3100.
- `FLORAOS_CORE_INTEGRATION_TOKEN` là `undefined` → `HttpFloraOsCoreClient.token()` ném lỗi ngay lời gọi đầu tiên.

**Kết luận rút ra:** B2c và B2d chưa từng chạy thật một lần nào. `GET /api/v1/core-products` hôm nay luôn trả 502; `reportGenerationJobToCore` luôn rơi vào nhánh `.catch()` và chỉ ghi log.

### 2.3 Ba cổng lệch nhau ba chiều

| Ai | Chạy ở đâu | Nghĩ bên kia ở đâu |
|---|---|---|
| floraos-core | 3000 (mặc định `next dev`, không đặt `PORT`) | LocalBudd ở **3001** (`NEXT_PUBLIC_LOCALBUDD_URL`) |
| LocalBudd | **3000** (`PORT=3000`, `APP_URL=http://localhost:3000`) | core ở **3100** (mặc định trong `env.ts`) |
| SocialFlow | 8000 (`start.sh`) | — (không biết core tồn tại) |

Core và LocalBudd cùng đòi cổng 3000 → không khởi động đồng thời được. Thẻ "Mở sang LocalBudd" ở màn Trải nghiệm (`experience-grid.tsx`) trỏ 3001 → link chết.

### 2.4 Toàn bộ công việc Unified Shell chưa commit

| Repo | Nhánh | Tệp đang dirty |
|---|---|---|
| floraos-core | `soat-p1-p8-va-sua` | **21** (gồm cả `UNIFIED_SHELL.md` chưa được theo dõi, `src/components/`, `src/app/(app)/`, `src/app/api/v1/sso/`) |
| LocalBudd | **`main`** ⚠️ | **62** |
| SocialFlow | `feat/media-hub` | **16** |

Hai vấn đề:
1. **Không có một commit/tag nào chụp được trạng thái nhất quán của ba repo.** Không thể triển khai, không thể quay lui, không thể để người khác dựng lại. "Đồng bộ 100%" mà không có mốc đồng bộ thì không kiểm chứng được.
2. **LocalBudd đang sửa thẳng trên `main`** — trái quy tắc anh đã đặt ("mọi sửa đổi phải nằm trên branch mới").

### 2.5 SocialFlow nằm ở tài khoản GitHub khác

| Repo | Remote |
|---|---|
| floraos-core | `github.com/antranhub22/floraos-core` |
| LocalBudd | `github.com/antranhub22/localbudd` |
| SocialFlow | `github.com/**inbharatai**/SocialFlow` |

Một cấu phần lõi của nền tảng nằm ngoài quyền sở hữu của hai cấu phần kia. Cần xử lý trước khi go-live (fork về, transfer, hoặc chốt rõ quan hệ).

---

## 3. P1 — Lỗ hổng thiết kế ở mặt tiếp giáp

### 3.1 Một token tích hợp toàn cục ⊗ SSO đa tổ chức = rò dữ liệu chéo tổ chức

Đây là mâu thuẫn kiến trúc nghiêm trọng nhất trong bản rà soát này, và nó **sinh ra từ chính việc B2 làm xong**.

- SSO (B2a) làm LocalBudd biết `organization_id` của người đang đăng nhập, đổi theo từng người.
- `FloraOsCoreClient` (B2c) xác thực bằng **một** `FLORAOS_CORE_INTEGRATION_TOKEN` duy nhất trong biến môi trường, gắn cứng vào **một** tổ chức.
- `GET /api/v1/core-products` chỉ kiểm "có đăng nhập không", rồi proxy thẳng.

⇒ Người của tổ chức B đăng nhập vào LocalBudd sẽ thấy **danh mục sản phẩm của tổ chức A** — tổ chức đã cấp token. Core làm đúng phần của nó (giải `organization_id` từ token, không tin client); lỗ nằm ở phía LocalBudd.

Hôm nay chưa nổ vì mới có một tổ chức (AVI GIFT) và vì token còn chưa được cấp. Nó nổ đúng ngày có tổ chức thứ hai.

**Hai đường sửa:** (a) core cho phép đổi token lấy ngữ cảnh tổ chức theo phiên SSO — tức `/integration/*` chấp nhận thêm `floraos_sso` làm danh tính thay vì chỉ Bearer token máy-gọi-máy; hoặc (b) LocalBudd giữ bảng token theo từng tổ chức và chọn đúng token theo `session.organization_id`. Cần anh chốt — (a) sạch hơn về lâu dài, (b) nhanh hơn.

### 3.2 Hạn mức của core không chặn được gì

`reportGenerationJobToCore()` gọi **không `await`**, và `.catch()` nuốt lỗi. Job cục bộ của LocalBudd đã tạo và đã chạy trước khi core kịp nói gì.

Hệ quả: tổ chức hết credit vẫn sinh landing page và catalogue bình thường; core chỉ ghi nhận SAU, hoặc không ghi được gì nếu mạng lỗi. Điều này **được ghi rõ là có chủ đích** trong mã và trong `TECHNICAL_DEBT.md` — nên đây không phải lỗi bỏ sót, nhưng nó có nghĩa: **hiện chưa có cơ chế thu tiền/hạn mức nào thực sự hoạt động cho LocalBudd.** Nếu ý định là "core chặn thật", phải đảo thành `await` trước khi tạo job cục bộ.

### 3.3 Master Image lấy được metadata nhưng KHÔNG lấy được ảnh

`GET /integration/products/:id/master-image` trả `storage_key`, `thumb_key`, `width`, `height` — nhưng **không trả URL tải được**.

Đường tải duy nhất của core là `GET /api/v1/storage/[...key]`, và route đó chỉ chấp nhận **URL ký sẵn HMAC** (`sig` + `exp`); nó cố tình không đọc phiên và cũng không đọc integration token. Hàm `signedUrl()` hiện chỉ được gọi ở `create-upload-url.ts` và `download-optimization.ts` — cả hai đều là đường của người dùng nội bộ.

⇒ **Ranh giới bàn giao M04a → M04b (đặc tả 08 §5) chưa có đường đi thật.** SocialFlow không có cách nào lấy Master Image đã duyệt để chồng chữ/logo lên; LocalBudd cũng không hiển thị được ảnh sản phẩm (đúng như giới hạn (3) đã ghi ở B2c).

**Việc còn thiếu ở core:** một endpoint kiểu `GET /integration/assets/:id/url` trả URL ký sẵn ngắn hạn cho engine ngoài — hoặc để `master-image` trả sẵn URL ký thay vì `storage_key` trần.

### 3.4 Nhận diện thương hiệu có BA nguồn sự thật

| Nơi | Bảng | Ai ghi | Có đồng bộ không |
|---|---|---|---|
| floraos-core | `brand_profiles` | người dùng ở core | — (đặc tả 08 §4b nói đây LÀ nguồn) |
| LocalBudd | `design_contracts`, `design_directions` | tự sinh cục bộ | ❌ không gọi `getBrandProfile()` |
| SocialFlow | `brand_config` (SQLite, 1 hàng/tổ chức) | 5 route UI riêng của nó | ❌ không biết core tồn tại |

Đặc tả 08 §4b có hẳn một bảng ánh xạ `brand_profiles` → `design_contract` (`primary_color` → `colors.primary`, `tone_of_voice` → `vibe`, …) và ghi rõ `forbidden_styles` là **ràng buộc bắt buộc**, không phải gợi ý. Bảng ánh xạ đó **chưa được cài ở đâu cả**. Đổi màu thương hiệu ở core hôm nay không đổi gì ở landing page lẫn ở bài đăng.

### 3.5 Bốn trên sáu lời gọi của `FloraOsCoreClient` là mã chết

Đã grep toàn bộ `LocalBudd/src`:

| Lời gọi | Có nơi gọi không |
|---|---|
| `listProducts` | ✅ `core-products/route.ts` |
| `createJob` | ✅ hai route generate |
| `getMasterImage` | ❌ không nơi nào |
| `getBrandProfile` | ❌ không nơi nào |
| `getBusinessProfile` | ❌ không nơi nào |
| `checkCapabilities` | ❌ không nơi nào |

Core đã phơi đủ, client đã viết đủ, nhưng không ai nối vào UI/nghiệp vụ. Đây chính là 3.4 nhìn từ phía mã.

### 3.6 Chi phí thật ở hai engine không bao giờ chảy về core

`POST /integration/usage` đã có sẵn ở core (nhận `feature`/`quantity`/`cost_usd`/`status`/`job_id`). **Không repo nào gọi nó.**

Trong khi đó SocialFlow tiêu tiền thật và tự biết giá: `IMAGE_COST_USD`, `VEO_COST_PER_SECOND`, `HEYGEN_COST_PER_SECOND`. Toàn bộ khoản này vô hình với `usage` và `credit_balance` của core.

### 3.7 SocialFlow: `organization_id` do bên gọi tự khai, mặc định là chuỗi `"default"`

`DEFAULT_ORGANIZATION_ID = os.getenv("SOCIALFLOW_DEFAULT_ORGANIZATION_ID", "default")`.

Hai vấn đề chồng lên nhau:
1. **Không có xác thực nào.** Không JWT, không API key, không phiên. Bất kỳ ai gọi được API cũng đặt được `organization_id` tuỳ ý và đọc/ghi dữ liệu tổ chức khác. Chính `SocialFlow/TECHNICAL_DEBT.md` mục 1 ghi rõ điều này và nó vẫn đúng.
2. **Không gian định danh lệch.** Core dùng UUID cho `organizations.id`; SocialFlow đang dùng chuỗi `"default"`. Ngay cả khi nối SSO, dữ liệu cũ của SocialFlow không ánh xạ được sang tổ chức nào của core nếu không có một bước migrate `"default"` → UUID thật của AVI GIFT.

Thêm: `CORSMiddleware` đặt `allow_credentials=True` cho `http://localhost:3000` — cùng cổng LocalBudd đang chiếm. Khi SSO có cookie thật, cấu hình này phải siết lại.

### 3.8 SocialFlow chưa có công cụ để verify JWT

`backend/requirements.txt` có 10 gói: fastapi, uvicorn, httpx, apscheduler, python-multipart, pydantic, python-dotenv, playwright, cryptography, pillow. **Không có `PyJWT` hay `python-jose`.** `UNIFIED_SHELL.md` §3 giả định SocialFlow "xác minh bằng thư viện JWT tiêu chuẩn (PyJWT)" — thư viện đó chưa có mặt. (Không chặn: `cryptography` + `hmac` chuẩn thư viện là đủ cho HS256, nhưng phải quyết và ghi rõ.)

---

## 4. P2 — Tài liệu tự mâu thuẫn

### 4.1 Quyết định D1 được ghi ngược nhau trong CÙNG repo core

| Tài liệu | Nói gì |
|---|---|
| `docs/dac-ta/08-integration-specification.md` §2 | "Quyết định D1 đã chốt: **worker đơn tenant.** SocialFlow không tự quản lý tổ chức" |
| `docs/kien-truc/UNIFIED_SHELL.md` §4 | "**D1 chốt 2026-09-10: đa tenant thật.**" |

Mã SocialFlow đã đi theo **đa tenant thật** (A1–A7 xong). Đặc tả 08 là tài liệu hợp đồng — để nguyên thì người tiếp theo đọc sẽ xây sai.

### 4.2 Đặc tả 08 §2 nói LocalBudd bỏ năm bảng — thực tế còn cả năm

| Bảng | Đặc tả 08 §2 | Thực tế trong `LocalBudd/prisma/schema.prisma` |
|---|---|---|
| `products` | bỏ | còn — đổi nghĩa thành bản ghi tham chiếu (`core_product_id`) |
| `product_assets` | bỏ | còn nguyên |
| `media_assets` | bỏ | (không có tên này; gần nhất là `product_assets`) |
| `generation_jobs` | bỏ | còn nguyên, vẫn là hàng đợi chính |
| `projects` | bỏ, vai trò chuyển sang `workspaces` | còn nguyên, có thêm `organization_id` |

Các quyết định B2c/B2d đã cố ý đi khác đặc tả (giữ hàng đợi cục bộ, giữ bảng tham chiếu). Hợp lý — nhưng đặc tả 08 chưa được sửa theo, nên hiện có hai "sự thật" về cùng một việc.

### 4.3 `LocalBudd/.env.example` lệch với `env.ts`

`env.ts` đòi hai biến mới; `.env.example` không có. Người mới clone repo sẽ không biết mình thiếu gì cho tới khi lỗi runtime.

### 4.4 Nhóm C và D chưa bắt đầu

`next.config.ts` của core hiện chỉ có `typedRoutes: true` — **không có rewrite nào** cho `/landing`, `/catalog`, `/marketing`, `/social`. Không có Nginx/Caddy config trong repo nào. C1 (chốt domain + hosting thật) đang chờ quyết định của anh và đang chặn C2–C5, kéo theo cả nhóm D.

---

## 5. Lộ trình về đồng bộ 100%

Xếp theo thứ tự bắt buộc. Mỗi bước có tiêu chí nghiệm thu kiểm chứng được — không nhận "đã viết xong mã" làm bằng chứng.

### Đợt 0 — Làm cho ba repo chạy chung được (1–2 ngày, không cần quyết định gì thêm)

| # | Việc | Nghiệm thu |
|---|---|---|
| 0.1 | Chốt bảng cổng: core **3100**, LocalBudd **3000**, SocialFlow **8000**. Sửa `NEXT_PUBLIC_LOCALBUDD_URL=http://localhost:3000`, thêm `PORT=3100`/`dev -p 3100` cho core | Ba app khởi động đồng thời, không đụng cổng |
| 0.2 | `npx prisma generate` + `prisma db push` cho LocalBudd trên máy anh (mạng đầy đủ) | `npx tsc --noEmit` → **0 lỗi** |
| 0.3 | Thêm `FLORAOS_CORE_BASE_URL` + `FLORAOS_CORE_INTEGRATION_TOKEN` vào `.env`, `.env.local`, `.env.example` của LocalBudd. Cấp token thật bằng `POST /api/v1/integration-tokens` (client=LOCALBUDD) trên core | `GET /api/v1/core-products` trả danh sách sản phẩm AVI GIFT thật, không phải 502 |
| 0.4 | Tạo thư mục `prisma/migrations/` cho LocalBudd (migrate từ trạng thái hiện tại) | `prisma migrate status` sạch |
| 0.5 | Đưa LocalBudd sang nhánh riêng; commit toàn bộ công việc dirty ở cả ba repo; **gắn tag cùng tên trên cả ba** (vd. `unified-shell-b2`) | Ba repo cùng có một tag; `git status` sạch cả ba |
| 0.6 | Chạy `npm run test:tenant` của core trên Postgres thật (87 test chưa xác minh từ P8/P9) | 87/87 xanh |
| 0.7 | Chạy vòng SSO thật: đăng nhập core → mở LocalBudd → đổi tổ chức ở core → LocalBudd đổi theo (B1/B2a chưa từng xác minh trên DB thật) | Ghi lại kết quả từng bước vào `TRANG_THAI.md` |

### Đợt 1 — Đóng lỗ đa tenant trước khi có tổ chức thứ hai (chặn go-live)

| # | Việc | Nghiệm thu |
|---|---|---|
| 1.1 | **Quyết định của anh:** token theo tổ chức (a) core nhận `floraos_sso` ở `/integration/*`, hay (b) LocalBudd giữ bảng token theo tổ chức | Ghi vào sổ quyết định |
| 1.2 | Cài phương án đã chọn | Test hai tổ chức: người của B đăng nhập LocalBudd **không** thấy sản phẩm của A |
| 1.3 | Core: endpoint cấp URL ký sẵn cho engine ngoài (`/integration/assets/:id/url` hoặc `master-image` trả URL sẵn) | LocalBudd tải và hiển thị được Master Image đã duyệt |
| 1.4 | Sửa `08-integration-specification.md` §2: D1 = đa tenant thật; năm bảng của LocalBudd ghi đúng thực tế | Không còn hai tài liệu nói ngược nhau |

### Đợt 2 — Nối phần đang là mã chết (giá trị nghiệp vụ cao, rủi ro thấp)

| # | Việc | Nghiệm thu |
|---|---|---|
| 2.1 | LocalBudd: dựng `design_contract` từ `getBrandProfile()` theo đúng bảng ánh xạ đặc tả 08 §4b; áp `forbidden_styles` như ràng buộc cứng | Đổi `primary_color` ở core → landing page mới đổi màu theo |
| 2.2 | LocalBudd: nội dung trang lấy từ `getBusinessProfile()` (tên, điện thoại, địa chỉ, giờ mở cửa, mạng xã hội) | Sửa hồ sơ ở core → trang sinh ra đổi theo |
| 2.3 | LocalBudd: hiển thị Master Image (dùng 1.3) | Ảnh sản phẩm hiện trong catalogue |
| 2.4 | LocalBudd: gọi `checkCapabilities()` cho các thao tác nhạy cảm | Người không có quyền bị chặn đúng |
| 2.5 | **Chốt:** hạn mức core chặn thật (`await` trước khi tạo job) hay chỉ ghi nhận | Nếu chặn: tổ chức hết credit không tạo được landing page |

### Đợt 3 — Nối SocialFlow (việc lớn nhất còn lại)

| # | Việc | Phụ thuộc | Nghiệm thu |
|---|---|---|---|
| 3.1 | Chốt thư viện JWT cho Python (`PyJWT` vào `requirements.txt`, hay dùng `hmac` chuẩn) + middleware FastAPI verify `floraos_sso` | Đợt 0 | Token giả/hết hạn bị từ chối; token thật giải ra đúng `sub`/`org` |
| 3.2 | Migrate `organization_id = "default"` → UUID thật của AVI GIFT trên toàn bộ bảng SocialFlow | 3.1 | Không còn hàng nào mang `"default"` hay `NULL` |
| 3.3 | Bỏ `DEFAULT_ORGANIZATION_ID`; mọi endpoint lấy tổ chức từ token, không nhận từ body/query | 3.2 | Gọi API kèm `organization_id` tự khai bị bỏ qua, đúng đặc tả 08 §3 |
| 3.4 | Client HTTP sang core trong SocialFlow (`httpx` đã có): `getBrandProfile`, `getMasterImage`, `createJob`, `recordUsage` | 3.1, 1.3 | M04b lấy được Master Image đã duyệt và chỉ ảnh `APPROVED` |
| 3.5 | `brand_config` của SocialFlow đổi thành **cache** của `brand_profiles` bên core, không phải nguồn | 3.4 | Đổi thương hiệu ở core → bài đăng đổi theo |
| 3.6 | Báo chi phí thật (`IMAGE_COST_USD`, Veo, HeyGen) về `POST /integration/usage` | 3.4 | `usage` của core khớp chi phí thật của SocialFlow trong một chu kỳ |
| 3.7 | Siết CORS: bỏ `localhost:3000` khỏi danh sách khi đã có proxy cùng origin | Nhóm C | — |
| 3.8 | Kiểm quyền theo tổ chức cho các endpoint thao-tác-theo-ID (`approve`/`reject`/`publish`) — khoảng trống A5 để lại | 3.3 | Tổ chức A không approve được bài của B |

### Đợt 4 — Hạ tầng (chờ **quyết định của anh về domain + hosting**)

C1→C5 của `UNIFIED_SHELL.md`: chốt domain thật, Next.js multi-zone rewrites cho LocalBudd, reverse proxy cho SocialFlow, TLS, test end-to-end. **Đang bị chặn hoàn toàn bởi một quyết định chưa có.**

### Đợt 5 — Soát cuối

D1–D3 của `UNIFIED_SHELL.md`, cộng: review bảo mật độc lập phần SSO/token, và giải quyết việc SocialFlow nằm ở tài khoản GitHub khác.

---

## 6. Ba quyết định cần anh chốt để mở khoá

1. **Token theo tổ chức**: core nhận `floraos_sso` ở `/integration/*`, hay LocalBudd giữ bảng token riêng theo tổ chức? *(chặn Đợt 1, chặn go-live đa tổ chức)*
2. **Hạn mức core**: chặn thật (`await`) hay chỉ ghi nhận? *(quyết định mô hình thu tiền)*
3. **Domain + hosting thật**: `app.floraos.vn` mới chỉ là ví dụ minh hoạ trong tài liệu. *(chặn toàn bộ Đợt 4 và Đợt 5)*

---

*Rà soát dựa trên mã thật tại `~/Projects/{floraos-core,SocialFlow,LocalBudd}` ngày 2026-09-10. Đã chạy: `tsc --noEmit` (cả hai repo TS), `vitest run` (core, 168/168), `prisma generate` (thất bại do mạng). Chưa chạy được: test cách ly tenant của core và mọi luồng cần Postgres/Supabase sống.*
