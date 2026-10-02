"use client"

import React, { useState } from "react"
import { Sparkles, Loader2, Check, ArrowRight, Wand2 } from "lucide-react"

export interface AiRewriteInputProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  fieldType?: "gift" | "guarantee" | "cta" | "description" | "general"
  label?: string
  helperText?: string
  onAddCustom?: () => void
  addButtonText?: string
}

export function AiRewriteInput({
  value,
  onChange,
  placeholder = "Nhập nội dung...",
  fieldType = "general",
  label,
  helperText,
  onAddCustom,
  addButtonText = "Thêm",
}: AiRewriteInputProps) {
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState<"luxurious" | "sweet" | "concise" | "creative">("luxurious")

  const handleRewrite = async (styleOverride?: "luxurious" | "sweet" | "concise" | "creative") => {
    if (!value.trim()) return
    const targetStyle = styleOverride || selectedStyle
    setLoading(true)
    setShowDropdown(true)

    try {
      const res = await fetch("/api/v1/content-engine/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: value.trim(),
          field_type: fieldType,
          style: targetStyle,
        }),
      })

      if (!res.ok) throw new Error("Yêu cầu viết lại không thành công")
      const data = await res.json()
      if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        setSuggestions(data.suggestions)
      } else {
        setSuggestions([value])
      }
    } catch {
      // Dự phòng tại chỗ
      setSuggestions([
        `${value} (Chuẩn thiết kế thủ công)`,
        `Đặc quyền ${value.toLowerCase()} cao cấp`,
        `${value} — Cam kết chất lượng dịch vụ hoa tươi`,
      ])
    } finally {
      setLoading(false)
    }
  }

  const applySuggestion = (text: string) => {
    onChange(text)
    setShowDropdown(false)
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-caption font-semibold text-text">
          {label}
        </label>
      )}

      <div className="flex gap-2 relative">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-xl border border-border bg-surface pl-3.5 pr-10 py-2 text-body-sm text-text focus:border-primary focus:outline-none transition-colors"
          />
          <button
            type="button"
            onClick={() => handleRewrite()}
            disabled={loading || !value.trim()}
            title="Nhờ AI trau chuốt câu từ"
            aria-label="Nhờ AI trau chuốt câu từ"
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-7 w-7 rounded-lg text-primary hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin text-primary" />
            ) : (
              <Sparkles size={15} className="text-primary" />
            )}
          </button>
        </div>

        {onAddCustom && (
          <button
            type="button"
            onClick={onAddCustom}
            disabled={!value.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-body-sm font-bold text-text hover:border-primary transition-colors disabled:opacity-40"
          >
            <Check size={15} />
            <span>{addButtonText}</span>
          </button>
        )}
      </div>

      {helperText && (
        <p className="text-caption text-text-muted">{helperText}</p>
      )}

      {/* Popover / Panel gợi ý của AI */}
      {showDropdown && (
        <div className="rounded-xl border border-primary/30 bg-surface p-3.5 shadow-md space-y-3 animate-in fade-in-50 duration-150">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-1.5 text-caption font-bold text-primary">
              <Wand2 size={14} />
              <span>Gợi ý trau chuốt bởi AI Cố Vấn:</span>
            </div>

            {/* Bộ chọn phong cách nhanh */}
            <div className="flex items-center gap-1 text-caption">
              {(
                [
                  { id: "luxurious", label: "Sang trọng" },
                  { id: "sweet", label: "Ấm áp" },
                  { id: "concise", label: "Ngắn gọn" },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedStyle(s.id)
                    handleRewrite(s.id)
                  }}
                  className={`px-2 py-0.5 rounded-md text-caption transition-colors ${
                    selectedStyle === s.id
                      ? "bg-primary text-white font-semibold"
                      : "bg-surface-alt text-text-muted hover:text-text"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-4 text-center space-y-2">
              <Loader2 size={18} className="animate-spin text-primary mx-auto" />
              <p className="text-caption text-text-muted">AI đang phân tích & trau chuốt theo tông giọng tiệm hoa...</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => applySuggestion(sug)}
                  className="w-full text-left rounded-lg p-2.5 border border-border bg-surface-alt/40 hover:border-primary hover:bg-primary/5 transition-all group flex items-start justify-between gap-2"
                >
                  <span className="text-body-sm text-text leading-snug">{sug}</span>
                  <span className="shrink-0 text-caption font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 pt-0.5">
                    <span>Chọn</span>
                    <ArrowRight size={12} />
                  </span>
                </button>
              ))}

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowDropdown(false)}
                  className="text-caption font-medium text-text-muted hover:text-text"
                >
                  Đóng gợi ý
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
