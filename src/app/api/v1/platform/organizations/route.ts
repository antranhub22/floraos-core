/**
 * GET /api/v1/platform/organizations (`N1`, P25a).
 * Xem đặc tả 06 mục 21 — ngoại lệ có chủ đích với Luật 2.
 */
import { handle, jsonResponse } from "@/core/http/response"
import { requirePlatformContext } from "@/modules/platform/use-cases/resolve-platform-session"
import { listOrganizations } from "@/modules/platform/use-cases/list-organizations"

export const GET = handle(async (request) => {
  const pctx = await requirePlatformContext(request)
  return jsonResponse({ data: await listOrganizations(pctx) })
})

export const dynamic = "force-dynamic" as const
export const revalidate = 0 as const
