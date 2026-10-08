import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { enforceRateLimit } from "@/core/http/rate-limit"
import { ORDER_FIELD_MAX } from "@/modules/greeting-card/domain/greeting-card-rules"
import { ADDRESS_PART_MAX } from "@/modules/greeting-card/domain/delivery-address"
import { DELIVERY_NOTE_MAX, MAP_URL_MAX } from "@/modules/greeting-card/domain/delivery-note"
import { CHANGE_NOTE_MAX } from "@/modules/greeting-card/domain/order-change-request"
import { issuesToDetails } from "@/modules/greeting-card/contracts/public-order-schema"
import { submitOrderChange } from "@/modules/greeting-card/use-cases/order-change"

const part = z.string().max(ADDRESS_PART_MAX)
const bodySchema = z.object({
  /** Khách mở trang không từ link của đơn → chứng minh bằng 4 số cuối SĐT người đặt. */
  phoneLast4: z.string().regex(/^\d{4}$/).optional(),
  deliveryDate: z.string().max(10).optional(),
  deliveryTimeSlot: z.string().max(ORDER_FIELD_MAX.timeSlot).optional(),
  recipientName: z.string().max(ORDER_FIELD_MAX.name).optional(),
  recipientPhone: z.string().max(20).optional(),
  addressParts: z.object({ houseNumber: part, street: part, ward: part, district: part.optional(), province: part }).optional(),
  shippingZoneId: z.string().max(40).optional(),
  cardMessage: z.string().max(ORDER_FIELD_MAX.cardMessage).optional(),
  deliveryNote: z.string().max(DELIVERY_NOTE_MAX).optional(),
  mapUrl: z.string().max(MAP_URL_MAX).optional(),
  note: z.string().max(CHANGE_NOTE_MAX).optional(),
})

/**
 * POST /api/v1/public/brochure/tracking/[code]/change-request?link=<mã link>
 * Người đặt xin đổi thông tin đơn (ngày giờ giao, người nhận, địa chỉ, lời nhắn, ghi chú giao).
 * Chỉ chủ phiên của link đơn, hoặc người nhập đúng 4 số cuối SĐT người đặt; khác → 404.
 * Cửa hàng duyệt rồi đơn mới đổi; khoá từ lúc bắt đầu cắm hoa.
 */
export const POST = handle<[{ params: Promise<{ code: string }> }]>(async (request, context) => {
  const { code } = await context.params
  const codeKey = code.toUpperCase().slice(0, 40)
  await enforceRateLimit(request, { scope: "brochure-change-request", limit: 10, windowMs: 10 * 60_000 })
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed(issuesToDetails(parsed.error.issues))
  const { phoneLast4, ...input } = parsed.data
  if (phoneLast4) {
    // Dùng chung bộ đếm với ô xác minh của trang theo dõi — không mở thêm đường dò 4 số cuối
    await enforceRateLimit(request, { scope: `brochure-tracking-verify:${codeKey}`, limit: 5, windowMs: 15 * 60_000 })
    await enforceRateLimit(request, { scope: `brochure-tracking-verify-code:${codeKey}`, limit: 10, windowMs: 86_400_000, key: "global" })
  }
  const link = new URL(request.url).searchParams.get("link")
  const result = await submitOrderChange(request, code, { sendCode: link, phoneLast4 }, input)
  return jsonResponse({ data: result }, { status: 201 })
})

export const dynamic = "force-dynamic"
