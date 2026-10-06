import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"
import { decideDiscount } from "@/modules/greeting-card/use-cases/discount-requests"

const schema = z.object({
  approve: z.boolean(),
  // Duyệt khác mức xin: gửi mức mới (vẫn trong trần của Điều hành)
  percent: z.number().int().min(1).max(100).optional(),
  amountVnd: z.number().int().positive().max(1_000_000_000).optional(),
  note: z.string().trim().max(500).default(""),
})

/** POST /api/v1/greeting-card/discount-requests/[id]/decision — Điều hành duyệt/từ chối (F2). */
export const POST = handle<[{ params: Promise<{ id: string }> }]>(async (request, context) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.integrationManage)
  const { id } = await context.params
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  const { approve, note, percent, amountVnd } = parsed.data
  const ask = percent !== undefined || amountVnd !== undefined ? { percent, amountVnd } : undefined
  return jsonResponse({ data: await decideDiscount(ctx, { requestId: id, approve, ask, note }) })
})
