-- ĐP-4a (26/09/2026) — Sổ thu (PO 26/09/2026, D2). Đơn hàng luôn ghi đủ
-- Tổng/Đã thu/Còn phải thu. Viết tay vì máy ảo dùng để soạn lượt này không
-- tải được binary schema-engine của Prisma (giống bẫy esbuild/rollup đã ghi
-- trong AGENTS.md) nên không chạy được `prisma migrate dev` để tự sinh diff.
-- Anh Tony chạy `npx prisma migrate deploy` (hoặc `db push` ở dev — LƯU Ý:
-- `db push` sinh từ `schema.prisma`, KHÔNG đẩy được ràng buộc CHECK ở cuối
-- file này; chạy thêm `migrate deploy` một lần, hoặc chấp nhận không có
-- ràng buộc CHECK ở tầng DB cho tới khi có migrate deploy) rồi
-- `npx prisma generate` trên máy thật.

-- CreateEnum
CREATE TYPE "order_payment_kind" AS ENUM ('DEPOSIT', 'BALANCE', 'REFUND');

-- AlterTable: orders — thêm paid_vnd/balance_vnd. Đơn cũ: paid_vnd mặc định
-- 0 (cột mới có DEFAULT nên tự áp cho hàng cũ); balance_vnd backfill = total_vnd
-- (chưa thu gì) NGAY TRONG migration này trước khi đặt NOT NULL.
ALTER TABLE "orders" ADD COLUMN "paid_vnd" DECIMAL(14,2) NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "balance_vnd" DECIMAL(14,2);
UPDATE "orders" SET "balance_vnd" = "total_vnd" WHERE "balance_vnd" IS NULL;
ALTER TABLE "orders" ALTER COLUMN "balance_vnd" SET NOT NULL;
ALTER TABLE "orders" ADD CONSTRAINT "orders_balance_vnd_check" CHECK ("balance_vnd" = "total_vnd" - "paid_vnd");

-- CreateTable
CREATE TABLE "order_payments" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "kind" "order_payment_kind" NOT NULL,
    "amount_vnd" DECIMAL(14,2) NOT NULL,
    "payment_method" TEXT,
    "reference" TEXT,
    "evidence_asset_id" TEXT,
    "collected_by" TEXT NOT NULL,
    "collected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "custom_fields" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_payments_organization_id_order_id_idx" ON "order_payments"("organization_id", "order_id");

-- AddForeignKey
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
