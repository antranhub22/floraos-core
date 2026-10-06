import { z } from "zod"
import { notFound, validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { enforceRateLimit } from "@/core/http/rate-limit"
import { getBrochureTracking } from "@/modules/greeting-card/use-cases/get-brochure-tracking"

/**
 * GET /api/v1/public/brochure/tracking/[code] — khách theo dõi đơn theo mã đơn.
 * Mặc định trả bản rút gọn; `?link=<mã link>` (mở từ chính link của khách) trả đầy đủ.
 */
export const GET = handle<[{ params: Promise<{ code: string }> }]>(async (request, context) => {
  await enforceRateLimit(request, { scope: "brochure-tracking", limit: 60, windowMs: 60_000 })
  const { code } = await context.params
  const link = new URL(request.url).searchParams.get("link")
  const data = await getBrochureTracking(code, { sendCode: link })
  if (data.status === "NOT_FOUND") throw notFound()
  return jsonResponse(data)
})

const verifySchema = z.object({ phoneLast4: z.string().regex(/^\d{4}$/, "Nhập đúng 4 số cuối") })

/**
 * POST /api/v1/public/brochure/tracking/[code] — `{ phoneLast4 }`: 4 số cuối SĐT người đặt.
 * Sai → 404 (không nói là sai số hay sai mã). Giới hạn chặt để không dò được 10.000 khả năng.
 */
export const POST = handle<[{ params: Promise<{ code: string }> }]>(async (request, context) => {
  const { code } = await context.params
  await enforceRateLimit(request, { scope: `brochure-tracking-verify:${code.toUpperCase().slice(0, 40)}`, limit: 5, windowMs: 15 * 60_000 })
  const parsed = verifySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ phoneLast4: "Nhập đúng 4 số cuối" })
  const data = await getBrochureTracking(code, { phoneLast4: parsed.data.phoneLast4 })
  if (data.status === "NOT_FOUND" || !data.order.verified) throw notFound()
  return jsonResponse(data)
})

export const dynamic = "force-dynamic"
