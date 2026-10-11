import { z } from "zod"
import { validationFailed, unprocessable } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { coordinatorConfirmDepositPayment } from "@/modules/greeting-card/use-cases/confirm-brochure-payment"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"
import { parsePaymentPolicy, resolveTrackingTriggerPolicy } from "@/modules/greeting-card/domain/brochure-payment-policy"
import { GreetingCardRepository } from "@/modules/greeting-card/infra/greeting-card-repository"

const schema = z.object({
  note: z.string().trim().max(500).nullable().optional(),
})

/**
 * POST /api/v1/greeting-card/orders/[id]/confirm-deposit
 * Điều phối xác nhận đã nhận tiền đặt cọc (hoặc toàn phần) qua ảnh bill của khách.
 * Chỉ hoạt động khi policy cho phép Điều phối (PAYMENT_OR_COORDINATOR).
 */
export const POST = handle<[{ params: Promise<{ id: string }> }]>(async (request, context) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.assignFlorist)

  const { id } = await context.params

  const repo = new GreetingCardRepository()
  const shop = await repo.getShopProfile(ctx.organizationId)
  const policy = parsePaymentPolicy(shop.settings)
  const triggerPolicy = resolveTrackingTriggerPolicy(policy)
  if (triggerPolicy === "PAYMENT_ONLY") {
    throw unprocessable("Cài đặt của cửa hàng yêu cầu chỉ Điều hành mới được duyệt tiền cọc")
  }

  const body = await request.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  const result = await coordinatorConfirmDepositPayment(ctx, id, { note: parsed.data.note })
  return jsonResponse({ data: result })
})

export const dynamic = "force-dynamic"
