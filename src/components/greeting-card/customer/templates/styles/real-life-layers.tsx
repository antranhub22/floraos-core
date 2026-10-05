"use client"

import React from "react"

interface RealLifeSceneLayerProps {
  scene: "shop" | "daylight" | "in-store" | "handheld" | "lifestyle"
  hasRibbonBow?: boolean | undefined
}

/**
 * Environmental Atmosphere Layer for Real-Life Styles (07 - 11).
 * Creates authentic depth, light direction and physical presence
 * without obscuring or modifying the flower bouquet.
 */
export function RealLifeSceneLayer({ scene, hasRibbonBow }: RealLifeSceneLayerProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* 07 Shop Photo: Florist Shop Entrance Backdrop */}
      {scene === "shop" && (
        <div className="absolute inset-0 bg-black/60">
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black/80 to-transparent" />
          {/* Subtle architectural door frame shadow */}
          <div className="absolute top-10 left-3 w-1.5 h-72 bg-accent/20 blur-xs" />
          <div className="absolute top-10 right-3 w-1.5 h-72 bg-accent/20 blur-xs" />
        </div>
      )}

      {/* 08 Daylight: Sun-drenched Natural Outdoor / Window Lighting */}
      {scene === "daylight" && (
        <div className="absolute inset-0 bg-black/40">
          {/* Gentle diagonal sunbeam */}
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-radial from-white/20 via-white/5 to-transparent rounded-full blur-2xl" />
          <div className="absolute top-1/4 -left-12 w-48 h-48 bg-radial from-white/10 to-transparent rounded-full blur-xl" />
        </div>
      )}

      {/* 09 In Store: Warm Wooden Shelves & Cozy Ambient Bokeh */}
      {scene === "in-store" && (
        <div className="absolute inset-0 bg-black/50">
          {/* Warm background bokeh circles */}
          <div className="absolute top-20 left-8 w-16 h-16 rounded-full bg-accent/20 blur-lg" />
          <div className="absolute top-28 right-10 w-20 h-20 rounded-full bg-accent/15 blur-xl" />
          <div className="absolute top-48 left-16 w-12 h-12 rounded-full bg-white/10 blur-md" />
          {/* Shelf silhouette line */}
          <div className="absolute top-44 inset-x-0 h-px bg-accent/25" />
        </div>
      )}

      {/* 10 Handheld: Casual POV Framing */}
      {scene === "handheld" && (
        <div className="absolute inset-0 bg-black/50">
          {/* Soft vignette and mobile perspective */}
          <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/60 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />
        </div>
      )}

      {/* 11 Lifestyle Context: Morning Coffee Table Scene */}
      {scene === "lifestyle" && (
        <div className="absolute inset-0 bg-surface-alt/70">
          {/* Soft linen texture and morning shadow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-radial from-accent/15 via-transparent to-transparent rounded-full blur-2xl" />
          {/* Subtle coffee cup contour icon at bottom left corner */}
          <div className="absolute bottom-28 left-6 opacity-40 text-text-muted">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
              <line x1="6" y1="1" x2="6" y2="4" />
              <line x1="10" y1="1" x2="10" y2="4" />
              <line x1="14" y1="1" x2="14" y2="4" />
            </svg>
          </div>
        </div>
      )}

      {/* Realistic Red Ribbon Bow Accent for Style 07 */}
      {hasRibbonBow && (
        <div className="absolute bottom-28 left-8 z-20 pointer-events-none drop-shadow-md text-primary">
          <svg className="w-12 h-12" viewBox="0 0 60 60" fill="currentColor">
            <path d="M30,25 C20,12 8,20 18,30 C25,37 30,30 30,30 C30,30 35,37 42,30 C52,20 40,12 30,25 Z" opacity="0.95" />
            <path d="M27,29 C24,38 18,48 14,52 C13,53 15,54 18,50 C22,44 26,36 28,31 Z" opacity="0.8" />
            <path d="M33,29 C36,38 42,48 46,52 C47,53 45,54 42,50 C38,44 34,36 32,31 Z" opacity="0.8" />
            <circle cx="30" cy="28" r="4.5" fill="currentColor" />
          </svg>
        </div>
      )}
    </div>
  )
}
