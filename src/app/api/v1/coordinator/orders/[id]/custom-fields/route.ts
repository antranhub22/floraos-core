import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { parseBody, updateCustomFieldsSchema } from "@/modules/coordinator/adapters/http-schemas"
import { updateCoordinatorCustomFields } from "@/modules/coordinator/use-cases/update-order-custom-fields"

type Params = { params: Promise<{ id: string }> }

/** `PATCH /api/v1/coordinator/orders/:id/custom-fields` (R3, ĐP-3.16) — sửa giá trị trường tự tạo của đơn. */
export const PATCH = handle(async (request, context: Params) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R3")
  const { id } = await context.params
  const body = await parseBody(request, updateCustomFieldsSchema)
  const order = await updateCoordinatorCustomFields(ctx, id, body.customFields)
  return jsonResponse({ order })
})
