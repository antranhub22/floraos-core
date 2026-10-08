import { z } from "zod"
import { notFound, validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { CancellationRepository } from "@/modules/greeting-card/infra/cancellation-repository"
import { decisionCapabilities } from "@/modules/greeting-card/domain/cancellation-request"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"
import { queueOrderNotification } from "@/modules/greeting-card/use-cases/notify-customer"

const decisionSchema = z.object({
  approve: z.boolean(),
  note: z.string().max(1000).optional().default(""),
  actualRefundVnd: z.number().int().nonnegative().max(10_000_000_000).optional(),
})

/**
 * `POST /api/v1/greeting-card/cancellation-requests/:id/decision`
 * Điều hành phê duyệt hoặc từ chối đề xuất Hủy/Hoàn tiền.
 * Hủy đơn đòi R6, có hoàn tiền đòi R10 — trần cứng điều hành, cùng luật sổ thu Điều phối.
 */
export const POST = handle<[{ params: Promise<{ id: string }> }]>(async (request, context) => {
  const { ctx } = await requireTenantContext(request)
  const { id } = await context.params
  const parsed = decisionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  const repo = new CancellationRepository()
  const type = await repo.getPendingType(ctx, id)
  if (!type) throw notFound()
  for (const code of decisionCapabilities(type, GREETING_CARD_CAPABILITY)) requireCapability(ctx, code)

  const result = await repo.decide(ctx, {
    requestId: id,
    approve: parsed.data.approve,
    note: parsed.data.note,
    actualRefundVnd: parsed.data.actualRefundVnd,
  })

  // Báo khách khi đơn bị huỷ theo đề xuất (như nút Huỷ của sổ thu)
  if (result.orderStatus === "CANCELLED" && parsed.data.approve) queueOrderNotification(ctx.organizationId, result.orderId, "CANCELLED")
  return jsonResponse({ data: result })
})
