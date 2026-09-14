"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Package, Camera, CheckCircle2, Plus } from "lucide-react"
import { useSession } from "@/lib/session"
import { cn } from "@/lib/utils"

type BottomNavItem = {
  href: string
  label: string
  icon: typeof Home
  dot?: boolean
}

export function BottomNav() {
  const pathname = usePathname()
  const { can } = useSession()
  const canApprove = can("H3") || can("I2")

  const leftItems: BottomNavItem[] = [
    { href: "/", label: "Trang chủ", icon: Home },
    { href: "/san-pham", label: "Sản phẩm", icon: Package },
  ]

  const approvalItem: BottomNavItem = canApprove
    ? { href: "/duyet", label: "Duyệt", icon: CheckCircle2, dot: true }
    : { href: "/job", label: "Job của tôi", icon: CheckCircle2 }

  const allItems: BottomNavItem[] = [
    ...leftItems,
    approvalItem,
  ]

  return (
    <nav className="flex h-16 flex-shrink-0 items-stretch border-t border-border bg-surface px-1 md:hidden">
      {allItems.map((item) => {
        const active = pathname === item.href
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href as never}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-text-muted",
              active && "font-bold text-primary"
            )}
          >
            <Icon size={20} strokeWidth={1.9} />
            <span className="text-[10.5px]">{item.label}</span>
          </Link>
        )
      })}

      <Link href={"/tai-anh" as never} className="flex flex-1 flex-col items-center justify-center gap-0.5 text-text-muted">
        <div className="-mt-5 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30">
          <Camera size={22} color="#fff" strokeWidth={2} />
        </div>
        <span className="text-[10.5px] font-bold text-primary">Tải ảnh</span>
      </Link>

      <Link href="/them" className="flex flex-1 flex-col items-center justify-center gap-1 text-text-muted">
        <Plus size={20} strokeWidth={1.9} />
        <span className="text-[10.5px]">Thêm</span>
      </Link>
    </nav>
  )
}
