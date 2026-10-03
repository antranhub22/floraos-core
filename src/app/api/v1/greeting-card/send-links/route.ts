import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { createSendLink } from "@/modules/greeting-card/use-cases/create-send-link"
import { GreetingCardRepository } from "@/modules/greeting-card/infra/greeting-card-repository"

const createSendLinkSchema = z.object({
  catalogId: z.string().optional(),
  catalogCode: z.string().optional(),
  customerName: z.string().nullable().optional(),
  customerPhone: z.string().nullable().optional(),
  prefix: z.string().optional(),
  customCatalog: z
    .object({
      name: z.string(),
      description: z.string().nullable().optional(),
      filters: z.record(z.string(), z.unknown()).nullable().optional(),
      productIds: z.array(z.string()),
    })
    .optional(),
})

export const POST = handle(async (request: Request) => {
  const { ctx } = await requireTenantContext(request)
  const body = await request.json().catch(() => ({}))
  const parsed = createSendLinkSchema.safeParse(body)
  if (!parsed.success) {
    throw validationFailed({ issues: parsed.error.issues })
  }

  const result = await createSendLink(ctx, {
    catalogId: parsed.data.catalogId,
    catalogCode: parsed.data.catalogCode,
    customerName: parsed.data.customerName,
    customerPhone: parsed.data.customerPhone,
    prefix: parsed.data.prefix,
    customCatalog: parsed.data.customCatalog
      ? {
          name: parsed.data.customCatalog.name,
          description: parsed.data.customCatalog.description,
          filters: parsed.data.customCatalog.filters,
          productIds: parsed.data.customCatalog.productIds,
        }
      : undefined,
  })
  return jsonResponse({ data: result }, { status: 201 })
})

export const GET = handle(async (request: Request) => {
  const { ctx } = await requireTenantContext(request)
  const url = new URL(request.url)
  const saleId = url.searchParams.get("sale_id") || undefined
  const catalogId = url.searchParams.get("catalog_id") || undefined
  const status = url.searchParams.get("status") || undefined

  const repo = new GreetingCardRepository()
  const sessions = await repo.listSessions(ctx, { saleId, catalogId, status })
  return jsonResponse({ data: sessions })
})
