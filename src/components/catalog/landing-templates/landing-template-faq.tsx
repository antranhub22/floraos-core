"use client"

import React, { useState } from "react"
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react"
import type { LandingSectionFaq } from "@/modules/content-engine/domain/landing-content-generator"

interface LandingTemplateFaqProps {
  faq?: LandingSectionFaq[] | undefined
  archetypeId?: string | undefined
}

export function LandingTemplateFaq({
  faq,
  archetypeId = "minimal-luxury",
}: LandingTemplateFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  if (!faq || faq.length === 0) return null

  const isLuxury = archetypeId === "minimal-luxury"
  const isRomantic = archetypeId === "pastel-romantic"
  const isFestive = archetypeId === "festive-sale"

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  const containerStyle = isLuxury
    ? "bg-surface-alt/60 border-primary/20 shadow-xs"
    : isRomantic
    ? "bg-surface border-primary/30 shadow-xs"
    : isFestive
    ? "bg-surface border-danger/30 shadow-xs"
    : "bg-surface border-border shadow-xs"

  const titleStyle = isLuxury
    ? "font-serif text-title sm:text-display font-normal text-text mt-0.5"
    : "text-title-sm sm:text-title font-extrabold text-text mt-0.5"

  return (
    <section className={`p-6 sm:p-8 rounded-3xl border space-y-5 ${containerStyle}`}>
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isLuxury ? "bg-primary/15 text-primary" : isFestive ? "bg-danger-bg text-danger" : "bg-primary-bg/30 text-primary"
        }`}>
          <HelpCircle size={16} />
        </div>
        <div>
          <span className={`text-caption font-bold tracking-widest uppercase ${
            isLuxury ? "font-serif text-primary" : isFestive ? "text-danger" : "text-primary"
          }`}>
            {isLuxury ? "Tường Minh Mọi Thắc Mắc" : "Giải Đáp Thắc Mắc"}
          </span>
          <h3 className={titleStyle}>
            Câu Hỏi Thường Gặp Của Khách Hàng
          </h3>
        </div>
      </div>

      <div className="space-y-2.5">
        {faq.map((item, idx) => {
          const isOpen = openIndex === idx
          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all ${
                isOpen
                  ? isLuxury
                    ? "border-primary/40 bg-surface shadow-xs"
                    : isFestive
                    ? "border-danger/40 bg-danger-bg/10"
                    : "border-primary bg-surface-alt/50"
                  : isLuxury
                  ? "border-primary/15 bg-surface/70 hover:border-primary/30"
                  : "border-border bg-surface hover:border-border-hover"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 flex items-center justify-between text-left gap-3 focus:outline-none"
              >
                <span className={`text-xs font-bold text-text ${isLuxury ? "font-serif text-body-sm" : ""}`}>
                  {item.question}
                </span>
                <span className={`${isLuxury ? "text-primary" : "text-text-muted"} shrink-0`}>
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </button>

              {isOpen && (
                <div className={`px-4 pb-4 pt-1 text-caption leading-relaxed border-t animate-in fade-in duration-150 ${
                  isLuxury ? "border-primary/10 font-serif text-text/80 text-body-sm" : "border-border/50 text-text-muted"
                }`}>
                  {item.answer}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
