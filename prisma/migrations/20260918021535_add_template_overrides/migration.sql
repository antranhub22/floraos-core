-- CreateEnum
CREATE TYPE "template_family" AS ENUM ('GT', 'IT', 'CT', 'ST', 'OT');

-- CreateTable
CREATE TABLE "template_overrides" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "template_family" "template_family" NOT NULL,
    "template_key" TEXT NOT NULL,
    "field_key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "template_overrides_organization_id_idx" ON "template_overrides"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "template_overrides_organization_id_template_key_field_key_key" ON "template_overrides"("organization_id", "template_key", "field_key");

-- AddForeignKey
ALTER TABLE "template_overrides" ADD CONSTRAINT "template_overrides_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
