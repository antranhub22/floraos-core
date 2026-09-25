-- Chức năng 12 — Điều phối đơn hàng & Control Tower.
-- Bốn bảng này có trong schema.prisma từ commit a52cabe nhưng chưa có migration;
-- `prisma migrate deploy` trên máy thật sẽ không tạo chúng.

-- CreateEnum
CREATE TYPE "coordinator_stage" AS ENUM ('INTAKE', 'VALIDATING', 'PLANNING', 'ASSIGNING', 'IN_PRODUCTION', 'QUALITY_CHECK', 'DISPATCHING', 'DELIVERED', 'COMPLETED', 'EXCEPTION', 'CANCELLED');

-- CreateEnum
CREATE TYPE "coordination_risk_level" AS ENUM ('NORMAL', 'ATTENTION', 'AT_RISK', 'CRITICAL');

-- CreateEnum
CREATE TYPE "qc_record_status" AS ENUM ('PENDING', 'PASSED', 'REJECTED', 'REWORK_REQUESTED');

-- CreateTable
CREATE TABLE "partners" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "district" TEXT,
    "province" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'STANDARD',
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 5.0,
    "capacity_daily" INTEGER NOT NULL DEFAULT 10,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_coordinations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "partner_id" TEXT,
    "coordinator_id" TEXT,
    "stage" "coordinator_stage" NOT NULL DEFAULT 'INTAKE',
    "risk_level" "coordination_risk_level" NOT NULL DEFAULT 'NORMAL',
    "risk_reason" TEXT,
    "next_action" TEXT,
    "next_action_due" TIMESTAMP(3),
    "estimated_delivery_at" TIMESTAMP(3),
    "actual_delivery_at" TIMESTAMP(3),
    "resume_stage" "coordinator_stage",
    "production_progress" INTEGER NOT NULL DEFAULT 0,
    "finished_asset_ids" JSONB,
    "sample_asset_id" TEXT,
    "shipper_name" TEXT,
    "shipper_phone" TEXT,
    "carrier" TEXT,
    "delivery_state" TEXT,
    "pod_asset_id" TEXT,
    "pod_recipient_name" TEXT,
    "pod_captured_at" TIMESTAMP(3),
    "partner_payout_vnd" DECIMAL(14,2),
    "partner_rating" INTEGER,
    "closure_notes" TEXT,
    "closed_by" TEXT,
    "closed_at" TIMESTAMP(3),
    "cancelled_reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_coordinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_qc_records" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "inspector_id" TEXT,
    "status" "qc_record_status" NOT NULL DEFAULT 'PENDING',
    "ai_score" INTEGER,
    "ai_critique" TEXT,
    "image_asset_ids" JSONB,
    "checklist_result" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_qc_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_exceptions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "description" TEXT NOT NULL,
    "resolution" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reported_by" TEXT,
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "partners_organization_id_is_active_idx" ON "partners"("organization_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "partners_organization_id_code_key" ON "partners"("organization_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "order_coordinations_order_id_key" ON "order_coordinations"("order_id");

-- CreateIndex
CREATE INDEX "order_coordinations_organization_id_stage_idx" ON "order_coordinations"("organization_id", "stage");

-- CreateIndex
CREATE INDEX "order_coordinations_organization_id_risk_level_idx" ON "order_coordinations"("organization_id", "risk_level");

-- CreateIndex
CREATE INDEX "order_qc_records_organization_id_order_id_idx" ON "order_qc_records"("organization_id", "order_id");

-- CreateIndex
CREATE INDEX "order_exceptions_organization_id_order_id_idx" ON "order_exceptions"("organization_id", "order_id");

-- CreateIndex
CREATE INDEX "order_exceptions_organization_id_status_idx" ON "order_exceptions"("organization_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "order_exceptions_organization_id_code_key" ON "order_exceptions"("organization_id", "code");

-- AddForeignKey
ALTER TABLE "partners" ADD CONSTRAINT "partners_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_coordinations" ADD CONSTRAINT "order_coordinations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_coordinations" ADD CONSTRAINT "order_coordinations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_coordinations" ADD CONSTRAINT "order_coordinations_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_qc_records" ADD CONSTRAINT "order_qc_records_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_qc_records" ADD CONSTRAINT "order_qc_records_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_exceptions" ADD CONSTRAINT "order_exceptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_exceptions" ADD CONSTRAINT "order_exceptions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

