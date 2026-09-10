import { notFound } from "@/core/http/errors"
import { hasCapability } from "@/core/rbac/capabilities"
import type { TenantContext } from "@/core/tenancy"
import { filterProductLookup, type ProductLookupResult } from "@/modules/products/domain/product-lookup"
import { ProductRepository } from "@/modules/products/infra/product-repository"
import { PricingRuleRepository } from "@/modules/products/infra/pricing-rule-repository"

/**
 * `GET /products/:id` (`L1`, đặc tả 06 mục 6). M03 — áp `filterProductLookup`
 * để khối `pricing` (cấu hình giá của tổ chức) chỉ đi ra khi có `L5`
 * (`pricing.read`), đúng ranh giới bảng ở đặc tả 06 ("GET /pricing-rules gác
 * bằng L5").
 */
export async function getProduct(ctx: TenantContext, id: string): Promise<ProductLookupResult> {
  const product = await new ProductRepository().findById(ctx, id)
  if (!product) throw notFound()

  const canReadPricing = hasCapability(ctx, "L5")
  const pricingRuleRows = canReadPricing ? await new PricingRuleRepository().currentRows(ctx) : []

  return filterProductLookup(
    {
      id: product.id,
      code: product.code,
      name: product.name,
      category: product.category,
      shape: product.shape,
      facing: product.facing,
      container: product.container,
      status: product.status,
      branch_id: product.branch_id,
    },
    pricingRuleRows,
    { canReadPricing, branchId: ctx.branchId }
  )
}
