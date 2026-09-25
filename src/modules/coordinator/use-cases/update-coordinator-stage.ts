/**
 * Use-case: Update Coordinator Stage (Chuyển bước điều phối).
 */

import type { TenantContext } from "@/core/tenancy/tenant-context"
import type { CoordinatorStage } from "../domain/coordinator-types"
import { CoordinatorRepository } from "../infra/coordinator-repository"

export async function updateCoordinatorStage(
  ctx: TenantContext,
  orderIdOrCode: string,
  nextStage: CoordinatorStage,
  nextAction?: string | undefined,
  repo = new CoordinatorRepository()
) {
  return repo.updateOrderStage(ctx.organizationId, orderIdOrCode, nextStage, nextAction)
}
