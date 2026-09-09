# PRD — `floraos-core`

**Sản phẩm:** FloraOS SaaS — nền tảng đa tenant cho cửa hàng và chuỗi cửa hàng hoa
**Phạm vi tài liệu:** repo `floraos-core` (Core) và ranh giới của nó với `LocalBudd`, `SocialFlow`
**Cấp tài liệu:** rút gọn từ `FLORAOS_SAAS_TARGET_ARCHITECTURE_V2.md` (Level 1) · `HARVEST_MANIFEST.md` · `M01` · `M04` · `TRANG_THAI.md`
**Ngày:** 2026-09-09

> Khi PRD này và `FLORAOS_SAAS_TARGET_ARCHITECTURE_V2.md` lệch nhau, tài liệu kiến trúc thắng. PRD trả lời *xây cái gì và vì sao*; kiến trúc trả lời *xây thế nào*.

---

## 1. Bài toán

Cửa hàng hoa bán bằng hình ảnh, nhưng ảnh chụp bằng điện thoại không đồng đều, dữ liệu sản phẩm nằm rải rác, và mỗi kênh bán (landing page, catalog, mạng xã hội) lại nhập lại từ đầu. Hệ v1 (`FloraOS`) giải được phần nghiệp vụ nhưng là công cụ desktop khoác giao diện web: Excel là cấu trúc dữ liệu, một khoá ghi toàn cục thuộc về thư mục, trạng thái job giữ trong RAM. Ràng buộc đó không mang sang SaaS được.

`floraos-core` là nền đa tenant để một tổ chức nhập dữ liệu sản phẩm **một lần** và mọi module dùng lại.

## 2. Người dùng

| Nhóm | Việc chính | Ràng buộc quyền |
|---|---|---|
| Điều hành / Admin | Duyệt kết quả AI, quản lý sản phẩm, giá, chi nhánh | Toàn tổ chức |
| Sale | Chạy phân tích ảnh, tối ưu ảnh, tra cứu giá | Theo chi nhánh |
| Điều phối | Điều phối đơn theo chi nhánh | Theo chi nhánh |
| Experience User | Dùng thử với dữ liệu mẫu, hạn mức giới hạn | Workspace demo |

Ba hình thái tổ chức: **Experience** (demo tạm) · **Single Shop / Brand** · **Chain** (một tổ chức nhiều chi nhánh, quản lý tập trung).

## 3. Bảy luật sản phẩm

Áp cho mọi module, mọi repo. Vi phạm là lỗi chặn ở review.

| # | Luật |
|---|---|
| 1 | Mọi bản ghi thuộc tenant mang `organization_id`. Không ngoại lệ, kể cả bảng tra cứu và demo workspace |
| 2 | `organization_id` giải từ phiên đăng nhập phía máy chủ, không bao giờ nhận từ client |
| 3 | Đầu ra AI không tự động thành dữ liệu nghiệp vụ chính thức — phải qua Review → Approve |
| 4 | Quyền theo mã năng lực, không theo vai giao diện. Năng lực duyệt tách khỏi năng lực sinh kết quả |
| 5 | Thao tác AI dài chạy bằng job, không chặn HTTP. Trạng thái job ở Postgres, không ở RAM |
| 6 | Asset gốc bất biến. Dẫn xuất là phiên bản mới hoặc asset mới |
| 7 | Tăng cường sản phẩm, không tái sinh sản phẩm. Nhận dạng sản phẩm là bất biến |

## 4. Phạm vi

**Trong phạm vi core**
Organization · Workspace · Membership · Branch · cách ly tenant · RBAC · BusinessProfile · BrandProfile · Product Master · Asset · GenerationJob · Usage · AuditLog · Integration API · M01 · M02 · M03 · M04a.

**Ngoài phạm vi core, có chủ sở hữu khác**
M05 Landing Page và M06 Catalog thuộc `LocalBudd`. M04b Marketing Creative và M07 Content & Social Publishing thuộc `SocialFlow`. M08 Customer Chat chưa có repo.

**Không làm ở giai đoạn này**
Thanh toán và xuất hoá đơn (kiến trúc đỡ sẵn, chưa triển khai) · Video (M04a Giai đoạn 2) · Marketing Creative Engine · migrate dần từ v1 — cắt sang hệ mới một lần.

## 5. Bản đồ module

| Mã | Module | Repo | Nguồn |
|---|---|---|---|
| M01 | Product Image Analysis | `floraos-core` | Hợp đồng AI Vision 40KB + engine đếm, engine màu; bỏ toàn bộ lớp Excel |
| M02 | Product Cost & Pricing | `floraos-core` | Công thức giá + bất biến làm tròn hai phía; quy tắc giá chuyển sang phạm vi tổ chức |
| M03 | Product Search / KB | `floraos-core` | Xây trên Postgres, logic lọc lấy từ bộ test có sẵn |
| M04a | Product Image Optimization | `floraos-core` | Xây mới theo spec; Identity Guard là cổng cứng |
| M04b | Marketing Creative | `SocialFlow` | Đã có phần lớn; nối vào Asset của core |
| M05 | Landing Page Generator | `LocalBudd` | Giữ nguyên; bỏ bảng trùng, đọc core qua API |
| M06 | Catalog Generator | `LocalBudd` | Như trên |
| M07 | Content & Social Publishing | `SocialFlow` | Adapter 6 nền tảng, nhận ngữ cảnh tổ chức |
| M08 | Customer Chat | Chưa có | Xây sau |

Tám module, chín đơn vị triển khai — M04 tách đôi tại Master Image. Mỗi module chạy được độc lập, nhưng dùng dữ liệu chung khi có sẵn.

## 6. Luồng chính

**Trải nghiệm lần đầu**
```
Vào Experience → nạp workspace demo → tải ảnh → phân tích AI
→ xem kết quả → sửa → duyệt → gợi ý chức năng kế → người dùng chọn
```
Người dùng chỉ cung cấp phần động: ảnh, tên sản phẩm, vài thông tin đơn giản. Không bắt khai báo hồ sơ doanh nghiệp đầy đủ trước khi dùng thử. Không tự động chạy hết mọi chức năng tính phí — mỗi chức năng chọn riêng.

**Phân tích ảnh sản phẩm (M01)**
```
Ảnh → job → phân tích → kết quả (chờ duyệt) → người sửa → duyệt (product.approve)
→ ghi Product Master
```

**Tối ưu ảnh sản phẩm (M04a) — hai cổng khác nhau**
```
Ảnh → phân tích chất lượng → tách sản phẩm → tăng cường → bố cục
→ [Cổng 1] Product Identity Guard   ← máy chấm: SAFE / GOOD / WARNING / REJECTED
→ Master Image + các tỷ lệ (Smart Reframe, không chạy lại AI)
→ Before/After, tải về
→ [Cổng 2] Review & Approve         ← người chấm, cần media.approve
→ Master Image thành Asset chính thức của sản phẩm
```
Guard PASS không thay thế Approve. Tải ảnh về không phải là phê duyệt. Ảnh `REJECTED` không được đưa vào luồng duyệt; ảnh `WARNING` duyệt được nhưng giao diện phải cảnh báo trước.

## 7. Yêu cầu chức năng

### 7.1 Nền tảng đa tenant
- Tạo tổ chức, workspace, mời thành viên, gán vai; một tổ chức chứa nhiều chi nhánh.
- Bộ test cách ly tenant chạy trong CI: mỗi endpoint bị thử với ngữ cảnh tổ chức khác và phải trả về không tìm thấy.
- Đường dẫn lưu trữ theo tổ chức: `org/<organization_id>/<product_id>/<asset_id>.<ext>`.
- Không có khoá ghi toàn cục. Đồng thời hoá bằng giao dịch cơ sở dữ liệu.

### 7.2 Phân quyền
- 76 mã năng lực, 18 mã có trần cứng. Ba lớp cắt: mặc định theo vai → bảng công tắc → trần cứng cắt sau cùng.
- Quyền là bộ ba `(vai, mã, phạm vi)` với phạm vi ∈ {organization, branch}.
- Vai là bản ghi, không phải enum. Vai tối thiểu: Experience User · Admin/Điều hành · Sale · Điều phối.
- Cặp năng lực tách bắt buộc: `vision.analyze` ↔ `product.approve`; `media.optimize` ↔ `media.approve`.

### 7.3 Job
Ba trục tách rời, không gộp thành một enum:

| Trục | Phạm vi | Giá trị |
|---|---|---|
| `status` | Toàn hệ thống | PENDING → PROCESSING → COMPLETED / FAILED / CANCELLED |
| `stage` | Theo module | M04a: ANALYZING · DETECTING · ISOLATING · ENHANCING · BACKGROUND · COMPOSING · VERIFYING · GENERATING_OUTPUTS |
| `result` | Phán quyết nghiệp vụ | M04a: SAFE · GOOD · WARNING · REJECTED |

`COMPLETED + result=REJECTED` không phải `FAILED`. `FAILED` chỉ dành cho hỏng kỹ thuật: timeout, crash, lỗi nhà cung cấp. Gộp hai thứ này làm retry chạy lại vô ích và kế toán sử dụng sai lệch.
`CANCELLED` bắt buộc: người dùng huỷ được job còn `PENDING`. Nhật ký tiến trình theo dòng qua SSE, đọc lại được từ vị trí bất kỳ.

### 7.4 Asset
Một bảng `assets` cho mọi loại: ảnh gốc · ảnh đã phân tích · ảnh đã tăng cường · Master Image · ảnh marketing · ảnh catalog · ảnh landing page · ảnh và video social.
Metadata bắt buộc mỗi bản ghi: `organization_id` · `parent_asset_id` · `version` · `provider` · `model` · `model_version` · `pipeline_version` · `parameters` · `prompt` · `sha256` vào/ra · `quality_score` · `identity_score` · `generated_flags` · `cost_usd`.
`generated_flags` không bao giờ mặc định ngầm: ảnh phải dùng generative fill vì chất lượng quá kém được đánh dấu rõ ở cả metadata và giao diện.

### 7.5 Usage
Một bảng `usage` duy nhất cho toàn hệ thống, phân biệt bằng `feature`. Không repo nào dựng bảng usage hay credit riêng.
Hạn mức kiểm tại **điểm tạo job phía core**, trước khi bản ghi vào `generation_jobs`. Module vượt hạn mức không bao giờ tới được worker. Worker không ghi usage.
Hạn mức Experience cấu hình được: `trial_count` · `trial_limit` · `trial_reset_at` · `trial_status`.

### 7.6 Integration API
Core phơi ra qua `/api/v1/`: BusinessProfile · BrandProfile · Product Master · Asset (gồm Master Image) · GenerationJob · Usage · kiểm quyền. Xác thực máy-máy theo tổ chức; engine ngoài không bao giờ tự khai `organization_id` và không giữ bản sao entity lõi.

## 8. Sở hữu dữ liệu

> Core sở hữu entity mà nhiều hơn một module đọc. Engine sở hữu entity chỉ module của nó đọc.

| `floraos-core` | `LocalBudd` | `SocialFlow` |
|---|---|---|
| `organizations` · `workspaces` · `memberships` · `roles` · `branches` | `pages` · `page_versions` · `layouts` | `content_queue` · `posts` |
| `business_profiles` · `brand_profiles` | `design_directions` · `design_contracts` | `campaigns` · `signals` · `content_plans` |
| `products` · `product_variants` · `product_analyses` · `pricing_rules` | `publish_records` | `post_metrics` · `weekly_metrics` · `content_insights` |
| `assets` · `generation_jobs` · `usage` · `audit_logs` | | `social_accounts` |

Hệ quả có tên trong lộ trình (P7): `LocalBudd` bỏ `products`, `product_assets`, `media_assets`, `generation_jobs`, `projects` khỏi lược đồ của nó và đọc core qua API.

## 9. Yêu cầu phi chức năng

| Nhóm | Yêu cầu |
|---|---|
| Đồng thời | 100–500 người dùng đồng thời |
| Thời gian xử lý | 10–30 giây mỗi job ảnh, tuỳ loại xử lý; người dùng tiếp tục dùng webapp trong lúc chờ |
| Chi phí | ~$0.01–0.20 mỗi ảnh; ~$0.05–5 mỗi video (giai đoạn video) |
| Thứ tự ưu tiên khi đánh đổi | Accuracy > Quality > Cost > Speed > Simplicity |
| Nhà cung cấp AI | Chỉ gọi qua cổng (`VisionAnalyzer`, `LLMProvider`, `StorageProvider`, `QueueProvider`). Không module nào gọi thẳng API nhà cung cấp |
| Soát cách ly tenant ở tầng nhà cung cấp | Bắt buộc trong ma trận chọn công nghệ: rò dữ liệu qua cache còn nóng, phiên bền, lịch sử prompt, hay mặc định dùng dữ liệu để huấn luyện |
| Quyền riêng tư | Dữ liệu dùng để huấn luyện có cơ chế consent cấp tổ chức, sẵn sàng trước go-live. Xoá dữ liệu khi người dùng yêu cầu |
| Truy vết | Metadata đầy đủ mỗi job phục vụ gỡ lỗi, tái lập, đối soát chi phí, so sánh mô hình |

## 10. Lộ trình

| Pha | Nội dung | Phụ thuộc | Ước lượng |
|---|---|---|---|
| P0 | Dựng `floraos-core` theo khuôn kiến trúc | — | 1 tuần |
| P1 | Organization · Workspace · Membership · Branch · cách ly tenant | P0 | 2–3 tuần |
| P2 | RBAC — 76 mã, phạm vi org/branch, vai thành bản ghi, tách `*.approve` | P1 | 1–2 tuần |
| P3 | Asset + GenerationJob + Usage trong một đợt | P1 | 2–3 tuần |
| P4 | BusinessProfile + BrandProfile | P1 | 1 tuần |
| P5 | M01 — hợp đồng AI, engine đếm, engine màu | P3 | 2–3 tuần |
| P6 | M02 + M03 — giá kèm bất biến; tìm kiếm trên Postgres | P5 | 2 tuần |
| P7 | Integration Layer; LocalBudd bỏ bảng trùng; adapter SocialFlow | P3, P4 | 2–3 tuần |
| P8 | Nhập dữ liệu AVI GIFT một chiều từ Excel | P4, P5, P6 | 1 tuần |
| P9 | M04a — Identity Guard, chạy song song với P7/P8 | P3, P5 | 3–4 tuần |
| P10 | Experience Mode | P2, P3 | 2 tuần |
| P11 | Cắt sang hệ mới; `FloraOS` v1 ngừng | P8, P10 | 1 tuần |
| P12 | Hardening — bảo mật, observability, hiệu năng, hồi quy | tất cả | 2 tuần |

Tổng thô 5–6 tháng với một đội nhỏ, P9 chạy song song.

**Điều kiện chặn thứ tự:** không tạo bảng, route, job hay đường dẫn lưu trữ thật của bất kỳ module nào trước khi P1 và P2 đạt nghiệm thu. Làm ngược sẽ sinh ra lược đồ không có `organization_id` và phải migration lại khi đã có dữ liệu thật.

**Việc chạy song song, không chặn ai:** bộ ảnh vàng 50–100 ảnh sản phẩm thật có nhãn số lượng đúng. Đây là điều kiện nghiệm thu P5 và là thứ duy nhất cho phép so sánh hai provider Vision.

## 11. Tiêu chí nghiệm thu

**SaaS** — nhiều tổ chức dùng đồng thời · dữ liệu cách ly, có bộ test CI chứng minh · quyền đúng theo phạm vi · một tổ chức chứa nhiều chi nhánh.

**Experience** — bắt đầu với thông tin tối thiểu · dữ liệu demo có sẵn · đi hết chức năng lõi qua các bước dẫn dắt · hạn mức có giới hạn và đặt lại được.

**Dữ liệu** — BusinessProfile nhập một lần · Product Master dùng lại xuyên module · kết quả AI cập nhật được dữ liệu đã duyệt · không repo nào giữ bản sao entity lõi.

**Module** — cả chín đơn vị chạy độc lập · M04a chặn được một thay đổi sản phẩm mô phỏng, ảnh gốc được giữ · M04b soạn trên Master Image đã duyệt mà không đổi nhận dạng sản phẩm.

**AI/Job** — thao tác dài dùng job · trạng thái quan sát được trên ba trục · job lỗi retry an toàn · `COMPLETED/REJECTED` không bị coi là lỗi · kết quả được lưu.

**Chuyển đổi** — AVI GIFT vận hành được trên core theo đúng bảng nghiệm thu của `BAN_GIAO.md` · dữ liệu Excel nhập đủ · `FloraOS` v1 ngừng mà không mất việc nào.

## 12. Sổ quyết định

**Đã chốt**

| # | Nội dung | Ngày |
|---|---|---|
| Đường A | Dựng repo core mới, thu hoạch từ ba repo, giữ tách ba repo. `FloraOS` v1 nghỉ hưu, không migrate dần | 09/09 |
| D5-c | Cổng Vision ở mức hợp đồng JSON: `VisionAnalyzer.analyze → ProductAnalysis`. Adapter GPT-4o trước, Florence-2 + SAM2 sau, chỉ đổi khi thắng trên bộ ảnh vàng | 09/09 |
| D6-1 | Postgres làm hàng đợi. Worker Python lấy việc bằng `SELECT … FOR UPDATE SKIP LOCKED` + `LISTEN/NOTIFY`. Cấm `subprocess` + parse stdout, cấm chạy job qua HTTP | 09/09 |

**Còn mở**

| # | Nội dung | Chặn |
|---|---|---|
| D4 | Ngày đóng băng tính năng của `FloraOS` v1 | P0 — cái duy nhất chặn khởi động |
| D1 | `SocialFlow` lên đa tenant, hay ở lại làm worker đơn tenant | P7 |
| D2 | Mã API AI: mỗi tổ chức tự mang khoá, hay khoá nền tảng + credit | P3 |
| D3 | Job `COMPLETED / result = REJECTED` có tính phí không | P3 |

## 13. Rủi ro

| Rủi ro | Mức | Cách chặn |
|---|---|---|
| AI thay đổi nhận dạng sản phẩm — số lượng, màu, hình dạng | Critical | Product Identity Guard là cổng cứng bắt buộc, không phải tuỳ chọn |
| Generative fill dùng mà không đánh dấu | High | `flags.generative_fill_used` bắt buộc trong hợp đồng JSON |
| Sinh lược đồ thiếu `organization_id` do làm sai thứ tự pha | High | Chặn cứng: không tạo bảng/route thật trước khi P1 và P2 nghiệm thu |
| Dữ liệu dùng để huấn luyện khi chưa có consent | High | Cơ chế policy/consent cấp tổ chức, sẵn sàng trước go-live |
| Rò dữ liệu giữa tổ chức qua worker và GPU dùng chung | High | Cột soát cách ly tenant bắt buộc trong ma trận chọn công nghệ |
| Thu hoạch mã cũ làm mất luật nghiệp vụ không ai viết ra | High | Mọi luật thu hoạch đi kèm test khoá nó; test xanh trên core mới thì mới coi là chuyển xong |
| Chạy song song hai hệ kéo dài | Medium | Đồng bộ một chiều Excel → core, cắt một lần, không ghi ngược |
| Tăng cường chạy lại cho từng tỷ lệ, tốn GPU | Medium | Master Image + Smart Reframe: enhancement chạy một lần |
| Nhà cung cấp AI ngừng hỗ trợ | Medium | Mọi provider nằm sau cổng; đổi provider là thay adapter |

## 14. Luật thu hoạch

Thang ưu tiên: **REUSE > EXTEND > ADAPTER > BUILD**. Mọi hạng mục xếp hạng trước khi viết dòng mã đầu tiên. Xếp hạng BUILD cho thứ đã tồn tại ở một trong ba repo là lỗi chặn ở review; xếp hạng REUSE cho thứ thật ra là EXTEND là lỗi tốn kém nhất.

Chín câu hỏi phải trả lời trước mỗi hạng mục: hạng thu hoạch · nguồn ở repo và tệp nào · test nào khoá luật và đã chép chưa · entity thuộc core hay engine · đã có `organization_id` chưa · thao tác có phải job không · có ghi usage không · kết quả có cần duyệt không · năng lực nào gác, năng lực duyệt có tách riêng không.

---

## Phụ lục — cột dự kiến cho bản Excel

| Cột | Nguồn trong PRD |
|---|---|
| Mã hạng mục | Mục 5, 7 |
| Tên hạng mục | Mục 5, 7 |
| Module / Pha | Mục 5, 10 |
| Repo sở hữu | Mục 5, 8 |
| Hạng thu hoạch | Mục 14 |
| Phụ thuộc | Mục 10 |
| Ước lượng | Mục 10 |
| Tiêu chí nghiệm thu | Mục 11 |
| Năng lực gác | Mục 7.2 |
| Trạng thái | — |

Giá trị đưa lên Master Index: ngưỡng đồng thời 100–500 · SLA 10–30 giây · dải chi phí ảnh và video · kích thước bộ ảnh vàng 50–100 · 76 mã năng lực, 18 trần cứng · tổng thời lượng lộ trình 5–6 tháng.
