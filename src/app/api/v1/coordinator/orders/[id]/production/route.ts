import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { parseBody, productionUpdateSchema } from "@/modules/coordinator/adapters/http-schemas"
import { recordProductionUpdate } from "@/modules/coordinator/use-cases/operations"

type Params = { params: Promise<{ id: string }> }

/** `POST /api/v1/coordinator/orders/:id/production` (R3) — tiến độ cắm, báo cắm xong kèm ảnh, báo thiếu vật liệu (F08). */
export const POST = handle(async (request, context: Params) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R3")
  const { id } = await context.params
  const body = await parseBody(request, productionUpdateSchema)
  const order = await recordProductionUpdate(ctx, id, body)
  return jsonResponse({ order })
})
