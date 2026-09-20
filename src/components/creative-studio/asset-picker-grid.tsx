/**
 * AssetPickerGrid — Grid hiển thị ảnh để chọn
 *
 * Tái sử dụng cho cả M04a (chọn ảnh gốc) và SourcePicker (chọn
 * ảnh gốc khi Skip).
 */

"use client"

import { Image as ImageIcon, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { AssetItem, MasterItem } from "./types"

// ============================================================
// AssetPickerGrid (ORIGINAL assets)
// ============================================================

interface AssetPickerGridProps {
  assets: AssetItem[]
  selectedId: string
  onSelect: (id: string) => void
  loading?: boolean
  label?: string
  maxHeight?: string
  badgeLabel?: string
}

export function AssetPickerGrid({
  assets,
  selectedId,
  onSelect,
  loading = false,
  label = "Chọn từ kho ảnh",
  maxHeight = "340px",
  badgeLabel = "Ảnh gốc",
}: AssetPickerGridProps) {
  if (loading) {
    return (
      <div className="text-center py-6 text-sm text-text-muted flex items-center justify-center gap-2">
        <Loader2 size={16} className="animate-spin" />
        Đang tải danh sách ảnh từ kho...
      </div>
    )
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-4 text-[13px] text-text-muted">
        Kho chưa có ảnh nào.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          {label} ({assets.length})
        </div>
        <span className="text-[11px] text-text-muted">Click chọn ảnh để tối ưu</span>
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto p-1"
        style={{ maxHeight }}
      >
        {assets.map((a) => (
          <label
            key={a.id}
            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition cursor-pointer ${
              selectedId === a.id
                ? "border-primary bg-primary/5 shadow-xs"
                : "border-border bg-surface hover:border-text-muted/40"
            }`}
          >
            <input
              type="radio"
              name="asset"
              checked={selectedId === a.id}
              onChange={() => onSelect(a.id)}
              className="accent-primary h-4 w-4 flex-shrink-0"
            />
            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-surface-alt flex items-center justify-center border border-border relative">
              {a.url ? (
                <img
                  src={a.url}
                  alt={a.name}
                  className="h-full w-full object-cover rounded-md"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
              ) : (
                <ImageIcon size={20} strokeWidth={1.5} className="text-text-muted" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold truncate text-text" title={a.name}>
                {a.name}
              </div>
              <div className="text-[11px] text-text-muted truncate mt-0.5">
                Mã: {a.id.slice(0, 8).toUpperCase()}
              </div>
            </div>
            <Badge tone="neutral" className="flex-shrink-0 text-[10px]">{badgeLabel}</Badge>
          </label>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// MasterPickerCard (MASTER assets — compact display)
// ============================================================

interface MasterPickerCardProps {
  masters: MasterItem[]
  selectedId: string
  onSelect: (id: string) => void
}

export function MasterPickerCard({ masters, selectedId, onSelect }: MasterPickerCardProps) {
  if (masters.length === 0) return null

  const activeMaster = masters.find((m) => m.id === selectedId) ?? masters[0]!

  return (
    <div className="w-full p-4.5 border border-border bg-surface rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-border bg-surface-alt flex items-center justify-center relative shadow-xs">
          {activeMaster.url ? (
            <img
              src={activeMaster.url}
              alt={activeMaster.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon size={24} className="text-text-muted" />
          )}
          <div className="absolute top-1 right-1 rounded-full bg-success-bg p-0.5 text-secondary">
            <span className="text-[8px] font-bold">✓</span>
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              Master Image nguồn
            </span>
            <Badge tone="success" className="text-[10px]">Đã duyệt</Badge>
          </div>
          <div className="text-[14.5px] font-extrabold text-text truncate mt-0.5">
            {activeMaster.name}
          </div>
          <div className="text-[11.5px] text-text-muted mt-0.5">
            Mã ảnh: {activeMaster.id.slice(0, 8).toUpperCase()}
          </div>
        </div>
      </div>

      {masters.length > 1 && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <select
            value={selectedId || activeMaster.id}
            onChange={(e) => onSelect(e.target.value)}
            aria-label="Chọn Master Image nguồn"
            className="h-9 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-text outline-none focus:border-primary"
          >
            {masters.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
