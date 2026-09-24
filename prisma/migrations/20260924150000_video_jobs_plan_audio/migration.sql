-- Đợt 4 (24/09/2026): video lắp từ kịch bản sản xuất tổng (Chặng 05) + bản phối
-- âm thanh Khu vực C. Chỉ THÊM cột null được, không đụng dữ liệu cũ.
-- Áp: `npx prisma migrate deploy` (lệch lịch sử thì áp tay rồi
--   npx prisma migrate resolve --applied 20260924150000_video_jobs_plan_audio)

ALTER TABLE "video_jobs" ADD COLUMN "scene_plan_id" TEXT;
ALTER TABLE "video_jobs" ADD COLUMN "scene_plan_revision" INTEGER;
ALTER TABLE "video_jobs" ADD COLUMN "audio_job_id" TEXT;
ALTER TABLE "video_jobs" ADD COLUMN "audio_storage_key" TEXT;
