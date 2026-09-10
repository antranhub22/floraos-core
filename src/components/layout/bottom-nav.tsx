"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Package, Camera, CheckCircle2, Plus } from "lucide-react"
import { useSession } from "@/lib/session"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const pathname = usePathname()
  const { can } = useSession()
  // Duyệt chỉ hiện với người có H3 hoặc I2 (đặc tả 03 mục 3).
  // Người khác thấy "Job của tôi" ở đúng vị trí đó — bản demo chỉ dựng nhánh có quyền duyệt.
  const canApprove = can("H3") || can("I2")

  const items = [
    { href: "/", label: "Trang chủ", icon: Home },
    { href: "/san-pham", label: "Sản phẩm", icon: Package },
  ] as const

  const approvalItem = canApprove
    ? { href: "/duyet" as const, label: "Duyệt", icon: CheckCircle2, dot: true }
    : { href: "/job" as const, label: "Job của tôi", icon: CheckCircle2, dot: false }

  return (
    <nav className="flex h-16 flex-shrink-0 items-stretch border-t border-border bg-surface px-1 md:hidden">
      {items.map((item) => {
        const active = pathname === item.href
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
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

      <Link href="/tai-anh" className="flex flex-1 flex-col items-center justify-center gap-0.5">
        <div className="-mt-5 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30">
          <Camera size={22} color="#fff" strokeWidth={2} />
        </div>
        <span className="text-[10.5px] font-bold text-primary">Tải ảnh</span>
      </Link>

      <Link href={approvalItem.href} className="relative flex flex-1 flex-col items-center justify-center gap-1 text-text-muted">
        <span className="relative">
          <approvalItem.icon size={20} strokeWidth={1.9} />
          {approvalItem.dot && (
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent" />
          )}
        </span>
        <span className="text-[10.5px]">{approvalItem.label}</span>
      </Link>

      <Link href="/them" className="flex flex-1 flex-col items-center justify-center gap-1 text-text-muted">
        <Plus size={20} strokeWidth={1.9} />
        <span className="text-[10.5px]">Thêm</span>
      </Link>
    </nav>
  )
}
