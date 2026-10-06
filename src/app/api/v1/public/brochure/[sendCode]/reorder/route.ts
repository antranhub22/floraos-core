import { handle, jsonResponse } from "@/core/http/response"
import { enforceRateLimit } from "@/core/http/rate-limit"
import { assertBrochureOwner, isHttps, serializeOwnerCookie } from "@/modules/greeting-card/use-cases/brochure-owner"
import { startAnotherOrder } from "@/modules/greeting-card/use-cases/start-another-order"

/** POST /api/v1/public/brochure/[sendCode]/reorder — khách đặt thêm đơn mới từ link đã có đơn. */
export const POST = handle<[{ params: Promise<{ sendCode: string }> }]>(async (request, context) => {
  await enforceRateLimit(request, { scope: "brochure-reorder", limit: 10, windowMs: 10 * 60_000 })
  const { sendCode } = await context.params
  assertBrochureOwner(request, sendCode)
  const { sendCode: next, ownerCookie } = await startAnotherOrder(sendCode)
  return jsonResponse({ sendCode: next }, { status: 201, headers: { "set-cookie": serializeOwnerCookie(ownerCookie, isHttps(request)) } })
})

export const dynamic = "force-dynamic"
