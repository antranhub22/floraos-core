import { GreetingCardRepository } from "../infra/greeting-card-repository"
import {
  validateCustomerOrderInput,
  createProductSnapshot,
} from "../domain/greeting-card-rules"
import {
  generateVietQrUrl,
  DEFAULT_SHOP_PAYMENT_INFO,
} from "../adapters/vietqr-helper"
import type { CustomerOrderSubmitInput, ProductSnapshot } from "../domain/greeting-card-types"
import { catalogItemToProduct } from "../domain/catalog-product-price"

export async function submitBrochureOrder(
  sendCode: string,
  input: CustomerOrderSubmitInput,
  repo = new GreetingCardRepository()
) {
  const validation = validateCustomerOrderInput(input)
  if (!validation.valid) {
    throw new Error(Object.values(validation.errors)[0] || "Thông tin đặt hàng không hợp lệ")
  }

  const session = await repo.getPublicSessionBySendCode(sendCode)
  if (!session) {
    throw new Error("Không tìm thấy phiên Thẻ chào tương ứng")
  }

  let snapshot = session.product_snapshot as unknown as ProductSnapshot | null

  // If no snapshot yet, try to find the selected product or the first catalog product
  if (!snapshot && session.selected_product_id) {
    const item = session.catalog.items.find((i) => i.product.id === session.selected_product_id)
    if (item) {
      snapshot = createProductSnapshot(catalogItemToProduct(item))
    }
  }

  if (!snapshot && session.catalog.items.length > 0 && session.catalog.items[0]) {
    const firstItem = session.catalog.items[0]
    snapshot = createProductSnapshot(catalogItemToProduct(firstItem))
  }

  if (!snapshot) {
    throw new Error("Vui lòng chọn mẫu hoa trước khi hoàn tất đặt hàng")
  }

  const orgId = session.organization_id
  const cleanPhone = input.customerPhone.replace(/\s+/g, "")

  const order = await repo.createBrochureOrder({
    organizationId: orgId,
    sessionId: session.id,
    code: `DH${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${session.send_code.replace(/[^A-Za-z0-9]/g, "")}`,
    customerName: input.customerName.trim(),
    customerPhone: cleanPhone,
    recipientName: input.recipientName.trim(),
    recipientPhone: input.recipientPhone.replace(/\s+/g, ""),
    deliveryAddress: input.deliveryAddress.trim(),
    deliveryDate: input.deliveryDate,
    cardMessage: input.cardMessage?.trim() || null,
    note: input.senderNote?.trim() ? `[Thẻ chào ${session.send_code}] ${input.senderNote.trim()}` : `[Thẻ chào ${session.send_code}]`,
    snapshot,
    totalAmount: snapshot.price,
  })

  const totalVnd = snapshot.price

  // 6. Generate VietQR
  const qrUrl = generateVietQrUrl({
    bankId: DEFAULT_SHOP_PAYMENT_INFO.bankId,
    accountNo: DEFAULT_SHOP_PAYMENT_INFO.accountNo,
    accountName: DEFAULT_SHOP_PAYMENT_INFO.accountName,
    amount: totalVnd,
    description: order.code,
  })

  return {
    orderId: order.id,
    orderCode: order.code,
    totalVnd,
    productSnapshot: snapshot,
    vietQr: {
      qrUrl,
      bankName: DEFAULT_SHOP_PAYMENT_INFO.bankName,
      accountNo: DEFAULT_SHOP_PAYMENT_INFO.accountNo,
      accountName: DEFAULT_SHOP_PAYMENT_INFO.accountName,
      amount: totalVnd,
      transferMemo: order.code,
    },
  }
}
