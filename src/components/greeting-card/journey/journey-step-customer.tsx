"use client"

import React, { useState } from "react"
import { ArrowLeft, Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiSend } from "@/components/greeting-card/greeting-api"
import { LINK_EXPIRY_OPTIONS } from "@/components/greeting-card/sales/sales-types"

export interface CreatedLink {
  sendCode: string
  shareUrl: string
  customerName: string
}

const FIELD = "w-full h-11 px-3.5 rounded-xl border border-border bg-background text-body text-foreground"

/** Bước 2: gán khách (tên/SĐT, hạn dùng link) rồi sinh link chào riêng. */
export function JourneyStepCustomer({
  catalogId,
  catalogName,
  onBack,
  onCreated,
  onError,
}: {
  catalogId: string
  catalogName: string
  onBack: () => void
  onCreated: (link: CreatedLink) => void
  onError: (message: string | null) => void
}) {
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [expiry, setExpiry] = useState("30")
  const [creating, setCreating] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const option = LINK_EXPIRY_OPTIONS.find((o) => o.value === expiry)
      const res = await apiSend<{ data?: { sendCode: string; shareUrl: string } }>(
        "/api/v1/greeting-card/send-links",
        "POST",
        {
          catalogId,
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          expiresInDays: option ? option.days : 30,
        },
        "Không tạo được link chào khách"
      )
      onError(null)
      if (res.data) onCreated({ ...res.data, customerName: customerName.trim() })
    } catch (err) {
      onError(err instanceof Error ? err.message : "Không tạo được link chào khách")
    } finally {
      setCreating(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-title font-extrabold text-foreground">Bước 2: Gán thông tin khách hàng nhận link (CRM)</h3>
          <span className="text-caption px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">Cá nhân hóa</span>
        </div>
        <p className="text-body-sm text-text-muted mt-1">
          Bộ sưu tập đang chọn: <strong className="text-foreground">{catalogName}</strong>. Khi gán tên, màn hình thiệp sẽ có lời chào thân mật (VD: <em>Dành riêng cho Chị Lan</em>) và hệ thống tự theo dõi xem khách đã mở thiệp hay chốt đơn chưa.
        </p>
        <div className="mt-2 text-caption text-text-muted bg-surface-muted p-2.5 rounded-lg border border-border">
          💡 <strong>Mẹo:</strong> Nếu bạn muốn gửi 1 link chung cho tất cả mọi người (không cần tên riêng), hãy nhấn <strong>&quot;Quay lại Bước 1&quot;</strong> và chọn <strong>&quot;Chép Link Dùng Chung&quot;</strong>.
        </div>
      </div>

      <div className="flex flex-col gap-4 bg-surface-muted p-5 rounded-2xl border border-border">
        <label className="flex flex-col gap-1.5">
          <span className="text-caption font-bold text-foreground">Tên Khách Hàng (được hiển thị chào trên Thẻ)</span>
          <input type="text" maxLength={100} placeholder="VD: Anh Minh, Chị Lan, Công ty ABC..." value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={FIELD} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-caption font-bold text-foreground">Số Điện Thoại Khách (không bắt buộc)</span>
          <input type="tel" maxLength={15} placeholder="VD: 0901234567 (dùng để liên hệ giao hoa khi chốt đơn)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className={FIELD} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-caption font-bold text-foreground">Hạn dùng của link</span>
          <select value={expiry} onChange={(e) => setExpiry(e.target.value)} className={FIELD}>
            {LINK_EXPIRY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <Button type="button" variant="outline" onClick={onBack} className="h-10 gap-1.5 text-body-sm font-medium">
          <ArrowLeft size={15} />
          <span>Quay lại Bước 1</span>
        </Button>
        <button
          type="submit"
          disabled={creating}
          className="inline-flex items-center justify-center rounded-xl bg-primary hover:bg-primary-dark text-white font-bold h-10 px-6 text-body-sm shadow-sm transition-colors disabled:opacity-50 gap-1.5"
        >
          {creating ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          <span>{creating ? "Đang sinh link..." : "Sinh Link Chào Hàng Ngay"}</span>
        </button>
      </div>
    </form>
  )
}
