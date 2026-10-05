import { unprocessable, validationFailed } from "@/core/http/errors"
import { GreetingCardRepository } from "../infra/greeting-card-repository"
import { BrochureOrderRepository } from "../infra/brochure-order-repository"
import {
  generateBrochureOrderCode,
  normalizePhone,
  validateCustomerOrderInput,
} from "../domain/greeting-card-rules"
import { parseBrochurePaymentConfig } from "../domain/brochure-commerce-rules"
import { buildPaymentInstructions } from "../adapters/vietqr-helper"
import type {
  BrochurePaymentInstructions,
  CustomerOrderSubmitInput,
  ProductSnapshot,
} from "../domain/greeting-card-types"
import { loadPublicSession, resolveOrderableProduct } from "./brochure-session-access"
import { snapshotOf } from "./brochure-product-mapper"

export const DEFAULT_TIME_SLOT = "Trong ngày"

export interface BrochureOrderResult {
  /** Mã phiên để khách báo chuyển khoản (`/payment-notify`). */
  sendCode: string
  orderId: string
  orderCode: string
  totalVnd: number
  productSnapshot: ProductSnapshot
  /** `null` khi tiệm chưa cấu hình tài khoản nhận tiền — cửa hàng sẽ liên hệ khách. */
  vietQr: BrochurePaymentInstructions | null
}

export async function submitBrochureOrder(
  sendCode: string,
  input: CustomerOrderSubmitInput,
  repo = new GreetingCardRepository(),
  orders = new BrochureOrderRepository()
): Promise<BrochureOrderResult> {
  const validation = validateCustomerOrderInput(input)
  if (!validation.valid) throw validationFailed(validation.errors)

  const session = await loadPublicSession(sendCode, repo)
  const shop = await repo.getShopProfile(session.organization_id)
  const paymentConfig = parseBrochurePaymentConfig(shop.settings)

  // Idempotent: phiên đã có đơn → trả lại đúng đơn đó (khách bấm hai lần, mạng chập chờn).
  if (session.order_id) {
    const existing = await orders.findOrderById(session.organization_id, session.order_id)
    const snapshot = session.product_snapshot as unknown as ProductSnapshot | null
    if (existing && snapshot) {
      const total = Number(existing.total_vnd)
      return {
        sendCode: session.send_code,
        orderId: existing.id,
        orderCode: existing.code,
        totalVnd: total,
        productSnapshot: snapshot,
        vietQr: buildPaymentInstructions(paymentConfig, total - Number(existing.paid_vnd), existing.code),
      }
    }
  }

  // Không còn "tự lấy mẫu đầu tiên" như bản cũ: khách phải chọn mẫu.
  if (!session.selected_product_id) {
    throw unprocessable("Vui lòng chọn mẫu hoa trước khi hoàn tất đặt hàng")
  }
  // Tính lại giá từ Product Master lúc đặt — không tin ảnh chụp đã lưu.
  const product = await resolveOrderableProduct(session, session.selected_product_id, repo)
  const snapshot = snapshotOf(product)

  const note = input.senderNote?.trim()
  const order = await orders.createBrochureOrder({
    organizationId: session.organization_id,
    sessionId: session.id,
    code: generateBrochureOrderCode(),
    customerName: input.customerName.trim(),
    customerPhone: normalizePhone(input.customerPhone),
    recipientName: input.recipientName.trim(),
    recipientPhone: normalizePhone(input.recipientPhone),
    deliveryAddress: input.deliveryAddress.trim(),
    deliveryDate: input.deliveryDate.trim(),
    deliveryTimeSlot: input.deliveryTimeSlot?.trim() || DEFAULT_TIME_SLOT,
    cardMessage: input.cardMessage?.trim() || null,
    note: note ? `[Thẻ chào ${session.send_code}] ${note}` : `[Thẻ chào ${session.send_code}]`,
    snapshot,
    totalAmount: snapshot.price,
  })

  return {
    sendCode: session.send_code,
    orderId: order.id,
    orderCode: order.code,
    totalVnd: snapshot.price,
    productSnapshot: snapshot,
    vietQr: buildPaymentInstructions(paymentConfig, snapshot.price, order.code),
  }
}
