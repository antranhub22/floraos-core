import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { enforceRateLimit } from "@/core/http/rate-limit"
import { issuesToDetails, publicOrderBodySchema, rejectBotSubmission } from "@/modules/greeting-card/contracts/public-order-schema"
import { submitPublicCatalogOrder } from "@/modules/greeting-card/use-cases/submit-public-catalog-order"
import { recordCatalogEvent } from "@/modules/greeting-card/use-cases/catalog-channel-events"
import { log } from "@/core/observability/log"

const bodySchema = publicOrderBodySchema.extend({
  productId: z.string().min(1).max(64),
  tracking: z.object({ channel: z.string().max(32).optional(), visitorId: z.string().min(8).max(64) }).optional(),
})

/** POST /api/v1/public/greeting-catalog/[id]/order — đặt hoa từ link bộ sưu tập công khai. */
export const POST = handle<[{ params: Promise<{ id: string }> }]>(async (request, context) => {
  await enforceRateLimit(request, { scope: "greeting-catalog-order", limit: 10, windowMs: 10 * 60_000 })
  const { id } = await context.params
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed(issuesToDetails(parsed.error.issues))
  rejectBotSubmission(parsed.data)
  const { tracking, ...input } = parsed.data
  const result = await submitPublicCatalogOrder(id, input)
  // Thống kê theo kênh: lỗi ghi không bao giờ làm hỏng đơn của khách
  if (tracking) {
    await recordCatalogEvent({ catalogId: id, channel: tracking.channel, eventType: "ORDER", visitorId: tracking.visitorId, orderId: result.orderId })
      .catch((err) => log.warn("greeting-catalog: ghi sự kiện ORDER lỗi", { err: String(err) }))
  }
  return jsonResponse(result, { status: 201 })
})

export const dynamic = "force-dynamic"
