/**
 * GET /api/v1/platform/usage (`N4`, P25a) — usage & chi phí gộp toàn hệ
 * thống. Xem đặc tả 06 mục 21.
 */
import { handle, jsonResponse } from "@/core/http/response"
import { requirePlatformContext } from "@/modules/platform/use-cases/resolve-platform-session"
import { summarizeUsage } from "@/modules/platform/use-cases/summarize-usage"

export const GET = handle(async (request) => {
  const pctx = await requirePlatformContext(request)
  const since = new URL(request.url).searchParams.get("since")
  return jsonResponse({
    data: await summarizeUsage(pctx, since ? { since: new Date(since) } : {}),
  })
})

export const dynamic = "force-dynamic" as const
export const revalidate = 0 as const
