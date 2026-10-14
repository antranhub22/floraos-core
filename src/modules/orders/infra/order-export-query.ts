/**
 * Truy vấn infra cho xuất khẩu dữ liệu đơn hàng.
 * Tách riêng để use-case export-orders không import Prisma trực tiếp.
 */

import { prisma } from "@/core/tenancy/infra/prisma"
import type { TenantContext } from "@/core/tenancy"

const MAX_ROWS = 5_000

export interface OrderExportFilter {
  source?: string | undefined
  fromDate?: Date | undefined
  toDate?: Date | undefined
}

export async function queryOrdersForExport(ctx: TenantContext, filter: OrderExportFilter = {}) {
  const where = {
    organization_id: ctx.organizationId,
    ...(filter.source ? { source: filter.source } : {}),
    ...(filter.fromDate || filter.toDate
      ? {
          created_at: {
            ...(filter.fromDate ? { gte: filter.fromDate } : {}),
            ...(filter.toDate ? { lte: filter.toDate } : {}),
          },
        }
      : {}),
  }

  return prisma.orders.findMany({
    where,
    orderBy: { created_at: "desc" },
    take: MAX_ROWS,
    include: {
      items: true,
      customer: {
        select: { id: true, code: true, name: true, phone: true, tier: true },
      },
      payments: {
        select: {
          id: true,
          kind: true,
          amount_vnd: true,
          payment_method: true,
          reference: true,
          collected_at: true,
          collected_by: true,
          note: true,
        },
        orderBy: { collected_at: "asc" },
      },
      greeting_sessions: {
        select: {
          id: true,
          send_code: true,
          sale_id: true,
          customer_name: true,
          customer_phone: true,
          status: true,
        },
        take: 3,
      },
    },
  })
}
