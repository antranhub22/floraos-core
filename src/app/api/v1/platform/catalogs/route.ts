/** GET /api/v1/platform/catalogs (`N12`, ĐP-3 3.13) — mọi danh mục kèm giá trị. */
import { handle, jsonResponse } from "@/core/http/response"
import { requirePlatformContext } from "@/modules/platform/use-cases/resolve-platform-session"
import { listCatalogs } from "@/modules/field-platform/use-cases/list-catalogs"

export const GET = handle(async (request) => {
  const pctx = await requirePlatformContext(request)
  return jsonResponse({ data: await listCatalogs(pctx) })
})

export const dynamic = "force-dynamic" as const
export const revalidate = 0 as const
