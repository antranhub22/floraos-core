import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { quoteBrochureOrder } from "@/modules/greeting-card/use-cases/confirm-brochure-payment"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"
import { MAX_QUOTE_VND } from "@/modules/greeting-card/domain/brochure-payment-policy"

const schema = z.object({
  totalVnd: z.number().int("Số tiền phải là số nguyên").positive("Nhập số tiền báo giá").max(MAX_QUOTE_VND),
  reason: z.string().trim().max(300).optional(),
})

/** POST /api/v1/greeting-card/orders/[id]/quote — báo giá đơn đặt mẫu chưa niêm yết giá (R9). */
export const POST = handle<[{ params: Promise<{ id: string }> }]>(async (request, context) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.paymentRecord)
  const { id } = await context.params
  const parsed = schema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  return jsonResponse({ data: await quoteBrochureOrder(ctx, id, parsed.data.totalVnd, parsed.data.reason) })
})
