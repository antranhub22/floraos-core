import { handle, jsonResponse } from "@/core/http/response"
import { enforceRateLimit } from "@/core/http/rate-limit"
import { assertBrochureOwner } from "@/modules/greeting-card/use-cases/brochure-owner"
import { getOrderFamily } from "@/modules/greeting-card/use-cases/get-order-family"

/**
 * GET /api/v1/public/brochure/[sendCode]/history — các đơn khách đã đặt từ cùng link (phiên gốc + "Đặt thêm
 * đơn"): để trang khách về đúng đơn đang làm dở và hiện "Lịch sử đơn hàng". Chỉ chủ phiên / nhân viên tiệm.
 */
export const GET = handle<[{ params: Promise<{ sendCode: string }> }]>(async (request, context) => {
  await enforceRateLimit(request, { scope: "brochure-history", limit: 60, windowMs: 60_000 })
  const { sendCode } = await context.params
  await assertBrochureOwner(request, sendCode)
  return jsonResponse({ data: await getOrderFamily(sendCode) })
})

export const dynamic = "force-dynamic"
