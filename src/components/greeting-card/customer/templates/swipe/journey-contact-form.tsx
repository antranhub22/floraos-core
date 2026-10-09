"use client"

import React, { useState } from "react"
import { Gift, UserCheck } from "lucide-react"
import type { SwipeTheme } from "./swipe-themes"

interface JourneyContactFormProps {
  theme: SwipeTheme
  catalogName: string
  initialName?: string | undefined
  initialPhone?: string | undefined
  initialEmail?: string | undefined
  promotionCta?: { enabled: boolean; percent: number } | undefined
  onNext: (contact: { name: string; phone: string; email: string }) => void
}

/**
 * Chặng 1 — Thu thập thông tin người gửi (Họ tên bắt buộc, SĐT & Email tùy chọn)
 * kèm CTA ưu đãi có thể bật/tắt và điều chỉnh số % bởi Điều hành.
 */
export function JourneyContactForm({
  theme,
  catalogName,
  initialName = "",
  initialPhone = "",
  initialEmail = "",
  promotionCta,
  onNext,
}: JourneyContactFormProps) {
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone)
  const [email, setEmail] = useState(initialEmail)

  const canContinue = name.trim().length > 0
  const panel = { background: theme.controlBg, borderColor: theme.controlBorder }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canContinue) return
    onNext({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
    })
  }

  const inputClass =
    "w-full h-11 px-3.5 rounded-xl border border-border bg-background text-body text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="journey-contact-title"
      className="flex flex-1 flex-col justify-center gap-4 py-4"
    >
      <div className="text-center">
        <span
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border shadow-2xs"
          style={{ ...panel, color: theme.stageText }}
        >
          <UserCheck size={24} aria-hidden="true" />
        </span>
        <h2 id="journey-contact-title" className="mt-2.5 text-title font-bold" style={{ fontFamily: theme.font }}>
          Chào mừng bạn
        </h2>
        <p className="mt-0.5 text-body-sm" style={{ color: theme.stageMuted }}>
          Khám phá bộ sưu tập <strong className="font-semibold">{catalogName}</strong>
        </p>
      </div>

      {/* CTA Ưu đãi đặt mua trực tiếp (Điều hành có thể bật/tắt và đổi % trong cài đặt) */}
      {promotionCta?.enabled !== false && (
        <div
          className="flex items-center gap-3 rounded-2xl border p-3.5 shadow-2xs"
          style={panel}
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold shadow-xs"
            style={{ background: theme.ctaBg, color: theme.ctaText }}
            aria-hidden="true"
          >
            <Gift size={20} />
          </span>
          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center rounded-full bg-danger-bg px-2 py-0.5 text-caption font-extrabold uppercase text-danger">
                Ưu đãi {promotionCta?.percent ?? 10}%
              </span>
              <span className="text-caption font-semibold" style={{ color: theme.stageMuted }}>
                Độc quyền tại link
              </span>
            </div>
            <p className="mt-0.5 text-body-sm font-bold" style={{ color: theme.stageText }}>
              Nhận quà {promotionCta?.percent ?? 10}% giảm giá khi Đặt mua hoa trực tiếp tại link này!
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl border p-4 shadow-sm" style={panel}>
        <div>
          <label htmlFor="intake-name" className="block text-body-sm font-semibold mb-1" style={{ color: theme.stageText }}>
            Họ tên của bạn <span className="text-danger">*</span>
          </label>
          <input
            id="intake-name"
            type="text"
            required
            autoFocus
            autoComplete="name"
            placeholder="VD: Lan Anh, Minh Tuấn..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="intake-phone" className="block text-body-sm font-semibold mb-1" style={{ color: theme.stageText }}>
            Số điện thoại <span className="text-caption font-normal opacity-70">(không bắt buộc)</span>
          </label>
          <input
            id="intake-phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="VD: 0901234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="intake-email" className="block text-body-sm font-semibold mb-1" style={{ color: theme.stageText }}>
            Email <span className="text-caption font-normal opacity-70">(không bắt buộc)</span>
          </label>
          <input
            id="intake-email"
            type="email"
            autoComplete="email"
            placeholder="VD: email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={!canContinue}
          className="mt-1 h-12 w-full rounded-xl text-body font-bold shadow-md transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
          style={{ background: theme.ctaBg, color: theme.ctaText }}
        >
          Tiếp tục
        </button>

        <p className="text-center text-caption opacity-70">
          Thông tin được lưu để tự động điền khi bạn đặt hoa
        </p>
      </form>
    </section>
  )
}
