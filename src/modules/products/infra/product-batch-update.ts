import { scopedWhere, type TenantContext } from "@/core/tenancy"
import type { DbClient } from "./db-client"
import type { InputJsonValue } from "./entities"
import { linkMainImage, upsertMainImage } from "./product-main-image"

export type BatchUpdateItemInput = {
  code: string
  name?: string | undefined
  category?: string | null | undefined
  shape?: string | null | undefined
  facing?: string | null | undefined
  container?: string | null | undefined
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED" | undefined
  attributes?: Record<string, unknown> | null | undefined
  image_asset_id?: string | null | undefined
}

/**
 * Cập nhật sản phẩm đã tồn tại khi người dùng tái nhập từ Excel & Ảnh.
 * Đồng bộ toàn diện:
 * 1. Tên, danh mục, hình dáng, mặt hoa, đồ chứa.
 * 2. Thuộc tính (giá, mô tả, BOM, màu sắc, link Drive...).
 * 3. Ảnh chính (nếu có tải ảnh kèm theo).
 */
export async function updateExistingProductFromBatch(
  db: DbClient,
  ctx: TenantContext,
  item: BatchUpdateItemInput
): Promise<boolean> {
  const product = await db.products.findFirst({
    where: scopedWhere(ctx, { code: item.code }),
    select: { id: true, attributes: true },
  })
  if (!product) return false

  const existingAttrs = (product.attributes ?? {}) as Record<string, unknown>
  const newAttrs = item.attributes ? { ...existingAttrs, ...item.attributes } : existingAttrs

  await db.products.updateMany({
    where: scopedWhere(ctx, { id: product.id }),
    data: {
      ...(item.name ? { name: item.name } : {}),
      ...(item.category !== undefined ? { category: item.category } : {}),
      ...(item.shape !== undefined ? { shape: item.shape } : {}),
      ...(item.facing !== undefined ? { facing: item.facing } : {}),
      ...(item.container !== undefined ? { container: item.container } : {}),
      ...(item.status !== undefined ? { status: item.status } : {}),
      attributes: newAttrs as InputJsonValue,
    },
  })

  if (item.image_asset_id) {
    await upsertMainImage(db, ctx, item.code, item.image_asset_id)
  }

  return true
}
