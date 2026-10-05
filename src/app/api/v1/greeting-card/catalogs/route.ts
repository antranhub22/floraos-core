import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { GreetingCardRepository } from "@/modules/greeting-card/infra/greeting-card-repository"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"

const createCatalogSchema = z.object({
  code: z.string().trim().min(2).max(40).regex(/^[a-zA-Z0-9-]+$/, "Mã chỉ gồm chữ, số và dấu gạch ngang"),
  name: z.string().trim().min(2).max(120),
  type: z.enum(["STANDARD", "CLIENT"]).optional(),
  description: z.string().max(1000).nullable().optional(),
  filters: z.record(z.string(), z.unknown()).nullable().optional(),
  productIds: z.array(z.string().min(1)).max(200).optional(),
})

export const GET = handle(async (request: Request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.read)
  const repo = new GreetingCardRepository()
  const catalogs = await repo.listCatalogs(ctx)
  return jsonResponse({ data: catalogs })
})

export const POST = handle(async (request: Request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.manage)
  const body = await request.json().catch(() => ({}))
  const parsed = createCatalogSchema.safeParse(body)
  if (!parsed.success) {
    throw validationFailed({ issues: parsed.error.issues })
  }

  const repo = new GreetingCardRepository()
  const catalog = await repo.createCatalog(ctx, {
    code: parsed.data.code,
    name: parsed.data.name,
    type: parsed.data.type,
    description: parsed.data.description,
    filters: parsed.data.filters,
    productIds: parsed.data.productIds,
    createdBy: ctx.userId,
  })

  return jsonResponse({ data: catalog }, { status: 201 })
})
