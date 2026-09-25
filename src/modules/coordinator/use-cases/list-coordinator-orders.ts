/**
 * Use-case: danh sách đơn Control Tower (F03, R1). Rủi ro tính lại lúc đọc.
 */

import type { TenantContext } from "@/core/tenancy/tenant-context"
import type { CoordinatorStage } from "../domain/coordinator-types"
import { CoordinatorRepository } from "../infra/coordinator-repository"
import { presentCoordinatorOrders, type CoordinatorOrderView } from "./present-coordinator-order"

export async function listCoordinatorOrders(
  ctx: TenantContext,
  options: { stage?: CoordinatorStage | undefined; limit: number },
  repo = new CoordinatorRepository()
): Promise<CoordinatorOrderView[]> {
  const rows = await repo.listOrders(ctx, options)
  return presentCoordinatorOrders(ctx, rows)
}
