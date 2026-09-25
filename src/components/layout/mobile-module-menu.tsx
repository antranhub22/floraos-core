"use client"

// Menu đầy đủ trên điện thoại (nợ #135). Trên mobile `DesktopNav` ẩn hoàn toàn
// (`hidden md:flex`) và `BottomNav` chỉ có năm mục, nên trước đây không vào
// được phần lớn chức năng. Menu này hiện ở trang "Thêm", dùng CHUNG danh sách
// `NAV_GROUPS` với thanh bên desktop để hai nơi không lệch nhau.
// Wireframe: canvas FloraOS Wireframes, khung `M-Them` (đã duyệt 25/09/2026).

import Link from "next/link"
import { usePathname } from "next/navigation"

import { NAV_GROUPS, type NavItem } from "@/components/layout/desktop-nav"
import { useSession } from "@/lib/session"
import { cn } from "@/lib/utils"

export type NavGroup = { title: string; items: NavItem[] }

/**
 * Lọc menu theo quyền — cùng luật với thanh bên desktop: mục có `code` chỉ hiện
 * khi phiên có năng lực đó. Nhóm rỗng sau khi lọc thì bỏ. Đây là ẩn/hiện giao
 * diện, không phải kiểm quyền: máy chủ vẫn kiểm ở mọi endpoint.
 */
export function visibleNavGroups(groups: NavGroup[], can: (code: string) => boolean): NavGroup[] {
  return groups
    .map((g) => ({ ...g, items: g.items.filter((item) => !item.code || can(item.code)) }))
    .filter((g) => g.items.length > 0)
}

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false
  const path = href.split("?")[0]
  if (path === "/") return pathname === "/"
  return pathname === path || pathname.startsWith(`${path}/`)
}

export function MobileModuleMenu({ groups = NAV_GROUPS }: { groups?: NavGroup[] }) {
  const pathname = usePathname()
  const { can } = useSession()
  const visible = visibleNavGroups(groups, can)

  return (
    <nav aria-label="Tất cả chức năng" className="flex flex-col gap-4 md:hidden">
      {visible.map((group) => (
        <section key={group.title} className="flex flex-col gap-2">
          <h2 className="px-1 text-[11px] font-bold uppercase tracking-wider text-text-muted">{group.title}</h2>
          <div className="grid grid-cols-2 gap-2">
            {group.items.map((item) => {
              const Icon = item.icon
              const active = isActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href as never}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-[13px] font-semibold text-text",
                    active && "border-primary text-primary"
                  )}
                >
                  <Icon size={18} strokeWidth={1.8} className="flex-shrink-0" aria-hidden="true" />
                  <span className="min-w-0 leading-tight">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </nav>
  )
}
