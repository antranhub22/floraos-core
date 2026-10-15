import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { getOrderSlip, setOrderVat } from "@/modules/greeting-card/use-cases/order-vat"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional()

const schema = z.object({
  enabled: z.boolean(),
  rate: z.union([z.literal(8), z.literal(10)]).default(10),
  companyName: optionalText(200),
  taxCode: z.string().trim().regex(/^(\d{10}|\d{10}-\d{3}|\d{12})?$/, "Mã số thuế gồm 10 hoặc 13 số (dạng 0123456789-001)").nullable().optional(),
  companyAddress: optionalText(300),
  email: z.union([z.literal(""), z.string().trim().email("Email nhận hoá đơn không hợp lệ").max(200)]).nullable().optional(),
})

type Ctx = { params: Promise<{ id: string }> }

/** GET /api/v1/greeting-card/orders/[id]/vat — VAT, tổng tiền + mã mẫu, ảnh gốc, ghi chú khách (Thẻ Đơn Khách hàng). */
export const GET = handle<[Ctx]>(async (request, context) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.orderRead)
  const { id } = await context.params
  return jsonResponse({ data: await getOrderSlip(ctx, id) })
})

/** PUT /api/v1/greeting-card/orders/[id]/vat — bật/tắt VAT 8%/10% và lưu thông tin xuất hoá đơn. */
export const PUT = handle<[Ctx]>(async (request, context) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.paymentRecord)
  const { id } = await context.params
  const parsed = schema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  return jsonResponse({ data: await setOrderVat(ctx, id, parsed.data) })
})
