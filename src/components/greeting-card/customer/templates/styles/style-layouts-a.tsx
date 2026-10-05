"use client"

import React from "react"
import type { GreetingCatalogProduct } from "@/modules/greeting-card/domain/greeting-card-types"
import { CardProductImage } from "./card-product-image"

interface StyleLayoutProps {
  product: GreetingCatalogProduct
  isActive: boolean
  isFavorite: boolean
  currentIndex: number
  totalCount: number
  shopName: string
  onTapDetail?: (() => void) | undefined
  onToggleFavorite?: (() => void) | undefined
}

function formatPrice(price: number) {
  if (price <= 0) return "Liên hệ báo giá"
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price)
}

function Counter({ current, total }: { current: number; total: number }) {
  return (
    <span style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: "0.12em", opacity: 0.65 }}>
      {String(current + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
    </span>
  )
}

/* ─────────────────────────────────────────────────
   STYLE 01 — EDITORIAL LUXURY
   Warm ivory / cream | Oversized serif overlapping product
   ───────────────────────────────────────────────── */
export function Layout01Editorial({
  product,
  isActive,
  currentIndex,
  totalCount,
  shopName,
  onTapDetail,
}: StyleLayoutProps) {
  return (
    <div
      className="relative w-full h-full flex flex-col overflow-hidden select-none"
      style={{ background: "linear-gradient(160deg, #f9f5ef 0%, #f0ece3 60%, #e8e0d0 100%)" }}
    >
      {/* Hairline top border */}
      <div style={{ position: "absolute", top: 0, left: 32, right: 32, height: 1, background: "rgba(160,140,110,0.35)" }} />

      {/* Top bar */}
      <div className="relative z-30 flex items-center justify-between px-7 pt-7 pb-2">
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, letterSpacing: "0.18em", color: "#5a4a2e", fontWeight: 500 }}>
          {shopName.toUpperCase()}
        </span>
        <Counter current={currentIndex} total={totalCount} />
      </div>

      {/* HERO: Oversized editorial typography sitting behind product */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-end pb-2">
        {/* Background oversized text — editorial signature */}
        <div
          style={{
            position: "absolute",
            top: "8%",
            left: "-8%",
            right: "-8%",
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(72px, 22vw, 112px)",
            fontWeight: 700,
            color: "rgba(90,74,46,0.06)",
            lineHeight: 0.9,
            letterSpacing: "-0.03em",
            userSelect: "none",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
          aria-hidden="true"
        >
          {product.name}
        </div>

        {/* Product image — 80% viewport height feel */}
        <div className="relative z-20 w-full flex-1 flex items-center justify-center px-4 group" style={{ minHeight: 0 }}>
          <CardProductImage
            imageUrl={product.imageUrl}
            productName={product.name}
            isActive={isActive}
            maxHeightClass="max-h-[440px]"
            dropShadow="0 32px 64px rgba(90,74,46,0.22)"
            onTapDetail={onTapDetail}
          />
        </div>
      </div>

      {/* Bottom details — minimal, hairline above */}
      <div
        className="relative z-30 px-7 pb-7 pt-5"
        style={{ borderTop: "1px solid rgba(160,140,110,0.25)" }}
      >
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(24px,6vw,38px)", fontWeight: 400, color: "#2e2318", lineHeight: 1.15, letterSpacing: "-0.01em" }}>
          {product.name}
        </p>
        {product.flowersSummary && (
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, letterSpacing: "0.14em", color: "#8c7860", marginTop: 6, textTransform: "uppercase" }}>
            {product.flowersSummary}
          </p>
        )}
        <div className="flex items-baseline justify-between mt-3">
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600, color: "#2e2318" }}>
            {formatPrice(product.price)}
          </span>
          <button
            type="button"
            onClick={onTapDetail}
            style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, letterSpacing: "0.12em", textDecoration: "underline", color: "#8c7860", textTransform: "uppercase", background: "none", border: "none", cursor: "pointer" }}
          >
            Chi tiết
          </button>
        </div>
      </div>

      {/* Hairline bottom border */}
      <div style={{ position: "absolute", bottom: 0, left: 32, right: 32, height: 1, background: "rgba(160,140,110,0.35)" }} />
    </div>
  )
}

/* ─────────────────────────────────────────────────
   STYLE 02 — MINIMAL CLEAN
   Pure white | Extreme negative space | Sans-serif
   ───────────────────────────────────────────────── */
export function Layout02Minimal({
  product,
  isActive,
  currentIndex,
  totalCount,
  shopName,
  onTapDetail,
}: StyleLayoutProps) {
  return (
    <div
      className="relative w-full h-full flex flex-col overflow-hidden select-none"
      style={{ background: "#fafafa" }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 pt-8 pb-4">
        <span style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontSize: 11, letterSpacing: "0.22em", color: "#9e9e9e", fontWeight: 600, textTransform: "uppercase" }}>
          {shopName}
        </span>
        <Counter current={currentIndex} total={totalCount} />
      </div>

      {/* Product — full bleed centered with generous whitespace */}
      <div className="relative flex-1 flex items-center justify-center px-6 group" style={{ minHeight: 0 }}>
        <CardProductImage
          imageUrl={product.imageUrl}
          productName={product.name}
          isActive={isActive}
          maxHeightClass="max-h-[460px]"
          dropShadow="0 12px 40px rgba(0,0,0,0.10)"
          onTapDetail={onTapDetail}
        />
      </div>

      {/* Bottom — ultra-minimal */}
      <div className="px-8 pb-8 pt-5">
        <div style={{ width: 32, height: 1.5, background: "#e0e0e0", marginBottom: 14 }} />
        <p style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "clamp(20px,5vw,30px)", fontWeight: 300, color: "#1a1a1a", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
          {product.name}
        </p>
        {product.flowersSummary && (
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: "#9e9e9e", marginTop: 5 }}>
            {product.flowersSummary}
          </p>
        )}
        <div className="flex items-center justify-between mt-4">
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 17, fontWeight: 500, color: "#1a1a1a" }}>
            {formatPrice(product.price)}
          </span>
          <button
            type="button"
            onClick={onTapDetail}
            style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: "#9e9e9e", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.08em" }}
          >
            XEM THÊM
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────
   STYLE 03 — CINEMATIC DARK
   Near-black | Gold accents | High-contrast spotlight
   ───────────────────────────────────────────────── */
export function Layout03Cinematic({
  product,
  isActive,
  currentIndex,
  totalCount,
  shopName,
  onTapDetail,
}: StyleLayoutProps) {
  return (
    <div
      className="relative w-full h-full flex flex-col overflow-hidden select-none"
      style={{ background: "linear-gradient(180deg, #0a0a0c 0%, #111116 50%, #0d0d10 100%)" }}
    >
      {/* Cinematic ambient spotlight */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "70%",
          height: "55%",
          background: "radial-gradient(ellipse at 50% 30%, rgba(180,130,60,0.13) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      {/* Deep vignette edges */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.75) 100%)", pointerEvents: "none" }} />

      {/* Top bar */}
      <div className="relative z-30 flex items-center justify-between px-7 pt-7 pb-3">
        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10, letterSpacing: "0.28em", color: "rgba(200,170,100,0.85)", fontWeight: 500, textTransform: "uppercase" }}>
          {shopName}
        </span>
        <Counter current={currentIndex} total={totalCount} />
      </div>

      {/* Gold hairline */}
      <div style={{ position: "absolute", top: 56, left: 28, right: 28, height: "0.5px", background: "linear-gradient(90deg, transparent, rgba(200,160,80,0.4), transparent)" }} />

      {/* Product with cinematic rim light */}
      <div className="relative z-20 flex-1 flex items-center justify-center px-4 group" style={{ minHeight: 0 }}>
        {/* Rim light left */}
        <div aria-hidden="true" style={{ position: "absolute", left: 0, top: "15%", width: 4, height: "60%", background: "linear-gradient(180deg, transparent, rgba(200,160,80,0.3), transparent)", filter: "blur(6px)" }} />
        {/* Rim light right */}
        <div aria-hidden="true" style={{ position: "absolute", right: 0, top: "15%", width: 4, height: "60%", background: "linear-gradient(180deg, transparent, rgba(200,160,80,0.2), transparent)", filter: "blur(6px)" }} />

        <CardProductImage
          imageUrl={product.imageUrl}
          productName={product.name}
          isActive={isActive}
          maxHeightClass="max-h-[450px]"
          dropShadow="0 40px 80px rgba(0,0,0,0.85), 0 0 60px rgba(180,130,60,0.12)"
          onTapDetail={onTapDetail}
        />
      </div>

      {/* Bottom — cinematic */}
      <div className="relative z-30 px-7 pb-7 pt-4">
        <div style={{ width: 24, height: "0.5px", background: "rgba(200,160,80,0.5)", marginBottom: 12 }} />
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(22px,5.5vw,34px)", fontWeight: 400, color: "#f0e8d5", lineHeight: 1.2, letterSpacing: "0.01em" }}>
          {product.name}
        </p>
        {product.flowersSummary && (
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 10, letterSpacing: "0.2em", color: "rgba(200,170,100,0.65)", marginTop: 7, textTransform: "uppercase" }}>
            {product.flowersSummary}
          </p>
        )}
        <div className="flex items-baseline justify-between mt-4">
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 17, fontWeight: 500, color: "#d4a840", letterSpacing: "0.02em" }}>
            {formatPrice(product.price)}
          </span>
          <button
            type="button"
            onClick={onTapDetail}
            style={{ fontFamily: "system-ui, sans-serif", fontSize: 10, letterSpacing: "0.2em", textDecoration: "none", color: "rgba(200,160,80,0.7)", textTransform: "uppercase", background: "none", border: "1px solid rgba(200,160,80,0.3)", padding: "4px 12px", borderRadius: 2, cursor: "pointer" }}
          >
            Chi tiết
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────
   STYLE 04 — ROMANTIC PASTEL
   Blush pink | Soft bokeh | Script font | Floating petals
   ───────────────────────────────────────────────── */
export function Layout04Romantic({
  product,
  isActive,
  currentIndex,
  totalCount,
  shopName,
  onTapDetail,
}: StyleLayoutProps) {
  return (
    <div
      className="relative w-full h-full flex flex-col overflow-hidden select-none"
      style={{ background: "linear-gradient(160deg, #fff0f3 0%, #fce4ec 40%, #f3e5f5 100%)" }}
    >
      {/* Bokeh circles */}
      {[
        { top: "6%", left: "8%", size: 80, color: "rgba(255,150,180,0.18)" },
        { top: "18%", right: "5%", size: 60, color: "rgba(220,150,255,0.14)" },
        { top: "40%", left: "5%", size: 45, color: "rgba(255,182,193,0.20)" },
        { top: "60%", right: "10%", size: 55, color: "rgba(255,150,180,0.15)" },
        { bottom: "30%", left: "20%", size: 35, color: "rgba(220,150,255,0.12)" },
      ].map((b, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "top" in b ? b.top : undefined,
            bottom: "bottom" in b ? b.bottom : undefined,
            left: "left" in b ? b.left : undefined,
            right: "right" in b ? b.right : undefined,
            width: b.size,
            height: b.size,
            borderRadius: "50%",
            background: b.color,
            filter: "blur(18px)",
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Top bar */}
      <div className="relative z-30 flex items-center justify-between px-6 pt-7 pb-3">
        <span style={{ fontFamily: "'Dancing Script', cursive, serif", fontSize: 22, color: "#c2185b", fontWeight: 600, letterSpacing: "0.02em" }}>
          {shopName}
        </span>
        <Counter current={currentIndex} total={totalCount} />
      </div>

      {/* Floating petal dots */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 5 }}>
        {[{ top: "22%", left: "14%", r: 6 }, { top: "35%", right: "12%", r: 4 }, { bottom: "38%", left: "18%", r: 5 }, { top: "55%", right: "18%", r: 7 }].map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "top" in p ? p.top : undefined,
              bottom: "bottom" in p ? p.bottom : undefined,
              left: "left" in p ? p.left : undefined,
              right: "right" in p ? p.right : undefined,
              width: p.r * 2,
              height: p.r * 2,
              borderRadius: "40% 60%",
              background: "rgba(233,30,99,0.20)",
              transform: `rotate(${i * 45}deg)`,
              filter: "blur(1px)",
            }}
          />
        ))}
      </div>

      {/* Product */}
      <div className="relative z-20 flex-1 flex items-center justify-center px-5 group" style={{ minHeight: 0 }}>
        <CardProductImage
          imageUrl={product.imageUrl}
          productName={product.name}
          isActive={isActive}
          maxHeightClass="max-h-[440px]"
          dropShadow="0 20px 50px rgba(194,24,91,0.18)"
          onTapDetail={onTapDetail}
        />
      </div>

      {/* Bottom */}
      <div className="relative z-30 px-6 pb-7 pt-4" style={{ background: "linear-gradient(to top, rgba(252,228,236,0.95) 70%, transparent)" }}>
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(20px,5vw,30px)", fontWeight: 600, color: "#880e4f", lineHeight: 1.2 }}>
          {product.name}
        </p>
        {product.flowersSummary && (
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: "#ad5478", marginTop: 4 }}>
            {product.flowersSummary}
          </p>
        )}
        <div className="flex items-baseline justify-between mt-3">
          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 700, color: "#c2185b" }}>
            {formatPrice(product.price)}
          </span>
          <button
            type="button"
            onClick={onTapDetail}
            style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: "#ad5478", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}
          >
            Chi tiết
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────
   STYLE 06 — GLASSMORPHISM
   Dark environment | Frosted glass panel on top
   ───────────────────────────────────────────────── */
export function Layout06Glass({
  product,
  isActive,
  currentIndex,
  totalCount,
  shopName,
  onTapDetail,
}: StyleLayoutProps) {
  return (
    <div
      className="relative w-full h-full flex flex-col overflow-hidden select-none"
      style={{ background: "linear-gradient(145deg, #0d1b2a 0%, #1a2744 50%, #0a0f1e 100%)" }}
    >
      {/* Atmospheric gradient orbs */}
      <div aria-hidden="true" style={{ position: "absolute", top: "-10%", left: "20%", width: "60%", height: "50%", background: "radial-gradient(ellipse, rgba(100,160,255,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div aria-hidden="true" style={{ position: "absolute", bottom: "10%", right: "10%", width: "40%", height: "40%", background: "radial-gradient(ellipse, rgba(160,120,255,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Top bar */}
      <div className="relative z-30 flex items-center justify-between px-7 pt-7 pb-3">
        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, letterSpacing: "0.2em", color: "rgba(255,255,255,0.9)", fontWeight: 700, textTransform: "uppercase" }}>
          {shopName}
        </span>
        <Counter current={currentIndex} total={totalCount} />
      </div>

      {/* Product — large, behind glass */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 group" style={{ minHeight: 0 }}>
        <CardProductImage
          imageUrl={product.imageUrl}
          productName={product.name}
          isActive={isActive}
          maxHeightClass="max-h-[420px]"
          dropShadow="0 40px 80px rgba(0,0,0,0.6), 0 0 40px rgba(100,160,255,0.10)"
          onTapDetail={onTapDetail}
        />
      </div>

      {/* Frosted Glass Info Panel */}
      <div className="relative z-30 mx-5 mb-6">
        <div
          style={{
            background: "rgba(255,255,255,0.10)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 24,
            padding: "20px 22px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
          }}
        >
          {/* Glass inner highlight */}
          <div style={{ position: "absolute", top: 1, left: 20, right: 20, height: "0.5px", background: "rgba(255,255,255,0.35)", borderRadius: "100%" }} />
          
          <p style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "clamp(18px,4.5vw,26px)", fontWeight: 700, color: "#ffffff", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
            {product.name}
          </p>
          {product.flowersSummary && (
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 5 }}>
              {product.flowersSummary}
            </p>
          )}
          <div className="flex items-center justify-between mt-4">
            <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 18, fontWeight: 700, color: "#ffd54f" }}>
              {formatPrice(product.price)}
            </span>
            <button
              type="button"
              onClick={onTapDetail}
              style={{
                fontFamily: "system-ui, sans-serif",
                fontSize: 12,
                color: "rgba(255,255,255,0.9)",
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 20,
                padding: "5px 16px",
                backdropFilter: "blur(8px)",
                cursor: "pointer",
              }}
            >
              Chi tiết →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
