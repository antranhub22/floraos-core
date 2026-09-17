/**
 * Use-case: List Customers.
 */

import type { TenantContext } from "@/core/tenancy/tenant-context"
import type { CustomerMasterIndex, CustomerTier } from "../domain/customer-master-index"
import { CustomerRepository } from "../infra/customer-repository"

export async function listCustomers(
  ctx: TenantContext,
  filters?: { tier?: CustomerTier | undefined; search?: string | undefined },
  pagination?: { limit?: number | undefined; offset?: number | undefined },
  repo: CustomerRepository = new CustomerRepository()
): Promise<{ items: CustomerMasterIndex[]; total: number }> {
  return repo.list(ctx, filters, pagination)
}
