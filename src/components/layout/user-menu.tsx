"use client"

// Menu tài khoản dùng chung cho Dashboard Điều hành và màn Trải nghiệm —
// trước đây avatar chỉ là một vòng tròn tĩnh, không có cách nào đăng xuất
// từ giao diện dù API đã có sẵn (`POST /api/v1/auth/logout`).

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, UserRound } from "lucide-react"
import { useSession } from "@/lib/session"

export function UserMenu({ initials }: { initials: string }) {
  const router = useRouter()
  const [mo, setMo] = useState(false)
  const [dangXuat, setDangXuat] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { roleUx } = useSession()

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
        className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {initials}
      </button>

      {mo && (
        <>
          {/* Lớp phủ để bấm ra ngoài là đóng menu — không dùng thư viện popover ngoài. */}
          <div className="fixed inset-0 z-10" onClick={() => setMo(false)} />
          <div className="absolute right-0 top-12 z-20 w-52 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
            {/* Vai trải nghiệm hiện tại + danh mục 14 vai (đặc tả 03b §3). */}
            <button
              type="button"
              onClick={() => {
                setMo(false)
                router.push("/vai-tro" as never)
              }}
              className="flex w-full items-center gap-2 border-b border-border px-3.5 py-2.5 text-left text-[13px] font-semibold text-text hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <UserRound size={16} strokeWidth={1.8} aria-hidden="true" />
              <span className="min-w-0">
                <span className="block">Vai trò</span>
                {roleUx && <span className="block truncate text-[11.5px] font-medium text-text-muted">{roleUx.label}</span>}
              </span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={dangXuat}
              className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] font-semibold text-danger hover:bg-surface-alt disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <LogOut size={16} strokeWidth={1.8} />
              {dangXuat ? "Đang đăng xuất…" : "Đăng xuất"}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
