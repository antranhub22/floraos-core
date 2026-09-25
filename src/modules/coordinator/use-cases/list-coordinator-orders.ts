/**
 * Use-case: List Coordinator Orders (Xem danh sách đơn điều phối Control Tower).
 */

import type { TenantContext } from "@/core/tenancy/tenant-context"
import { CoordinatorRepository } from "../infra/coordinator-repository"

export async function listCoordinatorOrders(
  ctx: TenantContext,
  options?: { stage?: string | undefined; limit?: number | undefined },
  repo = new CoordinatorRepository()
) {
  return repo.listOrdersWithCoordination(ctx.organizationId, options)
}
