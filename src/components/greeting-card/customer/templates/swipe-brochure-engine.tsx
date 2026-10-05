"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Heart, Info, RotateCcw, X } from "lucide-react"
import type { GreetingCatalogProduct } from "@/modules/greeting-card/domain/greeting-card-types"
import { EnterpriseSpecSheet } from "./enterprise-spec-sheet"
import { SwipeCard, formatVnd } from "./swipe/swipe-card"
import { SwipeDeckEnd } from "./swipe/swipe-deck-end"
import { SWIPE_SIGNAL, getSwipeTheme, isLightTheme } from "./swipe/swipe-themes"
import { useCardSwipe, type SwipeDirection } from "./swipe/use-card-swipe"
import { rootHeight, useEmbeddedPreview } from "./aux/embedded"

interface SwipeBrochureEngineProps {
  products: GreetingCatalogProduct[]
  catalogName: string
  selectedProductId: string | null
  onSelectProduct: (product: GreetingCatalogProduct) => void
  /** Số kiểu ("01"…"12") hoặc id mẫu */
  styleKey?: string
}

function RoundButton(props: {
  label: string
  color: string
  size: "sm" | "lg"
  bg: string
  border: string
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  const dim = props.size === "lg" ? "h-16 w-16" : "h-12 w-12"
  return (
    <button
      type="button"
      aria-label={props.label}
      title={props.label}
      disabled={props.disabled}
      onClick={props.onClick}
      className={`${dim} flex items-center justify-center rounded-full border shadow-[0_6px_20px_rgba(0,0,0,0.18)] transition-transform hover:scale-105 active:scale-90 disabled:pointer-events-none disabled:opacity-35`}
      style={{ color: props.color, background: props.bg, borderColor: props.border }}
    >
      {props.children}
    </button>
  )
}

/**
 * Bộ thẻ vuốt chuẩn Tinder cho 12 kiểu giao diện: vuốt phải = thích,
 * vuốt trái = bỏ qua, có hoàn tác, chi tiết và danh sách đã thích.
 */
export function SwipeBrochureEngine({
  products,
  catalogName,
  selectedProductId,
  onSelectProduct,
  styleKey = "01",
}: SwipeBrochureEngineProps) {
  const embedded = useEmbeddedPreview()
  const theme = useMemo(() => getSwipeTheme(styleKey), [styleKey])
  const light = isLightTheme(theme)
  const [index, setIndex] = useState(0)
  const [history, setHistory] = useState<{ id: string; dir: SwipeDirection }[]>([])
  const [inspect, setInspect] = useState<GreetingCatalogProduct | null>(null)

  const likedIds = useMemo(() => new Set(history.filter((h) => h.dir === "like").map((h) => h.id)), [history])
  const liked = products.filter((p) => likedIds.has(p.id))
  const current = products[index]

  const handleSwiped = useCallback(
    (dir: SwipeDirection) => {
      const p = products[index]
      if (!p) return
      setHistory((h) => [...h, { id: p.id, dir }])
      setIndex((i) => i + 1)
    },
    [index, products],
  )

  const swipe = useCardSwipe({
    onSwiped: handleSwiped,
    onTap: () => current && setInspect(current),
    disabled: !current,
  })

  const rewind = useCallback(() => {
    if (history.length === 0 || swipe.isExiting) return
    setHistory((h) => h.slice(0, -1))
    setIndex((i) => Math.max(0, i - 1))
  }, [history.length, swipe.isExiting])

  // Bàn phím: ← bỏ qua, → thích, ↑/Enter chi tiết, Backspace hoàn tác
  useEffect(() => {
    if (embedded) return
    function onKey(e: KeyboardEvent) {
      if (inspect || (e.target instanceof HTMLElement && /INPUT|TEXTAREA/.test(e.target.tagName))) return
      if (e.key === "ArrowLeft") swipe.fling("nope")
      else if (e.key === "ArrowRight") swipe.fling("like")
      else if (e.key === "Backspace") rewind()
      else if ((e.key === "ArrowUp" || e.key === "Enter") && current) setInspect(current)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [swipe, rewind, current, inspect, embedded])

  // Tải trước ảnh của 2 thẻ kế tiếp
  useEffect(() => {
    for (const p of products.slice(index + 1, index + 3)) {
      if (p.imageUrl) new Image().src = p.imageUrl
    }
  }, [index, products])

  const stageStyle = { background: theme.stage, color: theme.stageText }

  if (products.length === 0) {
    return (
      <div className={`flex ${rootHeight(embedded)} w-full items-center justify-center p-6 text-center`} style={stageStyle}>
        <p className="text-body">Bộ sưu tập này chưa có mẫu hoa nào.</p>
      </div>
    )
  }

  const drag = Math.abs(swipe.progress)

  return (
    <div className={`flex ${embedded ? "h-full" : "min-h-dvh"} w-full flex-col items-center`} style={stageStyle}>
      <div className="flex w-full max-w-[440px] flex-1 flex-col px-3 pb-[max(env(safe-area-inset-bottom),12px)] pt-3">
        <header className="flex items-center justify-between px-1 pb-3">
          <h1 className="truncate text-body font-semibold" style={{ fontFamily: theme.font }}>{catalogName}</h1>
          <span className="shrink-0 text-caption tabular-nums" style={{ color: theme.stageMuted }}>
            {Math.min(index + 1, products.length)} / {products.length}
          </span>
        </header>

        {current ? (
          <>
            <div className={`relative flex-1 ${embedded ? "min-h-0" : "min-h-[420px]"}`} style={{ maxHeight: 680 }}>
              {[2, 1].map((offset) => {
                const p = products[index + offset]
                if (!p) return null
                const lift = offset === 1 ? drag : drag * 0.5
                const scale = 1 - offset * 0.045 + lift * 0.045
                return (
                  <div
                    key={p.id}
                    aria-hidden="true"
                    className="absolute inset-0 transition-transform duration-200"
                    style={{ transform: `translateY(${(offset - lift) * 12}px) scale(${scale})`, zIndex: 3 - offset }}
                  >
                    <SwipeCard product={p} theme={theme} index={index + offset} total={products.length} />
                  </div>
                )
              })}
              <div key={current.id} className="absolute inset-0 z-10 will-change-transform" style={swipe.style} {...swipe.handlers}>
                <SwipeCard
                  product={current}
                  theme={theme}
                  index={index}
                  total={products.length}
                  progress={swipe.progress}
                  onInfo={() => setInspect(current)}
                />
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 pt-4" role="group" aria-label="Điều khiển thẻ">
              <RoundButton label="Hoàn tác" color={SWIPE_SIGNAL.rewind} size="sm" bg={theme.controlBg} border={theme.controlBorder} disabled={history.length === 0} onClick={rewind}>
                <RotateCcw size={20} strokeWidth={2.5} />
              </RoundButton>
              <RoundButton label="Bỏ qua" color={SWIPE_SIGNAL.nope} size="lg" bg={theme.controlBg} border={theme.controlBorder} onClick={() => swipe.fling("nope")}>
                <X size={30} strokeWidth={3} />
              </RoundButton>
              <RoundButton label="Xem chi tiết" color={SWIPE_SIGNAL.info} size="sm" bg={theme.controlBg} border={theme.controlBorder} onClick={() => setInspect(current)}>
                <Info size={20} strokeWidth={2.5} />
              </RoundButton>
              <RoundButton label="Thích" color={SWIPE_SIGNAL.like} size="lg" bg={theme.controlBg} border={theme.controlBorder} onClick={() => swipe.fling("like")}>
                <Heart size={28} strokeWidth={2.5} fill="currentColor" />
              </RoundButton>
            </div>

            <div className="flex items-center gap-2 pt-4">
              {liked.length > 0 && (
                <span
                  className="flex h-12 shrink-0 items-center gap-1.5 rounded-2xl border px-3 text-body-sm font-semibold"
                  style={{ borderColor: light ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.2)" }}
                  aria-label={`Đã thích ${liked.length} mẫu`}
                >
                  <Heart size={16} fill={SWIPE_SIGNAL.like} color={SWIPE_SIGNAL.like} aria-hidden="true" />
                  {liked.length}
                </span>
              )}
              <button
                type="button"
                onClick={() => onSelectProduct(current)}
                className="flex h-12 min-w-0 flex-1 items-center justify-between gap-3 rounded-2xl px-5 text-body font-bold shadow-lg transition-transform active:scale-[0.98]"
                style={{ background: theme.ctaBg, color: theme.ctaText }}
              >
                <span>{selectedProductId === current.id ? "Đã chọn mẫu này" : "Đặt mẫu này"}</span>
                <span className="tabular-nums opacity-90">{formatVnd(current.price)}</span>
              </button>
            </div>
          </>
        ) : (
          <SwipeDeckEnd
            theme={theme}
            liked={liked}
            total={products.length}
            onOrder={onSelectProduct}
            onRestart={() => {
              setHistory([])
              setIndex(0)
            }}
            onRewind={rewind}
          />
        )}
      </div>

      {inspect && (
        <EnterpriseSpecSheet
          product={inspect}
          isOpen
          onClose={() => setInspect(null)}
          onSelectProduct={(p) => {
            setInspect(null)
            onSelectProduct(p)
          }}
        />
      )}
    </div>
  )
}
