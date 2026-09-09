# Module

Mỗi module đủ **bốn** thư mục, không thiếu cái nào:

```
<tên-module>/
├── domain/      thực thể + luật nghiệp vụ — KHÔNG import Prisma
├── use-cases/   điều phối
├── infra/       repository, Prisma
└── adapters/    ra ngoài
```

`domain/` không import hạ tầng. Đó là điều kiện để test luật nghiệp vụ không cần cơ sở dữ liệu.

Viết `use-cases`, không viết `usecases`. Không lặp lại tình trạng một module chỉ có `adapters`.

Module thuộc repo này: M01 Product Image Analysis · M02 Product Cost & Pricing · M03 Product Search/KB · M04a Product Image Optimization. M05 và M06 thuộc `LocalBudd`; M04b và M07 thuộc `SocialFlow`.
