import { z } from "zod"
import { validationFailed, notFound } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { GreetingCardRepository } from "@/modules/greeting-card/infra/greeting-card-repository"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"

const updateCatalogSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().max(1000).nullable().optional(),
  type: z.enum(["STANDARD", "CLIENT"]).optional(),
  isActive: z.boolean().optional(),
  filters: z.record(z.string(), z.unknown()).nullable().optional(),
})

type Context = { params: Promise<{ id: string }> }

export const GET = handle(async (request: Request, context: Context) => {
  const { id } = await context.params
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.read)
  const repo = new GreetingCardRepository()
  const catalog = await repo.getCatalogById(ctx, id)
  if (!catalog) throw notFound()
  return jsonResponse({ data: catalog })
})

export const PATCH = handle(async (request: Request, context: Context) => {
  const { id } = await context.params
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.manage)
  const body = await request.json().catch(() => ({}))
  const parsed = updateCatalogSchema.safeParse(body)
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })

  const repo = new GreetingCardRepository()
  await repo.updateCatalog(ctx, id, parsed.data)
  const updated = await repo.getCatalogById(ctx, id)
  if (!updated) throw notFound()
  return jsonResponse({ data: updated })
})

export const DELETE = handle(async (request: Request, context: Context) => {
  const { id } = await context.params
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.manage)
  const repo = new GreetingCardRepository()
  await repo.deleteCatalog(ctx, id)
  return jsonResponse({ success: true })
})
