import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { GreetingCardRepository } from "@/modules/greeting-card/infra/greeting-card-repository"

const createCatalogSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  type: z.enum(["STANDARD", "CLIENT"]).optional(),
  description: z.string().nullable().optional(),
  filters: z.record(z.string(), z.unknown()).nullable().optional(),
  productIds: z.array(z.string()).optional(),
})

export const GET = handle(async (request: Request) => {
  const { ctx } = await requireTenantContext(request)
  const repo = new GreetingCardRepository()
  const catalogs = await repo.listCatalogs(ctx)
  return jsonResponse({ data: catalogs })
})

export const POST = handle(async (request: Request) => {
  const { ctx } = await requireTenantContext(request)
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
    createdBy: ctx.userId || "user",
  })

  return jsonResponse({ data: catalog }, { status: 201 })
})
