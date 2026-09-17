import { z } from "zod"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { assignFlorist } from "@/modules/orders/use-cases/assign-florist"

const assignSchema = z.object({
  assigneeId: z.string().min(1, "Bắt buộc phải chọn thợ cắm hoa"),
  difficulty: z.enum(["co_ban", "trung_binh", "kho", "vip"]).optional(),
})

/** `POST /api/v1/orders/:id/assign` (R4) — Phân công thợ cắm */
export const POST = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R4")

  const { id } = await context.params
  const body = await request.json()
  const parsed = assignSchema.parse(body)

  const updated = await assignFlorist(ctx, id, parsed)
  return jsonResponse({ order: updated })
})
