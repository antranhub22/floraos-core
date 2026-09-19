/**
 * GET /api/v1/platform/health (`N5`, P25a) — chỉ đọc + cảnh báo (D-N5),
 * không nút hành động. Xem đặc tả 06 mục 21.
 */
import { handle, jsonResponse } from "@/core/http/response"
import { requirePlatformContext } from "@/modules/platform/use-cases/resolve-platform-session"
import { readSystemHealth } from "@/modules/platform/use-cases/read-system-health"

export const GET = handle(async (request) => {
  const pctx = await requirePlatformContext(request)
  return jsonResponse({ data: await readSystemHealth(pctx) })
})

export const dynamic = "force-dynamic" as const
export const revalidate = 0 as const
