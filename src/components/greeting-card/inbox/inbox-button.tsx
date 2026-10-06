"use client"

import React, { useState } from "react"
import { Bell } from "lucide-react"
import { InboxPanel, type InboxTarget } from "./inbox-panel"
import { useInbox } from "./use-inbox"

/** Nút 🔔 Hộp việc ở đầu trang Thẻ chào — thấy được từ mọi tab, số việc cập nhật mỗi 20 giây. */
export function InboxButton({ onOpenTarget }: { onOpenTarget: (t: InboxTarget) => void }) {
  const [open, setOpen] = useState(false)
  const inbox = useInbox()
  const total = inbox.data?.data.counts.total ?? 0
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog"
        aria-label={total > 0 ? `Hộp việc: ${total} việc và tin chưa xử lý` : "Hộp việc"}
        className="relative inline-flex h-11 items-center gap-1.5 rounded-xl border border-border bg-surface px-3 text-body-sm font-bold text-foreground hover:bg-surface-alt">
        <Bell size={18} aria-hidden="true" />
        <span className="hidden sm:inline">Hộp việc</span>
        {total > 0 && (
          <span aria-hidden="true" className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-danger px-1.5 text-center text-caption font-bold text-white">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>
      <span className="sr-only" aria-live="polite">{total > 0 ? `${total} việc chưa xử lý` : ""}</span>
      {open && <InboxPanel onClose={() => setOpen(false)} onOpenTarget={onOpenTarget} />}
    </>
  )
}
