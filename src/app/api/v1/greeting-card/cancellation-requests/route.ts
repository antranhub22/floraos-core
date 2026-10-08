import { z } from "zod"
import { AppError, validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { CancellationRepository } from "@/modules/greeting-card/infra/cancellation-repository"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"
import { roleOf } from "@/modules/greeting-card/domain/internal-message"

const createSchema = z.object({
  orderId: z.string().min(1, "Mã đơn hàng không được để trống"),
  type: z.enum(["CANCEL_ONLY", "FULL_REFUND", "PARTIAL_REFUND"]),
  reason: z.string().trim().min(3, "Lý do hủy/hoàn phải có ít nhất 3 ký tự").max(1000),
  refundAmountVnd: z.number().int().nonnegative().max(10_000_000_000).optional().default(0),
  note: z.string().max(1000).optional(),
})

/**
 * `POST /api/v1/greeting-card/cancellation-requests`
 * Sale / Điều phối đề xuất Hủy đơn hoặc Hoàn tiền (Task #1). Cần R1 và một vai nhắn nội bộ.
 */
export const POST = handle(async (req: Request) => {
  const { ctx } = await requireTenantContext(req)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.orderRead)
  const senderRole = roleOf(ctx.capabilities)
  if (!senderRole) requireCapability(ctx, GREETING_CARD_CAPABILITY.manage)

  const parsed = createSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  const result = await new CancellationRepository().createProposal(ctx, {
    orderId: parsed.data.orderId,
    senderRole: senderRole ?? "SALE",
    proposal: {
      type: parsed.data.type,
      reason: parsed.data.reason,
      refundAmountVnd: parsed.data.refundAmountVnd,
      note: parsed.data.note,
    },
  })

  return jsonResponse({ data: result }, { status: 201 })
})

/**
 * `GET /api/v1/greeting-card/cancellation-requests`
 * Danh sách đề xuất đang chờ duyệt — chỉ Điều hành (R6 hủy đơn hoặc R10 hoàn tiền).
 */
export const GET = handle(async (req: Request) => {
  const { ctx } = await requireTenantContext(req)
  const { orderCancel, paymentRefund } = GREETING_CARD_CAPABILITY
  if (!ctx.capabilities.has(orderCancel) && !ctx.capabilities.has(paymentRefund)) {
    throw new AppError("CAPABILITY_DENIED", `Thiếu năng lực ${orderCancel}`, { capability: orderCancel })
  }
  const pending = await new CancellationRepository().listPending(ctx)
  return jsonResponse({ data: pending })
})
