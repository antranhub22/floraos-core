import { z } from "zod"

import { validationFailed } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { listCatalogLinks } from "@/modules/catalog-links/use-cases/list-catalog-links"
import { createCatalogLink } from "@/modules/catalog-links/use-cases/create-catalog-link"

const querySchema = z.object({
  include_revoked: z.coerce.boolean().optional(),
})

const createSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  filters: z.record(z.string(), z.unknown()).nullable().optional(),
})

export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "J1")

  const url = new URL(request.url)
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  const links = await listCatalogLinks(ctx, { includeRevoked: parsed.data.include_revoked ?? false })
  return jsonResponse({ data: links })
})

export const POST = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, "J1")

  const parsed = createSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  const link = await createCatalogLink(ctx, {
    slug: parsed.data.slug,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    filters: parsed.data.filters ?? null,
  })

  return jsonResponse(link, { status: 201 })
})