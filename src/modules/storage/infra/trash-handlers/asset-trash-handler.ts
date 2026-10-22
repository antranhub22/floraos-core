import { prisma } from "@/core/tenancy/infra/prisma"
import { scopedWhere, type TenantContext } from "@/core/tenancy"
import type { Prisma, asset_state } from "@/generated/prisma/client"
import { log } from "@/core/observability/log"
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
const RESTORABLE_STATES: readonly asset_state[] = ["PROCESSING", "READY", "FAILED"]

/** Đang ở thùng rác: có `deleted_at`, hoặc bản ghi cũ chỉ mang `state = ARCHIVED`. */
const IN_TRASH: Prisma.assetsWhereInput = {
  OR: [{ deleted_at: { not: null } }, { state: "ARCHIVED" as asset_state }],
}

function trashedAtOf(row: { deleted_at: Date | null; metadata: unknown; created_at: Date }): Date {
  return row.deleted_at ?? readLegacyTrashedAt(row.metadata) ?? row.created_at
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

/** Ảnh (`assets`) — RAW_ASSET; APPROVED_ANALYSIS trỏ id lượt phân tích, ảnh của nó vào thùng rác. */
export class AssetTrashHandler implements TrashHandler {
  readonly types: readonly TrashItemType[] = ["RAW_ASSET", "APPROVED_ANALYSIS"]

  async list(ctx: TenantContext, now: Date): Promise<TrashItem[]> {
    const storage = getStorageProvider()
    const rows = await prisma.assets.findMany({
      where: scopedWhere(ctx, IN_TRASH),
      orderBy: { created_at: "desc" },
    })
    const items: TrashItem[] = []
    for (const row of rows) {
      const meta = (row.metadata as Record<string, unknown> | null) ?? {}
      let imageUrl: string | null = null
      if (row.storage_key) {
        imageUrl = await storage.signedUrl(row.storage_key, PREVIEW_EXPIRES_IN).catch(() => null)
      }
      const name = (meta["filename"] as string) || (meta["name"] as string) || `Ảnh #${row.id.slice(0, 8)}`
      items.push(
        buildTrashItem({
          id: row.id,
          type: "RAW_ASSET",
          name,
          imageUrl,
          trashedAt: trashedAtOf(row),
          trashedBy: row.deleted_by ?? ((meta["trashed_by"] as string) || null),
          now: now.getTime(),
        })
      )
    }
    return items
  }

  async moveToTrash(ctx: TenantContext, type: TrashItemType, id: string): Promise<boolean> {
    if (type === "APPROVED_ANALYSIS") {
      const analysis = await prisma.product_analyses.findFirst({ where: scopedWhere(ctx, { id }) })
      if (!analysis) return false
      await this.trashAsset(ctx, analysis.asset_id)
      await prisma.product_analyses.update({ where: { id: analysis.id }, data: { approval_state: "REJECTED" } })
      return true
    }
    return this.trashAsset(ctx, id)
  }

  private async trashAsset(ctx: TenantContext, id: string): Promise<boolean> {
    const asset = await prisma.assets.findFirst({ where: scopedWhere(ctx, { id, deleted_at: null }) })
    if (!asset) return false
    const meta = { ...stripTrashKeys(asset.metadata), [PREVIOUS_STATUS_KEY]: asset.state }
    const result = await prisma.assets.updateMany({
      where: scopedWhere(ctx, { id: asset.id, deleted_at: null }),
      data: { deleted_at: new Date(), deleted_by: ctx.userId, state: "ARCHIVED", metadata: asJson(meta) },
    })
    return result.count > 0
  }

  async restore(ctx: TenantContext, _type: TrashItemType, id: string): Promise<boolean> {
    const asset = await prisma.assets.findFirst({ where: scopedWhere(ctx, { id, ...IN_TRASH }) })
    if (!asset) return false
    const state = readPreviousStatus(asset.metadata, RESTORABLE_STATES, "READY")
    await prisma.assets.updateMany({
      where: scopedWhere(ctx, { id: asset.id }),
      data: { deleted_at: null, deleted_by: null, state, metadata: asJson(stripTrashKeys(asset.metadata)) },
    })
    return true
  }

  async purge(ctx: TenantContext, _type: TrashItemType, id: string): Promise<PurgeOutcome> {
    const asset = await prisma.assets.findFirst({ where: scopedWhere(ctx, { id, ...IN_TRASH }) })
    if (!asset) return "not_found"
    await prisma.assets.deleteMany({ where: scopedWhere(ctx, { id: asset.id }) })
    await this.removeFilesIfUnused(asset.organization_id, [asset.storage_key, asset.thumb_key])
    return "purged"
  }

  /** Xoá tệp trong kho chỉ khi không còn bản ghi ảnh nào khác trỏ tới cùng khoá. */
  private async removeFilesIfUnused(organizationId: string, keys: Array<string | null>): Promise<void> {
    const storage = getStorageProvider()
    if (!storage.remove) return
    for (const key of keys) {
      if (!key) continue
      const stillUsed = await prisma.assets.count({
        where: { organization_id: organizationId, OR: [{ storage_key: key }, { thumb_key: key }] },
      })
      if (stillUsed > 0) continue
      await storage.remove(key).catch((error: unknown) => {
        log.warn("storage.trash.file_remove_failed", {
          feature: "storage",
          message: error instanceof Error ? error.message : String(error),
        })
      })
    }
  }

  async findExpired(cutoff: Date, limit: number): Promise<ExpiredTrashRef[]> {
    const select = { id: true, organization_id: true, deleted_at: true, metadata: true, created_at: true } as const
    const current = await prisma.assets.findMany({ where: { deleted_at: { lt: cutoff } }, select, take: limit })
    // Bản ghi cũ (chỉ `ARCHIVED`): ngày bỏ vào thùng rác nằm trong metadata, lọc lại ở đây.
    const legacy = await prisma.assets.findMany({
      where: { deleted_at: null, state: "ARCHIVED" as asset_state, created_at: { lt: cutoff } },
      select,
      orderBy: { created_at: "asc" },
      take: limit,
    })
    return [...current, ...legacy.filter((row) => trashedAtOf(row).getTime() < cutoff.getTime())]
      .slice(0, limit)
      .map((row) => ({ id: row.id, organizationId: row.organization_id, type: "RAW_ASSET" as const }))
  }
}
