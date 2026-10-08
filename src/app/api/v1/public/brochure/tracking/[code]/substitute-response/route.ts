import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { enforceRateLimit } from "@/core/http/rate-limit"
import { SUBSTITUTE_NOTE_MAX } from "@/modules/greeting-card/domain/substitute-proposal"
import { issuesToDetails } from "@/modules/greeting-card/contracts/public-order-schema"
import { respondSubstitute } from "@/modules/greeting-card/use-cases/substitute"

const bodySchema = z.object({
  /** Khách mở trang không từ link của đơn → chứng minh bằng 4 số cuối SĐT người đặt. */
  phoneLast4: z.string().regex(/^\d{4}$/).optional(),
  proposalId: z.string().uuid(),
  choice: z.enum(["OPTION", "SHOP_DECIDES", "CANCEL"]),
  productId: z.string().max(64).optional(),
  note: z.string().max(SUBSTITUTE_NOTE_MAX).optional(),
})

/**
 * POST /api/v1/public/brochure/tracking/[code]/substitute-response?link=<mã link>
 * Người đặt trả lời đề xuất đổi mẫu: chọn một mẫu / nhờ tiệm chọn mẫu tương đương / xin huỷ đơn.
 * Chỉ chủ phiên của link đơn, hoặc người nhập đúng 4 số cuối SĐT người đặt; khác → 404.
 */
export const POST = handle<[{ params: Promise<{ code: string }> }]>(async (request, context) => {
  const { code } = await context.params
  const codeKey = code.toUpperCase().slice(0, 40)
  await enforceRateLimit(request, { scope: "brochure-substitute-response", limit: 10, windowMs: 10 * 60_000 })
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed(issuesToDetails(parsed.error.issues))
  const { phoneLast4, ...input } = parsed.data
  if (phoneLast4) {
    // Dùng chung bộ đếm với ô xác minh của trang theo dõi — không mở thêm đường dò 4 số cuối
    await enforceRateLimit(request, { scope: `brochure-tracking-verify:${codeKey}`, limit: 5, windowMs: 15 * 60_000 })
    await enforceRateLimit(request, { scope: `brochure-tracking-verify-code:${codeKey}`, limit: 10, windowMs: 86_400_000, key: "global" })
  }
  const link = new URL(request.url).searchParams.get("link")
  const result = await respondSubstitute(request, code, { sendCode: link, phoneLast4 }, input)
  return jsonResponse({ data: result })
})

export const dynamic = "force-dynamic"
