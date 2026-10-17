import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { ReportedPaymentCheckRepository } from "@/modules/greeting-card/infra/reported-payment-check-repository"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"

const schema = z.discriminatedUnion("outcome", [
  z.object({ outcome: z.literal("REFUNDED"), amountVnd: z.number().int().positive().max(1_000_000_000), note: z.string().max(1000).optional().default("") }),
  z.object({ outcome: z.literal("NOT_RECEIVED"), note: z.string().max(1000).optional().default("") }),
])

/**
 * `POST /api/v1/greeting-card/orders/:id/reported-payment-check`
 * Đơn đã huỷ khi khách đã báo chuyển khoản mà tiệm chưa ghi nhận tiền: Điều hành kiểm sao kê rồi chốt
 * "đã hoàn tiền cho khách" (ghi sổ thu) hoặc "không nhận được tiền". Huỷ → R6; đã hoàn tiền → thêm R10.
 */
export const POST = handle<[{ params: Promise<{ id: string }> }]>(async (request, context) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.orderCancel)
  const { id } = await context.params
  const parsed = schema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  if (parsed.data.outcome === "REFUNDED") requireCapability(ctx, GREETING_CARD_CAPABILITY.paymentRefund)

  const input = parsed.data.outcome === "REFUNDED"
    ? { outcome: "REFUNDED" as const, amountVnd: parsed.data.amountVnd, note: parsed.data.note }
    : { outcome: "NOT_RECEIVED" as const, amountVnd: 0, note: parsed.data.note }
  return jsonResponse({ data: await new ReportedPaymentCheckRepository().resolve(ctx, id, input) })
})

export const dynamic = "force-dynamic"
