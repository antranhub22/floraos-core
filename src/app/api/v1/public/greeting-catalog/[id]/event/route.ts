import { z } from "zod"
import { notFound, validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { enforceRateLimit } from "@/core/http/rate-limit"
import { CATALOG_EVENT_TYPES } from "@/modules/greeting-card/domain/catalog-channel"
import { recordCatalogEvent } from "@/modules/greeting-card/use-cases/catalog-channel-events"

// ORDER chỉ ghi phía máy chủ khi đơn tạo thành công — khách không tự khai được
const bodySchema = z.object({
  type: z.enum(CATALOG_EVENT_TYPES).exclude(["ORDER"]),
  channel: z.string().max(32).optional(),
  visitorId: z.string().min(8).max(64),
})

/** POST /api/v1/public/greeting-catalog/[id]/event — đếm lượt xem/xem chi tiết/mở form theo kênh. */
export const POST = handle<[{ params: Promise<{ id: string }> }]>(async (request, context) => {
  await enforceRateLimit(request, { scope: "greeting-catalog-event", limit: 60, windowMs: 10 * 60_000 })
  const { id } = await context.params
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ body: "Sự kiện không hợp lệ" })
  const ok = await recordCatalogEvent({ catalogId: id, channel: parsed.data.channel, eventType: parsed.data.type, visitorId: parsed.data.visitorId })
  if (!ok) throw notFound()
  return jsonResponse({ ok: true }, { status: 202 })
})

export const dynamic = "force-dynamic"
