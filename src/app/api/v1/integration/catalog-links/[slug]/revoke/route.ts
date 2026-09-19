import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import {
  requireIntegrationContext,
  toTenantContext,
} from "@/modules/integration/use-cases/resolve-integration-context"
import { revokeCatalogLink } from "@/modules/catalog-links/use-cases/revoke-catalog-link"

/** `POST /integration/catalog-links/:slug/revoke` (RS-3 18/09) — xem route cha (`J2`, giống route phiên). */
export const POST = handle<[{ params: Promise<{ slug: string }> }]>(
  async (request, context) => {
    const ic = await requireIntegrationContext(request)
    const ctx = await toTenantContext(ic)
    requireCapability(ctx, "J2")

    const { slug } = await context.params
    await revokeCatalogLink(ctx, slug)
    return jsonResponse({ revoked: true })
  }
)
