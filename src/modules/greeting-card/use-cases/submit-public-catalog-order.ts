import { notFound, unprocessable, validationFailed } from "@/core/http/errors"
import { GreetingCardRepository } from "../infra/greeting-card-repository"
import { BrochureOrderRepository } from "../infra/brochure-order-repository"
import {
  generateBrochureOrderCode,
  normalizePhone,
  validateCustomerOrderInput,
} from "../domain/greeting-card-rules"
import { parseBrochurePaymentConfig } from "../domain/brochure-commerce-rules"
import { buildPaymentInstructions } from "../adapters/vietqr-helper"
import type { CustomerOrderSubmitInput } from "../domain/greeting-card-types"
import { collectImageAssetIds, snapshotOf, toCatalogProduct } from "./brochure-product-mapper"
import { DEFAULT_TIME_SLOT, type BrochureOrderResult } from "./submit-brochure-order"

export interface PublicCatalogOrderInput extends CustomerOrderSubmitInput {
  productId: string
}

/** Đặt hoa trực tiếp từ link bộ sưu tập công khai `/g/...` (không qua link chào riêng). */
export async function submitPublicCatalogOrder(
  catalogId: string,
  input: PublicCatalogOrderInput,
  repo = new GreetingCardRepository(),
  orders = new BrochureOrderRepository()
): Promise<BrochureOrderResult> {
  const validation = validateCustomerOrderInput(input)
  if (!validation.valid) throw validationFailed(validation.errors)

  const catalog = await repo.getPublicCatalogById(catalogId)
  if (!catalog) throw notFound()

  const item = catalog.items.find((i) => i.product.id === input.productId)
  if (!item) throw notFound()

  const urls = await repo.getAssetsStorageMap(catalog.organization_id, collectImageAssetIds([item]))
  const product = toCatalogProduct(item, urls)
  if (product.price === null) {
    throw unprocessable("Mẫu hoa này chưa có giá bán online, vui lòng liên hệ cửa hàng để được báo giá")
  }
  const snapshot = snapshotOf({ ...product, price: product.price })

  const customerPhone = normalizePhone(input.customerPhone)
  const session = await repo.createPublicSession({
    organizationId: catalog.organization_id,
    catalogId: catalog.id,
    customerName: input.customerName.trim(),
    customerPhone,
    productId: product.id,
    snapshot,
  })

  const note = input.senderNote?.trim()
  const order = await orders.createBrochureOrder({
    organizationId: catalog.organization_id,
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
    note: note
      ? `[Đặt từ Link công khai /g/${catalog.code}] ${note}`
      : `[Đặt từ Link công khai /g/${catalog.code}]`,
    snapshot,
    totalAmount: snapshot.price,
  })

  const shop = await repo.getShopProfile(catalog.organization_id)
  return {
    sendCode: session.send_code,
    orderId: order.id,
    orderCode: order.code,
    totalVnd: snapshot.price,
    productSnapshot: snapshot,
    vietQr: buildPaymentInstructions(parseBrochurePaymentConfig(shop.settings), snapshot.price, order.code),
  }
}
