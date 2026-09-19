import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { removeTemplateOverride } from "@/modules/templates/use-cases/remove-template-override"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"

/** `DELETE /template-overrides/:templateKey/:fieldKey` (nợ #99). */
export const DELETE = handle(
  async (request, context: { params: Promise<{ templateKey: string; fieldKey: string }> }) => {
    const { ctx } = await requireTenantContext(request)
    requireCapability(ctx, "F2")

    const { templateKey, fieldKey } = await context.params
    await removeTemplateOverride(ctx, templateKey, fieldKey)
    return jsonResponse({ ok: true })
  }
)
