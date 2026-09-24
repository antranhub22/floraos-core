-- Bài đăng Khu vực B tự lưu (24/09/2026) — Chặng 07 đưa sẵn vào gói chiến dịch.
-- Bảng TENANT mới, không đụng dữ liệu cũ. Áp bằng `npx prisma migrate deploy`;
-- nếu lịch sử lệch (nợ #97/#104) thì áp tay bằng psql rồi:
--   npx prisma migrate resolve --applied 20260924090000_content_drafts

CREATE TABLE "content_drafts" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "topic_title" TEXT,
    "posts" JSONB NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_drafts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "content_drafts_organization_id_asset_id_topic_id_mode_key" ON "content_drafts"("organization_id", "asset_id", "topic_id", "mode");
CREATE INDEX "content_drafts_organization_id_updated_at_idx" ON "content_drafts"("organization_id", "updated_at");

ALTER TABLE "content_drafts" ADD CONSTRAINT "content_drafts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
