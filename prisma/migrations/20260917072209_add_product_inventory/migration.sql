-- CreateEnum
CREATE TYPE "stock_status" AS ENUM ('IN_STOCK', 'PRE_ORDER_ONLY', 'OUT_OF_STOCK');

-- CreateTable
CREATE TABLE "product_inventory" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "status" "stock_status" NOT NULL DEFAULT 'IN_STOCK',
    "quantity_available" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_inventory_organization_id_branch_id_idx" ON "product_inventory"("organization_id", "branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_inventory_organization_id_product_id_branch_id_key" ON "product_inventory"("organization_id", "product_id", "branch_id");

-- AddForeignKey
ALTER TABLE "product_inventory" ADD CONSTRAINT "product_inventory_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_inventory" ADD CONSTRAINT "product_inventory_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_inventory" ADD CONSTRAINT "product_inventory_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
