"use client"

import React, { useState } from "react"
import { X, Send, MessageSquare, Shield, Sparkles, User, Truck, Flower2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  PIPELINE_STEPS,
  ROLE_LABELS,
  type InternalNoteRole,
  type TrackingPipelineItem,
  type TrackingPipelineStepId,
} from "@/modules/greeting-card/domain/tracking-pipeline-types"
import { readApiError } from "@/components/greeting-card/api-error"

interface TrackingInternalChatDrawerProps {
  item: TrackingPipelineItem
  initialStepId?: TrackingPipelineStepId | "GENERAL" | undefined
  onClose: () => void
  onNoteAdded: () => void
}

function getRoleIcon(role: InternalNoteRole) {
  switch (role) {
    case "ADMIN":
      return <Shield size={14} className="text-warning" />
    case "SALE":
      return <Sparkles size={14} className="text-primary" />
    case "COORDINATOR":
      return <Truck size={14} className="text-info" />
    case "FLORIST":
      return <Flower2 size={14} className="text-success" />
    default:
      return <User size={14} className="text-text-muted" />
  }
}

function getRoleBadgeClass(role: InternalNoteRole) {
  switch (role) {
    case "ADMIN":
      return "bg-warning-bg text-warning border-warning/30"
    case "SALE":
      return "bg-selected text-primary border-primary/30"
    case "COORDINATOR":
      return "bg-info-bg text-info border-info/30"
    case "FLORIST":
      return "bg-success-bg text-success border-success/30"
    default:
      return "bg-surface text-text-muted border-border"
  }
}

export function TrackingInternalChatDrawer({
  item,
  initialStepId = "GENERAL",
  onClose,
  onNoteAdded,
}: TrackingInternalChatDrawerProps) {
  const [selectedFilterStep, setSelectedFilterStep] = useState<string>(initialStepId)
  const [stepKey, setStepKey] = useState<TrackingPipelineStepId | "GENERAL">(
    initialStepId === "GENERAL" ? (item?.currentStepId ?? "GENERAL") : initialStepId
  )
  const [role, setRole] = useState<InternalNoteRole>("SALE")
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  if (!item) return null

  const filteredNotes = item.notes.filter((n) => {
    if (selectedFilterStep === "ALL") return true
    return n.stepKey === selectedFilterStep
  })

  function handleRoleChange(newRole: InternalNoteRole) {
    setRole(newRole)
  }

  async function handleSendNote(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || submitting) return

    setSubmitting(true)
    setErrorMsg("")
    try {
      const res = await fetch("/api/v1/greeting-card/tracking-pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: item.orderId ?? null,
          sessionId: item.sessionId ?? null,
          stepKey,
          role,
          content: content.trim(),
        }),
      })

      if (!res.ok) {
        throw new Error(await readApiError(res, "Không thể gửi tin nhắn"))
      }

      setContent("")
      onNoteAdded()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Đã có lỗi xảy ra")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-lg h-full bg-surface border-l border-border flex flex-col shadow-xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <MessageSquare size={16} />
            </div>
            <div>
              <h3 className="text-body font-extrabold text-foreground">
                Ghi Chú Nội Bộ Theo Bước
              </h3>
              <p className="text-caption text-text-muted">
                Đơn {item.orderCode || item.sendCode} • {item.customerName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng tin nhắn"
            className="p-1.5 rounded-lg text-text-muted hover:text-foreground hover:bg-surface-hover"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter bar by step */}
        <div className="p-3 border-b border-border bg-surface/50 flex items-center gap-1.5 overflow-x-auto text-caption">
          <button
            type="button"
            onClick={() => setSelectedFilterStep("ALL")}
            className={`px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition-colors ${
              selectedFilterStep === "ALL"
                ? "bg-primary text-white"
                : "bg-surface border border-border text-text-muted hover:text-foreground"
            }`}
          >
            Tất cả ({item.notes.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilterStep("GENERAL")}
            className={`px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition-colors ${
              selectedFilterStep === "GENERAL"
                ? "bg-primary text-white"
                : "bg-surface border border-border text-text-muted hover:text-foreground"
            }`}
          >
            Lưu ý chung
          </button>
          {PIPELINE_STEPS.map((step) => {
            const count = item.notes.filter((n) => n.stepKey === step.id).length
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setSelectedFilterStep(step.id)}
                className={`px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition-colors ${
                  selectedFilterStep === step.id
                    ? "bg-primary text-white"
                    : "bg-surface border border-border text-text-muted hover:text-foreground"
                }`}
              >
                {step.shortTitle} {count > 0 ? `(${count})` : ""}
              </button>
            )
          })}
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-text-muted">
              <MessageSquare size={32} className="text-text-muted/40 mb-2" />
              <p className="text-body-sm font-bold text-foreground">Chưa có ghi chú nào</p>
              <p className="text-caption mt-1 max-w-xs">
                Admin, Sale hoặc Điều phối có thể gửi các lưu ý đặc biệt cho từng bước ở ô bên dưới.
              </p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div
                key={note.id}
                className="p-3.5 rounded-xl border border-border bg-surface shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-caption font-extrabold border ${getRoleBadgeClass(
                        note.role
                      )}`}
                    >
                      {getRoleIcon(note.role)}
                      <span>{note.roleLabel}</span>
                    </span>
                    <span className="text-caption font-bold text-foreground">
                      {note.senderName}
                    </span>
                  </div>
                  <span className="text-caption text-text-muted flex items-center gap-1">
                    <Clock size={11} />
                    {new Date(note.createdAt).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="text-body-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {note.content}
                </div>

                <div className="pt-1 border-t border-border flex items-center justify-between text-caption text-text-muted">
                  <span>Gắn với bước: <strong className="text-foreground">{note.stepTitle}</strong></span>
                  <span>{new Date(note.createdAt).toLocaleDateString("vi-VN")}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Note Composer Form */}
        <form onSubmit={handleSendNote} className="p-4 border-t border-border bg-surface space-y-3">
          {errorMsg && (
            <div className="p-2 rounded-lg bg-danger-bg text-danger text-caption font-bold">
              {errorMsg}
            </div>
          )}

          {/* Role & Step Selector */}
          <div className="grid grid-cols-2 gap-2 text-caption">
            <div>
              <label className="block text-text-muted font-bold mb-1">Vai trò của bạn:</label>
              <select
                value={role}
                onChange={(e) => handleRoleChange(e.target.value as InternalNoteRole)}
                className="w-full h-8 px-2 rounded-lg border border-border bg-surface text-foreground font-bold focus:outline-hidden focus:ring-1 focus:ring-primary"
              >
                <option value="SALE">Tư vấn Sale</option>
                <option value="ADMIN">Chủ tiệm / Điều hành</option>
                <option value="COORDINATOR">Điều phối xưởng</option>
                <option value="FLORIST">Thợ cắm hoa</option>
              </select>
            </div>

            <div>
              <label className="block text-text-muted font-bold mb-1">Gắn với bước:</label>
              <select
                value={stepKey}
                onChange={(e) => setStepKey(e.target.value as TrackingPipelineStepId | "GENERAL")}
                className="w-full h-8 px-2 rounded-lg border border-border bg-surface text-foreground font-bold focus:outline-hidden focus:ring-1 focus:ring-primary"
              >
                <option value="GENERAL">Lưu ý chung</option>
                {PIPELINE_STEPS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shortTitle} ({s.roleResponsible.split("/")[0]})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tên người gửi lấy từ tài khoản đăng nhập — không cho tự khai */}
          <p className="text-caption text-text-muted">
            Tin nhắn ghi tên theo tài khoản đăng nhập của bạn, kèm vai trò đã chọn ({ROLE_LABELS[role]}).
          </p>

          {/* Input text + Send button */}
          <div className="flex gap-2 items-end">
            <textarea
              rows={2}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập lưu ý cụ thể cho các vai trò khác (VD: Khách dặn hoa cắm tone pastel nhẹ...)"
              className="flex-1 p-2.5 rounded-xl border border-border bg-surface text-body-sm text-foreground placeholder:text-text-muted focus:outline-hidden focus:ring-1 focus:ring-primary resize-none"
            />
            <Button
              type="submit"
              disabled={submitting || !content.trim()}
              className="h-10 px-4 gap-1.5 text-caption font-bold bg-primary text-white shrink-0"
            >
              <Send size={14} />
              <span>Gửi</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
