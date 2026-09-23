-- Khu vực E (Chặng 06d) — lưu lựa chọn Ken Burns theo cảnh (23/09/2026).
-- Cột thêm mới, cho phép NULL: không đụng dữ liệu cũ (NULL = worker tự xoay vòng như trước).
ALTER TABLE "video_scenes" ADD COLUMN "motion_effect" TEXT;
