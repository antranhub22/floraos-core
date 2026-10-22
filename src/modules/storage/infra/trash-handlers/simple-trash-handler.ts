import { scopedWhere, type TenantContext } from "@/core/tenancy"
import { buildTrashItem, trashPurgeCutoff, type TrashItem, type TrashItemType } from "../../domain/trash-types"
import type { ExpiredTrashRef, PurgeOutcome, TrashHandler } from "./handler-types"

export type TrashRow = {
  id: string
  organization_id: string
  deleted_at: Date | null
  deleted_by: string | null
} & Record<string, unknown>

type Where = Record<string, unknown>

/** Phần chung của mọi delegate Prisma mà thùng rác dùng — bảng gốc có `deleted_at`/`deleted_by`. */
export interface SoftDeleteDelegate {
  findMany(args: { where: Where; select?: Where; orderBy?: Where; take?: number }): Promise<TrashRow[]>
  findFirst(args: { where: Where; select?: Where }): Promise<TrashRow | null>
  updateMany(args: { where: Where; data: Where }): Promise<{ count: number }>
  deleteMany(args: { where: Where }): Promise<{ count: number }>
}

export interface SimpleTrashConfig {
  type: TrashItemType
  delegate: () => SoftDeleteDelegate
  /** Cột cần đọc thêm để hiển thị (ngoài id/organization_id/deleted_*). */
  select: Record<string, true>
  nameOf(row: TrashRow): string
  codeOf?(row: TrashRow): string | null
  /** Ghi thêm khi bỏ vào thùng rác / khi khôi phục (vd. `is_active`). */
  onTrash?: Where
  onRestore?: Where
  /** Bản ghi khớp điều kiện này không bao giờ bị xoá hẳn (đã có giao dịch) — giữ ẩn để đối soát. */
  retainWhere?: Where
}

const BASE_SELECT = { id: true, organization_id: true, deleted_at: true, deleted_by: true } as const

/** Thùng rác cho bảng gốc chỉ cần `deleted_at` — bảng con ẩn theo cha, xoá theo `onDelete: Cascade`. */
export class SimpleTrashHandler implements TrashHandler {
  readonly types: readonly TrashItemType[]

  constructor(private readonly config: SimpleTrashConfig) {
    this.types = [config.type]
  }

  private get db(): SoftDeleteDelegate {
    return this.config.delegate()
  }

  async list(ctx: TenantContext, now: Date): Promise<TrashItem[]> {
    const rows = await this.db.findMany({
      where: scopedWhere(ctx, { deleted_at: { not: null } }),
      select: { ...BASE_SELECT, ...this.config.select },
      orderBy: { deleted_at: "desc" },
    })
    const retained = await this.retainedIds(ctx, rows, now)
    return rows.map((row) =>
      buildTrashItem({
        id: row.id,
        type: this.config.type,
        name: this.config.nameOf(row),
        code: this.config.codeOf?.(row) ?? null,
        trashedAt: row.deleted_at ?? now,
        trashedBy: row.deleted_by,
        retained: retained.has(row.id),
        now: now.getTime(),
      })
    )
  }

  /** Chỉ hỏi cho mục đã quá hạn — mục còn hạn chưa cần biết có bị giữ lại hay không. */
  private async retainedIds(ctx: TenantContext, rows: TrashRow[], now: Date): Promise<Set<string>> {
    if (!this.config.retainWhere) return new Set()
    const cutoff = trashPurgeCutoff(now).getTime()
    const expired = rows.filter((row) => (row.deleted_at?.getTime() ?? Infinity) < cutoff).map((row) => row.id)
    if (expired.length === 0) return new Set()
    const kept = await this.db.findMany({
      where: scopedWhere(ctx, { id: { in: expired }, ...this.config.retainWhere }),
      select: { id: true },
    })
    return new Set(kept.map((row) => row.id))
  }

  async moveToTrash(ctx: TenantContext, _type: TrashItemType, id: string): Promise<boolean> {
    const result = await this.db.updateMany({
      where: scopedWhere(ctx, { id, deleted_at: null }),
      data: { deleted_at: new Date(), deleted_by: ctx.userId, ...this.config.onTrash },
    })
    return result.count > 0
  }

  async restore(ctx: TenantContext, _type: TrashItemType, id: string): Promise<boolean> {
    const result = await this.db.updateMany({
      where: scopedWhere(ctx, { id, deleted_at: { not: null } }),
      data: { deleted_at: null, deleted_by: null, ...this.config.onRestore },
    })
    return result.count > 0
  }

  async purge(ctx: TenantContext, _type: TrashItemType, id: string): Promise<PurgeOutcome> {
    const row = await this.db.findFirst({ where: scopedWhere(ctx, { id, deleted_at: { not: null } }), select: { id: true } })
    if (!row) return "not_found"
    if (this.config.retainWhere) {
      const kept = await this.db.findFirst({ where: scopedWhere(ctx, { id, ...this.config.retainWhere }), select: { id: true } })
      if (kept) return "retained"
    }
    const result = await this.db.deleteMany({ where: scopedWhere(ctx, { id, deleted_at: { not: null } }) })
    return result.count > 0 ? "purged" : "not_found"
  }

  async findExpired(cutoff: Date, limit: number): Promise<ExpiredTrashRef[]> {
    const rows = await this.db.findMany({
      where: {
        deleted_at: { lt: cutoff },
        ...(this.config.retainWhere ? { NOT: this.config.retainWhere } : {}),
      },
      select: { id: true, organization_id: true },
      orderBy: { deleted_at: "asc" },
      take: limit,
    })
    return rows.map((row) => ({ id: row.id, organizationId: row.organization_id, type: this.config.type }))
  }
}
