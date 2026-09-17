/**
 * GET /api/v1/crm/customers/[id]/master-index
 * Trích xuất Customer Master Index đầy đủ.
 * Quyền: Q1
 */

import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { getCustomerMasterIndex } from "@/modules/crm/use-cases/get-customer-master-index"

export const GET = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "Q1")

  const { id } = await context.params
  const customer = await getCustomerMasterIndex(ctx, id)
  return jsonResponse({ masterIndex: customer })
})
