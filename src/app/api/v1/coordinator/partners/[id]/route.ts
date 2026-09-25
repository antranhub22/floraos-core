import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { parseBody, updatePartnerSchema } from "@/modules/coordinator/adapters/http-schemas"
import { updatePartner } from "@/modules/coordinator/use-cases/manage-partners"

type Params = { params: Promise<{ id: string }> }

/** `PATCH /api/v1/coordinator/partners/:id` (R4) — sửa hồ sơ, tạm ngưng/mở lại đối tác. */
export const PATCH = handle(async (request, context: Params) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R4")
  const { id } = await context.params
  const body = await parseBody(request, updatePartnerSchema)
  const partner = await updatePartner(ctx, id, body)
  return jsonResponse({ partner })
})
