import { prisma } from "@/core/tenancy/infra/prisma"
import { scopedWhere, type TenantContext } from "@/core/tenancy"
import type { Prisma, product_status, products } from "@/generated/prisma/client"
import { getStorageProvider } from "@/modules/assets/adapters/storage-provider-factory"
import {
  PREVIOUS_STATUS_KEY,
  buildTrashItem,
  readLegacyTrashedAt,
  readPreviousStatus,
  stripTrashKeys,
  type TrashItem,
  type TrashItemType,
} from "../../domain/trash-types"
import type { ExpiredTrashRef, PurgeOutcome, TrashHandler } from "./handler-types"

const PREVIEW_EXPIRES_IN = 86400
const RESTORABLE_STATUSES: readonly product_status[] = ["DRAFT", "ACTIVE"]

/**
 * Ứng viên thùng rác: có `deleted_at`, hoặc bản ghi cũ `ARCHIVED` mang `attributes.trashed_at`.
 * Sản phẩm `ARCHIVED` không có dấu thùng rác (vd. "ngừng kinh doanh" hàng loạt) KHÔNG phải rác.
 */
const CANDIDATES: Prisma.productsWhereInput = {
  OR: [{ deleted_at: { not: null } }, { status: "ARCHIVED" as product_status }],
}

function trashedAtOf(row: Pick<products, "deleted_at" | "attributes">): Date | null {
  return row.deleted_at ?? readLegacyTrashedAt(row.attributes)
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

export class ProductTrashHandler implements TrashHandler {
  readonly types: readonly TrashItemType[] = ["PRODUCT"]

  private async findTrashed(ctx: TenantContext, id: string) {
    const row = await prisma.products.findFirst({ where: scopedWhere(ctx, { id, ...CANDIDATES }) })
    return row && trashedAtOf(row) ? row : null
  }

  async list(ctx: TenantContext, now: Date): Promise<TrashItem[]> {
    const rows = await prisma.products.findMany({
      where: scopedWhere(ctx, CANDIDATES),
      include: { images: { where: { role: "MAIN" }, take: 1 } },
      orderBy: { created_at: "desc" },
    })
    const assetIds = rows.flatMap((row) => (row.images[0] ? [row.images[0].asset_id] : []))
    const assets = assetIds.length
      ? await prisma.assets.findMany({ where: scopedWhere(ctx, { id: { in: assetIds } }), select: { id: true, storage_key: true } })
      : []
    const keyByAsset = new Map(assets.map((a) => [a.id, a.storage_key]))
    const storage = getStorageProvider()

    const items: TrashItem[] = []
    for (const row of rows) {
      const trashedAt = trashedAtOf(row)
      if (!trashedAt) continue
      const attrs = (row.attributes as Record<string, unknown> | null) ?? {}
      const key = row.images[0] ? keyByAsset.get(row.images[0].asset_id) : undefined
      const imageUrl = key ? await storage.signedUrl(key, PREVIEW_EXPIRES_IN).catch(() => null) : null
      items.push(
        buildTrashItem({
          id: row.id,
          type: "PRODUCT",
          name: row.name,
          code: row.code,
          imageUrl,
          trashedAt,
          trashedBy: row.deleted_by ?? ((attrs["trashed_by"] as string) || null),
          priceVnd: typeof attrs["price"] === "number" ? attrs["price"] : null,
          category: row.category,
          now: now.getTime(),
        })
      )
    }
    return items
  }

  async moveToTrash(ctx: TenantContext, _type: TrashItemType, id: string): Promise<boolean> {
    const product = await prisma.products.findFirst({ where: scopedWhere(ctx, { id, deleted_at: null }) })
    if (!product || readLegacyTrashedAt(product.attributes)) return false
    // Giữ `ARCHIVED` để mọi màn hình đang lọc theo trạng thái tự ẩn; trạng thái cũ cất để khôi phục đúng.
    const attributes = { ...stripTrashKeys(product.attributes), [PREVIOUS_STATUS_KEY]: product.status }
    const result = await prisma.products.updateMany({
      where: scopedWhere(ctx, { id: product.id, deleted_at: null }),
      data: { deleted_at: new Date(), deleted_by: ctx.userId, status: "ARCHIVED", attributes: asJson(attributes) },
    })
    return result.count > 0
  }

  async restore(ctx: TenantContext, _type: TrashItemType, id: string): Promise<boolean> {
    const product = await this.findTrashed(ctx, id)
    if (!product) return false
    // Bản ghi cũ không lưu trạng thái trước — giữ hành vi cũ là về ACTIVE.
    const status = readPreviousStatus(product.attributes, RESTORABLE_STATUSES, "ACTIVE")
    await prisma.products.updateMany({
      where: scopedWhere(ctx, { id: product.id }),
      data: { deleted_at: null, deleted_by: null, status, attributes: asJson(stripTrashKeys(product.attributes)) },
    })
    return true
  }

  async purge(ctx: TenantContext, _type: TrashItemType, id: string): Promise<PurgeOutcome> {
    const product = await this.findTrashed(ctx, id)
    if (!product) return "not_found"
    await prisma.$transaction(async (tx) => {
      await tx.product_images.deleteMany({ where: scopedWhere(ctx, { product_id: product.id }) })
      await tx.product_variants.deleteMany({ where: scopedWhere(ctx, { product_id: product.id }) })
      await tx.product_inventory.deleteMany({ where: scopedWhere(ctx, { product_id: product.id }) })
      await tx.products.deleteMany({ where: scopedWhere(ctx, { id: product.id }) })
    })
    return "purged"
  }

  async findExpired(cutoff: Date, limit: number): Promise<ExpiredTrashRef[]> {
    const select = { id: true, organization_id: true, deleted_at: true, attributes: true } as const
    const current = await prisma.products.findMany({ where: { deleted_at: { lt: cutoff } }, select, take: limit })
    // Bản ghi cũ: lúc bỏ vào thùng rác cũng cập nhật `updated_at`, nên `updated_at < cutoff` là điều kiện cần.
    const legacy = await prisma.products.findMany({
      where: { deleted_at: null, status: "ARCHIVED" as product_status, updated_at: { lt: cutoff } },
      select,
      take: limit,
    })
    return [...current, ...legacy.filter((row) => (readLegacyTrashedAt(row.attributes)?.getTime() ?? Infinity) < cutoff.getTime())]
      .slice(0, limit)
      .map((row) => ({ id: row.id, organizationId: row.organization_id, type: "PRODUCT" as const }))
  }
}
