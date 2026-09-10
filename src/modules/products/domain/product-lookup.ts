/**
 * Ranh giới dữ liệu của một lượt tra cứu sản phẩm — M03, P6. Giữ lại đúng
 * HÌNH DẠNG của `FloraOS/floraos-web/src/lib/locTraCuu.ts` (thu hoạch R,
 * REUSE theo `HARVEST_MANIFEST.md`): kê tên trường được đi ra (không xoá
 * theo danh sách cấm), rồi cắt theo mã năng lực.
 *
 * Bản gốc lọc một BẢN GHI GIÁ ĐÃ TÍNH SẴN theo từng mã sản phẩm (giá bán công
 * bố, khoảng giá chào khách, giá đối tác…) — dữ liệu đó chỉ có khi luồng "thẻ
 * chào giá" tồn tại, ngoài phạm vi P6 (xác nhận 09/10, xem `pricing.ts`).
 * Ở đây, phần "giá" duy nhất còn lại trong phạm vi P6 là CẤU HÌNH giá của tổ
 * chức (`pricing_rules` — `partner_tier_bonus`/`surcharge_groups`/
 * `optimal_price_ratio`/`floor_ceiling_ratio`), không phải một mức giá đã
 * tính cho một sản phẩm cụ thể. Luật cắt giữ nguyên tinh thần bản gốc: kê tên
 * trường sản phẩm luôn đi ra, khối `pricing` chỉ đi ra khi năng lực `L5`
 * (`pricing.read`) có mặt — đúng bảng ở đặc tả 06 mục 6 (`GET /pricing-rules`
 * gác bằng `L5`).
 */

import type { FloorCeilingRatio, PricingRuleRow } from "./pricing-rules"
import { mergeEffectiveFloorCeilingRatio, mergeEffectivePricingConfig } from "./pricing-rules"

export interface ProductLookupRaw {
  id: string
  code: string
  name: string
  category: string | null
  shape: string | null
  facing: string | null
  container: string | null
  status: string
  branch_id: string | null
}

export interface ProductPricingSummary {
  partner_tier_bonus: Record<string, number>
  surcharge_groups: unknown[]
  optimal_price_ratio: number
  floor_ceiling_ratio: FloorCeilingRatio
}

export interface ProductLookupResult {
  id: string
  code: string
  name: string
  category: string | null
  shape: string | null
  facing: string | null
  container: string | null
  status: string
  branch_id: string | null
  /** `null` khi năng lực `L5` không có mặt — khác `null` do tổ chức chưa cấu hình. */
  pricing: ProductPricingSummary | null
  /** Kê tên khối bị cắt, để giao diện viết đúng câu — tương ứng `bi_cat` bản gốc. */
  redacted_fields: string[]
}

/**
 * Lọc một bản ghi sản phẩm theo năng lực của người xem. Kê tên trường sản
 * phẩm luôn đi ra nguyên vẹn; khối `pricing` cắt theo `canReadPricing` (`L5`).
 */
export function filterProductLookup(
  product: ProductLookupRaw,
  pricingRuleRows: PricingRuleRow[],
  options: { canReadPricing: boolean; branchId: string | null }
): ProductLookupResult {
  const redactedFields: string[] = []

  let pricing: ProductPricingSummary | null = null
  if (options.canReadPricing) {
    const config = mergeEffectivePricingConfig(pricingRuleRows, options.branchId)
    pricing = {
      partner_tier_bonus: config.partnerTierBonus,
      surcharge_groups: config.surchargeGroups,
      optimal_price_ratio: config.optimalPriceRatio,
      floor_ceiling_ratio: mergeEffectiveFloorCeilingRatio(pricingRuleRows, options.branchId),
    }
  } else {
    redactedFields.push("pricing")
  }

  return {
    id: product.id,
    code: product.code,
    name: product.name,
    category: product.category,
    shape: product.shape,
    facing: product.facing,
    container: product.container,
    status: product.status,
    branch_id: product.branch_id,
    pricing,
    redacted_fields: redactedFields,
  }
}
