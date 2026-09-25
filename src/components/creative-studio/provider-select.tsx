"use client"

import { useEffect, useState } from "react"

/**
 * Ô chọn nhà cung cấp cho MỘT lượt tạo (PO 25/09/2026 — nhà cung cấp trước,
 * nhiều lựa chọn). Giá trị rỗng = theo thứ tự ưu tiên của tiệm (Cài đặt →
 * Nhà cung cấp AI). Bên chưa có khoá vẫn hiện nhưng ghi rõ, và bị bỏ qua khi
 * chạy. Danh mục đọc từ `GET /api/v1/creative-production/providers`.
 */
export type ProviderKind = "content" | "image_optimize" | "image_variant" | "video" | "voice" | "music"

export interface ProviderKindView {
  label: string
  order: string[]
  providers: { key: string; label: string; vendor: string; quality: string; note: string; configured: boolean }[]
  local_fallback: { key: string; label: string } | null
}

let cache: Promise<Record<ProviderKind, ProviderKindView> | null> | null = null

export function loadProviderCatalog(force = false): Promise<Record<ProviderKind, ProviderKindView> | null> {
  if (!cache || force) {
    cache = fetch("/api/v1/creative-production/providers")
      .then(async (r) => (r.ok ? ((await r.json()) as { kinds: Record<ProviderKind, ProviderKindView> }).kinds : null))
      .catch(() => null)
  }
  return cache
}

export function useProviderKind(kind: ProviderKind): ProviderKindView | null {
  const [view, setView] = useState<ProviderKindView | null>(null)
  useEffect(() => {
    let alive = true
    void loadProviderCatalog().then((kinds) => {
      if (alive) setView(kinds?.[kind] ?? null)
    })
    return () => {
      alive = false
    }
  }, [kind])
  return view
}

export function ProviderSelect({
  kind,
  value,
  onChange,
  label = "Nhà cung cấp",
  disabled = false,
}: {
  kind: ProviderKind
  value: string
  onChange: (key: string) => void
  label?: string
  disabled?: boolean
}) {
  const view = useProviderKind(kind)
  const theoTiem = view?.order.map((k) => view.providers.find((p) => p.key === k)?.label ?? k).join(" → ")
  return (
    <label className="flex w-full flex-col gap-1 text-[11.5px] text-text-muted">
      <span className="font-bold text-text">{label}</span>
      <select
        className="w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-xs text-text"
        value={value}
        disabled={disabled || !view}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Theo thứ tự của tiệm{theoTiem ? ` (${theoTiem})` : ""}</option>
        {view?.providers.map((p) => (
          <option key={p.key} value={p.key}>
            {p.label} — {p.vendor}
            {p.configured ? "" : " (chưa cấu hình khoá)"}
          </option>
        ))}
      </select>
      {view?.local_fallback && (
        <span>Mọi bên lỗi → dự phòng: {view.local_fallback.label} (hoàn phần chênh credit).</span>
      )}
    </label>
  )
}
