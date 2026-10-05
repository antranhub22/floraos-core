"use client"

import React from "react"
import { Check, Sparkles } from "lucide-react"
import type { WizardStep } from "./journey-types"

const STEPS: Array<{ n: WizardStep; label: string }> = [
  { n: 1, label: "Bộ Sưu Tập" },
  { n: 2, label: "Thông Tin Khách" },
  { n: 3, label: "Nhận Link Gửi" },
]

/** Thanh 3 bước của luồng gửi Thẻ chào. */
export function JourneyStepper({ step, onGoToManager }: { step: WizardStep; onGoToManager?: (() => void) | undefined }) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex items-center gap-2 text-caption font-bold uppercase text-primary tracking-wider">
          <Sparkles size={14} />
          <span>Quy Trình Gửi Thẻ Chào 3 Bước</span>
        </div>
        {onGoToManager && (
          <button type="button" onClick={onGoToManager} className="text-body-sm text-text-muted hover:text-foreground font-medium underline">
            Vào Bảng Quản Lý
          </button>
        )}
      </div>

      <ol className="grid grid-cols-3 gap-2 sm:gap-4">
        {STEPS.map(({ n, label }) => {
          const done = step > n && n < 3
          const current = step === n
          return (
            <li
              key={n}
              aria-current={current ? "step" : undefined}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                current
                  ? "bg-selected text-primary border-primary font-bold shadow-xs"
                  : done
                  ? "bg-surface text-foreground border-border font-medium"
                  : "bg-surface-muted text-text-muted border-transparent"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-caption shrink-0 font-bold ${
                  done ? "bg-success text-white" : current ? "bg-primary text-white" : "bg-border text-text-muted"
                }`}
              >
                {done ? <Check size={12} /> : n}
              </div>
              <div className="truncate">
                <div className="text-caption hidden sm:block text-text-muted">BƯỚC {n}</div>
                <div className="text-body-sm truncate">{label}</div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
