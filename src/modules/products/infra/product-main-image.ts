import { scopedWhere, type TenantContext } from "@/core/tenancy"

import type { DbClient } from "./db-client"

/** Gắn asset làm ảnh chính (MAIN) của sản phẩm và ghi `product_id` lên asset. */
export async function linkMainImage(db: DbClient, ctx: TenantContext, productId: string, assetId: string): Promise<void> {
  await db.product_images.upsert({
    where: {
      organization_id_product_id_asset_id_role: {
        organization_id: ctx.organizationId,
        product_id: productId,
        asset_id: assetId,
        role: "MAIN",
      },
    },
    update: { position: 0 },
    create: { organization_id: ctx.organizationId, product_id: productId, asset_id: assetId, role: "MAIN", position: 0 },
  })
  await db.assets.updateMany({
    where: scopedWhere(ctx, { id: assetId }),
    data: { product_id: productId },
  })
}

/**
 * Nhập lại Excel kèm thư mục ảnh cho mã ĐÃ có: chỉ bù ảnh khi sản phẩm chưa có ảnh chính —
 * không bao giờ thay ảnh người dùng đã chọn. Trả về true nếu đã gắn.
 */
export async function attachMainImageIfMissing(db: DbClient, ctx: TenantContext, code: string, assetId: string): Promise<boolean> {
  const product = await db.products.findFirst({ where: scopedWhere(ctx, { code }), select: { id: true } })
  if (!product) return false
  const hasMain = await db.product_images.findFirst({
    where: scopedWhere(ctx, { product_id: product.id, role: "MAIN" }),
    select: { asset_id: true },
  })
  if (hasMain) return false
  await linkMainImage(db, ctx, product.id, assetId)
  return true
}
