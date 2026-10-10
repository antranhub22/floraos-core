/**
 * Truy vấn infra cho xuất khẩu dữ liệu khách hàng.
 * Tách riêng để use-case export-customers không import Prisma trực tiếp.
 */

import { prisma } from "@/core/tenancy/infra/prisma"
import type { TenantContext } from "@/core/tenancy"

const MAX_CUSTOMERS = 10_000

export interface CustomerExportFilter {
  tier?: string | undefined
  search?: string | undefined
}

export async function queryCustomersForExport(ctx: TenantContext, filter: CustomerExportFilter = {}) {
  const where = {
    organization_id: ctx.organizationId,
    ...(filter.tier ? { tier: filter.tier as never } : {}),
    ...(filter.search
      ? {
          OR: [
            { name: { contains: filter.search, mode: "insensitive" as const } },
            { phone: { contains: filter.search } },
            { code: { contains: filter.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  }

  return prisma.customers.findMany({
    where,
    orderBy: { created_at: "desc" },
    take: MAX_CUSTOMERS,
    include: {
      occasions: { orderBy: { date: "asc" } },
    },
  })
}
