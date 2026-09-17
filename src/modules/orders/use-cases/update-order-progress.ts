/**
 * Use-case: Update Order Progress (Cập nhật tiến độ sản xuất & đơn hàng — M10, R3).
 */

import { AppError } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy/tenant-context"
import {
  validateOrderStatusTransition,
  validateProductionStatusTransition,
  validateDeliveryStatusTransition,
} from "../domain/order-rules"
import type { OrderRecord, UpdateOrderInput } from "../domain/order-types"
import { OrderRepository } from "../infra/order-repository"

export async function updateOrderProgress(
  ctx: TenantContext,
  orderId: string,
  input: UpdateOrderInput,
  repo = new OrderRepository()
): Promise<OrderRecord> {
  const existing = await repo.findById(ctx.organizationId, orderId)
  if (!existing) {
    throw new AppError("NOT_FOUND", `Không tìm thấy đơn hàng với mã ID: ${orderId}`)
  }

  // Kiểm tra chuyển trạng thái order
  if (input.status && input.status !== existing.status) {
    const check = validateOrderStatusTransition(existing.status, input.status)
    if (!check.valid) {
      throw new AppError("UNPROCESSABLE_ENTITY", check.reason ?? "Chuyển trạng thái đơn không hợp lệ.")
    }
  }

  // Kiểm tra chuyển trạng thái production
  if (input.productionStatus && input.productionStatus !== existing.productionStatus) {
    const check = validateProductionStatusTransition(existing.productionStatus, input.productionStatus)
    if (!check.valid) {
      throw new AppError("UNPROCESSABLE_ENTITY", check.reason ?? "Chuyển trạng thái cắm hoa không hợp lệ.")
    }
  }

  // Kiểm tra chuyển trạng thái delivery
  if (input.deliveryStatus && input.deliveryStatus !== existing.deliveryStatus) {
    const check = validateDeliveryStatusTransition(existing.deliveryStatus, input.deliveryStatus)
    if (!check.valid) {
      throw new AppError("UNPROCESSABLE_ENTITY", check.reason ?? "Chuyển trạng thái giao hàng không hợp lệ.")
    }
  }

  // Ghi nhận sự kiện thay đổi
  if (input.status && input.status !== existing.status) {
    await repo.recordEvent(
      ctx.organizationId,
      orderId,
      "order",
      input.status,
      ctx.userId,
      existing.status,
      "Cập nhật trạng thái đơn hàng"
    )
  }

  if (input.productionStatus && input.productionStatus !== existing.productionStatus) {
    await repo.recordEvent(
      ctx.organizationId,
      orderId,
      "production",
      input.productionStatus,
      ctx.userId,
      existing.productionStatus,
      "Cập nhật tiến độ cắm hoa"
    )
  }

  if (input.deliveryStatus && input.deliveryStatus !== existing.deliveryStatus) {
    await repo.recordEvent(
      ctx.organizationId,
      orderId,
      "delivery",
      input.deliveryStatus,
      ctx.userId,
      existing.deliveryStatus,
      "Cập nhật tiến độ giao hàng"
    )
  }

  return repo.update(ctx.organizationId, orderId, input)
}
