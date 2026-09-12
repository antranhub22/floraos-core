# 06 — Đặc tả API

Mọi route dưới `/api/v1/`. Có phiên bản ngay từ đầu.

Năng lực gác từng endpoint ghi bằng mã ở tài liệu 02. Bảng dữ liệu và tên cột ở tài liệu 07.

## 1. Bốn luật áp cho mọi endpoint

| # | Luật |
|---|---|
| 1 | `organization_id` giải từ phiên đăng nhập phía máy chủ. Không endpoint nào nhận nó từ body, query hay header do client gửi |
| 2 | Mọi truy vấn đọc lọc theo tổ chức hiện tại. Không endpoint nào trả dữ liệu xuyên tổ chức |
| 3 | Kiểm quyền bằng mã năng lực, không bằng vai giao diện. Không có `if (role === 'ADMIN')` ở bất kỳ đâu |
| 4 | Thao tác AI trả `job_id` ngay, không chặn HTTP. Trạng thái đọc qua `/jobs/:id` hoặc luồng sự kiện |

Endpoint duyệt luôn tách khỏi endpoint sinh kết quả: `POST /x/:id/approve`.

## 2. Quy ước chung

**Xác thực.** Cookie phiên `HttpOnly`, `Secure`, `SameSite=Lax`. Máy gọi máy dùng `Authorization: Bearer <token>` cấp theo tổ chức, xem mục 9.

**Đổi tổ chức đang hoạt động.** `POST /api/v1/session/organization` với `{ organization_id }`. Máy chủ kiểm người dùng có `memberships` ở tổ chức đó rồi mới đổi `sessions.organization_id`. Đây là **chỗ duy nhất** client được nêu tên một tổ chức.

**Phân trang.** `?limit=` mặc định 25, tối đa 100; `?cursor=` là con trỏ mờ. Kết quả `{ data: [...], next_cursor: string|null }`.

**Lỗi.** Một hình dạng duy nhất:

```json
{ "error": { "code": "QUOTA_EXCEEDED", "message": "Đã hết lượt dùng thử", "details": { } } }
```

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Thân yêu cầu sai lược đồ zod |
| 401 | `UNAUTHENTICATED` | Không có phiên hợp lệ |
| 403 | `CAPABILITY_DENIED` | Thiếu mã năng lực. Thân lỗi nêu mã còn thiếu |
| 404 | `NOT_FOUND` | Không tìm thấy, **hoặc thuộc tổ chức khác** |
| 409 | `CONFLICT` | Xung đột trạng thái, ví dụ duyệt một bản ghi đã duyệt |
| 422 | `QUOTA_EXCEEDED` | Vượt hạn mức, job không được tạo |
| 429 | `RATE_LIMITED` | Kèm `Retry-After` |
| 500 | `INTERNAL` | Không lộ chi tiết |

**Bản ghi của tổ chức khác trả 404, không trả 403.** Trả 403 là xác nhận bản ghi đó tồn tại — rò rỉ thông tin xuyên tổ chức bằng chính mã lỗi.

**Chống trùng.** Mọi `POST` tạo job nhận `Idempotency-Key`. Cùng khoá trong 24 giờ trả lại job cũ thay vì tạo job mới. Người dùng bấm hai lần không bị trừ credit hai lần.

## 3. Phiên và tổ chức

| Method | Path | Năng lực | Ghi chú |
|---|---|---|---|
| POST | `/auth/signup` | — | Tạo người dùng và tổ chức trải nghiệm |
| POST | `/auth/login` | — | |
| POST | `/auth/logout` | — | |
| GET | `/auth/me` | — | Người dùng, tổ chức hiện tại, danh sách năng lực đã tính |
| GET | `/organizations` | — | Các tổ chức người dùng là thành viên |
| POST | `/session/organization` | — | Đổi tổ chức đang hoạt động |
| GET | `/organizations/current` | `F1` | |
| PATCH | `/organizations/current` | `F2` | |

`GET /auth/me` trả **danh sách mã năng lực đã tính sẵn** cho phiên hiện tại. Giao diện đọc danh sách này để ẩn hiện nút; máy chủ vẫn kiểm lại ở mọi endpoint. Giao diện ẩn nút không phải là phép kiểm quyền.

```json
{
  "user": { "id": "…", "name": "…", "email": "…" },
  "organization": { "id": "…", "name": "…", "type": "CHAIN" },
  "workspace": { "id": "…", "kind": "PRODUCTION" },
  "membership": { "role_key": "dieu_hanh", "branch_id": null },
  "capabilities": ["A1", "A2", "B1", "…", "I2"],
  "credit_balance": 480
}
```

## 4. Thành viên, vai, chi nhánh

| Method | Path | Năng lực |
|---|---|---|
| GET | `/members` | `F1` |
| POST | `/members/invite` | `F3` |
| DELETE | `/members/:id` | `F4` |
| PATCH | `/members/:id/role` | `F5` |
| GET | `/roles` | `F1` |
| POST | `/roles` | `F5` |
| PATCH | `/roles/:id/capabilities` | `F5` |
| GET | `/branches` | `F6` |
| POST | `/branches` | `F7` |
| PATCH | `/branches/:id` | `F7` |
| GET | `/workspaces` | `F1` |
| POST | `/workspaces` | `F8` |

`PATCH /roles/:id/capabilities` ghi vào `capability_overrides`. Yêu cầu bật một mã bị trần cứng chặn trả 403 `CAPABILITY_DENIED` và **không** ghi gì — trần cứng cắt sau bảng công tắc.

## 5. Hồ sơ

| Method | Path | Năng lực |
|---|---|---|
| GET · PUT | `/business-profile` | `F1` · `F2` |
| GET · PUT | `/brand-profile` | `F1` · `F2` |

## 6. Sản phẩm, giá, asset

| Method | Path | Năng lực | Ghi chú |
|---|---|---|---|
| GET | `/products` | `L1` | Lọc theo `branch_id`, `status`, `category` |
| POST | `/products` | `L2` | |
| GET · PATCH | `/products/:id` | `L1` · `L3` | |
| GET | `/products/:id/images` | `G1` | |
| PUT | `/products/:id/images` | `G2` | Đặt lại thứ tự và vai trò ảnh |
| GET · PUT | `/pricing-rules` | `L5` · `L6` | Theo tổ chức, có thể theo chi nhánh |
| POST | `/assets/upload-url` | `G2` | Trả URL ký sẵn; client tải thẳng lên kho |
| POST | `/assets` | `G2` | Ghi nhận asset sau khi tải xong |
| GET | `/assets/:id` | `G1` | |
| DELETE | `/assets/:id` | `G3` | |

`POST /assets/upload-url` **tự sinh `storage_key`** theo `org/<organization_id>/<product_id>/<asset_id>.<ext>`. Client không đề xuất đường dẫn; nhận đường dẫn từ client là mở đường ghi đè chéo tổ chức.

## 7. Job

Một họ endpoint dùng chung cho mọi module. Màn hình theo dõi job đọc đúng bộ này.

| Method | Path | Năng lực | Ghi chú |
|---|---|---|---|
| GET | `/jobs` | `G4` · `G5` | `G4` chỉ thấy job của mình; có `G5` thì thấy toàn tổ chức |
| GET | `/jobs/:id` | `G4` | |
| GET | `/jobs/:id/events` | `G4` | Luồng sự kiện, xem dưới |
| POST | `/jobs/:id/cancel` | `G6` | Chỉ job còn `PENDING` |
| POST | `/jobs/:id/retry` | `G7` | Chỉ job `FAILED`. Job `COMPLETED/REJECTED` trả 409 |

`POST /jobs/:id/retry` trên một job `COMPLETED` với `result = REJECTED` trả **409**, không phải 200. Chạy lại cho ra đúng phán quyết cũ và chỉ tốn GPU.

### Luồng sự kiện

`GET /jobs/:id/events` là SSE. Hai loại sự kiện, tách rời:

```
event: stage
data: {"stage":"ENHANCING","at":"2026-09-10T04:12:33Z"}

event: log
data: {"seq":118,"text":"Đã tách nền, còn 3 vùng nhiễu","at":"…"}

event: done
data: {"status":"COMPLETED","result":"WARNING"}
```

`stage` dẫn checklist tiến trình trên giao diện; `log` là nhật ký chi tiết mở ra khi cần điều tra. Nhật ký **cộng dồn và đọc lại được từ vị trí bất kỳ**: client gửi `Last-Event-ID` để nối tiếp sau khi mất kết nối. Đây là phần FloraOS v1 làm tốt và người dùng đã quen; giữ nguyên trải nghiệm, bỏ phần parse stdout.

## 8. Vision và tối ưu ảnh

### M01 — phân tích ảnh

| Method | Path | Năng lực |
|---|---|---|
| POST | `/vision/analyses` | `H1` |
| GET | `/vision/analyses` | `H3` |
| GET | `/vision/analyses/:id` | `H1` |
| PATCH | `/vision/analyses/:id` | `H2` |
| POST | `/vision/analyses/:id/approve` | `H3` |
| POST | `/vision/analyses/:id/reject` | `H3` |
| GET | `/vision/analyses/export` | `H3` |
| GET | `/vision/engine` | `H1` |
| PUT | `/vision/engine` | `H4` |

```http
POST /api/v1/vision/analyses
Idempotency-Key: 5b1e…

{ "asset_ids": ["…"], "product_id": null }
```
```json
{
  "job_id": "…", "status": "PENDING", "engine": "openai_structured",
  "usage": { "cost_credit": 1, "balance_after": 479 }
}
```

`engine` là bộ máy đã CHỐT cho lượt chạy này, đọc từ cấu hình tổ chức lúc tạo job và ghi vào `payload`. Đổi bộ máy sau đó không đổi job đã tạo.

`GET /vision/analyses` liệt kê hàng chờ duyệt (`approval_state = PENDING`), phân trang con trỏ. Gác bằng `H3` chứ không `H1` vì đây là màn của người duyệt, không phải người vừa gửi phân tích.

`PATCH` ghi vào `product_analyses.edited`; `raw` không bao giờ bị đụng tới. Cặp *máy đoán gì / người sửa thành gì* là dữ liệu huấn luyện về sau. Bản sửa **thay nguyên bản gốc**, nên nó phải giữ đủ mọi khoá cấp một mà máy đã trả — thiếu khoá trả 400 kèm danh sách khoá thiếu, vì một bản sửa thiếu `identity` sẽ âm thầm xoá trắng bốn trường nhận dạng của sản phẩm lúc duyệt. Mỗi lượt sửa sinh một bản ghi `audit_logs` action `product.analysis_edit`.

Kết quả đi tới một trong hai phán quyết, cả hai cần `H3`:

`POST …/approve` chuyển `approval_state` sang `APPROVED`, ghi `approved_by` và `approved_at`, cập nhật Product Master trong cùng một giao dịch, và sinh một bản ghi `audit_logs`. Duyệt một bản ghi đã `APPROVED` trả 409.

`POST …/reject` chuyển sang `REJECTED` và **không chạm Product Master** — từ chối là nói "kết quả này không dùng", không phải rút lại thứ gì đã ghi. Thân yêu cầu tuỳ chọn `{ "ly_do": "…" }`, vào phần `after` của `audit_logs` action `product.reject`; đó là chỗ duy nhất còn giữ được câu trả lời cho "vì sao bản này bị bỏ". Chỉ bản còn `PENDING` từ chối được — bản `APPROVED` đã vào Product Master và việc rút lại thuộc luồng thu hồi duyệt, bản `REJECTED` từ chối lại không đổi gì; cả hai trả 409.

`GET /vision/analyses/export` trả CSV mã hoá UTF-8 kèm BOM, `content-disposition: attachment`. Một dòng cho MỘT CẤU PHẦN chứ không phải một dòng cho một ảnh — đó là mức người vận hành đối chiếu thật. Cột `nguon` phân biệt số của máy với số của người. Tham số: `states` (nhiều giá trị hoặc ngăn bằng dấu phẩy), `from`, `to`. Trần 5.000 lượt phân tích mỗi lần xuất; chạm trần thì thu hẹp khoảng thời gian, và `x-cham-tran` trong phần đầu đáp ứng nói rõ đã chạm.

**Bộ máy phân tích.** `GET /vision/engine` trả bộ đang dùng và danh sách đủ ba bộ kèm trạng thái đo lường và việc ảnh có rời hạ tầng hay không — gác bằng `H1` vì người chạy phân tích cần biết bộ nào đang chạy để hiểu kết quả mình nhận, kể cả khi họ không đổi được.

```http
PUT /api/v1/vision/engine
{ "bo_may": "openai_direct" }
```
```json
{
  "dang_dung": "openai_direct",
  "danh_sach": [
    { "key": "openai_structured", "ten": "Đầy đủ", "trang_thai": "san_xuat", "gui_anh_ra_ngoai": true, "mo_ta": "…" },
    { "key": "openai_direct", "ten": "Gọn", "trang_thai": "thu_nghiem", "gui_anh_ra_ngoai": true, "mo_ta": "…" },
    { "key": "local_cv", "ten": "Cục bộ", "trang_thai": "chua_san_sang", "gui_anh_ra_ngoai": false, "mo_ta": "…" }
  ]
}
```

`PUT` cần `H4` (trần cứng Điều hành). Ghi vào `organizations.settings.bo_may_phan_tich` bằng hợp nhất nông — đổi bộ máy không được xoá công tắc khác của tổ chức. Mỗi lần đổi thật sự sinh `audit_logs` action `vision.engine.change`. Tên bộ máy ngoài danh sách trả 400.

### M04a — tối ưu ảnh

| Method | Path | Năng lực |
|---|---|---|
| POST | `/media/optimizations` | `I1` |
| GET | `/media/optimizations/:id` | `I1` |
| POST | `/media/optimizations/:id/approve` | `I2` |
| GET | `/media/optimizations/:id/download` | `I3` |

```json
{
  "job_id": "…",
  "status": "COMPLETED",
  "result": "WARNING",
  "identity_guard": {
    "identity_score": 0.94, "color_score": 0.97,
    "geometry_score": 0.93, "component_consistency": 0.95
  },
  "outputs": { "master": "…", "ratios": { "1x1": "…", "4x5": "…", "9x16": "…", "16x9": "…" } },
  "approval": { "state": "pending", "approved_by": null, "approved_at": null },
  "flags": { "generative_fill_used": false, "requires_reshoot_warning": false }
}
```

`POST …/approve` trên job có `result = REJECTED` trả **409**. Ảnh bị cổng an toàn từ chối không được vào luồng duyệt. Job có `result = WARNING` duyệt được, nhưng giao diện phải hiện cảnh báo trước khi bấm.

Tải ảnh về (`/download`) **không** phải là phê duyệt. Hai việc khác nhau, hai năng lực khác nhau.

## 9. Hàng đợi duyệt

| Method | Path | Năng lực | Ghi chú |
|---|---|---|---|
| GET | `/approvals` | `H3` · `H6` · `I2` · `P2` · `P4` · `O3` | Mọi thứ đang chờ duyệt, gộp từ nhiều module |
| POST | `/approvals/batch` | như trên | Duyệt hàng loạt, tối đa 50 mục |

Sáu loại đi qua hàng đợi này, mỗi loại một năng lực: kết quả phân tích (`H3`), dữ liệu bán hàng của sản phẩm (`H6`), Master Image (`I2`), biến thể marketing (`P2`), video (`P4`), nội dung đăng bài (`O3`). Hai loại cuối phát sinh ở engine ngoài và đi vào hàng đợi này qua đường đăng ký asset và số liệu ở mục 11 — cổng duyệt nằm ở core, không nằm ở engine.

`POST /approvals/batch` từ chối mọi mục là video và mọi mục có `result = WARNING`; hai loại đó chỉ duyệt được từng cái sau khi mở ra xem.

Trả về chỉ những mục người gọi có năng lực duyệt. Nếu công tắc `cho_phep_tu_duyet` của tổ chức đang tắt, bản ghi do chính người gọi tạo không xuất hiện trong danh sách này.

## 10. Mức dùng và kiểm toán

| Method | Path | Năng lực |
|---|---|---|
| GET | `/usage` | `G8` |
| GET | `/usage/summary` | `G8` |
| GET | `/audit-logs` | `G9` |

`/usage/summary` trả số lượt theo `feature`, credit đã dùng, credit còn lại, chia theo chi nhánh nếu tổ chức là Chuỗi.

## 11. Integration API — máy gọi máy

Dành cho `LocalBudd` (M05, M06) và `SocialFlow` (M04b, M07).

```
Authorization: Bearer <token cấp theo tổ chức>
```

| Method | Path | Trả về |
|---|---|---|
| GET | `/integration/products` | Product Master của tổ chức |
| GET | `/integration/products/:id/master-image` | Master Image đã duyệt, kèm các tỉ lệ |
| GET | `/integration/business-profile` | |
| GET | `/integration/brand-profile` | |
| POST | `/integration/jobs` | Tạo job thay mặt tổ chức |
| POST | `/integration/usage` | Ghi mức dùng phát sinh ở engine ngoài |
| POST | `/integration/capabilities/check` | Hỏi một người có năng lực gì |
| GET | `/integration/learning-profile` | Hồ sơ phong cách của tổ chức, để engine soạn nội dung đọc |
| POST | `/integration/assets/upload-url` | URL ký sẵn để engine ngoài tải byte lên; core sinh `storage_key` |
| POST | `/integration/assets` | Đăng ký một asset dẫn xuất đã hoàn tất |
| POST | `/integration/content-metrics` | Ghi số liệu hiệu quả của một nội dung đã đăng |
| GET | `/integration/ai-policy` | Chính sách AI của tổ chức: năng lực được phép, mô hình đủ điều kiện, ngưỡng, sàn quyền riêng tư |
| POST | `/integration/ai-requests` | Ghi số đo mỗi lời gọi mô hình: mô hình, chi phí, độ trễ, điểm chất lượng |

**Ba đường ghi, không nhiều hơn.** `POST /integration/assets` nhận creative và video đã hoàn tất, bắt buộc `parent_asset_id` trỏ tới một asset `APPROVED` của cùng tổ chức — thiếu hoặc trỏ sai trả 422, vì một dẫn xuất không truy được về Master Image đã duyệt là một dẫn xuất không ai biết nó vẽ đúng sản phẩm nào. Asset đăng ký vào với `approval_state = PENDING` và đi vào hàng chờ duyệt ở mục 9; engine ngoài không đặt được trạng thái duyệt.

`POST /integration/content-metrics` ghi vào `campaign_rollups`, mang cột nguồn và khoá tự nhiên theo `(organization_id, platform, external_post_id, ngày)` nên chạy lại không nhân đôi. Số liệu gốc vẫn thuộc engine; đây là bản dựng lại được để core nối với `orders`.

`POST /integration/usage` ghi mức dùng phát sinh ngoài core với `cost_credit = 0` — credit đã trừ ở `POST /integration/jobs`, và trừ lần hai là thu tiền hai lần.

### 11.1 Thân yêu cầu của bốn đường ghi

```http
POST /api/v1/integration/assets
{
  "parent_asset_id": "…",            // bắt buộc, phải là asset APPROVED cùng tổ chức
  "product_id": "…",
  "kind": "MARKETING",               // MARKETING · VIDEO · CATALOG · LANDING · SOCIAL
  "storage_key": null,               // core tự sinh; giá trị client gửi bị bỏ qua
  "upload_token": "…",               // lấy từ POST /integration/assets/upload-url
  "mime_type": "image/png",
  "aspect_ratio": "4x5",
  "sha256": "…",
  "provider": "…", "model": "…", "model_version": "…",
  "pipeline_version": "…",
  "parameters": { … }, "prompt": "…",
  "generated_flags": { "generative_fill_used": false },   // không mặc định ngầm
  "cost_usd": 0.042
}
```
```json
{ "asset_id": "…", "version": 2, "approval_state": "PENDING" }
```

`generated_flags` thiếu thì trả **422**, không trả 200 với giá trị mặc định — `YC-A5` áp cho cả đường này. `parent_asset_id` trỏ tới asset chưa duyệt hoặc thuộc tổ chức khác trả **404**, không trả 403.

```http
POST /api/v1/integration/content-metrics
{
  "rows": [
    { "platform": "facebook", "external_post_id": "…", "metric_date": "2026-09-11",
      "product_id": "…", "campaign_ref": "…",
      "reach": 1820, "engagement": 96, "inbox": 7, "clicks": 34,
      "cost_usd": 0, "is_legacy": false }
  ]
}
```
```json
{ "accepted": 1, "updated": 0, "rejected": [] }
```

Khoá tự nhiên là `(organization_id, platform, external_post_id, metric_date)`; gửi lại cùng một hàng thì `updated` tăng, không nhân đôi. Trần 500 hàng mỗi lượt.

```http
POST /api/v1/integration/ai-requests
{
  "rows": [
    { "capability_code": "creative_variants", "model_key": "…",
      "attempt": 1, "escalated_from": null, "fallback_from": null,
      "job_id": null,
      "input_tokens": null, "output_tokens": null, "image_count": 3,
      "duration_seconds": 8.4, "gpu_seconds": null,
      "cost_usd": 0.061, "latency_ms": 8412,
      "quality_score": 0.93, "outcome": "ACCEPTED" }
  ]
}
```
```json
{ "accepted": 1 }
```

Bảng này chỉ ghi thêm và **không nhận prompt lẫn đầu ra** — gửi lên thì hai trường đó bị bỏ qua, cùng cách xử lý với `organization_id`. `capability_code` ngoài sổ đăng ký trả 400.

```http
GET /api/v1/integration/ai-policy
```
```json
{
  "capabilities": {
    "creative_variants": {
      "allowed_models": [
        { "key": "…", "measure_state": "san_xuat", "leaves_infra": true }
      ],
      "privacy_floor": "public",
      "accept_threshold": null,
      "measure_channels": ["product_integrity", "composition"]
    }
  },
  "generated_at": "2026-09-12T03:10:00Z",
  "cache_ttl_seconds": 900
}
```

Engine ngoài cache theo `cache_ttl_seconds`. Hết hạn mà không gọi được core thì **dùng bản cache cũ và không tự nới** — chính sách là một giới hạn, nên bản cũ chỉ có thể chặt hơn hoặc bằng, miễn là engine không tự thêm mô hình. Đây là chiều ngược với `POST /integration/jobs` ở mục 11: ở đó không gọi được core thì engine dừng việc tính phí, vì hạn mức là tiền của tổ chức và phải chặn thật.

`GET /integration/ai-policy` và `POST /integration/ai-requests` là đôi giữ nền AI của engine ngoài đứng cùng luật với core. Chính sách đọc được thì engine cache lại; không đọc được thì dùng bản cache gần nhất và **không tự nới** — một engine tự quyết mô hình nào được dùng là một engine có thể gửi ảnh khách tới một nhà cung cấp chưa ai soát. `POST /integration/ai-requests` không mang dữ liệu nghiệp vụ nào, chỉ mang số đo về chính lời gọi, nên nó là đường ghi duy nhất không đi qua cổng duyệt.

**Engine ngoài không bao giờ tự khai `organization_id`.** Nó nằm trong token, do core cấp và ký. Token có phạm vi năng lực riêng, hẹp hơn năng lực của người dùng.

`/integration/products/:id/master-image` chỉ trả ảnh có `approval_state = APPROVED`. Ảnh chờ duyệt không rò ra ngoài core.

## 12. Dữ liệu bán hàng của sản phẩm — M01b

| Method | Path | Năng lực |
|---|---|---|
| POST | `/vision/copies` | `H5` |
| GET | `/vision/copies` | `H6` |
| GET | `/vision/copies/:id` | `H5` |
| PATCH | `/vision/copies/:id` | `H2` |
| POST | `/vision/copies/:id/approve` | `H6` |
| POST | `/vision/copies/:id/reject` | `H6` |

```http
POST /api/v1/vision/copies
Idempotency-Key: 91c4…

{ "analysis_id": "…", "kenh": ["catalog", "facebook", "zalo"] }
```

`analysis_id` phải trỏ tới một lượt phân tích `APPROVED` của cùng tổ chức; lượt còn `PENDING` trả 422. Sinh câu chữ từ một kết quả chưa ai soát là đưa cái sai của máy đi thẳng ra kênh bán.

Cùng khuôn với M01: `raw` giữ bản máy sinh, `PATCH` ghi vào `edited`, duyệt ghi vào Product Master trong một giao dịch cùng với `audit_logs`. Phân khúc giá trong kết quả là một **nhãn bán hàng**, không phải giá chào — giá chào vẫn tính từ `/pricing-rules` và engine giá.

## 13. Catalog và liên kết QR — M06

| Method | Path | Năng lực | Ghi chú |
|---|---|---|---|
| GET · POST | `/catalog-links` | `J1` · `J7` | |
| GET | `/catalog-links/:id` | `J1` | |
| PATCH | `/catalog-links/:id` | `J7` | Đổi bộ sưu tập, đổi nhãn |
| POST | `/catalog-links/:id/revoke` | `J7` | Thu hồi; không xoá bản ghi |
| GET | `/catalog-links/:id/qr` | `J7` | Ảnh PNG mã QR để in |

Liên kết thu hồi được nhưng không xoá được: một mã QR đã dán ngoài cửa hàng vẫn sẽ bị quét sau khi thu hồi, và bản ghi là chỗ duy nhất trả lời được lượt quét đó trỏ về đâu. Liên kết đã thu hồi trả trang "bộ sưu tập này đã đóng", không trả lỗi kỹ thuật.

Trang catalog thuộc `LocalBudd`; core giữ liên kết vì nhiều module đọc nó.

## 14. Khách hàng — M09

| Method | Path | Năng lực | Ghi chú |
|---|---|---|---|
| GET | `/customers` | `Q1` | Sắp theo ngày đặc biệt gần nhất theo mặc định |
| POST | `/customers` | `Q2` | |
| GET · PATCH | `/customers/:id` | `Q1` · `Q3` | |
| POST | `/customers/:id/archive` | `Q4` | |
| GET | `/customers/export` | `Q5` | Mỗi lượt xuất ghi `audit_logs` |
| GET · POST | `/customers/:id/occasions` | `Q1` · `Q6` | |
| GET · POST | `/customers/:id/consents` | `Q1` · `Q3` | Cơ sở đồng ý, có mốc thời gian |
| GET · POST | `/reminder-campaigns` | `Q1` · `Q7` | |
| GET · POST | `/vouchers` | `Q1` · `Q8` | |

`POST /reminder-campaigns` từ chối (422) mọi khách hàng chưa có bản ghi đồng ý còn hiệu lực, và đáp ứng nói rõ bao nhiêu khách bị loại vì lý do đó. Lọc âm thầm sẽ để người vận hành tưởng chiến dịch đã chạm tới cả danh sách.

Nội dung nhắc mua sinh từ dịp và sản phẩm. Không endpoint nào gửi tên, số điện thoại hay địa chỉ khách hàng sang một nhà cung cấp AI; phần định danh ghép ở tầng gửi.

## 15. Đơn hàng và vận hành — M10

| Method | Path | Năng lực | Ghi chú |
|---|---|---|---|
| GET | `/orders` | `R1` | Lọc theo ngày, trạng thái, chi nhánh, người được phân công |
| POST | `/orders` | `R2` | |
| GET · PATCH | `/orders/:id` | `R1` · `R3` | |
| POST | `/orders/:id/assign` | `R4` | |
| POST | `/orders/:id/delivery` | `R5` | Cập nhật khung giờ và trạng thái giao |
| POST | `/orders/:id/cancel` | `R6` | Bắt buộc có lý do |
| GET | `/orders/:id/print` | `R7` | Phiếu đơn và phiếu sản xuất |
| GET | `/orders/:id/events` | `R1` | Nhật ký đổi trạng thái, nguồn đo SLA |

Ba trục trạng thái tách rời — đơn, sản xuất, giao hàng — và không gộp thành một enum, cùng lý do với ba trục của job ở mục 7. Mỗi lượt đổi sinh một bản ghi `order_events`; SLA đo từ bản ghi đó, không nhập tay.

Giá trên đơn đọc từ engine giá. `POST /orders` từ chối một giá không truy được về quy tắc giá đang hiệu lực, trừ khi người gọi có đúng năng lực đè giá của nhóm `C`.

## 16. Số liệu và hồ sơ phong cách — M11

| Method | Path | Năng lực | Ghi chú |
|---|---|---|---|
| GET | `/analytics/content` | `S1` | Reach, engagement, bài hiệu quả nhất |
| GET | `/analytics/products` | `S1` | Sản phẩm bán tốt, nối từ `orders` |
| GET | `/analytics/campaigns` | `S1` | Hiệu quả và ROI từng chiến dịch |
| GET | `/analytics/export` | `S2` | |
| GET | `/learning-profile` | `S3` | Hồ sơ phong cách kèm căn cứ |
| PUT | `/learning-profile` | `S4` | Đè tham số; ghi `audit_logs` |

Mỗi chỉ số trả kèm `nguon` và `den_ngay`. Dữ liệu kế thừa từ trước khi tài khoản nền tảng được gán cho tổ chức trả trong một khối riêng, không cộng vào khối của tổ chức.

`GET /learning-profile` trả mỗi kết luận kèm số bản ghi đã dùng để rút ra nó. Hồ sơ chưa đạt ngưỡng dữ liệu tối thiểu trả `du_lieu_du: false` và không được dùng để đổi tham số soạn nội dung.

## 17. Hội thoại — M08

| Method | Path | Năng lực |
|---|---|---|
| GET | `/conversations` | `T1` |
| GET | `/conversations/:id` | `T1` |
| POST | `/conversations/:id/messages` | `T2` |
| POST | `/conversations/:id/handoff` | `T4` |
| GET · PUT | `/conversations/settings` | `T1` · `T3` |

Tin do trợ lý tự trả lời mang cờ `tu_dong: true` trong chính bản ghi tin nhắn, không chỉ trong nhật ký. Câu trả lời về giá đọc từ engine giá; đáp ứng mang `nguon_gia` trỏ về quy tắc giá đã dùng.

## 18. Chính sách AI, sổ chi phí và điểm chấm

| Method | Path | Năng lực | Ghi chú |
|---|---|---|---|
| GET | `/ai-policy` | `U1` | Năng lực đang bật, mô hình đang dùng, ngưỡng, mức quyền riêng tư |
| PUT | `/ai-policy` | `U2` | Trần mà bộ định tuyến được chọn trong đó; ghi `audit_logs` |
| GET | `/ai-capabilities` | `U1` | Danh mục năng lực kèm trạng thái đo lường của từng mô hình |
| GET | `/ai-requests` | `U3` | Sổ chi phí và chất lượng từng lời gọi, lọc theo năng lực và khoảng thời gian |
| GET | `/ai-requests/summary` | `U3` | Tổng hợp theo năng lực và theo mô hình: chi phí, độ trễ, điểm, tỷ lệ phải leo thác |
| GET | `/ai-evaluations/:entity_type/:entity_id` | `U4` | Điểm chấm của một đầu ra và lý do nó vào hàng chờ soát |

```http
PUT /api/v1/ai-policy
{
  "capabilities": {
    "product_vision":   { "engine": "local_cv", "privacy_floor": "shop" },
    "content_generation": { "quality": "cao", "cost_ceiling_credit": 2 }
  }
}
```

`PUT` là **trần, không phải lệnh chọn**: nó khai phạm vi mà bộ định tuyến được chọn trong đó. Mô hình chưa đo trên bộ ảnh vàng chỉ vào được phạm vi này khi người gọi nêu tên nó tường minh — bộ định tuyến không tự lấy. Tên năng lực hoặc tên mô hình ngoài sổ đăng ký trả 400; mô hình thiếu một trong bốn ô giấy phép trả 422 kèm tên ô còn trống.

Năng lực phân tích ảnh giữ endpoint riêng đã có (`GET · PUT /vision/engine`, `H1`/`H4`) vì nó có màn hình riêng và luật riêng về việc bày ba bộ máy kèm trạng thái đo lường. Hai đường không được lệch nhau: cả hai ghi cùng một chỗ trong cấu hình tổ chức, và `PUT /ai-policy` từ chối (409) khi thân yêu cầu đổi `product_vision` mà người gọi không có `H4`.

`GET /ai-requests` phân trang con trỏ, trần 5.000 hàng mỗi lượt. Nó không bao giờ trả nội dung prompt hay đầu ra — chỉ số đo. Prompt của một lượt sinh nằm ở metadata của asset, gác bằng năng lực đọc asset.

## 19. Chưa có ở bản này

Endpoint mang khoá nhà cung cấp riêng của tổ chức. Quyết định D2 chốt nền tảng giữ khoá và tính credit, nên nhóm endpoint đó không tồn tại. Nếu D2 đổi về sau, nhóm này thêm vào dưới `/organizations/current/providers` mà không đụng tới endpoint nào đang có.
