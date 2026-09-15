"use client"

import { useState, useRef, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  Bell,
  Home,
  Menu,
  X,
  Settings2,
  FlaskConical,
  CircleUserRound,
  BookOpen,
  WalletCards,
  FileText,
  Sparkles,
  Folder,
  Camera,
  Share2,
} from "lucide-react"
import { useSession } from "@/lib/session"
import { cn } from "@/lib/utils"

export type NavItem = {
  href: string
  label: string
  icon: typeof Home
  code?: string
}

const SYSTEM_ITEMS: NavItem[] = [
  { href: "/kho-du-lieu", label: "Kho Dữ liệu", icon: Folder },
  { href: "/tai-anh", label: "Phân tích ảnh", icon: Camera },
  { href: "/cai-dat", label: "Cài đặt", icon: Settings2 },
  { href: "/cai-dat-ai", label: "Chính sách AI", icon: FlaskConical },
  { href: "/ho-so", label: "Hồ sơ", icon: CircleUserRound },
  { href: "/tich-hop", label: "Tích hợp", icon: BookOpen },
  { href: "/ket-noi", label: "Kết nối nền tảng", icon: Share2 },
  { href: "/muc-dung", label: "Mức dùng", icon: WalletCards },
  { href: "/audit", label: "Nhật ký", icon: FileText },
]

const FUNCTION_ITEMS: NavItem[] = [
  { href: "/", label: "Trang chủ", icon: Home },
  { href: "/kho-du-lieu", label: "Kho Dữ liệu", icon: Folder },
  { href: "/san-pham", label: "Sản phẩm", icon: Home },
  { href: "/tai-anh", label: "Phân tích ảnh", icon: Camera },
  { href: "/creative-studio", label: "Creative Studio", icon: Home },
  { href: "/video", label: "Video Studio", icon: Home },
  { href: "/noi-dung", label: "Content Engine", icon: Home },
  { href: "/lich-dang", label: "Social Publishing", icon: Home },
  { href: "/ket-noi", label: "Kết nối nền tảng", icon: Share2 },
  { href: "/catalog", label: "Catalog & Website", icon: Home },
  { href: "/khach-hang", label: "CRM & Khách hàng", icon: Home },
  { href: "/don-hang", label: "Đơn hàng", icon: Home },
  { href: "/hoi-thoai", label: "Chat Assistant", icon: Home },
  { href: "/so-lieu", label: "Analytics", icon: Home },
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

  return (
    <aside className="hidden h-dvh w-56 flex-shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary">
          <Sparkles size={16} color="#fff" strokeWidth={2.2} />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="text-[13px] font-extrabold text-primary truncate">FloraOS</div>
        </div>
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
              menuOpen ? "bg-surface-alt text-primary" : "text-text-muted hover:bg-surface-alt"
            )}
            aria-label="Menu chức năng"
          >
            {menuOpen ? <X size={18} strokeWidth={2} /> : <Menu size={18} strokeWidth={2} />}
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-11 z-50 w-52 rounded-xl border border-border bg-surface py-1.5 shadow-lg">
              <div className="px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-muted">
                Chức năng
              </div>
              {FUNCTION_ITEMS.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    router.push(item.href as never)
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] font-medium transition-colors",
                    pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`))
                      ? "bg-primary/10 font-bold text-primary"
                      : "text-text hover:bg-surface-alt"
                  )}
                >
                  {item.label}
                </button>
              ))}
              <div className="my-1 border-t border-border" />
              <div className="px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-muted">
                Hệ thống
              </div>
              {SYSTEM_ITEMS.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    router.push(item.href as never)
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] font-medium transition-colors",
                    pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`))
                      ? "bg-primary/10 font-bold text-primary"
                      : "text-text hover:bg-surface-alt"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {SYSTEM_ITEMS.map((item) => {
          if (item.code && !can(item.code)) return null
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`))
          const Icon = item.icon
          return (
            <button
              key={item.href}
              type="button"
              onClick={() => router.push(item.href as never)}
              className={cn(
                "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors text-left",
                active
                  ? "bg-primary/10 font-bold text-primary"
                  : "text-text-muted hover:bg-surface-alt hover:text-text"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={16} strokeWidth={1.9} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="rounded-xl bg-surface-alt p-3">
          <div className="flex items-center gap-2 text-[12.5px] font-semibold text-text">
            <Bell size={15} className="text-text-muted" />
            Trung tâm thông báo
          </div>
          <div className="mt-1 text-[11px] leading-snug text-text-muted">
            Theo dõi job, lượt duyệt và thay đổi quan trọng.
          </div>
        </div>
      </div>
    </aside>
  )
}
