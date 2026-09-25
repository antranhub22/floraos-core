import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { parseBody, qcInspectionSchema } from "@/modules/coordinator/adapters/http-schemas"
import { recordQcInspection } from "@/modules/coordinator/use-cases/operations"

type Params = { params: Promise<{ id: string }> }

/** `POST /api/v1/coordinator/orders/:id/qc` (R3) — kết luận QC do người kiểm (F10). Không nhận điểm AI từ client. */
export const POST = handle(async (request, context: Params) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R3")
  const { id } = await context.params
  const body = await parseBody(request, qcInspectionSchema)
  const order = await recordQcInspection(ctx, id, body)
  return jsonResponse({ order })
})
