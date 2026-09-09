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
