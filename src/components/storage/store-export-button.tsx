"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { Download, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { readApiError } from "@/components/greeting-card/api-error"
import type { StoreExportView } from "@/modules/storage/domain/store-export"
import { useSession } from "@/lib/session"

const POLL_MS = 5000

function formatSize(bytes: number | null): string {
  if (!bytes) return ""
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function formatTime(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : ""
}

/** Nút "Tải dữ liệu cửa hàng" (R13) — tạo bản sao lưu ZIP ở nền, link tải sống 24 giờ. */
export function StoreExportButton() {
  const session = useSession()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<StoreExportView | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async () => {
    const res = await fetch("/api/v1/storage/export")
    if (!res.ok) throw new Error(await readApiError(res, "Không tải được trạng thái sao lưu"))
    const json = (await res.json()) as { data: StoreExportView | null }
    setView(json.data)
    return json.data
  }, [])

  useEffect(() => {
    if (!open) return
    let stopped = false
    const tick = async () => {
      try {
        const current = await load()
        if (!stopped && current && (current.status === "PENDING" || current.status === "PROCESSING")) {
          timer.current = setTimeout(tick, POLL_MS)
        }
      } catch (err) {
        if (!stopped) setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra")
      }
    }
    void tick()
    return () => {
      stopped = true
      if (timer.current) clearTimeout(timer.current)
    }
  }, [open, load, view?.id, view?.status])

  if (!session.can("R13")) return null

  async function requestExport() {
    setBusy(true)
    setError("")
    try {
      const res = await fetch("/api/v1/storage/export", { method: "POST" })
      if (!res.ok) throw new Error(await readApiError(res, "Không tạo được bản sao lưu"))
      const json = (await res.json()) as { data: StoreExportView }
      setView(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra")
    } finally {
      setBusy(false)
    }
  }

  const running = view?.status === "PENDING" || view?.status === "PROCESSING"

  return (
    <div className="relative">
      <Button variant="outline" className="flex items-center gap-2 font-bold h-10 px-4" onClick={() => setOpen((v) => !v)}>
        <Download size={16} strokeWidth={2} />
        Tải dữ liệu cửa hàng
      </Button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-2xl border border-border bg-surface p-4 shadow-lg">
          <div className="flex items-start justify-between gap-2">
            <p className="text-body-sm font-bold text-text">Sao lưu toàn bộ dữ liệu</p>
            <button type="button" aria-label="Đóng" onClick={() => setOpen(false)} className="text-text-muted hover:text-text">
              <X size={16} />
            </button>
          </div>
          <p className="mt-1 text-caption text-text-muted">
            Tệp ZIP gồm bảng Excel (sản phẩm, khách hàng, đơn hàng, mã giảm giá), dữ liệu đầy đủ và ảnh gốc. Tệp có thông tin
            khách hàng — hãy cất ở nơi an toàn.
          </p>

          {view?.status === "COMPLETED" && view.downloadUrl && (
            <div className="mt-3 rounded-xl bg-success-bg p-3 text-caption text-success">
              <p className="font-bold">Bản sao lưu đã sẵn sàng ({formatSize(view.sizeBytes)})</p>
              <p className="mt-0.5">Link dùng được tới {formatTime(view.expiresAt)}.</p>
              {(view.skippedImageCount ?? 0) > 0 && (
                <p className="mt-0.5 text-warning">{view.skippedImageCount} ảnh chưa đưa vào vì vượt dung lượng — xem tệp anh-bo-qua.txt.</p>
              )}
              <a href={view.downloadUrl} className="mt-2 inline-flex items-center gap-1 font-bold text-primary underline" download>
                <Download size={13} /> Tải về
              </a>
            </div>
          )}
          {running && (
            <p className="mt-3 flex items-center gap-2 text-caption text-text-muted">
              <Loader2 size={13} className="animate-spin" /> Đang chuẩn bị tệp, có thể mất vài phút…
            </p>
          )}
          {view?.status === "EXPIRED" && <p className="mt-3 text-caption text-text-muted">Link lần trước đã hết hạn. Tạo bản mới bên dưới.</p>}
          {view?.status === "FAILED" && <p className="mt-3 text-caption text-danger">{view.error}</p>}
          {error && <p className="mt-3 text-caption text-danger">{error}</p>}

          {!running && (
            <Button variant="primary" size="sm" className="mt-3 w-full gap-1.5" disabled={busy} onClick={requestExport}>
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              {view?.status === "COMPLETED" ? "Tạo bản sao lưu mới" : "Tạo bản sao lưu"}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
