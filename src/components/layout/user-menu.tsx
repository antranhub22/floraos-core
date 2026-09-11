"use client"

// Menu tài khoản dùng chung cho Dashboard Điều hành và màn Trải nghiệm —
// trước đây avatar chỉ là một vòng tròn tĩnh, không có cách nào đăng xuất
// từ giao diện dù API đã có sẵn (`POST /api/v1/auth/logout`).

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

export function UserMenu({ initials }: { initials: string }) {
  const router = useRouter()
  const [mo, setMo] = useState(false)
  const [dangXuat, setDangXuat] = useState(false)

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
        type="button"
        onClick={() => setMo((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white"
      >
        {initials}
      </button>

      {mo && (
        <>
          {/* Lớp phủ để bấm ra ngoài là đóng menu — không dùng thư viện popover ngoài. */}
          <div className="fixed inset-0 z-10" onClick={() => setMo(false)} />
          <div className="absolute right-0 top-11 z-20 w-44 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
            <button
              type="button"
              onClick={handleLogout}
              disabled={dangXuat}
              className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] font-semibold text-danger hover:bg-surface-alt disabled:opacity-50"
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
