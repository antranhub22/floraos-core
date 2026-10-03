import type { TenantContext } from "@/core/tenancy"
import { GreetingCardRepository } from "../infra/greeting-card-repository"

export interface CreateSendLinkInput {
  catalogId?: string | undefined
  catalogCode?: string | undefined
  customerName?: string | null | undefined
  customerPhone?: string | null | undefined
  prefix?: string | undefined
  // Support creating Client Catalog on the fly
  customCatalog?: {
    name: string
    description?: string | null | undefined
    filters?: Record<string, unknown> | null | undefined
    productIds: string[]
  } | undefined
}

export async function createSendLink(
  ctx: TenantContext,
  input: CreateSendLinkInput,
  repo = new GreetingCardRepository()
) {
  let targetCatalogId = input.catalogId

  // If Sale provided a custom catalog (Client Catalog)
  if (!targetCatalogId && input.customCatalog) {
    const timestamp = Date.now().toString(36).slice(-4)
    const clientCatalog = await repo.createCatalog(ctx, {
      code: `cc-${timestamp}`,
      name: input.customCatalog.name || "Bộ sưu tập riêng theo yêu cầu",
      type: "CLIENT",
      description: input.customCatalog.description ?? null,
      filters: input.customCatalog.filters ?? null,
      productIds: input.customCatalog.productIds,
      createdBy: ctx.userId || "system",
    })
    targetCatalogId = clientCatalog.id
  }

  if (!targetCatalogId && input.catalogCode) {
    const found = await repo.getCatalogByCode(ctx, input.catalogCode)
    if (found) targetCatalogId = found.id
  }

  if (!targetCatalogId) {
    // If still no catalog, pick the latest active standard catalog
    const catalogs = await repo.listCatalogs(ctx)
    if (catalogs.length > 0 && catalogs[0]) {
      targetCatalogId = catalogs[0].id
    } else {
      throw new Error("Không tìm thấy danh mục hoa để tạo Thẻ chào")
    }
  }

  const sendCode = await repo.getNextSendCode(ctx, input.prefix || "T01")
  const session = await repo.createSession(ctx, {
    catalogId: targetCatalogId,
    sendCode,
    saleId: ctx.userId || "sale",
    customerName: input.customerName ?? null,
    customerPhone: input.customerPhone ?? null,
  })

  return {
    sessionId: session.id,
    sendCode: session.send_code,
    catalogId: session.catalog_id,
    shareUrl: `/b/${session.send_code}`,
  }
}
