import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"
import { SUBSTITUTE_MAX_OPTIONS, SUBSTITUTE_REASON_MAX } from "@/modules/greeting-card/domain/substitute-proposal"
import { proposeSubstitute, substituteOptions } from "@/modules/greeting-card/use-cases/substitute"

const schema = z.object({
  reason: z.string().max(SUBSTITUTE_REASON_MAX),
  productIds: z.array(z.string().max(64)).min(1).max(SUBSTITUTE_MAX_OPTIONS + 2),
})

/**
 * GET /api/v1/greeting-card/orders/[id]/substitute — mẫu đang đặt, các mẫu còn bán trong cùng bộ
 * sưu tập để thay, đề xuất gần nhất (R3 order.update).
 */
export const GET = handle<[{ params: Promise<{ id: string }> }]>(async (request, context) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.orderUpdate)
  const { id } = await context.params
  return jsonResponse({ data: await substituteOptions(ctx, id) })
})

/**
 * POST /api/v1/greeting-card/orders/[id]/substitute — tiệm không làm được mẫu khách chọn, đề xuất
 * 1–3 mẫu thay thế kèm lý do; khách trả lời trên trang theo dõi (R3 order.update).
 */
export const POST = handle<[{ params: Promise<{ id: string }> }]>(async (request, context) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.orderUpdate)
  const { id } = await context.params
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  return jsonResponse({ data: await proposeSubstitute(ctx, id, parsed.data) }, { status: 201 })
})

export const dynamic = "force-dynamic"
