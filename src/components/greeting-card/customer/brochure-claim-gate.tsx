"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

/**
 * Lần đầu mở link riêng: trình duyệt này xin nhận phiên (cookie chủ phiên) rồi tải lại trang để
 * thấy bộ sưu tập. Máy quét xem trước link không chạy JavaScript nên không chiếm được phiên.
 */
export function BrochureClaimGate({ sendCode }: { sendCode: string }) {
  const router = useRouter()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/v1/public/brochure/${encodeURIComponent(sendCode)}/claim`, { method: "POST" })
      .then(() => {
        // Thành công hay đã có chủ khác: trang tự quyết lại theo cookie
        if (!cancelled) router.refresh()
      })
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [sendCode, router])

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-6 text-center text-foreground">
      {failed ? (
        <>
          <p className="text-body">Mất kết nối mạng, chưa mở được bộ sưu tập.</p>
          <button type="button" onClick={() => window.location.reload()} className="h-11 rounded-xl bg-primary px-5 text-body font-bold text-surface">
            Thử lại
          </button>
        </>
      ) : (
        <>
          <Loader2 className="animate-spin text-primary" size={28} aria-hidden="true" />
          <p className="text-body text-text-muted">Đang mở bộ sưu tập…</p>
        </>
      )}
    </main>
  )
}
