-- Content Engine — kết quả viết bài (P27, quyết định PO 25/09/2026). Bảng
-- TENANT mới, không đụng dữ liệu cũ. Áp bằng `npx prisma migrate deploy`;
-- nếu lịch sử lệch (nợ #97/#104) thì áp tay bằng psql rồi:
--   npx prisma migrate resolve --applied 20260925090000_content_generations

CREATE TABLE "content_generations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "job_id" TEXT,
    "origin" TEXT NOT NULL,
    "asset_id" TEXT,
    "product_id" TEXT,
    "topic_id" TEXT,
    "scene_plan_id" TEXT,
    "mode" TEXT,
    "channels" JSONB NOT NULL,
    "brief" JSONB NOT NULL,
    "brief_version" INTEGER NOT NULL,
    "prompt_versions" JSONB NOT NULL,
    "rubric_version" TEXT NOT NULL,
    "strategy" JSONB,
    "posts" JSONB NOT NULL,
    "overall_score" DOUBLE PRECISION,
    "approved_posts" JSONB,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "social_post_ids" JSONB,
    "created_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_generations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "content_generations_organization_id_asset_id_topic_id_mode_idx" ON "content_generations"("organization_id", "asset_id", "topic_id", "mode");
CREATE INDEX "content_generations_organization_id_created_at_idx" ON "content_generations"("organization_id", "created_at");

ALTER TABLE "content_generations" ADD CONSTRAINT "content_generations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
