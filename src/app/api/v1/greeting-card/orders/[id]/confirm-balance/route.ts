import { z } from "zod"
import { validationFailed, unprocessable } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { coordinatorConfirmBalancePayment } from "@/modules/greeting-card/use-cases/confirm-brochure-payment"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"
import { parsePaymentPolicy, resolveBalancePaymentTriggerPolicy } from "@/modules/greeting-card/domain/brochure-payment-policy"
import { GreetingCardRepository } from "@/modules/greeting-card/infra/greeting-card-repository"

const schema = z.object({
  note: z.string().trim().max(500).nullable().optional(),
})

/**
 * POST /api/v1/greeting-card/orders/[id]/confirm-balance
 * Điều phối xác nhận đã nhận đủ tiền thanh toán lần 2 (balance) cho đơn đặt cọc.
 * Chỉ hoạt động khi policy = PAYMENT_OR_COORDINATOR (trần cứng phía server).
 */
export const POST = handle<[{ params: Promise<{ id: string }> }]>(async (request, context) => {
  const { ctx } = await requireTenantContext(request)
  // Điều phối cần ít nhất quyền assignFlorist (R4) — tương đương vai Điều phối
  requireCapability(ctx, GREETING_CARD_CAPABILITY.assignFlorist)

  const { id } = await context.params

  // Trần cứng: kiểm tra policy trước khi cho phép Điều phối xác nhận lần 2
  const repo = new GreetingCardRepository()
  const shop = await repo.getShopProfile(ctx.organizationId)
  const policy = parsePaymentPolicy(shop.settings)
  const balancePolicy = resolveBalancePaymentTriggerPolicy(policy)
  if (balancePolicy === "PAYMENT_ONLY") {
    throw unprocessable("Cài đặt của cửa hàng yêu cầu chỉ Điều hành mới được xác nhận thanh toán lần 2")
  }

  const body = await request.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  const result = await coordinatorConfirmBalancePayment(ctx, id, { note: parsed.data.note })
  return jsonResponse({ data: result })
})

export const dynamic = "force-dynamic"
