import { z } from "zod"
import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { GreetingCardRepository } from "@/modules/greeting-card/infra/greeting-card-repository"

const addProductSchema = z.object({ productId: z.string().min(1) })
const removeProductSchema = z.object({ productId: z.string().min(1) })

type Context = { params: Promise<{ id: string }> }

export const POST = handle(async (request: Request, context: Context) => {
  const { id } = await context.params
  const { ctx } = await requireTenantContext(request)
  const body = await request.json().catch(() => ({}))
  const parsed = addProductSchema.safeParse(body)
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  const repo = new GreetingCardRepository()
  const item = await repo.addProductToCatalog(ctx, id, parsed.data.productId)
  return jsonResponse({ data: item }, { status: 201 })
})

export const DELETE = handle(async (request: Request, context: Context) => {
  const { id } = await context.params
  const { ctx } = await requireTenantContext(request)
  const body = await request.json().catch(() => ({}))
  const parsed = removeProductSchema.safeParse(body)
  if (!parsed.success) throw validationFailed({ issues: parsed.error.issues })
  const repo = new GreetingCardRepository()
  await repo.removeProductFromCatalog(ctx, id, parsed.data.productId)
  return jsonResponse({ success: true })
})
