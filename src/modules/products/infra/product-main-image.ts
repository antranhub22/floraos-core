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
 * Nhập lại Excel kèm thư mục ảnh: LUÔN thay ảnh chính của sản phẩm bằng asset mới.
 * Xóa toàn bộ bản ghi MAIN hiện có rồi gắn asset mới — đảm bảo ghi đè khi nhập lại.
 * Trả về true nếu đã gắn (product tồn tại).
 */
export async function upsertMainImage(db: DbClient, ctx: TenantContext, code: string, assetId: string): Promise<boolean> {
  const product = await db.products.findFirst({ where: scopedWhere(ctx, { code }), select: { id: true } })
  if (!product) return false
  // Xóa ảnh MAIN cũ (nếu có) trước khi gắn ảnh mới
  await db.product_images.deleteMany({
    where: scopedWhere(ctx, { product_id: product.id, role: "MAIN" }),
  })
  await linkMainImage(db, ctx, product.id, assetId)
  return true
}

/**
 * @deprecated Dùng `upsertMainImage` thay thế (hàm này chỉ bù ảnh khi chưa có, không ghi đè).
 * Giữ lại để không break các call site cũ ngoài luồng batch-import.
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
 * Nhập lại Excel cho mã đã có: LUÔN cập nhật `attributes.drive_link` khi link mới là Google
 * Drive URL hợp lệ, kể cả khi sản phẩm đã có Drive link cũ — đảm bảo ghi đè khi nhập lại.
 * Không đụng các trường attributes khác. Trả về true nếu đã cập nhật.
 */
export async function refreshDriveLink(db: DbClient, ctx: TenantContext, code: string, driveLink: unknown): Promise<boolean> {
  if (!isDriveLink(driveLink)) return false
  const product = await db.products.findFirst({ where: scopedWhere(ctx, { code }), select: { id: true, attributes: true } })
  if (!product) return false
  const attrs = (product.attributes ?? {}) as Record<string, unknown>
  // Bỏ qua nếu link không thay đổi (tránh write thừa)
  if (attrs.drive_link === driveLink) return false
  await db.products.updateMany({
    where: scopedWhere(ctx, { id: product.id }),
    data: { attributes: { ...attrs, drive_link: driveLink } as InputJsonValue },
  })
  return true
}

/**
 * @deprecated Dùng `refreshDriveLink` thay thế (hàm này không ghi đè Drive link cũ).
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
