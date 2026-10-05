"use client"

import React, { useState } from "react"
import { Check, CheckCircle2, Copy, ExternalLink, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { absoluteUrl } from "./journey-types"
import type { CreatedLink } from "./journey-step-customer"

/** Bước 3: link đã sinh — sao chép, xem trước, mở; tạo thêm hoặc kết thúc. */
export function JourneyStepResult({
  link,
  onPreview,
  onRestart,
  onFinish,
}: {
  link: CreatedLink
  onPreview: (url: string, title: string) => void
  onRestart: () => void
  onFinish?: (() => void) | undefined
}) {
  const [copied, setCopied] = useState(false)
  const fullUrl = absoluteUrl(link.shareUrl)
  const who = link.customerName || "Khách"

  return (
    <div className="flex flex-col gap-6 text-center py-2">
      <div className="w-14 h-14 rounded-2xl bg-success-bg text-success mx-auto flex items-center justify-center shadow-xs">
        <CheckCircle2 size={32} />
      </div>
      <div>
        <h3 className="text-title font-extrabold text-foreground">Đã Sinh Link Thẻ Chào Thành Công!</h3>
        <p className="text-body-sm text-text-muted mt-1 max-w-md mx-auto">
          Mã gửi: <strong className="font-mono text-primary">{link.sendCode}</strong> cho khách hàng{" "}
          <strong className="text-foreground">{who}</strong>
        </p>
      </div>

      <div className="p-4 bg-surface-muted rounded-2xl border border-border max-w-lg mx-auto w-full flex flex-col gap-3">
        <div className="p-3 bg-background rounded-xl border border-border text-body-sm font-mono text-foreground break-all select-all">{fullUrl}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(fullUrl)
              setCopied(true)
              setTimeout(() => setCopied(false), 2500)
            }}
            className="flex-1 inline-flex items-center justify-center rounded-xl bg-primary hover:bg-primary-dark text-white font-bold h-11 text-body-sm gap-1.5 shadow-sm transition-colors"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? "Đã copy link!" : "1-Click Copy Link gửi Zalo/Tin nhắn"}</span>
          </button>
          <button
            type="button"
            onClick={() => onPreview(fullUrl, `Xem trước link gửi khách: ${who}`)}
            className="h-11 px-4 rounded-xl border border-border hover:bg-surface text-text-muted hover:text-foreground flex items-center justify-center gap-1.5 text-body-sm font-medium transition-colors"
          >
            <Eye size={15} />
            <span>Xem Trước</span>
          </button>
          <a
            href={fullUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Mở link trong tab mới"
            className="h-11 px-3 rounded-xl border border-border hover:bg-surface text-text-muted hover:text-foreground flex items-center justify-center transition-colors"
            title="Mở trong tab mới"
          >
            <ExternalLink size={15} />
          </a>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onRestart} className="h-10 text-body-sm font-medium">Tạo thêm link khác</Button>
        {onFinish && (
          <Button type="button" variant="outline" onClick={onFinish} className="h-10 text-body-sm font-bold">Xong & Xem Danh Sách Đã Gửi</Button>
        )}
      </div>
    </div>
  )
}
