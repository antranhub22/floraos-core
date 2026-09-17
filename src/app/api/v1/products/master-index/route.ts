/**
 * GET /api/v1/products/master-index
 * Lấy danh sách sản phẩm kèm Master Index đầy đủ (BOM hoa, ảnh mẫu, giá, tone màu).
 * Quyền: L1 (Xem sản phẩm).
 */

import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { listProductMasterIndex } from "@/modules/products/use-cases/get-product-master-index"

export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "L1")

  const url = new URL(request.url)
  const limitParam = url.searchParams.get("limit")
  const limit = limitParam ? Number(limitParam) : 50

  const items = await listProductMasterIndex(ctx, Number.isNaN(limit) ? 50 : limit)
  return jsonResponse({ items, count: items.length })
})
