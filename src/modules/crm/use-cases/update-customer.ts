/**
 * Use-case: Update Customer.
 */

import { notFound, validationFailed } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy/tenant-context"
import { isValidVietnamesePhone, normalizeVietnamesePhone } from "../domain/crm-rules"
import type { CustomerMasterIndex } from "../domain/customer-master-index"
import { CustomerRepository, type UpdateCustomerInput } from "../infra/customer-repository"

export async function updateCustomer(
  ctx: TenantContext,
  id: string,
  input: UpdateCustomerInput,
  repo: CustomerRepository = new CustomerRepository()
): Promise<CustomerMasterIndex> {
  if (input.name !== undefined && !input.name.trim()) {
    throw validationFailed({ name: "Tên khách hàng không được để trống" })
  }

  let phone = input.phone
  if (phone !== undefined) {
    if (!isValidVietnamesePhone(phone)) {
      throw validationFailed({ phone: "Số điện thoại Việt Nam không hợp lệ" })
    }
    phone = normalizeVietnamesePhone(phone)
  }

  const updated = await repo.update(ctx, id, { ...input, phone })
  if (!updated) {
    throw notFound()
  }

  return updated
}
