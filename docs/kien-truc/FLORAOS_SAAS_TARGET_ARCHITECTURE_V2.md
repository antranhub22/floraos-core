# FLORAOS SAAS — TARGET ARCHITECTURE V2

**Trạng thái:** LEVEL 1 — SYSTEM. Thay thế bản V1 (`FLORAOS_SAAS_TARGET_ARCHITECTURE.md`), nay chỉ còn trong lịch sử git tại commit `c224a0f`.
**Ngày:** 2026-09-09 · **Quyết định nền:** Đường A (repo core mới, giữ tách ba repo)
**Căn cứ:** `HARVEST_MANIFEST.md` · hồ sơ rà soát `SAAS_GAP_ANALYSIS.md` và `D5_D6_PHUONG_AN.md` đã xoá khỏi cây làm việc, còn trong git tại `bb39810` (xem `TRANG_THAI.md` mục 2)

---

## 1. Thay đổi so với V1

V1 đặt nguyên tắc **"Upgrade, not rebuild"** trên giả định rằng `FloraOS` là baseline sản xuất tiến hoá được. Rà soát mã bác bỏ giả định đó:

- 21/28 tệp trong `analyzer/` import `openpyxl`/`pandas` — **Excel là cấu trúc dữ liệu**, không phải định dạng xuất. Chỉ 2/28 tệp chạm OpenAI.
- Webapp gọi lõi phân tích bằng `subprocess.Popen` rồi **parse stdout**.
- Nguồn sự thật của Product Master nằm ở ba tệp Excel trong thư mục đồng bộ, bảo vệ bằng **một khoá ghi toàn cục 15 phút** thuộc về *thư mục*, không thuộc tổ chức.
- Tiêu chí nghiệm thu số 3 của chính `BAN_GIAO.md`: *"Bấm chạy khi đang mở `02_KET-QUA.xlsx` → hệ thống chặn"*.

Đó là **công cụ desktop khoác giao diện web**. Không có đường mang ràng buộc ấy vào SaaS đa tenant.

Đồng thời rà soát phát hiện điều V1 không biết: **ba repo đã độc lập xây ba mảnh khác nhau của chính kiến trúc này**, và LocalBudd — chứ không phải FloraOS — mới là repo gần đích nhất.

### 1.1 Nguyên tắc nền mới

> **Dựng core mới. Thu hoạch tối đa. Không tiến hoá tại chỗ.**
>
> Thang ưu tiên (theo `LocalBudd/ORG_docx/08`): **REUSE > EXTEND > ADAPTER > BUILD**.
> Mọi hạng mục phải được xếp hạng trước khi viết dòng mã đầu tiên. Xếp hạng BUILD cho thứ đã tồn tại ở một trong ba repo là một lỗi cần chặn ở review.

### 1.2 Cái gì thay thế "Current Code Preservation" (§18 của V1)

V1 §18 (10 quy tắc bảo tồn mã cũ) **bị bãi bỏ**. Thay bằng:

1. Luật nghiệp vụ được thu hoạch **phải đi kèm test khoá nó**; test xanh trên core mới trước khi coi luật đó đã chuyển xong.
2. `FloraOS` v1 **đóng băng tính năng** kể từ ngày phê duyệt tài liệu này. Chỉ sửa lỗi chặn vận hành.
3. Không migrate dần. Cắt sang hệ mới **một lần** (mục 14).
4. Không repo nào được sinh thêm bảng trùng với entity lõi (mục 4.1).

---

## 2. Bốn repo và quyền sở hữu

| Nhóm | Repo | Trách nhiệm | Trạng thái |
|---|---|---|---|
| **0 — Core** | **`floraos-core`** *(mới)* | Org · Workspace · Membership · RBAC · cách ly tenant · BusinessProfile · BrandProfile · Product Master · Asset · GenerationJob · Usage · AuditLog · M01 · M02 · M03 · M04a · Integration API | **Dựng mới** |
| 1 — Legacy | `FloraOS` *(hiện tại)* | Phục vụ AVI GIFT tới ngày cắt. Đóng băng tính năng | Nghỉ hưu |
| 2 — Storefront | `LocalBudd` | M05 Landing Page · M06 Catalog · UI soạn Business Profile | Đang phát triển — **giữ nguyên tiến độ** |
| 3 — Marketing | `SocialFlow` | M04b Marketing Creative · M07 Content & Social Publishing | Đang phát triển |
| 4 — Messaging | *(chưa đặt tên)* | M08 Customer Chat | Chưa bắt đầu |

### 2.1 Ranh giới sở hữu dữ liệu — luật cắt

V1 §2.1 nói *"không repo ngoài nào nhân bản mô hình dữ liệu lõi"* nhưng không định nghĩa "lõi", nên LocalBudd đã hợp lệ xây `products`, `product_assets`, `media_assets`, `generation_jobs`. Luật thay thế:

> **Core sở hữu entity mà NHIỀU HƠN MỘT module đọc.**
> **Engine sở hữu entity chỉ module của nó đọc.**

| Thuộc `floraos-core` (canonical) | Thuộc `LocalBudd` | Thuộc `SocialFlow` |
|---|---|---|
| `organizations` · `workspaces` · `memberships` · `roles` · `branches` | `pages` · `page_versions` · `layouts` | `content_queue` · `posts` |
| `business_profiles` · `brand_profiles` | `design_directions` · `design_contracts` | `campaigns` · `signals` · `content_plans` |
| `products` · `product_variants` · `product_analyses` · `pricing_rules` | `publish_records` *(trang)* | `post_metrics` · `weekly_metrics` · `content_insights` |
| `assets` · `generation_jobs` · `usage` · `audit_logs` | | `social_accounts` *(credential theo org)* |

**Hệ quả bắt buộc:** LocalBudd bỏ `products`, `product_assets`, `media_assets`, `generation_jobs`, `projects` khỏi schema của nó và đọc core qua API (mục 13). Đây là công việc có tên trong lộ trình (P7), không phải việc tuỳ nghi.

### 2.2 Thứ bậc tài liệu

```
LEVEL 1 — SYSTEM
   FLORAOS_SAAS_TARGET_ARCHITECTURE_V2.md   (tài liệu này)
   Thắng tuyệt đối về: sở hữu repo, đa tenant, RBAC, GenerationJob, Usage,
   Asset, Review & Approval, Experience/trial, thứ tự pha hệ thống.
        ↓
LEVEL 2 — MODULE
   ALG_AI_Vision_Architecture_V2_Canonical.md      (M01)
   M04_FLORAOS_PRODUCT_IMAGE_OPTIMIZER_FULL.md     (M04a, và phạm vi M04b)
   LocalBudd/ORG_docx/01–08                        (M05, M06)
   Thắng về: interface nhà cung cấp, phân loại, pipeline nội bộ, Identity
   Guard, ngưỡng kỹ thuật, quyết định trong module.
        ↓
LEVEL 3 — PROCESS
   Coding Agent Guides · AGENTS.md
   Không bao giờ thắng về nội dung kỹ thuật.
```

**Luật ràng buộc:** Level 2 không được đè ràng buộc Level 1. Agent gặp xung đột **dừng và báo**, không tự chọn.

---

## 3. Khuôn kiến trúc

Chép từ `LocalBudd/src/`, chuẩn hoá lại phần đang không nhất quán.

```
floraos-core/
├── prisma/schema.prisma          nguồn sự thật lược đồ
├── src/
│   ├── core/
│   │   ├── ports/                LLMProvider · VisionProvider · StorageProvider
│   │   │                         · QueueProvider · PublisherProvider
│   │   ├── tenancy/              ngữ cảnh org, bộ gác truy vấn
│   │   └── rbac/                 76 mã năng lực (thu hoạch R2)
│   ├── modules/<tên>/
│   │   ├── domain/               thực thể + luật, KHÔNG import hạ tầng
│   │   ├── use-cases/            điều phối
│   │   ├── infra/                repository, Prisma
│   │   └── adapters/             ra ngoài
│   └── app/api/v1/               API-first, có phiên bản
└── tests/
```

**Ba chuẩn hoá so với LocalBudd hiện tại:**
1. Thống nhất `use-cases` (LocalBudd đang lẫn `use-cases` / `usecases` / `repositories` / `services`).
2. `domain/` không được import Prisma — đó là điều kiện để test luật nghiệp vụ không cần cơ sở dữ liệu.
3. Mọi module đủ bốn thư mục; `mapping-engine` của LocalBudd hiện chỉ có `adapters` — không lặp lại.

**Giữ lại từ LocalBudd:** `circuit-breaker` cho lời gọi AI, tiền tố `/api/v1/`, và mẫu tách endpoint `approve` khỏi endpoint sinh kết quả (`/pages/[id]/approve`) — mẫu này đúng §7 và phải áp cho mọi module.

**Quy ước đặt tên:** lược đồ dùng `snake_case` tiếng Anh (theo LocalBudd). Mã nguồn dùng tiếng Anh. *Lý do: khuôn được chép là của LocalBudd; trộn `PascalCase` tiếng Việt của FloraOS vào sẽ tạo lược đồ song ngữ không ai điều hướng được.* Thuật ngữ nghiệp vụ tiếng Việt giữ trong nhãn giao diện và tài liệu, không vào lược đồ.


### 3.1 Ranh giới TypeScript / Python (quyết định D6-1)

Core web và API là TypeScript. M01 (phân tích ảnh) và M04a (tối ưu ảnh) là Python. Hai bên nối nhau **qua bảng `generation_jobs`, không qua HTTP và tuyệt đối không qua tiến trình con**.

```
core (TS)                          worker (Python)
────────────                       ────────────────
tạo generation_jobs  ──┐
  organization_id      │  Postgres   ┌── SELECT … FOR UPDATE SKIP LOCKED
  status = PENDING     ├────────────►│   LISTEN/NOTIFY đánh thức
  payload              │             └── cập nhật stage → result → status
ghi usage tại enqueue ─┘                  ghi assets
đọc trạng thái ◄─────────────────────────────┘
```

**Luật:**
1. Worker **không nhận `organization_id` từ đâu khác ngoài dòng job**. Không suy từ dữ liệu ảnh, không lấy từ tham số client.
2. Worker cập nhật `stage` khi đổi bước, `result` khi có phán quyết, `status` sau cùng. Ba trục theo mục 7.
3. `usage` ghi ở **điểm tạo job phía core** (mục 9), không ghi ở worker — hạn mức phải chặn trước khi job vào bảng.
4. Cổng `QueueProvider` khai ở mục 3 bọc cơ chế này. Đổi sang Redis về sau là thay adapter sau cổng, không sửa module.
5. HTTP nội bộ TS → Python **chỉ** cho lời gọi ngắn đồng bộ (kiểm tra sức khoẻ, tra một phép đo). Không chạy job qua HTTP — mục 7 cấm chặn HTTP cho thao tác AI dài.
6. **Cấm tuyệt đối `subprocess.Popen` + parse stdout** dưới mọi hình thức. Đây là seam của FloraOS v1 và là một trong những lý do dựng lại.

**Bố trí repo:** `floraos-core/` chứa cả hai — `src/` (Next.js/TS) và `workers/` (Python), dùng chung một Postgres và một lược đồ Prisma. Worker đọc lược đồ sinh sẵn, không tự khai bảng.

---

## 4. Mô hình dữ liệu lõi

```
User → Membership → Organization → Workspace → Branch
                          ↓
              Shared Business Data Layer
         (BusinessProfile · BrandProfile · Product Master · Asset)
                          ↓
              Independent Business Modules
                          ↓
            GenerationJob · Usage · AuditLog
```

**Thực thể lõi:** `users` · `organizations` · `workspaces` · `memberships` · `roles` · `branches` · `business_profiles` · `brand_profiles` · `products` · `product_variants` · `product_images` · `product_analyses` · `pricing_rules` · `assets` · `generation_jobs` · `usage` · `audit_logs`

**Luật an toàn tenant:** mọi bản ghi thuộc tenant BẮT BUỘC mang `organization_id`. Không ngoại lệ, kể cả bảng tra cứu.

---

## 5. Đa tenant và cách ly

| Yêu cầu | Cách thực hiện |
|---|---|
| Mọi bản ghi có chủ | `organization_id` bắt buộc; kiểm ở tầng repository, không phải ở route |
| API xác thực quyền truy cập tenant | Ngữ cảnh org lấy từ phiên đăng nhập, **không bao giờ** từ tham số client |
| Đường dẫn lưu trữ theo tenant | `org/<organization_id>/<product_id>/<asset_id>.<ext>` — thay cấu trúc `product-images/<danh-mục>/<mã>.jpeg` của FloraOS |
| Job giữ ngữ cảnh tenant | `organization_id` là cột bắt buộc của `generation_jobs`, truyền suốt tới worker |
| Webhook/callback ngoài phân giải đúng tenant | Token callback mang định danh org đã ký |
| Không khoá toàn cục | **Bỏ hoàn toàn `he_thong.giu_khoa()`.** Đồng thời hoá bằng giao dịch cơ sở dữ liệu, không bằng tệp khoá |
| Mã API AI | Xem quyết định mở D2 (mục 17) |
| Kiểm chứng | Bộ test cách ly tenant chạy trong CI: mỗi endpoint bị thử với ngữ cảnh org khác và phải trả về không tìm thấy |

---

## 6. Xác thực và phân quyền

**Thu hoạch R2:** chép bảng 76 mã năng lực từ `FloraOS/src/lib/maChucNang.ts` (A1–A7, B1–B16, C1–C28, D1–D17, E1–E7) kèm `tests/maChucNang.test.ts`.

**Giữ nguyên cơ chế cắt ba lớp** — đây là thứ FloraOS làm đúng và hiếm:

```
mặc định theo vai  →  bảng công tắc trong cấu hình  →  TRẦN CỨNG
                                                       (cắt sau cùng)
```

26 mã có trần cứng. Trần cứng cắt **sau** bảng công tắc, nên không đường nào từ giao diện hay cơ sở dữ liệu mở được nó. Luật này chuyển sang core nguyên vẹn.

**Ba mở rộng bắt buộc:**

1. **Phạm vi org và branch.** Quyền không còn là `(vai, mã)` mà là `(vai, mã, phạm vi)` với phạm vi ∈ {organization, branch}. Chuỗi Chain cần Sale chỉ thấy chi nhánh mình, Điều hành thấy toàn tổ chức.
2. **Vai là bản ghi, không phải enum.** Bỏ `enum Role` của FloraOS (còn mang giá trị di sản `MANAGER`). Vai tối thiểu: `Experience User` · `Admin/Điều hành` · `Sale` · `Điều phối`.
3. **Tách `*.approve` khỏi hành động sinh kết quả.** Chạy job và duyệt kết quả là hai năng lực khác nhau, không bao giờ gói chung.

```
product.read · product.create · product.update · product.approve
pricing.read · pricing.manage
vision.analyze         (M01)
media.optimize         (M04a — chạy job tối ưu)
media.approve          (M04a — nâng Master Image thành ảnh chính thức)
catalog.create · catalog.publish
social.publish
chat.manage
```

---

## 7. Kiến trúc Job

**Thu hoạch E2:** lấy `job_status` + `job_step` từ `LocalBudd/prisma/schema.prisma`, **thêm trục thứ ba**.

```
Request → GenerationJob → Queue/Worker → AI/External → Result → Persist → Notify UI
```

Ba trục **không được gộp thành một enum**:

```
status    ← TOÀN HỆ THỐNG, giống hệt ở mọi module
              PENDING → PROCESSING → COMPLETED / FAILED / CANCELLED

stage     ← THEO MODULE, dẫn thanh tiến trình, tự do theo module
              M04a: ANALYZING | DETECTING | ISOLATING | ENHANCING
                    | BACKGROUND | COMPOSING | VERIFYING | GENERATING_OUTPUTS

result    ← PHÁN QUYẾT NGHIỆP VỤ, chỉ module có cổng an toàn
              M04a: SAFE | GOOD | WARNING | REJECTED
```

> **Kết quả bị từ chối KHÔNG phải job lỗi.** Cổng an toàn từ chối nghĩa là job chạy đúng và đi tới phán quyết: `status = COMPLETED`, `result = REJECTED`. Ánh xạ nó thành `FAILED` làm hỏng retry (chạy lại cho cùng phán quyết) và làm sai kế toán sử dụng. `FAILED` chỉ dành cho hỏng kỹ thuật — timeout, crash, lỗi nhà cung cấp.

`CANCELLED` bắt buộc hỗ trợ: người dùng huỷ được job còn `PENDING`.

**Bền vững:** trạng thái job nằm ở Postgres, không ở RAM (FloraOS giữ `LUOT: dict` trong bộ nhớ, mất khi khởi động lại). Worker tách khỏi tiến trình web. Không chặn HTTP cho thao tác AI dài.

**Giữ lại từ FloraOS:** trải nghiệm nhật ký theo dòng qua SSE — đó là phần FloraOS làm tốt và người dùng đã quen. Chép mô hình *nhật ký cộng dồn đọc lại được từ vị trí bất kỳ*, bỏ phần parse stdout.

---

## 8. Asset

**Thu hoạch E1:** bảng `assets` của SocialFlow đã có `parent_asset_id`, `sha256`, `origin`, `provider`, `cost_usd`, `metadata`, `state`, `aspect_ratio`, `thumb_path`. Lấy nguyên, thêm phần còn thiếu.

```
assets
├── organization_id        ← THÊM
├── product_id
├── parent_asset_id        (đã có — chính là source_asset_id của V1 §15.1)
├── type · state · storage_key · aspect_ratio · thumb_path
├── version                ← THÊM
├── provider · model · model_version     ← model/version THÊM
├── pipeline_version       ← THÊM
├── parameters · prompt
├── sha256 (input/output hash)
├── quality_score · identity_score       ← THÊM
├── generated_flags        ← THÊM (không bao giờ mặc định ngầm)
├── cost_usd
└── created_at
```

**Loại asset:** ảnh gốc · ảnh đã phân tích · ảnh đã tăng cường · **master image** · ảnh marketing · ảnh catalog · ảnh landing page · ảnh/video social.

**Asset gốc bất biến.** Asset dẫn xuất là phiên bản mới hoặc asset mới — không bao giờ ghi đè tệp nguồn. `version` là cơ chế lịch sử duy nhất; module không được dựng bảng phiên bản song song.

---

## 9. Usage và sẵn sàng thu phí

Chưa triển khai thanh toán ở giai đoạn này, nhưng kiến trúc phải đỡ được.

```
usage
├── organization_id
├── user_id
├── feature          vision.analyze · media.optimize · catalog.generate · social.publish …
├── job_id
├── quantity
├── status
├── cost_credit
└── created_at
```

**Một bảng Usage duy nhất, không phải một bảng mỗi module.** Mọi module ở cả ba repo ghi vào cùng bản ghi này, phân biệt bằng `feature`. Không repo nào được dựng bảng usage/credit riêng.

**Hạn mức chặn tại điểm vào hàng đợi, không chặn trong module.** Hạn mức Experience (mục 11.1) kiểm với `usage` **trước khi** `generation_jobs` được tạo. Module vượt hạn mức không bao giờ tới được worker. Mọi module gọi cùng một dịch vụ hạn mức.

*Ghi chú thu hoạch:* FloraOS đã có mô hình chi phí dùng được — `uocPhi.ts` (ước phí lượt chạy) và `YeuCauChay` (lượt vượt ngưỡng chi tiêu chờ duyệt). SocialFlow đã có `cost_usd` ở `assets` và `video_jobs`. Cả hai gộp vào bảng này.

---

## 10. Review & Approval

**Thu hoạch E4** từ `qa_results` của LocalBudd, tổng quát hoá.

```
INPUT → PROCESS → GENERATED RESULT → USER REVIEW → EDIT → APPROVE → PERSIST
```

Đầu ra AI **không** tự động thành dữ liệu nghiệp vụ chính thức trừ khi được cấu hình rõ ràng. Kết quả đã duyệt trở thành đầu vào dùng lại được cho module khác. Duyệt là một năng lực riêng (mục 6).

---

## 11. Loại workspace

### 11.1 Experience

Workspace demo tạm, để người dùng mới trải nghiệm với đầu vào tối thiểu.

**Nạp sẵn:** BusinessProfile mẫu · BrandProfile mẫu · sản phẩm mẫu · quy tắc giá mẫu · catalog mẫu · dữ liệu marketing mẫu.

Người dùng chỉ cung cấp phần **động**: ảnh sản phẩm, tên sản phẩm, thông tin đơn giản. **Không** bắt dựng business profile đầy đủ.

```
Vào Experience → Tạo/nạp workspace demo → Tải ảnh → Phân tích AI
→ Xem kết quả → Review → Approve → Gợi ý thông minh chức năng kế
→ Người dùng chọn → Review/Approve
```

Không tự động chạy hết mọi chức năng tính phí — mỗi chức năng phải chọn riêng.

**Hạn mức trial** cấu hình được: `trial_count` · `trial_limit` · `trial_reset_at` · `trial_status`. Thi hành ở tầng Usage (mục 9).

### 11.2 Single Shop / Brand
Một tổ chức là một cơ sở kinh doanh. Vai: Admin/Điều hành, Sale. RBAC mở rộng đỡ vai tương lai.

### 11.3 Chain / Flower Delivery Network
```
Organization
├── Central Operation
├── Branch A · Branch B · Branch C …
```
Vai: Điều hành, Sale, Điều phối. Đỡ nhiều sale, nhiều điều phối, nhiều chi nhánh, quản lý tập trung, truy cập cấp chi nhánh và cấp tổ chức. Mô hình quyền phải đỡ **cả hai phạm vi** (mục 6).

---

## 12. Module

Tám module, chín đơn vị triển khai (M04 tách đôi ở ranh giới Master Image).

| Mã | Tên | Repo | Trạng thái thu hoạch |
|---|---|---|---|
| **M01** | Product Image Analysis | `floraos-core` | **REUSE R1** hợp đồng AI 40KB + **EXTEND E5/E6** engine đếm & màu. Bỏ toàn bộ lớp Excel |
| **M02** | Product Cost & Pricing | `floraos-core` | **REUSE R3/R4/R5** kèm test bất biến hai phía. Quy tắc giá chuyển từ cấu hình toàn cục sang **theo tổ chức** |
| **M03** | Product Search / KB | `floraos-core` | Xây lại trên Postgres; logic lọc thu hoạch từ `locTraCuu.test.ts` |
| **M04a** | Product Image Optimization | `floraos-core` | **BUILD** theo spec 1.159 dòng. Identity Guard là cổng cứng |
| **M04b** | Marketing Creative | `SocialFlow` | Đã có phần lớn; nối vào Asset của core |
| **M05** | Landing Page Generator | `LocalBudd` | Giữ nguyên; bỏ bảng trùng, đọc core qua API |
| **M06** | Catalog Generator | `LocalBudd` | Như trên |
| **M07** | Content & Social Publishing | `SocialFlow` | **EXTEND E7** adapter 6 nền tảng, nhận ngữ cảnh org |
| **M08** | Customer Chat | Chưa có repo | **BUILD**, sau |

**M01 — Product Image Analysis.** Vào: ảnh sản phẩm, tên tuỳ chọn. Ra: nhận diện hoa/cấu phần, số lượng, cấu trúc, thuộc tính, màu, kích thước, độ tin cậy, dữ liệu sản phẩm có cấu trúc. Kết quả phải xem và sửa được; kết quả đã duyệt cập nhật Product Master.

**M04a — Product Image Optimization.** Nguyên tắc chi phối: *Tăng cường sản phẩm, không tái sinh sản phẩm.* Nhận dạng sản phẩm — số lượng, màu, hình dáng, tỉ lệ tương đối — là bất biến; chỉ ánh sáng, độ nét, nhiễu, cân bằng trắng, nền và bố cục được đổi. **Product Identity Guard** chạy như cổng cứng bắt buộc sau tăng cường, so vân tay sản phẩm trước/sau bằng hợp đồng phân tích của M01. Phán quyết `SAFE`/`GOOD`/`WARNING`/`REJECTED`; `REJECTED` thì giữ ảnh gốc, không trả ảnh tăng cường. Tăng cường chạy **một lần** ra Master Image; các tỉ lệ khác đến từ Smart Reframe, không chạy lại AI.

**M04a ở core, không ở SocialFlow** vì Identity Guard gọi M01 hai lần mỗi ảnh — giữ cạnh M01 tránh vòng gọi liên repo trong SLA xử lý, và đầu ra của nó là `assets` + `products`, entity lõi.

**Luật M04b:** không bao giờ chạy lại tăng cường sản phẩm, không bao giờ đổi nhận dạng sản phẩm. Nó soạn **lên trên** một Master Image đã duyệt. Thay đổi chạm vào chính sản phẩm thuộc M04a và phải qua Identity Guard.

**Độc lập module:** mọi module phải chạy được độc lập. `User → Product Image Analysis` phải hoạt động mà không cần Landing Page hay Catalog. Nhưng module dùng dữ liệu chung khi có sẵn, để giảm nhập liệu trùng.

---

## 13. Integration Layer

```
floraos-core  ──  Integration API (/api/v1, có phiên bản, xác thực máy-máy)
                        │
     ┌──────────────────┼──────────────────┬─────────────────┐
     ↓                  ↓                  ↓                 ↓
LocalBudd Adapter  SocialFlow Adapter  Chat Adapter    (tương lai)
M05 · M06          M04b · M07          M08
```

Core **phơi ra**: BusinessProfile · BrandProfile · Product Master · Asset (gồm Master Image) · GenerationJob · Usage · kiểm quyền.

**Bắt buộc:**
- Xác thực máy-máy theo tổ chức; engine ngoài không bao giờ tự khai `organization_id`.
- API có phiên bản (`/api/v1/`) ngay từ đầu — LocalBudd đã theo lối này.
- Engine ngoài **không** giữ bản sao entity lõi (mục 2.1).
- Core không ghép chặt vào chi tiết cài đặt của engine ngoài.

### 13.1 Ma trận chọn công nghệ AI — bắt buộc trước khi chọn nhà cung cấp

Module nào gọi mô hình AI hoặc dịch vụ AI ngoài phải hoàn thành và được chủ sản phẩm ký duyệt ma trận này **trước khi** triển khai.

| Năng lực | Ứng viên OSS | Phương án thương mại | Giấy phép | Yêu cầu GPU | Benchmark | **Soát cách ly tenant** | Sẵn sàng production |
|---|---|---|---|---|---|---|---|

**Soát cách ly tenant là bắt buộc**, không tuỳ chọn: nhà cung cấp chạy trên worker và GPU dùng chung, nên mỗi ứng viên phải được đánh giá xem dữ liệu của tổ chức này có rò sang job của tổ chức khác không — qua cache còn nóng, phiên bền, lịch sử prompt, hay mặc định dùng dữ liệu để huấn luyện phía nhà cung cấp.

---

## 14. Chuyển AVI GIFT sang hệ mới

Dữ liệu production hiện **rất nhỏ**: `01_NHAP-LIEU.xlsx` 320KB, `02_KET-QUA.xlsx` 862KB, 14 thư mục ảnh. Đây không phải bài toán dữ liệu lớn.

```
FloraOS v1 (đóng băng, vẫn chạy)
        │
        │  adapter nhập MỘT CHIỀU (thu hoạch A3: excel_parser.py, ket_qua_phan_tich.py)
        ↓
floraos-core — AVI GIFT là tổ chức đầu tiên
        │
        ↓
   cắt một lần → FloraOS v1 ngừng
```

**Luật:** đồng bộ một chiều, Excel → core. Không bao giờ ghi ngược. Không chạy song song lâu — đó là cái bẫy đắt nhất của mọi cuộc thay nền. Ngày cắt được chọn khi core đủ chức năng cho công việc hằng ngày của Sales và Điều phối, đo bằng chính bảng nghiệm thu trong `BAN_GIAO.md`.

---

## 15. Lộ trình

| Pha | Việc | Phụ thuộc | Ước lượng |
|---|---|---|---|
| **P0** | Dựng `floraos-core` theo khuôn mục 3. Chép `LocalBudd/ORG_docx/01–08` làm chuẩn tài liệu | — | 1 tuần |
| **P1** | **Organization · Workspace · Membership · Branch · cách ly tenant** — trước mọi thu hoạch khác | P0 | 2–3 tuần |
| **P2** | **RBAC** — thu hoạch 76 mã + phạm vi org/branch + vai thành bản ghi + tách `*.approve` | P1 | 1–2 tuần |
| **P3** | **Asset + GenerationJob + Usage trong một đợt** (§9: hạn mức kiểm tại điểm enqueue → cùng đường mã) | P1 | 2–3 tuần |
| **P4** | **BusinessProfile + BrandProfile** (thu hoạch E3 từ `brand_config`) | P1 | 1 tuần |
| **P5** | **M01** — hợp đồng AI + engine đếm + engine màu trên nền mới | P3 | 2–3 tuần |
| **P6** | **M02 + M03** — engine giá kèm bất biến; tìm kiếm trên Postgres | P5 | 2 tuần |
| **P7** | **Integration Layer**; LocalBudd bỏ bảng trùng, đọc core qua API; adapter SocialFlow | P3, P4 | 2–3 tuần |
| **P8** | **Nhập dữ liệu AVI GIFT** (mục 14) | P4, P5, P6 | 1 tuần |
| **P9** | **M04a** Identity Guard theo spec — *chạy song song được với P7/P8* | P3, P5 | 3–4 tuần |
| **P10** | **Experience Mode** | P2, P3 | 2 tuần |
| **P11** | **Cắt sang hệ mới**; FloraOS v1 ngừng | P8, P10 | 1 tuần |
| **P12** | Hardening — bảo mật, observability, hiệu năng, hồi quy | tất cả | 2 tuần |

**Tổng thô: 5–6 tháng** với một đội nhỏ, P9 chạy song song.

**So với V1:** bỏ pha "Existing Core Migration" (không còn migrate mã cũ); tách Usage ra khỏi pha 7 muộn màng của V1 và gộp vào P3 cùng job; thêm P8 và P11 mà V1 không có.

---

## 16. Tiêu chí nghiệm thu

**SaaS** — nhiều tổ chức dùng đồng thời · dữ liệu cách ly (có bộ test CI chứng minh) · quyền đúng · một tổ chức chứa nhiều chi nhánh.

**Experience** — bắt đầu với thông tin tối thiểu · dữ liệu demo có sẵn · đi hết chức năng lõi qua các bước dẫn dắt · hạn mức có giới hạn và đặt lại được.

**Dữ liệu** — BusinessProfile nhập một lần · Product Master dùng lại được xuyên module · kết quả AI cập nhật được dữ liệu đã duyệt · module chia sẻ dữ liệu mà không ghép chặt · **không repo nào giữ bản sao entity lõi**.

**Module** — cả chín đơn vị chạy độc lập. M04a: Identity Guard chặn được một thay đổi sản phẩm mô phỏng, ảnh gốc được giữ. M04b: soạn trên Master Image đã duyệt mà không đổi nhận dạng sản phẩm.

**AI/Job** — thao tác dài dùng job · job có trạng thái quan sát được trên ba trục · job lỗi retry an toàn · `COMPLETED/REJECTED` không bị coi là lỗi · kết quả được lưu.

**Chuyển đổi** — AVI GIFT vận hành được trên core với đúng bảng nghiệm thu của `BAN_GIAO.md` · dữ liệu Excel đã nhập đủ · FloraOS v1 ngừng mà không mất việc nào.

---

## 17. Quyết định mở — chủ sản phẩm chốt

| # | Quyết định | Chặn pha | Khuyến nghị |
|---|---|---|---|
| **D1** | SocialFlow lên đa tenant, hay ở lại làm **worker đơn tenant** mà core gọi kèm ngữ cảnh org? | P7 | **Worker đơn tenant** — rẻ hơn nhiều, đúng tinh thần không ghép chặt core vào engine ngoài. SQLite hiện tại không phục vụ đa tenant được |
| **D2** | Mã API AI: mỗi tổ chức tự mang khoá, hay khoá nền tảng + tính credit theo org? | P3 | Chưa khuyến nghị — phụ thuộc mô hình kinh doanh. Ảnh hưởng thẳng tới mục 9 và ma trận 13.1 |
| **D3** | Job `COMPLETED / result = REJECTED` **có tính phí không**? | P3 | Chưa khuyến nghị — ảnh hưởng cả kế toán lẫn trải nghiệm |
| **D4** | Ngày đóng băng tính năng của FloraOS v1 | P0 | Ngay khi tài liệu này được duyệt |
| ~~**D5**~~ | **ĐÃ CHỐT 09/09 — D5-c: cổng ở mức Hợp đồng JSON.** Adapter GPT-4o làm trước (thu hoạch R1 nguyên vẹn); adapter Florence-2 + SAM2 làm sau, đổi khi thắng trên bộ ảnh vàng theo ma trận 13.1 | — | Xem 17.1 |
| ~~**D6**~~ | **ĐÃ CHỐT 09/09 — D6-1: Postgres làm hàng đợi.** Worker Python lấy việc từ `generation_jobs` bằng `SELECT … FOR UPDATE SKIP LOCKED` + `LISTEN/NOTIFY`; HTTP nội bộ chỉ cho lời gọi ngắn đồng bộ | — | Xem 3.1 |

**Còn mở: D1, D2, D3, D4.** D1 và D4 nên chốt trước khi bắt đầu P0. D2 và D3 phải chốt trước khi bắt đầu P3.

### 17.1 D5 — quyết định: cổng ở mức Hợp đồng JSON (D5-c)

Interface Vision **không** khai theo `detect()/segment()/recognize()` như `M01` mục 5 bản cũ. Cổng là:

```
port VisionAnalyzer:
    analyze(image, context) -> ProductAnalysis     // đúng JSON Contract, M01 mục 8
```

- **Adapter 1 — `OpenAIStructuredProvider`** (làm ở P5): một lời gọi structured output `response_format: json_schema` + đồng thuận 3 lượt + luật chạy lượt hai theo cảnh báo. Thu hoạch R1 nguyên vẹn.
- **Adapter 2 — `OpenSourceProvider`** (sau, không chặn P5): Florence-2 → SAM2 → bộ nhận dạng loài, gộp thành cùng `ProductAnalysis`.
- **Cổng nghiệm thu để đổi:** adapter 2 phải bằng hoặc hơn adapter 1 trên bộ ảnh vàng, đo bằng ma trận 13.1. Không đổi bằng lập luận, chỉ đổi bằng số đo.

**Ba kênh đếm giữ nguyên bất kể provider.** `count_engine.py` chốt số cuối từ `chot(kenh_llm, kenh_dt, kenh_chan)`; hai kênh sau thuần numpy và không thuộc phạm vi cổng này.

**Bắt buộc kèm theo:** xây **bộ ảnh vàng 50–100 ảnh sản phẩm thật có nhãn số lượng đúng** trong P5. Chưa có bộ này thì không nghiệm thu được adapter nào, không hồi quy được phần thu hoạch, và ma trận 13.1 không có dữ liệu để điền.

**Luật giữ lại từ `M04` mục 5:** Identity Guard phải dùng **cùng một provider và cùng model version cho cả hai lần phân tích** của một job, ghi vào metadata asset (mục 8). Luật này đúng với mọi provider — nó không phụ thuộc D5.

### 17.2 D6 — quyết định: Postgres làm hàng đợi (D6-1)

Xem mục 3.1.

---

## 18. Luật vận hành cho AI coding agent

Trước khi viết mã cho bất kỳ hạng mục nào, agent phải trả lời:

1. Hạng mục này xếp hạng gì trong **REUSE / EXTEND / ADAPTER / BUILD**?
2. Nếu REUSE hoặc EXTEND: nguồn nằm ở repo nào, tệp nào, bao nhiêu dòng?
3. Luật nghiệp vụ đi kèm được khoá bởi test nào? Test đó đã chép sang chưa?
4. Entity chạm tới thuộc core hay thuộc engine (mục 2.1)?
5. Đã có `organization_id` chưa?
6. Thao tác này dài bao lâu — có phải là job không?
7. Có ghi `usage` không?
8. Kết quả có cần duyệt trước khi thành dữ liệu chính thức không?
9. Năng lực nào gác nó? Năng lực duyệt có tách riêng không?

Xếp hạng **BUILD** cho thứ đã tồn tại ở một trong ba repo là lỗi phải chặn ở review.

> **Nguyên tắc cuối:** Đây không phải viết lại từ số không. Ba repo đã xây ba mảnh khác nhau của chính kiến trúc này. Việc của core là **ghép ba mảnh lại trên một nền đa tenant sạch** — và chỉ xây mới đúng sáu hạng mục mà không repo nào có.
