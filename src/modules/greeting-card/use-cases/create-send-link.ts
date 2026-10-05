import type { TenantContext } from "@/core/tenancy"
import { notFound } from "@/core/http/errors"
import { GreetingCardRepository } from "../infra/greeting-card-repository"
import { normalizePhone, randomCode } from "../domain/greeting-card-rules"

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
    const clientCatalog = await repo.createCatalog(ctx, {
      code: `cc-${randomCode(8).toLowerCase()}`,
      name: input.customCatalog.name || "Bộ sưu tập riêng theo yêu cầu",
      type: "CLIENT",
      description: input.customCatalog.description ?? null,
      filters: input.customCatalog.filters ?? null,
      productIds: input.customCatalog.productIds,
      createdBy: ctx.userId,
    })
    targetCatalogId = clientCatalog.id
  }

  if (!targetCatalogId && input.catalogCode) {
    const found = await repo.getCatalogByCode(ctx, input.catalogCode)
    if (!found) throw notFound()
    targetCatalogId = found.id
  }

  if (!targetCatalogId) {
    // If still no catalog, pick the latest active catalog
    const catalogs = await repo.listCatalogs(ctx)
    if (!catalogs[0]) throw notFound()
    targetCatalogId = catalogs[0].id
  }

  const phone = input.customerPhone ? normalizePhone(input.customerPhone) : null
  const session = await repo.createSession(ctx, {
    catalogId: targetCatalogId,
    prefix: input.prefix,
    saleId: ctx.userId,
    customerName: input.customerName?.trim() || null,
    customerPhone: phone || null,
  })

  return {
    sessionId: session.id,
    sendCode: session.send_code,
    catalogId: session.catalog_id,
    shareUrl: `/b/${session.send_code}`,
  }
}
