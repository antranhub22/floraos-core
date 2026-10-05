import { handle, jsonResponse } from "@/core/http/response"
import { enforceRateLimit } from "@/core/http/rate-limit"
import { startAnotherOrder } from "@/modules/greeting-card/use-cases/start-another-order"

/** POST /api/v1/public/brochure/[sendCode]/reorder — khách đặt thêm đơn mới từ link đã có đơn. */
export const POST = handle<[{ params: Promise<{ sendCode: string }> }]>(async (request, context) => {
  await enforceRateLimit(request, { scope: "brochure-reorder", limit: 10, windowMs: 10 * 60_000 })
  const { sendCode } = await context.params
  return jsonResponse(await startAnotherOrder(sendCode), { status: 201 })
})

export const dynamic = "force-dynamic"
