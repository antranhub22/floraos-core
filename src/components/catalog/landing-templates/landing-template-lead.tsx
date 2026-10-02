"use client"

import React, { useState } from "react"
import { Gift, Camera, Clock, CheckCircle2, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface LandingTemplateLeadProps {
  archetypeId: string
  occasionTitle?: string
  /** Slug của catalog đang xem — dùng để gọi API lưu lead */
  catalogSlug?: string | undefined
}

export function LandingTemplateLead({
  archetypeId,
  occasionTitle,
  catalogSlug,
}: LandingTemplateLeadProps) {
  const [phone, setPhone] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const isLuxury = archetypeId === "minimal-luxury"
  const isRomantic = archetypeId === "pastel-romantic"
  const isFestive = archetypeId === "festive-sale"
  const isModern = archetypeId === "modern-split"

  const containerStyle = isLuxury
    ? "bg-surface-alt/60 text-text border-primary/30 rounded-3xl p-6 sm:p-8 shadow-md"
    : isFestive
    ? "bg-danger-bg/15 text-text border-2 border-danger/40 rounded-2xl p-6 sm:p-7 shadow-md"
    : isRomantic
    ? "bg-surface-alt/70 text-text border-primary/20 rounded-3xl p-6 sm:p-7 shadow-xs"
    : isModern
    ? "bg-surface text-text border-2 border-border rounded-xl p-6 sm:p-7 shadow-sm"
    : "bg-surface text-text border-border rounded-3xl p-5 sm:p-6 shadow-sm"

  const titleFont = isLuxury
    ? "font-serif text-title sm:text-display font-normal"
    : isFestive
    ? "font-black text-title sm:text-display text-danger"
    : isModern
    ? "font-black text-title sm:text-display"
    : "font-black text-title sm:text-title-lg"

  const badgeStyle = isLuxury
    ? "bg-primary/10 text-primary border border-primary/20 rounded-full font-serif uppercase tracking-widest text-caption"
    : isFestive
    ? "bg-danger text-white rounded-md uppercase font-black tracking-wide text-caption shadow-xs"
    : isRomantic
    ? "bg-primary/15 text-primary rounded-full font-bold text-caption"
    : "bg-surface-alt text-text border border-border rounded-md font-mono uppercase text-caption"

  const buttonStyle = isLuxury
    ? "bg-primary hover:bg-primary-dark text-white rounded-full font-serif tracking-widest uppercase px-6"
    : isFestive
    ? "bg-danger hover:bg-danger/90 text-white rounded-xl font-black uppercase tracking-wide px-5 shadow-sm"
    : isRomantic
    ? "bg-primary hover:bg-primary-dark text-white rounded-full font-bold px-5"
    : isModern
    ? "bg-text text-surface hover:bg-text/90 rounded-lg font-bold px-5"
    : "bg-primary hover:bg-primary-dark text-white font-black px-4"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) return

    // Nếu không có catalogSlug (ví dụ: preview trong editor) → chỉ hiển thị UI success
    if (!catalogSlug) {
      setSubmitted(true)
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch(`/api/v1/public/catalog/${catalogSlug}/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { message?: string }).message || "Không thể gửi yêu cầu tư vấn.")
      }
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Đã có lỗi xảy ra, vui lòng thử lại.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`border space-y-4 sm:space-y-5 ${containerStyle}`}>
      <div className="text-center max-w-md mx-auto space-y-2">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 ${badgeStyle}`}>
          <Gift size={12} className="shrink-0" />
          <span>{isFestive ? "Chớp Cơ Hội Duy Nhất Hôm Nay" : isLuxury ? "Đặc Quyền Riêng Tư Cho Bạn" : "Đặc Quyền Đặt Hoa Sớm"}</span>
        </div>
        <h3 className={`tracking-tight leading-snug ${titleFont}`}>
          {isFestive ? "Ưu Đãi Siêu Tốc 10% & Tặng Thiệp Thiết Kế Riêng" : "Nhận Ngay Ưu Đãi 10% & Tặng Thiệp Thiết Kế Riêng"}
        </h3>
        <p className={`text-caption sm:text-body-sm text-text-muted leading-relaxed ${isLuxury ? "font-serif italic" : ""}`}>
          Áp dụng cho khách hàng đặt trước trong chiến dịch {occasionTitle ? `"${occasionTitle}"` : "này"}. Số lượng ưu đãi có hạn mỗi ngày!
        </p>
      </div>

      {submitted ? (
        <div className="p-4 rounded-2xl bg-success/10 border border-success/30 text-success text-center space-y-1 animate-in fade-in">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold">
            <CheckCircle2 size={16} />
            <span>Đã ghi nhận số điện thoại thành công!</span>
          </div>
          <p className="text-caption opacity-90">
            Chuyên viên tư vấn hoa tươi sẽ liên hệ Zalo lại ngay trong vòng 5 phút để xác nhận mẫu và áp dụng mã giảm giá 10% cho bạn.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <form onSubmit={handleSubmit} className="max-w-sm mx-auto flex flex-col sm:flex-row gap-2">
            <Input
              type="tel"
              placeholder="Nhập số điện thoại Zalo..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`h-10 text-xs bg-surface text-text border-border ${isLuxury ? "rounded-full px-4" : isModern ? "rounded-lg" : "rounded-xl"}`}
              required
              disabled={submitting}
            />
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className={`h-10 text-xs shrink-0 flex items-center justify-center gap-1.5 shadow-xs ${buttonStyle}`}
            >
              {submitting ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <>
                  <span>{isFestive ? "Nhận ưu đãi ngay" : "Tư vấn ngay"}</span>
                  <ArrowRight size={13} />
                </>
              )}
            </Button>
          </form>
          {submitError && (
            <p className="text-center text-caption text-danger mt-1">{submitError}</p>
          )}
        </div>
      )}

      {/* 3 Guarantees */}
      <div className={`pt-3 border-t border-border/50 grid grid-cols-3 gap-2 text-caption text-text-muted text-center ${isLuxury ? "font-serif" : ""}`}>
        <div className="flex flex-col items-center gap-1">
          <Camera size={14} className={isFestive ? "text-danger" : "text-warning"} />
          <span className="font-medium">Chụp ảnh duyệt trước</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Clock size={14} className="text-primary" />
          <span className="font-medium">Giao chuẩn hẹn 2h</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <CheckCircle2 size={14} className="text-success" />
          <span className="font-medium">Hoa tươi 3–5 ngày</span>
        </div>
      </div>
    </div>
  )
}

