import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { parseBody, recordPaymentSchema } from "@/modules/coordinator/adapters/http-schemas"
import { listCoordinatorPayments, recordCoordinatorPayment } from "@/modules/coordinator/use-cases/record-payment"

type Params = { params: Promise<{ id: string }> }

/** `GET /api/v1/coordinator/orders/:id/payments` (R1, ĐP-4a) — sổ thu của một đơn. */
export const GET = handle(async (request, context: Params) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R1")
  const { id } = await context.params
  const payments = await listCoordinatorPayments(ctx, id)
  return jsonResponse({ payments })
})

/**
 * `POST /api/v1/coordinator/orders/:id/payments` (ĐP-4a, 26/09/2026, PO D2) —
 * ghi một dòng sổ thu. `kind = DEPOSIT/BALANCE` đòi R9 (Sales + Điều phối);
 * `kind = REFUND` đòi R10 (trần cứng điều hành — hoàn tiền ảnh hưởng doanh
 * thu đã ghi nhận, khác việc chỉ ghi nhận đã thu).
 */
export const POST = handle(async (request, context: Params) => {
  const { ctx } = await requireTenantContext(request)
  const { id } = await context.params
  const body = await parseBody(request, recordPaymentSchema)
  if (body.kind === "REFUND") {
    requireCapability(ctx, "R10")
  } else {
    requireCapability(ctx, "R9")
  }
  const order = await recordCoordinatorPayment(ctx, id, body)
  return jsonResponse({ order }, { status: 201 })
})
