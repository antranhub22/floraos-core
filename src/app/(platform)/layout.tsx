// Console Vận hành Nền tảng — ngữ cảnh song song với `(app)/layout.tsx`
// (chốt 18/09, kế hoạch mục 4.2/4.6). Giải `PlatformContext` từ CÙNG
// cookie phiên (`floraos_session`) nhưng KHÔNG qua `resolveAppSession` —
// hai bảng nguồn (`memberships`, `platform_operators`) độc lập, một tài
// khoản có thể vừa là thành viên tổ chức vừa là người vận hành.
//
// Không phải người vận hành (chưa đăng nhập, hoặc đã đăng nhập nhưng
// không có dòng `platform_operators` đang hoạt động) → về "/", không lộ
// rằng route này tồn tại.

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"

import { resolvePlatformSession } from "@/modules/platform/use-cases/resolve-platform-session"

const MUC: Array<{ href: string; nhan: string }> = [
  { href: "/van-hanh", nhan: "Tổng quan" },
  { href: "/van-hanh/to-chuc", nhan: "Tổ chức" },
  { href: "/van-hanh/muc-dung", nhan: "Mức dùng" },
  { href: "/van-hanh/suc-khoe", nhan: "Sức khoẻ hệ thống" },
  { href: "/van-hanh/nhat-ky", nhan: "Nhật ký" },
]

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ")
  const request = new Request("http://localhost/", { headers: { cookie: cookieHeader } })

  const pctx = await resolvePlatformSession(request)
  if (!pctx) redirect("/")

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col">
      <header className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Vận hành nền tảng</p>
          <p className="text-[13px] text-text-muted">Xuyên tổ chức — không phải màn của một tổ chức nào</p>
        </div>
        <nav className="flex flex-wrap gap-1">
          {MUC.map((m) => (
            <Link
              key={m.href}
              href={m.href as never}
              className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-text hover:bg-surface-alt"
            >
              {m.nhan}
            </Link>
          ))}
        </nav>
      </header>
      <main className="min-h-0 flex-1 overflow-auto p-4">{children}</main>
    </div>
  )
}
