import { normalizeOrderAddress } from "../domain/delivery-address"
import { deliveryScheduleError } from "../domain/delivery-schedule"
import { parseShippingConfig } from "../domain/brochure-pricing"
import { unprocessable, validationFailed } from "@/core/http/errors"
import { GreetingCardRepository } from "../infra/greeting-card-repository"
import { BrochureOrderRepository } from "../infra/brochure-order-repository"
import { validateCustomerOrderInput } from "../domain/greeting-card-rules"
import { paymentInstructionsFor } from "./payment-instructions"
import type { CustomerOrderSubmitInput, ProductSnapshot } from "../domain/greeting-card-types"
import { loadPublicSession, resolveOrderableProduct } from "./brochure-session-access"
import { placeBrochureOrder, type BrochureOrderResult } from "./place-brochure-order"
import { quoteForProduct, type QuoteRequest, type QuoteResult } from "./brochure-quote"

export { DEFAULT_TIME_SLOT, type BrochureOrderResult } from "./place-brochure-order"

/** Khách gửi đơn từ link chào `/b/[sendCode]` (đã chọn mẫu trước đó). */
export async function submitBrochureOrder(
  sendCode: string,
  rawInput: CustomerOrderSubmitInput,
  repo = new GreetingCardRepository(),
  orders = new BrochureOrderRepository()
): Promise<BrochureOrderResult> {
  const address = normalizeOrderAddress(rawInput)
  const input = address.input
  const validation = validateCustomerOrderInput(input)
  const errors = { ...validation.errors, ...address.errors }
  if (Object.keys(errors).length > 0) throw validationFailed(errors)

  const session = await loadPublicSession(sendCode, repo)
  const shop = await repo.getShopProfile(session.organization_id)

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
        quote: null,
        productSnapshot: snapshot,
        vietQr: paymentInstructionsFor(shop.settings, { totalVnd: total, paidVnd: Number(existing.paid_vnd), createdAt: existing.created_at }, existing.code),
      }
    }
  }

  // Giờ chốt đơn / thời gian chuẩn bị của tiệm — chặn cả khi khách gửi thẳng API
  const scheduleError = deliveryScheduleError(input.deliveryDate, input.deliveryTimeSlot, parseShippingConfig(shop.settings))
  if (scheduleError) throw validationFailed({ deliveryDate: scheduleError })

  // Không còn "tự lấy mẫu đầu tiên" như bản cũ: khách phải chọn mẫu.
  if (!session.selected_product_id) {
    throw unprocessable("Vui lòng chọn mẫu hoa trước khi hoàn tất đặt hàng")
  }
  // Tính lại giá từ Product Master lúc đặt — không tin ảnh chụp đã lưu.
  const product = await resolveOrderableProduct(session, session.selected_product_id, repo)

  return placeBrochureOrder({
    organizationId: session.organization_id,
    session,
    product,
    input,
    notePrefix: `[Thẻ chào ${session.send_code}]`,
    shopSettings: shop.settings,
  })
}

/** Báo giá trực tiếp trên form đặt hoa của link chào (mẫu đã chọn). */
export async function quoteBrochureSession(
  sendCode: string,
  req: QuoteRequest,
  repo = new GreetingCardRepository()
): Promise<QuoteResult> {
  const session = await loadPublicSession(sendCode, repo)
  if (!session.selected_product_id) throw unprocessable("Vui lòng chọn mẫu hoa trước")
  const product = await resolveOrderableProduct(session, session.selected_product_id, repo)
  const shop = await repo.getShopProfile(session.organization_id)
  return quoteForProduct(session.organization_id, product, req, shop.settings)
}
