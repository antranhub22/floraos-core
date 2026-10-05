"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export type JourneyStep = 1 | 2 | 3

const STEPS: { id: JourneyStep; title: string; hint: string }[] = [
  { id: 1, title: "Chọn bộ sưu tập", hint: "Mẫu hoa khách sẽ xem" },
  { id: 2, title: "Thông tin khách", hint: "Lời chào riêng, theo dõi đơn" },
  { id: 3, title: "Gửi link", hint: "Sao chép và gửi qua Zalo" },
]

interface JourneyStepperProps {
  step: JourneyStep
  /** Cho phép quay lại bước đã hoàn thành. */
  onStepClick: (step: JourneyStep) => void
}

export function JourneyStepper({ step, onStepClick }: JourneyStepperProps) {
  return (
    <nav aria-label="Các bước gửi thẻ chào">
      <ol className="grid grid-cols-3 gap-2">
        {STEPS.map((s) => {
          const done = s.id < step
          const current = s.id === step
          return (
            <li key={s.id} className="min-w-0">
              <button
                type="button"
                disabled={!done}
                aria-current={current ? "step" : undefined}
                onClick={() => onStepClick(s.id)}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-xl border-b-2 px-2 py-3 text-left transition-colors sm:px-3",
                  current && "border-primary",
                  done && "border-success hover:bg-surface-alt",
                  !current && !done && "border-border",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-caption font-bold",
                    current && "bg-primary text-white",
                    done && "bg-success text-white",
                    !current && !done && "bg-surface-alt text-text-muted",
                  )}
                >
                  {done ? <Check size={14} aria-hidden="true" /> : s.id}
                </span>
                <span className="min-w-0">
                  <span className={cn("block truncate text-body-sm font-bold", current ? "text-foreground" : "text-text-muted")}>
                    {s.title}
                  </span>
                  <span className="hidden truncate text-caption text-text-muted md:block">{s.hint}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
