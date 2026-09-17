import { z } from "zod"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { getOrder } from "@/modules/orders/use-cases/get-order"
import { updateOrderProgress } from "@/modules/orders/use-cases/update-order-progress"

const patchOrderSchema = z.object({
  status: z.enum(["DRAFT", "CONFIRMED", "PROCESSING", "DELIVERED", "COMPLETED", "CANCELLED"]).optional(),
  productionStatus: z.enum(["WAITING", "ASSIGNED", "ARRANGING", "QUALITY_CHECK", "READY"]).optional(),
  deliveryStatus: z.enum(["PENDING", "DISPATCHED", "DELIVERING", "DELIVERED", "FAILED"]).optional(),
  cardMessage: z.string().optional(),
  internalNote: z.string().optional(),
  deliveryWindow: z
    .object({
      date: z.string(),
      timeSlot: z.string().optional(),
    })
    .optional(),
  deliveryAddress: z
    .object({
      recipientName: z.string(),
      phone: z.string(),
      street: z.string(),
      ward: z.string().optional(),
      district: z.string().optional(),
      province: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
})

/** `GET /api/v1/orders/:id` (R1) — Xem chi tiết đơn hàng & SLA */
export const GET = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R1")

  const { id } = await context.params
  const result = await getOrder(ctx, id)
  return jsonResponse(result)
})

/** `PATCH /api/v1/orders/:id` (R3) — Sửa đơn và cập nhật tiến độ sản xuất */
export const PATCH = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R3")

  const { id } = await context.params
  const body = await request.json()
  const parsed = patchOrderSchema.parse(body)

  const updated = await updateOrderProgress(ctx, id, parsed)
  return jsonResponse({ order: updated })
})
