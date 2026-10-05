"use client"

import { useState } from "react"
import { ArrowLeft, Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InlineError } from "@/components/ui/inline-error"
import { LINK_EXPIRY_OPTIONS } from "@/components/greeting-card/sales/sales-types"

const PHONE_PATTERN = /^(\+?84|0)\d{9,10}$/

export function isValidPhone(raw: string): boolean {
  const compact = raw.replace(/[\s.-]/g, "")
  return compact === "" || PHONE_PATTERN.test(compact)
}

interface StepCustomerProps {
  catalogName: string
  customerName: string
  customerPhone: string
  onNameChange: (value: string) => void
  onPhoneChange: (value: string) => void
  /** Hạn dùng link: "7" | "30" | "90" | "never" (xem LINK_EXPIRY_OPTIONS). */
  expiry: string
  onExpiryChange: (value: string) => void
  onBack: () => void
  onSubmit: () => Promise<void>
}

const inputClass =
  "h-11 w-full rounded-xl border bg-background px-3.5 text-body text-foreground placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"

export function StepCustomer(props: StepCustomerProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [touchedPhone, setTouchedPhone] = useState(false)
  const phoneInvalid = touchedPhone && !isValidPhone(props.customerPhone)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouchedPhone(true)
    if (!isValidPhone(props.customerPhone) || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await props.onSubmit()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được link. Vui lòng thử lại.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-labelledby="step-customer-title" className="flex flex-col gap-5" noValidate>
      <header>
        <h2 id="step-customer-title" className="text-title font-bold text-foreground">
          Gửi riêng cho một khách
        </h2>
        <p className="mt-1 text-body-sm text-text-muted">
          Bộ sưu tập <strong className="text-foreground">{props.catalogName}</strong>. Thẻ sẽ chào đúng tên khách (ví dụ
          “Dành riêng cho chị Lan”) và bạn theo dõi được khách đã mở thẻ hay đặt hoa chưa.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="customer-name" className="text-body-sm font-bold text-foreground">
            Tên khách hiển thị trên thẻ
          </label>
          <input
            id="customer-name"
            autoFocus
            maxLength={80}
            value={props.customerName}
            onChange={(e) => props.onNameChange(e.target.value)}
            placeholder="Anh Minh, chị Lan, Công ty ABC…"
            className={`${inputClass} border-border`}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="customer-phone" className="text-body-sm font-bold text-foreground">
            Số điện thoại <span className="font-normal text-text-muted">(không bắt buộc)</span>
          </label>
          <input
            id="customer-phone"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            maxLength={16}
            value={props.customerPhone}
            onChange={(e) => props.onPhoneChange(e.target.value)}
            onBlur={() => setTouchedPhone(true)}
            placeholder="0901 234 567"
            aria-invalid={phoneInvalid}
            aria-describedby="customer-phone-hint"
            className={`${inputClass} ${phoneInvalid ? "border-danger" : "border-border"}`}
          />
          <p id="customer-phone-hint" className={`text-caption ${phoneInvalid ? "text-danger" : "text-text-muted"}`}>
            {phoneInvalid ? "Số điện thoại chưa đúng, ví dụ 0901234567." : "Dùng để liên hệ giao hoa khi khách đặt."}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="link-expiry" className="text-body-sm font-bold text-foreground">Hạn dùng của link</label>
        <select
          id="link-expiry"
          value={props.expiry}
          onChange={(e) => props.onExpiryChange(e.target.value)}
          aria-describedby="link-expiry-hint"
          className={`${inputClass} border-border`}
        >
          {LINK_EXPIRY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <p id="link-expiry-hint" className="text-caption text-text-muted">
          Hết hạn mà khách chưa đặt thì link tự đóng. Link đã có đơn luôn mở được để khách theo dõi.
        </p>
      </div>

      {error && <InlineError message={error} />}

      <footer className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" size="sm" onClick={props.onBack} className="gap-1.5">
          <ArrowLeft size={16} aria-hidden="true" />
          Quay lại
        </Button>
        <Button type="submit" size="sm" disabled={submitting} className="gap-1.5">
          {submitting ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
          {submitting ? "Đang tạo link…" : "Tạo link gửi khách"}
        </Button>
      </footer>
    </form>
  )
}
