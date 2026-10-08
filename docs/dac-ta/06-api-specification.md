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
| POST | `/auth/login` | — | Chặn dò mật khẩu: 10 lần/15 phút mỗi email, 40 lần/15 phút mỗi IP → 429 (08/10/2026) |
| POST | `/auth/logout` | — | |
| GET | `/auth/me` | — | Người dùng, tổ chức hiện tại, danh sách năng lực đã tính |
| GET | `/auth/session-status` | — | Kiểm nhanh phiên còn sống; giao diện hỏi mỗi 15 giây và khi quay lại tab |
| GET | `/organizations` | — | Các tổ chức người dùng là thành viên |
| POST | `/session/organization` | — | Đổi tổ chức đang hoạt động |
| POST | `/session/password` | `A2` | Tự đổi mật khẩu `{ current_password, new_password }` (≥ 10 ký tự, khác mật khẩu cũ); sai mật khẩu hiện tại → 400; giữ phiên đang dùng, đăng xuất các máy khác; ghi audit (08/10/2026) |
| GET | `/organizations/current` | `F1` | |
| PATCH | `/organizations/current` | `F2` | |

**Mỗi tài khoản chỉ một phiên.** `POST /auth/login` thu hồi mọi phiên còn hiệu lực của người dùng rồi mới cấp phiên mới (người đăng nhập sau thắng). Phiên cũ gọi bất kỳ endpoint nào nhận `401 UNAUTHENTICATED` kèm `details.reason = "SESSION_SUPERSEDED"`; giao diện hiện cảnh báo "đăng nhập trên thiết bị khác" và đưa về trang đăng nhập. Phiên tự đăng xuất hoặc hết hạn trả 401 không có `reason`.

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
| POST | `/members` | `A3` |
| POST | `/members/invite` | `F3` |
| DELETE | `/members/:id` | `F4` |
| POST | `/members/:id/reset-password` | `A7` |
| PATCH | `/members/:id/status` | `A5` |
| PATCH | `/members/:id/role` | `F5` |
| GET | `/roles` | `F1` |
| POST | `/roles` | `F5` |
| PATCH | `/roles/:id/capabilities` | `F5` |
| GET | `/branches` | `F6` |
| POST | `/branches` | `F7` |
| PATCH | `/branches/:id` | `F7` |
| GET | `/workspaces` | `F1` |
| POST | `/workspaces` | `F8` |

**Tài khoản nhân viên (PO 08/10/2026).** `POST /members` `{ name, email, role_id, branch_id? }` tạo người dùng + thành viên **đang hoạt động** trong một giao dịch, trả `temporaryPassword` (12 ký tự, hiện một lần, `Cache-Control: no-store`); email đã có tài khoản FloraOS → 409 (không chiếm tài khoản người khác — dùng `/members/invite`). `POST /members/:id/reset-password` cấp mật khẩu tạm mới và đăng xuất người đó ở mọi máy; người đó còn là thành viên tiệm khác → 409; chính mình → 422. `PATCH /members/:id/status` `{ active }` tạm khoá (`SUSPENDED`, thu hồi ngay phiên ở tiệm này, giữ dữ liệu) hoặc mở lại. `A3`/`A5`/`A7` trần cứng Điều hành; thành viên tiệm khác → 404; mọi thao tác ghi `audit_logs` (không ghi mật khẩu).

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
| POST | `/products/batch-import` | `L2` | Nhập đồng loạt tối đa 500 sản phẩm (Excel/thư mục ảnh đã parse); `skip_duplicates` mặc định `true`. Bổ sung vào đặc tả 05/10/2026 |
| GET | `/products/:id/images` | **CHƯA XÂY** `G1` | |
| PUT | `/products/:id/images` | **CHƯA XÂY** `G2` | Đặt lại thứ tự và vai trò ảnh |
| GET · PUT | `/pricing-rules` | `L5` · `L6` | Theo tổ chức, có thể theo chi nhánh |
| POST | `/assets/upload-url` | `G2` | Trả URL ký sẵn; client tải thẳng lên kho |
| POST | `/assets` | `G2` | Ghi nhận asset sau khi tải xong |
| GET | `/assets/:id` | `G1` | |
| GET | `/assets/:id/view-url` | `G1` | Trả URL có chữ ký xem an toàn |
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
| POST | `/media/promote-to-master` | `I2` |

> **25/09/2026 (trả nợ #120).** `POST /media/optimizations` đưa MỌI bộ máy vào hàng đợi `media.optimize` qua `enqueueJob` — cả `config.engine = "cloud_provider"`. `config.enhancer_provider` ∈ `studio | local | openai | photoroom | fal_flux | fal` (`OPTIMIZE_ENHANCER_PROVIDERS`), mã khác → 400 trước khi trừ credit. Nhà cung cấp lỗi → worker lùi `StudioEnhancer` và ghi `parameters.fallback_reason`; Identity Guard do worker đo. Đáp ứng luôn `{ job_id, status, engine, usage }` — không còn trả ảnh ngay. Từ 25/09/2026 (PO: nhà cung cấp trước): trừ khi `enhancer_provider` là `studio`/`local`, máy chủ ghi `config.provider_order` (bên chọn cho lượt — `photoroom | fal_flux | imagen | openai`, `auto` = theo tiệm — rồi thứ tự của tiệm) và worker chạy chuỗi `ProviderChainEnhancer`; `engine` trong đáp ứng do máy chủ quyết. Giá (bảng giá v1): Photoroom/fal/OpenAI thu `media.optimize.cloud` = 3 credit, Studio/Local thu `media.optimize` = 2; `GET /media/optimizations/:id` hoàn chênh 1 credit khi worker lùi cục bộ (`output.provider_fallback`), hoàn toàn phần khi Guard từ chối / hỏng / huỷ.

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

### M04b — biến thể marketing

| Method | Path | Năng lực |
|---|---|---|
| POST | `/media/variants` | `I4` |
| GET | `/media/variants` | `I5` |
| GET | `/media/variants/:id` | `I4` |
| POST | `/media/variants/:id/approve` | `I5` |
| GET | `/media/variants/:id/download` | `I3` |

**Hai nhánh, cùng đi qua `enqueueJob` (cập nhật 23/09/2026):** thân `POST /media/variants` mang `engine: "local_studio" | "cloud_provider"`, `preset` + `ratio` bắt buộc cho cả hai, `scene_index` (1–5, phân cảnh theo kịch bản bối cảnh của chủ đề — CREATIVE 5, AUTHENTIC 3; từ 24/09/2026) và `scene_plan_id` (job `creative.scene_plan` hoặc `rule:<topic>:<mode>`, ghi vào `assets.metadata`) tuỳ chọn; nhánh cloud thêm `provider_key` (hiện chỉ `stability`) và `scene_prompt` (≤ 600 ký tự, mô tả KHÔNG GIAN hậu cảnh). `local_studio` → job `media.variant` (1 credit); `cloud_provider` → job `media.variant.cloud` (2 credit, giá tạm — nợ #64). Worker Python xử lý CẢ HAI: nhánh cloud chỉ nhờ nhà cung cấp vẽ hậu cảnh trống, bó hoa dán nguyên khối từ Master Image, Subject Integrity là số ĐO; nhà cung cấp lỗi thì lùi về phông Studio cục bộ và ghi `cloud_fallback` vào asset + sự kiện job. `Idempotency-Key` bắt buộc. Đáp ứng: `{ job_id, status, engine, deduped, usage }` — kết quả đọc qua `GET /media/variants/:id` (nay trả thêm `source.engine`, `source.scene_index`, `source.cloud_fallback`). Trước 23/09 nhánh cloud chạy đồng bộ trong request (`executeCloudCreative`), không trừ credit, integrity gõ tay 0,98 — đã gỡ.

**Nhà cung cấp trước (PO 25/09/2026):** thân không nêu `engine` = `cloud_provider`; máy chủ ghi `payload.provider_order` (bên `provider_key` chọn cho lượt → thứ tự của tiệm → mặc định `fal → stability → imagen`), worker thử lần lượt, mọi bên lỗi mới lùi phông cục bộ. AUTHENTIC cũng dùng nhà cung cấp (chỉ dựng nền + ánh sáng).

**Hoàn credit lúc đọc (25/09/2026, trả nợ #127):** `GET /media/variants/:id` hoàn toàn phần khi job hỏng / huỷ / bị cổng toàn vẹn từ chối, và hoàn phần chênh `media.variant.cloud` − `media.variant` (1 credit) khi nhánh cloud lùi phông cục bộ (`source.cloud_fallback`). Idempotent — đọc bao nhiêu lần cũng chỉ hoàn một lần.

`I4`/`I5` là cặp chạy/duyệt tách rời của M04b (`media.variant.run`/`media.variant.approve`), dựng ở P16/P24 khi M04b chuyển hẳn vào `floraos-core` thay vì `SocialFlow` — xem `docs/dac-ta/02-function-catalog.md` mục 4 và `src/core/rbac/capability-catalog.ts`. Biến thể chỉ dựng được từ Master Image đã qua `I2`; cổng Subject Integrity đo trên bản dựng và chặn ghi `assets` khi lệch quá ngưỡng, cùng luật với `I2`/Identity Guard ở M04a.

## 9. Hàng đợi duyệt

> **CHƯA XÂY (soát 18/09).** Cả hai endpoint dưới đây đều chưa tồn tại trong mã. Việc duyệt hiện làm rời rạc qua từng endpoint `/…/:id/approve` của mỗi module. Xem **RS-7**.

| Method | Path | Năng lực | Ghi chú |
|---|---|---|---|
| GET | `/approvals` | **CHƯA XÂY** | Mọi thứ đang chờ duyệt, gộp từ nhiều module. Năng lực dự tính: `H3` · `H6` · `I2` · `I5` · `P4` · `O3` |
| POST | `/approvals/batch` | **CHƯA XÂY** | Duyệt hàng loạt, tối đa 50 mục |

Sáu loại đi qua hàng đợi này, mỗi loại một năng lực: kết quả phân tích (`H3`), dữ liệu bán hàng của sản phẩm (`H6`), Master Image (`I2`), biến thể marketing (`I5`, M04b — dựng trong `floraos-core` từ P24, không còn `P2` như dự tính ban đầu khi module này còn gắn `SocialFlow`), video (`P4`), nội dung đăng bài (`O3`). Hai loại cuối phát sinh ở engine ngoài và đi vào hàng đợi này qua đường đăng ký asset và số liệu ở mục 11 — cổng duyệt nằm ở core, không nằm ở engine.

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

Dành cho `LocalBudd` (M05, M06) và `SocialFlow` (M07). *(M04b đã chuyển về core ở P24, không còn là engine ngoài.)*

**Tám đường đang chạy thật** — đã xác minh 18/09 là có mặt ở cả hai phía: `LocalBudd/src/core/ports/FloraOsCoreClient.ts` gọi `products`, `products/:id/master-image`, `business-profile`, `brand-profile`, `capabilities/check`, `jobs`; `SocialFlow/backend/floraos_core.py` gọi `brand-profile`, `usage`. Bốn đường đánh dấu **CHƯA XÂY** dưới đây chỉ tồn tại trong đặc tả này.

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
| GET | `/integration/learning-profile` | **CHƯA XÂY** — hồ sơ phong cách của tổ chức, để engine soạn nội dung đọc |
| POST | `/integration/assets/upload-url` | **CHƯA XÂY** — URL ký sẵn để engine ngoài tải byte lên; core sinh `storage_key`. Xem **RS-4** |
| POST | `/integration/assets` | Đăng ký một asset dẫn xuất đã hoàn tất |
| POST | `/integration/content-metrics` | Ghi số liệu hiệu quả của một nội dung đã đăng |
| GET | `/integration/ai-policy` | **CHƯA XÂY** — chính sách AI của tổ chức: năng lực được phép, mô hình đủ điều kiện, ngưỡng, sàn quyền riêng tư |
| POST | `/integration/ai-requests` | **CHƯA XÂY** — ghi số đo mỗi lời gọi mô hình: mô hình, chi phí, độ trễ, điểm chất lượng |

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
  "storage_key": null,               // ⚠ ĐẶC TẢ ≠ MÃ — xem RS-4
  "upload_token": "…",               // ⚠ ĐẶC TẢ ≠ MÃ — xem RS-4
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

> **Đổi tên 18/09.** Nhóm này từng được đặc tả dưới `/vision/copies`; route thật là **`/product-copies`** kể từ P14. Bảng dưới đã sửa theo mã.

| Method | Path | Năng lực | Gác ở đâu |
|---|---|---|---|
| POST | `/product-copies/generate` | `H5` | route |
| GET | `/product-copies` | **chưa gác** — xem **RS-8** | — |
| GET | `/product-copies/:id` | `H5` | route |
| PATCH | `/product-copies/:id` | `H5` | route |
| POST | `/product-copies/:id/approve` | `H6` | route |
| POST | `/product-copies/:id/reject` | `H6` | route |

Nhóm này kiểm quyền bằng `ctx.capabilities.has("…")` viết tay thay vì `requireCapability(ctx, "…")` như phần còn lại của hệ thống. Hai lối viết cho cùng một phép kiểm — xem **RS-9**.

```http
POST /api/v1/product-copies/generate
Idempotency-Key: 91c4…

{ "analysis_id": "…", "kenh": ["catalog", "facebook", "zalo"] }
```

`analysis_id` phải trỏ tới một lượt phân tích `APPROVED` của cùng tổ chức; lượt còn `PENDING` trả 422. Sinh câu chữ từ một kết quả chưa ai soát là đưa cái sai của máy đi thẳng ra kênh bán.

Cùng khuôn với M01: `raw` giữ bản máy sinh, `PATCH` ghi vào `edited`, duyệt ghi vào Product Master trong một giao dịch cùng với `audit_logs`. Phân khúc giá trong kết quả là một **nhãn bán hàng**, không phải giá chào — giá chào vẫn tính từ `/pricing-rules` và engine giá.

## 13. Catalog và liên kết QR — M06

> **Đổi định danh 18/09.** Đặc tả cũ dùng `:id`; route thật định danh bằng **`:slug`**. Năng lực thật là `J1`/`J2`, không phải `J7` (`J7` chưa vào danh mục). Bảng dưới đã sửa theo mã.
>
> **RS-3 (18/09): Core chốt làm chủ DUY NHẤT bảng `catalog_links`.** `LocalBudd` đã bỏ bảng riêng của nó cùng ngày, chuyển sang gọi các endpoint `/integration/catalog-links*` dưới đây (`src/core/ports/FloraOsCoreClient.ts`). Nhân lúc sửa, phát hiện `PATCH` (đổi tên/mô tả/bộ lọc) trước đó nằm NHẦM ở tệp route của `/catalog-links/:slug/revoke` nên thực ra chạy tại `PATCH /catalog-links/:slug/revoke`, không phải `PATCH /catalog-links/:slug` như tài liệu cũ ngỡ — không ai từng gọi tới; đã dời về đúng chỗ.

| Method | Path | Năng lực | Ghi chú |
|---|---|---|---|
| GET · POST | `/catalog-links` | `J1` | Route phiên (cookie), dùng bởi giao diện core |
| GET | `/catalog-links/:slug` | **chưa gác** — có chủ đích, xem **RS-8** | Công khai, khách quét QR không đăng nhập |
| PATCH | `/catalog-links/:slug` | `J1` | Trước 18/09 nằm nhầm ở đường dẫn `/revoke` (xem trên) |
| POST | `/catalog-links/:slug/revoke` | `J2` | Thu hồi; không xoá bản ghi |
| GET · POST | `/integration/catalog-links` | `J1` (nhánh SSO) | Mới 18/09 (RS-3) — `LocalBudd` gọi thay mặt người dùng đang đăng nhập |
| PATCH | `/integration/catalog-links/:slug` | `J1` (nhánh SSO) | Mới 18/09 (RS-3) |
| POST | `/integration/catalog-links/:slug/revoke` | `J2` (nhánh SSO) | Mới 18/09 (RS-3) |
| GET | `/public/catalog/:slug` | — *(công khai)* | Storefront khách xem; ảnh ký HMAC |
| POST | `/public/catalog/:slug/lead` | — *(công khai)* | Form Lead Capture: `{ phone, message? }` ghi vào `metadata.leads` của `catalog_links`; tổ chức suy từ bản ghi, không nhận từ client. Bổ sung vào đặc tả 05/10/2026 |

**Chưa có:** `GET /catalog-links/:slug/qr` (ảnh PNG mã QR để in) ở core — `LocalBudd` tự sinh QR phía route của nó (`qrcode`, trỏ về `/c/:slug` của chính nó), core cũng có `src/core/media/qr-engine.ts` sinh QR phía giao diện, không qua endpoint. Xem **RS-7**.

Liên kết thu hồi được nhưng không xoá được: một mã QR đã dán ngoài cửa hàng vẫn sẽ bị quét sau khi thu hồi, và bản ghi là chỗ duy nhất trả lời được lượt quét đó trỏ về đâu. Liên kết đã thu hồi trả trang "bộ sưu tập này đã đóng", không trả lỗi kỹ thuật.

**Còn lại sau RS-3, CHƯA quyết:** trang catalog vẫn có hai bản RENDER song song — core phục vụ `/c/:slug` + `GET /api/v1/public/catalog/:slug`, và `LocalBudd` phục vụ `/c/:slug` của riêng nó (nay đọc dữ liệu từ core thay vì bảng riêng). RS-3 chỉ chốt ai làm chủ DỮ LIỆU (`catalog_links`) — chưa chốt ai phục vụ TRANG cho khách quét QR khi cả hai cùng tồn tại. Không chặn gì hôm nay (mỗi bên vẫn chạy được độc lập), nhưng là một quyết định sản phẩm còn treo, khác diện RS-3.

## 14. Khách hàng — M09

| Method | Path | Năng lực | Ghi chú |
|---|---|---|---|
> **Đổi tiền tố 18/09.** Đặc tả cũ dùng `/customers`; route thật nằm dưới **`/crm/`**. Bảng dưới đã sửa theo mã.

| Method | Path | Năng lực | Ghi chú |
|---|---|---|---|
| GET | `/crm/customers` | `Q1` · `Q2` | Sắp theo ngày đặc biệt gần nhất theo mặc định |
| POST | `/crm/customers` | `Q2` | |
| GET | `/crm/customers/:id` | `Q1` · `Q3` · `Q4` | |
| PATCH | `/crm/customers/:id` | `Q3` · `Q4` | |
| DELETE | `/crm/customers/:id` | `Q4` | Thay cho `POST /customers/:id/archive` của bản cũ |
| GET | `/crm/customers/:id/master-index` | `Q1` | Customer Master Index — SSOT một khách |
| POST | `/crm/customers/:id/occasions` | `Q5` | |
| POST | `/crm/customers/:id/consent` | `Q6` | Cơ sở đồng ý, có mốc thời gian |
| GET | `/crm/reminders/upcoming` | `Q7` | Quét dịp trước 14 ngày |

**Lệch nghĩa mã cần soát:** bản cũ gán `Q5` cho xuất danh sách và `Q6` cho dịp; mã thật gán `Q5` cho dịp và `Q6` cho đồng ý. Một trong hai sai — xem **RS-10**.

**Chưa có:** `GET /crm/customers/export` (`Q5`, mỗi lượt xuất ghi `audit_logs`), `/reminder-campaigns` (`Q7`), `/vouchers` (`Q8` — bảng `vouchers` đã có trong lược đồ, endpoint thì chưa). Xem **RS-7**.

Khi `POST /reminder-campaigns` được xây, nó phải từ chối (422) mọi khách hàng chưa có bản ghi đồng ý còn hiệu lực, và đáp ứng nói rõ bao nhiêu khách bị loại vì lý do đó. Lọc âm thầm sẽ để người vận hành tưởng chiến dịch đã chạm tới cả danh sách.

Nội dung nhắc mua sinh từ dịp và sản phẩm. Không endpoint nào gửi tên, số điện thoại hay địa chỉ khách hàng sang một nhà cung cấp AI; phần định danh ghép ở tầng gửi.

## 15. Đơn hàng và vận hành — M10

| Method | Path | Năng lực | Ghi chú |
|---|---|---|---|
| GET | `/orders` | `R1` | Lọc theo ngày, trạng thái, chi nhánh, người được phân công |
| POST | `/orders` | `R2` | |
| GET · PATCH | `/orders/:id` | `R1` · `R3` | |
| POST | `/orders/:id/assign` | `R4` | |
| POST | `/orders/:id/cancel` | `R6` | Bắt buộc có lý do |
| GET | `/orders/:id/print` | `R7` | Phiếu đơn và phiếu sản xuất |
| GET | `/orders/:id/events` | `R1` | Nhật ký đổi trạng thái, nguồn đo SLA |

**Chưa có:** `POST /orders/:id/delivery` (`R5` — cập nhật khung giờ và trạng thái giao). Trạng thái giao hiện đổi qua `PATCH /orders/:id`. Xem **RS-7**.

`POST /orders/:id/cancel` gác `R6` **ở tầng use-case** (`cancel-order.ts:20`), không ở route — đúng luật nhưng khác lối viết của phần còn lại, xem **RS-9**.

Ba trục trạng thái tách rời — đơn, sản xuất, giao hàng — và không gộp thành một enum, cùng lý do với ba trục của job ở mục 7. Mỗi lượt đổi sinh một bản ghi `order_events`; SLA đo từ bản ghi đó, không nhập tay.

Giá trên đơn đọc từ engine giá. `POST /orders` từ chối một giá không truy được về quy tắc giá đang hiệu lực, trừ khi người gọi có đúng năng lực đè giá của nhóm `C`.

## 15b. Điều phối đơn hàng — Chức năng 12 (Control Tower)

Mọi route nhận `:id` là id HOẶC mã đơn (`FLR-YYMMDD-NNNN`); tổ chức khác → 404. Body sai → 400 `VALIDATION_FAILED`; luật nghiệp vụ không đạt → 422; chuyển bước sai luồng hoặc bị người khác cập nhật trước → 409. Mọi thao tác ghi `order_events` (trục đổi giá trị) và `audit_logs` trong cùng giao dịch. Hợp đồng zod + JSON Schema: `src/modules/coordinator/contracts/`, `docs/dac-ta/schemas/coordinator/`.

| Phương thức | Đường dẫn | Năng lực | Ghi chú |
|---|---|---|---|
| GET | `/coordinator/orders` | `R1` | `?stage=` `?limit=` (≤200). Rủi ro trễ tính lại lúc đọc (F09/F12) |
| POST | `/coordinator/orders` | `R2` | Mã đơn do máy chủ cấp, tuần tự theo ngày; `sampleImageUrl` cấm `data:` — ảnh tải lên dùng `sampleAssetId` |
| GET | `/coordinator/orders/:id` | `R1` | |
| PATCH | `/coordinator/orders/:id/stage` | `R3` | Kiểm luồng + bằng chứng (đối tác / QC đạt / POD / hết sự cố) |
| PATCH | `/coordinator/orders/:id/custom-fields` | `R3` | ĐP-3.16 — sửa giá trị trường tự tạo (entity ORDER); trộn vào giá trị cũ, không thay nguyên khối |
| GET | `/coordinator/orders/:id/payments` | `R1` | ĐP-4a (PO D2) — sổ thu của một đơn |
| POST | `/coordinator/orders/:id/payments` | `R9`/`R10` | ĐP-4a (PO D2) — ghi một dòng sổ thu. `kind=DEPOSIT`/`BALANCE` đòi `R9`; `kind=REFUND` đòi `R10` (trần cứng điều hành). `orders.paid_vnd`/`balance_vnd` cập nhật cùng giao dịch |
| POST | `/coordinator/orders/:id/assign-partner` | `R4` | Đối tác cùng tổ chức, đang hoạt động, chưa vượt `capacity_daily` (trừ `overrideCapacity`) |
| POST | `/coordinator/orders/:id/production` | `R3` | `MARK_READY` bắt buộc ảnh thành phẩm (`assets` cùng tổ chức); `REPORT_MATERIAL_ISSUE` mở sự cố |
| POST | `/coordinator/orders/:id/qc` | `R3` | Người kiểm kết luận; không đạt bắt buộc lý do; `REJECTED` mở sự cố `QC_FAILURE` |
| POST | `/coordinator/orders/:id/delivery` | `R5` | Sự kiện giao; thành công bắt buộc ảnh POD hoặc tên người ký; thất bại mở sự cố |
| POST | `/coordinator/orders/:id/exceptions` | `R3` | Đưa đơn về `EXCEPTION`, nhớ bước cũ |
| POST | `/coordinator/exceptions/:id/resolve` | `R3` | Hết sự cố mở → đơn tự về bước cũ |
| POST | `/coordinator/orders/:id/close` | `R3` | Chỉ khi `DELIVERED` và không còn sự cố; chốt điểm + tiền công đối tác |
| POST | `/coordinator/orders/:id/cancel` | `R6` | Trần cứng điều hành; bắt buộc lý do; không huỷ đơn đã giao |
| GET | `/coordinator/partners` | `R1` | `?active=1` |
| POST | `/coordinator/partners` | `R4` | Trùng mã trong tổ chức → 409 |
| PATCH | `/coordinator/partners/:id` | `R4` | Sửa hồ sơ, tạm ngưng/mở lại |
| GET | `/field-config` | `R1` | ĐP-3 — cấu hình trường hiệu lực cho tổ chức của người gọi (lớp mã + cấu hình nền tảng + ghi đè theo tổ chức đã cộng sẵn), `?entity=ORDER\|PARTNER`. CHỈ ĐỌC — route tenant không ghi được vào `field_definitions`/`field_config_overrides`, xem mục 21b |
| GET | `/field-config/catalogs` | `R1` | ĐP-4a.1 — danh mục (§2.15) cho form nhập liệu tenant (T01…), `?keys=priority,serviceLevel,...` (bỏ trống trả hết). CHỈ giá trị đang `is_active`. Khác `/platform/catalogs` (đòi `N12`): route này chỉ đòi đăng nhập tổ chức, không có thao tác ghi |

## 16. Số liệu và hồ sơ phong cách — M11

> **CHƯA XÂY (soát 18/09).** Không endpoint nào trong mục này tồn tại trong mã, và bảng `learning_profiles` cũng chưa có trong lược đồ. Dải năng lực `S1`–`S4` chưa vào danh mục. `src/lib/mock-data.ts` ghi `analytics-learning: chua_san_sang`, khớp với thực tế. Xem **RS-7**.

| Method | Path | Năng lực | Ghi chú |
|---|---|---|---|
| GET | `/analytics/content` | **CHƯA XÂY** `S1` | Reach, engagement, bài hiệu quả nhất |
| GET | `/analytics/products` | **CHƯA XÂY** `S1` | Sản phẩm bán tốt, nối từ `orders` |
| GET | `/analytics/campaigns` | **CHƯA XÂY** `S1` | Hiệu quả và ROI từng chiến dịch |
| GET | `/analytics/export` | **CHƯA XÂY** `S2` | |
| GET | `/learning-profile` | **CHƯA XÂY** `S3` | Hồ sơ phong cách kèm căn cứ |
| PUT | `/learning-profile` | **CHƯA XÂY** `S4` | Đè tham số; ghi `audit_logs` |

Mỗi chỉ số trả kèm `nguon` và `den_ngay`. Dữ liệu kế thừa từ trước khi tài khoản nền tảng được gán cho tổ chức trả trong một khối riêng, không cộng vào khối của tổ chức.

`GET /learning-profile` trả mỗi kết luận kèm số bản ghi đã dùng để rút ra nó. Hồ sơ chưa đạt ngưỡng dữ liệu tối thiểu trả `du_lieu_du: false` và không được dùng để đổi tham số soạn nội dung.

## 17. Hội thoại — M08

> **Đổi tiền tố 18/09.** Đặc tả cũ dùng `/conversations`; route thật nằm dưới **`/chat/`**. Bảng dưới đã sửa theo mã.

| Method | Path | Năng lực | Ghi chú |
|---|---|---|---|
| GET | `/chat/conversations` | `T1` · `T2` | |
| POST | `/chat/conversations` | `T2` | |
| GET | `/chat/conversations/:id/messages` | `T1` · `T2` | Thay cho `GET /conversations/:id` của bản cũ |
| POST | `/chat/conversations/:id/messages` | `T2` | |
| POST | `/chat/conversations/:id/create-order` | `T3` | Chuyển hội thoại thành đơn nháp — M10 |
| GET · POST | `/chat/channels` | **chưa gác** — xem **RS-8** | Cấu hình kênh; `configure-chat-channel.ts` gác `T4` nhưng route `/chat/channels` không gọi qua nó |
| POST | `/chat/public/widget` | — *(công khai)* | Mã nhúng một dòng cho website ngoài |
| GET · POST | `/chat/webhooks/facebook` | — *(chữ ký nền tảng)* | |
| POST | `/chat/webhooks/zalo` | — *(chữ ký nền tảng)* | |

**Chưa có:** `POST /chat/conversations/:id/handoff` (`T4` — chuyển cho người thật) và `GET · PUT /chat/conversations/settings` (`T1`/`T3`). Xem **RS-7**.

Tin do trợ lý tự trả lời mang cờ `tu_dong: true` trong chính bản ghi tin nhắn, không chỉ trong nhật ký. Câu trả lời về giá đọc từ engine giá; đáp ứng mang `nguon_gia` trỏ về quy tắc giá đã dùng.

## 18. Chính sách AI, sổ chi phí và điểm chấm

| Method | Path | Năng lực | Ghi chú |
|---|---|---|---|
| GET | `/ai-policy` | `U1` | Năng lực đang bật, mô hình đang dùng, ngưỡng, mức quyền riêng tư |
| PUT | `/ai-policy` | `U2` | Trần mà bộ định tuyến được chọn trong đó; ghi `audit_logs` |
| GET | `/ai-capabilities` | `U1` | Danh mục năng lực kèm trạng thái đo lường của từng mô hình |
| GET | `/ai-requests` | `U3` | Sổ chi phí và chất lượng từng lời gọi, lọc theo năng lực và khoảng thời gian |
| GET | `/ai-requests/summary` | `U3` | Tổng hợp theo năng lực và theo mô hình: chi phí, độ trễ, điểm, tỷ lệ phải leo thác |
| GET | `/ai-evaluations/:entity_type/:entity_id` | **CHƯA XÂY** `U4` | Điểm chấm của một đầu ra và lý do nó vào hàng chờ soát. Bảng `ai_evaluations` đã có; endpoint thì chưa |
| GET · POST | `/ai-requests/review` | `U3` | Hàng chờ soát đầu ra AI — **có trong mã, thiếu trong bản đặc tả cũ** |

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

## 19. Video — M04c

> **Bổ sung 18/09.** M04c dựng xong ở P17 nhưng chưa từng có mục nào trong đặc tả này.

| Method | Path | Năng lực | Ghi chú |
|---|---|---|---|
| GET · POST | `/video/jobs` | `I1` | Tạo và liệt kê job video |
| GET | `/video/jobs/:id` | `I1` | Kèm `final_video_view_url` — URL ký có hạn để phát video đã render (24/09/2026); `final_video_url` thô không mở được vì thiếu chữ ký |
| PATCH | `/video/jobs/:id/storyboard` | `I1` | Biên soạn phân cảnh, 2–15 cảnh |
| POST | `/video/jobs/:id/render` | `I1` | Thân tuỳ chọn (24/09/2026) 24/09/2026 — `{ scene_images?: [{ scene_index, asset_id }] }` lấp cảnh còn trống ảnh (chỉ asset của đúng tổ chức); không gửi thì máy chủ tự lấp bằng ảnh Khu vực D mới nhất cùng số cảnh / Master của sản phẩm. Vẫn trống → 422. Thêm 25/09/2026 (PO: nhà cung cấp trước): `video_provider?: veo\|kling\|runway\|luma\|local_cinematic` — bên chọn cho lượt đứng đầu, sau đó thứ tự tiệm (`creative_providers.video`) rồi mặc định; payload job mang `provider_order`; thu `video.render` + giá clip/cảnh của bên đứng đầu; worker sinh clip từng cảnh qua nhà cung cấp, ghép phụ đề/âm thanh ở FloraOS; mọi bên lỗi → Ken Burns cục bộ + ghi `provider_fallback_reason`, đọc job thì hoàn phần clip. `local_cinematic` = chỉ ghép cục bộ, không thứ tự nhà cung cấp |
| POST | `/video/jobs/:id/approve-script` | `P3` | Cổng 1 — duyệt kịch bản (kiểm ở use-case `approve-storyboard.ts`) |
| POST | `/video/jobs/:id/approve-video` | `P4` | Cổng 2 — duyệt video thành phẩm, trần cứng (kiểm ở use-case `approve-video-output.ts`) |

**Chưa có:** `GET /video/jobs/:id/events`. TRANG_THAI mục P17 mô tả một luồng SSE ở đường này, nhưng thư mục `src/app/api/v1/video/jobs/[id]/` chỉ có `route.ts`, `storyboard`, `render`, `approve-script`, `approve-video` — **không có `events`**. Tiến trình render hiện đọc bằng cách nào thì chưa rõ; cần soát lại trước khi ghi vào đặc tả. Xem **RS-7**.

**Soát lại 23/09/2026:** hai cổng duyệt video KHÔNG còn dùng chung `I2` — `P3` (`video.approve_script`) và `P4` (`video.approve_final`, trần cứng) đã có trong `capability-catalog.ts` và được kiểm ở use-case (route không lặp lại phép kiểm, RS-9). Mỗi cảnh của storyboard nay mang `motionEffect` tuỳ chọn (`ZOOM_IN | ZOOM_OUT | PAN_UP | PAN_RIGHT | STATIC`), lưu ở `video_scenes.motion_effect` và chuyển vào payload render; vắng thì worker tự xoay vòng như trước.

Khuôn video là enum `video_format`: `REEL_15S` · `TIKTOK_30S` · `STORY_15S` · `SLIDESHOW` · `PRODUCT_PAGE` · `AD_MOTION`. Trạng thái là enum `video_stage` chín giá trị, xem đặc tả 07.

## 20. Hạ tầng và nội bộ

> **Bổ sung 18/09.** Các nhóm route này có trong mã từ lâu nhưng chưa từng có mục trong đặc tả.

| Method | Path | Năng lực | Ghi chú |
|---|---|---|---|
| POST | `/sso/refresh` | — | Làm mới JWT `floraos_sso` cho Unified Shell |
| GET · POST · PUT · PATCH · DELETE | `/proxy/:path` | — | Chuyển tiếp sang engine ngoài trong Unified Shell |
| GET · PUT | `/storage/:key` | — *(chữ ký URL)* | Đích của URL ký sẵn; `verifyStorageSignature` gác, hết hạn 15 phút |
| GET | `/integration-tokens` | `F9` | Cấp token cho engine ngoài |
| POST | `/integration-tokens` | `F9` | |
| POST | `/integration-tokens/:id/rotate` | `F9` | |
| DELETE | `/integration-tokens/:id` | `F9` | |
| GET | `/template-overrides` | `F1` · `F2` | Hệ thống template SSOT |
| PUT | `/template-overrides` | `F2` | |
| DELETE | `/template-overrides/:templateKey/:fieldKey` | `F2` | |
| GET | `/occasions` | `F1` · `F2` | Sổ dịp dùng chung |
| POST | `/occasions` | `F2` | |
| PATCH | `/occasions/:id` | `F2` | |
| POST | `/content-guard/validate` | — | Từ điển từ cấm ngành hoa |
| POST | `/organizations/current/upgrade-request` | `F2` | Xin nâng hạng workspace |
| GET | `/products/master-index` | `L1` | Product Master Index — toàn tổ chức |
| GET | `/products/:id/master-index` | `L1` | Một sản phẩm |
| GET | `/assets` | `G1` | Liệt kê asset, lọc theo sản phẩm và `kind` |
| POST | `/assets/:id/approve` | `I2` | Duyệt asset dẫn xuất |
| GET | `/media/optimizations` | `I1` | Liệt kê lượt tối ưu M04a |
| POST | `/jobs/batch` | mã "run" theo `module` (`MODULE_RUN_CAPABILITY`, mặc định từ chối — RS-8) | Tạo job cho một module với danh sách mã `AIC` chọn sẵn. Sửa dòng này 05/10/2026: route đã gác từ RS-8 18/09, đặc tả ghi "chưa gác" là cũ |
| POST | `/media/variants/batch` | `I4` | |
| POST | `/media/background-removal` | — | **ĐÃ ĐÓNG ở P24**, luôn trả 409 kèm đường thay thế |
| GET | `/ai-capabilities` | `U1` | |

## 21. Console Vận hành Nền tảng (P25a)

Năm route dưới đây thuộc console vận hành nền tảng (`docs/kien-truc/KE_HOACH_CONSOLE_VAN_HANH.md`), dùng cho người vận hành FloraOS chứ không phải thành viên một tổ chức. Đây là **ngoại lệ có chủ đích, có gác quyền** với Luật 2 ở mục 1 ("không endpoint nào trả dữ liệu xuyên tổ chức") — năm route này CỐ Ý trả dữ liệu của nhiều/mọi tổ chức cùng lúc.

Khác biệt với mọi route còn lại trong tài liệu này:
- Ngữ cảnh gác không phải `TenantContext` mà là `PlatformContext` (`requirePlatformContext`, `src/modules/platform/use-cases/resolve-platform-session.ts`) — giải từ bảng `platform_operators`, độc lập với `sessions.organization_id`.
- Mã năng lực gác là dải `N1`–`N8` (đặc tả 02 mục "Vận hành nền tảng — dải N"), TÁCH HẲN khỏi `capability_scope`/`SYSTEM_ROLES` của tenant (D-N6, chốt 19/09) — không xuất hiện trong `role_capabilities`/`capability_overrides`.
- Truy vấn xuyên tổ chức chỉ đi qua `src/modules/platform/infra/platform-query.ts` — điểm DUY NHẤT trong repo được phép truy vấn nhiều tổ chức cùng lúc (kế hoạch mục 4.4).
- Chưa đăng nhập → 401 `UNAUTHENTICATED`. Đã đăng nhập nhưng không có dòng `platform_operators` đang hoạt động, hoặc thiếu đúng mã N ở cột dưới → 403 `CAPABILITY_DENIED` — giống hệt một thành viên tổ chức thiếu năng lực, không phải "chưa xác thực".

P25a chỉ đọc (D-N5 áp dụng cho toàn bộ P25a, không riêng `/health`): không route nào trong nhóm này ghi dữ liệu. Duyệt yêu cầu nâng cấp, nạp/hoàn credit, tạo tổ chức (`N2`, `N3`, `N7`) thuộc P25b/P25c, chưa có ở bản này.

| Method | Path | Năng lực | Ghi chú |
|---|---|---|---|
| GET | `/platform/organizations` | `N1` | Danh sách mọi tổ chức — tên, slug, loại, số dư credit, số thành viên |
| GET | `/platform/organizations/:id` | `N1` | Chi tiết một tổ chức bất kỳ — không lọc theo tổ chức của người gọi |
| GET | `/platform/usage` | `N4` | Usage & chi phí gộp theo (tổ chức, tính năng), toàn hệ thống |
| GET | `/platform/health` | `N5` | Đếm job theo trạng thái + danh sách job treo (chỉ đọc — không đánh dấu FAILED, xem `scripts/scan-stuck-jobs.ts`) |
| GET | `/platform/audit-logs` | `N6` | Nhật ký xuyên tổ chức — hợp `audit_logs` mọi tổ chức và `platform_audit_logs` |

## 21b. Nền quản trị trường (ĐP-3, 26/09/2026)

Chín route dưới đây cũng là console vận hành nền tảng (`PlatformContext`, mã `N12`), theo đúng khuôn mục 21 — **có thao tác ghi** (trừ hai route đọc thêm ở cuối bảng, phục vụ Console UI 3.15), khác P25a (chỉ đọc). Đây là tuyến ghi ĐẦU TIÊN của Console Vận hành, dựng theo kế hoạch
`docs/kien-truc/KE_HOACH_DIEU_PHOI_TRUONG_DU_LIEU.md` mục 6. Mọi thao tác ghi ghi vào `platform_audit_logs` (`recordPlatformAuditLog`). Xem Đặc tả trường §16.2–§16.3 cho nguyên lý "lớp mã / lớp cấu hình" và mức sàn không cấu hình được.

| Method | Path | Năng lực | Ghi chú |
|---|---|---|---|
| GET | `/platform/fields` | `N12` | Liệt kê trường lõi + trường tự tạo, `?entity=ORDER\|PARTNER` |
| PATCH | `/platform/fields` | `N12` | Sửa cấu hình platform-wide của MỘT trường đã xây (nhãn, mô tả, mức yêu cầu, hiển thị, danh mục gắn theo). Mức sàn #2 chặn hạ mức yêu cầu của trường lõi xuống dưới lớp mã → 400 |
| POST | `/platform/fields` | `N12` | Tạo trường TỰ TẠO hoàn toàn mới (D13, Đặc tả trường §16.3). Khoá `cf_…` do máy sinh từ nhãn, không nhận từ client |
| POST | `/platform/fields/:key/deactivate` | `N12` | Chỉ TẮT — không xoá cứng. Trường lõi `REQUIRED` không tắt được → 400 |
| GET | `/platform/catalogs` | `N12` | Mọi danh mục (§2.15) kèm giá trị |
| POST | `/platform/catalogs/:key/values` | `N12` | Thêm giá trị mới. Danh mục CÓ HÀNH VI bắt buộc `behavior` là mã có thật trong `behaviors.ts`; danh mục ĐÓNG từ chối → 400 |
| PUT | `/platform/organizations/:id/field-overrides` | `N12` | Ghi đè CHỈ áp cho một tổ chức — trường (`target: "field"`) hoặc giá trị danh mục (`target: "catalogValue"`) |
| GET | `/platform/organizations/:id/field-preview` | `N12` | ĐP-3 3.15 — "tổ chức này sẽ thấy gì" sau khi cộng ghi đè, `?entity=ORDER\|PARTNER`. Dùng chung phép tính với `/field-config` (tenant), chỉ khác ngữ cảnh gọi. CHỈ ĐỌC |
| GET | `/platform/behaviors` | `N12` | ĐP-3 3.15 — liệt kê mã hành vi có thật trong `field-platform/domain/behaviors.ts` cho một `behavior_kind` (`?kind=…`), để Console gợi ý khi thêm giá trị danh mục CÓ HÀNH VI. CHỈ ĐỌC, không thay luật kiểm ở `upsert-catalog-value.ts` |

## 22. Phân hệ Nghiên cứu Thị trường & Xu hướng (Market Intelligence Engine, Đợt A mở rộng)

Đợt A mở rộng theo `FloraOS-Intelligence-Engine_FINAL_v2.0.md` (đặc tả đầy đủ, mục 8–19: Product Intelligence) — xem ghi chú mở rộng D-MI5 tại project claude.ai (`ke-hoach-market-intelligence-dot-a-19-09-2026.md`).

| Method | Path | Năng lực | Ghi chú |
|---|---|---|---|
| GET | `/market-intelligence/opportunities` | `V2` | Danh sách cơ hội nội dung đã cá nhân hóa cho tổ chức |
| POST | `/market-intelligence/research-runs` | `V1` | Kích hoạt lượt chạy nghiên cứu xu hướng thị trường — hỗ trợ tham số `channel` (mặc định chuỗi Google Trends → SerpApi; `youtube`/`tiktok` gọi riêng kênh; `omnichannel` gọi song song cả 3 nguồn để đối chiếu chéo, đúng cơ chế "cross-validation" ở mục 10 đặc tả v1.0 gốc). Kênh `facebook` đã bị GỠ 19/09/2026 — Facebook không có API công khai đo được mức thảo luận theo chủ đề, adapter trước đó chỉ suy diễn qua kết quả tìm kiếm Google (không phải số đo Facebook thật), nên đã xoá khỏi hệ thống thay vì tiếp tục trình bày như một kênh nghiên cứu (xem `TECHNICAL_DEBT.md`). Kênh `shopping` (hiển thị trên UI là "Google Shopping") **CHƯA XÂY** — chủ sản phẩm quyết định 19/09/2026 GIỮ lựa chọn này trên UI nhưng chưa có adapter thật; chọn kênh này hiện rơi xuống đúng chuỗi mặc định (Google Trends → SerpApi → Cached), không phải dữ liệu Google Shopping thật (nợ kỹ thuật #116) |
| GET | `/market-intelligence/research-runs` | `V1` | Lịch sử các lượt chạy nghiên cứu thị trường |
| GET | `/market-intelligence/health` | `V1` | Sức khỏe và trạng thái các nhà cung cấp dữ liệu xu hướng |
| POST | `/market-intelligence/product-intelligence` | `V1` | Product Intelligence (v2.0 mục 8–19): phân tích ảnh sản phẩm hoa (Vision AI), đối soát Trend Fit dựa trên tín hiệu thật từ `trend_signals` (nợ #115, đã trả 21/09/2026), cải tiến (KEEP/IMPROVE/TEST) và 10 chủ đề nội dung cụ thể. Mỗi lượt phân tích được LƯU LẠI vào `product_analysis_runs` (nợ #113, đã trả 21/09/2026). **CHƯA XÂY** (quyết định chủ sản phẩm 21/09/2026 — tạm hoãn, xem nợ #117): gợi ý định vị (Positioning, mục 15), phân tích riêng theo từng dịp dùng (Occasion Intelligence, mục 14), và bối cảnh cạnh tranh (Competitive Context, mục 16) |
| POST | `/market-intelligence/vision-extract` | `V1` | Bóc tách đặc trưng thị giác hoa tươi qua OpenAI Multimodal Vision. Từ 25/09/2026: `asset_id` BẮT BUỘC (ảnh đọc từ kho của đúng tổ chức, `image_url` bị bỏ qua); thu `product.vision_extract` = 1 credit qua `enqueueJob`, khoá `vision-extract:<asset_id>` (bấm lại không thu), hỏng → FAILED + hoàn; kết quả M01 đã có thì miễn phí (trả `reused: true`). Từ 06/10/2026: `reanalyze_key?` = người dùng đã xác nhận phân tích lại → bỏ kết quả cũ, khoá `vision-extract:<asset_id>:again:<key>`, gọi mô hình và thu 1 credit (cùng khoá = một lần bấm, không trừ hai lần). Trường mô hình không trả để trống/0 |
| GET | `/product-intelligence/:id` | `V2` | Xem chi tiết kết quả phân tích Product Intelligence đã lưu theo run ID (mã thật là `V2`, sửa đặc tả 23/09/2026) |

## 23. Phân hệ Creative Production Pipeline, Audio Studio & Gói chiến dịch (Creative Studio)

Kiến trúc: `docs/kien-truc/FLORAOS_CREATIVE_STUDIO_ARCHITECTURE.md`; dữ liệu vào/ra: `docs/dac-ta/FLORAOS_CREATIVE_STUDIO_IO_SPEC.md`. Đồng bộ lại theo mã 23/09/2026 (bản trước ghi năng lực `I4` — mã thật là `I1`).

| Method | Path | Năng lực | Ghi chú |
|---|---|---|---|
| POST | `/creative-production/plan` | `I1` | Lập kế hoạch cung truyện (Narrative Arc) từ Topic Brief |
| POST | `/creative-production/produce` | `I1` | Sinh nội dung đa kênh (`produceCreative`/`produceAuthentic`). `organizationId` lấy từ phiên, KHÔNG nhận từ body |
| POST | `/creative-production/package` | `I1` | Ước tính kế hoạch sản xuất & chi phí từ kết quả produce — tính thuần, KHÔNG lưu. Gói chiến dịch thật dùng `/creative-production/packages` |
| POST · GET | `/creative-production/packages` | `I1` · `G1` | Chặng 07 — tạo gói (DRAFT) neo vào Master Image đã duyệt; liệt kê theo `master_asset_id`. Thân nhận `video_job_ids[]` (mỗi khung một video, 24/09/2026) cùng `video_job_id` cũ (gộp, bỏ trùng, video chính đứng đầu); `PATCH /packages/:id` cũng nhận `video_job_ids` (thay trọn danh sách). View trả `video_job_ids[]`, `videos[]` |
| GET · PATCH | `/creative-production/packages/:id` | `G1` · `I1` | Đọc gói kèm URL ký của tài sản; sửa gói chưa duyệt (sửa là về DRAFT, xoá QA cũ) |
| POST | `/creative-production/packages/:id/qa` | `I1` | Chặng 08 — QA năm trục chạy phía máy chủ trên dữ liệu thật |
| POST | `/creative-production/packages/:id/approve` | `J5` | Chặng 09 — duyệt; ghi `audit_logs` cùng giao dịch; `QA_NEEDS_REVIEW` cần `acknowledge_warnings: true` |
| PUT | `/creative-production/packages/:id/launch` | `J5` | Chặng 10 — kế hoạch đăng + mã bài đã đăng (khớp `content_metrics.content_id`) |
| GET | `/creative-production/packages/:id/performance` | `R1` | Chặng 11–14 — đơn/doanh thu của sản phẩm kể từ ngày duyệt, hội thoại, số liệu kênh, mẫu thắng, đề xuất |
| POST | `/creative-production/scene-plans` | `I1` | 24/09/2026 — AI viết kịch bản bối cảnh cho MỘT chủ đề (feature `creative.scene_plan`, 1 credit, `AIC-18` qua cổng AI, chạy tại chỗ như `product.copy.generate`). `Idempotency-Key` BẮT BUỘC; trùng khoá trả kịch bản cũ không trừ credit. Thân: `mode`, `asset_id?`, `product_id?`, `platforms?` (v2: `tiktok\|instagram_reels\|facebook_reels\|youtube_shorts\|zalo_video\|youtube\|facebook_feed\|instagram_feed`, bỏ trống = TikTok + Reels 9:16, hoặc `"all"`), `outputs?` (`"all"` hoặc mảng `content\|audio\|image\|video`, bỏ trống = cả 4; video kéo theo image + audio — phạm vi sản xuất, IO Spec §5.0c), `product{name, category?, style?, colors[], components[], occasions[], target_audience?, price_range?}`, `topic{id, title, angle_category?, hook?, cta?, format?}`. Đáp ứng `{ job_id, status, error, plan, deduped, usage }`. AI hỏng → job `FAILED`, hoàn credit, 500 kèm lý do. **Thu gộp (25/09/2026, trả nợ #146):** có kênh đăng bài thì một lần thu `creative.scene_plan` + `content.generate` (1 + 2) trên job kịch bản, Content Engine chạy kèm không thu thêm; bước viết bài hỏng → hoàn 2, `usage` trả số đã trừ thật |
| GET | `/creative-production/scene-plans` | `I1` | Query `asset_id`, `topic_id`, `mode`. Tra kịch bản đã có theo khoá `scene-plan:<asset>:<topic>:<mode>` — KHÔNG tạo job, không trừ credit; chưa có thì `plan: null` |
| GET | `/creative-production/scene-plans/:id` | `I1` | Đọc kịch bản theo job id (chỉ feature `creative.scene_plan` của đúng tổ chức). Bản v1 đã lưu được nâng lên v2 khi đọc |
| PATCH | `/creative-production/scene-plans/:id` | `I1` | 24/09/2026 (v2) — sửa **kịch bản sản xuất tổng** tại chỗ, miễn phí, tăng `revision`: `platforms` (`"all"` hoặc mảng — đổi khung hình + khuôn video, bỏ bài của kênh không còn chọn), `outputs` (`"all"` hoặc mảng — đổi loại kết quả sản xuất), `text_overlay` bị bỏ qua (phụ đề = lời thoại), `scenes[{ scene_index, duration_seconds?, voice_script?, text_overlay?, transition?, motion_effect? }]`, `audio{ voice_id?, music_mood?, pacing?, quality_tier? }`, `video{ caption_style?, has_subtitle?, has_watermark?, end_card_text?, cover_scene_index? }`, `posts[{ channel, text, hashtags? }]` (từ cấm cứng → 400). Đổi lời thoại/nền tảng thì cân lại thời lượng các cảnh |
| GET · PUT | `/creative-production/content-drafts` | `I1` | 24/09/2026 — bài Khu vực B tự lưu theo `asset_id` + `topic_id` + `mode` (GET qua query, PUT qua body kèm `posts`, `topic_title?`); Chặng 07 đưa sẵn vào gói. Ảnh phải thuộc đúng tổ chức |
| POST | `/creative-production/scene-revisions` | `I1` | 24/09/2026 — Chặng 07 "Sửa cảnh": AI sửa MỘT cảnh của kịch bản bối cảnh theo `instruction` (feature `creative.scene_revise`, 1 credit, `AIC-18`, `Idempotency-Key` bắt buộc); có `scene_plan_id` thì đọc cảnh từ kho và ghi kịch bản đã sửa. Sinh lại ảnh là job `POST /media/variants` riêng |
| POST | `/creative-production/content-rewrites` | `I1` | 24/09/2026 — Chặng 07 "AI viết lại" MỘT bài theo `instruction` (feature `creative.content_rewrite`, 1 credit, `AIC-23`, `Idempotency-Key` bắt buộc); từ cấm ngành hoa/thương hiệu vi phạm cứng → loại lượt, hoàn credit |
| POST | `/creative-production/video-assembly` | `I1` | 24/09/2026 (Đợt 4) — dựng video từ bộ tài sản của kịch bản sản xuất tổng. Thân `{ scene_plan_id, plan? (chỉ kịch bản cơ bản rule:…), master_asset_id, audio_job_id?, title?, dry_run?, ratio? }` — `ratio` (`9:16\|4:5\|1:1\|16:9`, bỏ trống = khung chính): mỗi khung trong phạm vi một video; khung ngoài phạm vi → `problems: ratio_out_of_scope`; kịch bản nhiều khung thì chỉ dùng ảnh đúng khung. Đáp ứng `plan` thêm `ratios[]`. Ảnh = biến thể Khu vực D đúng `scene_plan_id` + `scene_index` trên Master (ưu tiên đúng khung + revision mới nhất); âm thanh = bản phối Khu vực C chỉ định hoặc bản COMPLETED mới nhất có `payload.scenePlanId` trùng; thời lượng cảnh = thời lượng thật của C. Thiếu ảnh/âm thanh, âm thanh của kịch bản khác hoặc chỉ có nhạc → `ready: false` + `problems[]` (không tạo job). Đủ → tạo `video_jobs` `DRAFT` gắn `scene_plan_id`, `audio_job_id`, `audio_storage_key`; render dùng nguyên bản phối C. Không trừ credit (render trừ `video.render`) |
| POST | `/audio/jobs` | `I1` | Tạo job `audio.generate`. `Idempotency-Key` BẮT BUỘC (từ 23/09/2026). Từ 24/09/2026 bốn `taskType` ra kết quả khác nhau thật: `VOICEOVER` chỉ giọng · `MUSIC_SELECT` chỉ nhạc (0 credit, không TTS) · `AUDIO_MIX` giọng + nhạc (sidechain ducking, -14 LUFS) · `VOICE_CLONE` giọng nhân bản READY (`voiceCloneId`, ElevenLabs, không lùi nhà cung cấp). `musicTrackId` = `trackId` hệ thống hoặc `org:<uuid>`. Credit trừ = bảng `audio-pricing-guard.ts` qua `enqueueJob({ costCredit })`. `providerKey` `google_cloud`/`local_fallback` → 422. 25/09/2026 (PO: nhà cung cấp trước): bỏ trống `providerKey` = thứ tự tiệm; `musicProvider?: elevenlabs_music\|library` — mặc định nhạc AI, bài thư viện là dự phòng, `library` = 0 credit phần nhạc |
| GET | `/audio/jobs/:id` | `I1` | Trạng thái + URL ký có hạn của bản phối và bản chỉ-giọng; `provider_used`/`provider_fallback` (nhà cung cấp thật đã đọc), `loudness_lufs`, thời lượng thật từng cảnh, `refunded`. Job `FAILED` tự hoàn credit ở lần đọc này (24/09/2026). 25/09/2026: `music_provider_used`/`music_fallback`/`music_fallback_reason`; nhạc lùi thư viện hoặc giọng lùi bên rẻ hơn → hoàn chênh |
| GET | `/audio/music-tracks` | `I1` | 24/09/2026 — thư viện nhạc: bài tiệm tải (`music_tracks`, mã `org:<uuid>`) + bài hệ thống (`music-catalog.ts`), kèm `license_type`, `license_source`, `license_verified`, `preview_url` |
| POST | `/audio/music-tracks` | `I1` | Multipart: `file` (MP3/WAV/M4A ≤ 20MB, nhận diện bằng byte đầu), `title`, `mood`, `license_type` (`owned\|royalty_free\|licensed\|creative_commons`), `license_source`, `license_note?`, `attest=true` (bắt buộc) |
| DELETE | `/audio/music-tracks/:id` | `I1` | Gỡ bài tiệm đã tải (đánh dấu `deleted_at`); bài tổ chức khác → 404 |
| GET | `/audio/music-tracks/system/:trackId` | `I1` | Phát tệp bài hệ thống để nghe thử |
| GET | `/audio/voice-clones` | `I1` | 24/09/2026 — giọng nhân bản của tổ chức (`voice_clones`); giọng `FAILED` tự hoàn credit ở lần đọc này |
| POST | `/audio/voice-clones` | `I1` | Multipart: `name`, `sample` (MP3/WAV/M4A 50KB–10MB, worker đòi ≥ 20 giây), `consent=true` (lưu nguyên văn câu cam kết). Tạo job `audio.voice_clone` (5 credit, giá tạm #64) → worker gửi ElevenLabs Instant Voice Clone. `Idempotency-Key` bắt buộc |
| GET | `/audio/voice-clones/:id` | `I1` | Trạng thái + URL ký nghe lại mẫu |
| DELETE | `/audio/voice-clones/:id` | `I1` | Gỡ giọng trên ElevenLabs rồi đánh dấu `DELETED` |
| GET · PUT | `/creative-production/providers` | `I1` · `U2` | 25/09/2026 (PO: nhà cung cấp trước, cục bộ chỉ là đường lùi) — danh mục nhà cung cấp theo loại `content` · `image_optimize` · `image_variant` · `video` · `voice` · `music` (`provider-catalog.ts`), thứ tự ưu tiên của tiệm, bên nào đã có khoá (`configured`), đường lùi cục bộ. PUT thân `{ kind, order[] }` ghi `organizations.settings.creative_providers[kind]` + `audit_logs` |
| POST | `/content-engine/generations` | `I1` | 25/09/2026 (P27) — chuỗi agent Strategist→Writer→Critic→Rewriter viết bài đa kênh, chạy tại chỗ (feature `content.generate`). `Idempotency-Key` BẮT BUỘC; trùng khoá trả bản ghi cũ, không trừ credit lần hai (lượt đầu còn chạy → 202 + `job_id`). Thân: `asset_id?`, `product_id?`, `analysis_run_id?`, `topic_id?`, `scene_plan_id?`, `channels`. Đáp ứng `{ job_id, generation_id, status, posts, overall_score, needs_review, deduped, usage }`. Ghi `content_generations` `DRAFT` |
| GET | `/content-engine/generations` | `I1` | Query `asset_id?`, `topic_id?`, `scene_plan_id?`, `mode?` — bản mới nhất khớp bộ lọc, KHÔNG tạo job, không trừ credit; chưa có thì `generation: null` |
| GET | `/content-engine/generations/:id` | `I1` | Đọc một lượt sinh (brief, strategy, posts, điểm rubric, phiên bản prompt); tổ chức khác → 404 |
| POST | `/content-engine/generations/:id/approve` | `J5` | Duyệt tách khỏi sinh: `posts?` (bài đã sửa) → `approved_posts`, `status = APPROVED`, ghi `audit_logs` cùng giao dịch |

⚠ Audio, video và Creative Production dùng chung `I1` (`media.optimize`) — sai ngữ nghĩa RBAC, chờ chủ sản phẩm quyết có thêm mã riêng hay không (đụng con số 143 mã). Xem `TECHNICAL_DEBT.md` nợ #121.

## 23b. Thẻ Chào mẫu hoa — Swipe Brochure (`greeting-card`)

Trang công khai ngoài `/api/v1` (06/10/2026): **`/s/<mã>`** — link bộ sưu tập mang tên người sao chép, trả thẻ xem trước (tiêu đề, ảnh ghép) cho Facebook/Zalo; trình duyệt của khách tự chuyển sang **`/s/<mã>/mo`**, nơi mỗi khách được mở một phiên riêng (`greeting_sessions.sale_id` = người sao chép, sự kiện `SHARE_OPEN { shareLinkId, channel }`), nhớ qua cookie `fl_s_<mã>` 30 ngày để tải lại không tạo phiên mới, rồi chuyển 302 sang `/b/<mã gửi>`; giới hạn 30 lần/10 phút/IP; link thu hồi hoặc bộ sưu tập đã ẩn → 404.

Đồng bộ theo mã 05/10/2026 (đợt debug + nâng cấp thương mại). Năng lực gom tại `src/modules/greeting-card/domain/greeting-card-capabilities.ts` — dùng lại mã sẵn có, không thêm mã mới. Endpoint `/public/*` không cần đăng nhập: tổ chức suy ra từ mã gửi / catalog / khoá webhook ở server, KHÔNG nhận từ thân yêu cầu; đều qua giới hạn tần suất dùng chung (Redis, `REDIS_URL`). Danh sách trả `{ data, next_cursor }`, `?limit=1–100&cursor=`.

| Method | Path | Năng lực | Ghi chú |
|---|---|---|---|
| GET · POST | `/greeting-card/catalogs` | `L1` · `R2` | Bộ sưu tập đang dùng (mặc định trang 100); `?status=active\|archived\|all`, `?created_by=<userId>`, `?days=<n>` (tạo trong n ngày). POST: `productIds` phải thuộc tổ chức (khác → 404); mã trùng → 409; ghi `audit_logs` `greeting_catalog.create` |
| GET · PATCH · DELETE | `/greeting-card/catalogs/:id` | `L1` · `R2` · `R2` | DELETE = ẩn (`is_active=false`); tổ chức khác → 404 · Ẩn (DELETE hoặc PATCH `isActive:false`) và khôi phục (PATCH `isActive:true`) chỉ cho người tạo, hoặc người có `L4` (Điều hành) với catalog của người khác — thiếu → 403; thay đổi và `audit_logs` (`greeting_catalog.delete` / `.restore`) ghi trong cùng transaction (07/10/2026) |
| POST · DELETE | `/greeting-card/catalogs/:id/products` | `R2` | Thân `{ productId }`; sản phẩm tổ chức khác → 404 |
| GET · POST | `/greeting-card/send-links` | `R1` · `R2` | POST sinh mã gửi ngẫu nhiên duy nhất toàn hệ thống (`T01-XXXXXXXX`), hạn dùng KHÔNG còn do client gửi — lấy theo cài đặt của tiệm `organizations.settings.brochure_link_lifetime_hours` (1–720 giờ, mặc định 24; Điều hành sửa ở Cài đặt Thẻ chào qua `PATCH /organizations/current`), tính từ lúc tạo; trả `expiresAt`. GET kèm `link_state` ACTIVE/EXPIRED/REVOKED |
| POST | `/greeting-card/send-links/:id/revoke` | `R2` | Thu hồi link chưa có đơn (idempotent); đã có đơn → 409 |
| GET · PUT | `/greeting-card/display-settings` | `L1` · `R2` | Trường thông tin hiển thị theo từng mẫu Thẻ chào (cấp cửa hàng, `organizations.settings.greetingCardDisplay`). PUT `{ templateId, fields[] }`; mã/tên/giá luôn hiện; khoá lạ bị bỏ; mẫu không tồn tại → 400. Gác quyền từ 06/10/2026 (trả nợ #170 phần Thẻ chào) |
| GET | `/greeting-card/stats` | `R1` | `?days=7\|30\|90` — phễu gửi → mở → chọn → đặt → thu tiền + doanh thu theo sale · `paid` = số đơn đã thu ĐỦ, `revenueVnd` = tiền thật đã thu (`paid_vnd`, đơn chưa huỷ) — trước 06/10 đơn mới cọc tính là đã thu và cộng cả tổng đơn. Sale "chỉ khách của mình" chỉ thấy dòng của mình |
| GET | `/greeting-card/catalogs/:id/collage` | `L1` | Tải ảnh catalog PNG 1200×630 (ghép tối đa 4 mẫu JPG/PNG + tên, khoảng giá, tên tiệm) để đăng lên kênh; catalog tiệm khác/đã ẩn → 404. Cùng ảnh này làm ảnh xem trước (`og:image`) của `/g/:id` và `/bst/:orgSlug/:code` |
| GET | `/greeting-card/catalogs/:id/hearts` | `L1` | "Mẫu được thả tim nhiều nhất": `{ catalogId, totalHearts, rows: [{ productId, code, name, imageUrl, hearts, privateHearts, publicHearts }] }` xếp giảm dần. Cộng tim từ link gửi riêng (`PRODUCT_LIKED`/`PRODUCT_UNLIKED` của các phiên thuộc bộ sưu tập) và link công khai (`LIKE`/`UNLIKE`); mỗi khách tối đa 1 tim/mẫu, thao tác cuối quyết định; mẫu đã gỡ khỏi bộ sưu tập không hiện. Tổ chức khác → 404 (07/10/2026) |
| GET | `/greeting-card/stats/channels` | `R1` | `?days=7\|30\|90` — phễu link bộ sưu tập theo kênh chia sẻ (`?kenh=` zalo/facebook/instagram/tiktok/website/khac; lạ/trống = trực tiếp): khách xem → xem mẫu → mở form → đặt đơn, đếm khách không trùng · Link chung không thuộc riêng sale nào: sale "chỉ khách của mình" nhận `rows: []` |
| GET | `/greeting-card/orders` | `R1` | `?status=` (order_status), `?payment=OUTSTANDING\|PAID` (OUTSTANDING gồm cả đơn chờ báo giá — tổng 0); tiền trả dạng số |
| POST | `/greeting-card/orders/:id/confirm-payment` | `R11` | `amountVnd?` (bỏ trống = khoản đang chờ theo chính sách cọc). Khoá lạc quan trên `paid_vnd`, ghi `order_payments` (DEPOSIT/BALANCE) + `order_events` + `audit_logs`; đã thu đủ → 409; vượt phần còn lại → 422 · Sale chế độ "chỉ khách của mình" chỉ thao tác đơn của mình (khác → 404, 06/10/2026). Phiên link chỉ `COMPLETED` khi đã thu ĐỦ (đơn mới cọc vẫn hiện QR phần còn lại) | · **PO 08/10/2026: chỉ Điều hành (`R11`, trần cứng) — thay quyết định 06/10 dùng `R9`**
| POST | `/greeting-card/orders/:id/quote` | `R11` | `{ totalVnd, reason? }` (lý do giá chốt ≤ 300 ký tự, lưu `pricing_rule_ref.quoteReason`, hiện cho Điều hành khi đối chiếu thanh toán) — báo giá trọn gói cho đơn đặt mẫu chưa niêm yết giá (tổng 0). Khoá lạc quan `total_vnd = 0`; đã có giá/đã huỷ → 409; số tiền sai → 422; tổ chức khác → 404; audit `greeting_card.order.quote` · Áp phạm vi xem như `confirm-payment`; báo giá xong gửi khách mốc `QUOTED` (ZNS/SMS) kèm số tiền phải trả | · Máy tự trừ ưu đãi "Giảm %" khách đã chọn lúc đặt trên giá nhập (`pricing_rule_ref.promotionDiscountVnd`, `quotedBeforePromotionVnd`) (08/10/2026)
| GET · PUT | `/greeting-card/sale-visibility` | `F2` | Quyền xem của sale (`organizations.settings.brochure_visibility = { mode, members: { userId: ALL\|OWN } }`). GET → `{ defaultMode, members[] }` (chỉ sale đang hoạt động có `R2` và không có `R4/R5/F2`); PUT `{ mode }` đổi mặc định, `{ userId, mode }` chọn riêng, `mode: null` bỏ chọn riêng; sale không thuộc tổ chức → 404. Thời gian chuẩn từng bước lưu ở `brochure_step_sla = { STEP_x: { enabled, minutes } }` qua `PATCH /organizations/current` |
| GET · POST | `/greeting-card/messages` | `R1` · gửi `R2` | Trao đổi nội bộ của một đơn/link. GET `?orderId=\|sessionId=` → `{ label, ownerSaleName, messages[] }`. POST `{ orderId\|sessionId, stepKey, to: { kind: ROLE, role } \| { kind: OWNER_SALE } \| { kind: USER, userId }, body ≤ 2000, replyToId? }` → 201; vai người gửi suy từ năng lực (F2 = Điều hành, R4/R5 = Điều phối, còn lại Sale), không nhận từ client; `replyToId` gửi thẳng về người đã nhắn; đơn ngoài phạm vi xem (tổ chức khác, sale "chỉ khách của mình") hoặc người nhận ngoài tổ chức → 404 |
| POST | `/greeting-card/messages/read` | `R1` | `{ messageIds[] ≤ 200 }` — đánh dấu đã đọc cho người đang đăng nhập; tin tổ chức khác bị bỏ qua |
| GET | `/greeting-card/messages/recipients` | `R1` | Lựa chọn "Gửi cho": 3 vai + thành viên đang hoạt động (trừ chính mình) |
| GET | `/greeting-card/inbox` | `R1` | Hộp việc của người đang đăng nhập: `{ role, actions[], threads[], updates[], counts }`. `actions` theo vai — kẹt quá thời gian chuẩn đúng phần mình (sale: chỉ đơn của mình); Điều hành thêm xác nhận tiền, báo giá, tiền vào chưa khớp; Điều phối thêm đơn chờ phân công; Điều hành thêm yêu cầu giảm giá chờ duyệt (`kind: DISCOUNT`, kèm `discount` để duyệt ngay). `threads` gom tin gửi cho mình theo đơn, có số chưa đọc. `updates` = đơn đổi bước trong 24 giờ |
| GET · POST | `/greeting-card/share-links` | `R1` · tạo `R2` | Link bộ sưu tập mang tên người bấm "Sao chép" (06/10/2026). POST `{ catalogId, channel? }` → 201 `{ code, path: "/s/<mã 10 ký tự>" }`, chủ link = người đang đăng nhập; bộ sưu tập tiệm khác/đã ẩn → 404. GET → link 30 ngày (sale "chỉ khách của mình" chỉ thấy link của mình) kèm `opens` (số khách mở) và `orders` |
| POST | `/greeting-card/send-links/:id/copied` | `R2` | `:id` = mã gửi của link riêng. Ghi mốc sao chép đầu tiên của link riêng (sự kiện `LINK_COPIED`, chép lại không đổi mốc) — giờ "khách chưa mở" tính từ mốc này; link chưa sao chép không bị báo kẹt. Link ngoài phạm vi xem → 404 |
| POST | `/greeting-card/orders/:id/discount-request` | `R2` | Sale xin giảm giá `{ percent? \| amountVnd?, reason }` → 201; gửi thẳng Điều hành (tin `kind = DISCOUNT_REQUEST`). Trần `organizations.settings.brochure_discount.max_percent` (mặc định 25%, 0 = tắt) tính trên giá đơn trước mọi lần giảm; vượt trần / đơn chưa có giá → 400; đơn huỷ hoặc đang có yêu cầu chờ → 409; đơn ngoài phạm vi xem → 404 |
| POST | `/greeting-card/discount-requests/:id/decision` | `F2` | `{ approve, percent? \| amountVnd?, note }` — duyệt đúng mức xin, duyệt mức khác (vẫn trong trần) hoặc từ chối (bắt buộc ghi chú). Nguyên tử: yêu cầu phải còn chờ (409 nếu đã xử lý), tổng đơn chưa đổi; duyệt thì `total_vnd`/`balance_vnd` cập nhật, `pricing_rule_ref.manualDiscount = { baseTotalVnd, vnd, percent?, reason, note, approvedBy, approvedAt }` (duyệt lần sau thay lần trước), không được thấp hơn số đã thu (409). Sale nhận tin kết quả (`DISCOUNT_DECISION`); audit `greeting_card.discount.approve\|reject` |
| POST | `/greeting-card/orders/:id/cancel` | `R6` | `{ reason }`; trả lại mã giảm giá; đơn đã giao/đã huỷ → 409; audit · Áp phạm vi xem; ngoài thao tác tay, bộ quét nền tự huỷ đơn quá hạn giữ khi tiệm bật `brochure_policy.auto_cancel_unpaid` (audit `system:hold-expiry`) |
| POST | `/greeting-card/orders/:id/refund` | `R10` | `{ amountVnd, reason }`; không vượt số đã thu (422); ghi REFUND + audit · Áp phạm vi xem |
| POST | `/greeting-card/orders/:id/assign-florist` | `R4` | Thứ tự xưởng + chính sách thu tiền (`brochure_policy`) chặn sai bước → 409 · Mọi tác vụ xưởng (phân công, ảnh thành phẩm, giao ship, ảnh người nhận) ghi `audit_logs` `greeting_card.order.<sự kiện>` |
| POST | `/greeting-card/orders/:id/product-photo` | `R3` | `{ assetIds }` (hoặc `{ assetId }` cũ): 1–5 ảnh JPG/PNG/WEBP + 0–2 video MP4/MOV/WEBM (≤ 50MB; ≤ 15 giây kiểm ở trình duyệt), một bản ghi QC cho cả bộ; asset phải thuộc tổ chức (khác → 404), sai giới hạn → 400 |
| POST | `/greeting-card/orders/:id/dispatch-shipping` | `R5` | Cần hoa READY (+ thu đủ nếu chính sách bật) |
| POST | `/greeting-card/orders/:id/recipient-photo` | `R5` | Cần đang giao; đóng đơn COMPLETED. Cùng luật ảnh/video như `product-photo`; trang theo dõi hiện thành mục "Ảnh người nhận" riêng |
| GET | `/greeting-card/tracking-pipeline` | `R1` | Bảng theo dõi (lọc theo quyền xem của sale); mỗi dòng có `stepStartedAt` (lúc vào bước hiện tại), `stuck` (`{ stepId, owner: SALE\|ADMIN\|COORDINATOR, overdueMinutes, message }` khi quá thời gian chuẩn `brochure_step_sla`, không thì `null`) , `saleId` và `channel` ("Link riêng của sale" hoặc kênh `?kenh=` của đơn đặt từ link bộ sưu tập, theo sự kiện ORDER). Đơn đã đặt chưa chuyển khoản hiện "Đã đặt đơn — chờ khách chuyển khoản". Link đã mở (`OPENED`) tính là bước "Chọn mẫu". Trao đổi nội bộ chuyển sang `/greeting-card/messages` (06/10/2026, bỏ ghi chú theo bước kiểu cũ) · Đọc MỌI đơn còn việc (chưa xong, chưa huỷ) + đơn hoàn tất 7 ngày + link chưa thu hồi/còn hạn có hoạt động 30 ngày; trần an toàn 2000 dòng có log cảnh báo (trước 06/10: chỉ 100 đơn + 50 link mới nhất) |
| GET | `/greeting-card/tracking` | `R1` | Lớp truy vấn dùng chung cho các view Theo dõi tiến độ. `view` = `list` (mặc định) · `kanban` · `calendar` (bắt buộc `from`,`to` ≤ 62 ngày) · `queue` (chỉ đơn quá hạn/sắp quá hạn) · `dashboard` (số liệu tổng hợp). Lọc chung: `q`, `category`, `steps` (CSV), `saleId`, `channel`, `type`, `sla` (`NONE\|ON_TRACK\|DUE_SOON\|OVERDUE\|ATTENTION`), `owner`, `deliveryFrom`, `deliveryTo`; sắp xếp `sort`/`dir`; phân trang `limit` (1–100, mặc định 20) + `cursor`. Phản hồi: `list`/`queue` → `{ view, data: [dòng], next_cursor, total }` (dạng danh sách phân trang chung); view khác → `{ data: <kết quả view> }`. Bước và trạng thái thời gian chuẩn suy ra ở máy chủ từ cùng tập `tracking-pipeline` (không lưu, không bản sao); phạm vi sale áp như `tracking-pipeline` (06/10/2026) |
| POST | `/greeting-card/cancellation-requests` | `R1` + vai nhắn nội bộ (Sale `R2` / Điều phối `R4`·`R5` / Điều hành `F2`) | `{ orderId, type: CANCEL_ONLY\|FULL_REFUND\|PARTIAL_REFUND, reason (3–1000), refundAmountVnd?, note? }` — đề xuất Hủy/Hoàn tiền, lưu là tin nhắn `CANCELLATION_REQUEST` gửi Điều hành + audit. Đơn khác tổ chức → 404 (08/10/2026) |
| GET | `/greeting-card/cancellation-requests` | `R6` hoặc `R10` | Đề xuất đang chờ duyệt (tối đa 200, cũ trước) (08/10/2026) |
| POST | `/greeting-card/cancellation-requests/:id/decision` | `R6` (hủy đơn) · `R10` (có hoàn tiền) · cả hai cho `FULL_REFUND` | `{ approve, note?, actualRefundVnd? }`. Số hoàn do máy chủ tính: `CANCEL_ONLY` = 0, `FULL_REFUND` = đúng số đã thu, `PARTIAL_REFUND` = `actualRefundVnd` hoặc số đề xuất, không vượt số đã thu. Một giao dịch: ghi sổ thu `REFUND`, cập nhật `paid_vnd`/`balance_vnd`, hủy đơn khi cần, khóa đề xuất (đã xử lý → 409), báo kết quả cho người đề xuất, audit (08/10/2026) |
| GET | `/greeting-card/tracking/timeline` | `R1` | Dòng thời gian của MỘT đơn (`orderId`) hoặc link (`sessionId`): `segments` (từng bước đã vào, thời gian ở bước so với thời gian chuẩn, `overMinutes`) dựng lại từ sự kiện theo đúng cách suy bước hiện có + sự kiện phân trang (`limit` ≤ 100, mặc định 50, `cursor`); phản hồi `{ orderId, sessionId, segments, data: [sự kiện], next_cursor, total }`. Ngoài phạm vi xem của sale → 404 (06/10/2026) |
| GET | `/greeting-card/integrations` | `R1` | Trạng thái webhook ngân hàng + kênh thông báo; KHÔNG trả khoá/bí mật |
| POST · DELETE | `/greeting-card/integrations/payment-webhook` | `F2` | POST sinh khoá SePay mới (trả MỘT lần, chỉ lưu băm SHA-256); DELETE tắt |
| PUT | `/greeting-card/integrations/notifications` | `F2` | `{ enabled, channel: ZNS\|ESMS, credentials?, templates? }` — credentials chỉ ghi, lưu AES-256-GCM |
| POST | `/greeting-card/integrations/notifications/test` | `F2` | `{ phone }` gửi một tin thử |
| GET | `/greeting-card/payment-events` | `R11` | Giao dịch ngân hàng nhận qua webhook, `?status=UNMATCHED…` · Sale "chỉ khách của mình" nhận danh sách rỗng |
| POST | `/greeting-card/payment-events/:id/handle` | `R11` | `{ note }` đánh dấu đã xử lý tay · Sale "chỉ khách của mình" → 404 |
| GET | `/public/brochure/:sendCode` | — | Trang khách: mẫu (giá theo Product Master, `null` = "Liên hệ" — vẫn đặt được, cửa hàng báo giá sau), size, khu vực giao, đơn + hướng dẫn chuyển khoản. Không lộ SĐT/id tổ chức. Link hết hạn/thu hồi/catalog ẩn (chưa có đơn) → 404 · CHỈ ĐỌC (06/10/2026): không còn ghi `OPEN` — máy quét xem trước Zalo/Facebook tải trang này. Mẫu tạm hết hàng theo `product_inventory` của chi nhánh sản phẩm vẫn trả ra với `available: false` (06/10/2026 — khách xem mẫu tương tự; chọn/đặt vẫn 409) · Chỉ chủ phiên (cookie `fl_b_<mã>`), thiếu → 404 |
| POST | `/public/brochure/:sendCode/claim` | — | Trình duyệt đầu tiên chạy trang nhận chủ phiên: đặt cookie HttpOnly `fl_b_<mã>` (HMAC `SESSION_SECRET`, 90 ngày), ghi `OWNER_CLAIMED` (khoá theo phiên) và báo đã mở như `/open`; `{ opened }`. Đã có chủ khác → 404. 30 lần/phút/IP. Từ 06/10/2026 mọi route `/public/brochure/:sendCode/*` khác chỉ nhận chủ phiên, thiếu cookie → 404 (xem `kien-truc/THE_CHAO_HANH_TRINH_KHACH.md`) |
| POST | `/public/brochure/:sendCode/open` | — | Trình duyệt của khách báo đã mở link (gọi sau khi trang chạy JavaScript) → `CREATED → OPENED` + sự kiện `OPEN` đúng một lần; `{ opened }`. 30 lần/phút/IP. Trang khách nay dùng `/claim` |
| POST | `/public/brochure/:sendCode/event` | — | Chủ phiên báo một bước hành trình `{ event, productId? }` — `event` ∈ `collection_opened, product_viewed, product_liked, product_unliked, product_skipped, product_revisited, contact_zalo_clicked, contact_call_clicked, order_started, checkout_started, checkout_abandoned`; lưu `greeting_journey_events` tên viết hoa; `productId` lạ bị bỏ. 240 lần/10 phút/IP |
| POST | `/public/brochure/:sendCode/select` | — | Chỉ nhận `productId`; ảnh chụp mẫu dựng ở server |
| POST | `/public/greeting-catalog/:id/event` | — | `{ type: VIEW\|DETAIL\|FORM_OPEN\|LIKE\|UNLIKE, channel?, visitorId, productId? }` → 202; mã khách ngẫu nhiên trên máy, băm ở server (không lưu IP); mỗi khách × bước 1 lần/ngày (trừ LIKE/UNLIKE: ghi mọi lần, thao tác cuối quyết định); LIKE/UNLIKE bắt buộc `productId` thuộc bộ sưu tập (khác → 404) và không tính vào phễu kênh (07/10/2026); catalog ẩn → 404. Bước `ORDER` chỉ ghi ở server khi `POST /public/greeting-catalog/:id/order` thành công (thân đơn mang `tracking?`); lỗi ghi thống kê không làm hỏng đơn |
| POST | `/public/brochure/:sendCode/quote` | — | Báo giá `{ variantId?, quantity?, shippingZoneId?, voucherCode?, customerPhone?, selectedPromotionId?, deliveryDate? }` → `{ quote, errors, fullSlots }`. Ưu đãi do máy chủ tra lại trong bộ sưu tập, "Giảm %" trừ trên tổng đơn (`quote.promotionDiscountVnd`); `voucherCode` bị bỏ qua khi tiệm tắt mã giảm giá (`brochure_shipping.voucher_enabled`); `fullSlots` = nhãn khung giờ đã đủ đơn của `deliveryDate` (08/10/2026) |
| POST | `/public/brochure/:sendCode/order` | — | Tạo đơn (idempotent theo phiên, kể cả hai lần gửi đồng thời — lần thua nhận lại đúng đơn đã tạo); server báo giá lại, lựa chọn sai → 400 theo trường. Mẫu chưa niêm yết giá: đơn tổng 0, `quote.awaitingQuote = true`, không QR, không nhận mã giảm giá · Ô bẫy ẩn `website` có giá trị → 400; tối đa 5 đơn/giờ/SĐT người đặt → 429; mẫu hết hàng → 409 · **Khung giờ (08/10/2026):** `deliveryTimeSlot` là một khung 2 tiếng tiệm đang bật (`08:00 - 10:00` … `20:00 - 22:00`, cài ở `brochure_shipping.delivery_slots`) hoặc `Giờ cụ thể: HH:MM` (07:00–22:00, chỉ khi `allow_custom_time` ≠ false); khung tắt/không kịp chuẩn bị/nhãn lạ → 400 · **Ưu đãi & thỏa thuận (08/10/2026):** `selectedPromotionId?` — tối đa 01 ưu đãi, phải thuộc ưu đãi bộ sưu tập đang áp dụng (tiệm không cho chọn → máy chủ luôn lấy ưu đãi đầu tiên); bộ sưu tập có thỏa thuận thì bắt buộc `confirmedTerms: true`, thiếu → 400. Bản chụp ưu đãi + các thỏa thuận đã đồng ý lưu ở `orders.pricing_rule_ref.policies` | · 08/10/2026: tổng tiền đã trừ ưu đãi khách chọn và miễn phí giao khi tiệm bật `free_shipping_all`; khung giờ đủ đơn (`brochure_shipping.slot_capacity`, mặc định 100/khung, kiểm trong giao dịch có khoá) → 400 `deliveryTimeSlot`
| POST | `/public/brochure/:sendCode/payment-notify` | — | Khách báo đã chuyển khoản (cần có đơn) |
| POST | `/public/brochure/:sendCode/reorder` | — | Khách đặt thêm đơn từ link đã có đơn: tạo phiên mới (mã link + mã đơn mới) cùng sale, khách, bộ sưu tập; ghi sự kiện `REORDER`; trả `{ sendCode }` mới và cookie chủ phiên của phiên mới. Link chưa có đơn → 409. 10 lần/10 phút/IP |
| GET | `/public/brochure/tracking/:code` | — | Theo dõi theo mã đơn — chỉ đơn nguồn BROCHURE · Mặc định bản RÚT GỌN (PO 06/10/2026): tên người nhận viết tắt, chỉ phường + tỉnh, không lời nhắn thiệp, không ảnh người nhận, `order.verified = false`. `?link=<mã link của đơn>` kèm cookie chủ phiên của link đó trả đầy đủ (không có cookie → bản rút gọn). Không bao giờ trả SĐT |
| POST | `/public/brochure/tracking/:code` | — | `{ phoneLast4 }` — đúng 4 số cuối SĐT người đặt → bản đầy đủ; sai → 404 (không nói sai gì). 5 lần/15 phút/IP/mã đơn, và tối đa 10 lần/24 giờ/mã đơn tính chung mọi IP (07/10/2026 — chặn dò bằng cách đổi IP) |
| POST | `/public/brochure/tracking/:code/approve-photo` | — | `?link=<mã link của đơn>` bắt buộc, kèm cookie chủ phiên của đúng link đó; thiếu/sai → 404. Chỉ khi đã có ảnh thành phẩm (không → 409). Ghi QC `CUSTOMER_PHOTO_APPROVED` + sự kiện sản xuất, bấm lại không ghi trùng. 10 lần/phút/IP (08/10/2026) |
| POST | `/public/greeting-catalog/:id/quote` | — | Như trên cho link bộ sưu tập công khai, kèm `productId` |
| POST | `/public/greeting-catalog/:id/order` | — | Đặt hoa từ link bộ sưu tập công khai · Cùng SĐT + mẫu + người nhận + ngày giao trong 10 phút → trả lại đơn vừa tạo (không tạo trùng); cùng ô bẫy, trần SĐT, chặn hết hàng như link riêng | · Cùng luật ưu đãi, miễn phí giao, trần khung giờ (kiểm trước khi tạo phiên) (08/10/2026)
| GET | `/public/drive-thumbnail` | — | `?folder_id=` (Drive id `[A-Za-z0-9_-]{10,128}`, sai → 400) → `{ folder_id, file_id, thumbnail_url }` của file đầu tiên trong folder Drive công khai; dùng ở màn nhập hàng loạt sản phẩm. 120 lần/phút/IP; cache trong tiến trình có trần (500 mục, 6 giờ); gọi Drive timeout 5 giây (07/10/2026) |
| GET | `/public/drive-thumb-proxy` | — | `?folder_id=` như trên → trả thẳng ảnh thumbnail (trang khách Thẻ chào). Chỉ nhận `content-type: image/*`, tối đa 5 MB, `nosniff`; không có ảnh → 404. 120 lần/phút/IP (07/10/2026) |
| POST | `/public/payments/sepay` | — | Webhook SePay, `Authorization: Apikey <khoá>`; idempotent theo mã giao dịch; tự ghi thu theo mã đơn trong nội dung chuyển khoản |

## 24. Chưa có ở bản này

Endpoint mang khoá nhà cung cấp riêng của tổ chức. Quyết định D2 chốt nền tảng giữ khoá và tính credit, nên nhóm endpoint đó không tồn tại. Nếu D2 đổi về sau, nhóm này thêm vào dưới `/organizations/current/providers` mà không đụng tới endpoint nào đang có.

**Đã đánh dấu CHƯA XÂY trong chính các mục trên** (soát 18/09): mục 9 hàng đợi duyệt gộp · mục 16 toàn bộ M11 · bốn đường Integration ở mục 11 · `GET /crm/customers/export`, `/reminder-campaigns`, `/vouchers` ở mục 14 · `POST /orders/:id/delivery` ở mục 15 · `handoff` và `conversations/settings` ở mục 17 · `PATCH /catalog-links/:slug` và `/catalog-links/:slug/qr` ở mục 13 · `GET /ai-evaluations/…` ở mục 18. Gộp lại ở **RS-7** để anh Tony quyết cái nào còn trong kế hoạch, cái nào bỏ.

## 25. Bổ sung theo mã thật (05/10/2026)

> Các route dưới đây đã có trong mã nhưng chưa vào đặc tả (`npm run check:docs` bắt được). Ghi **đúng hiện trạng mã**, kể cả chỗ chưa đạt bốn luật ở mục 1 — **"chưa gác"** nghĩa là route chỉ gọi `requireTenantContext`, không kiểm mã năng lực ở route lẫn use-case: thành viên nào của tổ chức cũng gọi được. Chọn mã năng lực là quyết định của chủ sản phẩm — xem `TECHNICAL_DEBT.md` nợ #170, #171.

### 25.1 Content Engine — sinh nhanh tại chỗ

| Method | Path | Năng lực | Ghi chú |
|---|---|---|---|
| POST | `/content-engine/catalog-generate` | **chưa gác** (nợ #170) | Writer→Critic qua `callCapability` (`content_generation`, `content_qa`) sinh badge/mô tả/CTA cho catalog. Chạy tại chỗ, **không trừ credit, không ghi `usage`, không có `Idempotency-Key`** |
| POST | `/content-engine/landing-generate` | **chưa gác** (nợ #170) | Như trên cho landing page (hero/story/perks/faq/lead), lấy ngữ cảnh từ hồ sơ kinh doanh + thương hiệu |
| POST | `/content-engine/rewrite` | **chưa gác** (nợ #170) | Viết lại MỘT câu ≤ 500 ký tự theo `field_type`/`style`, trả 3 gợi ý; parse lỗi thì trả gợi ý dựng sẵn |

### 25.2–25.3 Thẻ chào (đã gộp)

Bảng hiện trạng 05/10/2026 của Thẻ chào (phía tiệm và phía khách) đã lỗi thời — mọi route đều đã gác mã năng lực và đã sửa các điểm nợ #171. Đặc tả đúng theo mã nằm ở **mục 23b** (gộp 06/10/2026).

### 25.3b Báo cáo vi phạm CSP (công khai)

| Method | Path | Năng lực | Ghi chú |
|---|---|---|---|
| POST | `/public/csp-report` | — *(công khai)* | Trình duyệt gửi báo cáo khi trang tải nguồn ngoài `Content-Security-Policy-Report-Only` (`next.config.ts`). Chỉ ghi log `csp.violation` (directive, nguồn bị vi phạm, đường dẫn trang không query); trả 204. 60 lần/phút/IP. Không chặn gì — nợ #175 |

### 25.4 Thùng rác kho dữ liệu (30 ngày)

| Method | Path | Năng lực | Ghi chú |
|---|---|---|---|
| GET · POST | `/storage/trash` | `G3` \| `L4` \| `A3` \| `B6` *(kiểm ở use-case)* | Liệt kê / chuyển vào thùng rác `{ id, type: RAW_ASSET \| APPROVED_ANALYSIS \| PRODUCT }`. Chỉ vai Điều hành (một trong bốn mã) |
| POST | `/storage/trash/:id/restore` | như trên | Khôi phục `{ type }` |
| DELETE | `/storage/trash/:id` | như trên | Xoá vĩnh viễn, `?type=` bắt buộc |

