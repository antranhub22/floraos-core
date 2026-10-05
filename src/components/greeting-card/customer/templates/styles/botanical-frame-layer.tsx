"use client"

import React from "react"

/**
 * Botanical Frame Layer for Style 05 (Botanical Frame).
 * Delicate SVG botanical branch & leaf line art at the corners & margins.
 * Visual weight < 10%, does not obscure product image.
 */
export function BotanicalFrameLayer() {
  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden text-secondary-text" aria-hidden="true">
      {/* Top Left Corner Leaves */}
      <svg
        className="absolute top-2 left-2 w-24 h-24 opacity-60"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10,10 Q35,15 50,45 Q65,75 80,85" />
        <path d="M22,17 Q30,10 40,16 Q35,26 22,17" fill="currentColor" fillOpacity="0.1" />
        <path d="M35,28 Q48,22 55,30 Q47,38 35,28" fill="currentColor" fillOpacity="0.1" />
        <path d="M47,44 Q60,38 68,48 Q58,56 47,44" fill="currentColor" fillOpacity="0.1" />
        <circle cx="16" cy="14" r="2" fill="currentColor" fillOpacity="0.3" />
        <circle cx="42" cy="22" r="1.5" fill="currentColor" fillOpacity="0.3" />
      </svg>

      {/* Top Right Corner Leaves */}
      <svg
        className="absolute top-2 right-2 w-24 h-24 opacity-60 transform scale-x-[-1]"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10,10 Q35,15 50,45 Q65,75 80,85" />
        <path d="M22,17 Q30,10 40,16 Q35,26 22,17" fill="currentColor" fillOpacity="0.1" />
        <path d="M35,28 Q48,22 55,30 Q47,38 35,28" fill="currentColor" fillOpacity="0.1" />
        <path d="M47,44 Q60,38 68,48 Q58,56 47,44" fill="currentColor" fillOpacity="0.1" />
      </svg>

      {/* Bottom Left Corner Leaves */}
      <svg
        className="absolute bottom-20 left-2 w-20 h-20 opacity-50 transform scale-y-[-1]"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10,10 Q30,20 45,50" />
        <path d="M20,18 Q30,12 38,20 Q30,28 20,18" fill="currentColor" fillOpacity="0.1" />
        <path d="M32,30 Q44,25 50,34 Q40,42 32,30" fill="currentColor" fillOpacity="0.1" />
      </svg>

      {/* Bottom Right Corner Leaves */}
      <svg
        className="absolute bottom-20 right-2 w-20 h-20 opacity-50 transform scale-[-1]"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10,10 Q30,20 45,50" />
        <path d="M20,18 Q30,12 38,20 Q30,28 20,18" fill="currentColor" fillOpacity="0.1" />
        <path d="M32,30 Q44,25 50,34 Q40,42 32,30" fill="currentColor" fillOpacity="0.1" />
      </svg>

      {/* Inner Decorative Hairline Border */}
      <div className="absolute inset-3 border border-secondary-text/20 rounded-2xl pointer-events-none" />
    </div>
  )
}
