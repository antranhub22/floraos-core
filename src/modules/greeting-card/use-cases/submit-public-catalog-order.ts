import { notFound, unprocessable, validationFailed } from "@/core/http/errors"
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

/** Mẫu thuộc catalog công khai, đã có giá — chỉ khi đó mới báo giá/đặt được. */
async function orderableFromCatalog(
  catalogId: string,
  productId: string,
  repo: GreetingCardRepository
): Promise<{ catalog: PublicCatalog; product: GreetingCatalogProduct & { price: number } }> {
  const catalog = await repo.getPublicCatalogById(catalogId)
  if (!catalog) throw notFound()
  const item = catalog.items.find((i) => i.product.id === productId)
  if (!item) throw notFound()
  const urls = await repo.getAssetsStorageMap(catalog.organization_id, collectImageAssetIds([item]))
  const product = toCatalogProduct(item, urls)
  if (product.price === null) {
    throw unprocessable("Mẫu hoa này chưa có giá bán online, vui lòng liên hệ cửa hàng để được báo giá")
  }
  return { catalog, product: { ...product, price: product.price } }
}

/** Đặt hoa trực tiếp từ link bộ sưu tập công khai `/g/...` (không qua link chào riêng). */
export async function submitPublicCatalogOrder(
  catalogId: string,
  input: PublicCatalogOrderInput,
  repo = new GreetingCardRepository()
): Promise<BrochureOrderResult> {
  const validation = validateCustomerOrderInput(input)
  if (!validation.valid) throw validationFailed(validation.errors)

  const { catalog, product } = await orderableFromCatalog(catalogId, input.productId, repo)
  const shop = await repo.getShopProfile(catalog.organization_id)

  // Kiểm lựa chọn TRƯỚC khi tạo phiên — tránh phiên mồ côi khi khách chọn sai khu vực/mã giảm giá
  const precheck = await quoteForProduct(
    catalog.organization_id,
    product,
    { ...input, customerPhone: normalizePhone(input.customerPhone) },
    shop.settings
  )
  if (Object.keys(precheck.errors).length > 0) throw validationFailed(precheck.errors)

  const session = await repo.createPublicSession({
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
