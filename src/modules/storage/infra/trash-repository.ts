import type { TenantContext } from "@/core/tenancy"
import type { TrashItem, TrashItemType } from "../domain/trash-types"
import type { ExpiredTrashRef, PurgeOutcome, TrashHandler } from "./trash-handlers/handler-types"
import { createTrashHandlers, handlerFor } from "./trash-handlers/registry"

export type { ExpiredTrashRef, PurgeOutcome }

/**
 * Thùng rác 30 ngày cho mọi loại dữ liệu có cột `deleted_at` — mỗi bảng gốc một
 * handler (`trash-handlers/registry.ts`). Dọn rác quá hạn do bộ quét nền làm
 * (`use-cases/purge-expired-trash.ts`), không còn làm lén khi mở danh sách.
 */
export class TrashRepository {
  constructor(private readonly handlers: TrashHandler[] = createTrashHandlers()) {}

  async listTrash(ctx: TenantContext, now = new Date()): Promise<TrashItem[]> {
    const groups = await Promise.all(this.handlers.map((handler) => handler.list(ctx, now)))
    return groups.flat().sort((a, b) => new Date(b.trashedAt).getTime() - new Date(a.trashedAt).getTime())
  }

  async moveToTrash(ctx: TenantContext, input: { id: string; type: TrashItemType }): Promise<boolean> {
    return handlerFor(this.handlers, input.type)?.moveToTrash(ctx, input.type, input.id) ?? false
  }

  async restoreFromTrash(ctx: TenantContext, input: { id: string; type: TrashItemType }): Promise<boolean> {
    return handlerFor(this.handlers, input.type)?.restore(ctx, input.type, input.id) ?? false
  }

  async permanentDelete(ctx: TenantContext, input: { id: string; type: TrashItemType }): Promise<PurgeOutcome> {
    return handlerFor(this.handlers, input.type)?.purge(ctx, input.type, input.id) ?? "not_found"
  }

  /** Toàn hệ thống, mỗi loại tối đa `limitPerHandler` mục — chỉ bộ dọn rác nền gọi. */
  async findExpired(cutoff: Date, limitPerHandler: number): Promise<ExpiredTrashRef[]> {
    const groups = await Promise.all(this.handlers.map((handler) => handler.findExpired(cutoff, limitPerHandler)))
    return groups.flat()
  }
}
