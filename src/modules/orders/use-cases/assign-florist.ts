/**
 * Use-case: Assign Florist (Phân công thợ cắm hoa — M10, R4).
 */

import { AppError } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy/tenant-context"
import type { OrderRecord } from "../domain/order-types"
import { OrderRepository } from "../infra/order-repository"

export interface AssignFloristInput {
  assigneeId: string
  difficulty?: string | undefined // "co_ban" | "trung_binh" | "kho" | "vip"
}

export async function assignFlorist(
  ctx: TenantContext,
  orderId: string,
  input: AssignFloristInput,
  repo = new OrderRepository()
): Promise<OrderRecord> {
  const existing = await repo.findById(ctx.organizationId, orderId)
  if (!existing) {
    throw new AppError("NOT_FOUND", `Không tìm thấy đơn hàng với mã ID: ${orderId}`)
  }

  if (existing.status === "CANCELLED" || existing.status === "COMPLETED") {
    throw new AppError("UNPROCESSABLE_ENTITY", "Không thể phân công thợ cắm cho đơn đã kết thúc.")
  }

  // Tạo phân công mới qua repository
  await repo.createAssignment(
    ctx.organizationId,
    orderId,
    input.assigneeId,
    ctx.userId,
    input.difficulty ?? "trung_binh"
  )

  // Cập nhật trạng thái sản xuất sang ASSIGNED
  await repo.recordEvent(
    ctx.organizationId,
    orderId,
    "production",
    "ASSIGNED",
    ctx.userId,
    existing.productionStatus,
    `Phân công thợ cắm (ID: ${input.assigneeId})`
  )

  return repo.update(ctx.organizationId, orderId, {
    productionStatus: "ASSIGNED",
  })
}
