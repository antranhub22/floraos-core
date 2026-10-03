"use client"

import React, { useState } from "react"
import { Check, Copy, ExternalLink, Download, Share2, Bot, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CatalogWizardStep4SuccessProps {
  publishedUrl: string
  publishedSlug: string
  onDownloadQR: () => Promise<void>
  downloadingQR?: boolean
}

export function CatalogWizardStep4Success({
  publishedUrl,
  publishedSlug,
  onDownloadQR,
  downloadingQR = false,
}: CatalogWizardStep4SuccessProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!publishedUrl) return
    navigator.clipboard.writeText(publishedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="h-10 w-10 rounded-full bg-success-bg flex items-center justify-center text-success shrink-0">
          <Check className="h-5 w-5" />
        </div>
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success-bg text-success text-caption font-bold uppercase tracking-wider mb-1">
            Đã tạo Catalog thành công
          </div>
          <h3 className="text-title font-bold text-text">
            Catalog trực tuyến & Mã QR của tiệm đã sẵn sàng!
          </h3>
        </div>
      </div>

      {/* Link & QR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-surface-alt/60 p-4 space-y-2">
          <div className="text-caption font-bold text-text-muted uppercase">Link xem trực tiếp</div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={publishedUrl}
              className="flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-body-sm font-mono truncate"
            />
            <Button type="button" variant="outline" size="sm" onClick={handleCopy} className="text-caption">
              {copied ? "Đã chép" : "Copy"}
            </Button>
          </div>
          <a
            href={publishedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-body-sm text-primary font-semibold hover:underline pt-1"
          >
            <span>Mở xem trên tab mới</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="rounded-xl border border-border bg-surface-alt/60 p-4 flex items-center justify-between">
          <div>
            <div className="text-caption font-bold text-text-muted uppercase">Mã QR Catalog</div>
            <p className="text-caption text-text-muted mt-1 max-w-[200px]">
              Tải về để in thiệp hoặc để tại bàn thanh toán.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onDownloadQR}
            disabled={downloadingQR}
            className="border-primary text-primary text-caption font-semibold"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            <span>{downloadingQR ? "Đang tạo..." : "Tải ảnh QR"}</span>
          </Button>
        </div>
      </div>

      {/* Next Best Actions (J3) */}
      <div className="pt-2 border-t border-border space-y-3">
        <div className="text-body-sm font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="h-4 w-4" />
          <span>Hành động đề xuất tiếp theo (Next Best Actions)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => {
              const text = encodeURIComponent(`Gửi bạn xem catalog mẫu hoa mới của tiệm: ${publishedUrl}`)
              window.open(`https://zalo.me/share?url=${encodeURIComponent(publishedUrl)}&title=${text}`, "_blank")
            }}
            className="p-3.5 rounded-xl border border-border bg-surface hover:bg-primary-muted/10 text-left transition-colors cursor-pointer"
          >
            <Share2 className="h-4 w-4 text-info mb-1.5" />
            <div className="text-body-sm font-bold text-text">Gửi link qua Zalo</div>
            <div className="text-caption text-text-muted mt-0.5">Gửi nhanh cho khách quen xem hoa chọn mẫu.</div>
          </button>

          <button
            type="button"
            onClick={onDownloadQR}
            className="p-3.5 rounded-xl border border-border bg-surface hover:bg-primary-muted/10 text-left transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4 text-success mb-1.5" />
            <div className="text-body-sm font-bold text-text">In tem QR để bàn</div>
            <div className="text-caption text-text-muted mt-0.5">Đặt tại quầy để khách quét menu hoa trên điện thoại.</div>
          </button>

          <div className="p-3.5 rounded-xl border border-border bg-surface text-left">
            <Bot className="h-4 w-4 text-primary mb-1.5" />
            <div className="text-body-sm font-bold text-text">Tích hợp Chatbot AI</div>
            <div className="text-caption text-text-muted mt-0.5">AI tự động dùng catalog này tư vấn chốt đơn 24/7.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
