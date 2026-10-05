"use client"

import React from "react"

/**
 * Mixed Media Layer for Style 12 (Mixed Media Style).
 * Handwritten doodle hearts, taped Polaroid note with "Good day ♡",
 * and cute artistic scrapbook accents.
 */
export function MixedMediaLayer() {
  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden" aria-hidden="true">
      {/* Hand-drawn Doodle Heart Top Left */}
      <svg
        className="absolute top-16 left-6 w-10 h-10 text-white/90 drop-shadow-sm transform -rotate-12"
        viewBox="0 0 40 40"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M20,12 C16,4 4,6 6,18 C8,27 20,34 20,34 C20,34 32,27 34,18 C36,6 24,4 20,12 Z" />
      </svg>

      {/* Hand-drawn Sparkles Top Right */}
      <svg
        className="absolute top-20 right-6 w-8 h-8 text-accent drop-shadow-sm"
        viewBox="0 0 30 30"
        fill="currentColor"
      >
        <path d="M15,2 L17,11 L26,13 L17,15 L15,24 L13,15 L4,13 L13,11 Z" opacity="0.8" />
        <circle cx="8" cy="8" r="1.5" />
      </svg>

      {/* Polaroid / Card Note with Washi Tape at Bottom Center */}
      <div className="absolute bottom-28 right-4 w-36 bg-surface-alt text-foreground p-2.5 rounded-sm shadow-xl transform rotate-3 border border-border">
        {/* Washi Tape Strip */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-3.5 bg-accent/40 backdrop-blur-xs border-dashed border-accent transform -rotate-2" />
        
        {/* Handwritten text inside note */}
        <div className="pt-1 text-center font-serif italic text-caption font-semibold tracking-wide text-foreground">
          Good day ♡
        </div>
        <div className="text-caption text-text-muted text-center font-mono mt-0.5">
          handmade with love
        </div>
      </div>

      {/* Floating Mini Doodle Heart */}
      <svg
        className="absolute bottom-44 left-5 w-6 h-6 text-danger drop-shadow-sm transform rotate-12"
        viewBox="0 0 30 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <path d="M15,9 C12,3 3,5 4,14 C6,20 15,26 15,26 C15,26 24,20 26,14 C27,5 18,3 15,9 Z" />
      </svg>
    </div>
  )
}
