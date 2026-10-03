import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { adminConfirmBrochurePayment } from "@/modules/greeting-card/use-cases/confirm-brochure-payment"

const confirmPaymentSchema = z.object({
  reference: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
})

export const POST = handle(async (request: Request, context: unknown) => {
  const { ctx } = await requireTenantContext(request)
  const params = await (context as { params: Promise<{ id: string }> }).params
  const id = params.id

  const body = await request.json().catch(() => ({}))
  const parsed = confirmPaymentSchema.safeParse(body)
  if (!parsed.success) {
    throw validationFailed({ issues: parsed.error.issues })
  }

  const result = await adminConfirmBrochurePayment(ctx, id, {
    reference: parsed.data.reference,
    note: parsed.data.note,
  })
  return jsonResponse({ data: result })
})
