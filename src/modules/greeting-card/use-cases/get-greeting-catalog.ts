import { GreetingCardRepository } from "../infra/greeting-card-repository"
import type {
  GreetingCatalogProduct,
  GreetingSessionRecord,
  ProductSnapshot,
} from "../domain/greeting-card-types"

export async function getGreetingCatalogForCustomer(
  sendCode: string,
  repo = new GreetingCardRepository()
) {
  const session = await repo.getPublicSessionBySendCode(sendCode)
  if (!session) {
    return { status: "NOT_FOUND" as const }
  }

  // Record open event if not opened yet
  if (session.status === "CREATED") {
    await repo.updateSession(session.id, {
      status: "OPENED",
      openedAt: new Date(),
    })
    await repo.recordJourneyEvent(session.organization_id, session.id, "OPEN", {
      openedAt: new Date().toISOString(),
    })
  }

  // Gather asset IDs to resolve storage keys
  const assetIds: string[] = []
  for (const item of session.catalog.items) {
    for (const img of item.product.images) {
      if (img.asset_id) assetIds.push(img.asset_id)
    }
  }

  const assetMap = await repo.getAssetsStorageMap(assetIds)

  // Format products
  const products: GreetingCatalogProduct[] = (session.catalog.items || []).map((item) => {
    const p = item.product
    let price = 500000
    if (p.variants && p.variants.length > 0) {
      const v = p.variants[0]
      const multiplier = v ? v.multiplier : 1
      price = Math.round(500000 * multiplier)
    }

    let firstImageUrl: string | null = null
    if (p.images && p.images.length > 0 && p.images[0]) {
      firstImageUrl = assetMap.get(p.images[0].asset_id) || null
    }

    return {
      id: p.id,
      code: p.code,
      name: p.name,
      price,
      imageUrl: firstImageUrl,
      description: p.category ? `Danh mục: ${p.category}` : null,
      sortOrder: item.sort_order,
    }
  })

  const sessionRecord: GreetingSessionRecord = {
    id: session.id,
    organizationId: session.organization_id,
    catalogId: session.catalog_id,
    sendCode: session.send_code,
    saleId: session.sale_id,
    customerName: session.customer_name,
    customerPhone: session.customer_phone,
    status: session.status as any,
    selectedProductId: session.selected_product_id,
    productSnapshot: (session.product_snapshot as unknown as ProductSnapshot) || null,
    orderId: session.order_id,
    openedAt: session.opened_at,
    selectedAt: session.selected_at,
    lastActiveAt: session.last_active_at,
    createdAt: session.created_at,
    updatedAt: session.updated_at,
  }

  return {
    status: "ACTIVE" as const,
    session: sessionRecord,
    catalog: {
      id: session.catalog.id,
      code: session.catalog.code,
      name: session.catalog.name,
      description: session.catalog.description,
    },
    products,
    order: session.order
      ? {
          id: session.order.id,
          code: session.order.code,
          status: session.order.status,
          totalVnd: Number(session.order.total_vnd),
          paidVnd: Number(session.order.paid_vnd),
        }
      : null,
  }
}
