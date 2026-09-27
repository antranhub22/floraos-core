-- ĐP-4a.5–4a.9 (27/09/2026): T02 bàn giao, T03 yêu cầu bổ sung thông tin,
-- T04 yêu cầu thay đổi, T05 mở rộng, Form Lập kế hoạch.

-- 4a.5 — T02: xác nhận bàn giao Sales → Điều phối (handoff_at đã có từ 4a.1).
ALTER TABLE "order_coordinations" ADD COLUMN "handoff_confirmed" BOOLEAN NOT NULL DEFAULT false;

-- 4a.3 gap (bổ sung ở đợt này) — Điều phối đặt cách thu + hạn thu phần còn lại.
-- Danh mục §2.15.7, mã chuỗi kiểm active ở tầng ứng dụng (D12), không Prisma enum.
ALTER TABLE "order_coordinations" ADD COLUMN "collection_method" TEXT;
ALTER TABLE "order_coordinations" ADD COLUMN "collection_due_at" TIMESTAMP(3);

-- 4a.9 — Form Lập kế hoạch đơn (Đặc tả trường §4.2).
ALTER TABLE "order_coordinations" ADD COLUMN "planned_at" TIMESTAMP(3);
ALTER TABLE "order_coordinations" ADD COLUMN "production_buffer_minutes" INTEGER;
ALTER TABLE "order_coordinations" ADD COLUMN "pickup_buffer_minutes" INTEGER;
ALTER TABLE "order_coordinations" ADD COLUMN "planned_production_minutes" INTEGER;
ALTER TABLE "order_coordinations" ADD COLUMN "planned_qc_buffer_minutes" INTEGER;
ALTER TABLE "order_coordinations" ADD COLUMN "planned_pickup_minutes" INTEGER;
ALTER TABLE "order_coordinations" ADD COLUMN "planned_delivery_minutes" INTEGER;
ALTER TABLE "order_coordinations" ADD COLUMN "partner_selection_deadline_at" TIMESTAMP(3);
ALTER TABLE "order_coordinations" ADD COLUMN "technical_instruction" TEXT;

-- 4a.6 — T03: Yêu cầu bổ sung thông tin (Đặc tả trường §3.3).
CREATE TYPE "order_info_request_status" AS ENUM ('OPEN', 'SENT', 'WAITING', 'RECEIVED', 'OVERDUE', 'CANCELLED');

CREATE TABLE "order_info_requests" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "missing_field" TEXT NOT NULL,
    "field_label" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "business_impact" TEXT,
    "requested_from" TEXT NOT NULL,
    "requested_by" TEXT NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_at" TIMESTAMP(3),
    "channel" TEXT,
    "message_template" TEXT,
    "response_required" BOOLEAN NOT NULL DEFAULT true,
    "response_value" TEXT,
    "response_received_at" TIMESTAMP(3),
    "status" "order_info_request_status" NOT NULL DEFAULT 'OPEN',
    "cancelled_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_info_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "order_info_requests_organization_id_order_id_idx" ON "order_info_requests"("organization_id", "order_id");
CREATE INDEX "order_info_requests_organization_id_status_idx" ON "order_info_requests"("organization_id", "status");

ALTER TABLE "order_info_requests" ADD CONSTRAINT "order_info_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_info_requests" ADD CONSTRAINT "order_info_requests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4a.7 — T04: Yêu cầu thay đổi (Đặc tả trường §3.4, Hợp đồng MI §6 đầy đủ).
CREATE TYPE "order_change_type" AS ENUM ('PRODUCT', 'FLOWERS', 'COLOR', 'WRAPPING', 'ACCESSORY', 'CARD_MESSAGE', 'ADDRESS', 'RECIPIENT', 'DELIVERY_DATE', 'DELIVERY_TIME', 'PRICE', 'QUANTITY', 'PARTNER', 'OTHER');
CREATE TYPE "order_change_request_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'APPLIED', 'CANCELLED');

CREATE TABLE "order_change_requests" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "requested_by" TEXT NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "change_type" "order_change_type" NOT NULL,
    "field_changed" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "reason" TEXT NOT NULL,
    "customer_impact" TEXT,
    "production_impact" TEXT,
    "delivery_impact" TEXT,
    "cost_impact_vnd" DECIMAL(14,2),
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "partner_notified" BOOLEAN NOT NULL DEFAULT false,
    "customer_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "effective_at" TIMESTAMP(3),
    "status" "order_change_request_status" NOT NULL DEFAULT 'PENDING',
    "rejected_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_change_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "order_change_requests_organization_id_order_id_idx" ON "order_change_requests"("organization_id", "order_id");
CREATE INDEX "order_change_requests_organization_id_status_idx" ON "order_change_requests"("organization_id", "status");

ALTER TABLE "order_change_requests" ADD CONSTRAINT "order_change_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_change_requests" ADD CONSTRAINT "order_change_requests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
