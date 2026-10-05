import { AppError } from "@/core/http/errors"
import { GreetingCardRepository } from "../infra/greeting-card-repository"
import { paymentInstructionsFor } from "./payment-instructions"
import { parseShippingConfig, type ShippingConfig } from "../domain/brochure-pricing"
import type {
  BrochurePaymentInstructions,
  GreetingCatalogProduct,
  GreetingSessionStatus,
  ProductSnapshot,
  PublicBrochureSessionView,
} from "../domain/greeting-card-types"
import { loadPublicSession } from "./brochure-session-access"
import { collectImageAssetIds, toCatalogProduct } from "./brochure-product-mapper"
import { toPublicCatalogFilters } from "../domain/greeting-template-registry"
import type { ShopContact } from "../domain/shop-contact"
import { getShopContact } from "./get-shop-contact"

export type CustomerBrochureView = {
  status: "ACTIVE"
  session: PublicBrochureSessionView
  /** Tên, SĐT, Zalo, địa chỉ, logo của tiệm — khách luôn liên hệ được */
  shop: ShopContact
  catalog: { id: string; code: string; name: string; description: string | null; filters?: Record<string, unknown> | null }
  products: GreetingCatalogProduct[]
  order: { id: string; code: string; status: string; totalVnd: number; paidVnd: number } | null
  /** Khu vực giao + phí của tiệm để khách chọn trên form. */
  shipping: ShippingConfig
  /** Hướng dẫn chuyển khoản cho đơn hiện có — `null` khi chưa có đơn hoặc tiệm chưa cấu hình. */
  payment: BrochurePaymentInstructions | null
}

/**
 * Dữ liệu trang khách `/b/[sendCode]`. Chỉ trả những gì khách cần — không
 * SĐT, không id tổ chức/sale. Lần mở đầu ghi sự kiện OPEN.
 */
export async function getGreetingCatalogForCustomer(
  sendCode: string,
  repo = new GreetingCardRepository()
): Promise<CustomerBrochureView | { status: "NOT_FOUND" } | { status: "UNAVAILABLE"; shop: ShopContact }> {
  let session
  try {
    session = await loadPublicSession(sendCode, repo)
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") {
      // Link có thật nhưng đã hết hạn / thu hồi / bộ sưu tập ngừng: cho khách cách liên hệ tiệm
      const raw = await repo.getPublicSessionBySendCode(sendCode).catch(() => null)
      const contact = raw ? await getShopContact(raw.organization_id) : null
      return contact ? { status: "UNAVAILABLE", shop: contact } : { status: "NOT_FOUND" }
    }
    throw error
  }

  let status = session.status as GreetingSessionStatus
  if (status === "CREATED") {
    const now = new Date()
    await repo.updateSession(session.id, { status: "OPENED", openedAt: now })
    await repo.recordJourneyEvent(session.organization_id, session.id, "OPEN", { openedAt: now.toISOString() })
    status = "OPENED"
  }

  const urls = await repo.getAssetsStorageMap(session.organization_id, collectImageAssetIds(session.catalog.items))
  const products = session.catalog.items.map((item) => toCatalogProduct(item, urls))
  const shop = await repo.getShopProfile(session.organization_id)
  const contact = (await getShopContact(session.organization_id)) ?? {
    name: shop.name, phone: shop.phone, zaloUrl: null, address: null, logoUrl: null,
  }

  const order = session.order
    ? {
        id: session.order.id,
        code: session.order.code,
        status: session.order.status,
        totalVnd: Number(session.order.total_vnd),
        paidVnd: Number(session.order.paid_vnd),
      }
    : null
  const payment = order && order.status !== "CANCELLED" ? paymentInstructionsFor(shop.settings, { ...order, createdAt: session.order?.created_at }, order.code) : null

  return {
    status: "ACTIVE",
    session: {
      sendCode: session.send_code,
      status,
      customerName: session.customer_name,
      selectedProductId: session.selected_product_id,
      productSnapshot: (session.product_snapshot as unknown as ProductSnapshot | null) ?? null,
    },
    shop: contact,
    catalog: {
      id: session.catalog.id,
      code: session.catalog.code,
      name: session.catalog.name,
      description: session.catalog.description,
      filters: toPublicCatalogFilters(session.catalog.filters, session.organization?.settings),
    },
    products,
    shipping: parseShippingConfig(shop.settings),
    order,
    payment,
  }
}
