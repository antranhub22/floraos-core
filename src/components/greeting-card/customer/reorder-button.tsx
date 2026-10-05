"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { readApiError } from "@/components/greeting-card/api-error"

/** "Đặt thêm một đơn khác": mở link mới (mã đơn mới), đơn hiện tại giữ nguyên. */
export function ReorderButton({ sendCode }: { sendCode: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function start() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/public/brochure/${encodeURIComponent(sendCode)}/reorder`, { method: "POST" })
      if (!res.ok) throw new Error(await readApiError(res, "Chưa mở được đơn mới, vui lòng thử lại"))
      const data = (await res.json()) as { sendCode: string }
      router.push(`/b/${encodeURIComponent(data.sendCode)}` as Parameters<typeof router.push>[0])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chưa mở được đơn mới, vui lòng thử lại")
      setBusy(false)
    }
  }

  return (
    <div className="mt-4 flex w-full flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => void start()}
        disabled={busy}
        className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-border px-4 text-body-sm font-semibold text-primary hover:bg-surface-muted disabled:opacity-60"
      >
        <Plus size={16} aria-hidden="true" />
        {busy ? "Đang mở đơn mới..." : "Đặt thêm một đơn khác"}
      </button>
      {error && <p role="alert" className="text-caption text-danger">{error}</p>}
    </div>
  )
}
