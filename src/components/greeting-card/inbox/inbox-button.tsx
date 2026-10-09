"use client"

import React, { useEffect, useRef, useState } from "react"
import { Bell } from "lucide-react"
import { InboxPanel, type InboxTarget } from "./inbox-panel"
import { useInbox } from "./use-inbox"
import { cn } from "@/lib/utils"
import { newItemsSince, stripCountPrefix, titleWithCount } from "@/modules/greeting-card/domain/inbox-alert"

/** Nút 🔔 Hộp việc ở đầu trang Thẻ chào — thấy được từ mọi tab, số việc cập nhật mỗi 20 giây;
 *  có việc mới thì huy hiệu nhấp nháy và tiêu đề tab trình duyệt hiện "(n)". */
export function InboxButton({ onOpenTarget }: { onOpenTarget: (t: InboxTarget) => void }) {
  const [open, setOpen] = useState(false)
  const inbox = useInbox()
  const loaded = inbox.data !== undefined
  const total = inbox.data?.data.counts.total ?? 0
  const prev = useRef<number | null>(null)
  const [fresh, setFresh] = useState(0)

  useEffect(() => {
    if (!loaded) return
    const added = newItemsSince(prev.current, total)
    prev.current = total
    if (added > 0) setFresh(added)
  }, [loaded, total])

  useEffect(() => {
    if (!loaded) return
    document.title = titleWithCount(document.title, total)
  }, [loaded, total])

  useEffect(() => () => { document.title = stripCountPrefix(document.title) }, [])
  return (
    <>
      <button
        type="button"
        onClick={() => { setFresh(0); setOpen(true) }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={total > 0 ? `Hộp việc: ${total} việc và tin chưa xử lý` : "Hộp việc"}
        title={total > 0 ? `Hộp việc: ${total} việc và tin chưa xử lý` : "Hộp việc"}
        className={cn(
          "relative inline-flex h-11 w-11 items-center justify-center rounded-xl border transition-all",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          open
            ? "border-border bg-surface text-primary shadow-xs"
            : "border-border bg-surface-alt text-text-muted hover:bg-surface hover:text-foreground active:bg-surface active:text-primary",
        )}
      >
        <Bell size={18} aria-hidden="true" className={open ? "text-primary" : "text-text-muted"} />
        {total > 0 && (
          <span aria-hidden="true" className={`absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-danger px-1.5 text-center text-caption font-bold text-white ${fresh > 0 ? "animate-pulse ring-2 ring-danger/40" : ""}`}>
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>
      <span className="sr-only" aria-live="polite">{fresh > 0 ? `Có ${fresh} việc mới. Tổng ${total} việc chưa xử lý` : total > 0 ? `${total} việc chưa xử lý` : ""}</span>
      {open && <InboxPanel onClose={() => setOpen(false)} onOpenTarget={onOpenTarget} />}
    </>
  )
}
