import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { getAiPolicy } from "@/modules/ai-governance/use-cases/get-ai-policy"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"

/**
 * Danh mục năng lực kèm trạng thái đo lường của từng mô hình (`U1`).
 *
 * Cùng nguồn với `GET /ai-policy` — một năng lực và chính sách của nó là một
 * thứ, không phải hai; tách endpoint chỉ để màn hình đọc danh mục mà không
 * phải đọc cả phần trần.
 */
export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "U1")
  const { capabilities } = await getAiPolicy(ctx)
  return jsonResponse({
    capabilities: capabilities.map((capability) => ({
      code: capability.capability_code,
      name: capability.capability_name,
      module: capability.module,
      kind: capability.kind,
      needs_approval: capability.needs_approval,
      privacy_floor: capability.privacy_floor,
      accept_threshold: capability.accept_threshold,
      measure_channels: capability.measure_channels,
      models: capability.allowed_models,
    })),
  })
})
