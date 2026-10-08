import { handle, jsonResponse } from "@/core/http/response"
import { enforceRateLimit } from "@/core/http/rate-limit"
import { approveBrochurePhoto } from "@/modules/greeting-card/use-cases/approve-brochure-photo"

/**
 * POST /api/v1/public/brochure/tracking/[code]/approve-photo?link=<mã link>
 * Khách (chủ phiên của link) bấm xác nhận hình ảnh sản phẩm hoàn thiện (Spec #3).
 */
export const POST = handle<[{ params: Promise<{ code: string }> }]>(async (request, context) => {
  await enforceRateLimit(request, { scope: "brochure-photo-approve", limit: 10, windowMs: 60_000 })
  const { code } = await context.params
  const link = new URL(request.url).searchParams.get("link")
  await approveBrochurePhoto(request, code, link)
  return jsonResponse({ success: true, message: "Đã xác nhận hình ảnh sản phẩm thành công" })
})

export const dynamic = "force-dynamic"
