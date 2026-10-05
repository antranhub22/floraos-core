"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import {
  Check, ChevronLeft, ChevronRight, Layers,
  Smartphone, Sparkles,
  Film, Heart, Leaf, Store, Sun, Camera, Home, PenTool,
  LayoutGrid, BookOpen, Play, Zap, Palette, ZoomIn,
} from "lucide-react"
import {
  GreetingTemplateId,
  GREETING_TEMPLATE_LIST,
} from "@/modules/greeting-card/domain/greeting-template-registry"
import type { GreetingCatalogProduct } from "@/modules/greeting-card/domain/greeting-card-types"
import { getTemplateStyleConfig } from "./styles/template-style-configs"
import { SwipeCardItem } from "./swipe-card-item"
import { StylePreviewThumb } from "./template-style-preview-thumb"
import { useCatalogProducts } from "./use-catalog-products"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Natural width the SwipeCardItem renders at */
const CARD_NATURAL_W = 380
/** Scale factor to fit inside our compact phone shell */
const CARD_SCALE = 0.55
/** Resulting displayed width/height of the scaled card area */
const PHONE_INNER_W = Math.round(CARD_NATURAL_W * CARD_SCALE) // ≈ 209px
/** SwipeCardItem natural height minimum */
const CARD_NATURAL_H = 560
const PHONE_INNER_H = Math.round(CARD_NATURAL_H * CARD_SCALE) // ≈ 308px
/** Total height of the split pane panel */
const PANEL_H = 520

const ACCENT: Record<string, string> = {
  "01": "#c8a87a", "02": "#777", "03": "#c8a050", "04": "#d81b60",
  "05": "#5c7a3e", "06": "#5090e8", "07": "#e8a030", "08": "#8a7060",
  "09": "#e09820", "10": "#aaa",  "11": "#7a6040", "12": "#c0b080",
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TemplateSelectorSplitPaneProps {
  selectedTemplateId: GreetingTemplateId
  onSelectTemplate: (id: GreetingTemplateId) => void
  catalogId?: string | undefined
  previewProducts?: GreetingCatalogProduct[] | undefined
}

// ---------------------------------------------------------------------------
// Icon helper
// ---------------------------------------------------------------------------

function getIcon(id: GreetingTemplateId) {
  if (id === "editorial-luxury" || id === "enterprise-luxury") return <Sparkles size={14} />
  if (id === "minimal-clean" || id === "swipe-classic") return <Smartphone size={14} />
  if (id === "cinematic-dark") return <Film size={14} />
  if (id === "romantic-pastel") return <Heart size={14} />
  if (id === "botanical-frame") return <Leaf size={14} />
  if (id === "glassmorphism") return <Layers size={14} />
  if (id === "real-life-shop" || id === "real-life-in-store") return <Store size={14} />
  if (id === "real-life-daylight") return <Sun size={14} />
  if (id === "real-life-handheld") return <Camera size={14} />
  if (id === "lifestyle-context") return <Home size={14} />
  if (id === "mixed-media") return <PenTool size={14} />
  if (id === "lookbook-grid") return <LayoutGrid size={14} />
  if (id === "editorial-story") return <BookOpen size={14} />
  if (id === "video-reels") return <Play size={14} />
  if (id === "occasion-budget-quiz") return <Zap size={14} />
  if (id === "event-moodboard") return <Palette size={14} />
  return <ZoomIn size={14} />
}

// ---------------------------------------------------------------------------
// Scaled phone shell — contains SwipeCardItem at reduced size via CSS scale
// ---------------------------------------------------------------------------
function CompactPhonePreview({
  product,
  styleConfig,
  isFav,
  onToggleFav,
  productIdx,
  totalCount,
}: {
  product: GreetingCatalogProduct
  styleConfig: ReturnType<typeof getTemplateStyleConfig>
  isFav: boolean
  onToggleFav: () => void
  productIdx: number
  totalCount: number
}) {
  // Frame chrome dimensions derived from constants
  const frameW = PHONE_INNER_W + 16   // 8px padding each side
  const frameH = PHONE_INNER_H + 54   // notch (24) + screen + indicator (14) + padding (16)

  return (
    <div
      style={{
        width: frameW,
        height: frameH,
        borderRadius: 28,
        padding: "0 8px 12px 8px",
        background: "linear-gradient(160deg, #2a2a2e 0%, #18181b 100%)",
        boxShadow:
          "0 0 0 1.5px rgba(255,255,255,0.10), 0 24px 60px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.12)",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Notch */}
      <div
        style={{
          width: 60, height: 14,
          background: "#18181b",
          borderRadius: "0 0 10px 10px",
          margin: "0 auto 4px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
        }}
      >
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#333" }} />
        <div style={{ width: 22, height: 3, borderRadius: 3, background: "#2a2a2a" }} />
      </div>

      {/* Screen — clips the scaled card */}
      <div
        style={{
          width: PHONE_INNER_W,
          height: PHONE_INNER_H,
          borderRadius: 18,
          overflow: "hidden",
          position: "relative",
          flex: 1,
        }}
      >
        {/* Scale container — keeps the card at natural width but renders small */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: CARD_NATURAL_W,
            transformOrigin: "top left",
            transform: `scale(${CARD_SCALE})`,
            pointerEvents: "none", // preview only — no interaction needed
          }}
        >
          <SwipeCardItem
            product={product}
            styleConfig={styleConfig}
            isActive={true}
            isFavorite={isFav}
            currentIndex={productIdx}
            totalCount={totalCount}
            onToggleFavorite={onToggleFav}
          />
        </div>
      </div>

      {/* Home indicator */}
      <div
        style={{ width: 50, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.18)", margin: "6px auto 0" }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Left panel list item
// ---------------------------------------------------------------------------
function TemplateListItem({
  tpl,
  isActive,
  isSelected,
  onClick,
}: {
  tpl: (typeof GREETING_TEMPLATE_LIST)[number]
  isActive: boolean
  isSelected: boolean
  onClick: () => void
}) {
  const accent = ACCENT[tpl.styleNumber ?? ""] ?? "#888"
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isActive && ref.current) {
      ref.current.scrollIntoView({ block: "nearest", behavior: "smooth" })
    }
  }, [isActive])

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={`w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all duration-150 cursor-pointer ${
        isActive
          ? "bg-primary/10 border border-primary/25"
          : "hover:bg-surface-muted border border-transparent"
      }`}
    >
      {/* Thumbnail */}
      <div
        className="shrink-0 rounded-lg overflow-hidden relative"
        style={{ width: 40, height: 52 }}
      >
        {tpl.styleNumber ? (
          <StylePreviewThumb styleNumber={tpl.styleNumber} fillParent />
        ) : (
          <div className="absolute inset-0 bg-surface-muted flex items-center justify-center text-text-muted">
            {getIcon(tpl.id)}
          </div>
        )}
        {tpl.styleNumber && (
          <div
            className="absolute bottom-0.5 right-0.5 text-white font-mono font-bold"
            style={{
              fontSize: 7, lineHeight: 1,
              background: isActive ? accent : "rgba(0,0,0,0.65)",
              padding: "1.5px 3px", borderRadius: 3,
            }}
          >
            #{tpl.styleNumber}
          </div>
        )}
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span
            className="text-body-sm font-semibold truncate"
            style={{ color: isActive ? "var(--color-primary, #6366f1)" : undefined }}
          >
            {tpl.name}
          </span>
          {isSelected && <Check size={11} className="shrink-0 text-primary" />}
        </div>
        <p className="text-caption text-text-muted truncate leading-tight mt-0.5">
          {tpl.subtitle}
        </p>
      </div>

      <ChevronRight
        size={13}
        className={`shrink-0 transition-opacity ${isActive ? "opacity-100 text-primary" : "opacity-0"}`}
      />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Right panel — 2-column layout: phone left, info+CTA right
// ---------------------------------------------------------------------------
function LivePreviewPane({
  tpl,
  products,
  isLoading,
  isRealData,
  isSelected,
  onSelect,
}: {
  tpl: (typeof GREETING_TEMPLATE_LIST)[number]
  products: GreetingCatalogProduct[]
  isLoading: boolean
  isRealData: boolean
  isSelected: boolean
  onSelect: () => void
}) {
  const [productIdx, setProductIdx] = useState(0)
  const [isFav, setIsFav] = useState(false)
  const [prevTplId, setPrevTplId] = useState(tpl.id)
  const [fadeKey, setFadeKey] = useState(0)

  useEffect(() => {
    if (tpl.id !== prevTplId) {
      setFadeKey((k) => k + 1)
      setPrevTplId(tpl.id)
      setProductIdx(0)
    }
  }, [tpl.id, prevTplId])

  const styleConfig = getTemplateStyleConfig(tpl.styleNumber || tpl.id)
  const safeIdx = productIdx < products.length ? productIdx : 0
  const product = products[safeIdx] ?? products[0]

  const prev = useCallback(() => {
    setProductIdx((i) => (i - 1 + products.length) % products.length)
  }, [products.length])

  const next = useCallback(() => {
    setProductIdx((i) => (i + 1) % products.length)
  }, [products.length])

  return (
    // 2-column: phone left | nav + CTA right — mobile-first compact
    <div className="flex items-center gap-4 w-full h-full px-3 py-4">

      {/* LEFT: phone preview */}
      <div
        key={fadeKey}
        style={{ animation: "fadeSlideIn 0.18s ease-out both", flexShrink: 0 }}
      >
        {isLoading ? (
          <div
            style={{ width: PHONE_INNER_W + 16, height: PHONE_INNER_H + 54 }}
            className="flex flex-col items-center justify-center gap-2 text-text-muted rounded-2xl bg-surface-muted"
          >
            <div
              className="rounded-full border-2 border-primary/30 border-t-primary animate-spin"
              style={{ width: 20, height: 20 }}
            />
          </div>
        ) : (
          <CompactPhonePreview
            product={product!}
            styleConfig={styleConfig}
            isFav={isFav}
            onToggleFav={() => setIsFav((v) => !v)}
            productIdx={safeIdx}
            totalCount={products.length}
          />
        )}
      </div>

      {/* RIGHT: name badge + dot navigator + CTA only */}
      <div className="flex flex-col justify-center gap-4 flex-1 min-w-0">
        {/* Name + style badge */}
        <div className="flex flex-col gap-1">
          {tpl.styleNumber && (
            <span
              className="text-caption font-mono font-bold px-2 py-0.5 rounded-md text-white self-start"
              style={{ background: ACCENT[tpl.styleNumber] ?? "#888" }}
            >
              #{tpl.styleNumber}
            </span>
          )}
          <h3 className="text-body font-bold text-foreground leading-tight">{tpl.name}</h3>
        </div>

        {/* Dot navigator */}
        {products.length > 1 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={prev}
                className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-text-muted hover:text-foreground transition-colors cursor-pointer"
                aria-label="Sản phẩm trước"
              >
                <ChevronLeft size={12} />
              </button>
              <div className="flex items-center gap-1">
                {products.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setProductIdx(i)}
                    className={`rounded-full transition-all cursor-pointer ${
                      i === safeIdx
                        ? "bg-primary w-3.5 h-1.5"
                        : "bg-border w-1.5 h-1.5 hover:bg-border-focus"
                    }`}
                    aria-label={`Sản phẩm ${i + 1}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={next}
                className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-text-muted hover:text-foreground transition-colors cursor-pointer"
                aria-label="Sản phẩm tiếp"
              >
                <ChevronRight size={12} />
              </button>
            </div>
            <p className="text-caption text-text-muted">
              {safeIdx + 1} / {products.length}
              {isRealData && <span className="text-primary font-semibold"> · Thật</span>}
            </p>
          </div>
        )}

        {/* CTA */}
        {isSelected ? (
          <div className="w-full py-2 px-3 rounded-xl text-body-sm font-bold flex items-center justify-center gap-1.5 border border-primary/30 bg-primary/10 text-primary">
            <Check size={13} />
            <span>Đang dùng</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onSelect}
            className="w-full py-2 px-3 rounded-xl text-body-sm font-bold flex items-center justify-center gap-1.5 bg-primary text-white hover:bg-primary-hover shadow-sm transition-colors cursor-pointer"
          >
            <Sparkles size={13} />
            <span>Chọn mẫu</span>
          </button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------
export function TemplateSelectorSplitPane({
  selectedTemplateId,
  onSelectTemplate,
  catalogId,
  previewProducts,
}: TemplateSelectorSplitPaneProps) {
  const [activeId, setActiveId] = useState<GreetingTemplateId>(selectedTemplateId)
  const [activeFilter, setActiveFilter] = useState<"all" | "swipe-style" | "interactive-deck">("swipe-style")

  const { products, isLoading, isRealData } = useCatalogProducts(catalogId, previewProducts)

  useEffect(() => {
    setActiveId(selectedTemplateId)
  }, [selectedTemplateId])

  const swipeStyles = GREETING_TEMPLATE_LIST.filter((t) => t.category === "swipe-style" && t.styleNumber)
  const auxDecks = GREETING_TEMPLATE_LIST.filter((t) => t.category !== "swipe-style" || !t.styleNumber)

  const displayed =
    activeFilter === "swipe-style"
      ? swipeStyles
      : activeFilter === "interactive-deck"
        ? auxDecks
        : GREETING_TEMPLATE_LIST

  const activeTpl = GREETING_TEMPLATE_LIST.find((t) => t.id === activeId) ?? GREETING_TEMPLATE_LIST[0]!

  return (
    <>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div className="space-y-3">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <label className="text-body-sm font-extrabold text-foreground flex items-center gap-1.5">
              <Layers size={15} className="text-primary" />
              <span>Chọn Template Trải Nghiệm</span>
            </label>
            <p className="text-caption text-text-muted mt-0.5">
              Nhấn vào mẫu bên trái · Preview cập nhật ngay bên phải
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-surface-muted rounded-xl self-start sm:self-auto shrink-0">
            {(
              [
                ["swipe-style", "12 Vuốt Thẻ"],
                ["interactive-deck", "Bổ Trợ"],
                ["all", "Tất cả"],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setActiveFilter(val)}
                className={`px-2.5 py-1 rounded-lg text-caption font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeFilter === val
                    ? "bg-surface text-foreground shadow-2xs"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Split Pane — fixed height, both panels scroll internally */}
        <div
          className="flex rounded-2xl border border-border overflow-hidden bg-surface"
          style={{ height: PANEL_H }}
        >
          {/* LEFT: scrollable template list — fixed 200px width */}
          <div
            className="shrink-0 overflow-y-auto border-r border-border"
            style={{ width: 200 }}
          >
            <div className="p-1.5 space-y-0.5">
              {displayed.map((tpl) => (
                <TemplateListItem
                  key={tpl.id}
                  tpl={tpl}
                  isActive={activeId === tpl.id}
                  isSelected={selectedTemplateId === tpl.id}
                  onClick={() => setActiveId(tpl.id)}
                />
              ))}
            </div>
          </div>

          {/* RIGHT: live preview — fills remaining width, fixed height */}
          <div className="flex-1 overflow-hidden bg-surface-muted/40">
            {activeTpl && (
              <LivePreviewPane
                tpl={activeTpl}
                products={products}
                isLoading={isLoading}
                isRealData={isRealData}
                isSelected={selectedTemplateId === activeTpl.id}
                onSelect={() => onSelectTemplate(activeTpl.id)}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
