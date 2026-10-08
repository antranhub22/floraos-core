import { normalizePhone } from "../domain/greeting-card-rules"
import {
  awaitingQuote,
  computeQuote,
  parseShippingConfig,
  voucherBlocker,
  type BrochureQuote,
  type PricedVariant,
  type VoucherFacts,
} from "../domain/brochure-pricing"
import type { GreetingCatalogProduct } from "../domain/greeting-card-types"
import type { PromotionPricing } from "../domain/promotion-pricing"
import { resolveAppliedPolicies } from "../domain/store-policy"
import { selectPromotion } from "../domain/order-policies"
import { BrochureCheckoutRepository } from "../infra/brochure-checkout-repository"

export interface QuoteRequest {
  variantId?: string | undefined
  quantity?: number | undefined
  shippingZoneId?: string | undefined
  voucherCode?: string | undefined
  customerPhone?: string | undefined
  /** Ưu đãi khách chọn — máy chủ tra lại trong ưu đãi bộ sưu tập đang áp dụng. */
  selectedPromotionId?: string | undefined
  /** Ngày giao khách đang chọn — để báo các khung giờ đã kín (`fullSlots`). */
  deliveryDate?: string | undefined
}

export interface QuoteResult {
  quote: BrochureQuote
  variant: PricedVariant | null
  voucher: VoucherFacts | null
  /** Lỗi theo trường (tiếng Việt). Báo giá vẫn trả số tạm tính khi có lỗi. */
  errors: Record<string, string>
  /** Nhãn khung giờ đã đủ đơn của `deliveryDate` (chỉ báo giá trên trang khách trả). */
  fullSlots?: string[]
}

/**
 * Ưu đãi (phần tính tiền) cho một báo giá: tra lựa chọn của khách trong ưu đãi bộ sưu tập đang áp
 * dụng. Lựa chọn không còn hợp lệ → báo lỗi trường, tính như không có ưu đãi.
 */
export function promotionForQuote(
  catalogFilters: unknown,
  shopSettings: unknown,
  selectedPromotionId: string | undefined
): { promotion: PromotionPricing | null; error: string | null } {
  const chosen = selectPromotion(resolveAppliedPolicies(catalogFilters, shopSettings), selectedPromotionId)
  if (!chosen.ok) return { promotion: null, error: chosen.message }
  return { promotion: chosen.promotion ? { kind: chosen.promotion.kind, percent: chosen.promotion.percent } : null, error: null }
}

/**
 * Báo giá một mẫu theo lựa chọn của khách. Mọi con số (giá biến thể, phí
 * giao, giảm giá, ưu đãi) lấy từ dữ liệu của tiệm ở server; client chỉ gửi lựa chọn.
 */
export async function quoteForProduct(
  organizationId: string,
  product: GreetingCatalogProduct,
  req: QuoteRequest,
  shopSettings: unknown,
  checkout = new BrochureCheckoutRepository(),
  promotion: PromotionPricing | null = null
): Promise<QuoteResult> {
  const errors: Record<string, string> = {}

  const variants = product.variants ?? []
  let variant: PricedVariant | null = null
  if (req.variantId) {
    variant = variants.find((v) => v.id === req.variantId) ?? null
    if (!variant) errors.variantId = "Size/biến thể đã chọn không còn bán"
  }

  const shipping = parseShippingConfig(shopSettings)
  let zone = null
  if (shipping.zones.length > 0) {
    zone = shipping.zones.find((z) => z.id === req.shippingZoneId) ?? null
    if (!zone) errors.shippingZoneId = "Vui lòng chọn khu vực giao hoa"
  }

  const unitPriceVnd = variant?.priceVnd ?? product.price
  const quantity = req.quantity ?? 1
  // Tiệm tắt mã giảm giá (mặc định): ô nhập bị ẩn, mã gửi thẳng API cũng bị bỏ qua
  const code = shipping.vouchersEnabled ? req.voucherCode?.trim() : undefined
  if (unitPriceVnd === null) {
    // Mẫu chưa niêm yết giá: nhận đơn, cửa hàng báo giá trọn gói sau (ưu đãi trừ lúc báo giá)
    if (code) errors.voucherCode = "Mẫu này chưa niêm yết giá nên chưa áp dụng được mã giảm giá"
    return { quote: awaitingQuote(quantity, zone), variant, voucher: null, errors }
  }
  let voucher: VoucherFacts | null = null
  if (code) {
    const found = await checkout.findVoucher(organizationId, code)
    if (!found) {
      errors.voucherCode = "Mã giảm giá không tồn tại"
    } else {
      const customerId = await checkout.findCustomerIdByPhone(organizationId, normalizePhone(req.customerPhone))
      const blocker = voucherBlocker(found, unitPriceVnd * quantity, customerId)
      if (blocker) errors.voucherCode = blocker
      else voucher = found
    }
  }

  return { quote: computeQuote({ unitPriceVnd, quantity, zone, shipping, voucher, promotion }), variant, voucher, errors }
}
