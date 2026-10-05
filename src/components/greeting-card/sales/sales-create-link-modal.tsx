"use client"

import React, { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiSend } from "@/components/greeting-card/greeting-api"
import { LINK_EXPIRY_OPTIONS, type CatalogOption } from "./sales-types"

interface Props {
  catalogs: CatalogOption[]
  onClose: () => void
  onCreated: () => void
  onNavigateToCatalog?: (() => void) | undefined
}

const INPUT = "w-full h-10 px-3 rounded-lg border border-border bg-background text-body text-foreground"

/** Hộp thoại tạo link Thẻ chào gửi khách (chọn bộ sưu tập, khách, hạn dùng). */
export function SalesCreateLinkModal({ catalogs, onClose, onCreated, onNavigateToCatalog }: Props) {
  const [catalogId, setCatalogId] = useState(catalogs[0]?.id ?? "")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [expiry, setExpiry] = useState("30")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdLink, setCreatedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError(null)
    try {
      const option = LINK_EXPIRY_OPTIONS.find((o) => o.value === expiry)
      const res = await apiSend<{ data: { shareUrl: string } }>(
        "/api/v1/greeting-card/send-links",
        "POST",
        {
          catalogId: catalogId || undefined,
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          expiresInDays: option ? option.days : 30,
        },
        "Không tạo được link chào khách"
      )
      setCreatedLink(`${window.location.origin}${res.data.shareUrl}`)
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được link chào khách")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="create-link-title">
      <div className="w-full max-w-md bg-surface rounded-2xl border border-border p-6 shadow-xl flex flex-col gap-4">
        <h3 id="create-link-title" className="text-title font-extrabold text-foreground">Tạo Thẻ Chào Gửi Khách Hàng</h3>

        {createdLink ? (
          <div className="flex flex-col gap-3 py-2">
            <div className="p-3 bg-success-bg border border-success/30 rounded-xl text-success text-body-sm font-bold flex items-center gap-2">
              <Check size={18} />
              <span>Đã tạo link Thẻ chào thành công!</span>
            </div>
            <div className="p-3 bg-surface-muted rounded-xl border border-border text-body-sm font-mono break-all">{createdLink}</div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void navigator.clipboard.writeText(createdLink)
                setCopied(true)
              }}
              className="w-full hover:bg-primary/10 font-bold h-11 gap-1.5"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? "Đã copy vào bộ nhớ tạm" : "Copy link gửi khách"}</span>
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="w-full h-10">Đóng</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {error && <p role="alert" className="p-3 rounded-xl bg-danger-bg text-danger text-body-sm">{error}</p>}
            <label className="flex flex-col gap-1">
              <span className="text-caption font-bold text-foreground">Chọn Bộ sưu tập *</span>
              {catalogs.length === 0 ? (
                <span className="p-3 bg-warning-bg/50 border border-warning/30 rounded-xl text-body-sm text-text flex flex-col gap-2">
                  Chưa có bộ sưu tập nào. Cần tạo bộ sưu tập mẫu hoa trước!
                  {onNavigateToCatalog && (
                    <button type="button" onClick={() => { onClose(); onNavigateToCatalog() }} className="text-primary font-bold underline text-left">
                      → Đến trang tạo Bộ Sưu Tập ngay
                    </button>
                  )}
                </span>
              ) : (
                <select value={catalogId} onChange={(e) => setCatalogId(e.target.value)} className={INPUT}>
                  {catalogs.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              )}
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-caption font-bold text-foreground">Tên khách hàng (không bắt buộc)</span>
              <input type="text" maxLength={100} placeholder="VD: Anh Minh" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={INPUT} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-caption font-bold text-foreground">Số điện thoại khách (không bắt buộc)</span>
              <input type="tel" maxLength={15} placeholder="VD: 0901234567" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className={INPUT} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-caption font-bold text-foreground">Hạn dùng của link</span>
              <select value={expiry} onChange={(e) => setExpiry(e.target.value)} className={INPUT}>
                {LINK_EXPIRY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <span className="text-caption text-text-muted">Hết hạn mà khách chưa đặt thì link tự đóng. Link đã có đơn luôn mở được để khách theo dõi.</span>
            </label>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="h-10">Hủy</Button>
              <Button type="submit" disabled={creating || catalogs.length === 0} className="bg-primary hover:bg-primary-dark text-white font-bold h-10 px-4">
                {creating ? "Đang tạo..." : "Tạo Link Ngay"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
