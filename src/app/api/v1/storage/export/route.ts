/**
 * "Tải dữ liệu cửa hàng" — bản sao lưu ZIP (Excel + data.json + ảnh gốc).
 *   GET  → lượt xuất gần nhất (trạng thái + link tải 24 giờ khi đã xong)
 *   POST → xếp một lượt xuất mới vào hàng đợi (đang có lượt chờ thì trả lại lượt đó)
 * Năng lực: `R13` (data.export) — mặc định chỉ Điều hành, vì tệp chứa dữ liệu khách hàng.
 */

import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { getStoreExport, requestStoreExport } from "@/modules/storage/use-cases/store-export"

export const GET = handle(async (request: Request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R13")
  return jsonResponse({ data: await getStoreExport(ctx) })
})

export const POST = handle(async (request: Request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "R13")
  return jsonResponse({ data: await requestStoreExport(ctx) }, { status: 202 })
})
