import { handle, jsonResponse } from "@/core/http/response"
import { enforceRateLimit } from "@/core/http/rate-limit"
import { assertBrochureOwner } from "@/modules/greeting-card/use-cases/brochure-owner"
import { markBrochureOpened } from "@/modules/greeting-card/use-cases/get-greeting-catalog"

/**
 * POST /api/v1/public/brochure/[sendCode]/open — trình duyệt của khách báo đã mở link.
 * Tách khỏi lúc dựng trang để máy quét xem trước (Zalo/Facebook) không bị tính là khách mở.
 */
export const POST = handle<[{ params: Promise<{ sendCode: string }> }]>(async (request, context) => {
  await enforceRateLimit(request, { scope: "brochure-open", limit: 30, windowMs: 60_000 })
  const { sendCode } = await context.params
  assertBrochureOwner(request, sendCode)
  return jsonResponse(await markBrochureOpened(sendCode))
})

export const dynamic = "force-dynamic"
