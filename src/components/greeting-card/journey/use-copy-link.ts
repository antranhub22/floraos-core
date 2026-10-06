"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useAnnounce } from "@/components/ui/live-region"
import { copyFromServer } from "@/components/greeting-card/share/tracked-copy"

/** Sao chép link vào clipboard; trả về khóa vừa chép để hiện trạng thái "Đã chép". */
export function useCopyLink() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [copyError, setCopyError] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { announce } = useAnnounce()

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  /** `text` là chuỗi có sẵn, hoặc hàm lấy link từ máy chủ (link mang tên người bấm). */
  const copy = useCallback(
    async (key: string, text: string | (() => Promise<string>)) => {
      try {
        if (typeof text === "string") await navigator.clipboard.writeText(text)
        else await copyFromServer(text)
        setCopyError(null)
        setCopiedKey(key)
        announce("Đã sao chép link")
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopiedKey(null), 2500)
      } catch {
        setCopyError("Trình duyệt chặn sao chép. Hãy bôi đen link và chép thủ công.")
      }
    },
    [announce],
  )

  return { copy, copiedKey, copyError }
}
