import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { enforceRateLimit } from "@/core/http/rate-limit"
import { assertBrochureOwner } from "@/modules/greeting-card/use-cases/brochure-owner"
import { issuesToDetails, publicQuoteBodySchema } from "@/modules/greeting-card/contracts/public-order-schema"
import { quoteBrochureSession } from "@/modules/greeting-card/use-cases/submit-brochure-order"

/** POST /api/v1/public/brochure/[sendCode]/quote — báo giá theo size/số lượng/khu vực/mã giảm giá. */
export const POST = handle<[{ params: Promise<{ sendCode: string }> }]>(async (request, context) => {
  await enforceRateLimit(request, { scope: "brochure-quote", limit: 60, windowMs: 60_000 })
  const { sendCode } = await context.params
  assertBrochureOwner(request, sendCode)
  const parsed = publicQuoteBodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed(issuesToDetails(parsed.error.issues))
  const { quote, errors, fullSlots } = await quoteBrochureSession(sendCode, parsed.data)
  return jsonResponse({ quote, errors, fullSlots: fullSlots ?? [] })
})

export const dynamic = "force-dynamic"
