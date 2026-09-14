import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { approveAsset } from "@/modules/assets/use-cases/approve-asset"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"

/**
 * `POST /api/v1/assets/:id/approve` (`I2`)
 * Duyệt một asset (Master Image hoặc Biến thể Marketing M04b).
 * Gác quyền `I2` (trần cứng dieu_hanh).
 */
export const POST = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I2")

  const { id } = await context.params
  const asset = await approveAsset(ctx, id)
  return jsonResponse({ asset })
})
