import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { enforceRateLimit } from "@/core/http/rate-limit"
import { issuesToDetails, publicQuoteBodySchema } from "@/modules/greeting-card/contracts/public-order-schema"
import { quotePublicCatalog } from "@/modules/greeting-card/use-cases/submit-public-catalog-order"

const bodySchema = publicQuoteBodySchema.extend({ productId: z.string().min(1).max(64) })

/** POST /api/v1/public/greeting-catalog/[id]/quote — báo giá trên link bộ sưu tập công khai. */
export const POST = handle<[{ params: Promise<{ id: string }> }]>(async (request, context) => {
  await enforceRateLimit(request, { scope: "greeting-catalog-quote", limit: 60, windowMs: 60_000 })
  const { id } = await context.params
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed(issuesToDetails(parsed.error.issues))
  const { productId, ...req } = parsed.data
  const { quote, errors } = await quotePublicCatalog(id, productId, req)
  return jsonResponse({ quote, errors })
})

export const dynamic = "force-dynamic"
