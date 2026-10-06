import { notFound } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { enforceRateLimit } from "@/core/http/rate-limit"
import { assertBrochureOwner } from "@/modules/greeting-card/use-cases/brochure-owner"
import { getGreetingCatalogForCustomer } from "@/modules/greeting-card/use-cases/get-greeting-catalog"

/** GET /api/v1/public/brochure/[sendCode] — công khai, không cần đăng nhập. */
export const GET = handle<[{ params: Promise<{ sendCode: string }> }]>(async (request, context) => {
  await enforceRateLimit(request, { scope: "brochure-view", limit: 120, windowMs: 60_000 })
  const { sendCode } = await context.params
  assertBrochureOwner(request, sendCode)
  const data = await getGreetingCatalogForCustomer(sendCode)
  if (data.status !== "ACTIVE") throw notFound()
  return jsonResponse(data)
})

export const dynamic = "force-dynamic"
