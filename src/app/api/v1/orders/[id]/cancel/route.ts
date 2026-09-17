import { z } from "zod"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { cancelOrder } from "@/modules/orders/use-cases/cancel-order"

const cancelSchema = z.object({
  reason: z.string().min(3, "Lý do hủy đơn phải có ít nhất 3 ký tự"),
})

/** `POST /api/v1/orders/:id/cancel` (R6 — Trần cứng Điều hành) */
export const POST = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)

  const { id } = await context.params
  const body = await request.json()
  const { reason } = cancelSchema.parse(body)

  const updated = await cancelOrder(ctx, id, reason)
  return jsonResponse({ order: updated })
})
