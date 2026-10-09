"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Package,
  Camera,
  CheckCircle2,
  Plus,
  Radio,
  ShoppingBag,
  Users,
  Bot,
  Tag,
  Clock,
  Sparkles,
  TrendingUp,
  Folder,
  type LucideIcon,
} from "lucide-react"
import { useSession } from "@/lib/session"
import { cn } from "@/lib/utils"
import { mobileSecondSlot, NAV_ENTRIES, type NavEntry } from "./nav-model"

const ICONS: Record<string, LucideIcon> = {
  Home,
  Users,
  ShoppingBag,
  Bot,
  Tag,
  Camera,
  Folder,
  TrendingUp,
  Sparkles,
  Radio,
  Clock,
  CheckCircle2,
  Package,
}

export function BottomNav() {
  const pathname = usePathname()
  const { can, roleUx } = useSession()
  const canApprove = can("H3") || can("I2")

  const slot2 = mobileSecondSlot(can, roleUx)
  const Slot2Icon = ICONS[slot2.iconKey] || Tag

  // Nút giữa gác H1: có H1 thì là Tải ảnh (Camera), không có H1 thì lấy việc chính đầu tiên hoặc Sản phẩm
  const hasH1 = can("H1")
  let centerAction: { href: string; label: string; icon: LucideIcon }
  if (hasH1) {
    centerAction = { href: "/tai-anh", label: "Tải ảnh", icon: Camera }
  } else {
    const fallbackHref = roleUx?.navPriority.find((h) => h !== slot2.href && h !== "/") ?? "/san-pham"
    const fallbackEntry = NAV_ENTRIES.find((e) => e.href === fallbackHref)
    centerAction = {
      href: fallbackEntry?.href ?? "/san-pham",
      label: fallbackEntry?.mobileLabel ?? fallbackEntry?.label ?? "Sản phẩm",
      icon: (fallbackEntry ? ICONS[fallbackEntry.iconKey] : null) || Package,
    }
  }

  const CenterIcon = centerAction.icon

  return (
    <nav
      aria-label="Điều hướng nhanh"
      className="flex h-16 flex-shrink-0 items-stretch border-t border-border bg-surface px-1 md:hidden"
    >
      {/* 1. Trang chủ */}
      <Link
        href={"/" as never}
        aria-current={pathname === "/" ? "page" : undefined}
        className={cn(
          "relative flex flex-1 flex-col items-center justify-center gap-1 text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors",
          pathname === "/" && "font-bold text-primary"
        )}
      >
        {pathname === "/" && (
          <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" aria-hidden="true" />
        )}
        <Home size={20} strokeWidth={pathname === "/" ? 2.4 : 1.9} />
        <span className="text-caption">Trang chủ</span>
      </Link>

      {/* 2. Ô thứ hai theo vai */}
      {(() => {
        const isSlot2Active = pathname === slot2.href || (slot2.href !== "/" && pathname.startsWith(`${slot2.href}/`))
        return (
          <Link
            href={slot2.href as never}
            aria-current={isSlot2Active ? "page" : undefined}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-1 text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors",
              isSlot2Active && "font-bold text-primary"
            )}
          >
            {isSlot2Active && (
              <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" aria-hidden="true" />
            )}
            <Slot2Icon size={20} strokeWidth={isSlot2Active ? 2.4 : 1.9} />
            <span className="text-caption truncate max-w-[64px]">
              {slot2.mobileLabel || slot2.label}
            </span>
          </Link>
        )
      })()}

      {/* 3. Nút hành động chính ở giữa (Tải ảnh hoặc Việc chính đầu tiên) */}
      <Link
        href={centerAction.href as never}
        aria-current={pathname === centerAction.href ? "page" : undefined}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <div className="-mt-5 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30">
          <CenterIcon size={22} className="text-white" strokeWidth={2} />
        </div>
        <span className="text-caption font-bold text-primary truncate max-w-[64px]">
          {centerAction.label}
        </span>
      </Link>

      {/* 4. Duyệt hoặc Job */}
      {canApprove ? (
        (() => {
          const isDuyetActive = pathname === "/duyet" || pathname.startsWith("/duyet/")
          return (
            <Link
              href={"/duyet" as never}
              aria-current={isDuyetActive ? "page" : undefined}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors",
                isDuyetActive && "font-bold text-primary"
              )}
            >
              {isDuyetActive && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" aria-hidden="true" />
              )}
              <div className="relative">
                <CheckCircle2 size={20} strokeWidth={isDuyetActive ? 2.4 : 1.9} />
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary" />
              </div>
              <span className="text-caption">Duyệt</span>
            </Link>
          )
        })()
      ) : (
        (() => {
          const isJobActive = pathname === "/job" || pathname.startsWith("/job/")
          return (
            <Link
              href={"/job" as never}
              aria-current={isJobActive ? "page" : undefined}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors",
                isJobActive && "font-bold text-primary"
              )}
            >
              {isJobActive && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" aria-hidden="true" />
              )}
              <Clock size={20} strokeWidth={isJobActive ? 2.4 : 1.9} />
              <span className="text-caption">Job của tôi</span>
            </Link>
          )
        })()
      )}

      {/* 5. Thêm */}
      {(() => {
        const isThemActive = pathname === "/them" || pathname.startsWith("/them/")
        return (
          <Link
            href={"/them" as never}
            aria-current={isThemActive ? "page" : undefined}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-1 text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors",
              isThemActive && "font-bold text-primary"
            )}
          >
            {isThemActive && (
              <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" aria-hidden="true" />
            )}
            <Plus size={20} strokeWidth={isThemActive ? 2.4 : 1.9} />
            <span className="text-caption">Thêm</span>
          </Link>
        )
      })()}
    </nav>
  )
}
