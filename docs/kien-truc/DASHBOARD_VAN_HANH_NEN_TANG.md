# Kế hoạch — Console Vận hành Nền tảng (Platform Operator Console)

**Phạm vi soát:** `floraos-core` — mô hình quyền, hạ tầng phiên, `organizations`/`audit_logs`/`usage`/`generation_jobs`, các script vận hành tay hiện có.
**Ngày soát:** 2026-09-11
**Đối chiếu mã nguồn:** `prisma/schema.prisma`, `src/modules/organization/*`, `src/modules/audit/*`, `package.json` (scripts), `src/app/(app)/bo-may` (khuôn mẫu màn quản trị theo năng lực).

---

## 1. Bối cảnh

`floraos-core` hiện có đúng một loại giao diện quản trị: **Dashboard Điều hành**, phạm vi một tổ chức, gác bằng vai `dieu_hanh` và năng lực đọc trong dải A–L. Không có giao diện, vai, hay đường API nào nhìn được xuyên nhiều tổ chức.

Bằng chứng trực tiếp từ mã nguồn:

- `memberships.organization_id` bắt buộc — một người dùng luôn thuộc về đúng một (hoặc nhiều, qua nhiều dòng) tổ chức cụ thể. Không có khái niệm "thành viên nền tảng".
- `roles.organization_id` cho phép `null`, nhưng bốn vai đang mang giá trị đó (`dieu_hanh`, `sale`, `dieu_phoi`, `experience_user`) là **vai mẫu dùng chung cho mọi tổ chức**, không phải vai xuyên tổ chức — mỗi tổ chức vẫn gán riêng qua `memberships`.
- `sessions.organization_id` đã cho phép `null` (`resolveSession` trả `ctx: null` khi chưa gắn tổ chức) — nhưng nhánh này hiện chỉ nghĩa là "chưa chọn tổ chức", không phải "phiên vận hành nền tảng".
- `audit_logs.organization_id` bắt buộc (`NOT NULL`, khoá ngoại) — không ghi được một hành động không thuộc tổ chức nào.
- `organizations.credit_balance`/`type` đã có cột, nhưng `OrganizationRepository.topUpCredit` chỉ gọi được từ `scripts/nap-credit.ts` chạy tay. `request-organization-upgrade.ts` ghi yêu cầu nâng cấp vào `audit_logs` (`organization.upgrade_requested`) rồi dừng — đúng như comment trong mã: *"chưa có khái niệm quản trị nền tảng qua API"*.
- Các việc vận hành khác đều là script CLI chạy tay: `nap-credit`, `hoan-credit`, `them-thanh-vien`, `dat-lai-mat-khau`, `scan-stuck-jobs`.

Console này không phải tính năng mới ngoài kiến trúc — nó là lớp giao diện cho những gì mã nguồn đã đỡ sẵn nhưng chưa có API/UI, cộng một khoảng trống thật trong mô hình quyền (mục 3).

---

## 2. Phạm vi

**Trong phạm vi**

| Khối | Việc |
|---|---|
| Tổ chức | Xem danh sách/chi tiết mọi tổ chức, tạo tổ chức mới |
| Yêu cầu nâng cấp | Xử lý hàng đợi `organization.upgrade_requested` |
| Credit | Nạp/hoàn credit cho một tổ chức, xem lịch sử |
| Usage | Usage/chi phí tổng hợp theo tổ chức, theo `feature`, toàn hệ thống |
| Sức khỏe hệ thống | Đếm job theo `status`, job treo, tình trạng worker, tình trạng kho tệp |
| Nhật ký | Audit log xuyên tổ chức |
| Token tích hợp | Tạo/thu hồi token cho `LocalBudd`/`SocialFlow` |

**Ngoài phạm vi**

- Thanh toán/xuất hoá đơn thật — PRD mục 4 đã loại khỏi giai đoạn này; console chỉ đọc/ghi `credit_balance`, không thay hệ thống thanh toán khi có.
- Khởi động lại tiến trình worker, thao tác hạ tầng (deploy, restart process) — nằm ngoài quyền của một webapp, thuộc phạm vi máy chủ.
- Giao diện riêng cho Chain (bộ chọn chi nhánh, view tổng hợp nhiều chi nhánh) — đây là khoảng trống khác, thuộc Dashboard Điều hành của tổ chức CHAIN, không thuộc console vận hành nền tảng.

---

## 3. Khoảng trống trong mô hình quyền

Mô hình `(vai, mã năng lực, phạm vi)` của PRD mục 7.2 định nghĩa phạm vi ∈ {`organization`, `branch`} — không có phạm vi nào cho một vai không thuộc tổ chức nào cả. Bốn thay đổi tối thiểu để đóng khoảng trống, không đổi hành vi hiện có:

1. **`capability_scope` thêm giá trị `PLATFORM`** — `ORGANIZATION` · `BRANCH` · `PLATFORM`. Middleware kiểm quyền đọc rõ `scope = PLATFORM` tại route `/api/v1/platform/*`, không suy từ `role.key`.
2. **Vai hệ thống thứ năm** — `roles` thêm một dòng `organization_id = null`, `key = "van_hanh_nen_tang"`, `is_system = true`. Năng lực của vai này toàn bộ mang `scope = PLATFORM`.
3. **Bảng gán vai mới, độc lập với `memberships`** — `platform_operators (user_id, role_id, granted_by, created_at)`. Không thêm cột nullable vào `memberships`: bảng đó là dữ liệu tenant, Luật 1 của PRD áp cho nó đúng như đang có. Người vận hành nền tảng vẫn có thể đồng thời là thành viên một tổ chức (hai bảng độc lập, không loại trừ nhau).
4. **Nhánh phiên không tổ chức trong `resolveSession` rẽ thêm một lối** — hôm nay `session.organization_id = null` luôn trả `ctx: null` ("chưa chọn tổ chức"). Thêm bước tra `platform_operators` theo `user_id`: có dòng → trả `PlatformContext` (không phải `TenantContext`) mang `role`, danh sách năng lực `PLATFORM`; không có dòng → giữ nguyên hành vi cũ. Người dùng thường không bị ảnh hưởng — bảng mới rỗng với họ.

Nhật ký hành động chia hai loại, vì `audit_logs.organization_id` bắt buộc:

- Hành động tác động **một tổ chức cụ thể** (nạp credit, duyệt nâng cấp) → ghi vào `audit_logs` hiện có, `organization_id` của tổ chức đó, `user_id` của người vận hành. Không cần bảng mới.
- Hành động **không thuộc tổ chức nào** (xem sức khỏe hệ thống, tạo token tích hợp trước khi gắn tổ chức) → bảng mới `platform_audit_logs (user_id, action, entity_type, entity_id, before, after, created_at)`, không có cột `organization_id` — tự thân cấu trúc nói rõ đây không phải dữ liệu tenant, không mượn `audit_logs` rồi để trống một cột bắt buộc.

Cách ly cần một bộ test song song với bộ cách ly tenant đang chạy trong CI: vai thường gọi `/api/v1/platform/*` phải bị từ chối; vai vận hành nền tảng gọi route tenant thường (`/api/v1/vision/*`, `/api/v1/products`…) vẫn bị chặn như một người không có `membership` — có vai nền tảng không tự nhiên có quyền tenant.

---

## 4. Module

| Mã | Module | Nguồn dữ liệu / logic đã có | Việc cần xây | Năng lực gác |
|---|---|---|---|---|
| N1 | Danh sách & chi tiết tổ chức | `organizations`, `memberships`, `branches` — đã có bảng, chưa có API đọc xuyên tổ chức | `GET /api/v1/platform/organizations`, `GET .../:id` | N1 |
| N2 | Yêu cầu nâng cấp | `audit_logs` đã ghi `organization.upgrade_requested`; chưa có API xử lý | `GET .../upgrade-requests`, `POST .../:id/approve` (đổi `organizations.type`, ghi `organization.upgraded`), `POST .../:id/reject` | N2 |
| N3 | Nạp/hoàn credit | `OrganizationRepository.topUpCredit` đã có, chỉ gọi qua `scripts/nap-credit.ts` | Bọc use-case có sẵn bằng API + form UI, giữ nguyên việc ghi `audit_logs` | N3 |
| N4 | Usage & chi phí tổng hợp | `usage` đã có `cost_credit`/`cost_usd`/`feature` | API `GROUP BY organization_id, feature` theo khoảng thời gian | N4 |
| N5 | Sức khỏe hệ thống | `generation_jobs.status`, logic `scripts/scan-stuck-jobs.ts` | API đếm job theo `status`, danh sách job treo, heartbeat worker, tình trạng kho tệp (S3/R2) | N5 |
| N6 | Nhật ký toàn hệ thống | `audit_logs` đã có (đọc theo một tổ chức qua `G9`) + `platform_audit_logs` mới | API bỏ lọc `organization_id`, hợp hai nguồn, gác bằng `N6` | N6 |
| N7 | Tạo tổ chức mới | `scripts/them-thanh-vien.ts`, logic seed workspace/membership điều hành đầu tiên đã có | API gói một luồng: tạo `organizations` + `workspaces` + thành viên điều hành đầu tiên | N7 |
| N8 | Token tích hợp | `POST /integration-tokens` đã có (P7, dùng cho `LocalBudd`/`SocialFlow`) | UI danh sách theo tổ chức + thu hồi | N8 |
| N9 | Sổ đăng ký mô hình | Chưa có — `registry.py` của worker Vision là sổ trong mã, không phải bảng | `ai_models` + UI bật tắt mô hình, bốn ô giấy phép bắt buộc điền (đặc tả 10 mục 5) | N9 |
| N10 | Sổ đăng ký năng lực và ngưỡng | Chưa có | `ai_capabilities` + UI đặt ngưỡng chấp nhận theo năng lực | N10 |
| N11 | Chi phí và chất lượng theo mô hình | Chưa có — `usage` theo `feature`, không theo mô hình | Báo cáo `ai_requests` tổng hợp theo mô hình: chi phí, độ trễ, điểm, tỷ lệ phải leo thác | N11 |

Mười một mã năng lực trên dùng dải **N**, tách khỏi mã module `M01`–`M11` để không trùng ký hiệu.

Ba mã cuối (`N9`–`N11`) là phần nền AI thuộc cấp nền tảng: một tổ chức đặt được chính sách AI của mình bằng `U2`, nhưng không thêm được mô hình vào hệ thống — ô giấy phép, ô lãnh thổ và ô phạm vi sử dụng cho phép của một mô hình không phải quyết định của một cửa hàng hoa. Chúng vào cùng đợt AI-1.

---

## 5. Vị trí trong hệ thống

- Route mới `/van-hanh`, cùng shell `floraos-core`, cùng khuôn mẫu route năng lực-gác hiện có (`/gia`, `/tai-anh`, `/bo-may`): đọc quyền qua `useSession().can()`, ẩn nút ghi khi thiếu năng lực.
- Không đi qua nhánh `workspace.kind` (Experience/Production) của `resolve-app-session.ts` — `/van-hanh` render từ `PlatformContext`, một nhánh định tuyến riêng, không đổi hành vi Dashboard Điều hành/Experience Grid hiện tại.
- Trang chủ `/van-hanh`: danh sách tổ chức (N1) cộng ba số đếm nổi — job đang treo (N5), yêu cầu nâng cấp đang chờ (N2), tổ chức mới trong 7 ngày (N1) — cùng khuôn thẻ số đếm Dashboard Điều hành đang dùng cho "Hàng chờ duyệt".

---

## 6. Lộ trình

Không nằm trong 12 pha gốc của PRD — bốn phụ thuộc chính (RBAC P2, Asset+Job+Usage P3) đã nghiệm thu, nên chạy song song với P9–P12, không chặn và không bị chặn bởi các pha đó.

| Giai đoạn | Nội dung | Rủi ro ghi | Phụ thuộc |
|---|---|---|---|
| G1 — Chỉ đọc | N1, N4, N5, N6 | Không có route ghi ngoài phạm vi đọc | `capability_scope = PLATFORM`, vai + bảng `platform_operators`, bảng `platform_audit_logs` |
| G2 — Hành động một tổ chức | N2, N3 | Ghi vào `organizations.type`/`credit_balance` — bọc use-case đã có, không đổi luật nghiệp vụ | G1 |
| G3 — Vận hành sâu | N7, N8 | Tạo tổ chức/token mới — mặt tác động rộng nhất | G1, G2 |

---

## 7. Rủi ro

| Rủi ro | Mức | Cách chặn |
|---|---|---|
| Rò dữ liệu cross-tenant do tái dùng thẳng repository tổ chức rồi bỏ lọc `organization_id` bằng tay | Critical | Lớp truy vấn riêng cho console (không đi qua nhánh "bỏ lọc" của repository tenant); mọi route `/api/v1/platform/*` qua một middleware duy nhất kiểm `scope = PLATFORM` |
| Vai vận hành nền tảng vô tình có luôn quyền tenant vì dùng chung bảng `roles` | High | Guard đọc `scope` trên `role_capabilities`, không suy quyền từ `role.key`; bộ test cách ly riêng cho route platform (mục 3) |
| `audit_logs.organization_id` bắt buộc — hành động không thuộc tổ chức nào không ghi được | Medium | Bảng `platform_audit_logs` riêng, không mượn `audit_logs` |
| N4 bị hiểu là hệ thống thanh toán thật | Medium | Giao diện ghi rõ đây là usage/credit, không phải hoá đơn — nhất quán với giới hạn PRD mục 4 |

---

## 8. Cần chốt

| # | Nội dung | Chặn |
|---|---|---|
| D-N1 | `capability_scope` thêm `PLATFORM` — `ALTER TYPE` trên enum Postgres đang dùng, cần xác nhận không có `migration` nào khác đang chạm cùng enum cùng lúc | G1 |
| D-N2 | Gán vai vận hành nền tảng lần đầu qua script chạy tay (`scripts/gan-van-hanh-nen-tang.ts`, giống mô hình `nap-credit`) — không có UI tự gán trước khi có người vận hành đầu tiên | G1 |
| D-N3 | `platform_audit_logs` độc lập, hay đổi `audit_logs.organization_id` thành nullable — bản này chọn tách bảng để không đổi ràng buộc mọi query lọc theo tổ chức đang có | G1 |
| D-N4 | N2 (duyệt nâng cấp) có kèm hành vi tính phí ngay hay vẫn tách khỏi billing thật (PRD mục 4) | G2 |
| D-N5 | N5 có cần hành động "khởi động lại worker" từ UI, hay chỉ đọc + cảnh báo — khởi động lại tiến trình nằm ngoài quyền của webapp theo mục 2 | G3 |

---

## Phụ lục — cột dự kiến cho bản Excel

| Cột | Nguồn trong kế hoạch |
|---|---|
| Mã module | Mục 4 |
| Tên module | Mục 4 |
| Nguồn dữ liệu/logic đã có | Mục 4 |
| Việc cần xây | Mục 4 |
| Năng lực gác | Mục 4 |
| Giai đoạn (G1/G2/G3) | Mục 6 |
| Rủi ro liên quan | Mục 7 |
| Quyết định chặn (nếu có) | Mục 8 |
| Trạng thái | — |

Giá trị đưa lên Master Index (nếu dự án đang dùng): dải mã năng lực mới **N1–N8** · ba giai đoạn G1/G2/G3 · năm bảng/cột schema mới (`platform_operators`, `platform_audit_logs`, `capability_scope.PLATFORM`, vai `van_hanh_nen_tang`, route `/van-hanh`).
