# Ngữ cảnh tenant

Ba thứ phải có trước khi bất kỳ module nào tạo bảng thật, và cả ba đã có:

1. **`organization_id` giải từ phiên đăng nhập phía máy chủ.** Nguồn duy nhất là
   `sessions.organization_id`; xem `use-cases/resolve-session.ts` của module tổ
   chức. Không đường nào nhận giá trị này từ body, query hay header của client.
   Ngoại lệ duy nhất là `POST /api/v1/session/organization`, và ở đó giá trị
   được đối chiếu với `memberships` trước khi ghi.
2. **Bộ gác truy vấn ở tầng repository**, không ở route. `scopedWhere` và
   `scopedData` trong `tenant-context.ts` chèn khoá tổ chức, và ném khi lời gọi
   tự khai `organization_id`. Route quên kiểm là chuyện thường; repository quên
   kiểm là lỗ hổng im lặng.
3. **Bộ test cách ly chạy trong CI.** Xem `tests/tenant/`.

`infra/prisma.ts` giữ thể hiện `PrismaClient` duy nhất của cả hệ thống. Chỉ tệp
nằm trong một thư mục `infra/` được import nó — luật này có test khoá, không
chỉ có review.
