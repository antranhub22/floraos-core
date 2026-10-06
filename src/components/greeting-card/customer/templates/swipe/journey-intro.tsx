"use client"

import { Heart, Hand, ShoppingBag, X } from "lucide-react"
import { SWIPE_SIGNAL, type SwipeTheme } from "./swipe-themes"

interface JourneyIntroProps {
  theme: SwipeTheme
  mode: "onboarding" | "resume"
  catalogName: string
  total: number
  /** Mẫu đã xem / đã thích — cho hộp hỏi tiếp tục */
  progress: { viewed: number; liked: number }
  onStart: () => void
  onStartOver: () => void
}

const STEPS = [
  { icon: Heart, color: SWIPE_SIGNAL.like, text: "Bấm ♥ Thích (hoặc vuốt phải) để lưu mẫu bạn ưng" },
  { icon: X, color: SWIPE_SIGNAL.nope, text: "Bấm ✕ Bỏ qua (hoặc vuốt trái) để xem mẫu tiếp theo" },
  { icon: ShoppingBag, color: SWIPE_SIGNAL.info, text: "Ưng mẫu nào thì bấm Đặt mẫu này ngay, không cần xem hết" },
]

/** Hướng dẫn lần đầu mở link, hoặc hỏi "Tiếp tục xem / Xem lại từ đầu" khi mở lại. */
export function JourneyIntro({ theme, mode, catalogName, total, progress, onStart, onStartOver }: JourneyIntroProps) {
  const panel = { background: theme.controlBg, borderColor: theme.controlBorder }
  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="journey-intro-title"
      className="flex flex-1 flex-col justify-center gap-5 py-6"
    >
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border" style={{ ...panel, color: SWIPE_SIGNAL.like }}>
          <Hand size={26} aria-hidden="true" />
        </span>
        <h2 id="journey-intro-title" className="mt-3 text-title font-semibold" style={{ fontFamily: theme.font }}>
          {mode === "onboarding" ? catalogName : "Chào mừng bạn quay lại"}
        </h2>
        <p className="mt-1 text-body-sm" style={{ color: theme.stageMuted }}>
          {mode === "onboarding"
            ? `${total} mẫu hoa đang chờ bạn. Chỉ mất vài giây để chọn:`
            : `Bạn đã xem ${progress.viewed}/${total} mẫu${progress.liked > 0 ? ` và thích ${progress.liked} mẫu` : ""}.`}
        </p>
      </div>

      {mode === "onboarding" && (
        <ul className="flex flex-col gap-2.5">
          {STEPS.map(({ icon: Icon, color, text }) => (
            <li key={text} className="flex items-center gap-3 rounded-2xl border p-3 text-body-sm" style={panel}>
              <Icon size={20} color={color} aria-hidden="true" className="shrink-0" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onStart}
          autoFocus
          className="h-12 rounded-2xl text-body font-bold shadow-lg"
          style={{ background: theme.ctaBg, color: theme.ctaText }}
        >
          {mode === "onboarding" ? "Bắt đầu xem" : "Tiếp tục xem"}
        </button>
        {mode === "resume" && (
          <button type="button" onClick={onStartOver} className="h-12 rounded-2xl border text-body-sm font-semibold" style={{ borderColor: theme.controlBorder }}>
            Xem lại từ đầu
          </button>
        )}
      </div>
    </section>
  )
}
