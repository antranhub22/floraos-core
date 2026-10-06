import { NextResponse } from "next/server"
import { enforceRateLimit } from "@/core/http/rate-limit"
import { openShareLink } from "@/modules/greeting-card/use-cases/share-links"

const COOKIE_PREFIX = "fl_s_"
const COOKIE_MAX_AGE = 30 * 86_400

const gone = () =>
  new NextResponse(
    "<!doctype html><html lang=\"vi\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Link không còn hiệu lực</title><body style=\"font-family:system-ui;padding:32px;text-align:center\"><h1 style=\"font-size:20px\">Link không còn hiệu lực</h1><p>Vui lòng liên hệ cửa hàng để nhận link mới.</p></body></html>",
    { status: 404, headers: { "content-type": "text/html; charset=utf-8" } },
  )

/**
 * GET /s/<mã>/mo — trình duyệt thật của khách (trang /s/<mã> tự chuyển tới đây bằng JavaScript,
 * máy quét xem trước link không chạy tới). Mỗi khách một phiên riêng tính cho người đã sao chép link,
 * nhớ qua cookie để tải lại không tạo phiên mới; rồi chuyển sang trang Thẻ chào `/b/<mã phiên>`.
 */
export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  const code = (await context.params).code.toUpperCase()
  const url = new URL(request.url)
  try {
    await enforceRateLimit(request, { scope: "greeting-share-open", limit: 30, windowMs: 10 * 60_000 })
  } catch {
    return new NextResponse("Bạn mở link quá nhiều lần, vui lòng thử lại sau ít phút.", { status: 429, headers: { "content-type": "text/plain; charset=utf-8" } })
  }
  const cookieName = `${COOKIE_PREFIX}${code}`
  const known = request.headers.get("cookie")?.split(/;\s*/).find((c) => c.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1) ?? null
  const opened = await openShareLink(code, known ? decodeURIComponent(known) : null)
  if (!opened) return gone()

  const res = NextResponse.redirect(new URL(`/b/${encodeURIComponent(opened.sendCode)}`, url), 302)
  res.cookies.set(cookieName, opened.sendCode, { httpOnly: true, sameSite: "lax", secure: url.protocol === "https:", maxAge: COOKIE_MAX_AGE, path: "/" })
  return res
}

export const dynamic = "force-dynamic"
