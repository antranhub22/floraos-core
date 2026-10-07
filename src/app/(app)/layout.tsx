// Theo docs/dac-ta/04-frontend-architecture.md mục 2:
// "(app)/layout.tsx — giải phiên, nạp năng lực, dựng khung điều hướng".
//
// Đã nối backend thật: đọc cookie phiên (`floraos_session`) rồi giải qua
// `resolveAppSession` (dùng chung với trang chủ — xem chú thích ở đó) — cùng
// use-case mà GET /auth/me dùng, gọi trực tiếp trong Server Component thay
// vì round-trip qua HTTP. Không có phiên hợp lệ → chuyển sang /dang-nhap.

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { SessionProvider } from "@/lib/session"
import { BottomNav } from "@/components/layout/bottom-nav"
import { DesktopNav } from "@/components/layout/desktop-nav"
import { GlobalImageZoom } from "@/components/ui/global-image-zoom"
import { resolveAppSession } from "@/modules/organization/use-cases/resolve-app-session"
import { SessionTakeoverWatcher } from "@/components/layout/session-takeover-watcher"
import { checkSession } from "@/modules/organization/use-cases/check-session"
import { SESSION_SUPERSEDED } from "@/core/http/errors"
import { LiveRegionProvider } from "@/components/ui/live-region"

import { FloraOSGlobalCopilot } from "@/components/chat/floraos-global-copilot"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ")

  const session = await resolveAppSession(cookieHeader)
  if (!session) {
    // Phiên bị thay bởi lần đăng nhập ở thiết bị khác → trang đăng nhập hiện
    // cảnh báo thay vì im lặng.
    const lyDo = await checkSession(new Request("http://localhost/", { headers: { cookie: cookieHeader } }))
      .then(() => null)
      .catch((e: { details?: { reason?: string } }) => e?.details?.reason ?? null)
    redirect(lyDo === SESSION_SUPERSEDED ? "/dang-nhap?ly-do=thiet-bi-khac" : "/dang-nhap")
  }

  return (
    <SessionProvider session={session}>
      <LiveRegionProvider>
        <a
          href="#noi-dung-chinh"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Bỏ qua tới nội dung
        </a>
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col md:max-w-none md:flex-row">
          <DesktopNav />
          <div id="noi-dung-chinh" tabIndex={-1} className="min-h-0 min-w-0 flex-1 overflow-hidden focus:outline-none">
            {children}
          </div>
          <BottomNav />
        </div>
        <GlobalImageZoom />
        <SessionTakeoverWatcher />
        <FloraOSGlobalCopilot />
      </LiveRegionProvider>
    </SessionProvider>
  )
}
