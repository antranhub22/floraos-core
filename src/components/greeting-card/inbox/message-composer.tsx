"use client"

import React, { useState } from "react"
import { Loader2, Send, X } from "lucide-react"
import { apiSend, useApi } from "@/components/greeting-card/greeting-api"
import { MAX_MESSAGE_LENGTH } from "@/modules/greeting-card/domain/internal-message"

interface Recipients {
  roles: Array<{ role: string; label: string }>
  members: Array<{ userId: string; name: string }>
}

interface Props {
  target: { orderId?: string | null | undefined; sessionId?: string | null | undefined }
  stepKey: string
  replyTo: { id: string; senderName: string } | null
  onCancelReply: () => void
  onSent: () => void
}

/** Ô soạn tin: chọn người nhận (hoặc đang trả lời ai), Ctrl/⌘ + Enter để gửi. */
export function MessageComposer({ target, stepKey, replyTo, onCancelReply, onSent }: Props) {
  const recipients = useApi<{ data: Recipients }>("/api/v1/greeting-card/messages/recipients")
  const [to, setTo] = useState("ROLE:ADMIN")
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send() {
    const text = body.trim()
    if (!text || sending) return
    setSending(true)
    setError(null)
    const [kind, value] = to.split(":")
    try {
      await apiSend("/api/v1/greeting-card/messages", "POST", {
        ...(target.orderId ? { orderId: target.orderId } : { sessionId: target.sessionId }),
        stepKey,
        to: kind === "ROLE" ? { kind, role: value } : kind === "USER" ? { kind, userId: value } : { kind: "OWNER_SALE" },
        body: text,
        ...(replyTo ? { replyToId: replyTo.id } : {}),
      }, "Không gửi được tin nhắn")
      setBody("")
      onCancelReply()
      onSent()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không gửi được tin nhắn")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {error && <p role="alert" className="rounded-lg bg-danger-bg px-3 py-2 text-body-sm text-danger">{error}</p>}
      {replyTo ? (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-primary/5 px-3 py-1.5 text-body-sm">
          <span>Trả lời <strong>{replyTo.senderName}</strong></span>
          <button type="button" onClick={onCancelReply} aria-label="Huỷ trả lời" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-text-muted hover:bg-surface-muted">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <label className="flex items-center gap-2 text-body-sm">
          <span className="shrink-0 font-semibold text-text-muted">Gửi cho</span>
          <select value={to} onChange={(e) => setTo(e.target.value)} className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 text-body-sm text-foreground">
            {(recipients.data?.data.roles ?? [{ role: "ADMIN", label: "Điều hành" }]).map((r) => (
              <option key={r.role} value={`ROLE:${r.role}`}>{r.label}</option>
            ))}
            <option value="OWNER_SALE">Sale phụ trách đơn</option>
            {(recipients.data?.data.members.length ?? 0) > 0 && (
              <optgroup label="Một người cụ thể">
                {recipients.data!.data.members.map((m) => <option key={m.userId} value={`USER:${m.userId}`}>{m.name}</option>)}
              </optgroup>
            )}
          </select>
        </label>
      )}
      <div className="flex items-end gap-2">
        <label className="sr-only" htmlFor="message-body">Nội dung tin nhắn</label>
        <textarea
          id="message-body"
          value={body}
          maxLength={MAX_MESSAGE_LENGTH}
          rows={2}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault()
              void send()
            }
          }}
          placeholder="Nhập tin nhắn…"
          className="max-h-40 min-h-11 flex-1 resize-y rounded-xl border border-border bg-surface px-3 py-2 text-body text-foreground placeholder:text-text-muted"
        />
        <button type="button" onClick={() => void send()} disabled={!body.trim() || sending} aria-label="Gửi tin nhắn"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-dark disabled:opacity-40">
          {sending ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}
