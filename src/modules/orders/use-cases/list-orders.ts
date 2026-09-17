/**
 * Use-case: List Orders (Xem danh sách đơn hàng — M10, R1).
 */

import type { TenantContext } from "@/core/tenancy/tenant-context"
import type { OrderFilter, OrderRecord } from "../domain/order-types"
import { OrderRepository } from "../infra/order-repository"

export async function listOrders(
  ctx: TenantContext,
  filter: OrderFilter = {},
  repo = new OrderRepository()
): Promise<{ orders: OrderRecord[]; total: number }> {
  return repo.list(ctx.organizationId, filter)
}
