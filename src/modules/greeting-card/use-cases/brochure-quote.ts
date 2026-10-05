import { normalizePhone } from "../domain/greeting-card-rules"
import {
  computeQuote,
  parseShippingConfig,
  voucherBlocker,
  type BrochureQuote,
  type PricedVariant,
  type VoucherFacts,
} from "../domain/brochure-pricing"
import type { GreetingCatalogProduct } from "../domain/greeting-card-types"
import { BrochureCheckoutRepository } from "../infra/brochure-checkout-repository"

export interface QuoteRequest {
  variantId?: string | undefined
  quantity?: number | undefined
  shippingZoneId?: string | undefined
  voucherCode?: string | undefined
  customerPhone?: string | undefined
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
  product: GreetingCatalogProduct & { price: number },
  req: QuoteRequest,
  shopSettings: unknown,
  checkout = new BrochureCheckoutRepository()
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

  return { quote: computeQuote({ unitPriceVnd, quantity, zone, shipping, voucher }), variant, voucher, errors }
}
