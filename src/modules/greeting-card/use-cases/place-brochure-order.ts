import { queueOrderNotification } from "./notify-customer"
import { AppError, validationFailed } from "@/core/http/errors"
import { MAX_ORDERS_PER_PHONE_PER_HOUR, TOO_MANY_ORDERS_MESSAGE } from "../domain/order-guard"
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
import { resolveAppliedPolicies } from "../domain/store-policy"
import { promotionNote, resolveOrderPolicies } from "../domain/order-policies"
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

/** Trần đơn theo SĐT mỗi giờ — giới hạn theo IP không chặn được một người đổi mạng liên tục. */
export async function assertPhoneQuota(organizationId: string, phone: string, checkout = new BrochureCheckoutRepository()) {
  const recent = await checkout.countRecentOrdersByPhone(organizationId, phone, new Date(Date.now() - 3_600_000))
  if (recent >= MAX_ORDERS_PER_PHONE_PER_HOUR) throw new AppError("RATE_LIMITED", TOO_MANY_ORDERS_MESSAGE)
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
    product: GreetingCatalogProduct
    input: CustomerOrderSubmitInput
    notePrefix: string
    shopSettings: unknown
    /** `filters` của bộ sưu tập — nguồn ưu đãi/thỏa thuận đang áp dụng. */
    catalogFilters: unknown
  },
  checkout = new BrochureCheckoutRepository()
): Promise<BrochureOrderResult> {
  const { organizationId, session, product, input } = params
  const customerPhone = normalizePhone(input.customerPhone)
  await assertPhoneQuota(organizationId, customerPhone, checkout)
  const priced = await quoteForProduct(
    organizationId,
    product,
    { ...input, customerPhone },
    params.shopSettings,
    checkout
  )
  if (Object.keys(priced.errors).length > 0) throw validationFailed(priced.errors)
  const policies = resolveOrderPolicies(resolveAppliedPolicies(params.catalogFilters, params.shopSettings), input)
  if (!policies.ok) throw validationFailed({ [policies.field]: policies.message })

  const snapshot = snapshotOf(product)
  const customerId = await checkout.findOrCreateCustomer({
    organizationId,
    customerPhone,
    customerName: input.customerName.trim(),
    deliveryAddress: input.deliveryAddress.trim(),
  })

  const note = [params.notePrefix, priced.quote.awaitingQuote ? "[Chờ báo giá]" : "", promotionNote(policies.snapshot), input.senderNote?.trim() ?? ""]
    .filter(Boolean)
    .join(" ")
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
      addressParts: input.addressParts ?? null,
      deliveryDate: input.deliveryDate.trim(),
      deliveryTimeSlot: input.deliveryTimeSlot?.trim() || DEFAULT_TIME_SLOT,
      cardMessage: input.cardMessage?.trim() || null,
      note,
      snapshot,
      variant: priced.variant ? { id: priced.variant.id, name: priced.variant.name } : null,
      quote: priced.quote,
      voucherId: priced.voucher?.id ?? null,
      policies: policies.snapshot,
    },
    customerId
  )
  // Tin "Đã nhận đơn" kèm link theo dõi — chạy nền, lỗi gửi tin không ảnh hưởng đơn
  queueOrderNotification(organizationId, order.id, "ORDER_RECEIVED")

  return {
    sendCode: session.send_code,
    orderId: order.id,
    orderCode: order.code,
    totalVnd: priced.quote.totalVnd,
    quote: priced.quote,
    productSnapshot: snapshot,
    vietQr: paymentInstructionsFor(params.shopSettings, { totalVnd: priced.quote.totalVnd, paidVnd: 0, createdAt: new Date() }, order.code),
  }
}
