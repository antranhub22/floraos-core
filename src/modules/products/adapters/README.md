# Adapter của module sản phẩm

Trống ở P5. Kết quả phân tích ảnh không tới từ một cổng bên ngoài gọi trực
tiếp ở tầng này — worker Python (`workers/vision/`) ghi `product_analyses`
thẳng vào Postgres qua chính lược đồ Prisma sinh sẵn (D6-1: TS và Python chỉ
nói chuyện qua bảng `generation_jobs`, không qua HTTP), nên module này không
cần một adapter ra ngoài cho M01.

P7 (Integration Layer) đã xây `GET /integration/products/:id/master-image`
— nhưng đặt ở `src/modules/integration/use-cases/get-master-image.ts`, không
ở đây: nó gọi lại `ProductRepository`/`AssetRepository` sẵn có của hai module
khác, không phải một adapter *của* module sản phẩm ra bên ngoài. Thư mục này
vẫn trống.
