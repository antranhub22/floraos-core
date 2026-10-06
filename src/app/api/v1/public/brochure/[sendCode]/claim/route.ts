import { handle, jsonResponse } from "@/core/http/response"
import { enforceRateLimit } from "@/core/http/rate-limit"
import { claimBrochureSession, isHttps, serializeOwnerCookie } from "@/modules/greeting-card/use-cases/brochure-owner"
import { markBrochureOpened } from "@/modules/greeting-card/use-cases/get-greeting-catalog"

/**
 * POST /api/v1/public/brochure/[sendCode]/claim — trình duyệt đầu tiên mở link nhận chủ phiên
 * (cookie HttpOnly) và báo "khách đã mở". Phiên đã có chủ khác → 404.
 */
export const POST = handle<[{ params: Promise<{ sendCode: string }> }]>(async (request, context) => {
  await enforceRateLimit(request, { scope: "brochure-claim", limit: 30, windowMs: 60_000 })
  const { sendCode } = await context.params
  const cookie = await claimBrochureSession(request, sendCode)
  const opened = await markBrochureOpened(sendCode)
  return jsonResponse(opened, { headers: { "set-cookie": serializeOwnerCookie(cookie, isHttps(request)) } })
})

export const dynamic = "force-dynamic"
