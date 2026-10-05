import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { createSendLink } from "@/modules/greeting-card/use-cases/create-send-link"
import { GreetingCardRepository } from "@/modules/greeting-card/infra/greeting-card-repository"
import { parseListQuery, toPage } from "@/modules/greeting-card/contracts/list-query"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"

const createSendLinkSchema = z.object({
  catalogId: z.string().max(64).optional(),
  catalogCode: z.string().max(40).optional(),
  customerName: z.string().max(100).nullable().optional(),
  customerPhone: z.string().max(20).nullable().optional(),
  prefix: z.string().max(10).optional(),
  // null = không hết hạn; bỏ trống = mặc định 30 ngày
  expiresInDays: z.number().int().min(1).max(365).nullable().optional(),
  customCatalog: z
    .object({
      name: z.string().max(120),
      description: z.string().max(1000).nullable().optional(),
      filters: z.record(z.string(), z.unknown()).nullable().optional(),
      productIds: z.array(z.string().min(1)).min(1).max(200),
    })
    .optional(),
})

const SESSION_STATUSES = [
  "CREATED", "OPENED", "BROWSING", "SELECTED", "ORDER_SUBMITTED", "PAYMENT_REPORTED", "COMPLETED",
] as const

export const POST = handle(async (request: Request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.manage)
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
    expiresInDays: parsed.data.expiresInDays,
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
  requireCapability(ctx, GREETING_CARD_CAPABILITY.orderRead)
  const url = new URL(request.url)
  const saleId = url.searchParams.get("sale_id") || undefined
  const catalogId = url.searchParams.get("catalog_id") || undefined
  const statusParam = url.searchParams.get("status") || undefined
  const status = SESSION_STATUSES.find((s) => s === statusParam)
  if (statusParam && !status) throw validationFailed({ status: `Phải là một trong: ${SESSION_STATUSES.join(", ")}` })
  const { limit, cursor } = parseListQuery(url)

  const repo = new GreetingCardRepository()
  const rows = await repo.listSessions(ctx, { saleId, catalogId, status, limit, cursor })
  return jsonResponse(toPage(rows, limit))
})
