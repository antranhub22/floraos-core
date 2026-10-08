"use client"

import React, { useState } from "react"
import { AlertTriangle, ChevronRight, MessageSquare } from "lucide-react"
import { FlowerImage } from "@/components/greeting-card/flower-image"
import type { InboxAction, InboxTab } from "@/modules/greeting-card/domain/inbox"
import { Sheet } from "./sheet"
import { MessageThread } from "./message-thread"
import { timeAgo, useInbox, type InboxData } from "./use-inbox"
import { DiscountDecision } from "./discount-decision"
import { ChangeDecision } from "./change-decision"

type Group = "actions" | "messages" | "updates"
export interface InboxTarget { tab: InboxTab; orderId: string | null; sessionId: string | null }

const ROW = "flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-muted min-h-16"

/** Hộp việc: một chỗ cho việc cần làm, tin nhắn và cập nhật — xử lý hoặc mở đúng đơn ngay. */
export function InboxPanel({ onClose, onOpenTarget }: { onClose: () => void; onOpenTarget: (t: InboxTarget) => void }) {
  const inbox = useInbox()
  const data: InboxData | undefined = inbox.data?.data
  const [group, setGroup] = useState<Group>(() => (data && data.counts.actions === 0 && data.counts.unreadMessages > 0 ? "messages" : "actions"))
  const [thread, setThread] = useState<{ orderId: string | null; sessionId: string | null; title: string } | null>(null)
  const [now] = useState(() => Date.now())

  if (thread) {
    return (
      <MessageThread target={thread} title={thread.title} onClose={onClose} onBack={() => setThread(null)} onChanged={() => void inbox.mutate()} />
    )
  }

  const tabs: Array<{ id: Group; label: string; count: number }> = [
    { id: "actions", label: "Cần làm", count: data?.counts.actions ?? 0 },
    { id: "messages", label: "Tin nhắn", count: data?.counts.unreadMessages ?? 0 },
    { id: "updates", label: "Cập nhật", count: 0 },
  ]
  const open = (a: { tab: InboxTab; orderId: string | null; sessionId: string | null }) => {
    onOpenTarget(a)
    onClose()
  }

  return (
    <Sheet labelId="inbox-title" title="Hộp việc" onClose={onClose}>
      <div role="tablist" aria-label="Nhóm trong Hộp việc" className="sticky top-0 z-10 grid grid-cols-3 gap-1 border-b border-border bg-surface p-2">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={group === t.id} onClick={() => setGroup(t.id)}
            className={`flex h-11 items-center justify-center gap-1.5 rounded-xl text-body-sm font-bold ${group === t.id ? "bg-primary text-white" : "text-text-muted hover:bg-surface-muted"}`}>
            {t.label}
            {t.count > 0 && <span className={`min-w-5 rounded-full px-1.5 text-caption ${group === t.id ? "bg-white/25" : "bg-danger text-white"}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {inbox.error ? (
        <div role="alert" className="m-4 rounded-xl bg-danger-bg p-4 text-body-sm text-danger">
          {(inbox.error as Error).message}
          <button type="button" onClick={() => void inbox.mutate()} className="ml-2 font-bold underline">Thử lại</button>
        </div>
      ) : !data ? (
        <div className="flex flex-col gap-2 p-4" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-muted" />)}</div>
      ) : group === "actions" ? (
        data.actions.length === 0 ? <Empty text="Không có việc nào đang chờ bạn. Mọi đơn đều đúng tiến độ." /> : (
          <ul className="divide-y divide-border bg-surface">
            {data.actions.map((a) => <ActionRow key={a.id} action={a} onOpen={() => open(a)} onDecided={() => void inbox.mutate()}
              onMessage={a.orderId || a.sessionId ? () => setThread({ orderId: a.orderId, sessionId: a.sessionId, title: a.detail }) : undefined} />)}
          </ul>
        )
      ) : group === "messages" ? (
        data.threads.length === 0 ? <Empty text="Chưa có tin nhắn nào gửi cho bạn." /> : (
          <ul className="divide-y divide-border bg-surface">
            {data.threads.map((t) => (
              <li key={t.key}>
                <button type="button" className={ROW} onClick={() => setThread({ orderId: t.orderId, sessionId: t.sessionId, title: t.title })}>
                  <MessageSquare size={20} className={t.unread ? "shrink-0 text-primary" : "shrink-0 text-text-muted"} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-body-sm ${t.unread ? "font-extrabold text-foreground" : "font-semibold text-foreground"}`}>{t.title}</span>
                    <span className="block truncate text-caption text-text-muted">{t.lastSender}: {t.lastBody}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-caption text-text-muted">{timeAgo(t.lastAt, now)}</span>
                    {t.unread > 0 && <span className="rounded-full bg-danger px-1.5 text-caption font-bold text-white" aria-label={`${t.unread} tin chưa đọc`}>{t.unread}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )
      ) : data.updates.length === 0 ? <Empty text="Không có đơn nào đổi bước trong 24 giờ qua." /> : (
        <ul className="divide-y divide-border bg-surface">
          {data.updates.map((u) => (
            <li key={u.id}>
              <button type="button" className={ROW} onClick={() => open({ tab: "tracking", orderId: u.orderId, sessionId: u.sessionId })}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body-sm font-semibold text-foreground">{u.customerName} — {u.title}</span>
                  <span className="block text-caption text-text-muted">{u.code} · {timeAgo(u.at, now)}</span>
                </span>
                <ChevronRight size={18} className="shrink-0 text-text-muted" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  )
}

function ActionRow({ action, onOpen, onMessage, onDecided }: { action: InboxAction; onOpen: () => void; onMessage?: (() => void) | undefined; onDecided: () => void }) {
  const urgent = action.kind === "STUCK" || action.kind === "UNMATCHED_PAYMENTS"
  const [done, setDone] = useState<string | null>(null)
  return (
    <li className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-center gap-3">
        {action.imageUrl !== null || action.orderId ? (
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border">
            <FlowerImage src={action.imageUrl} alt={action.customerName ?? "Mẫu hoa"} sizes="48px" fallback="icon" className="h-full w-full" />
          </div>
        ) : (
          <AlertTriangle size={22} className="shrink-0 text-danger" aria-hidden="true" />
        )}
        <div className="min-w-0 flex-1">
          <p className={`text-body-sm font-extrabold ${urgent ? "text-danger" : "text-foreground"}`}>{action.title}</p>
          <p className="truncate text-caption text-text-muted">{[action.customerName, action.detail].filter(Boolean).join(" · ")}</p>
        </div>
      </div>
      {action.discount && !done && (
        <div className="rounded-xl border border-border bg-surface-alt p-3">
          <DiscountDecision {...action.discount} onDone={(msg) => { setDone(msg); onDecided() }} />
        </div>
      )}
      {action.change && !done && (
        <div className="rounded-xl border border-border bg-surface-alt p-3">
          <ChangeDecision {...action.change} onDone={(msg) => { setDone(msg); onDecided() }} />
        </div>
      )}
      {done && <p role="status" className="rounded-xl bg-success-bg px-3 py-2 text-body-sm text-success">{done}</p>}
      <div className="flex gap-2 pl-15">
        {!action.discount && !action.change && <button type="button" onClick={onOpen} className="h-11 flex-1 rounded-xl bg-primary px-3 text-body-sm font-bold text-white hover:bg-primary-dark sm:flex-none">
          Xử lý
        </button>}
        {onMessage && (
          <button type="button" onClick={onMessage} className="h-11 flex-1 rounded-xl border border-border px-3 text-body-sm font-bold text-foreground hover:bg-surface-muted sm:flex-none">
            Nhắn tin
          </button>
        )}
      </div>
    </li>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="px-6 py-16 text-center text-body-sm text-text-muted">{text}</p>
}
