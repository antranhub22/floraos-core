import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { enforceRateLimit } from "@/core/http/rate-limit"
import { issuesToDetails, publicOrderBodySchema } from "@/modules/greeting-card/contracts/public-order-schema"
import { submitBrochureOrder } from "@/modules/greeting-card/use-cases/submit-brochure-order"

/** POST /api/v1/public/brochure/[sendCode]/order — khách gửi đơn đặt hoa. */
export const POST = handle<[{ params: Promise<{ sendCode: string }> }]>(async (request, context) => {
  enforceRateLimit(request, { scope: "brochure-order", limit: 10, windowMs: 10 * 60_000 })
  const { sendCode } = await context.params
  const parsed = publicOrderBodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed(issuesToDetails(parsed.error.issues))
  const result = await submitBrochureOrder(sendCode, parsed.data)
  return jsonResponse(result, { status: 201 })
})

export const dynamic = "force-dynamic"
