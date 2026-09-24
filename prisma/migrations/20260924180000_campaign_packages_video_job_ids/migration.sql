-- Phạm vi sản xuất (PO 24/09/2026): mỗi khung hình trong phạm vi một video →
-- gói chiến dịch giữ NHIỀU video. `video_job_id` giữ làm video chính (tương thích).
ALTER TABLE "campaign_packages" ADD COLUMN "video_job_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "campaign_packages"
SET "video_job_ids" = ARRAY["video_job_id"]
WHERE "video_job_id" IS NOT NULL;
