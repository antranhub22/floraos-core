import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { enforceRateLimit } from "@/core/http/rate-limit"
import { assertBrochureOwner } from "@/modules/greeting-card/use-cases/brochure-owner"
import { recordCustomerJourneyEvent } from "@/modules/greeting-card/use-cases/customer-journey"
import { CUSTOMER_JOURNEY_EVENTS } from "@/modules/greeting-card/domain/customer-journey-events"

const bodySchema = z.object({
  event: z.enum(CUSTOMER_JOURNEY_EVENTS),
  productId: z.string().min(1).max(64).optional(),
})

/** POST /api/v1/public/brochure/[sendCode]/event — trình duyệt của chủ phiên báo một bước lướt mẫu. */
export const POST = handle<[{ params: Promise<{ sendCode: string }> }]>(async (request, context) => {
  await enforceRateLimit(request, { scope: "brochure-journey-event", limit: 240, windowMs: 10 * 60_000 })
  const { sendCode } = await context.params
  assertBrochureOwner(request, sendCode)
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ event: "Sự kiện không hợp lệ" })
  return jsonResponse(await recordCustomerJourneyEvent(sendCode, parsed.data))
})

export const dynamic = "force-dynamic"
