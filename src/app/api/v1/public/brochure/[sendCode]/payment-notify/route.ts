import { handle, jsonResponse } from "@/core/http/response"
import { enforceRateLimit } from "@/core/http/rate-limit"
import { reportCustomerPayment } from "@/modules/greeting-card/use-cases/confirm-brochure-payment"

/** POST /api/v1/public/brochure/[sendCode]/payment-notify — khách báo đã chuyển khoản. */
export const POST = handle<[{ params: Promise<{ sendCode: string }> }]>(async (request, context) => {
  enforceRateLimit(request, { scope: "brochure-paid", limit: 10, windowMs: 60_000 })
  const { sendCode } = await context.params
  return jsonResponse(await reportCustomerPayment(sendCode))
})

export const dynamic = "force-dynamic"
