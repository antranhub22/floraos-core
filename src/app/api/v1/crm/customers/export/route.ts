/**
 * GET /api/v1/crm/customers/export
 *
 * Xuất / Sao lưu danh sách khách hàng ra Excel (.xlsx) hoặc JSON.
 * Query params:
 *   format  — "xlsx" (mặc định) | "json"
 *   tier    — NEW | BRONZE | SILVER | GOLD | VIP (tùy chọn)
 *   search  — từ khóa tìm kiếm (tùy chọn)
 *
 * Yêu cầu năng lực: Q1 (crm.customer.read) hoặc Q5 (crm.customer.export)
 */

import { handle } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { exportCustomers } from "@/modules/crm/use-cases/export-customers"

export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)

  // PO 14/10/2026: xuất Excel chỉ Điều hành; người khác cần Điều hành cấp quyền R13
  requireCapability(ctx, "R13")

  const url = new URL(request.url)
  const formatParam = url.searchParams.get("format")
  const format = formatParam === "json" ? "json" : "xlsx"
  const tier = url.searchParams.get("tier") ?? undefined
  const search = url.searchParams.get("search") ?? undefined

  const result = await exportCustomers(ctx, { format, tier, search })

  return new Response(result.data as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Cache-Control": "no-store",
    },
  })
})
