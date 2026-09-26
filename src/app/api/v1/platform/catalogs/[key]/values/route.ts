/** POST /api/v1/platform/catalogs/:key/values (`N12`, ĐP-3 3.13) — thêm giá trị mới. */
import { handle, jsonResponse } from "@/core/http/response"
import { requirePlatformContext } from "@/modules/platform/use-cases/resolve-platform-session"
import { upsertCatalogValue } from "@/modules/field-platform/use-cases/upsert-catalog-value"
import { upsertCatalogValueSchema, parseBody } from "@/modules/field-platform/adapters/http-schemas"

export const POST = handle(async (request, context: { params: Promise<{ key: string }> }) => {
  const pctx = await requirePlatformContext(request)
  const { key } = await context.params
  const body = await parseBody(request, upsertCatalogValueSchema)
  return jsonResponse({ data: await upsertCatalogValue(pctx, { catalogKey: key, ...body }) })
})

export const dynamic = "force-dynamic" as const
export const revalidate = 0 as const
