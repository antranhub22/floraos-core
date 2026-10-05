import { notFound } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { enforceRateLimit } from "@/core/http/rate-limit"
import { getBrochureTracking } from "@/modules/greeting-card/use-cases/get-brochure-tracking"

/** GET /api/v1/public/brochure/tracking/[code] — khách theo dõi đơn theo mã đơn. */
export const GET = handle<[{ params: Promise<{ code: string }> }]>(async (request, context) => {
  enforceRateLimit(request, { scope: "brochure-tracking", limit: 60, windowMs: 60_000 })
  const { code } = await context.params
  const data = await getBrochureTracking(code)
  if (data.status === "NOT_FOUND") throw notFound()
  return jsonResponse(data)
})

export const dynamic = "force-dynamic"
