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
enum asset_kind        { ORIGINAL  ANALYZED  ENHANCED  MASTER  MARKETING  VIDEO  CATALOG  LANDING  SOCIAL }
enum asset_state       { PROCESSING  READY  FAILED  ARCHIVED }
enum trial_status      { ACTIVE  EXHAUSTED  EXPIRED }
enum order_status      { DRAFT  CONFIRMED  COMPLETED  CANCELLED }
enum production_status { WAITING  ASSIGNED  IN_PROGRESS  DONE }
enum delivery_status   { PENDING  DISPATCHED  DELIVERED  FAILED  RETURNED }
enum consent_state     { GRANTED  WITHDRAWN }
enum catalog_link_state { ACTIVE  REVOKED }
enum ai_mode           { API  SELF_HOST  DETERMINISTIC }
enum ai_privacy_level  { PUBLIC  SHOP  SENSITIVE }
enum ai_measure_state  { CHUA_DO  THU_NGHIEM  SAN_XUAT }
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
  id              String   @id @default(uuid())
  organization_id String
  code            String              // 20_10 · valentine · 8_3 · mothers_day · khai_truong · hoa_cuoi
  name            String
  month           Int?                // dịp cố định ngày: 10 cho 20/10
  day             Int?
  is_recurring    Boolean  @default(true)
  is_seed         Boolean  @default(false)   // dòng nạp sẵn, phân biệt với dịp tổ chức tự thêm
  position        Int      @default(0)
  archived_at     DateTime?

  @@unique([organization_id, code])
  @@index([organization_id, month, day])
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
  id              String         @id @default(uuid())
  organization_id String
  product_id      String
  analysis_id     String                    // lượt phân tích đã APPROVED sinh ra bản này

  provider        String
  model           String
  model_version   String
  profile_version String?                   // hồ sơ phong cách đã dùng, nếu có

  raw             Json                      // bản máy sinh, bất biến
  edited          Json?                     // bản người sửa, lưu tách biệt
  approval_state  approval_state @default(PENDING)
  approved_by     String?
  approved_at     DateTime?

  created_at      DateTime       @default(now())

  @@unique([organization_id, product_id, analysis_id])
  @@index([organization_id, approval_state])
}
```

Cùng khuôn `raw`/`edited` của `product_analyses`, cùng lý do: cặp *máy viết gì / người sửa thành gì* là dữ liệu huấn luyện, và lịch sử từng lượt sửa nằm ở `audit_logs`.

`analysis_id` bắt buộc trỏ tới một lượt `APPROVED`. Ràng buộc này không đặt được bằng khoá ngoại, nên nó kiểm ở use-case và có ca thử khoá — sinh câu chữ từ một kết quả chưa ai soát là đưa cái sai của máy đi thẳng ra kênh bán.

`profile_version` là chỗ duy nhất trả lời được "vì sao hai bản mô tả của cùng một sản phẩm viết khác nhau" sau khi hồ sơ phong cách đổi.

## 11. Khách hàng — M09

```prisma
model customers {
  id              String   @id @default(uuid())
  organization_id String
  branch_id       String?
  full_name       String
  phone           String?
  email           String?
  address         Json?
  note            String?
  archived_at     DateTime?
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  @@unique([organization_id, phone])
  @@index([organization_id])
}

model customer_occasions {
  id              String   @id @default(uuid())
  organization_id String
  customer_id     String
  kind            String              // sinh nhật · kỷ niệm · lễ cưới · khác
  label           String?
  month           Int
  day             Int
  year            Int?                // null khi chỉ biết ngày tháng
  created_at      DateTime @default(now())

  @@index([organization_id, month, day])
  @@index([organization_id, customer_id])
}

model customer_consents {
  id              String        @id @default(uuid())
  organization_id String
  customer_id     String
  purpose         String                    // nhac_mua · khuyen_mai
  channel         String                    // zalo · sms · email · goi_dien
  state           consent_state
  source          String                    // nơi và cách khách đồng ý
  granted_at      DateTime?
  withdrawn_at    DateTime?
  created_at      DateTime      @default(now())

  @@index([organization_id, customer_id, purpose])
}

model vouchers {
  id              String   @id @default(uuid())
  organization_id String
  code            String
  kind            String              // phan_tram · so_tien
  value           Decimal  @db.Decimal(14, 2)
  customer_id     String?             // null khi voucher dùng chung
  valid_from      DateTime
  valid_to        DateTime
  used_at         DateTime?
  created_by      String

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
  id              String             @id @default(uuid())
  organization_id String
  slug            String
  label           String
  filter          Json                          // dịp · màu · loại hoa · bộ sưu tập · khoảng giá
  state           catalog_link_state @default(ACTIVE)
  open_count      Int                @default(0)
  created_by      String
  created_at      DateTime           @default(now())
  revoked_at      DateTime?

  @@unique([slug])
  @@index([organization_id, state])
}

model campaign_rollups {
  id                String   @id @default(uuid())
  organization_id   String
  source            String                      // SOCIALFLOW · LOCALBUDD
  platform          String
  external_post_id  String
  product_id        String?
  campaign_ref      String?
  metric_date       DateTime                    // ngày của số liệu, không phải ngày ghi
  reach             Int      @default(0)
  engagement        Int      @default(0)
  inbox             Int      @default(0)
  clicks            Int      @default(0)
  cost_usd          Decimal? @db.Decimal(12, 4)
  is_legacy         Boolean  @default(false)    // dữ liệu trước khi tài khoản được gán tổ chức
  ingested_at       DateTime @default(now())

  @@unique([organization_id, platform, external_post_id, metric_date])
  @@index([organization_id, metric_date])
}

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

`campaign_rollups` là **bộ nhớ đệm dựng lại được**, không phải nguồn sự thật. Cột `source` nói dữ liệu tới từ đâu, khoá tự nhiên bốn cột cho phép ghi lại nhiều lần mà không nhân đôi, và `is_legacy` giữ mốc dữ liệu kế thừa của thương hiệu trước khi tài khoản nền tảng được gán cho tổ chức — số liệu ấy có thật nhưng không phải của tổ chức này.

`learning_profiles` là chèn-chỉ theo `version`. Hồ sơ không giữ một con số kết luận mà giữ cả `evidence`: một hồ sơ không nói được căn cứ của mình thì không ai dám để nó đổi cách viết bài, và `is_sufficient = false` chặn nó khỏi được dùng trước ngưỡng dữ liệu tối thiểu.

## 14. Hội thoại — M08

```prisma
model conversations {
  id               String   @id @default(uuid())
  organization_id  String
  channel          String              // zalo · facebook · instagram · web
  external_thread  String
  customer_id      String?
  assignee_id      String?             // null khi trợ lý đang phụ trách
  last_message_at  DateTime?
  created_at       DateTime @default(now())

  @@unique([organization_id, channel, external_thread])
  @@index([organization_id, last_message_at])
}

model conversation_messages {
  id              String   @id @default(uuid())
  organization_id String
  conversation_id String
  direction       String              // in · out
  is_automated    Boolean  @default(false)
  body            String
  price_source    Json?               // quy tắc giá đã dùng, khi câu trả lời có giá
  author_id       String?
  created_at      DateTime @default(now())

  @@index([organization_id, conversation_id, created_at])
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
model flower_taxonomy {
  canonical_id      String   @id                 // ma loài, bất biến
  name_vi           String
  name_en           String?
  aliases           Json                         // gồm nhãn mô hình thường trả về
  colors            Json
  season            Json?
  price_segment     String?
  visual_features   Json?
  confusable_with   Json?                        // cặp dễ nhầm kèm dấu hiệu phân biệt
  embedding         Unsupported("vector(1536)")?
  updated_at        DateTime @updatedAt
}

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

`flower_taxonomy` **không có `organization_id`** — đây là ngoại lệ duy nhất của Luật 1, và nó có lý do: danh mục loài là tri thức ngành, không phải dữ liệu của một cửa hàng. Mọi thứ một tổ chức tự khai — tên gọi riêng, mã nội bộ, giá theo loài — nằm ở `products.attributes` và ở `pricing_rules`, vốn đều mang `organization_id`. Bảng này chỉ đọc từ phía ứng dụng; ghi vào nó là việc cấp nền tảng.

`knowledge_chunks` thì **có** `organization_id`, và bộ test cách ly phủ nó như mọi bảng khác: chính sách giao hàng của một cửa hàng không được đi vào câu trả lời của cửa hàng khác.

`pgvector` là extension trên chính Postgres đang dùng. Không thêm một cơ sở dữ liệu vector riêng — một Postgres là quyết định nền ở tài liệu 01 mục 1, và khối lượng tri thức của một cửa hàng hoa không đòi hơn thế.

## 17. Đặc trưng nội dung cho vòng học

```prisma
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

`content_queue` · `posts` · `campaigns` · `social_accounts` · `video_jobs` · `post_metrics` thuộc `SocialFlow`. `pages` · `page_versions` · `layouts` · `design_directions` · `design_contracts` thuộc `LocalBudd`. Core không khai chúng.

Số liệu gốc của từng nền tảng ở lại `SocialFlow`; core chỉ giữ `campaign_rollups` ở mục 13 làm bộ nhớ đệm dựng lại được, và nó mang cột nguồn để không ai đọc nó như số liệu gốc.

Đối lại, `LocalBudd` bỏ `products`, `product_assets`, `media_assets`, `generation_jobs`, `projects` khỏi lược đồ của nó và đọc core qua API. Trạng thái thật của việc này ghi ở đặc tả 08 mục 2 — bốn bảng còn chặn vì Integration API chưa có đường ghi, và ba đường ghi ở đặc tả 06 mục 11 là chỗ mở khoá nó.

## 19. Kiểm chứng

Mỗi bảng có `organization_id` phải có một trường hợp trong bộ test cách ly: dựng hai tổ chức, đọc bản ghi của tổ chức A bằng ngữ cảnh phiên của tổ chức B, kết quả phải là không tìm thấy — không phải lỗi quyền, vì lỗi quyền đã tiết lộ rằng bản ghi tồn tại.

Chạy bằng `npm run test:tenant`. Bắt buộc xanh trước mọi merge.

Hai bảng cố ý không có `organization_id`, và cả hai đều phải nêu được lý do khi review: `flower_taxonomy` là tri thức ngành, không phải dữ liệu của một cửa hàng (mục 16); `platform_audit_logs` ghi hành động không thuộc tổ chức nào. Bảng thứ ba tự nhận ngoại lệ là lỗi chặn ở review.
