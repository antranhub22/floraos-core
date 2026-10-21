"use client"

import { useState } from "react"
import { apiSend } from "@/components/greeting-card/greeting-api"

export type Done = (message: string) => void

/** Gửi một thao tác của Hộp việc, giữ trạng thái đang gửi + lỗi hiện ngay dưới nút. */
export function useInboxSend(onDone: Done) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  async function send(key: string, url: string, body: unknown, ok: string, fallback: string) {
    setBusy(key)
    setError(null)
    try {
      await apiSend(url, "POST", body, fallback)
      onDone(ok)
    } catch (err) {
      setError(err instanceof Error ? err.message : fallback)
    } finally {
      setBusy(null)
    }
  }
  return { busy, error, send }
}

export const SEND_ERROR = "text-caption font-semibold text-danger"
