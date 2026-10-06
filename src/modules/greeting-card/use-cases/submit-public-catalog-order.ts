import { normalizeOrderAddress } from "../domain/delivery-address"
import { defaultOwnerOf } from "./share-links"
import { deliveryScheduleError } from "../domain/delivery-schedule"
import { parseShippingConfig } from "../domain/brochure-pricing"
import { notFound, validationFailed } from "@/core/http/errors"
import { GreetingCardRepository } from "../infra/greeting-card-repository"
import { validateCustomerOrderInput, normalizePhone } from "../domain/greeting-card-rules"
import type { CustomerOrderSubmitInput, GreetingCatalogProduct } from "../domain/greeting-card-types"
import { collectImageAssetIds, snapshotOf, toCatalogProduct } from "./brochure-product-mapper"
import { placeBrochureOrder, type BrochureOrderResult } from "./place-brochure-order"
import { quoteForProduct, type QuoteRequest, type QuoteResult } from "./brochure-quote"

export interface PublicCatalogOrderInput extends CustomerOrderSubmitInput {
  productId: string
}

type PublicCatalog = NonNullable<Awaited<ReturnType<GreetingCardRepository["getPublicCatalogById"]>>>

/** Mẫu thuộc catalog công khai (mẫu chưa niêm yết giá vẫn đặt được, cửa hàng báo giá sau). */
async function orderableFromCatalog(
  catalogId: string,
  productId: string,
  repo: GreetingCardRepository
): Promise<{ catalog: PublicCatalog; product: GreetingCatalogProduct }> {
  const catalog = await repo.getPublicCatalogById(catalogId)
  if (!catalog) throw notFound()
  const item = catalog.items.find((i) => i.product.id === productId)
  if (!item) throw notFound()
  const urls = await repo.getAssetsStorageMap(catalog.organization_id, collectImageAssetIds([item]))
  return { catalog, product: toCatalogProduct(item, urls) }
}

/** Đặt hoa trực tiếp từ link bộ sưu tập công khai `/g/...` (không qua link chào riêng). */
export async function submitPublicCatalogOrder(
  catalogId: string,
  rawInput: PublicCatalogOrderInput,
  repo = new GreetingCardRepository()
): Promise<BrochureOrderResult> {
  const address = normalizeOrderAddress(rawInput)
  const input = address.input
  const validation = validateCustomerOrderInput(input)
  const errors = { ...validation.errors, ...address.errors }
  if (Object.keys(errors).length > 0) throw validationFailed(errors)

  const { catalog, product } = await orderableFromCatalog(catalogId, input.productId, repo)
  const shop = await repo.getShopProfile(catalog.organization_id)
  // Giờ chốt đơn / thời gian chuẩn bị của tiệm — chặn cả khi khách gửi thẳng API
  const scheduleError = deliveryScheduleError(input.deliveryDate, input.deliveryTimeSlot, parseShippingConfig(shop.settings))
  if (scheduleError) throw validationFailed({ deliveryDate: scheduleError })

  // Kiểm lựa chọn TRƯỚC khi tạo phiên — tránh phiên mồ côi khi khách chọn sai khu vực/mã giảm giá
  const precheck = await quoteForProduct(
    catalog.organization_id,
    product,
    { ...input, customerPhone: normalizePhone(input.customerPhone) },
    shop.settings
  )
  if (Object.keys(precheck.errors).length > 0) throw validationFailed(precheck.errors)

  const session = await repo.createPublicSession({
    saleId: await defaultOwnerOf(catalog.organization_id),
    organizationId: catalog.organization_id,
    catalogId: catalog.id,
    customerName: input.customerName.trim(),
    customerPhone: normalizePhone(input.customerPhone),
    productId: product.id,
    snapshot: snapshotOf(product),
  })

  return placeBrochureOrder({
    organizationId: catalog.organization_id,
    session,
    product,
    input,
    notePrefix: `[Đặt từ Link công khai /g/${catalog.code}]`,
    shopSettings: shop.settings,
  })
}

/** Báo giá trên form đặt hoa của link bộ sưu tập công khai. */
export async function quotePublicCatalog(
  catalogId: string,
  productId: string,
  req: QuoteRequest,
  repo = new GreetingCardRepository()
): Promise<QuoteResult> {
  const { catalog, product } = await orderableFromCatalog(catalogId, productId, repo)
  const shop = await repo.getShopProfile(catalog.organization_id)
  return quoteForProduct(catalog.organization_id, product, req, shop.settings)
}
