"use client"

import React from "react"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SEND_ERROR, useInboxSend, type Done } from "./use-inbox-send"

/** Điều hành duyệt / từ chối đề xuất bỏ hiển thị ngay trong Hộp việc (quá 5 phút hệ thống tự duyệt). */
export function DismissalDecision({ targetId, type, onDone }: { targetId: string; type: "ORDER" | "SESSION"; onDone: Done }) {
  const { busy, error, send } = useInboxSend(onDone)
  const decide = (approve: boolean) =>
    void send(approve ? "approve" : "reject", "/api/v1/greeting-card/tracking/decide-dismiss", { id: targetId, type, approve },
      approve ? "Đã duyệt bỏ hiển thị" : "Đã từ chối đề xuất, đơn vẫn hiển thị", "Không thể xử lý đề xuất")
  return (
    <div className="flex flex-col gap-2 text-body-sm">
      {error && <p role="alert" className={SEND_ERROR}>{error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" size="sm" disabled={busy !== null} onClick={() => decide(false)} className="h-11 gap-1 text-caption font-bold">
          {busy === "reject" ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
          <span>Từ chối</span>
        </Button>
        <Button type="button" size="sm" disabled={busy !== null} onClick={() => decide(true)} className="h-11 gap-1 text-caption font-bold">
          {busy === "approve" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          <span>Duyệt bỏ hiển thị</span>
        </Button>
      </div>
    </div>
  )
}
