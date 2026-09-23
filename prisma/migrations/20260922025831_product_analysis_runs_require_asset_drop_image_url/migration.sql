-- Nợ #118 (chốt 22/09/2026) — sửa Chặng 05 CHOOSE gãy do Data URL base64
-- lọt vào query string + Postgres.
--
-- Xác minh trên Postgres dev thật trước khi viết migration này (22/09/2026):
-- `product_analysis_runs` có đúng 5 dòng, TẤT CẢ đều đã có `asset_id` không
-- rỗng trỏ tới asset thật (`state = READY`) — an toàn để chuyển NOT NULL,
-- không mất dữ liệu, không cần backfill.
--
-- `image_url` bị BỎ HẲN: mỗi dòng đang chứa 770KB–1MB Data URL base64 (client
-- gửi thẳng lên qua `analyze-product-intelligence.ts` trước khi sửa), trùng
-- lặp hoàn toàn với chính asset đã có trong bảng `assets`. Từ nay ảnh hiển
-- thị luôn ký lại tại thời điểm đọc qua `GET /api/v1/assets/:id/view-url`.
--
-- LƯU Ý CHO NGƯỜI CHẠY: lệnh `prisma migrate dev` đang bị chặn bởi trôi
-- migration history trên NHIỀU bảng khác (không riêng bảng này, xem nợ #97/
-- #104) — nó đòi `migrate reset` (xoá sạch DB). Đã xác nhận không có gì bị
-- xoá khi phát hiện điều này. Áp trực tiếp file SQL này bằng psql, rồi đánh
-- dấu đã áp dụng bằng:
--   npx prisma migrate resolve --applied 20260922025831_product_analysis_runs_require_asset_drop_image_url
-- KHÔNG chạy `npx prisma migrate dev` cho tới khi trôi migration history ở
-- các bảng khác được giải quyết riêng (không phải việc của lượt sửa này).

ALTER TABLE "product_analysis_runs" ALTER COLUMN "asset_id" SET NOT NULL;
ALTER TABLE "product_analysis_runs" DROP COLUMN "image_url";
