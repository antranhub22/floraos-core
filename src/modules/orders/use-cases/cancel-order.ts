/**
 * Use-case: Cancel Order (Hủy đơn hàng — M10, R6).
 * Gác bởi trần cứng điều hành, bắt buộc lý do, ghi audit_logs.
 */

import { AppError } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { recordAuditLog } from "@/modules/audit/use-cases/record-audit-log"
import type { TenantContext } from "@/core/tenancy/tenant-context"
import type { OrderRecord } from "../domain/order-types"
import { OrderRepository } from "../infra/order-repository"

export async function cancelOrder(
  ctx: TenantContext,
  orderId: string,
  reason: string,
  repo = new OrderRepository()
): Promise<OrderRecord> {
  // Gác quyền R6 (Trần cứng)
  requireCapability(ctx, "R6")

  if (!reason || reason.trim().length === 0) {
    throw new AppError("VALIDATION_FAILED", "Hủy đơn hàng bắt buộc phải có lý do chi tiết.")
  }

  const existing = await repo.findById(ctx.organizationId, orderId)
  if (!existing) {
    throw new AppError("NOT_FOUND", `Không tìm thấy đơn hàng với mã ID: ${orderId}`)
  }

  if (existing.status === "CANCELLED") {
    throw new AppError("UNPROCESSABLE_ENTITY", "Đơn hàng này đã bị hủy trước đó.")
  }

  if (existing.status === "COMPLETED") {
    throw new AppError("UNPROCESSABLE_ENTITY", "Không thể hủy đơn hàng đã hoàn tất giao dịch.")
  }

  // Ghi nhật ký sự kiện order_events
  await repo.recordEvent(
    ctx.organizationId,
    orderId,
    "order",
    "CANCELLED",
    ctx.userId,
    existing.status,
    reason
  )

  const updated = await repo.update(ctx.organizationId, orderId, {
    status: "CANCELLED",
  })

  // Ghi audit log
  await recordAuditLog(ctx, {
    action: "order.cancel",
    entityType: "orders",
    entityId: orderId,
    before: { status: existing.status },
    after: { status: "CANCELLED", reason },
  })

  return updated
}
