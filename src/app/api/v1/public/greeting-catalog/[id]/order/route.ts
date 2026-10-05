import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { enforceRateLimit } from "@/core/http/rate-limit"
import { issuesToDetails, publicOrderBodySchema } from "@/modules/greeting-card/contracts/public-order-schema"
import { submitPublicCatalogOrder } from "@/modules/greeting-card/use-cases/submit-public-catalog-order"

const bodySchema = publicOrderBodySchema.extend({ productId: z.string().min(1).max(64) })

/** POST /api/v1/public/greeting-catalog/[id]/order — đặt hoa từ link bộ sưu tập công khai. */
export const POST = handle<[{ params: Promise<{ id: string }> }]>(async (request, context) => {
  enforceRateLimit(request, { scope: "greeting-catalog-order", limit: 10, windowMs: 10 * 60_000 })
  const { id } = await context.params
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed(issuesToDetails(parsed.error.issues))
  const result = await submitPublicCatalogOrder(id, parsed.data)
  return jsonResponse(result, { status: 201 })
})

export const dynamic = "force-dynamic"
