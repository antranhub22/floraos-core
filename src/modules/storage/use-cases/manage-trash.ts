import { AppError, conflict, notFound } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { AuditLogRepository } from "@/modules/audit/infra/audit-log-repository"
import { TrashRepository } from "../infra/trash-repository"
import type { TrashItem, TrashItemType } from "../domain/trash-types"

type TrashInput = { id: string; type: TrashItemType }
type Audit = Pick<AuditLogRepository, "record">

export function requireExecutiveRole(ctx: TenantContext) {
  // G3 (asset.delete) và L4 (product.archive) đều có trần cứng bắt buộc duy nhất là dieu_hanh
  const isExecutive =
    ctx.capabilities.has("G3") ||
    ctx.capabilities.has("L4") ||
    ctx.capabilities.has("A3") ||
    ctx.capabilities.has("B6")

  if (!isExecutive) {
    throw new AppError("CAPABILITY_DENIED", "Chỉ tài khoản có vai trò Điều hành mới có quyền quản lý xóa/khôi phục thùng rác")
  }
}

function recordTrashAudit(ctx: TenantContext, audit: Audit, action: string, input: TrashInput) {
  return audit.record(ctx, {
    action,
    entityType: input.type.toLowerCase(),
    entityId: input.id,
    after: { type: input.type, by: ctx.userId },
  })
}

/**
 * Bỏ một mục vào thùng rác + ghi `audit_logs`. Không tự kiểm quyền — route/use-case
 * gọi nó đã gác bằng mã năng lực của đúng loại dữ liệu (vd. `Q4` khách hàng, `G3` ảnh).
 */
export async function trashItem(
  ctx: TenantContext,
  input: TrashInput,
  repo = new TrashRepository(),
  audit: Audit = new AuditLogRepository()
): Promise<void> {
  const ok = await repo.moveToTrash(ctx, input)
  if (!ok) throw notFound()
  await recordTrashAudit(ctx, audit, "trash.move", input)
}

export async function getTrashList(
  ctx: TenantContext,
  repo = new TrashRepository()
): Promise<TrashItem[]> {
  requireExecutiveRole(ctx)
  return repo.listTrash(ctx)
}

export async function moveToTrash(
  ctx: TenantContext,
  input: TrashInput,
  repo = new TrashRepository(),
  audit: Audit = new AuditLogRepository()
): Promise<void> {
  requireExecutiveRole(ctx)
  await trashItem(ctx, input, repo, audit)
}

export async function restoreFromTrash(
  ctx: TenantContext,
  input: TrashInput,
  repo = new TrashRepository(),
  audit: Audit = new AuditLogRepository()
): Promise<void> {
  requireExecutiveRole(ctx)
  const ok = await repo.restoreFromTrash(ctx, input)
  if (!ok) throw notFound()
  await recordTrashAudit(ctx, audit, "trash.restore", input)
}

export async function permanentDelete(
  ctx: TenantContext,
  input: TrashInput,
  repo = new TrashRepository(),
  audit: Audit = new AuditLogRepository()
): Promise<void> {
  requireExecutiveRole(ctx)
  const outcome = await repo.permanentDelete(ctx, input)
  if (outcome === "not_found") throw notFound()
  if (outcome === "retained") {
    throw conflict(
      "Mục này đã có giao dịch nên được giữ lại để đối soát, không xóa vĩnh viễn được. Bạn vẫn có thể khôi phục nó."
    )
  }
  await recordTrashAudit(ctx, audit, "trash.purge", input)
}
