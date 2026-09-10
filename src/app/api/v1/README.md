# API

Mọi route nằm dưới `/api/v1/`. Có phiên bản ngay từ đầu.

Luật áp cho mọi endpoint:

- `organization_id` giải từ phiên đăng nhập phía máy chủ. Không bao giờ nhận từ body hay query.
- Mọi truy vấn đọc dữ liệu lọc theo tổ chức hiện tại. Không route nào trả dữ liệu xuyên tổ chức.
- Quyền kiểm theo mã năng lực, không hard-code theo vai giao diện.
- Endpoint duyệt tách khỏi endpoint sinh kết quả: `/x/[id]/approve`.
- Thao tác AI dài trả về `job_id`, không chặn HTTP.

## Route hiện có — P1

| Method | Path | Ghi chú |
|---|---|---|
| POST | `/auth/signup` | Tạo người dùng và tổ chức trải nghiệm của họ |
| POST | `/auth/login` | |
| POST | `/auth/logout` | |
| GET | `/auth/me` | Người dùng, tổ chức hiện tại, danh sách năng lực đã tính sẵn |
| GET | `/organizations` | Các tổ chức người gọi là thành viên |
| POST | `/session/organization` | Đổi tổ chức đang hoạt động — chỗ duy nhất client nêu tên một tổ chức |

Route gác bằng mã năng lực thuộc P2, cùng pha với bảng 76 mã gác chúng. Route
của module thuộc pha sở hữu module đó.

## Route máy gọi máy — P7 (đặc tả 06 mục 11, đặc tả 08)

Xác thực bằng `Authorization: Bearer <token cấp theo tổ chức>`, không phải
cookie phiên — xem `src/modules/integration/`. Bốn luật ở đầu tệp này vẫn áp
dụng nguyên vẹn: `organization_id` giải từ token đã ký, không bao giờ từ
body/query.

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/integration/products` | Chỉ sản phẩm `ACTIVE`, bỏ qua `status` client gửi |
| GET | `/integration/products/:id/master-image` | Chỉ Master Image `approval_state = APPROVED` — luôn 404 tới khi P9 xong (nợ #30) |
| GET | `/integration/business-profile` | Chỉ token `LOCALBUDD` — `SocialFlow` nhận `CAPABILITY_DENIED` |
| GET | `/integration/brand-profile` | Cả hai loại token |
| POST | `/integration/jobs` | Tái dùng thẳng `enqueueJob` (P3) — cùng đường hạn mức/credit |
| POST | `/integration/usage` | Ghi mức dùng phát sinh ở engine ngoài, `cost_credit` luôn 0 |
| POST | `/integration/capabilities/check` | Hỏi một người có năng lực gì — rỗng hết nếu người đó không thuộc tổ chức của token |

Quản trị token (cookie phiên người dùng, gác `F9`):

| Method | Path |
|---|---|
| GET · POST | `/integration-tokens` |
| DELETE | `/integration-tokens/:id` |
| POST | `/integration-tokens/:id/rotate` |
