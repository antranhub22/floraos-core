/**
 * Use-case: Get Customer Master Index.
 */

import { notFound } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy/tenant-context"
import type { CustomerMasterIndex } from "../domain/customer-master-index"
import { CustomerRepository } from "../infra/customer-repository"

export async function getCustomerMasterIndex(
  ctx: TenantContext,
  id: string,
  repo: CustomerRepository = new CustomerRepository()
): Promise<CustomerMasterIndex> {
  const customer = await repo.getById(ctx, id)
  if (!customer) {
    throw notFound()
  }

  // Tự động đồng bộ chi tiêu mới nhất từ đơn hàng M10
  await repo.syncMetricsFromOrders(ctx, id)

  // Đọc lại sau khi sync
  const refreshed = await repo.getById(ctx, id)
  return refreshed ?? customer
}
