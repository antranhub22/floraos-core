-- Thả tim trên link bộ sưu tập công khai: ghi mẫu nào được thả/bỏ tim (LIKE/UNLIKE).
-- Chỉ THÊM một cột cho phép NULL + index — không đụng dữ liệu cũ. Idempotent như 20261006120000.
ALTER TABLE "greeting_catalog_events" ADD COLUMN IF NOT EXISTS "product_id" TEXT;

CREATE INDEX IF NOT EXISTS "greeting_catalog_events_organization_id_catalog_id_product_id_idx"
  ON "greeting_catalog_events"("organization_id", "catalog_id", "product_id");
