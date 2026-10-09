"use client"

// Footer thanh điều hướng bên trái (Desktop Sidebar Footer)
// Bao gồm: Phím tắt kích hoạt FloraOS Copilot + Thẻ thông tin tài khoản người dùng và nút Đăng xuất nhanh

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bot, LogOut } from "lucide-react"
import { useSession } from "@/lib/session"
import { UserMenu } from "./user-menu"

export function DesktopNavFooter() {
  const router = useRouter()
  const { userName, userInitials, orgName, roleUx } = useSession()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleQuickLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" })
    } catch {
      // Vẫn chuyển hướng dù lỗi mạng hoặc phiên đã hết hạn
    } finally {
      router.push("/dang-nhap")
      router.refresh()
    }
  }

  return (
    <div className="border-t border-border p-3 space-y-2 bg-surface">
      {/* Phím tắt Copilot */}
      <button
        type="button"
        onClick={() => {
          window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))
        }}
        className="w-full flex items-center justify-between rounded-xl bg-surface-alt hover:bg-surface-alt/80 border border-border p-2.5 text-left transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-white shadow-xs">
            <Bot size={13} />
          </span>
          <div>
            <div className="text-caption font-bold text-text">FloraOS Copilot</div>
            <div className="text-caption text-text-muted font-medium">Trợ lý hỗ trợ 24/7</div>
          </div>
        </div>
        <kbd className="rounded bg-surface px-1.5 py-0.5 text-caption font-mono text-text border border-border">
          ⌘K
        </kbd>
      </button>

      {/* Thẻ người dùng & Nút Đăng xuất nhanh */}
      <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface-alt/50 p-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <UserMenu initials={userInitials || "U"} direction="up" size="sm" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-caption font-bold text-text" title={userName}>
              {userName || "Người dùng"}
            </div>
            <div className="truncate text-caption text-text-muted" title={roleUx?.label ?? (orgName || "").replace(/\s*\(\s*dev\s*\)/gi, "").trim()}>
              {roleUx?.label ?? (orgName || "").replace(/\s*\(\s*dev\s*\)/gi, "").trim()}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleQuickLogout}
          disabled={loggingOut}
          title="Đăng xuất khỏi hệ thống"
          aria-label="Đăng xuất"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-danger-bg hover:text-danger transition-colors disabled:opacity-50 cursor-pointer"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  )
}
