# Adapter của module hồ sơ

Trống ở P4: hồ sơ kinh doanh và thương hiệu chỉ đọc/ghi trực tiếp qua
`infra/`, chưa nói chuyện với hệ thống nào bên ngoài. Thư mục vẫn có mặt vì
mọi module đủ bốn thư mục `domain/ use-cases/ infra/ adapters/` (xem
`src/modules/organization/adapters/README.md` cho cùng lý do).

Ứng viên adapter đầu tiên ở đây: đồng bộ một chiều `business_profiles` từ
Excel của `FloraOS` v1 cho AVI GIFT (A3, P8) — nếu hồ sơ AVI GIFT được nạp
qua đường này thay vì nhập tay.
