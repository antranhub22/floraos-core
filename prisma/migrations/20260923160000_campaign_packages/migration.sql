-- Gói chiến dịch Creative Studio (Khu vực F, Chặng 07–14) — 23/09/2026.
-- Bảng TENANT mới, không đụng dữ liệu cũ. Nếu `prisma migrate dev` vẫn kẹt trôi
-- lịch sử (nợ #97/#104), áp tay bằng psql rồi:
--   npx prisma migrate resolve --applied 20260923160000_campaign_packages

CREATE TABLE "campaign_packages" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "product_id" TEXT,
    "master_asset_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "topic" JSONB,
    "content" JSONB,
    "variant_asset_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "video_job_id" TEXT,
    "audio_job_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "qa_report" JSONB,
    "qa_checked_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "launch_plan" JSONB,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_packages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "campaign_packages_organization_id_created_at_idx" ON "campaign_packages"("organization_id", "created_at");
CREATE INDEX "campaign_packages_organization_id_master_asset_id_idx" ON "campaign_packages"("organization_id", "master_asset_id");
CREATE INDEX "campaign_packages_organization_id_status_idx" ON "campaign_packages"("organization_id", "status");

ALTER TABLE "campaign_packages" ADD CONSTRAINT "campaign_packages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
