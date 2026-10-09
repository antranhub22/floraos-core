import { scopedWhere, type TenantContext } from "@/core/tenancy"

import type { DbClient } from "./db-client"
import type { InputJsonValue } from "./entities"

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

const isDriveLink = (v: unknown): v is string => typeof v === "string" && /^https:\/\/drive\.google\.com\//.test(v)

/**
 * Nhập lại Excel cho mã đã có: thay `attributes.drive_link` khi link mới là Google Drive
 * mà link đang lưu thì trống hoặc không phải Drive (vd. trang web bán hàng). Không đụng
 * trường khác, không thay một link Drive bằng link khác. Trả về true nếu đã cập nhật.
 */
export async function refreshDriveLinkIfNotDrive(db: DbClient, ctx: TenantContext, code: string, driveLink: unknown): Promise<boolean> {
  if (!isDriveLink(driveLink)) return false
  const product = await db.products.findFirst({ where: scopedWhere(ctx, { code }), select: { id: true, attributes: true } })
  if (!product) return false
  const attrs = (product.attributes ?? {}) as Record<string, unknown>
  if (isDriveLink(attrs.drive_link)) return false
  await db.products.updateMany({
    where: scopedWhere(ctx, { id: product.id }),
    data: { attributes: { ...attrs, drive_link: driveLink } as InputJsonValue },
  })
  return true
}
