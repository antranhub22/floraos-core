/**
 * Use-case: Create Order (Tạo đơn hàng mới — M10, R2).
 */

import { AppError } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy/tenant-context"
import { calculateOrderTotal, generateOrderCode } from "../domain/order-rules"
import type { CreateOrderInput, OrderRecord } from "../domain/order-types"
import { OrderRepository } from "../infra/order-repository"

export async function createOrder(
  ctx: TenantContext,
  input: CreateOrderInput,
  repo = new OrderRepository()
): Promise<OrderRecord> {
  if (!input.items || input.items.length === 0) {
    throw new AppError("VALIDATION_FAILED", "Đơn hàng phải có ít nhất một sản phẩm hoặc mẫu hoa.")
  }

  const totalVnd = calculateOrderTotal(input.items)
  if (totalVnd < 0) {
    throw new AppError("VALIDATION_FAILED", "Tổng tiền đơn hàng không thể là số âm.")
  }

  const countToday = await repo.countTodayOrders(ctx.organizationId)
  const code = generateOrderCode(countToday + 1)

  return repo.create(ctx.organizationId, code, input, totalVnd, ctx.userId)
}
