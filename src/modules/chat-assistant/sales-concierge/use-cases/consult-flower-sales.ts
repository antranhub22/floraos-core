/**
 * Use-case: Consult Flower Sales.
 * Tiếp nhận yêu cầu tư vấn mua hoa từ khách hàng và gợi ý mẫu hoa phù hợp.
 * Hoàn toàn cách ly với quy trình vận hành SaaS nội bộ.
 */

import { validationFailed } from "@/core/http/errors"
import { listProductMasterIndex } from "@/modules/products/use-cases/get-product-master-index"
import type { ProductMasterIndex } from "@/modules/products/domain/product-master-index"
import type { CustomerMasterIndex } from "@/modules/crm/domain/customer-master-index"
import { SalesConciergeProvider } from "../adapters/sales-concierge-provider"
import type { SalesConsultantOutput } from "../domain/sales-concierge-types"

export interface ConsultFlowerSalesInput {
  organizationId: string
  conversationId: string
  query: string
  customer?: CustomerMasterIndex | null | undefined
  masterProducts?: ProductMasterIndex[] | undefined
}

export async function consultFlowerSales(
  input: ConsultFlowerSalesInput,
  deps = {
    provider: new SalesConciergeProvider(),
  }
): Promise<SalesConsultantOutput> {
  const query = input.query.trim()
  if (!query) {
    throw validationFailed({ query: "Nội dung tin nhắn không được để trống" })
  }

  // Nạp danh mục hoa nếu chưa có
  let products = input.masterProducts
  if (!products) {
    const dummyCtx = {
      organizationId: input.organizationId,
      workspaceId: "system",
      userId: "shopper",
      branchId: null,
      capabilities: new Set<string>(),
    }
    products = await listProductMasterIndex(dummyCtx, 30).catch(() => [])
  }

  return deps.provider.send({
    query,
    conversationId: input.conversationId,
    customer: input.customer,
    masterProducts: products,
  })
}
