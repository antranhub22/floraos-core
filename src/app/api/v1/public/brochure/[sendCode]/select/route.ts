import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { enforceRateLimit } from "@/core/http/rate-limit"
import { selectBrochureProduct } from "@/modules/greeting-card/use-cases/select-brochure-product"

// Chỉ nhận productId — mọi field khác (giá, tên, ảnh) khách gửi lên đều bị bỏ qua.
const bodySchema = z.object({ productId: z.string().min(1).max(64) })

/** POST /api/v1/public/brochure/[sendCode]/select */
export const POST = handle<[{ params: Promise<{ sendCode: string }> }]>(async (request, context) => {
  await enforceRateLimit(request, { scope: "brochure-select", limit: 30, windowMs: 60_000 })
  const { sendCode } = await context.params
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ productId: "Thiếu thông tin mẫu hoa" })
  const snapshot = await selectBrochureProduct(sendCode, parsed.data.productId)
  return jsonResponse({ success: true, snapshot })
})

export const dynamic = "force-dynamic"
