# Adapter của module sản phẩm

Trống ở P5. Kết quả phân tích ảnh không tới từ một cổng bên ngoài gọi trực
tiếp ở tầng này — worker Python (`workers/vision/`) ghi `product_analyses`
thẳng vào Postgres qua chính lược đồ Prisma sinh sẵn (D6-1: TS và Python chỉ
nói chuyện qua bảng `generation_jobs`, không qua HTTP), nên module này không
cần một adapter ra ngoài cho M01.

Ứng viên đầu tiên ở đây khi tới P7 (Integration Layer): `GET
/integration/products/:id/master-image` cho `LocalBudd`/`SocialFlow` đọc
Product Master qua API thay vì đọc thẳng bảng.
