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
import { hasCapability, requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { exportCustomers } from "@/modules/crm/use-cases/export-customers"

export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)

  // Q5 là năng lực xuất tệp riêng, Q1 là năng lực đọc khách hàng chung
  if (!hasCapability(ctx, "Q5") && !hasCapability(ctx, "Q1")) {
    requireCapability(ctx, "Q1")
  }

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
