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
import { resolveAppSession } from "@/modules/organization/use-cases/resolve-app-session"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ")

  const session = await resolveAppSession(cookieHeader)
  if (!session) {
    redirect("/dang-nhap")
  }

  return (
    <SessionProvider session={session}>
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-bg md:max-w-none">
        <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
        <BottomNav />
      </div>
    </SessionProvider>
  )
}
