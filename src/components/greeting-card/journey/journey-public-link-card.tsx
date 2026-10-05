"use client"

import React from "react"
import { Check, Copy, CopyPlus, ExternalLink, Eye, Link as LinkIcon, Sparkles } from "lucide-react"

/** Thẻ "Link dùng chung" của bộ sưu tập đã có mẫu: xem trước, sao chép, mở, nhân bản kênh. */
export function JourneyPublicLinkCard({
  itemCount,
  displayPath,
  publicUrl,
  copied,
  onPreview,
  onCopy,
  onClone,
}: {
  itemCount: number
  displayPath: string
  publicUrl: string
  copied: boolean
  onPreview: () => void
  onCopy: () => void
  onClone: () => void
}) {
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5 flex flex-col gap-3.5 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-body font-extrabold text-foreground">Link Dùng Chung Cho Mọi Khách Hàng</p>
              <span className="text-caption px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold">Link công khai</span>
            </div>
            <p className="text-body-sm text-text-muted mt-0.5">
              Gửi link này lên Fanpage, Zalo, Bio hoặc chạy quảng cáo. Mọi khách bấm vào đều xem trọn vẹn {itemCount} mẫu hoa và có thể tự chốt đơn, thanh toán VietQR.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={onPreview}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-primary/30 bg-surface hover:bg-surface-muted text-primary text-body-sm font-bold shadow-xs transition-colors"
            title="Xem trước giao diện khách nhìn thấy trên điện thoại & máy tính"
          >
            <Eye size={16} />
            <span>Xem trước</span>
          </button>
          <button
            type="button"
            onClick={onCopy}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-body-sm font-bold hover:bg-primary-dark shadow-xs transition-colors"
          >
            {copied ? <Check size={16} className="text-white" /> : <Copy size={16} />}
            <span>{copied ? "Đã sao chép!" : "Sao chép link"}</span>
          </button>
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Mở link trong tab mới"
            className="p-2.5 rounded-xl border border-border bg-surface hover:bg-surface-muted text-text-muted hover:text-foreground transition-colors"
            title="Mở trong tab mới"
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </div>

      <div className="p-3 bg-surface rounded-xl border border-border/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0 font-mono text-body-sm truncate">
          <LinkIcon size={14} className="shrink-0 text-text-muted" />
          <span className="text-text-muted text-caption hidden md:inline">Link xem:</span>
          <span className="text-primary font-bold truncate select-all">{displayPath}</span>
        </div>
        <button
          type="button"
          onClick={onClone}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary text-caption font-bold transition-colors shrink-0"
          title="Tạo thêm 1 link dùng chung khác cùng chứa các mẫu hoa này"
        >
          <CopyPlus size={14} />
          <span>+ Tạo thêm link khác cho BST này</span>
        </button>
      </div>
    </div>
  )
}
