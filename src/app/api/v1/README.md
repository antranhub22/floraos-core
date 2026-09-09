# API

Mọi route nằm dưới `/api/v1/`. Có phiên bản ngay từ đầu.

Luật áp cho mọi endpoint:

- `organization_id` giải từ phiên đăng nhập phía máy chủ. Không bao giờ nhận từ body hay query.
- Mọi truy vấn đọc dữ liệu lọc theo tổ chức hiện tại. Không route nào trả dữ liệu xuyên tổ chức.
- Quyền kiểm theo mã năng lực, không hard-code theo vai giao diện.
- Endpoint duyệt tách khỏi endpoint sinh kết quả: `/x/[id]/approve`.
- Thao tác AI dài trả về `job_id`, không chặn HTTP.

Chưa có route nào. Route thật chỉ được tạo sau khi P1 và P2 đạt nghiệm thu.
