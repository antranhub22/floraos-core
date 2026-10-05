"use client"

import { useState, useRef, useCallback } from "react"

interface UseSwipeGestureProps {
  currentIndex: number
  totalItems: number
  onIndexChange: (newIndex: number) => void
  onHaptic?: (ms?: number) => void
  threshold?: number
}

export function useSwipeGesture({
  currentIndex,
  totalItems,
  onIndexChange,
  onHaptic,
  threshold = 65,
}: UseSwipeGestureProps) {
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [animatingDir, setAnimatingDir] = useState<"next" | "prev" | null>(null)
  const startXRef = useRef<number | null>(null)

  const triggerNext = useCallback(() => {
    if (currentIndex < totalItems - 1) {
      onHaptic?.(15)
      setAnimatingDir("next")
      setTimeout(() => {
        onIndexChange(currentIndex + 1)
        setDragX(0)
        setAnimatingDir(null)
      }, 240)
    } else {
      setDragX(0)
    }
  }, [currentIndex, totalItems, onIndexChange, onHaptic])

  const triggerPrev = useCallback(() => {
    if (currentIndex > 0) {
      onHaptic?.(15)
      setAnimatingDir("prev")
      setTimeout(() => {
        onIndexChange(currentIndex - 1)
        setDragX(0)
        setAnimatingDir(null)
      }, 240)
    } else {
      setDragX(0)
    }
  }, [currentIndex, onIndexChange, onHaptic])

  function handleTouchStart(e: React.TouchEvent) {
    if (animatingDir) return
    startXRef.current = e.targetTouches[0]?.clientX ?? null
    setIsDragging(true)
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isDragging || startXRef.current === null || animatingDir) return
    const currentX = e.targetTouches[0]?.clientX ?? startXRef.current
    setDragX(currentX - startXRef.current)
  }

  function handleDragEnd() {
    if (!isDragging || animatingDir) return
    setIsDragging(false)
    startXRef.current = null
    if (dragX < -threshold) triggerNext()
    else if (dragX > threshold) triggerPrev()
    else setDragX(0)
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (!animatingDir) {
      startXRef.current = e.clientX
      setIsDragging(true)
    }
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (isDragging && startXRef.current !== null && !animatingDir) {
      setDragX(e.clientX - startXRef.current)
    }
  }

  let transformStyle = "translate3d(0, 0, 0) rotate(0deg)"
  let transitionStyle = "transform 0.32s cubic-bezier(0.18, 0.89, 0.32, 1.15), opacity 0.22s ease"

  if (animatingDir === "next") {
    transformStyle = "translate3d(-135%, 15px, 0) rotate(-16deg)"
  } else if (animatingDir === "prev") {
    transformStyle = "translate3d(135%, 15px, 0) rotate(16deg)"
  } else if (isDragging) {
    transformStyle = `translate3d(${dragX}px, ${Math.abs(dragX) * 0.08}px, 0) rotate(${dragX * 0.05}deg)`
    transitionStyle = "none"
  }

  const dragProgress = Math.min(1, Math.abs(dragX) / 160)
  const layer2Scale = 0.93 + dragProgress * 0.07
  const layer2TranslateY = 14 - dragProgress * 14
  const layer3Scale = 0.86 + dragProgress * 0.07
  const layer3TranslateY = 28 - dragProgress * 14

  return {
    dragX,
    isDragging,
    animatingDir,
    triggerNext,
    triggerPrev,
    handleTouchStart,
    handleTouchMove,
    handleDragEnd,
    handleMouseDown,
    handleMouseMove,
    transformStyle,
    transitionStyle,
    dragProgress,
    layer2Scale,
    layer2TranslateY,
    layer3Scale,
    layer3TranslateY,
  }
}
