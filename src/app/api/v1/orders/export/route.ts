/**
 * GET /api/v1/orders/export
 *
 * Xuất danh sách đơn hàng ra file Excel (.xlsx).
 * Query params:
 *   from_date  — YYYY-MM-DD, ngày bắt đầu (UTC+7), tùy chọn
 *   to_date    — YYYY-MM-DD, ngày kết thúc (UTC+7), tùy chọn
 *
 * Yêu cầu năng lực: R1 (order.read)
 */

import { handle } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { exportOrdersToExcel } from "@/modules/orders/use-cases/export-orders"

export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  const url = new URL(request.url)
  const fromDate = url.searchParams.get("from_date") ?? undefined
  const toDate = url.searchParams.get("to_date") ?? undefined
  const source = url.searchParams.get("source") ?? undefined // BROCHURE | MANUAL | CHAT

  // PO 14/10/2026: xuất Excel chỉ Điều hành; người khác cần Điều hành cấp quyền R13
  requireCapability(ctx, "R13")

  const buffer = await exportOrdersToExcel(ctx, { fromDate, toDate, source })

  const now = new Date()
  const dateSuffix = now.toISOString().slice(0, 10).replace(/-/g, "")
  const prefix = source === "BROCHURE" ? "the-chao" : "don-hang"
  const filename = `${prefix}-${dateSuffix}.xlsx`

  return new Response(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
})
