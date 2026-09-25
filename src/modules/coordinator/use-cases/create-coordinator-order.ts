/**
 * Use-case: Create Coordinator Order (Khởi tạo đơn hàng điều phối).
 * Tiếp nhận đơn từ Sales T01 / AI Chat M08 / Catalog M06 và đưa vào Control Tower.
 */

import type { TenantContext } from "@/core/tenancy/tenant-context"
import { CoordinatorRepository, type SaveCoordinatorOrderInput } from "../infra/coordinator-repository"

export async function createCoordinatorOrder(
  ctx: TenantContext,
  input: SaveCoordinatorOrderInput,
  repo = new CoordinatorRepository()
) {
  return repo.createOrderWithCoordination(ctx.organizationId, ctx.userId, input)
}
