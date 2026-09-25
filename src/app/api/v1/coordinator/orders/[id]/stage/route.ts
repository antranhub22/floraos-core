import { z } from "zod"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { updateCoordinatorStage } from "@/modules/coordinator/use-cases/update-coordinator-stage"
import type { CoordinatorStage } from "@/modules/coordinator/domain/coordinator-types"

const updateStageSchema = z.object({
  stage: z.string(),
  nextAction: z.string().optional(),
})

/**
 * `PATCH /api/v1/coordinator/orders/[id]/stage` (R3) — Chuyển bước đơn hàng trong Control Tower.
 */
export const PATCH = handle(async (request, context) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R3")

  const { id } = await (context as { params: Promise<{ id: string }> }).params
  const body = await request.json()
  const parsed = updateStageSchema.parse(body)

  await updateCoordinatorStage(
    ctx,
    id,
    parsed.stage as CoordinatorStage,
    parsed.nextAction
  )

  return jsonResponse({ success: true, stage: parsed.stage })
})
