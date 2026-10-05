"use client"

import { useCallback, useRef, useState } from "react"

export type SwipeDirection = "like" | "nope"

interface DragState {
  x: number
  y: number
  dragging: boolean
  /** Cầm ở nửa dưới thẻ thì xoay ngược chiều (như Tinder) */
  grabBottom: boolean
}

interface UseCardSwipeOptions {
  /** Gọi khi thẻ đã bay khỏi màn hình */
  onSwiped: (dir: SwipeDirection) => void
  /** Chạm nhẹ (không kéo) vào thẻ */
  onTap?: () => void
  disabled?: boolean
}

const DISTANCE_THRESHOLD = 110
const VELOCITY_THRESHOLD = 0.55 // px/ms
const EXIT_MS = 320
const TAP_SLOP = 6

/**
 * Cử chỉ vuốt thẻ bằng Pointer Events: kéo theo ngón tay ở cả hai trục,
 * xoay quanh điểm cầm, quăng theo vận tốc, bật lại khi chưa đủ ngưỡng.
 */
export function useCardSwipe({ onSwiped, onTap, disabled }: UseCardSwipeOptions) {
  const [drag, setDrag] = useState<DragState>({ x: 0, y: 0, dragging: false, grabBottom: false })
  const [exiting, setExiting] = useState<{ dir: SwipeDirection; x: number; y: number } | null>(null)
  const origin = useRef<{ x: number; y: number; t: number; id: number } | null>(null)
  const last = useRef<{ x: number; t: number }>({ x: 0, t: 0 })
  const velocity = useRef(0)

  const fling = useCallback(
    (dir: SwipeDirection, fromY = 0) => {
      if (exiting) return
      const width = typeof window !== "undefined" ? window.innerWidth : 600
      setExiting({ dir, x: (dir === "like" ? 1 : -1) * (width + 200), y: fromY + 60 })
      window.setTimeout(() => {
        onSwiped(dir)
        setExiting(null)
        setDrag({ x: 0, y: 0, dragging: false, grabBottom: false })
      }, EXIT_MS)
    },
    [exiting, onSwiped],
  )

  function onPointerDown(e: React.PointerEvent<HTMLElement>) {
    if (disabled || exiting || (e.pointerType === "mouse" && e.button !== 0)) return
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.setPointerCapture(e.pointerId)
    origin.current = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId }
    last.current = { x: e.clientX, t: performance.now() }
    velocity.current = 0
    setDrag({ x: 0, y: 0, dragging: true, grabBottom: e.clientY - rect.top > rect.height / 2 })
  }

  function onPointerMove(e: React.PointerEvent<HTMLElement>) {
    const o = origin.current
    if (!o || o.id !== e.pointerId) return
    const now = performance.now()
    const dt = Math.max(1, now - last.current.t)
    velocity.current = 0.8 * ((e.clientX - last.current.x) / dt) + 0.2 * velocity.current
    last.current = { x: e.clientX, t: now }
    setDrag((d) => ({ ...d, x: e.clientX - o.x, y: e.clientY - o.y }))
  }

  function onPointerUp(e: React.PointerEvent<HTMLElement>) {
    const o = origin.current
    if (!o || o.id !== e.pointerId) return
    origin.current = null
    const dx = e.clientX - o.x
    const dy = e.clientY - o.y
    const v = velocity.current
    if (Math.abs(dx) < TAP_SLOP && Math.abs(dy) < TAP_SLOP) {
      setDrag({ x: 0, y: 0, dragging: false, grabBottom: false })
      onTap?.()
      return
    }
    const passed = Math.abs(dx) > DISTANCE_THRESHOLD || (Math.abs(v) > VELOCITY_THRESHOLD && Math.abs(dx) > 40)
    if (passed) {
      setDrag((d) => ({ ...d, dragging: false }))
      fling(dx > 0 ? "like" : "nope", dy)
    } else {
      setDrag({ x: 0, y: 0, dragging: false, grabBottom: false })
    }
  }

  const x = exiting ? exiting.x : drag.x
  const y = exiting ? exiting.y : drag.y
  const tilt = (drag.grabBottom ? -1 : 1) * Math.max(-22, Math.min(22, x / 14))
  /** -1 (bỏ qua) … 0 … 1 (thích) */
  const progress = Math.max(-1, Math.min(1, x / DISTANCE_THRESHOLD))

  const style: React.CSSProperties = {
    transform: `translate3d(${x}px, ${y}px, 0) rotate(${tilt}deg)`,
    transition: drag.dragging ? "none" : `transform ${EXIT_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
    touchAction: "none",
    cursor: drag.dragging ? "grabbing" : "grab",
  }

  return {
    style,
    progress,
    isDragging: drag.dragging,
    isExiting: Boolean(exiting),
    fling,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  }
}
