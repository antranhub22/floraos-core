import type { TenantContext } from "@/core/tenancy"
import { assertShopReadyForCustomers } from "./get-shop-contact"
import { conflict, notFound } from "@/core/http/errors"
import { GreetingCardRepository } from "../infra/greeting-card-repository"
import { normalizePhone, randomCode } from "../domain/greeting-card-rules"
import { linkExpiryFrom, parseLinkLifetimeHours } from "../domain/link-lifetime"
import { resolveEffectiveStepTimeoutPolicy } from "../domain/step-timeout-policy"

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
  await assertShopReadyForCustomers(ctx.organizationId)
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

  // Hạn dùng: Thẻ Chào ghi đè > Cài đặt Hồ sơ tiệm > Mặc định hệ thống
  const [shop, catalogFilters] = await Promise.all([
    repo.getShopProfile(ctx.organizationId),
    repo.getCatalogFilters(ctx, targetCatalogId),
  ])
  const effectivePolicy = resolveEffectiveStepTimeoutPolicy(shop.settings, catalogFilters)
  const expiryHours = effectivePolicy.autoCancelUnopened
    ? effectivePolicy.unopenedExpiryHours
    : parseLinkLifetimeHours(shop.settings)
  const phone = input.customerPhone ? normalizePhone(input.customerPhone) : null
  const session = await repo.createSession(ctx, {
    catalogId: targetCatalogId,
    prefix: input.prefix,
    saleId: ctx.userId,
    customerName: input.customerName?.trim() || null,
    customerPhone: phone || null,
    expiresAt: linkExpiryFrom(expiryHours),
  })

  return {
    sessionId: session.id,
    sendCode: session.send_code,
    catalogId: session.catalog_id,
    shareUrl: `/b/${session.send_code}`,
    expiresAt: session.expires_at?.toISOString() ?? null,
  }
}

/** Thu hồi link đã gửi (chưa có đơn): khách mở lại sẽ thấy link không còn hiệu lực. */
export async function revokeSendLink(ctx: TenantContext, sessionId: string, repo = new GreetingCardRepository()) {
  const changed = await repo.revokeSession(ctx, sessionId)
  if (changed) {
    await repo.recordJourneyEvent(ctx.organizationId, sessionId, "LINK_REVOKED", { revokedBy: ctx.userId })
    return { revoked: true }
  }
  const state = await repo.findSessionState(ctx, sessionId)
  if (!state) throw notFound()
  if (state.order_id) throw conflict("Link đã có đơn hàng — hãy huỷ đơn thay vì thu hồi link")
  return { revoked: true } // đã thu hồi trước đó — idempotent
}
