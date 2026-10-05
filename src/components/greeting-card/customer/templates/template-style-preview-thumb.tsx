"use client"

import React from "react"

interface StylePreviewThumbProps {
  styleNumber: string
  /** Fixed width/height of the thumb container. Ignored when fillParent=true. */
  size?: number
  /** When true, SVG fills parent 100%×100% — use inside an aspect-ratio container */
  fillParent?: boolean
}

/**
 * Micro-preview thumbnail rendering the visual identity of each of the 12 swipe styles.
 * Uses pure inline CSS — no Tailwind class string manipulation — so it renders correctly
 * inside any context without relying on className runtime resolution.
 */
export function StylePreviewThumb({ styleNumber, size = 56, fillParent = false }: StylePreviewThumbProps) {
  const radius = fillParent ? 0 : 10
  const style: React.CSSProperties = fillParent
    ? { width: "100%", height: "100%", position: "absolute", inset: 0, overflow: "hidden" }
    : { width: size, height: size, borderRadius: radius, overflow: "hidden", position: "relative", flexShrink: 0 }

  return (
    <div style={style} aria-hidden="true">
      {getThumb(styleNumber, 100, fillParent)}
    </div>
  )
}


function getThumb(num: string, size: number, fill = false): React.ReactNode {
  const s = fill ? 100 : size
  const r = Math.round(s * 0.55)
  const cx = s / 2
  const cy = s * 0.42

  const svgProps = fill
    ? { viewBox: `0 0 100 100`, width: "100%", height: "100%", preserveAspectRatio: "xMidYMid slice" }
    : { viewBox: `0 0 ${s} ${s}`, width: s, height: s }

  switch (num) {
    /* 01 — EDITORIAL LUXURY: warm ivory + oversized serif ghost text */
    case "01":
      return (
        <svg {...svgProps}>
          <rect width={s} height={s} fill="url(#g01)" />
          <defs>
            <linearGradient id="g01" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f9f5ef" />
              <stop offset="100%" stopColor="#e8e0d0" />
            </linearGradient>
          </defs>
          {/* Ghost editorial text behind product */}
          <text x={s * -0.08} y={s * 0.72} fontSize={s * 0.55} fontFamily="Georgia,serif" fontWeight="700" fill="rgba(90,74,46,0.08)" letterSpacing="-1">BLOOM</text>
          {/* Hairline borders */}
          <rect x="4" y="4" width={s - 8} height={s - 8} fill="none" stroke="rgba(160,140,110,0.35)" strokeWidth="0.5" />
          {/* Flower silhouette */}
          <ellipse cx={cx} cy={cy} rx={r * 0.55} ry={r * 0.65} fill="rgba(200,170,120,0.18)" />
          <ellipse cx={cx} cy={cy} rx={r * 0.35} ry={r * 0.42} fill="rgba(200,130,100,0.22)" />
          {/* Bottom serif text bar */}
          <rect x={s * 0.12} y={s * 0.76} width={s * 0.46} height={s * 0.045} rx="1" fill="rgba(46,35,24,0.55)" />
          <rect x={s * 0.12} y={s * 0.84} width={s * 0.3} height={s * 0.03} rx="1" fill="rgba(140,120,80,0.4)" />
        </svg>
      )

    /* 02 — MINIMAL CLEAN: pure white + extreme negative space */
    case "02":
      return (
        <svg {...svgProps}>
          <rect width={s} height={s} fill="#fafafa" />
          {/* Tiny accent bar top */}
          <rect x={s * 0.12} y={s * 0.1} width={s * 0.25} height={s * 0.025} rx="1" fill="rgba(158,158,158,0.6)" />
          {/* Product silhouette — centered with negative space */}
          <ellipse cx={cx} cy={cy} rx={r * 0.42} ry={r * 0.52} fill="rgba(0,0,0,0.06)" />
          <ellipse cx={cx} cy={cy} rx={r * 0.26} ry={r * 0.34} fill="rgba(0,0,0,0.09)" />
          {/* Bottom rule */}
          <rect x={s * 0.12} y={s * 0.73} width={s * 0.16} height={s * 0.028} rx="0.5" fill="rgba(50,50,50,0.7)" />
          <rect x={s * 0.12} y={s * 0.8} width={s * 0.38} height={s * 0.022} rx="0.5" fill="rgba(50,50,50,0.25)" />
        </svg>
      )

    /* 03 — CINEMATIC DARK: near-black + gold accents + spotlight */
    case "03":
      return (
        <svg {...svgProps}>
          <defs>
            <radialGradient id="g03spot" cx="50%" cy="38%" r="45%">
              <stop offset="0%" stopColor="rgba(180,130,60,0.25)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
            <radialGradient id="g03vig" cx="50%" cy="50%" r="70%">
              <stop offset="35%" stopColor="rgba(0,0,0,0)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.65)" />
            </radialGradient>
          </defs>
          <rect width={s} height={s} fill="#0a0a0c" />
          <rect width={s} height={s} fill="url(#g03spot)" />
          <rect width={s} height={s} fill="url(#g03vig)" />
          {/* Gold hairline */}
          <line x1={s * 0.12} y1={s * 0.15} x2={s * 0.45} y2={s * 0.15} stroke="rgba(200,160,80,0.5)" strokeWidth="0.5" />
          {/* Flower silhouette */}
          <ellipse cx={cx} cy={cy} rx={r * 0.48} ry={r * 0.58} fill="rgba(200,160,80,0.08)" />
          <ellipse cx={cx} cy={cy} rx={r * 0.30} ry={r * 0.38} fill="rgba(200,160,80,0.12)" />
          {/* Gold accent text bar */}
          <rect x={s * 0.12} y={s * 0.77} width={s * 0.42} height={s * 0.04} rx="0.5" fill="rgba(240,232,213,0.65)" />
          <rect x={s * 0.12} y={s * 0.84} width={s * 0.22} height={s * 0.025} rx="0.5" fill="rgba(212,168,64,0.7)" />
        </svg>
      )

    /* 04 — ROMANTIC PASTEL: blush gradients + bokeh circles */
    case "04":
      return (
        <svg {...svgProps}>
          <defs>
            <linearGradient id="g04" x1="0.2" y1="0" x2="0.8" y2="1">
              <stop offset="0%" stopColor="#fff0f3" />
              <stop offset="50%" stopColor="#fce4ec" />
              <stop offset="100%" stopColor="#f3e5f5" />
            </linearGradient>
          </defs>
          <rect width={s} height={s} fill="url(#g04)" />
          {/* Bokeh circles */}
          <circle cx={s * 0.18} cy={s * 0.2} r={s * 0.09} fill="rgba(255,150,180,0.22)" />
          <circle cx={s * 0.82} cy={s * 0.28} r={s * 0.07} fill="rgba(220,150,255,0.18)" />
          <circle cx={s * 0.25} cy={s * 0.65} r={s * 0.055} fill="rgba(255,150,180,0.18)" />
          {/* Flower */}
          <ellipse cx={cx} cy={cy} rx={r * 0.48} ry={r * 0.56} fill="rgba(194,24,91,0.10)" />
          <ellipse cx={cx} cy={cy} rx={r * 0.30} ry={r * 0.36} fill="rgba(194,24,91,0.15)" />
          {/* Script font shop name */}
          <rect x={s * 0.1} y={s * 0.08} width={s * 0.42} height={s * 0.04} rx="2" fill="rgba(194,24,91,0.25)" />
          {/* Bottom text */}
          <rect x={s * 0.1} y={s * 0.76} width={s * 0.52} height={s * 0.038} rx="1" fill="rgba(136,14,79,0.50)" />
          <rect x={s * 0.1} y={s * 0.83} width={s * 0.3} height={s * 0.025} rx="1" fill="rgba(173,84,120,0.35)" />
        </svg>
      )

    /* 05 — BOTANICAL FRAME: ivory + corner botanical SVG art */
    case "05":
      return (
        <svg {...svgProps}>
          <defs>
            <linearGradient id="g05" x1="0" y1="0" x2="0.3" y2="1">
              <stop offset="0%" stopColor="#faf8f3" />
              <stop offset="100%" stopColor="#f5f0e8" />
            </linearGradient>
          </defs>
          <rect width={s} height={s} fill="url(#g05)" />
          {/* Outer border */}
          <rect x="3" y="3" width={s - 6} height={s - 6} fill="none" stroke="rgba(140,120,80,0.35)" strokeWidth="0.5" />
          {/* Corner botanical art — top-left */}
          <path d={`M 4 ${s * 0.55} Q 4 4 ${s * 0.55} 4`} stroke="rgba(107,122,74,0.6)" strokeWidth="0.5" fill="none" />
          <ellipse cx={s * 0.12} cy={s * 0.3} rx="2" ry="4" fill="rgba(107,122,74,0.35)" transform={`rotate(-30 ${s * 0.12} ${s * 0.3})`} />
          <ellipse cx={s * 0.2} cy={s * 0.18} rx="1.5" ry="3.5" fill="rgba(107,122,74,0.30)" transform={`rotate(-50 ${s * 0.2} ${s * 0.18})`} />
          {/* Bottom-right botanical */}
          <path d={`M ${s - 4} ${s * 0.45} Q ${s - 4} ${s - 4} ${s * 0.45} ${s - 4}`} stroke="rgba(107,122,74,0.5)" strokeWidth="0.5" fill="none" />
          <ellipse cx={s * 0.88} cy={s * 0.7} rx="1.5" ry="3.5" fill="rgba(107,122,74,0.30)" transform={`rotate(30 ${s * 0.88} ${s * 0.7})`} />
          {/* Flower */}
          <ellipse cx={cx} cy={cy} rx={r * 0.42} ry={r * 0.50} fill="rgba(80,70,40,0.08)" />
          <ellipse cx={cx} cy={cy} rx={r * 0.26} ry={r * 0.32} fill="rgba(80,70,40,0.12)" />
          {/* Bottom serif text */}
          <rect x={s * 0.14} y={s * 0.76} width={s * 0.46} height={s * 0.04} rx="1" fill="rgba(44,32,16,0.50)" />
          <rect x={s * 0.14} y={s * 0.83} width={s * 0.25} height={s * 0.028} rx="1" fill="rgba(74,103,65,0.45)" />
        </svg>
      )

    /* 06 — GLASSMORPHISM: dark bg + frosted glass panel */
    case "06":
      return (
        <svg {...svgProps}>
          <defs>
            <linearGradient id="g06bg" x1="0.3" y1="0" x2="0.7" y2="1">
              <stop offset="0%" stopColor="#0d1b2a" />
              <stop offset="100%" stopColor="#0a0f1e" />
            </linearGradient>
          </defs>
          <rect width={s} height={s} fill="url(#g06bg)" />
          {/* Atmospheric orb */}
          <ellipse cx={cx} cy={s * 0.3} rx={s * 0.3} ry={s * 0.22} fill="rgba(100,160,255,0.10)" />
          {/* Flower silhouette */}
          <ellipse cx={cx} cy={cy - s * 0.04} rx={r * 0.44} ry={r * 0.52} fill="rgba(100,160,255,0.07)" />
          <ellipse cx={cx} cy={cy - s * 0.04} rx={r * 0.27} ry={r * 0.33} fill="rgba(100,160,255,0.10)" />
          {/* Frosted glass panel */}
          <rect x={s * 0.08} y={s * 0.66} width={s * 0.84} height={s * 0.27} rx="6" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.18)" strokeWidth="0.7" />
          {/* Glass inner highlight */}
          <line x1={s * 0.14} y1={s * 0.67} x2={s * 0.86} y2={s * 0.67} stroke="rgba(255,255,255,0.30)" strokeWidth="0.5" />
          {/* Text inside glass */}
          <rect x={s * 0.13} y={s * 0.71} width={s * 0.52} height={s * 0.04} rx="1" fill="rgba(255,255,255,0.65)" />
          <rect x={s * 0.13} y={s * 0.78} width={s * 0.34} height={s * 0.028} rx="1" fill="rgba(255,213,79,0.70)" />
        </svg>
      )

    /* 07 — REAL LIFE SHOP: warm amber bokeh shop ambience */
    case "07":
      return (
        <svg {...svgProps}>
          <defs>
            <linearGradient id="g07" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2a1a0e" />
              <stop offset="100%" stopColor="#120e08" />
            </linearGradient>
            <radialGradient id="g07warm" cx="30%" cy="25%" r="50%">
              <stop offset="0%" stopColor="rgba(255,200,100,0.22)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
          </defs>
          <rect width={s} height={s} fill="url(#g07)" />
          <rect width={s} height={s} fill="url(#g07warm)" />
          {/* Shelf lines */}
          <line x1="0" y1={s * 0.38} x2={s} y2={s * 0.38} stroke="rgba(255,200,100,0.12)" strokeWidth="0.6" />
          <line x1="0" y1={s * 0.62} x2={s} y2={s * 0.62} stroke="rgba(255,200,100,0.08)" strokeWidth="0.5" />
          {/* Bokeh lights */}
          <circle cx={s * 0.22} cy={s * 0.2} r={s * 0.07} fill="rgba(255,200,100,0.15)" />
          <circle cx={s * 0.72} cy={s * 0.15} r={s * 0.05} fill="rgba(255,180,80,0.12)" />
          {/* Flower */}
          <ellipse cx={cx} cy={cy} rx={r * 0.44} ry={r * 0.53} fill="rgba(255,200,100,0.06)" />
          <ellipse cx={cx} cy={cy} rx={r * 0.27} ry={r * 0.33} fill="rgba(255,200,100,0.08)" />
          {/* Contact shadow */}
          <ellipse cx={cx} cy={s * 0.68} rx={r * 0.3} ry="3" fill="rgba(0,0,0,0.50)" />
          {/* Bottom */}
          <rect x={s * 0.12} y={s * 0.76} width={s * 0.46} height={s * 0.04} rx="1" fill="rgba(245,230,204,0.55)" />
          <rect x={s * 0.12} y={s * 0.83} width={s * 0.25} height={s * 0.025} rx="1" fill="rgba(255,202,96,0.60)" />
        </svg>
      )

    /* 08 — DAYLIGHT: warm beige + window light bloom */
    case "08":
      return (
        <svg {...svgProps}>
          <defs>
            <linearGradient id="g08" x1="0" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="#e8e0d5" />
              <stop offset="100%" stopColor="#ccc3b4" />
            </linearGradient>
            <radialGradient id="g08light" cx="80%" cy="10%" r="60%">
              <stop offset="0%" stopColor="rgba(255,245,220,0.75)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
          </defs>
          <rect width={s} height={s} fill="url(#g08)" />
          <rect width={s} height={s} fill="url(#g08light)" />
          {/* Flower */}
          <ellipse cx={cx} cy={cy} rx={r * 0.45} ry={r * 0.54} fill="rgba(100,80,50,0.10)" />
          <ellipse cx={cx} cy={cy} rx={r * 0.28} ry={r * 0.35} fill="rgba(100,80,50,0.14)" />
          {/* Natural shadow */}
          <ellipse cx={cx + s * 0.05} cy={s * 0.70} rx={r * 0.32} ry="2.5" fill="rgba(100,80,50,0.18)" />
          {/* Text */}
          <rect x={s * 0.12} y={s * 0.76} width={s * 0.46} height={s * 0.04} rx="1" fill="rgba(42,32,24,0.45)" />
          <rect x={s * 0.12} y={s * 0.83} width={s * 0.28} height={s * 0.025} rx="1" fill="rgba(58,48,32,0.35)" />
        </svg>
      )

    /* 09 — IN STORE: cozy store warm bokeh layered depth */
    case "09":
      return (
        <svg {...svgProps}>
          <defs>
            <linearGradient id="g09" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1c1008" />
              <stop offset="100%" stopColor="#1a1008" />
            </linearGradient>
            <radialGradient id="g09v" cx="50%" cy="50%" r="65%">
              <stop offset="30%" stopColor="rgba(0,0,0,0)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
            </radialGradient>
          </defs>
          <rect width={s} height={s} fill="url(#g09)" />
          <rect width={s} height={s} fill="url(#g09v)" />
          {/* Bokeh warm dots */}
          {([
            [0.18, 0.15, 0.08, 0.15],
            [0.72, 0.20, 0.06, 0.12],
            [0.12, 0.42, 0.05, 0.10],
            [0.78, 0.50, 0.06, 0.09],
          ] as [number,number,number,number][]).map(([bx, by, br, bo], i) => (
            <circle key={i} cx={s * bx} cy={s * by} r={s * br} fill={`rgba(255,200,100,${bo})`} />
          ))}
          {/* Shelf lines */}
          <line x1="0" y1={s * 0.34} x2={s} y2={s * 0.34} stroke="rgba(255,200,100,0.14)" strokeWidth="0.5" />
          {/* Flower */}
          <ellipse cx={cx} cy={cy} rx={r * 0.44} ry={r * 0.52} fill="rgba(255,200,100,0.06)" />
          <ellipse cx={cx} cy={cy} rx={r * 0.28} ry={r * 0.33} fill="rgba(255,200,100,0.08)" />
          {/* Text */}
          <rect x={s * 0.12} y={s * 0.76} width={s * 0.46} height={s * 0.04} rx="1" fill="rgba(240,224,192,0.50)" />
          <rect x={s * 0.12} y={s * 0.83} width={s * 0.22} height={s * 0.025} rx="1" fill="rgba(255,192,64,0.55)" />
        </svg>
      )

    /* 10 — HANDHELD: dark UGC film aesthetic + grain */
    case "10":
      return (
        <svg {...svgProps}>
          <defs>
            <linearGradient id="g10" x1="0.2" y1="0" x2="0.8" y2="1">
              <stop offset="0%" stopColor="#1a1a20" />
              <stop offset="100%" stopColor="#0e0e12" />
            </linearGradient>
          </defs>
          <rect width={s} height={s} fill="url(#g10)" />
          {/* Lens flare top-right */}
          <ellipse cx={s * 0.78} cy={s * 0.14} rx={s * 0.18} ry={s * 0.12} fill="rgba(255,240,200,0.08)" />
          {/* Film grain via repeating dots */}
          {Array.from({ length: 12 }, (_, i) => (
            <circle
              key={i}
              cx={((i * 71 + 13) % s)}
              cy={((i * 53 + 27) % s)}
              r="0.4"
              fill="rgba(255,255,255,0.15)"
            />
          ))}
          {/* Handwritten annotation */}
          <text x={s * 0.62} y={s * 0.28} fontSize={s * 0.07} fontFamily="Georgia,cursive" fill="rgba(255,220,180,0.35)" transform={`rotate(-8, ${s * 0.72}, ${s * 0.24})`}>♡</text>
          {/* Flower */}
          <ellipse cx={cx} cy={cy} rx={r * 0.44} ry={r * 0.52} fill="rgba(255,200,150,0.07)" />
          <ellipse cx={cx} cy={cy} rx={r * 0.28} ry={r * 0.34} fill="rgba(255,200,150,0.09)" />
          {/* Text */}
          <rect x={s * 0.1} y={s * 0.75} width={s * 0.5} height={s * 0.04} rx="1" fill="rgba(255,255,255,0.55)" />
          <rect x={s * 0.1} y={s * 0.82} width={s * 0.3} height={s * 0.025} rx="1" fill="rgba(255,200,150,0.45)" />
        </svg>
      )

    /* 11 — LIFESTYLE: warm morning scene beige + ambient light */
    case "11":
      return (
        <svg {...svgProps}>
          <defs>
            <linearGradient id="g11" x1="0.2" y1="0" x2="0.8" y2="1">
              <stop offset="0%" stopColor="#f5ede0" />
              <stop offset="100%" stopColor="#e5d4bc" />
            </linearGradient>
            <radialGradient id="g11light" cx="75%" cy="15%" r="60%">
              <stop offset="0%" stopColor="rgba(255,230,180,0.45)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
          </defs>
          <rect width={s} height={s} fill="url(#g11)" />
          <rect width={s} height={s} fill="url(#g11light)" />
          {/* Surface shadow line */}
          <line x1={s * 0.08} y1={s * 0.68} x2={s * 0.92} y2={s * 0.68} stroke="rgba(150,120,80,0.12)" strokeWidth="1.5" />
          {/* Flower */}
          <ellipse cx={cx} cy={cy} rx={r * 0.44} ry={r * 0.52} fill="rgba(100,80,40,0.09)" />
          <ellipse cx={cx} cy={cy} rx={r * 0.27} ry={r * 0.33} fill="rgba(100,80,40,0.13)" />
          {/* Scene shadow */}
          <ellipse cx={cx + s * 0.04} cy={s * 0.68} rx={r * 0.35} ry="3" fill="rgba(100,80,40,0.22)" />
          {/* Text */}
          <rect x={s * 0.12} y={s * 0.75} width={s * 0.48} height={s * 0.04} rx="1" fill="rgba(42,30,14,0.45)" />
          <rect x={s * 0.12} y={s * 0.82} width={s * 0.28} height={s * 0.025} rx="1" fill="rgba(74,48,32,0.35)" />
        </svg>
      )

    /* 12 — MIXED MEDIA: dark + geometric lines + collage elements */
    case "12":
      return (
        <svg {...svgProps}>
          <defs>
            <linearGradient id="g12" x1="0.2" y1="0" x2="0.8" y2="1">
              <stop offset="0%" stopColor="#0e0e12" />
              <stop offset="100%" stopColor="#0a0a0e" />
            </linearGradient>
          </defs>
          <rect width={s} height={s} fill="url(#g12)" />
          {/* Oversized ghost text */}
          <text x={s * -0.05} y={s * 0.68} fontSize={s * 0.48} fontFamily="Georgia,serif" fontWeight="700" fill="rgba(200,180,140,0.05)" letterSpacing="-1">FLR</text>
          {/* Geometric thin lines */}
          <line x1={s * 0.12} y1={s * 0.18} x2={s * 0.48} y2={s * 0.18} stroke="rgba(200,180,140,0.28)" strokeWidth="0.5" />
          <line x1={s * 0.12} y1={s * 0.205} x2={s * 0.3} y2={s * 0.205} stroke="rgba(200,180,140,0.16)" strokeWidth="0.5" />
          <line x1={s * 0.78} y1={s * 0.18} x2={s * 0.78} y2={s * 0.45} stroke="rgba(200,180,140,0.22)" strokeWidth="0.5" />
          {/* Corner mark */}
          <rect x={s * 0.1} y={s * 0.82} width={s * 0.09} height={s * 0.09} fill="none" stroke="rgba(200,180,140,0.25)" strokeWidth="0.4" />
          {/* Flower — slightly off-center */}
          <ellipse cx={cx + s * 0.05} cy={cy} rx={r * 0.44} ry={r * 0.52} fill="rgba(200,180,140,0.06)" />
          <ellipse cx={cx + s * 0.05} cy={cy} rx={r * 0.27} ry={r * 0.33} fill="rgba(200,180,140,0.08)" />
          {/* Asymmetric text block */}
          <rect x={s * 0.1} y={s * 0.74} width={s * 0.52} height={s * 0.04} rx="0.5" fill="rgba(240,232,208,0.55)" />
          <rect x={s * 0.1} y={s * 0.81} width={s * 0.28} height={s * 0.025} rx="0.5" fill="rgba(200,184,128,0.45)" />
        </svg>
      )

    default:
      return (
        <svg {...svgProps}>
          <rect width={s} height={s} fill="rgba(0,0,0,0.06)" rx={s * 0.15} />
          <ellipse cx={cx} cy={cy} rx={r * 0.44} ry={r * 0.52} fill="rgba(0,0,0,0.10)" />
        </svg>
      )
  }
}
