import { AppError, notFound } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy/tenant-context"
import { recordAuditLog } from "@/modules/audit/use-cases/record-audit-log"
import { AssetRepository } from "@/modules/assets/infra/asset-repository"
import type { CoordinatorStage } from "../domain/coordinator-types"
import type { RuleResult } from "../domain/operation-rules"
import { checkStageTransition, type StageTransitionFacts } from "../domain/stage-transitions"
import { CoordinatorRepository, type CoordinatorOrderRow } from "../infra/coordinator-repository"
import { isUniqueViolation, runInTransaction, type DbClient } from "../infra/transaction"
import { presentCoordinatorOrders, type CoordinatorOrderView } from "./present-coordinator-order"

/** Luật nghiệp vụ không đạt → 422 kèm lý do đọc được. */
export function ensureRule(result: RuleResult): void {
  if (!result.ok) throw new AppError("UNPROCESSABLE_ENTITY", result.reason)
}

export async function loadOrderOrThrow(
  ctx: TenantContext,
  repo: CoordinatorRepository,
  idOrCode: string
): Promise<CoordinatorOrderRow> {
  const row = await repo.findOrder(ctx, idOrCode)
  if (!row || !row.coordination) throw notFound()
  return row
}

/** Chuyển bước sai luồng → 409 (xung đột trạng thái), không phải 500. */
export function ensureTransition(from: CoordinatorStage, to: CoordinatorStage, facts: StageTransitionFacts): void {
  const check = checkStageTransition(from, to, facts)
  if (!check.ok) throw new AppError("CONFLICT", check.reason, { from, to })
}

export function concurrentUpdate(): AppError {
  return new AppError("CONFLICT", "Đơn vừa được người khác cập nhật — tải lại rồi thử lại.")
}

/**
 * Ảnh gắn vào đơn phải là `assets` CỦA CHÍNH tổ chức. Id của tổ chức khác
 * trả cùng câu như id không tồn tại (không xác nhận nó tồn tại).
 */
export async function ensureAssetsOwned(ctx: TenantContext, db: DbClient, ids: readonly string[]): Promise<void> {
  const repo = new AssetRepository(db)
  for (const id of ids) {
    if (!(await repo.findById(ctx, id))) {
      throw new AppError("UNPROCESSABLE_ENTITY", "Ảnh không tồn tại", { asset_id: id })
    }
  }
}

export function audit(
  ctx: TenantContext,
  db: DbClient,
  action: string,
  entityId: string,
  before: unknown,
  after: unknown
) {
  return recordAuditLog(ctx, { action, entityType: "order_coordination", entityId, before, after }, db)
}

export async function getOrderView(ctx: TenantContext, idOrCode: string): Promise<CoordinatorOrderView> {
  const repo = new CoordinatorRepository()
  const row = await loadOrderOrThrow(ctx, repo, idOrCode)
  const [view] = await presentCoordinatorOrders(ctx, [row])
  return view!
}

/**
 * Giao dịch của một thao tác điều phối. Đụng khoá duy nhất (vd. hai người mở
 * sự cố cùng lúc trên một đơn → cùng mã `EXC-…-NN`) trả 409 để bấm lại, không
 * phải 500.
 */
export async function runCoordinatorTx<T>(fn: (tx: DbClient) => Promise<T>): Promise<T> {
  try {
    return await runInTransaction(fn)
  } catch (error) {
    if (isUniqueViolation(error)) throw concurrentUpdate()
    throw error
  }
}
