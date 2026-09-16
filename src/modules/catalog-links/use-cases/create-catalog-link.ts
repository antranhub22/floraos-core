import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import type { TenantContext } from "@/core/tenancy"
import { CatalogLinkRepository } from "@/modules/catalog-links/infra/catalog-link-repository"
import { validateSlug, normalizeSlug, validateFilters, type CatalogLinkFilters } from "@/modules/catalog-links/domain/catalog-link-rules"

export async function createCatalogLink(
  ctx: TenantContext,
  input: { slug: string; name: string; description?: string | null; filters?: CatalogLinkFilters | null }
) {
  requireCapability(ctx, "J1")

  const normalizedSlug = normalizeSlug(input.slug)
  const slugError = validateSlug(normalizedSlug)
  if (slugError) throw validationFailed({ slug: slugError })

  const filtersError = validateFilters(input.filters ?? {})
  if (filtersError) throw validationFailed({ filters: filtersError })

  const repo = new CatalogLinkRepository()
  const existing = await repo.findBySlug(normalizedSlug)
  if (existing) throw validationFailed({ slug: "Slug đã được sử dụng" })

  return repo.create(ctx, {
    slug: normalizedSlug,
    name: input.name.trim(),
    description: input.description?.trim() ?? null,
    filters: input.filters ?? null,
    createdBy: ctx.userId,
  })
}