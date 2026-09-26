-- ĐP-4a.1 (26/09/2026) — T01: đủ trường P0/P1 của Đặc tả trường §2.1/§3.1.
-- Mọi cột MỚI đều cho phép NULL (đơn cũ không có giá trị). Các cột kiểm
-- theo danh mục (`channel`/`order_type`/`priority`/`service_level`/
-- `delivery_type`/`delivery_location_type`) là CHUỖI, không phải Prisma
-- enum (D12 — quản trị nền tảng sửa danh mục được mà không cần migration;
-- việc kiểm mã có active trong `field_catalog_values` hay không nằm ở tầng
-- ứng dụng, `validate-catalog-code.ts`). `source` KHÔNG phải danh mục quản
-- trị được — enum cố định đã có trong code (`order-ingestion-connector.ts`)
-- — nhưng vẫn để CHUỖI cho đơn giản, kiểm bằng zod (không cần CREATE TYPE).
--
-- Viết tay — VM cầu nối không tải được binary schema-engine của Prisma
-- (xem AGENTS.md), không chạy được `prisma migrate dev` để tự sinh diff.
-- Anh Tony chạy `npx prisma migrate deploy` rồi `npx prisma generate`.

ALTER TABLE "order_coordinations"
  ADD COLUMN "source" TEXT,
  ADD COLUMN "source_reference" TEXT,
  ADD COLUMN "channel" TEXT,
  ADD COLUMN "order_type" TEXT,
  ADD COLUMN "priority" TEXT,
  ADD COLUMN "service_level" TEXT,
  ADD COLUMN "delivery_type" TEXT,
  ADD COLUMN "delivery_location_type" TEXT,
  ADD COLUMN "card_required" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "received_at" TIMESTAMP(3),
  ADD COLUMN "delivery_window_start" TIMESTAMP(3),
  ADD COLUMN "delivery_window_end" TIMESTAMP(3),
  ADD COLUMN "production_deadline_at" TIMESTAMP(3),
  ADD COLUMN "pickup_target_at" TIMESTAMP(3),
  ADD COLUMN "sales_owner_id" TEXT,
  ADD COLUMN "next_action_owner_id" TEXT,
  ADD COLUMN "handoff_at" TIMESTAMP(3);
