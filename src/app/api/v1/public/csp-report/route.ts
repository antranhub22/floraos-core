import { enforceRateLimit } from "@/core/http/rate-limit"
import { handle } from "@/core/http/response"
import { log } from "@/core/observability/log"

/**
 * POST /api/v1/public/csp-report — trình duyệt gửi báo cáo khi trang tải một
 * nguồn nằm ngoài CSP (chế độ Report-Only: KHÔNG chặn gì, khách không thấy).
 * Chỉ ghi nguồn bị vi phạm, không ghi nội dung trang.
 */
export const POST = handle(async (request: Request) => {
  await enforceRateLimit(request, { scope: "csp-report", limit: 60, windowMs: 60_000 })
  const body = (await request.json().catch(() => null)) as { "csp-report"?: Record<string, unknown> } | null
  const r = body?.["csp-report"]
  if (r) {
    const str = (v: unknown) => (typeof v === "string" ? v.slice(0, 300) : undefined)
    log.warn("csp.violation", {
      feature: "csp",
      directive: str(r["effective-directive"] ?? r["violated-directive"]),
      blocked: str(r["blocked-uri"]),
      page: str(r["document-uri"])?.split("?")[0],
    })
  }
  return new Response(null, { status: 204 })
})

export const dynamic = "force-dynamic"
