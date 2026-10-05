"use client"

import React, { useState } from "react"
import { X, Smartphone, Monitor, ExternalLink, RefreshCw } from "lucide-react"

interface BrochurePreviewModalProps {
  url: string
  title?: string
  onClose: () => void
}

export function BrochurePreviewModal({
  url,
  title = "Xem trước Thẻ Chào Mẫu Hoa",
  onClose,
}: BrochurePreviewModalProps) {
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile")
  const [iframeKey, setIframeKey] = useState(0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-4xl h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-surface-muted/50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-foreground text-body truncate max-w-xs sm:max-w-md">
              {title}
            </span>
            <span className="text-caption font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary hidden sm:inline-block">
              Live Preview
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Device Switcher */}
            <div className="flex items-center bg-surface border border-border rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setDevice("mobile")}
                className={`p-1.5 rounded-lg text-caption flex items-center gap-1 transition-colors ${
                  device === "mobile"
                    ? "bg-primary text-white font-bold shadow-xs"
                    : "text-text-muted hover:text-foreground"
                }`}
                title="Khổ điện thoại (390px)"
              >
                <Smartphone size={15} />
                <span className="hidden sm:inline">Di động</span>
              </button>
              <button
                type="button"
                onClick={() => setDevice("desktop")}
                className={`p-1.5 rounded-lg text-caption flex items-center gap-1 transition-colors ${
                  device === "desktop"
                    ? "bg-primary text-white font-bold shadow-xs"
                    : "text-text-muted hover:text-foreground"
                }`}
                title="Toàn màn hình"
              >
                <Monitor size={15} />
                <span className="hidden sm:inline">Desktop</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIframeKey((k) => k + 1)}
              className="p-2 rounded-xl border border-border bg-surface hover:bg-surface-muted text-text-muted hover:text-foreground transition-colors"
              title="Tải lại preview"
            >
              <RefreshCw size={14} />
            </button>

            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl border border-border bg-surface hover:bg-surface-muted text-text-muted hover:text-foreground transition-colors"
              title="Mở trong tab mới"
            >
              <ExternalLink size={15} />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-surface-muted text-text-muted hover:text-foreground transition-colors ml-1"
              title="Đóng preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body / Iframe Container */}
        <div className="flex-1 bg-surface-muted flex items-center justify-center p-2 sm:p-4 overflow-hidden relative">
          <div
            className={`transition-all duration-300 h-full flex flex-col bg-background rounded-2xl overflow-hidden shadow-xl border border-border ${
              device === "mobile"
                ? "w-[390px] max-w-full ring-8 ring-black/10 rounded-[36px]"
                : "w-full"
            }`}
          >
            {/* Phone Notch mockup if mobile */}
            {device === "mobile" && (
              <div className="h-5 bg-foreground/10 shrink-0 flex items-center justify-center">
                <div className="w-24 h-3.5 bg-foreground/20 rounded-full mt-1" />
              </div>
            )}
            <iframe
              key={iframeKey}
              src={url}
              title="Live Preview Thẻ Chào"
              className="w-full flex-1 border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
