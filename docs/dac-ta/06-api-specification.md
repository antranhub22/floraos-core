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
| GET | `/approvals` | `H3` · `I2` | Mọi thứ đang chờ duyệt, gộp từ nhiều module |
| POST | `/approvals/batch` | `H3` · `I2` | Duyệt hàng loạt, tối đa 50 mục |

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

**Engine ngoài không bao giờ tự khai `organization_id`.** Nó nằm trong token, do core cấp và ký. Token có phạm vi năng lực riêng, hẹp hơn năng lực của người dùng.

`/integration/products/:id/master-image` chỉ trả ảnh có `approval_state = APPROVED`. Ảnh chờ duyệt không rò ra ngoài core.

## 12. Chưa có ở bản này

Endpoint mang khoá nhà cung cấp riêng của tổ chức. Quyết định D2 chốt nền tảng giữ khoá và tính credit, nên nhóm endpoint đó không tồn tại. Nếu D2 đổi về sau, nhóm này thêm vào dưới `/organizations/current/providers` mà không đụng tới endpoint nào đang có.
