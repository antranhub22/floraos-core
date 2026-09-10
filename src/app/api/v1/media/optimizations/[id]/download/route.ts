import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { downloadOptimization } from "@/modules/media/use-cases/download-optimization"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"

/**
 * `GET /media/optimizations/:id/download` (`I3`, đặc tả 06 mục 8).
 *
 * Năng lực RIÊNG, không phải `I2`: tải ảnh về không phải là phê duyệt
 * (M04 mục 5.1). Trả URL ký sẵn có hạn, không stream byte qua route này.
 */
export const GET = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "I3")

  const { id } = await context.params
  return jsonResponse(await downloadOptimization(ctx, id))
})
