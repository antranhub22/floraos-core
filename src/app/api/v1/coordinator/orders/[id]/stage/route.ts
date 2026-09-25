import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { parseBody, updateStageSchema } from "@/modules/coordinator/adapters/http-schemas"
import type { CoordinatorStage } from "@/modules/coordinator/domain/coordinator-types"
import { updateCoordinatorStage } from "@/modules/coordinator/use-cases/update-coordinator-stage"

type Params = { params: Promise<{ id: string }> }

/** `PATCH /api/v1/coordinator/orders/:id/stage` (R3) — chuyển bước; máy chủ kiểm luồng và bằng chứng (409 nếu sai luồng). */
export const PATCH = handle(async (request, context: Params) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R3")
  const { id } = await context.params
  const body = await parseBody(request, updateStageSchema)
  const order = await updateCoordinatorStage(ctx, id, body.stage as CoordinatorStage, body.nextAction)
  return jsonResponse({ order })
})
