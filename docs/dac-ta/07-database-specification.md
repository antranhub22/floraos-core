# 07 — Đặc tả cơ sở dữ liệu

Postgres, truy cập qua Prisma. `prisma/schema.prisma` là nguồn sự thật; tài liệu này giải thích vì sao lược đồ có hình dạng đó. Khi hai bên lệch nhau, lược đồ đúng và tài liệu này phải sửa.

Worker Python đọc lược đồ sinh sẵn, không tự khai bảng.

## 1. Bốn luật bất di bất dịch

| # | Luật | Kiểm ở đâu |
|---|---|---|
| 1 | Mọi bảng thuộc tenant có `organization_id NOT NULL`, có index. Không ngoại lệ, kể cả bảng tra cứu và workspace trải nghiệm | Bộ test cách ly trong CI |
| 2 | Đặt tên `snake_case` tiếng Anh. Thuật ngữ tiếng Việt chỉ ở nhãn giao diện | Review |
| 3 | Asset gốc bất biến. Dẫn xuất là bản ghi mới, nối bằng `parent_asset_id` và `version` | Review |
| 4 | Job tách ba trục `status` / `stage` / `result`. Không gộp thành một cột | Review |

`users` là bảng duy nhất không có `organization_id` — một người thuộc nhiều tổ chức qua `memberships`.

## 2. Kiểu liệt kê

```prisma
enum organization_type { EXPERIENCE  SINGLE  CHAIN }
enum workspace_kind    { EXPERIENCE  PRODUCTION }
enum membership_status { INVITED  ACTIVE  SUSPENDED }
enum capability_scope  { ORGANIZATION  BRANCH }
enum job_status        { PENDING  PROCESSING  COMPLETED  FAILED  CANCELLED }
enum approval_state    { PENDING  APPROVED  REJECTED }
enum product_status    { DRAFT  ACTIVE  ARCHIVED }
enum asset_kind        { ORIGINAL  ANALYZED  ENHANCED  MASTER  MARKETING  CATALOG  LANDING  SOCIAL }
enum asset_state       { PROCESSING  READY  FAILED  ARCHIVED }
enum trial_status      { ACTIVE  EXHAUSTED  EXPIRED }
```

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
  settings       Json?             // bảng công tắc cấp tổ chức, gồm cho_phep_tu_duyet
  created_at     DateTime          @default(now())
  updated_at     DateTime          @updatedAt
}

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

  payload         Json
  output          Json?
  error           String?
  attempts        Int        @default(0)

  created_at      DateTime   @default(now())
  started_at      DateTime?
  completed_at    DateTime?
  cancelled_at    DateTime?

  @@index([organization_id])
  @@index([status, created_at])         // worker quét bằng index này
  @@index([organization_id, user_id])
}
```

### Bộ giá trị của `stage` và `result` theo module

| Module | `stage` | `result` |
|---|---|---|
| M01 phân tích ảnh | `DETECTING` · `SEGMENTING` · `RECOGNIZING` · `MAPPING_TAXONOMY` | `OK` · `LOW_CONFIDENCE` |
| M04a tối ưu ảnh | `ANALYZING` · `DETECTING` · `ISOLATING` · `ENHANCING` · `BACKGROUND` · `COMPOSING` · `VERIFYING` · `GENERATING_OUTPUTS` | `SAFE` · `GOOD` · `WARNING` · `REJECTED` |
| M05 landing page | `INIT` · `GENERATING` · `FINALIZING` | `OK` |
| M06 catalog | `INIT` · `GENERATING` · `FINALIZING` | `OK` |

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

**`raw` và `edited` tách rời.** Dự đoán gốc của máy không bao giờ bị ghi đè bởi bản người sửa. Đây là điều kiện để về sau có dữ liệu huấn luyện: cặp *máy đoán gì / người sửa thành gì* là thứ có giá trị nhất mà hệ thống sinh ra hằng ngày.

`pricing_rules` theo tổ chức, có thể theo chi nhánh — đổi so với FloraOS v1 nơi quy tắc giá là cấu hình toàn cục.

## 10. Bảng chưa thuộc phạm vi bản này

`content_queue` · `posts` · `campaigns` · `social_accounts` thuộc `SocialFlow`. `pages` · `page_versions` · `layouts` · `design_directions` · `design_contracts` thuộc `LocalBudd`. Core không khai chúng.

Đối lại, `LocalBudd` bỏ `products`, `product_assets`, `media_assets`, `generation_jobs`, `projects` khỏi lược đồ của nó và đọc core qua API. Việc này có tên trong lộ trình ở P7.

## 11. Kiểm chứng

Mỗi bảng có `organization_id` phải có một trường hợp trong bộ test cách ly: dựng hai tổ chức, đọc bản ghi của tổ chức A bằng ngữ cảnh phiên của tổ chức B, kết quả phải là không tìm thấy — không phải lỗi quyền, vì lỗi quyền đã tiết lộ rằng bản ghi tồn tại.

Chạy bằng `npm run test:tenant`. Bắt buộc xanh trước mọi merge.
