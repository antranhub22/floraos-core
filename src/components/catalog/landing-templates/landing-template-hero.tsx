"use client"

import React from "react"
import { Sparkles, Clock, ShieldCheck, Truck, HeartHandshake } from "lucide-react"

interface LandingTemplateHeroProps {
  headline: string
  occasionId: string
  archetypeId: string
}

export function LandingTemplateHero({
  headline,
  occasionId,
  archetypeId,
}: LandingTemplateHeroProps) {
  // Theme styling based on archetype
  const isLuxury = archetypeId === "minimal-luxury"
  const isRomantic = archetypeId === "pastel-romantic"
  const isModern = archetypeId === "modern-split"

  const bgGradient = isLuxury
    ? "bg-gradient-to-br from-text via-text to-text border-primary/40 text-white"
    : isRomantic
    ? "bg-gradient-to-br from-primary via-primary-dark to-primary border-primary/40 text-white"
    : isModern
    ? "bg-gradient-to-br from-text via-text to-text border-border text-white"
    : "bg-gradient-to-br from-primary-dark via-primary to-primary-dark border-primary text-white"

  return (
    <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-xl border ${bgGradient}`}>
      {/* Background ambient glow */}
      <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-accent/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center max-w-xl mx-auto space-y-3">
        {/* Top Occasion Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-caption font-extrabold uppercase tracking-widest border border-white/10 shadow-xs">
          <Sparkles size={12} className="text-white animate-pulse" />
          <span>Bộ Sưu Tập Chiến Dịch Đặc Biệt</span>
        </div>

        {/* Main Headline */}
        <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight text-white drop-shadow-xs">
          {headline || "Gửi Trọn Tình Yêu — Ngọt Ngào & Tinh Tế"}
        </h2>

        {/* Subtitle */}
        <p className="text-xs sm:text-body-sm text-white/90 leading-relaxed max-w-md mx-auto">
          Tuyển chọn những đóa hoa tươi nhập khẩu rực rỡ nhất, thay bạn gửi trao ngàn lời yêu thương sâu sắc.
        </p>

        {/* Countdown Timer Strip (FOMO) */}
        <div className="pt-2 pb-1">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10 text-xs">
            <div className="flex items-center gap-1 text-white font-bold text-caption">
              <Clock size={13} />
              <span>Ưu đãi đặt sớm:</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono font-black text-white text-xs">
              <span className="px-1.5 py-0.5 rounded-md bg-white/20">02</span>
              <span>:</span>
              <span className="px-1.5 py-0.5 rounded-md bg-white/20">14</span>
              <span>:</span>
              <span className="px-1.5 py-0.5 rounded-md bg-white/20">35</span>
            </div>
          </div>
        </div>

        {/* 3 Core Trust Badges */}
        <div className="pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-caption text-white/85">
          <div className="flex items-center justify-center gap-1">
            <Truck size={12} className="text-white shrink-0" />
            <span className="truncate">Giao nhanh 2h</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <ShieldCheck size={12} className="text-white shrink-0" />
            <span className="truncate">Tươi 3–5 ngày</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <HeartHandshake size={12} className="text-white shrink-0" />
            <span className="truncate">Tặng thiệp & banner</span>
          </div>
        </div>
      </div>
    </div>
  )
}
