import { GreetingCardRepository } from "../infra/greeting-card-repository"
import { validateCustomerOrderInput } from "../domain/greeting-card-rules"
import { generateVietQrUrl, DEFAULT_SHOP_PAYMENT_INFO } from "../adapters/vietqr-helper"
import type { CustomerOrderSubmitInput, ProductSnapshot } from "../domain/greeting-card-types"
import { FALLBACK_CATALOG_PRICE, resolveCatalogProductPrice } from "../domain/catalog-product-price"

interface PublicCatalogOrderInput extends CustomerOrderSubmitInput {
  productId: string
}

export async function submitPublicCatalogOrder(
  catalogId: string,
  input: PublicCatalogOrderInput,
  repo = new GreetingCardRepository()
) {
  const validation = validateCustomerOrderInput(input)
  if (!validation.valid) {
    throw new Error(Object.values(validation.errors)[0] || "Thông tin đặt hàng không hợp lệ")
  }

  const catalog = await repo.getPublicCatalogById(catalogId)
  if (!catalog) {
    throw new Error("Không tìm thấy bộ sưu tập hoa tương ứng")
  }

  const item = catalog.items.find((i) => i.product.id === input.productId)
  if (!item) {
    throw new Error("Mẫu hoa không tồn tại trong bộ sưu tập này")
  }

  const p = item.product
  const price = resolveCatalogProductPrice(p) ?? FALLBACK_CATALOG_PRICE

  let masterImageUrl: string | null = null
  if (p.images && p.images[0]) {
    masterImageUrl = await repo.getAssetStorageUrl(p.images[0].asset_id)
  }

  const snapshot: ProductSnapshot = {
    id: p.id,
    code: p.code,
    name: p.name,
    price,
    imageUrl: masterImageUrl,
    description: p.category ? `Danh mục: ${p.category}` : null,
    selectedAt: new Date().toISOString(),
  }

  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase()
  const sendCode = `PUB-${randomSuffix}`

  const session = await repo.createPublicSession({
    organizationId: catalog.organization_id,
    catalogId: catalog.id,
    sendCode,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    productId: p.id,
    snapshot,
  })

  const order = await repo.createBrochureOrder({
    organizationId: catalog.organization_id,
    sessionId: session.id,
    code: `DH${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${sendCode.replace(/[^A-Za-z0-9]/g, "")}`,
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.replace(/\s+/g, ""),
    recipientName: input.recipientName.trim(),
    recipientPhone: input.recipientPhone.replace(/\s+/g, ""),
    deliveryAddress: input.deliveryAddress.trim(),
    deliveryDate: input.deliveryDate,
    cardMessage: input.cardMessage?.trim() || null,
    note: input.senderNote?.trim()
      ? `[Đặt từ Link công khai /g/${catalog.code}] ${input.senderNote.trim()}`
      : `[Đặt từ Link công khai /g/${catalog.code}]`,
    snapshot,
    totalAmount: price,
  })

  const qrUrl = generateVietQrUrl({
    bankId: DEFAULT_SHOP_PAYMENT_INFO.bankId,
    accountNo: DEFAULT_SHOP_PAYMENT_INFO.accountNo,
    accountName: DEFAULT_SHOP_PAYMENT_INFO.accountName,
    amount: price,
    description: order.code,
  })

  return {
    orderId: order.id,
    orderCode: order.code,
    totalVnd: price,
    productSnapshot: snapshot,
    vietQr: {
      qrUrl,
      bankName: DEFAULT_SHOP_PAYMENT_INFO.bankName,
      accountNo: DEFAULT_SHOP_PAYMENT_INFO.accountNo,
      accountName: DEFAULT_SHOP_PAYMENT_INFO.accountName,
      amount: price,
      transferMemo: order.code,
    },
  }
}
