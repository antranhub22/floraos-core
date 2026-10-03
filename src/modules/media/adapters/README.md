# Adapter của module media

Trống từ 25/09/2026 (trả nợ #152). Bảy adapter ảnh phía TS
(`multi-image-provider-router`, `photoroom`, `fal-flux`, `stability-ai`,
`google-imagen`, `studio-local`, `openai`) đã gỡ: sau khi nhánh cloud của
`POST /media/optimizations` vào hàng đợi `media.optimize` và
`executeCloudCreative` bị xoá, chúng không còn nơi gọi. Nhà cung cấp ảnh
chỉ còn một lớp — ở worker Python (`workers/media_ai/providers/`), đúng
#139(a). Thư mục vẫn có mặt vì mọi module đủ bốn thư mục
`domain/ use-cases/ infra/ adapters/`.

Đừng dựng lại adapter gọi thẳng nhà cung cấp ảnh ở đây: việc sinh/chỉnh ảnh
là job, đi qua `enqueueJob` và worker lấy việc bằng `SKIP LOCKED`.
