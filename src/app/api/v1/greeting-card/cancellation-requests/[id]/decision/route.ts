import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { CancellationRepository } from "@/modules/greeting-card/infra/cancellation-repository"
import { requireCapability } from "@/core/rbac/capabilities"

const decisionSchema = z.object({
  approve: z.boolean(),
  note: z.string().optional().default(""),
  actualRefundVnd: z.number().nonnegative().optional(),
})

/**
 * `POST /api/v1/greeting-card/cancellation-requests/:id/decision`
 * Điều hành (R6 / F2) phê duyệt hoặc từ chối đề xuất Hủy/Hoàn tiền.
 */
export const POST = handle<[{ params: Promise<{ id: string }> }]>(async (request, context) => {
  const { ctx } = await requireTenantContext(request)

  // Gác quyền Điều hành: R6 (hủy đơn) hoặc F2 (phê duyệt chiết khấu/tài chính)
  const isOperator = ctx.capabilities.has("R6") || ctx.capabilities.has("F2")
  if (!isOperator) {
    requireCapability(ctx, "R6")
  }

  const { id } = await context.params
  const parsed = decisionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  const repo = new CancellationRepository()
  const result = await repo.decide(ctx, {
    requestId: id,
    approve: parsed.data.approve,
    note: parsed.data.note,
    actualRefundVnd: parsed.data.actualRefundVnd,
  })

  return jsonResponse({ data: result })
})
