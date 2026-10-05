import { validationFailed } from "@/core/http/errors"
import { generateBrochureOrderCode, normalizePhone } from "../domain/greeting-card-rules"
import { paymentInstructionsFor } from "./payment-instructions"
import type {
  BrochurePaymentInstructions,
  CustomerOrderSubmitInput,
  GreetingCatalogProduct,
  ProductSnapshot,
} from "../domain/greeting-card-types"
import type { BrochureQuote } from "../domain/brochure-pricing"
import { BrochureCheckoutRepository } from "../infra/brochure-checkout-repository"
import { quoteForProduct } from "./brochure-quote"
import { snapshotOf } from "./brochure-product-mapper"

export const DEFAULT_TIME_SLOT = "Trong ngày"

export interface BrochureOrderResult {
  /** Mã phiên để khách báo chuyển khoản (`/payment-notify`). */
  sendCode: string
  orderId: string
  orderCode: string
  totalVnd: number
  quote: BrochureQuote | null
  productSnapshot: ProductSnapshot
  /** `null` khi tiệm chưa cấu hình tài khoản nhận tiền — cửa hàng sẽ liên hệ khách. */
  vietQr: BrochurePaymentInstructions | null
}

/**
 * Báo giá lại ở server rồi tạo đơn (dùng chung cho link chào và link bộ sưu
 * tập công khai). Lựa chọn sai (size, khu vực, mã giảm giá) → 400 kèm lỗi
 * từng trường, không tạo đơn.
 */
export async function placeBrochureOrder(
  params: {
    organizationId: string
    session: { id: string; send_code: string }
    product: GreetingCatalogProduct & { price: number }
    input: CustomerOrderSubmitInput
    notePrefix: string
    shopSettings: unknown
  },
  checkout = new BrochureCheckoutRepository()
): Promise<BrochureOrderResult> {
  const { organizationId, session, product, input } = params
  const customerPhone = normalizePhone(input.customerPhone)
  const priced = await quoteForProduct(
    organizationId,
    product,
    { ...input, customerPhone },
    params.shopSettings,
    checkout
  )
  if (Object.keys(priced.errors).length > 0) throw validationFailed(priced.errors)

  const snapshot = snapshotOf(product)
  const customerId = await checkout.findOrCreateCustomer({
    organizationId,
    customerPhone,
    customerName: input.customerName.trim(),
    deliveryAddress: input.deliveryAddress.trim(),
  })

  const note = input.senderNote?.trim()
  const order = await checkout.createBrochureOrder(
    {
      organizationId,
      sessionId: session.id,
      code: generateBrochureOrderCode(),
      customerName: input.customerName.trim(),
      customerPhone,
      recipientName: input.recipientName.trim(),
      recipientPhone: normalizePhone(input.recipientPhone),
      deliveryAddress: input.deliveryAddress.trim(),
      deliveryDate: input.deliveryDate.trim(),
      deliveryTimeSlot: input.deliveryTimeSlot?.trim() || DEFAULT_TIME_SLOT,
      cardMessage: input.cardMessage?.trim() || null,
      note: note ? `${params.notePrefix} ${note}` : params.notePrefix,
      snapshot,
      variant: priced.variant ? { id: priced.variant.id, name: priced.variant.name } : null,
      quote: priced.quote,
      voucherId: priced.voucher?.id ?? null,
    },
    customerId
  )

  return {
    sendCode: session.send_code,
    orderId: order.id,
    orderCode: order.code,
    totalVnd: priced.quote.totalVnd,
    quote: priced.quote,
    productSnapshot: snapshot,
    vietQr: paymentInstructionsFor(params.shopSettings, { totalVnd: priced.quote.totalVnd, paidVnd: 0 }, order.code),
  }
}
