import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { getOrderPrintout } from "@/modules/orders/use-cases/get-order-printout"

/** `GET /api/v1/orders/:id/print` (R7) — Phiếu in đơn và phiếu sản xuất */
export const GET = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R7")

  const { id } = await context.params

  const printData = await getOrderPrintout(ctx, id)
  return jsonResponse({ print: printData })
})
