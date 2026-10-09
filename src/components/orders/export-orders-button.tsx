"use client"

/**
 * ExportOrdersButton — Nút "Xuất Excel" với date picker khoảng ngày.
 *
 * Dùng inline dropdown tự xây (không cần Popover UI lib chưa có trong dự án).
 */

import React, { useState, useRef, useEffect } from "react"
import { Download, Loader2, CalendarRange, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ExportOrdersButtonProps {
  apiPath?: string
  label?: string
  filename?: string
  /** Bộ lọc cố định thêm vào query string (vd: source=BROCHURE) */
  extraParams?: Record<string, string>
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function thirtyDaysAgoStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}

export function ExportOrdersButton({
  apiPath = "/api/v1/orders/export",
  label = "Xuất Excel",
  filename = "don-hang.xlsx",
  extraParams = {},
}: ExportOrdersButtonProps) {
  const [open, setOpen] = useState(false)
  const [fromDate, setFromDate] = useState(thirtyDaysAgoStr())
  const [toDate, setToDate] = useState(todayStr())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Đóng dropdown khi click ngoài hoặc nhấn Escape
  useEffect(() => {
    if (!open) return
    function handleOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handleOutsideClick)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  async function handleExport() {
    setError(null)
    setLoading(true)
    try {
      const params = new URLSearchParams({
        ...(fromDate ? { from_date: fromDate } : {}),
        ...(toDate ? { to_date: toDate } : {}),
        ...extraParams,
      })

      const res = await fetch(`${apiPath}?${params.toString()}`)
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string }
        throw new Error(body.message ?? `Lỗi ${res.status}`)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setOpen(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể tải file, vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div ref={dropdownRef} className="relative">
      <Button
        id="export-orders-btn"
        variant="outline"
        size="sm"
        className="gap-1.5 text-body-sm"
        aria-label="Xuất danh sách đơn hàng ra Excel"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Download className="h-4 w-4" />
        {label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Chọn khoảng thời gian xuất Excel"
          className="absolute right-0 top-full z-50 mt-1 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-surface shadow-lg"
        >
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-text">
              <CalendarRange className="h-4 w-4 text-primary" />
              <span className="text-body-sm font-semibold">Chọn khoảng thời gian</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label
                  htmlFor="export-from-date"
                  className="block text-caption text-text-muted font-medium"
                >
                  Từ ngày
                </label>
                <Input
                  id="export-from-date"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  max={toDate || todayStr()}
                  className="text-body-sm"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="export-to-date"
                  className="block text-caption text-text-muted font-medium"
                >
                  Đến ngày
                </label>
                <Input
                  id="export-to-date"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  min={fromDate}
                  max={todayStr()}
                  className="text-body-sm"
                />
              </div>
            </div>

            <p className="text-caption text-text-muted">
              File Excel gồm: đơn hàng, chi tiết sản phẩm, sổ thu tiền, phiên Thẻ Chào.
              Tối đa 5.000 đơn.
            </p>

            {error && (
              <p className="text-caption text-danger font-medium">{error}</p>
            )}

            <Button
              id="export-orders-confirm-btn"
              className="w-full gap-2"
              onClick={handleExport}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {loading ? "Đang xuất..." : "Tải xuống Excel"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
