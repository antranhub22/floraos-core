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
import { BrochureCheckoutRepository } from "../infra/brochure-checkout-repository"
import { holidayOn, holidaySurcharge, parseHolidayPolicy } from "../domain/holiday-policy"

export interface QuoteRequest {
  variantId?: string | undefined
  quantity?: number | undefined
  shippingZoneId?: string | undefined
  voucherCode?: string | undefined
  customerPhone?: string | undefined
  /** Ngày giao `YYYY-MM-DD` — để tính phụ phí ngày lễ (nếu bộ sưu tập bật) */
  deliveryDate?: string | undefined
}

export interface QuoteResult {
  quote: BrochureQuote
  variant: PricedVariant | null
  voucher: VoucherFacts | null
  /** Lỗi theo trường (tiếng Việt). Báo giá vẫn trả số tạm tính khi có lỗi. */
  errors: Record<string, string>
}

/**
 * Báo giá một mẫu theo lựa chọn của khách. Mọi con số (giá biến thể, phí
 * giao, giảm giá) lấy từ dữ liệu của tiệm ở server; client chỉ gửi lựa chọn.
 */
export async function quoteForProduct(
  organizationId: string,
  product: GreetingCatalogProduct,
  req: QuoteRequest,
  shopSettings: unknown,
  checkout = new BrochureCheckoutRepository(),
  /** `catalog.filters` của bộ sưu tập khách đang đặt — quyết định có phụ phí ngày lễ không */
  catalogFilters?: unknown,
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
  if (unitPriceVnd === null) {
    // Mẫu chưa niêm yết giá: nhận đơn, cửa hàng báo giá trọn gói sau
    if (req.voucherCode?.trim()) errors.voucherCode = "Mẫu này chưa niêm yết giá nên chưa áp dụng được mã giảm giá"
    return { quote: awaitingQuote(quantity, zone), variant, voucher: null, errors }
  }
  let voucher: VoucherFacts | null = null
  const code = req.voucherCode?.trim()
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

  const holiday = req.deliveryDate ? holidayOn(req.deliveryDate.trim(), parseHolidayPolicy(shopSettings)) : null
  const surcharge = holidaySurcharge(holiday, catalogFilters)
  return { quote: computeQuote({ unitPriceVnd, quantity, zone, shipping, voucher, surcharge }), variant, voucher, errors }
}
