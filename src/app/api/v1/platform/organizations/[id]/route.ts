/**
 * GET /api/v1/platform/organizations/:id (`N1`, P25a).
 * Không lọc theo tổ chức của người gọi. Xem đặc tả 06 mục 21.
 */
import { handle, jsonResponse } from "@/core/http/response"
import { requirePlatformContext } from "@/modules/platform/use-cases/resolve-platform-session"
import { getOrganization } from "@/modules/platform/use-cases/get-organization"

export const GET = handle(async (request, context: { params: Promise<{ id: string }> }) => {
  const pctx = await requirePlatformContext(request)
  const { id } = await context.params
  return jsonResponse({ data: await getOrganization(pctx, id) })
})

export const dynamic = "force-dynamic" as const
export const revalidate = 0 as const
