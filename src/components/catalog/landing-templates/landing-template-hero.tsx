"use client"

import React from "react"
import { Sparkles, Clock, ShieldCheck, Truck, HeartHandshake, Award } from "lucide-react"

interface LandingTemplateHeroProps {
  headline: string
  occasionId: string
  archetypeId: string
  heroImageUrl?: string | undefined
}

export function LandingTemplateHero({
  headline,
  occasionId,
  archetypeId,
  heroImageUrl,
}: LandingTemplateHeroProps) {
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

  const displayImage = heroImageUrl || "/images/flowers/g001.jpeg"

  return (
    <div className={`relative overflow-hidden rounded-3xl p-5 sm:p-7 shadow-xl border ${bgGradient}`}>
      {/* Background ambient glow */}
      <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-accent/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Top Badges & Countdown */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-caption font-extrabold uppercase tracking-widest border border-white/10 shadow-xs">
            <Sparkles size={12} className="text-white animate-pulse" />
            <span>Chiến Dịch Hoa Tươi Tuyển Chọn</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-xs">
            <Clock size={12} className="text-white" />
            <span className="text-caption font-medium">Ưu đãi đặt sớm:</span>
            <span className="font-mono font-black text-caption text-white tracking-wider">02 : 14 : 35</span>
          </div>
        </div>

        {/* Hero Main Body: Split or Centered with Image */}
        {isModern ? (
          /* Split Layout (Modern Split) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2">
            <div className="space-y-4 text-left">
              <h2 className="text-title sm:text-display font-black tracking-tight leading-tight text-white drop-shadow-xs">
                {headline || "Gửi Trọn Tình Yêu — Ngọt Ngào & Tinh Tế"}
              </h2>
              <p className="text-body-sm text-white/90 leading-relaxed">
                Tuyển chọn những đóa hoa tươi nhập khẩu rực rỡ nhất, cắm thủ công bởi nghệ nhân và chăm sóc theo tiêu chuẩn chuyên biệt.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-caption font-bold text-white">
                <Award size={14} className="text-warning" />
                <span>Cam kết hoa tươi loại 1 & chụp duyệt trước khi giao</span>
              </div>
            </div>

            {/* Split Right Column: Portrait Showcase Card */}
            <div className="relative max-w-sm sm:max-w-md mx-auto aspect-4/5 w-full rounded-3xl overflow-hidden shadow-2xl border border-white/20 group bg-white/5 backdrop-blur-md">
              <div
                className="absolute inset-0 bg-cover bg-center blur-3xl opacity-35 scale-110 pointer-events-none"
                style={{ backgroundImage: `url(${displayImage})` }}
              />
              <img
                src={displayImage}
                alt="Hoa chiến dịch"
                className="relative z-10 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 select-none"
              />
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/75 via-black/30 to-transparent pointer-events-none z-10" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between p-2.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/15 z-20 shadow-md">
                <div className="flex items-center gap-1.5 text-white text-caption font-bold">
                  <Sparkles size={12} className="text-warning animate-pulse" />
                  <span>Ảnh tác phẩm thực tế</span>
                </div>
                <span className="text-caption text-white/80 font-mono">100% hoa tươi mới</span>
              </div>
            </div>
          </div>
        ) : (
          /* Centered with Featured Image (Minimal Luxury & Romantic) */
          <div className="text-center max-w-xl mx-auto space-y-4 pt-1">
            <h2 className="text-title sm:text-display font-black tracking-tight leading-tight text-white drop-shadow-xs">
              {headline || "Gửi Trọn Tình Yêu — Ngọt Ngào & Tinh Tế"}
            </h2>
            <p className="text-body-sm text-white/90 leading-relaxed max-w-md mx-auto">
              Tuyển chọn những đóa hoa tươi nhập khẩu rực rỡ nhất, thay bạn gửi trao ngàn lời yêu thương sâu sắc.
            </p>

            {/* Featured Flower Image Showcase — Tỷ lệ Chân Dung 4:5 Triệt Tiêu Khoảng Trống Thừa */}
            <div className="relative max-w-xs sm:max-w-sm mx-auto aspect-4/5 w-full rounded-3xl overflow-hidden shadow-2xl border border-white/25 group bg-white/5 backdrop-blur-md">
              {/* Lớp nền ambient glow khuếch tán đồng màu với hoa */}
              <div
                className="absolute inset-0 bg-cover bg-center blur-3xl opacity-35 scale-110 pointer-events-none"
                style={{ backgroundImage: `url(${displayImage})` }}
              />

              {/* Ảnh tác phẩm hoa hiển thị trọn vẹn, sắc nét, không bị ép ngang */}
              <img
                src={displayImage}
                alt="Hoa chiến dịch"
                className="relative z-10 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 select-none"
              />

              {/* Gradient bóng chân thẻ để nhãn nổi bật */}
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/75 via-black/30 to-transparent pointer-events-none z-10" />

              {/* Huy hiệu định danh sang trọng */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-black/60 backdrop-blur-md border border-white/15 z-20 shadow-md">
                <div className="flex items-center gap-2 text-white text-caption font-bold">
                  <Sparkles size={13} className="text-warning animate-pulse" />
                  <span>Tác phẩm tâm điểm chiến dịch</span>
                </div>
                <span className="text-caption text-white/80 font-mono">Tuyển chọn nghệ nhân</span>
              </div>
            </div>
          </div>
        )}

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
