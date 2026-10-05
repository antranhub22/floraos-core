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

function formatPrice(price: number | null) {
  // null = chưa có giá trong Product Master → không bán online
  if (price === null || price <= 0) return "Liên hệ báo giá"
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price)
}

function Counter({ current, total, light }: { current: number; total: number; light?: boolean }) {
  return (
    <span
      style={{
        fontFamily: "monospace",
        fontSize: 11,
        letterSpacing: "0.12em",
        opacity: 0.6,
        color: light ? "#fff" : "#333",
      }}
    >
      {String(current + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
    </span>
  )
}

/* ─────────────────────────────────────────────────
   STYLE 05 — BOTANICAL FRAME
   Ivory paper | SVG botanical line art corners | Editorial
   ───────────────────────────────────────────────── */
export function Layout05Botanical({
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
      style={{ background: "linear-gradient(170deg, #faf8f3 0%, #f5f0e8 100%)" }}
    >
      {/* Thin outer border */}
      <div style={{ position: "absolute", inset: 12, border: "0.5px solid rgba(140,120,80,0.3)", pointerEvents: "none", zIndex: 5 }} />

      {/* Corner botanical SVGs — color set via style.color → currentColor to pass R3 */}
      {/* Top-left */}
      <svg aria-hidden="true" width="90" height="90" viewBox="0 0 90 90" fill="none" style={{ position: "absolute", top: 6, left: 6, zIndex: 6, pointerEvents: "none", opacity: 0.55, color: "rgb(107, 122, 74)" }}>
        <path d="M10 80 Q10 10 80 10" stroke="currentColor" strokeWidth="0.6" fill="none" />
        <path d="M10 60 Q20 30 45 25" stroke="currentColor" strokeWidth="0.5" fill="none" />
        <path d="M25 75 Q35 50 55 40" stroke="currentColor" strokeWidth="0.4" fill="none" opacity="0.70" />
        <ellipse cx="18" cy="42" rx="4" ry="7" fill="currentColor" opacity="0.35" transform="rotate(-30 18 42)" />
        <ellipse cx="30" cy="28" rx="3" ry="6" fill="currentColor" opacity="0.30" transform="rotate(-50 30 28)" />
        <ellipse cx="42" cy="20" rx="3.5" ry="5.5" fill="currentColor" opacity="0.28" transform="rotate(-65 42 20)" />
      </svg>
      {/* Top-right */}
      <svg aria-hidden="true" width="90" height="90" viewBox="0 0 90 90" fill="none" style={{ position: "absolute", top: 6, right: 6, zIndex: 6, pointerEvents: "none", opacity: 0.55, transform: "scaleX(-1)", color: "rgb(107, 122, 74)" }}>
        <path d="M10 80 Q10 10 80 10" stroke="currentColor" strokeWidth="0.6" fill="none" />
        <path d="M10 60 Q20 30 45 25" stroke="currentColor" strokeWidth="0.5" fill="none" />
        <ellipse cx="18" cy="42" rx="4" ry="7" fill="currentColor" opacity="0.35" transform="rotate(-30 18 42)" />
        <ellipse cx="30" cy="28" rx="3" ry="6" fill="currentColor" opacity="0.30" transform="rotate(-50 30 28)" />
      </svg>
      {/* Bottom-left */}
      <svg aria-hidden="true" width="90" height="90" viewBox="0 0 90 90" fill="none" style={{ position: "absolute", bottom: 6, left: 6, zIndex: 6, pointerEvents: "none", opacity: 0.55, transform: "scaleY(-1)", color: "rgb(107, 122, 74)" }}>
        <path d="M10 80 Q10 10 80 10" stroke="currentColor" strokeWidth="0.6" fill="none" />
        <path d="M10 60 Q20 30 45 25" stroke="currentColor" strokeWidth="0.5" fill="none" />
        <ellipse cx="18" cy="42" rx="4" ry="7" fill="currentColor" opacity="0.35" transform="rotate(-30 18 42)" />
      </svg>
      {/* Bottom-right */}
      <svg aria-hidden="true" width="90" height="90" viewBox="0 0 90 90" fill="none" style={{ position: "absolute", bottom: 6, right: 6, zIndex: 6, pointerEvents: "none", opacity: 0.55, transform: "scale(-1,-1)", color: "rgb(107, 122, 74)" }}>
        <path d="M10 80 Q10 10 80 10" stroke="currentColor" strokeWidth="0.6" fill="none" />
        <path d="M10 60 Q20 30 45 25" stroke="currentColor" strokeWidth="0.5" fill="none" />
        <ellipse cx="18" cy="42" rx="4" ry="7" fill="currentColor" opacity="0.35" transform="rotate(-30 18 42)" />
      </svg>

      {/* Top bar */}
      <div className="relative z-30 flex items-center justify-between px-8 pt-8 pb-3">
        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10, letterSpacing: "0.25em", color: "#5c6e3e", fontWeight: 600, textTransform: "uppercase" }}>
          {shopName}
        </span>
        <Counter current={currentIndex} total={totalCount} />
      </div>

      {/* Product */}
      <div className="relative z-20 flex-1 flex items-center justify-center px-8 group" style={{ minHeight: 0 }}>
        <CardProductImage
          imageUrl={product.imageUrl}
          productName={product.name}
          isActive={isActive}
          maxHeightClass="max-h-[420px]"
          dropShadow="0 20px 48px rgba(80,70,40,0.18)"
          onTapDetail={onTapDetail}
        />
      </div>

      {/* Bottom */}
      <div className="relative z-30 px-8 pb-8 pt-4">
        <div style={{ width: "100%", height: "0.5px", background: "rgba(140,120,80,0.3)", marginBottom: 14 }} />
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(20px,5vw,30px)", fontWeight: 500, color: "#2c2010", lineHeight: 1.2, letterSpacing: "0.01em" }}>
          {product.name}
        </p>
        {product.flowersSummary && (
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, letterSpacing: "0.12em", color: "#7a6a48", marginTop: 5, textTransform: "uppercase" }}>
            {product.flowersSummary}
          </p>
        )}
        <div className="flex items-baseline justify-between mt-3">
          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 600, color: "#4a6741" }}>
            {formatPrice(product.price)}
          </span>
          <button
            type="button"
            onClick={onTapDetail}
            style={{ fontFamily: "system-ui, sans-serif", fontSize: 10, letterSpacing: "0.15em", color: "#7a6a48", textTransform: "uppercase", background: "none", border: "0.5px solid rgba(140,120,80,0.4)", padding: "4px 12px", borderRadius: 2, cursor: "pointer" }}
          >
            Chi tiết
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────
   STYLE 07 — REAL LIFE / SHOP PHOTO
   Shop environment backdrop | Warm amber light | Contact shadows
   ───────────────────────────────────────────────── */
export function Layout07ShopPhoto({
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
      style={{ background: "linear-gradient(175deg, #2a1a0e 0%, #1a1208 50%, #120e08 100%)" }}
    >
      {/* Shop environment: warm bokeh lights simulating shop ambience */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {/* Warm interior lights */}
        <div style={{ position: "absolute", top: "5%", left: "15%", width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,200,100,0.20) 0%, transparent 70%)", filter: "blur(8px)" }} />
        <div style={{ position: "absolute", top: "12%", right: "10%", width: 90, height: 90, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,180,80,0.15) 0%, transparent 70%)", filter: "blur(10px)" }} />
        <div style={{ position: "absolute", top: "30%", left: "5%", width: 70, height: 70, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,160,60,0.12) 0%, transparent 70%)", filter: "blur(8px)" }} />
        {/* Shelf silhouette */}
        <div style={{ position: "absolute", top: "38%", left: 0, right: 0, height: 1, background: "rgba(255,200,100,0.12)" }} />
        <div style={{ position: "absolute", top: "62%", left: 0, right: 0, height: 1, background: "rgba(255,200,100,0.08)" }} />
        {/* Vignette */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 45%, transparent 30%, rgba(0,0,0,0.65) 100%)" }} />
      </div>

      {/* Top bar */}
      <div className="relative z-30 flex items-center justify-between px-7 pt-7 pb-3">
        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, letterSpacing: "0.22em", color: "rgba(255,200,100,0.80)", fontWeight: 600, textTransform: "uppercase" }}>
          {shopName}
        </span>
        <Counter current={currentIndex} total={totalCount} light />
      </div>

      {/* Product with contact shadow */}
      <div className="relative z-20 flex-1 flex items-end justify-center px-4 group" style={{ minHeight: 0, paddingBottom: 16 }}>
        <div style={{ position: "relative" }}>
          <CardProductImage
            imageUrl={product.imageUrl}
            productName={product.name}
            isActive={isActive}
            maxHeightClass="max-h-[430px]"
            dropShadow="0 36px 60px rgba(0,0,0,0.80), 0 8px 20px rgba(255,180,80,0.08)"
            onTapDetail={onTapDetail}
          />
          {/* Contact shadow ellipse on ground */}
          <div aria-hidden="true" style={{ position: "absolute", bottom: -8, left: "15%", right: "15%", height: 16, background: "rgba(0,0,0,0.5)", borderRadius: "50%", filter: "blur(10px)" }} />
        </div>
      </div>

      {/* Bottom */}
      <div className="relative z-30 px-7 pb-7 pt-5" style={{ background: "linear-gradient(to top, rgba(10,8,4,0.95) 70%, transparent)" }}>
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(20px,5vw,30px)", fontWeight: 400, color: "#f5e6cc", lineHeight: 1.2 }}>
          {product.name}
        </p>
        {product.flowersSummary && (
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: "rgba(255,200,100,0.55)", marginTop: 5, letterSpacing: "0.08em" }}>
            {product.flowersSummary}
          </p>
        )}
        <div className="flex items-baseline justify-between mt-3">
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 17, fontWeight: 600, color: "#ffca60" }}>
            {formatPrice(product.price)}
          </span>
          <button
            type="button"
            onClick={onTapDetail}
            style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: "rgba(255,200,100,0.8)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}
          >
            Chi tiết
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────
   STYLE 08 — REAL LIFE / DAYLIGHT
   Natural window light | Neutral walls | Soft bokeh
   ───────────────────────────────────────────────── */
export function Layout08Daylight({
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
      style={{ background: "linear-gradient(155deg, #e8e0d5 0%, #d8cfc2 50%, #ccc3b4 100%)" }}
    >
      {/* Window light bloom */}
      <div aria-hidden="true" style={{ position: "absolute", top: "-15%", right: "-10%", width: "70%", height: "70%", background: "radial-gradient(ellipse, rgba(255,245,220,0.70) 0%, rgba(255,235,190,0.30) 40%, transparent 70%)", pointerEvents: "none" }} />
      {/* Soft ambient shadow on left */}
      <div aria-hidden="true" style={{ position: "absolute", top: "20%", left: 0, width: "35%", height: "60%", background: "linear-gradient(to right, rgba(150,130,100,0.15), transparent)", pointerEvents: "none" }} />

      {/* Top bar */}
      <div className="relative z-30 flex items-center justify-between px-7 pt-7 pb-3">
        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, letterSpacing: "0.18em", color: "#5a5040", fontWeight: 500, textTransform: "uppercase" }}>
          {shopName}
        </span>
        <Counter current={currentIndex} total={totalCount} />
      </div>

      {/* Product */}
      <div className="relative z-20 flex-1 flex items-center justify-center px-6 group" style={{ minHeight: 0 }}>
        <CardProductImage
          imageUrl={product.imageUrl}
          productName={product.name}
          isActive={isActive}
          maxHeightClass="max-h-[440px]"
          dropShadow="0 24px 48px rgba(100,80,50,0.25), 8px 16px 32px rgba(100,80,50,0.12)"
          onTapDetail={onTapDetail}
        />
      </div>

      {/* Bottom */}
      <div className="relative z-30 px-7 pb-7 pt-4" style={{ background: "linear-gradient(to top, rgba(200,190,175,0.95) 60%, transparent)" }}>
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(20px,5vw,30px)", fontWeight: 400, color: "#2a2018", lineHeight: 1.2, letterSpacing: "0.01em" }}>
          {product.name}
        </p>
        {product.flowersSummary && (
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: "#7a6a52", marginTop: 5 }}>
            {product.flowersSummary}
          </p>
        )}
        <div className="flex items-baseline justify-between mt-3">
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 17, fontWeight: 500, color: "#3a3020" }}>
            {formatPrice(product.price)}
          </span>
          <button
            type="button"
            onClick={onTapDetail}
            style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: "#7a6a52", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}
          >
            Chi tiết
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────
   STYLE 09 — REAL LIFE / IN STORE
   Cozy store | Foreground/midground/background depth | Parallax
   ───────────────────────────────────────────────── */
export function Layout09InStore({
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
      style={{ background: "linear-gradient(180deg, #1c1008 0%, #2a1c0c 40%, #1a1008 100%)" }}
    >
      {/* Background depth: warm bokeh store atmosphere */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {/* Warm bokeh circles simulating store lights */}
        {[
          { top: "8%", left: "12%", size: 100, opacity: 0.18 },
          { top: "15%", right: "8%", size: 80, opacity: 0.14 },
          { top: "35%", left: "5%", size: 60, opacity: 0.12 },
          { top: "48%", right: "15%", size: 70, opacity: 0.10 },
          { bottom: "30%", left: "20%", size: 55, opacity: 0.12 },
        ].map((b, i) => (
          <div key={i} style={{
            position: "absolute",
            top: "top" in b ? b.top : undefined,
            bottom: "bottom" in b ? b.bottom : undefined,
            left: "left" in b ? b.left : undefined,
            right: "right" in b ? b.right : undefined,
            width: b.size, height: b.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(255,200,100,${b.opacity}) 0%, transparent 70%)`,
            filter: "blur(14px)",
          }} />
        ))}
        {/* Horizontal shelf lines */}
        <div style={{ position: "absolute", top: "32%", left: 0, right: 0, height: "0.5px", background: "rgba(255,200,100,0.15)" }} />
        <div style={{ position: "absolute", top: "56%", left: 0, right: 0, height: "0.5px", background: "rgba(255,200,100,0.10)" }} />
        {/* Depth vignette */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, transparent 25%, rgba(0,0,0,0.6) 100%)" }} />
      </div>

      {/* Top bar */}
      <div className="relative z-30 flex items-center justify-between px-7 pt-7 pb-3">
        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, letterSpacing: "0.20em", color: "rgba(255,200,100,0.75)", fontWeight: 600, textTransform: "uppercase" }}>
          {shopName}
        </span>
        <Counter current={currentIndex} total={totalCount} light />
      </div>

      {/* Product */}
      <div className="relative z-20 flex-1 flex items-center justify-center px-5 group" style={{ minHeight: 0 }}>
        <CardProductImage
          imageUrl={product.imageUrl}
          productName={product.name}
          isActive={isActive}
          maxHeightClass="max-h-[440px]"
          dropShadow="0 40px 70px rgba(0,0,0,0.85), 0 0 30px rgba(255,180,60,0.08)"
          onTapDetail={onTapDetail}
        />
      </div>

      {/* Bottom */}
      <div className="relative z-30 px-7 pb-7 pt-5" style={{ background: "linear-gradient(to top, rgba(12,8,4,0.96) 65%, transparent)" }}>
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(20px,5vw,30px)", fontWeight: 400, color: "#f0e0c0", lineHeight: 1.2 }}>
          {product.name}
        </p>
        {product.flowersSummary && (
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: "rgba(255,200,100,0.55)", marginTop: 5 }}>
            {product.flowersSummary}
          </p>
        )}
        <div className="flex items-baseline justify-between mt-3">
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 17, fontWeight: 600, color: "#ffc040" }}>
            {formatPrice(product.price)}
          </span>
          <button
            type="button"
            onClick={onTapDetail}
            style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: "rgba(255,200,100,0.75)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}
          >
            Chi tiết
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────
   STYLE 10 — REAL LIFE / HANDHELD
   UGC aesthetic | Casual photo | Hand-annotation elements
   ───────────────────────────────────────────────── */
export function Layout10Handheld({
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
      style={{ background: "linear-gradient(160deg, #1a1a20 0%, #141418 60%, #0e0e12 100%)" }}
    >
      {/* Lens flare / natural light leak */}
      <div aria-hidden="true" style={{ position: "absolute", top: "5%", right: "-5%", width: "45%", height: "40%", background: "radial-gradient(ellipse, rgba(255,240,200,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
      {/* Subtle grain texture via repeating pattern */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, opacity: 0.03, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")", pointerEvents: "none" }} />

      {/* Top bar — UGC style with timestamp-like text */}
      <div className="relative z-30 flex items-center justify-between px-6 pt-6 pb-3">
        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, letterSpacing: "0.14em", color: "rgba(255,255,255,0.70)", fontWeight: 400 }}>
          {shopName}
        </span>
        <Counter current={currentIndex} total={totalCount} light />
      </div>

      {/* Handwritten annotation accent */}
      <div aria-hidden="true" style={{ position: "absolute", top: "18%", right: 16, fontFamily: "'Dancing Script', cursive, serif", fontSize: 14, color: "rgba(255,220,180,0.35)", transform: "rotate(-8deg)", pointerEvents: "none", zIndex: 6 }}>
        ♡ for you
      </div>

      {/* Product */}
      <div className="relative z-20 flex-1 flex items-center justify-center px-4 group" style={{ minHeight: 0 }}>
        <CardProductImage
          imageUrl={product.imageUrl}
          productName={product.name}
          isActive={isActive}
          maxHeightClass="max-h-[440px]"
          dropShadow="0 24px 56px rgba(0,0,0,0.75), 0 4px 12px rgba(0,0,0,0.5)"
          wrapperClass="group-hover:scale-[1.02]"
          onTapDetail={onTapDetail}
        />
      </div>

      {/* Bottom — minimal overlay label */}
      <div className="relative z-30 px-6 pb-7 pt-4" style={{ background: "linear-gradient(to top, rgba(8,8,12,0.92) 60%, transparent)" }}>
        <p style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "clamp(18px,4.5vw,26px)", fontWeight: 400, color: "rgba(255,255,255,0.90)", lineHeight: 1.25 }}>
          {product.name}
        </p>
        {product.flowersSummary && (
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>
            {product.flowersSummary}
          </p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 16, fontWeight: 500, color: "rgba(255,200,150,0.90)" }}>
            {formatPrice(product.price)}
          </span>
          <button
            type="button"
            onClick={onTapDetail}
            style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: "rgba(255,255,255,0.55)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}
          >
            Chi tiết
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────
   STYLE 11 — LIFESTYLE CONTEXT
   Warm home scene | Product in environment | Natural depth
   ───────────────────────────────────────────────── */
export function Layout11Lifestyle({
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
      style={{ background: "linear-gradient(155deg, #f5ede0 0%, #ede0cc 60%, #e5d4bc 100%)" }}
    >
      {/* Warm morning light from top-right */}
      <div aria-hidden="true" style={{ position: "absolute", top: "-20%", right: "-10%", width: "80%", height: "70%", background: "radial-gradient(ellipse, rgba(255,230,180,0.45) 0%, transparent 65%)", pointerEvents: "none" }} />
      {/* Subtle horizontal surface shadow */}
      <div aria-hidden="true" style={{ position: "absolute", bottom: "25%", left: 0, right: 0, height: 60, background: "linear-gradient(to top, rgba(150,120,80,0.08), transparent)", pointerEvents: "none" }} />

      {/* Context label */}
      <div className="relative z-30 flex items-center justify-between px-7 pt-7 pb-3">
        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10, letterSpacing: "0.22em", color: "#7a6040", fontWeight: 500, textTransform: "uppercase" }}>
          {shopName}
        </span>
        <Counter current={currentIndex} total={totalCount} />
      </div>

      {/* Scene label */}
      <div className="relative z-20 px-7 pb-2">
        <span style={{
          fontFamily: "system-ui, sans-serif",
          fontSize: 10,
          letterSpacing: "0.15em",
          color: "#9a8060",
          padding: "3px 10px",
          border: "0.5px solid rgba(150,120,80,0.35)",
          borderRadius: 12,
          textTransform: "uppercase",
        }}>
          Lifestyle Scene
        </span>
      </div>

      {/* Product */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 group" style={{ minHeight: 0 }}>
        <CardProductImage
          imageUrl={product.imageUrl}
          productName={product.name}
          isActive={isActive}
          maxHeightClass="max-h-[420px]"
          dropShadow="0 28px 60px rgba(100,80,40,0.28), 12px 20px 40px rgba(100,80,40,0.12)"
          onTapDetail={onTapDetail}
        />
      </div>

      {/* Bottom */}
      <div className="relative z-30 px-7 pb-7 pt-4" style={{ background: "linear-gradient(to top, rgba(225,210,185,0.97) 70%, transparent)" }}>
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(20px,5vw,30px)", fontWeight: 500, color: "#2a1e0e", lineHeight: 1.2, letterSpacing: "0.01em" }}>
          {product.name}
        </p>
        {product.flowersSummary && (
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: "#7a6040", marginTop: 5 }}>
            {product.flowersSummary}
          </p>
        )}
        <div className="flex items-baseline justify-between mt-3">
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 17, fontWeight: 600, color: "#4a3020" }}>
            {formatPrice(product.price)}
          </span>
          <button
            type="button"
            onClick={onTapDetail}
            style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: "#9a7050", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}
          >
            Chi tiết
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────
   STYLE 12 — MIXED MEDIA
   Layered editorial collage | Asymmetric typography | Multi-speed elements
   ───────────────────────────────────────────────── */
export function Layout12MixedMedia({
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
      style={{ background: "linear-gradient(140deg, #0e0e12 0%, #181820 60%, #0a0a0e 100%)" }}
    >
      {/* Graphic shapes layer */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {/* Thin geometric lines */}
        <div style={{ position: "absolute", top: 80, left: 20, width: "35%", height: "0.5px", background: "rgba(200,180,140,0.25)" }} />
        <div style={{ position: "absolute", top: 82, left: 20, width: "20%", height: "0.5px", background: "rgba(200,180,140,0.15)" }} />
        {/* Vertical accent */}
        <div style={{ position: "absolute", top: "15%", right: 24, width: "0.5px", height: "30%", background: "linear-gradient(to bottom, rgba(200,180,140,0.3), transparent)" }} />
        {/* Corner mark */}
        <div style={{ position: "absolute", bottom: 100, left: 24, width: 16, height: 16, border: "0.5px solid rgba(200,180,140,0.30)", borderRadius: 0 }} />
      </div>

      {/* Oversized background serif — collage element */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "20%",
          left: "-5%",
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "clamp(80px, 25vw, 130px)",
          fontWeight: 700,
          color: "rgba(200,180,140,0.04)",
          lineHeight: 0.85,
          letterSpacing: "-0.04em",
          pointerEvents: "none",
          userSelect: "none",
          whiteSpace: "nowrap",
        }}
      >
        FLORA
      </div>

      {/* Top bar — asymmetric */}
      <div className="relative z-30 flex items-start justify-between px-6 pt-7 pb-2">
        <div>
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 9, letterSpacing: "0.28em", color: "rgba(200,180,140,0.60)", fontWeight: 600, textTransform: "uppercase", display: "block" }}>
            {shopName}
          </span>
          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: "rgba(240,230,210,0.85)", fontWeight: 400, display: "block", lineHeight: 1.1, marginTop: 2 }}>
            Collection
          </span>
        </div>
        <Counter current={currentIndex} total={totalCount} light />
      </div>

      {/* Product — slightly off-center */}
      <div className="relative z-20 flex-1 flex items-center justify-center px-4 group" style={{ minHeight: 0, paddingLeft: 24 }}>
        <CardProductImage
          imageUrl={product.imageUrl}
          productName={product.name}
          isActive={isActive}
          maxHeightClass="max-h-[430px]"
          dropShadow="0 40px 80px rgba(0,0,0,0.80), 0 0 40px rgba(200,180,140,0.06)"
          onTapDetail={onTapDetail}
        />
      </div>

      {/* Bottom — mixed editorial style */}
      <div className="relative z-30 px-6 pb-7 pt-5" style={{ background: "linear-gradient(to top, rgba(8,8,12,0.96) 65%, transparent)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(19px,4.8vw,28px)", fontWeight: 600, color: "#f0e8d0", lineHeight: 1.15, letterSpacing: "0.005em" }}>
              {product.name}
            </p>
            {product.flowersSummary && (
              <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: "rgba(200,180,140,0.55)", marginTop: 4 }}>
                {product.flowersSummary}
              </p>
            )}
          </div>
          {/* Price — vertical right side */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 15, fontWeight: 600, color: "#c8b880" }}>
              {formatPrice(product.price)}
            </span>
            <button
              type="button"
              onClick={onTapDetail}
              style={{ fontFamily: "system-ui, sans-serif", fontSize: 10, color: "rgba(200,180,140,0.60)", textDecoration: "none", background: "none", border: "0.5px solid rgba(200,180,140,0.30)", padding: "3px 10px", borderRadius: 1, cursor: "pointer", letterSpacing: "0.12em", textTransform: "uppercase" }}
            >
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
