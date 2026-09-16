"use client"

import React, { useState } from "react"
import { Gift, Camera, Clock, CheckCircle2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface LandingTemplateLeadProps {
  archetypeId: string
  occasionTitle?: string
}

export function LandingTemplateLead({
  archetypeId,
  occasionTitle,
}: LandingTemplateLeadProps) {
  const [phone, setPhone] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const isLuxury = archetypeId === "minimal-luxury"
  const isRomantic = archetypeId === "pastel-romantic"

  const containerBg = isLuxury
    ? "bg-gradient-to-br from-slate-900 via-neutral-900 to-amber-950 text-white border-amber-900/40"
    : isRomantic
    ? "bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 text-slate-900 border-rose-200"
    : "bg-white text-slate-900 border-slate-200"

  const buttonStyle = isLuxury
    ? "bg-amber-500 hover:bg-amber-600 text-slate-950 font-black"
    : isRomantic
    ? "bg-rose-600 hover:bg-rose-700 text-white font-black"
    : "bg-primary hover:bg-primary-hover text-white font-black"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) return
    setSubmitted(true)
  }

  return (
    <div className={`p-5 sm:p-6 rounded-3xl border shadow-sm space-y-4 ${containerBg}`}>
      <div className="text-center max-w-md mx-auto space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-500/15 text-rose-600 text-[11px] font-extrabold uppercase tracking-wider">
          <Gift size={12} className="shrink-0" />
          <span>Đặc Quyền Đặt Hoa Sớm</span>
        </div>
        <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug">
          Nhận Ngay Ưu Đãi 10% & Tặng Thiệp Thiết Kế Riêng
        </h3>
        <p className="text-xs text-slate-500 opacity-90 leading-relaxed">
          Áp dụng cho khách hàng đặt trước trong chiến dịch {occasionTitle ? `"${occasionTitle}"` : "này"}. Số lượng ưu đãi có hạn mỗi ngày!
        </p>
      </div>

      {submitted ? (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-center space-y-1 animate-in fade-in">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold">
            <CheckCircle2 size={16} />
            <span>Đã ghi nhận số điện thoại thành công!</span>
          </div>
          <p className="text-[11px] opacity-90">
            Chuyên viên tư vấn hoa tươi sẽ liên hệ Zalo lại ngay trong vòng 5 phút để xác nhận mẫu và áp dụng mã giảm giá 10% cho bạn.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-sm mx-auto flex flex-col sm:flex-row gap-2">
          <Input
            type="tel"
            placeholder="Nhập số điện thoại Zalo..."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-9 text-xs bg-white text-slate-900 border-slate-300"
            required
          />
          <Button type="submit" size="sm" className={`h-9 px-4 text-xs shrink-0 flex items-center gap-1.5 shadow-xs ${buttonStyle}`}>
            <span>Tư vấn ngay</span>
            <ArrowRight size={13} />
          </Button>
        </form>
      )}

      {/* 3 Guarantees */}
      <div className="pt-3 border-t border-black/5 grid grid-cols-3 gap-2 text-[10.5px] text-slate-500 text-center">
        <div className="flex flex-col items-center gap-1">
          <Camera size={14} className="text-amber-500" />
          <span className="font-medium">Chụp ảnh duyệt trước</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Clock size={14} className="text-rose-500" />
          <span className="font-medium">Giao chuẩn hẹn 2h</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <CheckCircle2 size={14} className="text-emerald-500" />
          <span className="font-medium">Hoa tươi 3–5 ngày</span>
        </div>
      </div>
    </div>
  )
}
