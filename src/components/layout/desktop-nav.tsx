"use client"

import { useState, useRef, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  Bell,
  Home,
  Menu,
  X,
  Settings2,
  BookOpen,
  WalletCards,
  FileText,
  Sparkles,
  Folder,
  Camera,
  Share2,
  Bot,
  Users,
  ShoppingBag,
  Video,
  Globe,
  Tag,
  CircleUserRound,
  FlaskConical,
  LayoutTemplate,
} from "lucide-react"
import { useSession } from "@/lib/session"
import { cn } from "@/lib/utils"

export type NavItem = {
  href: string
  label: string
  icon: typeof Home
  badge?: string
  badgeColor?: string
  code?: string
}

// 1. Khối Nổi Bật Đặc Biệt (SSOT Knowledge Base & AI Chat Assistant)
const FEATURED_ITEMS: NavItem[] = [
  {
    href: "/tri-thuc",
    label: "Tri thức & Nhập liệu",
    icon: BookOpen,
    badge: "SSOT Guide",
    badgeColor: "bg-red-100 text-red-700",
  },
  {
    href: "/hoi-thoai",
    label: "AI Chat Assistant",
    icon: Bot,
    badge: "Đa Kênh",
    badgeColor: "bg-rose-100 text-rose-700",
  },
]

// 2. Phân Hệ Nghiệp Vụ Cốt Lõi
const CORE_ITEMS: NavItem[] = [
  { href: "/", label: "Trang chủ", icon: Home },
  { href: "/san-pham", label: "Sản phẩm & Giá", icon: Tag },
  { href: "/tai-anh", label: "Phân tích hoa Vision", icon: Camera },
  { href: "/creative-studio", label: "Creative Studio", icon: Sparkles },
  { href: "/video", label: "Video Studio 9:16", icon: Video },
  { href: "/catalog", label: "Catalog & Website", icon: Globe },
  { href: "/khach-hang", label: "CRM & Khách hàng", icon: Users },
  { href: "/don-hang", label: "Đơn hàng & SLA", icon: ShoppingBag },
]

// 3. Quản Trị Hệ Thống
const SYSTEM_ITEMS: NavItem[] = [
  { href: "/kho-du-lieu", label: "Kho Dữ liệu", icon: Folder },
  { href: "/kho-templates", label: "Kho Templates", icon: LayoutTemplate },
  { href: "/muc-dung", label: "Mức dùng Credit", icon: WalletCards },
  { href: "/cai-dat", label: "Cài đặt", icon: Settings2 },
]

export function DesktopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { can } = useSession()

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function renderNavItem(item: NavItem) {
    if (item.code && !can(item.code)) return null
    const active =
      pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`))
    const Icon = item.icon

    return (
      <button
        key={item.href}
        type="button"
        onClick={() => router.push(item.href as never)}
        className={cn(
          "group flex h-9 w-full items-center justify-between rounded-lg px-2.5 text-[12.5px] font-medium transition-colors text-left",
          active
            ? "bg-red-50 font-bold text-red-700"
            : "text-text-muted hover:bg-surface-alt hover:text-text"
        )}
        aria-current={active ? "page" : undefined}
      >
        <div className="flex items-center gap-2.5 truncate">
          <Icon
            size={16}
            strokeWidth={active ? 2.2 : 1.9}
            className={active ? "text-red-600" : "text-text-muted group-hover:text-text"}
          />
          <span className="truncate">{item.label}</span>
        </div>
        {item.badge && (
          <span
            className={cn(
              "rounded-full px-1.5 py-0.2 text-[9.5px] font-extrabold tracking-wide uppercase shrink-0",
              item.badgeColor || "bg-muted text-muted-foreground"
            )}
          >
            {item.badge}
          </span>
        )}
      </button>
    )
  }

  return (
    <aside className="hidden h-dvh w-60 flex-shrink-0 flex-col border-r border-border bg-surface md:flex">
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-xs">
            <Sparkles size={16} strokeWidth={2.2} />
          </div>
          <div className="flex flex-col">
            <div className="text-[13px] font-extrabold text-primary leading-tight">FloraOS</div>
            <div className="text-[10px] text-text-muted font-medium">SaaS Operations SSOT</div>
          </div>
        </div>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
              menuOpen ? "bg-surface-alt text-primary" : "text-text-muted hover:bg-surface-alt"
            )}
            aria-label="Menu chức năng"
          >
            {menuOpen ? <X size={16} strokeWidth={2} /> : <Menu size={16} strokeWidth={2} />}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-border bg-surface py-1.5 shadow-xl">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Tất cả phân hệ
              </div>
              {[...FEATURED_ITEMS, ...CORE_ITEMS, ...SYSTEM_ITEMS].map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    router.push(item.href as never)
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium transition-colors",
                    pathname === item.href ? "bg-red-50 font-bold text-red-700" : "text-text hover:bg-surface-alt"
                  )}
                >
                  <item.icon size={14} className="text-text-muted" />
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation Scroll Area */}
      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-3">
        {/* Khối Nổi Bật: Tri thức & AI Chat */}
        <div className="space-y-1">
          <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Trợ Lý & Cẩm Nang
          </div>
          {FEATURED_ITEMS.map(renderNavItem)}
        </div>

        {/* Khối Nghiệp Vụ Cốt Lõi */}
        <div className="space-y-1">
          <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Nghiệp Vụ Hoa Tươi
          </div>
          {CORE_ITEMS.map(renderNavItem)}
        </div>

        {/* Khối Quản Trị & Hệ Thống */}
        <div className="space-y-1">
          <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Hệ Thống & Dữ Liệu
          </div>
          {SYSTEM_ITEMS.map(renderNavItem)}
        </div>
      </nav>

      {/* Footer Copilot Trigger & Thông Báo */}
      <div className="border-t border-border p-3 space-y-2">
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))
          }}
          className="w-full flex items-center justify-between rounded-xl bg-red-50/80 hover:bg-red-100/80 border border-red-200/80 p-2.5 text-left transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-600 text-white shadow-xs">
              <Bot size={13} />
            </span>
            <div>
              <div className="text-[11.5px] font-bold text-red-950">FloraOS Copilot</div>
              <div className="text-[10px] text-red-700 font-medium">Trợ lý hỗ trợ 24/7</div>
            </div>
          </div>
          <kbd className="rounded bg-white/80 px-1.5 py-0.5 text-[9.5px] font-mono text-red-900 border border-red-200">
            ⌘K
          </kbd>
        </button>
      </div>
    </aside>
  )
}
