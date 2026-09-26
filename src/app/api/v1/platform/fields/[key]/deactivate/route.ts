/** POST /api/v1/platform/fields/:key/deactivate (`N12`, ĐP-3 3.13). */
import { handle, jsonResponse } from "@/core/http/response"
import { requirePlatformContext } from "@/modules/platform/use-cases/resolve-platform-session"
import { deactivateField } from "@/modules/field-platform/use-cases/deactivate-field"

export const POST = handle(async (request, context: { params: Promise<{ key: string }> }) => {
  const pctx = await requirePlatformContext(request)
  const { key } = await context.params
  return jsonResponse({ data: await deactivateField(pctx, key) })
})

export const dynamic = "force-dynamic" as const
export const revalidate = 0 as const
