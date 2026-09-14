import { requireCapability } from "@/core/rbac/capabilities"
import type { TenantContext } from "@/core/tenancy"
import { CatalogLinkRepository } from "@/modules/catalog-links/infra/catalog-link-repository"
import type { CatalogLinkResult } from "@/modules/catalog-links/domain/catalog-link-rules"

export async function listCatalogLinks(ctx: TenantContext, options: { includeRevoked?: boolean } = {}): Promise<CatalogLinkResult[]> {
  requireCapability(ctx, "J1")

  const repo = new CatalogLinkRepository()
  const links = await repo.list(ctx, options)

  return links.map((link) => ({
    id: link.id,
    slug: link.slug,
    name: link.name,
    description: link.description,
    filters: link.filters as CatalogLinkResult["filters"],
    is_revoked: link.is_revoked,
    revoked_at: link.revoked_at?.toISOString() ?? null,
    revoked_by: link.revoked_by ?? null,
    created_by: link.created_by,
    created_at: link.created_at.toISOString(),
    updated_at: link.updated_at.toISOString(),
  }))
}