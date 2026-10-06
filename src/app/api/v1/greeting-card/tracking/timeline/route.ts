import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"
import { getTrackingTimeline } from "@/modules/greeting-card/use-cases/get-tracking-timeline"

const schema = z
  .object({
    orderId: z.string().max(64).optional(),
    sessionId: z.string().max(64).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    cursor: z.string().regex(/^\d{1,6}$/).optional(),
  })
  .refine((v) => v.orderId || v.sessionId, { message: "Cần orderId hoặc sessionId" })

/** GET /api/v1/greeting-card/tracking/timeline?orderId=|sessionId= — dòng thời gian một đơn/link (R1): `{ segments, data: sự kiện, next_cursor, total }`. */
export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.orderRead)
  const raw = Object.fromEntries([...new URL(request.url).searchParams.entries()].filter(([, v]) => v !== ""))
  const parsed = schema.safeParse(raw)
  if (!parsed.success) throw validationFailed({ ref: "Cần orderId hoặc sessionId hợp lệ" })
  const { orderId, sessionId, limit, cursor } = parsed.data
  const tl = await getTrackingTimeline(ctx, { orderId, sessionId }, { limit, cursor })
  // Dạng danh sách phân trang chung: `data` = sự kiện, kèm các bước đã qua
  return jsonResponse({ orderId: tl.orderId, sessionId: tl.sessionId, segments: tl.segments, data: tl.events.data, next_cursor: tl.events.next_cursor, total: tl.events.total })
})
