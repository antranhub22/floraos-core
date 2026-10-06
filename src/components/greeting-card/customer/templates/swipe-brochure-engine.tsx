"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ChevronLeft, Heart, Info, RotateCcw, X } from "lucide-react"
import type { GreetingCatalogProduct } from "@/modules/greeting-card/domain/greeting-card-types"
import { EnterpriseSpecSheet } from "./enterprise-spec-sheet"
import { SwipeCard, formatVnd } from "./swipe/swipe-card"
import { SwipeDeckEnd } from "./swipe/swipe-deck-end"
import { SWIPE_SIGNAL, getSwipeTheme, isLightTheme } from "./swipe/swipe-themes"
import { useCardSwipe, type SwipeDirection } from "./swipe/use-card-swipe"
import { rootHeight, useEmbeddedPreview } from "./aux/embedded"
import { useSwipeJourney } from "./swipe/use-swipe-journey"
import { useSavedState } from "../use-saved-state"
import { JourneyIntro } from "./swipe/journey-intro"
import { UnavailablePanel } from "./swipe/unavailable-panel"
import { useCustomerJourney } from "../journey-context"
import { customDesignMessage, findPriceRange, inPriceRange, priceRangesOf, productInquiryMessage } from "@/modules/greeting-card/domain/collection-browse"

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
 * Bộ thẻ vuốt chuẩn Tinder cho 12 kiểu giao diện: vuốt phải = thích, vuốt trái = bỏ qua,
 * quay lại mẫu trước (giữ lựa chọn), hoàn tác, chi tiết, danh sách đã thích; hướng dẫn lần
 * đầu và hỏi tiếp tục khi mở lại link.
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
  const contact = useCustomerJourney()
  // Lọc theo khoảng giá (khách chưa ưng mẫu nào ở màn cuối)
  const [priceKey, setPriceKey] = useSavedState<string | null>(embedded ? "preview-price-filter" : "price-filter", null)
  const range = findPriceRange(priceKey)
  const visible = useMemo(() => (range ? products.filter((p) => inPriceRange(p.price, range)) : products), [products, range])
  // Thích / Bỏ qua / mẫu đang xem nhớ trên máy khách: tải lại, Back hay mở lại link vẫn giữ nguyên
  const j = useSwipeJourney(visible, catalogName, embedded)
  const { index, current, liked } = j
  const [inspect, setInspect] = useState<GreetingCatalogProduct | null>(null)
  const [savedToast, setSavedToast] = useState(0)

  useEffect(() => {
    if (!savedToast) return
    const t = window.setTimeout(() => setSavedToast(0), 1400)
    return () => window.clearTimeout(t)
  }, [savedToast])

  const { decide: journeyDecide } = j
  const handleSwiped = useCallback(
    (dir: SwipeDirection) => {
      journeyDecide(dir === "like" ? "like" : "skip")
      if (dir === "like") setSavedToast(Date.now())
    },
    [journeyDecide],
  )

  const swipe = useCardSwipe({
    onSwiped: handleSwiped,
    onTap: () => current && setInspect(current),
    disabled: !current || j.prompt !== null,
  })

  const rewind = useCallback(() => {
    if (swipe.isExiting) return
    j.undo()
  }, [j, swipe.isExiting])

  const askAbout = contact
    ? (p: GreetingCatalogProduct) => contact.contactZalo(productInquiryMessage(p), p.id)
    : undefined

  // Bàn phím: ← bỏ qua, → thích, ↑/Enter chi tiết, Backspace hoàn tác
  useEffect(() => {
    if (embedded) return
    function onKey(e: KeyboardEvent) {
      if (inspect || j.prompt || (e.target instanceof HTMLElement && /INPUT|TEXTAREA/.test(e.target.tagName))) return
      if (e.key === "ArrowLeft") swipe.fling("nope")
      else if (e.key === "ArrowRight") swipe.fling("like")
      else if (e.key === "Backspace") rewind()
      else if (e.key === "ArrowDown") j.previous()
      else if ((e.key === "ArrowUp" || e.key === "Enter") && current) setInspect(current)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [swipe, rewind, current, inspect, embedded, j])

  // Tải trước ảnh của 2 thẻ kế tiếp
  useEffect(() => {
    for (const p of visible.slice(index + 1, index + 3)) {
      if (p.imageUrl) new Image().src = p.imageUrl
    }
  }, [index, visible])

  const stageStyle = { background: theme.stage, color: theme.stageText }

  if (products.length === 0) {
    return (
      <div className={`flex ${rootHeight(embedded)} w-full items-center justify-center p-6 text-center`} style={stageStyle}>
        <p className="text-body">Bộ sưu tập này chưa có mẫu hoa nào.</p>
      </div>
    )
  }

  const drag = Math.abs(swipe.progress)
  const soldOut = current?.available === false

  return (
    <div className={`flex ${embedded ? "h-full" : "min-h-dvh"} w-full flex-col items-center`} style={stageStyle}>
      <div className="flex w-full max-w-[440px] flex-1 flex-col px-3 pb-[max(env(safe-area-inset-bottom),12px)] pt-3">
        <header className="flex items-center justify-between px-1 pb-3">
          <h1 className="truncate text-body font-semibold" style={{ fontFamily: theme.font }}>{catalogName}</h1>
          <span className="shrink-0 text-caption tabular-nums" style={{ color: theme.stageMuted }}>
            {Math.min(index + 1, visible.length)} / {visible.length}
          </span>
        </header>
        {range && (
          <p className="flex items-center justify-between px-1 pb-2 text-caption" style={{ color: theme.stageMuted }}>
            <span>Đang xem mẫu {range.label.toLowerCase()}</span>
            <button type="button" className="font-semibold underline" onClick={() => setPriceKey(null)}>
              Xem tất cả
            </button>
          </p>
        )}

        {j.prompt && j.state ? (
          <JourneyIntro
            theme={theme}
            mode={j.prompt}
            catalogName={catalogName}
            total={visible.length}
            progress={{ viewed: j.state.viewedProductIds.length, liked: liked.length }}
            onStart={j.start}
            onStartOver={j.startOver}
          />
        ) : current ? (
          <>
            <div className={`relative flex-1 ${embedded ? "min-h-0" : "min-h-[420px]"}`} style={{ maxHeight: 680 }}>
              {[2, 1].map((offset) => {
                const p = visible[index + offset]
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
                    <SwipeCard product={p} theme={theme} index={index + offset} total={visible.length} />
                  </div>
                )
              })}
              <div key={current.id} className="absolute inset-0 z-10 will-change-transform" style={swipe.style} {...swipe.handlers}>
                <SwipeCard
                  product={current}
                  theme={theme}
                  index={index}
                  total={visible.length}
                  progress={swipe.progress}
                  onInfo={() => setInspect(current)}
                />
              </div>
              {savedToast > 0 && (
                <p role="status" className="pointer-events-none absolute inset-x-0 top-1/2 z-20 mx-auto w-fit rounded-full px-4 py-2 text-body-sm font-bold shadow-lg" style={{ background: theme.ctaBg, color: theme.ctaText }}>
                  ♥ Đã lưu mẫu
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-4" role="group" aria-label="Điều khiển thẻ">
              <RoundButton label="Mẫu trước" color={theme.stageText} size="sm" bg={theme.controlBg} border={theme.controlBorder} disabled={!j.canGoBack} onClick={j.previous}>
                <ChevronLeft size={22} strokeWidth={2.5} />
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
              <RoundButton label="Hoàn tác" color={SWIPE_SIGNAL.rewind} size="sm" bg={theme.controlBg} border={theme.controlBorder} disabled={!j.canGoBack} onClick={rewind}>
                <RotateCcw size={20} strokeWidth={2.5} />
              </RoundButton>
            </div>

            {soldOut ? (
              <div className="pt-4">
                <UnavailablePanel theme={theme} product={current} products={visible} onJump={j.jumpTo} onContact={askAbout && (() => askAbout(current))} />
              </div>
            ) : (
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
            )}
          </>
        ) : (
          <SwipeDeckEnd
            theme={theme}
            liked={liked}
            total={visible.length}
            onOrder={onSelectProduct}
            onRestart={j.restart}
            onRewind={j.previous}
            priceRanges={priceRangesOf(products)}
            onPickPriceRange={(key) => {
              setPriceKey(key)
              j.restart()
            }}
            onAskZalo={contact?.shop.zaloUrl ? () => contact.contactZalo(`Tôi đang xem bộ sưu tập "${catalogName}" và cần shop tư vấn thêm.`) : undefined}
            onCustomDesign={contact?.shop.zaloUrl ? () => contact.contactZalo(customDesignMessage(catalogName)) : undefined}
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
