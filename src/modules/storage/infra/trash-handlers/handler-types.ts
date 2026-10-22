import type { TenantContext } from "@/core/tenancy"
import type { TrashItem, TrashItemType } from "../../domain/trash-types"

/** `retained` = quá hạn/được yêu cầu xoá nhưng giữ lại vì đã có giao dịch. */
export type PurgeOutcome = "purged" | "retained" | "not_found"

export interface ExpiredTrashRef {
  id: string
  organizationId: string
  type: TrashItemType
}

/** Một loại dữ liệu có thể bỏ vào thùng rác — mỗi bảng gốc một handler. */
export interface TrashHandler {
  readonly types: readonly TrashItemType[]
  list(ctx: TenantContext, now: Date): Promise<TrashItem[]>
  moveToTrash(ctx: TenantContext, type: TrashItemType, id: string): Promise<boolean>
  restore(ctx: TenantContext, type: TrashItemType, id: string): Promise<boolean>
  purge(ctx: TenantContext, type: TrashItemType, id: string): Promise<PurgeOutcome>
  /** Toàn hệ thống — chỉ bộ dọn rác nền gọi. Bỏ vào thùng rác trước `cutoff`. */
  findExpired(cutoff: Date, limit: number): Promise<ExpiredTrashRef[]>
}
