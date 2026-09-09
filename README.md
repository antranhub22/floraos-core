# floraos-core

Nền tảng SaaS đa tenant cho cửa hàng và chuỗi cửa hàng hoa.

```
src/       Next.js + TypeScript — core web và API /api/v1
workers/   Python — xử lý ảnh (M01, M04a)
prisma/    lược đồ dùng chung
```

Hai bên nối nhau qua bảng `generation_jobs` trên Postgres, không qua HTTP và không qua tiến trình con.

## Đọc trước khi làm bất cứ việc gì

| # | Tệp | Nội dung |
|---|---|---|
| 1 | `docs/kien-truc/TRANG_THAI.md` | Đang ở đâu, làm gì tiếp |
| 2 | `docs/kien-truc/FLORAOS_SAAS_TARGET_ARCHITECTURE_V2.md` | Kiến trúc đích, lộ trình P0–P12 |
| 3 | `docs/kien-truc/01_PRD-FloraOS-Core.md` | Phạm vi, người dùng, tiêu chí nghiệm thu |
| 4 | `docs/kien-truc/HARVEST_MANIFEST.md` | Thu hoạch gì từ repo nào, hạng REUSE/EXTEND/ADAPTER/BUILD |
| 5 | `AGENTS.md` | Quy ước, bản đồ mã, bẫy |

## Chạy tại máy

```bash
cp .env.example .env      # điền SESSION_SECRET
docker compose up -d
npm i
npx prisma db push
npm run dev
```

## Trạng thái

Khung repo. Chưa có bảng, chưa có route, chưa có job.

Hạng mục kế tiếp là **P1** — Organization · Workspace · Membership · Branch · cách ly tenant. Không tạo bảng, route, job hay đường dẫn lưu trữ thật của bất kỳ module nào trước khi P1 và P2 đạt nghiệm thu; làm ngược sẽ sinh ra lược đồ thiếu `organization_id` và phải migration lại khi đã có dữ liệu thật.

## Ba repo còn lại

| Repo | Vai trò |
|---|---|
| `FloraOS` | v1, đóng băng tính năng, phục vụ AVI GIFT tới ngày cắt. Nguồn thu hoạch |
| `LocalBudd` | M05 Landing Page · M06 Catalog |
| `SocialFlow` | M04b Marketing Creative · M07 Content & Social Publishing |
