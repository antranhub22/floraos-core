# 07 — Đặc tả cơ sở dữ liệu

Postgres, truy cập qua Prisma. `prisma/schema.prisma` là nguồn sự thật; tài liệu này giải thích vì sao lược đồ có hình dạng đó. Khi hai bên lệch nhau, lược đồ đúng và tài liệu này phải sửa.

Worker Python đọc lược đồ sinh sẵn, không tự khai bảng.

## 1. Bốn luật bất di bất dịch

| # | Luật | Kiểm ở đâu |
|---|---|---|
| 1 | Mọi bảng thuộc tenant có `organization_id NOT NULL`, có index. Không ngoại lệ, kể cả bảng tra cứu và workspace trải nghiệm | Bộ test cách ly trong CI |
| 2 | Đặt tên `snake_case` tiếng Anh. Thuật ngữ tiếng Việt chỉ ở nhãn giao diện. **Ngoại lệ (RS-5, 18/09):** `flower_taxonomy` và `flower_confusable_pairs` — tên cột tiếng Việt (`ma_loai`, `ten_chuan`, `so_bong_tren_dvt`, `muc_do_nham`…) đã chạy thật, đổi lại tốn một migration cho hai bảng tra cứu tĩnh không ai gọi qua tên cột từ ngoài; xem mục 16 | Review |
| 3 | Asset gốc bất biến. Dẫn xuất là bản ghi mới, nối bằng `parent_asset_id` và `version` | Review |
| 4 | Job tách ba trục `status` / `stage` / `result`. Không gộp thành một cột | Review |

**Ngoại lệ của Luật 1 — danh sách đóng, đối chiếu 18/09, cập nhật 19/09.** Mười hai bảng không có `organization_id`, và mỗi bảng phải nêu được lý do khi review:

| Bảng | Lý do |
|---|---|
| `users` | Một người thuộc nhiều tổ chức qua `memberships` |
| `organizations` | Chính nó là tổ chức; khoá lọc là cột `id` |
| `roles` *(qua)* `role_capabilities` | Danh mục vai cấp nền tảng, không phải dữ liệu tenant |
| `job_events` | Bảng con, thuộc tổ chức qua `generation_jobs.organization_id` |
| `video_scenes` | Bảng con, thuộc tổ chức qua `video_jobs.organization_id` |
| `ai_capabilities` · `ai_models` | Sổ đăng ký nền AI cấp nền tảng; `tests/helpers/database.ts` cũng không truncate hai bảng này |
| `flower_taxonomy` · `flower_confusable_pairs` | Tri thức ngành hoa, không phải dữ liệu của một cửa hàng — xem mục 16 |
| `platform_operators` · `platform_role_capabilities` · `platform_audit_logs` | Console Vận hành Nền tảng (P25, 19/09) — dữ liệu của người vận hành xuyên tổ chức, không thuộc một tổ chức nào. Từ vựng năng lực `N1`–`N8` TÁCH HẲN khỏi `roles`/`role_capabilities` của tenant (D-N6) — không dùng `capability_scope`, không thêm giá trị `PLATFORM` vào enum đó. Xem `../kien-truc/KE_HOACH_CONSOLE_VAN_HANH.md` mục 4.1 |
| `market_sources` · `trend_signals` · `trend_timeseries` · `topics` · `topic_signals` · `topic_scores` · `research_runs` · `provider_health` | Dữ liệu nghiên cứu thị trường cấp nền tảng (Market Intelligence Engine, Đợt A) — thu thập xu hướng chung toàn ngành, không thuộc một tổ chức nào; chỉ có `content_opportunities` thuộc tenant |

Một bảng tự nhận ngoại lệ mà không nêu được lý do ở trên là lỗi chặn ở review.

*Ba câu cũ ở mục 1, mục 16 và mục 19 từng nói ba con số khác nhau ("duy nhất `users`" · "ngoại lệ duy nhất `flower_taxonomy`" · "hai bảng, gồm `platform_audit_logs`"), không câu nào đúng — bảng trên thay cả ba. Cập nhật 19/09: ba bảng Console Vận hành đã XÂY (P25a), không còn là đề xuất — dòng cũ ghi "`platform_audit_logs` chưa tồn tại... dải N1–N8 chưa xây" đã hết hiệu lực.*

## 2. Kiểu liệt kê

> **Đối chiếu 18/09 với `prisma/schema.prisma`.** Bốn enum từng lệch giá trị (`order_status`, `production_status`, `delivery_status`, `asset_kind`) đã sửa theo lược đồ; mười một enum có trong lược đồ mà thiếu ở đây đã bổ sung; hai enum chỉ tồn tại trên giấy (`consent_state`, `catalog_link_state`) đã bỏ.

```prisma
enum organization_type { EXPERIENCE  SINGLE  CHAIN }
enum workspace_kind    { EXPERIENCE  PRODUCTION }
enum membership_status { INVITED  ACTIVE  SUSPENDED }
enum capability_scope  { ORGANIZATION  BRANCH }
enum job_status        { PENDING  PROCESSING  COMPLETED  FAILED  CANCELLED }
enum approval_state    { PENDING  APPROVED  REJECTED }
enum product_status    { DRAFT  ACTIVE  ARCHIVED }
enum asset_kind        { ORIGINAL  ANALYZED  ENHANCED  MASTER  RATIO  MARKETING  VIDEO  CATALOG  LANDING  SOCIAL }
enum asset_state       { PROCESSING  READY  FAILED  ARCHIVED }
enum trial_status      { ACTIVE  EXHAUSTED  EXPIRED }
enum order_status      { DRAFT  CONFIRMED  PROCESSING  DELIVERED  COMPLETED  CANCELLED }
enum production_status { WAITING  ASSIGNED  ARRANGING  QUALITY_CHECK  READY }
enum delivery_status   { PENDING  DISPATCHED  DELIVERING  DELIVERED  FAILED }

// M08 hội thoại · M09 khách hàng · M10 đơn hàng
enum chat_channel          { WEB_WIDGET  INTERNAL_DASHBOARD  STOREFRONT_CATALOG  LANDING_PAGE  FACEBOOK_MESSENGER  ZALO_OA  EMBEDDED_WIDGET  ZALO }
enum chat_sender_type      { USER  ASSISTANT  SYSTEM }
enum consent_channel       { ZALO_ZNS  SMS  PHONE_CALL  PROMOTION }
enum customer_tier         { NEW  BRONZE  SILVER  GOLD  VIP }
enum occasion_register     { FESTIVE  NEUTRAL  SOLEMN }
enum voucher_discount_type { PERCENTAGE  FIXED_AMOUNT }
enum stock_status          { IN_STOCK  PRE_ORDER_ONLY  OUT_OF_STOCK }

// M04c video · hệ thống template · Integration
enum video_format       { REEL_15S  TIKTOK_30S  STORY_15S  SLIDESHOW  PRODUCT_PAGE  AD_MOTION }
enum video_stage        { DRAFT  SCRIPT_GENERATING  SCRIPT_READY  SCRIPT_APPROVED  RENDERING  RENDER_COMPLETED  APPROVED  REJECTED  FAILED }
enum template_family    { GT  IT  CT  ST  OT }
enum integration_client { LOCALBUDD  SOCIALFLOW }
enum ai_mode           { API  SELF_HOST  DETERMINISTIC }
enum ai_privacy_level  { PUBLIC  SHOP  SENSITIVE }
enum ai_measure_state  { CHUA_DO  THU_NGHIEM  SAN_XUAT }
enum market_source_status  { ACTIVE  DEGRADED  DISABLED }
enum trend_topic_status    { EMERGING  RISING  STABLE  DECLINING  SEASONAL  BREAKOUT }
enum research_run_type     { DAILY_DEEP  INTRADAY_PULSE  WEEKLY_DEEP  MANUAL }
enum research_run_status   { PENDING  RUNNING  PARTIAL_SUCCESS  COMPLETED  FAILED }
enum provider_health_status { HEALTHY  DEGRADED  UNAVAILABLE }
```

`order_status`, `production_status` và `delivery_status` là ba enum riêng, không phải ba giá trị của một enum. Một đơn đã xác nhận, đang cắm, chưa giao là một trạng thái hợp lệ và thường gặp; gộp ba trục lại sẽ cần tích Descartes của chúng và sẽ mất một trục ngay lần đầu ai đó thêm giá trị.

`stage` và `result` **không phải enum**. Chúng là `String?` vì mỗi module có bộ giá trị riêng, và màn hình theo dõi job toàn hệ thống chỉ đọc `status`. Bộ giá trị hợp lệ của từng module ghi ở mục 6.

## 3. Nền tảng đa tenant — P1

```prisma
model users {
  id            String   @id @default(uuid())
  email         String   @unique
  password_hash String?
  name          String?
  avatar_url    String?
  locale        String   @default("vi")
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt

  memberships   memberships[]
  sessions      sessions[]
}

model sessions {
  id              String    @id @default(uuid())
  user_id         String
  token_hash      String    @unique
  organization_id String?          // tổ chức đang hoạt động của phiên
  created_at      DateTime  @default(now())
  expires_at      DateTime
  revoked_at      DateTime?

  user            users     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  @@index([user_id])
}

model organizations {
  id             String            @id @default(uuid())
  name           String
  slug           String            @unique
  type           organization_type @default(SINGLE)
  credit_balance Int               @default(0)
  credit_plan    String?
  settings       Json?             // bảng công tắc cấp tổ chức — xem bảng khoá dưới đây
  created_at     DateTime          @default(now())
  updated_at     DateTime          @updatedAt
}

**Khoá của `organizations.settings`.** Cột Json chứ không phải bảng riêng: đây là những công tắc ít, đọc cùng lúc với chính bản ghi tổ chức, và không cái nào cần truy vấn theo giá trị. Mọi đường ghi vào cột này dùng **hợp nhất nông** — đặt một khoá không được xoá các khoá khác.

| Khoá | Kiểu | Mặc định khi vắng | Nghĩa |
|---|---|---|---|
| `cho_phep_tu_duyet` | boolean | `true` | Bản ghi do chính người duyệt tạo có hiện trong hàng đợi duyệt của họ không |
| `bo_may_phan_tich` | string | `"openai_structured"` | Bộ máy M01 chạy cho mọi lượt phân tích của tổ chức. Giá trị lạ rơi về mặc định thay vì ném lỗi — một khoá cấu hình hỏng không được chặn cả luồng phân tích |

model workspaces {
  id              String        @id @default(uuid())
  organization_id String
  name            String
  kind            workspace_kind @default(PRODUCTION)
  trial_count     Int           @default(0)
  trial_limit     Int?
  trial_reset_at  DateTime?
  trial_status    trial_status?
  created_at      DateTime      @default(now())

  @@index([organization_id])
}

model branches {
  id              String   @id @default(uuid())
  organization_id String
  name            String
  code            String
  address         String?
  is_active       Boolean  @default(true)
  created_at      DateTime @default(now())

  @@unique([organization_id, code])
  @@index([organization_id])
}

model roles {
  id              String   @id @default(uuid())
  organization_id String?          // null = vai hệ thống, dùng chung mọi tổ chức
  key             String           // dieu_hanh · sale · dieu_phoi · experience_user
  name            String
  is_system       Boolean  @default(false)
  created_at      DateTime @default(now())

  capabilities    role_capabilities[]
  @@unique([organization_id, key])
  @@index([organization_id])
}

model role_capabilities {
  id              String           @id @default(uuid())
  role_id         String
  capability_code String                              // A1 … K2, xem tài liệu 02
  scope           capability_scope @default(ORGANIZATION)

  role            roles            @relation(fields: [role_id], references: [id], onDelete: Cascade)
  @@unique([role_id, capability_code])
}

model capability_overrides {
  id              String   @id @default(uuid())
  organization_id String
  role_id         String
  capability_code String
  allowed         Boolean
  updated_by      String
  updated_at      DateTime @updatedAt

  @@unique([organization_id, role_id, capability_code])
  @@index([organization_id])
}

model memberships {
  id              String            @id @default(uuid())
  organization_id String
  user_id         String
  role_id         String
  branch_id       String?           // null = phạm vi toàn tổ chức
  status          membership_status @default(INVITED)
  invited_at      DateTime          @default(now())
  joined_at       DateTime?

  user            users             @relation(fields: [user_id], references: [id], onDelete: Cascade)
  @@unique([organization_id, user_id])
  @@index([organization_id])
  @@index([user_id])
}
```

**Trần cứng không nằm trong cơ sở dữ liệu.** Nó là bảng hằng trong mã, cắt sau cùng. Đặt nó vào `capability_overrides` là biến một luật không mở được thành một dòng ai sửa cũng được — mất toàn bộ ý nghĩa. 18 mã có trần cứng, xem tài liệu 02.

## 4. Hồ sơ kinh doanh và thương hiệu — P4

```prisma
model business_profiles {
  id              String   @id @default(uuid())
  organization_id String
  legal_name      String?
  display_name    String
  phone           String?
  email           String?
  address         String?
  website         String?
  social_links    Json?
  tax_code        String?
  description     String?
  operating_hours Json?
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  @@unique([organization_id])
}

model brand_profiles {
  id               String   @id @default(uuid())
  organization_id  String
  primary_color    String?
  secondary_color  String?
  accent_color     String?
  background_color String?
  text_color       String?
  font_heading     String?
  font_body        String?
  logo_asset_id    String?
  tone_of_voice    String?
  hashtags         Json?     // theo nền tảng
  cta_templates    Json?
  forbidden_styles Json?
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt

  @@unique([organization_id])
}
```

`background_color` và `text_color` có mặt vì `design_contracts` của `LocalBudd` cần đủ bốn màu để dựng landing page. Thiếu hai trường này thì M05 phải tự đoán màu nền, và mỗi trang ra một kiểu.

Thu hoạch E3 từ `SocialFlow/backend/brand_kit.py` — bảng `brand_config` ở đó gộp hồ sơ kinh doanh và hồ sơ thương hiệu làm một. Core tách đôi: hồ sơ kinh doanh là dữ liệu pháp lý và liên hệ, hồ sơ thương hiệu là dữ liệu tạo sinh. Landing page cần cả hai; sinh ảnh marketing chỉ cần cái sau.

## 5. Asset — P3

Thu hoạch E1 từ bảng `assets` thật của SocialFlow (23 cột, xác nhận trong `socialflow.db`), thêm 11 cột.

```prisma
model assets {
  id               String     @id @default(uuid())
  organization_id  String
  product_id       String?              // null ở workspace trải nghiệm
  parent_asset_id  String?              // phả hệ; asset gốc có null
  kind             asset_kind
  state            asset_state @default(PROCESSING)
  version          Int         @default(1)

  storage_key      String               // org/<organization_id>/<product_id>/<asset_id>.<ext>
  thumb_key        String?
  mime_type        String
  width            Int?
  height           Int?
  aspect_ratio     String?
  file_size        Int?

  provider         String?
  model            String?
  model_version    String?
  pipeline_version String?
  parameters       Json?
  prompt           String?

  input_sha256     String?
  output_sha256    String?
  quality_score    Float?
  identity_score   Float?
  generated_flags  Json?                // { generative_fill_used, requires_reshoot_warning }
  cost_usd         Float?

  metadata         Json?
  created_by       String
  created_at       DateTime   @default(now())

  @@index([organization_id])
  @@index([organization_id, product_id])
  @@index([parent_asset_id])
  @@index([output_sha256])
}
```

`generated_flags` không bao giờ mặc định ngầm. Ảnh phải dùng generative fill vì chất lượng quá kém được đánh dấu ở cả metadata lẫn giao diện.

Đường dẫn lưu trữ theo **tổ chức**, không theo người dùng. Người dùng đổi vai, rời tổ chức hoặc bị xoá; quyền sở hữu dữ liệu thuộc về tổ chức. `created_by` lưu ai tải lên, nhưng không tham gia vào đường dẫn.

## 6. Job — P3

```prisma
model generation_jobs {
  id              String     @id @default(uuid())
  organization_id String
  workspace_id    String
  branch_id       String?
  user_id         String
  product_id      String?

  feature         String                // vision.analyze · media.optimize · catalog.generate …
  status          job_status @default(PENDING)
  stage           String?               // chỉ có giá trị khi status = PROCESSING
  result          String?               // phán quyết nghiệp vụ, độc lập với status

  idempotency_key String?               // YC-U7 — chống trùng 24 giờ

  payload         Json
  output          Json?
  error           String?
  attempts        Int        @default(0)

  created_at      DateTime   @default(now())
  started_at      DateTime?
  completed_at    DateTime?
  cancelled_at    DateTime?

  @@unique([organization_id, feature, idempotency_key])
  @@index([organization_id])
  @@index([status, created_at])         // worker quét bằng index này
  @@index([organization_id, user_id])
}
```

`idempotency_key` không có ở bản đặc tả gốc của tài liệu này — thêm ở P3 để
thực thi `YC-U7` (đặc tả 06 mục 2: *"Mọi POST tạo job nhận Idempotency-Key.
Cùng khoá trong 24 giờ trả lại job cũ thay vì tạo job mới"*). Duy nhất theo
(`organization_id`, `feature`, `idempotency_key`) — hai tổ chức, hoặc hai
tính năng của cùng một tổ chức, dùng lại cùng chuỗi khoá không đụng nhau.

### 6.1 Nhật ký tiến trình — `job_events`

Đặc tả 05 mục 8 nói *"một bảng phụ theo `job_id` với số thứ tự tăng dần,
không giữ trong bộ nhớ"* nhưng không đặt tên hay khai cột — làm ở đây, vì
lược đồ là nguồn sự thật của cả tệp này.

```prisma
model job_events {
  id         String   @id @default(uuid())
  job_id     String
  seq        Int
  event      String              // stage · log · done
  payload    Json
  created_at DateTime @default(now())

  @@unique([job_id, seq])
  @@index([job_id, seq])
}
```

Ghi cộng dồn, không sửa/xoá dòng đã ghi. `GET /jobs/:id/events` (SSE, đặc tả
06 mục 7) đọc từ đây, nối tiếp qua `Last-Event-ID` bằng `seq` cuối client đã
thấy (`YC-J9`). `seq` tính bằng `MAX(seq)+1` trong phạm vi một `job_id` — an
toàn vì một job chỉ có đúng một worker sở hữu sau khi `claimNext` (mục 6),
không có hai người ghi đồng thời trong vận hành bình thường; đây là một giả
định, không phải khoá — ghi ở `TECHNICAL_DEBT.md`.

### Bộ giá trị của `stage` và `result` theo module

| Module | `stage` | `result` |
|---|---|---|
| M01 phân tích ảnh | `DETECTING` · `SEGMENTING` · `RECOGNIZING` · `MAPPING_TAXONOMY` | `OK` · `LOW_CONFIDENCE` |
| M04a tối ưu ảnh | `ANALYZING` · `DETECTING` · `ISOLATING` · `ENHANCING` · `BACKGROUND` · `COMPOSING` · `VERIFYING` · `GENERATING_OUTPUTS` | `SAFE` · `GOOD` · `WARNING` · `REJECTED` |
| M05 landing page | `INIT` · `GENERATING` · `FINALIZING` | `OK` |
| M06 catalog | `INIT` · `GENERATING` · `FINALIZING` | `OK` |
| M04b biến thể marketing | `ANALYZING` · `SMART_REFRAME` · `VERIFYING` · `GENERATING_OUTPUTS` | `SAFE` · `WARNING` · `REJECTED` |
| M04c video | không dùng `stage` của job — có trục riêng, enum `video_stage` chín giá trị ở mục 20 | — |

*(Hai hàng cuối bổ sung 18/09; bản trước chỉ có M01, M04a, M05, M06.)*

Cổng **Subject Integrity** của M04b đo tỷ lệ điểm ảnh lõi chủ thể còn trùng khít với Master Image: `SAFE` ≥ 0,999 · `WARNING` ≥ 0,99 · dưới nữa `REJECTED`, và `REJECTED` thì worker không ghi asset nào. Ngưỡng là luật nghiệp vụ nên phía TS tính lại phán quyết từ số đo thay vì tin `result` worker gửi kèm.

**`result = REJECTED` không phải job lỗi.** Cổng an toàn từ chối nghĩa là job chạy đúng và đi tới phán quyết: `status = COMPLETED`, `result = REJECTED`. Ánh xạ nó thành `FAILED` làm hỏng retry — chạy lại cho ra đúng phán quyết cũ, chỉ tốn GPU — và làm sai kế toán sử dụng. `FAILED` chỉ dành cho hỏng kỹ thuật: timeout, crash, lỗi nhà cung cấp.

### Cách worker lấy việc

```sql
SELECT * FROM generation_jobs
 WHERE status = 'PENDING' AND feature = $1
 ORDER BY created_at
 FOR UPDATE SKIP LOCKED
 LIMIT 1;
```

Đánh thức bằng `LISTEN/NOTIFY` trên kênh theo `feature`. Không polling dày, không HTTP, không tiến trình con.

Worker lấy `organization_id` **chỉ từ dòng job**. Không suy từ dữ liệu ảnh, không nhận từ tham số.

## 7. Usage và credit — P3

Quyết định D2: **nền tảng giữ khoá nhà cung cấp, tính credit theo tổ chức.** Tổ chức không mang khoá riêng ở bản này.

```prisma
model usage {
  id              String   @id @default(uuid())
  organization_id String
  workspace_id    String
  user_id         String
  job_id          String?
  feature         String
  quantity        Int      @default(1)
  cost_credit     Int      @default(0)
  cost_usd        Float?              // chi phí thật phía nhà cung cấp, để đối soát
  status          String              // ENQUEUED · COMPLETED · REFUNDED
  metadata        Json?
  created_at      DateTime @default(now())

  @@index([organization_id, created_at])
  @@index([job_id])
}
```

**Một bảng usage duy nhất cho toàn hệ thống.** Mọi module ở cả ba repo ghi vào bảng này, phân biệt bằng `feature`. Không repo nào dựng bảng usage hay credit riêng — tách ra thì không tính được hạn mức trải nghiệm và không xuất được hoá đơn hợp nhất.

**Ghi tại điểm tạo job phía core, không ghi ở worker.** Trình tự trong một giao dịch:

```
kiểm hạn mức → ghi usage (status = ENQUEUED, trừ credit) → tạo generation_jobs → NOTIFY
```

Hạn mức chặn **trước** khi bản ghi job tồn tại. Module vượt hạn mức không bao giờ tới được worker.

### Job bị Identity Guard từ chối

Quyết định D3: **không tính phí khách.** Ghi `usage` với `quantity = 1`, `cost_usd` thật, `cost_credit = 0`, và một bản ghi `status = REFUNDED` hoàn lại credit đã trừ lúc enqueue.

Lý do: GPU đã tiêu thụ nên chi phí phía nền tảng là thật và phải vào sổ để đối soát; nhưng khách không dùng được kết quả nên trừ credit của họ là bán một thứ không giao.

## 8. Nhật ký kiểm toán — P3

```prisma
model audit_logs {
  id              String   @id @default(uuid())
  organization_id String
  user_id         String
  action          String              // product.approve · media.approve · role.manage …
  entity_type     String
  entity_id       String
  before          Json?
  after           Json?
  ip              String?
  user_agent      String?
  created_at      DateTime @default(now())

  @@index([organization_id, created_at])
  @@index([entity_type, entity_id])
}
```

Mọi hành động duyệt bắt buộc sinh một bản ghi. Vì Điều hành là tập cha của Sale và Điều phối nên Điều hành duyệt được việc của chính mình; nhật ký này là thứ duy nhất còn lại để truy trách nhiệm.

## 9. Sản phẩm — P5

```prisma
model products {
  id              String         @id @default(uuid())
  organization_id String
  branch_id       String?
  code            String
  name            String
  category        String?                 // enum identity.category của hợp đồng Vision
  shape           String?
  facing          String?
  container       String?
  status          product_status @default(DRAFT)
  attributes      Json?
  created_at      DateTime       @default(now())
  updated_at      DateTime       @updatedAt

  @@unique([organization_id, code])
  @@index([organization_id])
}

model product_variants {
  id              String   @id @default(uuid())
  organization_id String
  product_id      String
  name            String
  size            String?
  multiplier      Float    @default(1)
  attributes      Json?

  @@index([organization_id, product_id])
}

model product_images {
  id              String   @id @default(uuid())
  organization_id String
  product_id      String
  asset_id        String
  role            String            // MAIN · GALLERY · CATALOG · SOCIAL
  position        Int      @default(0)

  @@unique([organization_id, product_id, asset_id, role])
  @@index([organization_id, product_id])
}

model product_analyses {
  id                String         @id @default(uuid())
  organization_id   String
  product_id        String?
  asset_id          String
  job_id            String

  provider          String
  model             String
  model_version     String
  contract_name     String                    // PhanTichSanPhamHoa
  contract_version  String

  raw               Json                      // dự đoán gốc của máy, bất biến
  edited            Json?                     // bản người sửa, lưu tách biệt
  approval_state    approval_state @default(PENDING)
  approved_by       String?
  approved_at       DateTime?

  created_at        DateTime       @default(now())

  @@unique([job_id, asset_id])
  @@index([organization_id])
  @@index([organization_id, product_id])
  @@index([job_id])
}

model pricing_rules {
  id              String   @id @default(uuid())
  organization_id String
  branch_id       String?
  key             String              // san · tran · muc_thu · lam_tron …
  value           Json
  effective_from  DateTime @default(now())
  created_by      String

  @@index([organization_id, key])
}
```

```prisma
model occasions {
  id              String            @id @default(uuid())
  organization_id String
  code            String
  name            String
  sort_order      Int               @default(0)
  is_active       Boolean           @default(true)
  /** Tông giọng khi dịp này được dùng để sinh kịch bản Zalo (nợ #104). */
  register        occasion_register @default(FESTIVE)
  created_at      DateTime          @default(now())
  updated_at      DateTime          @updatedAt


  @@unique([organization_id, code])
  @@index([organization_id])
}
```

**Danh mục dịp là dữ liệu cấu hình cấp tổ chức, không phải hằng số trong mã.** Bốn module đọc nó — M01b gán `dip_su_dung` cho sản phẩm, M05 dựng trang chiến dịch, M06 lọc catalog, M09 nhắc mua — nên nó thuộc core theo luật cắt.

Sáu dòng nạp sẵn khi tạo tổ chức, mang `is_seed = true`: 20/10 · Valentine · 8/3 · Ngày của Mẹ · khai trương · hoa cưới. Tổ chức thêm dịp riêng, đổi tên, đổi thứ tự và ngừng dùng một dịp; **không xoá cứng** một dịp đã gắn vào sản phẩm hay chiến dịch — `archived_at` là đường ngừng dùng, vì xoá cứng làm mọi bản ghi trỏ vào nó mất nhãn.

`month` và `day` để trống với dịp không cố định ngày (hoa cưới, khai trương). Dịp có ngày cố định dùng cùng cặp cột với `customer_occasions` ở mục 11, và cùng lý do: phần lớn dịp lặp hằng năm nên index đánh trên cặp tháng-ngày.

**`raw` và `edited` tách rời.** Dự đoán gốc của máy không bao giờ bị ghi đè bởi bản người sửa. Đây là điều kiện để về sau có dữ liệu huấn luyện: cặp *máy đoán gì / người sửa thành gì* là thứ có giá trị nhất mà hệ thống sinh ra hằng ngày.

`edited` chỉ giữ bản mới nhất, nên lịch sử từng lượt sửa nằm ở `audit_logs` (`product.analysis_edit`), không ở đây.

**`@@unique([job_id, asset_id])` — một ảnh có đúng một kết quả trong một lượt job.** Không có ràng buộc này thì một job lô hỏng giữa chừng rồi chạy lại (`POST /jobs/:id/retry`) sẽ ghi lần hai cho những ảnh đã phân tích xong ở lần trước: hàng chờ duyệt nhân đôi, và người duyệt không biết bản nào là bản nên duyệt. Worker dựa vào chính ràng buộc này để chạy lại an toàn — nó đọc danh sách ảnh đã xong, bỏ qua chúng, và ghi kèm `ON CONFLICT DO NOTHING` làm rào cuối.

**Đầu ra AI là kết quả từng phần, không phải giao dịch cả lô.** Kết nối của worker chạy `autocommit`, nên những ảnh phân tích xong trước ảnh gây lỗi đã được ghi và không lấy lại được. Chúng là kết quả thật và được giữ nguyên; job chuyển `FAILED`, và lần chạy lại tiếp tục từ đúng chỗ dừng thay vì gọi lại nhà cung cấp cho những ảnh đã xong.

`pricing_rules` theo tổ chức, có thể theo chi nhánh — đổi so với FloraOS v1 nơi quy tắc giá là cấu hình toàn cục.

## 10. Dữ liệu bán hàng của sản phẩm — M01b

```prisma
model product_copies {
  id              String   @id @default(uuid())
  organization_id String
  analysis_id     String // bắt buộc: product_analyses đã APPROVED
  product_id      String? // null khi phân tích chưa gắn sản phẩm (sẽ tạo mới khi duyệt)

  // Dự đoán gốc của máy (bất biến) — keys: suggested_name, suggested_description,
  // suggested_tags[], suggested_occasions[], suggested_price_segment
  raw             Json
  // Bản người sửa trước khi duyệt (PATCH /product-copies/:id, H5)
  edited          Json?
  approval_state  approval_state @default(PENDING)
  approved_by     String?
  approved_at     DateTime?

  // Phiên bản hồ sơ phong cách đã dùng (learning_profiles.version), để truy xuất
  profile_version String?

  // Lý do từ chối — CỘT RIÊNG, không nhét vào `edited`. `edited` là bản sửa
  // của người theo hình dạng câu chữ bán hàng; trộn một khoá quản trị vào đó
  // làm `resolveEffective` phải phân biệt hai loại khoá trong cùng một object.
  reject_reason   String?

  // Truy vết lượt gọi mô hình đã sinh ra bản này — PRD mục 9, nhóm "Truy vết".
  // Không có bốn cột này thì không đối soát được chi phí, không so sánh được
  // hai mô hình, và không biết bản nào sinh ra bởi mô hình nào khi đổi mô hình.
  job_id          String?
  model_key       String?
  provider        String?
  cost_usd        Float?
  latency_ms      Int?

  created_at      DateTime @default(now())


  @@unique([analysis_id]) // một lượt phân tích chỉ tạo một product_copy
  @@index([organization_id])
  @@index([organization_id, product_id])
  @@index([approval_state])
}
```

Cùng khuôn `raw`/`edited` của `product_analyses`, cùng lý do: cặp *máy viết gì / người sửa thành gì* là dữ liệu huấn luyện, và lịch sử từng lượt sửa nằm ở `audit_logs`.

`analysis_id` bắt buộc trỏ tới một lượt `APPROVED`. Ràng buộc này không đặt được bằng khoá ngoại, nên nó kiểm ở use-case và có ca thử khoá — sinh câu chữ từ một kết quả chưa ai soát là đưa cái sai của máy đi thẳng ra kênh bán.

`profile_version` là chỗ duy nhất trả lời được "vì sao hai bản mô tả của cùng một sản phẩm viết khác nhau" sau khi hồ sơ phong cách đổi.

## 11. Khách hàng — M09

```prisma
model customers {
  id                String         @id @default(uuid())
  organization_id   String
  code              String         // KH-0001, KH-0002
  name              String
  phone             String
  email             String?
  address           String?
  tier              customer_tier  @default(NEW)
  notes             String?
  tags              String[]       @default([])
  preferred_flowers String[]       @default([])
  preferred_colors  String[]       @default([])

  total_spent       Decimal        @default(0) @db.Decimal(14, 2)
  order_count       Int            @default(0)
  last_order_at     DateTime?

  created_at        DateTime       @default(now())
  updated_at        DateTime       @updatedAt

  orders            orders[]
  occasions         customer_occasions[]
  consents          customer_consents[]
  vouchers          vouchers[]
  conversations     chat_conversations[]

  @@unique([organization_id, phone])
  @@unique([organization_id, code])
  @@index([organization_id, tier])
  @@index([organization_id, name])
}

model customer_occasions {
  id                   String        @id @default(uuid())
  organization_id      String
  customer_id          String
  name                 String        // Sinh nhật vợ, Kỷ niệm ngày cưới, Ngày của Mẹ...
  date                 String        // MM-DD hoặc YYYY-MM-DD
  is_recurring         Boolean       @default(true)
  reminder_days_before Int           @default(7)
  recipient_name       String?
  notes                String?
  created_at           DateTime      @default(now())


  @@index([organization_id, customer_id])
  @@index([organization_id, date])
}

model customer_consents {
  id              String          @id @default(uuid())
  organization_id String
  customer_id     String
  channel         consent_channel
  granted         Boolean         @default(true)
  granted_at      DateTime        @default(now())
  revoked_at      DateTime?
  created_at      DateTime        @default(now())


  @@unique([customer_id, channel])
  @@index([organization_id, customer_id])
}

model vouchers {
  id               String                @id @default(uuid())
  organization_id  String
  customer_id      String?               // null nếu áp dụng công khai
  code             String                // FLORA10, VIP2026
  discount_type    voucher_discount_type @default(PERCENTAGE)
  discount_value   Decimal               @db.Decimal(14, 2)
  min_order_vnd    Decimal               @default(0) @db.Decimal(14, 2)
  max_discount_vnd Decimal?              @db.Decimal(14, 2)
  expires_at       DateTime?
  is_used          Boolean               @default(false)
  used_at          DateTime?
  order_id         String?
  created_at       DateTime              @default(now())


  @@unique([organization_id, code])
  @@index([organization_id, customer_id])
}
```

**Bản ghi đồng ý là chèn-chỉ.** Rút lại đồng ý là một dòng mới mang `state = WITHDRAWN`, không phải một lượt `UPDATE` — câu hỏi "lúc gửi tin đó khách đã đồng ý chưa" chỉ trả lời được nếu lịch sử còn nguyên.

`customer_occasions` tách `month`/`day` khỏi `year` vì phần lớn ngày đặc biệt lặp hằng năm và index cần đánh trên cặp tháng-ngày. Đây cũng là index mà màn danh sách khách hàng và chiến dịch nhắc mua đều đọc.

**Ba ràng buộc riêng của lớp dữ liệu này**, không áp cho bảng nào khác trong lược đồ: không trường định danh nào đi qua nhà cung cấp AI; xoá theo yêu cầu của chính khách hàng cuối là một luồng riêng, không mở được bằng mã năng lực nào của tổ chức; mỗi lượt xuất danh sách ghi `audit_logs`.

## 12. Đơn hàng và vận hành — M10

```prisma
model orders {
  id                String            @id @default(uuid())
  organization_id   String
  branch_id         String?
  code              String
  customer_id       String?
  status            order_status      @default(DRAFT)
  production_status production_status @default(WAITING)
  delivery_status   delivery_status   @default(PENDING)

  total_vnd         Decimal           @db.Decimal(14, 2)
  pricing_rule_ref  Json?                       // quy tắc giá đã dùng, để đối soát
  voucher_id        String?
  card_message      String?                     // lời nhắn thiệp, tách khỏi ghi chú nội bộ
  internal_note     String?
  delivery_window   Json?                       // ngày và khung giờ đã hẹn
  delivery_address  Json?

  created_by        String
  created_at        DateTime          @default(now())
  updated_at        DateTime          @updatedAt

  @@unique([organization_id, code])
  @@index([organization_id, status])
  @@index([organization_id, production_status])
}

model order_items {
  id              String   @id @default(uuid())
  organization_id String
  order_id        String
  product_id      String?
  variant_id      String?
  description     String?              // khi khách đặt mẫu ngoài danh mục
  quantity        Int      @default(1)
  unit_price_vnd  Decimal  @db.Decimal(14, 2)

  @@index([organization_id, order_id])
}

model order_assignments {
  id              String   @id @default(uuid())
  organization_id String
  order_id        String
  assignee_id     String                // thành viên nhận việc cắm
  assigned_by     String
  difficulty      String?               // định mức tiền công theo độ khó
  assigned_at     DateTime @default(now())
  released_at     DateTime?

  @@index([organization_id, assignee_id])
  @@index([organization_id, order_id])
}

model order_events {
  id              String   @id @default(uuid())
  organization_id String
  order_id        String
  axis            String                // order · production · delivery
  from_value      String?
  to_value        String
  actor_id        String?
  reason          String?
  created_at      DateTime @default(now())

  @@index([organization_id, order_id, created_at])
}
```

`order_events` là nguồn duy nhất đo SLA. Không cột `sla_dat` nào trên `orders`: một con số chốt sẵn sẽ đúng vào lúc ghi rồi sai mãi về sau, còn chuỗi sự kiện thì tính lại được bất cứ lúc nào và tính lại được theo định nghĩa SLA mới.

`pricing_rule_ref` giữ dấu vết quy tắc giá đã dùng. Đơn mang một giá không truy được về quy tắc nào là đơn không đối soát được, và đó là loại lệch không ai phát hiện cho tới kỳ quyết toán.

## 13. Kênh bán, số liệu và hồ sơ phong cách

```prisma
model catalog_links {
  id              String   @id @default(uuid())
  organization_id String
  slug            String   @unique
  name            String
  description     String?
  filters         Json?
  is_revoked      Boolean  @default(false)
  revoked_at      DateTime?
  revoked_by      String?
  created_by      String
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt


  @@index([organization_id])
  @@index([slug])
}

// ĐỔI TÊN: bảng này từng được đặc tả là `content_metrics`. Tên thật trong
// lược đồ là `content_metrics`, và hình dạng cột cũng khác. Sửa 18/09.
model content_metrics {
  id              String   @id @default(uuid())
  organization_id String
  platform        String
  content_id      String
  metric_date     DateTime @db.Date

  reach           Int?
  impressions     Int?
  engagement      Int?
  clicks          Int?
  conversions     Int?
  spend_usd       Float?

  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt


  @@unique([organization_id, platform, content_id, metric_date])
  @@index([organization_id])
  @@index([organization_id, metric_date])
}

// CHƯA XÂY (soát 18/09) — bảng này chưa có trong `prisma/schema.prisma`.
// M11 chưa bắt đầu; dải năng lực `S1`–`S4` chưa vào danh mục. Xem RS-7.
model learning_profiles {
  id              String   @id @default(uuid())
  organization_id String
  version         Int      @default(1)
  parameters      Json                          // tham số soạn nội dung đang hiệu lực
  evidence        Json                          // kết luận kèm số bản ghi đã dùng
  sample_size     Int      @default(0)
  is_sufficient   Boolean  @default(false)
  overridden_by   String?                       // người đè bằng S4, nếu có
  computed_at     DateTime @default(now())

  @@unique([organization_id, version])
  @@index([organization_id])
}
```

`catalog_links.slug` unique **toàn cục**, không theo tổ chức: một liên kết công khai phải giải được khi chưa biết tổ chức nào sở hữu nó.

`content_metrics` là **bộ nhớ đệm dựng lại được**, không phải nguồn sự thật. Cột `source` nói dữ liệu tới từ đâu, khoá tự nhiên bốn cột cho phép ghi lại nhiều lần mà không nhân đôi, và `is_legacy` giữ mốc dữ liệu kế thừa của thương hiệu trước khi tài khoản nền tảng được gán cho tổ chức — số liệu ấy có thật nhưng không phải của tổ chức này.

`learning_profiles` là chèn-chỉ theo `version`. Hồ sơ không giữ một con số kết luận mà giữ cả `evidence`: một hồ sơ không nói được căn cứ của mình thì không ai dám để nó đổi cách viết bài, và `is_sufficient = false` chặn nó khỏi được dùng trước ngưỡng dữ liệu tối thiểu.

## 14. Hội thoại — M08

```prisma
// ĐỔI TÊN 18/09: `conversations` → `chat_conversations`,
// `conversation_messages` → `chat_messages`. Thêm `chat_channel_integrations`.
model chat_conversations {
  id              String        @id @default(uuid())
  organization_id String
  customer_id     String?
  title           String        @default("Hội thoại tư vấn hoa")
  channel         chat_channel  @default(WEB_WIDGET)
  status          String        @default("ACTIVE") // ACTIVE, CLOSED
  created_at      DateTime      @default(now())
  updated_at      DateTime      @updatedAt

  messages        chat_messages[]

  @@index([organization_id, status])
  @@index([organization_id, customer_id])
}

model chat_messages {
  id              String            @id @default(uuid())
  organization_id String
  conversation_id String
  sender_type     chat_sender_type
  content         String
  metadata        Json?             // Gợi ý hoa từ Master Index, Draft Order ID

  created_at      DateTime          @default(now())


  @@index([organization_id, conversation_id, created_at])
}

model chat_channel_integrations {
  id                       String        @id @default(uuid())
  organization_id          String
  channel                  chat_channel
  is_enabled               Boolean       @default(false)
  config                   Json          @default("{}")
  subscription_expires_at  DateTime?
  created_at               DateTime      @default(now())
  updated_at               DateTime      @updatedAt


  @@unique([organization_id, channel])
  @@index([organization_id, is_enabled])
}
```

`is_automated` không bao giờ mặc định ngầm ở tầng giao diện: tin do trợ lý trả lời mang cờ trong chính bản ghi, nên mọi màn hình đọc cùng một sự thật. `price_source` là điều kiện để một câu báo giá cho khách đối soát được về quy tắc giá — trợ lý không tự tính giá.

## 15. Nền AI — sổ đăng ký, chính sách, sổ chi phí

```prisma
model ai_capabilities {
  code              String   @id                 // product_vision, content_generation …
  module            String                       // M01, M04b, M07 …
  kind              String                       // generative · measuring · deterministic
  needs_approval    Boolean  @default(true)
  privacy_floor     ai_privacy_level @default(SHOP)
  accept_threshold  Float?                       // null = chưa đo được, xem nợ kỹ thuật
  measure_channels  Json                         // các kênh chấm điểm của năng lực này
  enabled           Boolean  @default(true)
}

model ai_models {
  id                String   @id @default(uuid())
  key               String   @unique             // openai_structured, local_cv …
  display_name      String
  provider          String
  mode              ai_mode
  capabilities      Json                         // mã năng lực nó phục vụ

  license           String                       // bốn ô dưới đây bắt buộc có giá trị
  commercial_use    Boolean
  territory         String
  allowed_use       String

  cost_class        String
  latency_class     String
  quality_class     String
  measure_state     ai_measure_state @default(CHUA_DO)
  leaves_infra      Boolean                      // ảnh có rời hạ tầng không
  enabled           Boolean  @default(false)
  version           String
  registered_by     String
  created_at        DateTime @default(now())
}

model ai_policies {
  id                String   @id @default(uuid())
  organization_id   String
  capability_code   String
  allowed_models    Json                         // trần: bộ định tuyến chọn trong đây
  quality_target    String?
  cost_ceiling      Int?                         // credit mỗi lượt
  privacy_floor     ai_privacy_level
  updated_by        String
  updated_at        DateTime @updatedAt

  @@unique([organization_id, capability_code])
}

model ai_requests {
  id                String   @id @default(uuid())
  organization_id   String
  job_id            String?
  capability_code   String
  model_key         String
  attempt           Int      @default(1)         // lượt leo thác thứ mấy
  escalated_from    String?                      // mô hình của lượt trước
  fallback_from     String?                      // mô hình đã hỏng, nếu là dự phòng
  source            String                       // CORE · LOCALBUDD · SOCIALFLOW

  input_tokens      Int?
  output_tokens     Int?
  image_count       Int?
  duration_seconds  Float?
  gpu_seconds       Float?
  cost_usd          Float?                       // cùng kiểu với usage.cost_usd
  latency_ms        Int?
  quality_score     Float?
  outcome           String                       // ACCEPTED · ESCALATED · FAILED · NEEDS_REVIEW

  created_at        DateTime @default(now())

  @@index([organization_id, created_at])
  @@index([organization_id, capability_code, model_key])
  @@index([job_id])
}

model ai_evaluations {
  id                String   @id @default(uuid())
  organization_id   String
  capability_code   String
  entity_type       String                       // product_analysis · asset · post …
  entity_id         String
  scores            Json                         // một khoá cho mỗi kênh đã khai
  overall_score     Float
  threshold_used    Float?
  needs_review      Boolean  @default(false)
  reason            String?
  created_at        DateTime @default(now())

  @@index([organization_id, entity_type, entity_id])
}
```

**`ai_models` là bảng duy nhất trong lược đồ có bốn cột không cho phép giá trị rỗng vì lý do pháp lý, không vì lý do kỹ thuật**: `license`, `commercial_use`, `territory`, `allowed_use`. Một mô hình thiếu một trong bốn ô không bật được (`enabled`), và `registry` phía worker từ chối nó ngay cả khi ai đó bật bằng tay trong cơ sở dữ liệu.

`ai_policies` giữ **trần**, không giữ lựa chọn: `allowed_models` là phạm vi mà bộ định tuyến được chọn trong đó. Năng lực phân tích ảnh có thêm một đường ghi cũ hơn (`organizations.settings.bo_may_phan_tich`, gác bằng `H4`) và hai đường này ghi cùng một chỗ — `ai_policies` là bản chuẩn, còn khoá cũ đọc ra từ đó, chứ không phải hai nguồn sự thật song song.

`ai_requests` là bảng **chỉ ghi thêm**, và nó không giữ prompt lẫn đầu ra. Một lượt nghiệp vụ sinh nhiều hàng khi thác nghiệm leo hoặc dự phòng chạy; `attempt` cùng `escalated_from` là chỗ đọc ra điều đó. Bảng này không thay `usage`: hạn mức vẫn kiểm tại điểm tạo job, và một lượt nghiệp vụ vẫn trừ đúng số credit đã công bố dù bên dưới gọi mô hình ba lần.

## 16. Tri thức ngành hoa

```prisma
// ⚠ Tên cột bằng TIẾNG VIỆT — phá Luật 2 ở mục 1. Xem RS-5.
model flower_taxonomy {
  ma_loai      String  @id // LH001…
  nhom         String  // Hoa · Lá · Phụ kiện
  cong_nang    String? // Hoa chính · Hoa phụ · Hoa lấp đầy…
  ten_chuan    String
  ten_khac     Json    // string[] — tên gọi khác, dùng để so tên máy trả về
  nhom_hoa     String?
  dvt_chuan    String?
  so_bong_tren_dvt Int?
  duong_kinh_bong_cm Float?
  dien_tich_phu_cm2  Float?
  ty_le_nhuy_tren_bong Float?
  mau_nhuy     String?
  kieu_moc     String?
  dai_mau_tu_nhien Json?  // string[]
  dac_diem_phan_biet String?
  mua_vu       String?
  trang_thai   String  @default("Đang dùng")

  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt


  @@index([ten_chuan])
  @@index([nhom])
}

model flower_confusable_pairs {
  ma_cap          String @id // CN001…
  ma_loai_a       String
  ma_loai_b       String
  dau_hieu_tach_a String
  dau_hieu_tach_b String
  muc_do_nham     String // Cao · Trung bình · Thấp


  @@index([ma_loai_a])
  @@index([ma_loai_b])
  @@index([muc_do_nham])
}

// CHƯA XÂY (soát 18/09) — chưa có trong `prisma/schema.prisma`; pgvector chưa bật.
model knowledge_chunks {
  id                String   @id @default(uuid())
  organization_id   String
  source_kind       String                       // product · policy · delivery · pricing
  source_id         String                       //   · faq · brand · campaign · past_post
  content           String
  embedding         Unsupported("vector(1536)")?
  updated_at        DateTime @updatedAt

  @@index([organization_id, source_kind])
  @@index([organization_id, source_id])
}
```

`flower_taxonomy` và `flower_confusable_pairs` **không có `organization_id`** — hai trong chín ngoại lệ liệt ở mục 1, và lý do là: danh mục loài là tri thức ngành, không phải dữ liệu của một cửa hàng.

**Hai bảng này đặt tên cột bằng tiếng Việt** (`ma_loai`, `ten_chuan`, `so_bong_tren_dvt`, `muc_do_nham`…) — đã chạy thật trên dữ liệu thật. Bản đặc tả trước mô tả một bảng hoàn toàn khác bằng tiếng Anh (`canonical_id`/`name_vi`/`aliases`/`embedding`) — bảng đó chưa bao giờ tồn tại, đó là phần đã sửa. Phần đặt tên cột: **RS-5 (18/09, quyết định của anh Tony) chọn ghi ngoại lệ vào Luật 2** — xem mục 1 — thay vì đổi tên cột, vì hai bảng này là tra cứu tĩnh cấp nền tảng, không ai gọi qua tên cột từ bên ngoài lược đồ.

Cột `embedding Unsupported("vector(1536)")` và bảng `knowledge_chunks` ở dưới **chưa có trong lược đồ**. Mọi thứ một tổ chức tự khai — tên gọi riêng, mã nội bộ, giá theo loài — nằm ở `products.attributes` và ở `pricing_rules`, vốn đều mang `organization_id`. Bảng này chỉ đọc từ phía ứng dụng; ghi vào nó là việc cấp nền tảng.

`knowledge_chunks` thì **có** `organization_id`, và bộ test cách ly phủ nó như mọi bảng khác: chính sách giao hàng của một cửa hàng không được đi vào câu trả lời của cửa hàng khác.

`pgvector` là extension trên chính Postgres đang dùng. Không thêm một cơ sở dữ liệu vector riêng — một Postgres là quyết định nền ở tài liệu 01 mục 1, và khối lượng tri thức của một cửa hàng hoa không đòi hơn thế.

## 17. Đặc trưng nội dung cho vòng học

```prisma
// CHƯA XÂY (soát 18/09) — chưa có trong `prisma/schema.prisma`. M11 chưa bắt đầu.
model content_features {
  id                String   @id @default(uuid())
  organization_id   String
  post_ref          String                       // bản ghi nội dung ở engine ngoài
  product_id        String?
  campaign_ref      String?
  platform          String

  hook              String?
  angle             String?
  tone              String?
  length            Int?
  cta               String?
  visual_style      String?                      // nền, tỉ lệ, bố cục, cỡ sản phẩm
  posting_hour      Int?

  reach             Int      @default(0)
  engagement        Int      @default(0)
  clicks            Int      @default(0)
  inbox             Int      @default(0)
  orders            Int      @default(0)
  revenue_vnd       Decimal? @db.Decimal(14, 2)

  updated_at        DateTime @updatedAt

  @@unique([organization_id, post_ref])
  @@index([organization_id, platform, posting_hour])
}
```

Đây là bảng mà vòng học đọc, và nó là lý do vòng học nói được câu "ảnh nền sáng bán tốt hơn cho hoa tone đỏ" thay vì chỉ "bài này hiệu quả hơn bài kia". Không có các cột đặc trưng thì số liệu hiệu quả chỉ xếp hạng được bài, không giải thích được vì sao.

Học phải học cả phần hình, không chỉ phần chữ: `visual_style` là cột giữ điều đó, và nó nối ngược về `assets` của biến thể đã dùng.

## 18. Bảng chưa thuộc phạm vi bản này

`content_queue` · `posts` · `campaigns` · `social_accounts` · `post_metrics` thuộc `SocialFlow`. *(`video_jobs` từng nằm trong danh sách này; M04c đã chuyển về core ở P17, nên core **có** khai `video_jobs` và `video_scenes` — xem mục 20. Sửa 18/09.)* `pages` · `page_versions` · `layouts` · `design_directions` · `design_contracts` thuộc `LocalBudd`. Core không khai chúng.

Số liệu gốc của từng nền tảng ở lại `SocialFlow`; core chỉ giữ `content_metrics` ở mục 13 làm bộ nhớ đệm dựng lại được, và nó mang cột nguồn để không ai đọc nó như số liệu gốc.

Đối lại, `LocalBudd` bỏ `products`, `product_assets`, `media_assets`, `generation_jobs`, `projects` khỏi lược đồ của nó và đọc core qua API. Trạng thái thật của việc này ghi ở đặc tả 08 mục 2 — ba bảng còn chặn vì Integration API chưa có đường ghi, và ba đường ghi ở đặc tả 06 mục 11 là chỗ mở khoá nó.

## 20. Bảng có trong lược đồ mà bản đặc tả trước bỏ sót

> **Bổ sung 18/09.** Sáu bảng dưới đây đã chạy trong `prisma/schema.prisma` nhưng chưa từng có mục nào ở tài liệu này.

### M04c video — P17

```prisma
model video_jobs {
  id                 String          @id @default(uuid())
  organization_id    String
  product_id         String?
  title              String
  format             video_format
  stage              video_stage     @default(DRAFT)

  // Cổng duyệt 1: Kịch bản (Script / Storyboard)
  script_approval    approval_state  @default(PENDING)
  script_approved_at DateTime?
  script_approved_by String?

  // Cổng duyệt 2: Video kết quả (Final Render)
  video_approval     approval_state  @default(PENDING)
  video_approved_at  DateTime?
  video_approved_by  String?

  // Cấu hình video
  duration_seconds   Int             @default(15)
  aspect_ratio       String          @default("9:16")
  music_track        String?
  voice_code         String?
  has_subtitle       Boolean         @default(true)
  caption_style      String          @default("MODERN_BADGE")
  has_watermark      Boolean         @default(false)

  // Tài sản đầu ra & Hạch toán
  final_video_url    String?
  final_asset_id     String?
  cost_credits       Int             @default(0)
  error_message      String?

  created_at         DateTime        @default(now())
  updated_at         DateTime        @updatedAt

  scenes             video_scenes[]

  @@index([organization_id])
  @@index([organization_id, product_id])
  @@index([stage])
  @@index([script_approval])
  @@index([video_approval])
}

model video_scenes {
  id                String       @id @default(uuid())
  video_job_id      String
  scene_index       Int
  duration_seconds  Float        @default(3.0)
  image_asset_id    String?
  text_overlay      String?
  voice_script      String?
  transition_effect String?      @default("fade")
  created_at        DateTime     @default(now())


  @@index([video_job_id])
  @@unique([video_job_id, scene_index])
}
```

Hai cổng duyệt của `video_jobs` tách đúng ở tầng dữ liệu (`script_approval` và `video_approval` là hai cột riêng), nhưng hai endpoint duyệt lại gác bằng **cùng một mã `I2`** — xem **RS-1**. `video_scenes` là bảng con, thuộc tổ chức qua `video_jobs`.

### Tồn kho, template, token tích hợp

```prisma
model product_inventory {
  id                 String      @id @default(uuid())
  organization_id    String
  product_id         String
  branch_id          String
  status             stock_status @default(IN_STOCK)
  quantity_available Int?
  updated_at         DateTime    @updatedAt


  @@unique([organization_id, product_id, branch_id])
  @@index([organization_id, branch_id])
}

model template_overrides {
  id              String          @id @default(uuid())
  organization_id String
  template_family template_family
  template_key    String
  field_key       String
  value           String
  updated_by      String
  created_at      DateTime        @default(now())
  updated_at      DateTime        @updatedAt


  @@unique([organization_id, template_key, field_key])
  @@index([organization_id])
}

model integration_tokens {
  id              String             @id @default(uuid())
  organization_id String
  client          integration_client
  token_hash      String             @unique
  created_by      String
  created_at      DateTime           @default(now())
  expires_at      DateTime
  revoked_at      DateTime?
  rotated_from_id String?


  @@index([organization_id])
  @@index([organization_id, client])
}
```

`integration_tokens` giữ `token_hash @unique`, không giữ token thô — token chỉ hiện một lần lúc cấp. `rotated_from_id` nối một token với token nó thay thế, để thu hồi được cả chuỗi.

## 19. Kiểm chứng

Mỗi bảng có `organization_id` phải có một trường hợp trong bộ test cách ly: dựng hai tổ chức, đọc bản ghi của tổ chức A bằng ngữ cảnh phiên của tổ chức B, kết quả phải là không tìm thấy — không phải lỗi quyền, vì lỗi quyền đã tiết lộ rằng bản ghi tồn tại.

Chạy bằng `npm run test:tenant`. Bắt buộc xanh trước mọi merge.

Danh sách ngoại lệ của Luật 1 nằm ở **mục 1** — mười hai bảng, mỗi bảng một lý do. Bảng thứ mười ba tự nhận ngoại lệ là lỗi chặn ở review.

**Đối chiếu 18/09 — luật này đang bị phá.** 39 bảng có `organization_id`; **16 bảng chưa xuất hiện trong bất kỳ ca thử nào** của `tests/tenant/`: `catalog_links` · `chat_channel_integrations` · `chat_conversations` · `chat_messages` · `content_metrics` · `customer_consents` · `customer_occasions` · `order_assignments` · `order_events` · `order_items` · `pricing_rules` · `product_images` · `product_inventory` · `product_variants` · `template_overrides` · `vouchers`.

Nặng hơn: **6 bảng không nằm trong `TENANT_TABLES`** của `tests/helpers/database.ts` nên không bị `TRUNCATE` giữa các ca — `catalog_links` · `content_metrics` · `occasions` · `product_copies` · `product_inventory` · `template_overrides`. Với sáu bảng này, một ca xanh không chứng minh được điều nó khẳng định, đúng như chú thích trong chính tệp đó cảnh báo. Xem **RS-2**.
## 21. Console Vận hành Nền tảng — P25a

Ba bảng ngoại lệ của Luật 1 (mục 1) — không có `organization_id`, vì dữ liệu của người vận hành nền tảng không thuộc một tổ chức. Từ vựng năng lực `N1`–`N8` (đặc tả 02) TÁCH HẲN khỏi `capability_scope`/`role_capabilities` của tenant (D-N6, chốt 19/09) — không bảng nào dưới đây có cột tham chiếu `capability_scope`.

```prisma
model platform_operators {
  id         String    @id @default(uuid())
  user_id    String    @unique
  granted_by String?
  created_at DateTime  @default(now())
  revoked_at DateTime?

  capabilities platform_role_capabilities[]

  @@index([user_id])
}

model platform_role_capabilities {
  id              String @id @default(uuid())
  operator_id     String
  capability_code String // N1 … N8

  @@unique([operator_id, capability_code])
}

model platform_audit_logs {
  id          String   @id @default(uuid())
  user_id     String
  action      String // platform.health.read · platform.operator.grant …
  entity_type String
  entity_id   String
  before      Json?
  after       Json?
  ip          String?
  user_agent  String?
  created_at  DateTime @default(now())

  @@index([created_at])
  @@index([entity_type, entity_id])
}
```

`platform_operators.user_id` là `@unique` — một người chỉ một dòng vận hành; gán thêm năng lực đi qua `platform_role_capabilities`, không tạo dòng `platform_operators` mới. `platform_audit_logs` tách khỏi `audit_logs` (mục 8) vì `audit_logs.organization_id` là `NOT NULL` (D-N3) — hành động không thuộc tổ chức nào không ghi được vào đó. Gán/thu quyền vận hành hiện chạy tay qua `scripts/gan-van-hanh-nen-tang.ts`, không có route. Xem `../kien-truc/KE_HOACH_CONSOLE_VAN_HANH.md` mục 4.1 và đặc tả 06 mục 21.

## 22. Phân hệ Nghiên cứu Thị trường & Xu hướng (Market Intelligence Engine, Đợt A mở rộng)

Tám bảng nghiên cứu dữ liệu thị trường là **GLOBAL** (ngoại lệ Luật 1 nêu ở mục 1), một bảng `content_opportunities` thuộc **TENANT** (`organization_id` bắt buộc).

```prisma
model market_sources {
  id              String               @id @default(uuid())
  provider        String
  platform        String
  source_type     String
  status          market_source_status @default(ACTIVE)
  last_success_at DateTime?
  last_error_at   DateTime?
  created_at      DateTime             @default(now())
  updated_at      DateTime             @updatedAt

  trend_signals trend_signals[]
  topic_signals topic_signals[]

  @@unique([provider, platform])
}

model trend_signals {
  id           String   @id @default(uuid())
  source_id    String
  platform     String
  country_code String   @default("VN")
  region_code  String?
  city         String?
  industry     String   @default("florist")
  topic_raw    String
  metric_name  String
  metric_value Float
  growth_rate  Float?
  confidence   Float    @default(1.0)
  captured_at  DateTime @default(now())
  created_at   DateTime @default(now())

  source market_sources @relation(fields: [source_id], references: [id], onDelete: Cascade)

  @@unique([source_id, platform, country_code, topic_raw, captured_at])
  @@index([source_id])
  @@index([platform, country_code])
  @@index([captured_at])
  @@index([industry])
}

model trend_timeseries {
  id           String   @id @default(uuid())
  topic_id     String
  platform     String
  geo_scope    String   @default("VN")
  date         DateTime
  value        Float
  growth_rate  Float?
  velocity     Float?
  acceleration Float?
  confidence   Float    @default(1.0)

  topic topics @relation(fields: [topic_id], references: [id], onDelete: Cascade)

  @@unique([topic_id, platform, geo_scope, date])
  @@index([topic_id])
  @@index([date])
}

model topics {
  id             String             @id @default(uuid())
  canonical_name String
  description    String?
  language       String             @default("vi")
  industry       String             @default("florist")
  status         trend_topic_status @default(EMERGING)
  first_seen_at  DateTime           @default(now())
  last_seen_at   DateTime           @default(now())

  timeseries            trend_timeseries[]
  signals               topic_signals[]
  scores                topic_scores[]
  content_opportunities content_opportunities[]

  @@unique([canonical_name, industry])
  @@index([status])
  @@index([industry])
  @@index([last_seen_at])
}

model topic_signals {
  id                 String   @id @default(uuid())
  topic_id           String
  source_id          String
  external_reference String?
  signal_type        String
  signal_value       Float
  captured_at        DateTime @default(now())

  topic  topics         @relation(fields: [topic_id], references: [id], onDelete: Cascade)
  source market_sources @relation(fields: [source_id], references: [id], onDelete: Cascade)

  @@index([topic_id])
  @@index([source_id])
}

model topic_scores {
  id                        String   @id @default(uuid())
  topic_id                  String
  geo_scope                 String   @default("VN")
  industry                  String   @default("florist")
  period                    String   @default("7d")
  trend_score               Float
  viral_score               Float
  commercial_score          Float
  content_opportunity_score Float
  confidence                Float    @default(1.0)
  calculated_at             DateTime @default(now())
  model_version             String   @default("v1_florist")

  topic topics @relation(fields: [topic_id], references: [id], onDelete: Cascade)

  @@index([topic_id])
  @@index([period])
  @@index([content_opportunity_score])
}

model content_opportunities {
  id                        String   @id @default(uuid())
  organization_id           String
  topic_id                  String
  audience                  String?
  opportunity_summary       String
  content_angles            Json
  recommended_formats       Json
  recommended_hooks         Json
  trend_score               Float
  viral_score               Float
  commercial_score          Float
  content_opportunity_score Float
  confidence                Float    @default(1.0)
  expires_at                DateTime?
  created_at                DateTime @default(now())
  updated_at                DateTime @updatedAt

  organization organizations @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  topic        topics        @relation(fields: [topic_id], references: [id], onDelete: Cascade)

  @@index([organization_id, content_opportunity_score])
  @@index([organization_id])
  @@index([topic_id])
}

model research_runs {
  id                    String              @id @default(uuid())
  run_type              research_run_type   @default(DAILY_DEEP)
  status                research_run_status @default(PENDING)
  started_at            DateTime?
  completed_at          DateTime?
  sources_attempted     Int                 @default(0)
  sources_succeeded     Int                 @default(0)
  sources_failed        Int                 @default(0)
  records_collected     Int                 @default(0)
  topics_created        Int                 @default(0)
  opportunities_created Int                 @default(0)
  error_summary         String?
  created_at            DateTime            @default(now())

  @@index([status, created_at])
}

model provider_health {
  id              String                 @id @default(uuid())
  provider        String                 @unique
  status          provider_health_status @default(HEALTHY)
  latency_ms      Int?
  error_rate      Float?
  quota_status    String?
  last_checked_at DateTime               @default(now())

  @@index([status])
}
```
