"use client"

// Menu tài khoản dùng chung cho Header và Sidebar Navigation.
// Cung cấp avatar viết tắt, thông tin người dùng, chuyển đổi vai trò và nút Đăng xuất.

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { KeyRound, LogOut, UserRound } from "lucide-react"
import { useSession } from "@/lib/session"
import { cn } from "@/lib/utils"
import { ChangePasswordDialog } from "./change-password-dialog"

export interface UserMenuProps {
  initials: string
  direction?: "up" | "down"
  size?: "sm" | "md"
}

export function UserMenu({ initials, direction = "down", size = "md" }: UserMenuProps) {
  const router = useRouter()
  const [mo, setMo] = useState(false)
  const [dangXuat, setDangXuat] = useState(false)
  const [doiMatKhau, setDoiMatKhau] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { roleUx, userName, orgName, can } = useSession()

  useEffect(() => {
    if (!mo) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMo(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [mo])

  async function handleLogout() {
    setDangXuat(true)
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" })
    } catch {
      // Vẫn chuyển hướng dù logout API lỗi (token hết hạn phía server)
    } finally {
      router.push("/dang-nhap")
      router.refresh()
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setMo((v) => !v)}
        aria-label="Menu tài khoản"
        aria-expanded={mo}
        className={cn(
          "flex items-center justify-center rounded-full bg-primary font-bold text-white shadow-xs transition-opacity hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer",
          size === "sm" ? "h-9 w-9 text-caption" : "h-10 w-10 text-body-sm"
        )}
      >
        {initials}
      </button>

      {mo && (
        <>
          {/* Lớp phủ để bấm ra ngoài là đóng menu */}
          <button
            type="button"
            aria-label="Đóng menu"
            tabIndex={-1}
            onClick={() => setMo(false)}
            className="fixed inset-0 z-40 bg-transparent cursor-default border-0"
          />

          {/* Menu popover */}
          <div
            className={cn(
              "absolute z-50 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-lg",
              direction === "up" ? "bottom-full mb-2 left-0" : "top-full mt-2 right-0"
            )}
          >
            {/* Header thông tin người dùng */}
            <div className="border-b border-border bg-surface-alt px-3.5 py-2.5">
              <div className="truncate text-caption font-bold text-text">
                {userName || "Người dùng"}
              </div>
              <div className="truncate text-caption text-text-muted">
                {roleUx?.label ?? orgName}
              </div>
            </div>

            {/* Vai trải nghiệm hiện tại + danh mục 14 vai (đặc tả 03b §3) */}
            <button
              type="button"
              onClick={() => {
                setMo(false)
                router.push("/vai-tro" as never)
              }}
              className="flex w-full items-center gap-2 border-b border-border px-3.5 py-2.5 text-left text-body-sm font-semibold text-text hover:bg-surface-alt transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer"
            >
              <UserRound size={16} strokeWidth={1.8} aria-hidden="true" />
              <span className="min-w-0">
                <span className="block">Vai trò trải nghiệm</span>
                {roleUx && (
                  <span className="block truncate text-caption font-medium text-text-muted">
                    {roleUx.label}
                  </span>
                )}
              </span>
            </button>

            {can("A2") && (
              <button
                type="button"
                onClick={() => {
                  setMo(false)
                  setDoiMatKhau(true)
                }}
                className="flex w-full items-center gap-2 border-b border-border px-3.5 py-2.5 text-left text-body-sm font-semibold text-text hover:bg-surface-alt transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer"
              >
                <KeyRound size={16} strokeWidth={1.8} aria-hidden="true" />
                <span>Đổi mật khẩu</span>
              </button>
            )}

            {/* Nút đăng xuất */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={dangXuat}
              className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-body-sm font-semibold text-danger hover:bg-danger-bg transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer"
            >
              <LogOut size={16} strokeWidth={1.8} aria-hidden="true" />
              <span>{dangXuat ? "Đang đăng xuất…" : "Đăng xuất"}</span>
            </button>
          </div>
        </>
      )}
      <ChangePasswordDialog open={doiMatKhau} onOpenChange={setDoiMatKhau} />
    </div>
  )
}
