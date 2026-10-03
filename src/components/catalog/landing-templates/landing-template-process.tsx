"use client"

import React from "react"
import { ArrowRight, Sparkles } from "lucide-react"
import type { LandingSectionStep } from "@/modules/content-engine/domain/landing-content-generator"

interface LandingTemplateProcessProps {
  steps?: LandingSectionStep[] | undefined
  archetypeId?: string | undefined
}

export function LandingTemplateProcess({
  steps,
  archetypeId = "minimal-luxury",
}: LandingTemplateProcessProps) {
  if (!steps || steps.length === 0) return null

  const isLuxury = archetypeId === "minimal-luxury"
  const isRomantic = archetypeId === "pastel-romantic"
  const isFestive = archetypeId === "festive-sale"

  const containerStyle = isLuxury
    ? "bg-surface-alt/60 border-primary/20 shadow-xs"
    : isRomantic
    ? "bg-surface border-primary/30 shadow-xs"
    : isFestive
    ? "bg-surface border-danger/30 shadow-xs"
    : "bg-surface border-border shadow-xs"

  const titleStyle = isLuxury
    ? "font-serif text-title sm:text-display font-normal text-text mt-1"
    : "text-title-sm sm:text-title font-extrabold text-text mt-1"

  return (
    <section className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${containerStyle}`}>
      <div className="text-center max-w-md mx-auto space-y-1">
        <div className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-caption font-extrabold uppercase tracking-wider ${
          isLuxury ? "bg-primary/10 text-primary font-serif tracking-widest" : isFestive ? "bg-danger-bg text-danger" : "bg-primary/10 text-primary"
        }`}>
          <Sparkles size={12} />
          <span>{isLuxury ? "Nghi Thức Chế Tác & Trao Gửi" : "Trải Nghiệm Đặt Hoa Đơn Giản"}</span>
        </div>
        <h3 className={titleStyle}>
          3 Bước Hoàn Hảo Để Trao Yêu Thương
        </h3>
        <p className={`text-caption ${isLuxury ? "font-serif text-text/75" : "text-text-muted"}`}>
          Quy trình chuẩn hóa từ lúc chọn mẫu đến khi hoa tươi thắm đến tay người nhận.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
        {steps.map((st, idx) => (
          <div
            key={st.step}
            className={`p-5 rounded-2xl border relative flex flex-col justify-between space-y-3 group transition-all shadow-xs ${
              isLuxury
                ? "bg-surface border-primary/20 hover:border-primary/60"
                : isFestive
                ? "bg-surface border-danger/20 hover:border-danger"
                : "bg-surface-alt border-border hover:border-primary"
            }`}
          >
            <div className="flex items-center justify-between">
              {isLuxury ? (
                <span className="font-serif text-2xl text-primary font-bold">
                  0{st.step}.
                </span>
              ) : (
                <span className={`w-8 h-8 rounded-full text-white font-black text-caption flex items-center justify-center shadow-xs ${
                  isFestive ? "bg-danger" : "bg-primary"
                }`}>
                  0{st.step}
                </span>
              )}
              {idx < steps.length - 1 && (
                <div className="hidden md:flex text-text-muted/40">
                  <ArrowRight size={16} />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h4 className={`text-xs font-bold text-text group-hover:text-primary transition-colors ${isLuxury ? "font-serif text-sm" : ""}`}>
                {st.title}
              </h4>
              <p className={`text-caption leading-relaxed ${isLuxury ? "font-serif text-text/75" : "text-text-muted"}`}>
                {st.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
