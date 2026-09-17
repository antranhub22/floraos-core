/**
 * GET /api/v1/products/[id]/master-index
 * Trích xuất Master Index chi tiết cho 1 sản phẩm cụ thể.
 * Quyền: L1 (Xem chi tiết sản phẩm).
 */

import { notFound } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { getProductMasterIndex } from "@/modules/products/use-cases/get-product-master-index"

export const GET = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "L1")

  const { id } = await context.params
  const masterIndex = await getProductMasterIndex(ctx, id)

  if (!masterIndex) {
    throw notFound()
  }

  return jsonResponse({ item: masterIndex })
})
