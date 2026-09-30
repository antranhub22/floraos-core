-- ĐP-3 — Nền quản trị trường (Console Vận hành).
-- Bốn bảng: ba bảng nền tảng (field_definitions, field_catalogs,
-- field_catalog_values — KHÔNG organization_id, ngoại lệ có chủ đích của
-- Luật 1, cùng hạng platform_operators/ai_models) và một bảng tenant
-- (field_config_overrides — CÓ organization_id, ghi đè theo tổ chức).
-- Cộng cột custom_fields (JSONB, nullable) trên order_coordinations và
-- partners cho trường tự tạo gắn vào thực thể.
--
-- Viết tay vì máy ảo dùng để soạn lượt này không tải được binary
-- schema-engine của Prisma (giống bẫy esbuild/rollup đã ghi trong
-- AGENTS.md) nên không chạy được `prisma migrate dev` để tự sinh diff.
-- Anh Tony chạy `npx prisma migrate deploy` (hoặc `db push` ở dev) rồi
-- `npx prisma generate` trên máy thật.

-- CreateEnum
CREATE TYPE "field_origin" AS ENUM ('CORE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "field_requirement_level" AS ENUM ('OPTIONAL', 'RECOMMENDED', 'REQUIRED');

-- CreateEnum
CREATE TYPE "field_sensitivity" AS ENUM ('NORMAL', 'PII', 'SENSITIVE');

-- CreateEnum
CREATE TYPE "field_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "field_catalog_governance" AS ENUM ('OPEN', 'BEHAVIOR', 'CLOSED');

-- CreateEnum
CREATE TYPE "field_override_target" AS ENUM ('FIELD', 'CATALOG_VALUE');

-- CreateTable
CREATE TABLE "field_definitions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "origin" "field_origin" NOT NULL DEFAULT 'CORE',
    "data_type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "placeholder" TEXT,
    "placements" JSONB,
    "requirement" "field_requirement_level" NOT NULL DEFAULT 'OPTIONAL',
    "required_at_stage" TEXT,
    "visibility" JSONB,
    "validation" JSONB,
    "catalog_key" TEXT,
    "sensitivity" "field_sensitivity" NOT NULL DEFAULT 'NORMAL',
    "floor_internal_only" BOOLEAN NOT NULL DEFAULT false,
    "status" "field_status" NOT NULL DEFAULT 'ACTIVE',
    "default_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_catalogs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "governance" "field_catalog_governance" NOT NULL DEFAULT 'OPEN',
    "behavior_kind" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_catalogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_catalog_values" (
    "id" TEXT NOT NULL,
    "catalog_key" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "behavior" TEXT,
    "params" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_catalog_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_config_overrides" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "target" "field_override_target" NOT NULL,
    "override_key" TEXT NOT NULL,
    "label" TEXT,
    "visibility" JSONB,
    "requirement" "field_requirement_level",
    "is_enabled" BOOLEAN,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_config_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "field_definitions_key_key" ON "field_definitions"("key");

-- CreateIndex
CREATE INDEX "field_definitions_entity_idx" ON "field_definitions"("entity");

-- CreateIndex
CREATE INDEX "field_definitions_catalog_key_idx" ON "field_definitions"("catalog_key");

-- CreateIndex
CREATE UNIQUE INDEX "field_catalogs_key_key" ON "field_catalogs"("key");

-- CreateIndex
CREATE UNIQUE INDEX "field_catalog_values_catalog_key_code_key" ON "field_catalog_values"("catalog_key", "code");

-- CreateIndex
CREATE INDEX "field_catalog_values_catalog_key_idx" ON "field_catalog_values"("catalog_key");

-- CreateIndex
CREATE UNIQUE INDEX "field_config_overrides_organization_id_target_override_key_key" ON "field_config_overrides"("organization_id", "target", "override_key");

-- CreateIndex
CREATE INDEX "field_config_overrides_organization_id_idx" ON "field_config_overrides"("organization_id");

-- AddForeignKey
ALTER TABLE "field_catalog_values" ADD CONSTRAINT "field_catalog_values_catalog_key_fkey" FOREIGN KEY ("catalog_key") REFERENCES "field_catalogs"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_config_overrides" ADD CONSTRAINT "field_config_overrides_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable order_coordinations: thêm custom_fields
ALTER TABLE "order_coordinations" ADD COLUMN "custom_fields" JSONB;

-- AlterTable partners: thêm custom_fields
ALTER TABLE "partners" ADD COLUMN "custom_fields" JSONB;
