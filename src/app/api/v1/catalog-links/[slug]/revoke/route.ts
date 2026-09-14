import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { updateCatalogLink } from "@/modules/catalog-links/use-cases/update-catalog-link"
import { revokeCatalogLink } from "@/modules/catalog-links/use-cases/revoke-catalog-link"
import type { CatalogLinkFilters } from "@/modules/catalog-links/domain/catalog-link-rules"

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  filters: z.record(z.string(), z.unknown()).nullable().optional(),
})

export const PATCH = handle<[{ params: Promise<{ slug: string }> }]>(
  async (request, context) => {
    const { ctx } = await requireTenantContext(request)
    requireCapability(ctx, "J1")

    const { slug } = await context.params
    const parsed = patchSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

    const updateInput: { name?: string; description?: string | null; filters?: CatalogLinkFilters | null } = {}
    if (parsed.data.name !== undefined) updateInput.name = parsed.data.name
    if (parsed.data.description !== undefined) updateInput.description = parsed.data.description
    if (parsed.data.filters !== undefined) updateInput.filters = parsed.data.filters

    const link = await updateCatalogLink(ctx, slug, updateInput)

    return jsonResponse(link)
  }
)

export const POST = handle<[{ params: Promise<{ slug: string }> }]>(
  async (request, context) => {
    const { ctx } = await requireTenantContext(request)
    requireCapability(ctx, "J2")

    const { slug } = await context.params
    await revokeCatalogLink(ctx, slug)
    return jsonResponse({ revoked: true })
  }
)