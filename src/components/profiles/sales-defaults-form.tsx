"use client"

import React, { useState, useEffect } from "react"
import {
  Gift,
  ShieldCheck,
  Trash2,
  Check,
  CheckCircle2,
  Sparkles,
  Palette,
  Building2,
} from "lucide-react"
import type { BrandProfileDetail } from "@/modules/profiles/use-cases/get-brand-profile"
import type { UpsertBrandProfileInput } from "@/modules/profiles/infra/brand-profile-repository"
import {
  FLORIST_FREE_GIFTS_CATALOG,
  FLORIST_GUARANTEES_CATALOG,
  FLORIST_STRATEGY_PRESETS,
} from "@/modules/profiles/domain/florist-advisor-catalog"
import { AiRewriteInput } from "./ai-rewrite-input"

export interface SalesDefaultsFormProps {
  initialBrandData: BrandProfileDetail | null
  onSave: (data: UpsertBrandProfileInput) => Promise<boolean>
  saving: boolean
}

export function SalesDefaultsForm({
  initialBrandData,
  onSave,
  saving,
}: SalesDefaultsFormProps) {
  const [gifts, setGifts] = useState<string[]>([])
  const [guarantees, setGuarantees] = useState<string[]>([])
  const [customGift, setCustomGift] = useState("")
  const [customGuarantee, setCustomGuarantee] = useState("")
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    const offers = (initialBrandData?.default_offers as {
      free_gifts?: string[]
      guarantees?: string[]
    } | null) ?? null
    const legacyCta = (initialBrandData?.cta_templates as {
      free_gifts?: string[]
      guarantees?: string[]
    } | null) ?? null

    const giftsSource = offers?.free_gifts ?? legacyCta?.free_gifts
    if (Array.isArray(giftsSource) && giftsSource.length > 0) {
      setGifts(giftsSource)
    } else {
      setGifts(FLORIST_STRATEGY_PRESETS[0]?.freeGifts ?? [])
    }

    const guaranteesSource = offers?.guarantees ?? legacyCta?.guarantees
    if (Array.isArray(guaranteesSource) && guaranteesSource.length > 0) {
      setGuarantees(guaranteesSource)
    } else {
      setGuarantees(FLORIST_STRATEGY_PRESETS[0]?.guarantees ?? [])
    }
  }, [initialBrandData])

  const applyPreset = (presetId: string) => {
    const preset = FLORIST_STRATEGY_PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    setGifts(preset.freeGifts)
    setGuarantees(preset.guarantees)
  }

  const toggleGift = (label: string) => {
    setGifts((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    )
  }

  const toggleGuarantee = (label: string) => {
    setGuarantees((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    )
  }

  const handleAddCustomGift = () => {
    const trimmed = customGift.trim()
    if (!trimmed || gifts.includes(trimmed)) return
    setGifts((prev) => [...prev, trimmed])
    setCustomGift("")
  }

  const handleAddCustomGuarantee = () => {
    const trimmed = customGuarantee.trim()
    if (!trimmed || guarantees.includes(trimmed)) return
    setGuarantees((prev) => [...prev, trimmed])
    setCustomGuarantee("")
  }

  const handleRemoveGift = (index: number) => {
    setGifts((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRemoveGuarantee = (index: number) => {
    setGuarantees((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!initialBrandData) return

    const payload: UpsertBrandProfileInput = {
      primary_color: initialBrandData.primary_color,
      secondary_color: initialBrandData.secondary_color,
      accent_color: initialBrandData.accent_color,
      background_color: initialBrandData.background_color,
      text_color: initialBrandData.text_color,
      font_heading: initialBrandData.font_heading,
      font_body: initialBrandData.font_body,
      logo_asset_id: initialBrandData.logo_asset_id,
      brand_assets: initialBrandData.brand_assets,
      tone_of_voice: initialBrandData.tone_of_voice,
      hashtags: initialBrandData.hashtags,
      cta_templates: initialBrandData.cta_templates,
      forbidden_styles: initialBrandData.forbidden_styles,
      default_offers: {
        free_gifts: gifts.filter((g) => g.trim().length > 0),
        guarantees: guarantees.filter((g) => g.trim().length > 0),
      },
    }

    const ok = await onSave(payload)
    if (ok) {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. KHỐI CỐ VẤN: GÓI CHIẾN LƯỢC 1-CLICK */}
      <div className="rounded-2xl border border-primary/20 bg-surface p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-border mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-body font-bold text-text">
              Gợi ý Cố vấn Chiến lược Cửa hàng Hoa (1-Click Strategy Presets)
            </h3>
            <p className="text-caption text-text-muted">
              Chọn định hướng phù hợp nhất với phong cách kinh doanh của tiệm bạn để tự động nạp chính sách chuẩn
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {FLORIST_STRATEGY_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className="rounded-xl border border-border bg-surface-alt/60 p-4 text-left transition-all hover:border-primary hover:bg-surface focus:outline-none"
            >
              <div className="flex items-center gap-2 mb-1.5">
                {preset.id === "preset-artisan-boutique" && <Palette size={16} className="text-primary" />}
                {preset.id === "preset-corporate-b2b" && <Building2 size={16} className="text-primary" />}
                {preset.id === "preset-gift-occasions" && <Gift size={16} className="text-primary" />}
                <span className="text-body-sm font-bold text-text">{preset.name}</span>
              </div>
              <p className="text-caption text-text-muted leading-relaxed">{preset.tagline}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 2. ĐẶC QUYỀN & QUÀ TẶNG KÈM */}
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Gift size={18} />
            </div>
            <div>
              <h3 className="text-body font-bold text-text">
                Đặc quyền & Quà tặng kèm mặc định ({gifts.length} mục đang chọn)
              </h3>
              <p className="text-caption text-text-muted">
                Tự động đưa vào Thẻ chào hàng, Chân trang E-Catalog và Kịch bản tư vấn Zalo
              </p>
            </div>
          </div>
        </div>

        {/* Lưới Checkbox Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {FLORIST_FREE_GIFTS_CATALOG.map((item) => {
            const isChecked = gifts.includes(item.label)
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleGift(item.label)}
                className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                  isChecked
                    ? "border-primary bg-primary/5 shadow-xs"
                    : "border-border bg-surface-alt/40 hover:border-primary/50"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    isChecked ? "border-primary bg-primary text-white" : "border-border bg-surface"
                  }`}
                >
                  {isChecked && <Check size={12} strokeWidth={3} />}
                </div>
                <div>
                  <div className="text-body-sm font-bold text-text">{item.label}</div>
                  <div className="text-caption text-text-muted mt-0.5 leading-snug">{item.description}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Ô nhập tự do kèm AI Rewrite */}
        <div className="rounded-xl border border-dashed border-border bg-surface-alt/30 p-3.5 mb-4">
          <AiRewriteInput
            value={customGift}
            onChange={setCustomGift}
            placeholder="VD: Miễn phí gói hoa bằng giấy báo vintage Ý..."
            fieldType="gift"
            label="Thêm quà tặng riêng ngoài danh mục gợi ý (Hỗ trợ AI trau chuốt câu từ):"
            onAddCustom={handleAddCustomGift}
            addButtonText="Thêm"
          />
        </div>

        {/* Danh sách các mục đang kích hoạt */}
        <div className="space-y-1.5">
          <span className="text-caption font-bold text-text-muted uppercase tracking-wider">
            Danh sách quà tặng tiệm của bạn đang áp dụng:
          </span>
          <div className="flex flex-wrap gap-2 pt-1">
            {gifts.map((gift, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1 text-caption font-semibold text-primary"
              >
                <span>{gift}</span>
                <button
                  type="button"
                  aria-label={`Xóa quà tặng ${gift}`}
                  title="Xóa mục này"
                  onClick={() => handleRemoveGift(idx)}
                  className="hover:text-danger transition-colors ml-0.5"
                >
                  <Trash2 size={13} />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. CAM KẾT CHẤT LƯỢNG & SỰ AN TÂM */}
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-body font-bold text-text">
                Cam kết Chất lượng Dịch vụ & SLA ({guarantees.length} mục đang chọn)
              </h3>
              <p className="text-caption text-text-muted">
                Tạo dựng niềm tin tuyệt đối cho khách đặt hoa online và bảo hiểm đơn hàng hỏa tốc
              </p>
            </div>
          </div>
        </div>

        {/* Lưới Checkbox Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {FLORIST_GUARANTEES_CATALOG.map((item) => {
            const isChecked = guarantees.includes(item.label)
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleGuarantee(item.label)}
                className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                  isChecked
                    ? "border-primary bg-primary/5 shadow-xs"
                    : "border-border bg-surface-alt/40 hover:border-primary/50"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    isChecked ? "border-primary bg-primary text-white" : "border-border bg-surface"
                  }`}
                >
                  {isChecked && <Check size={12} strokeWidth={3} />}
                </div>
                <div>
                  <div className="text-body-sm font-bold text-text">{item.label}</div>
                  <div className="text-caption text-text-muted mt-0.5 leading-snug">{item.description}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Ô nhập tự do kèm AI Rewrite */}
        <div className="rounded-xl border border-dashed border-border bg-surface-alt/30 p-3.5 mb-4">
          <AiRewriteInput
            value={customGuarantee}
            onChange={setCustomGuarantee}
            placeholder="VD: Tặng kèm thiệp chữ nổi dập tay cho đơn từ 1.500.000đ..."
            fieldType="guarantee"
            label="Thêm cam kết dịch vụ riêng của tiệm (Hỗ trợ AI trau chuốt câu từ):"
            onAddCustom={handleAddCustomGuarantee}
            addButtonText="Thêm"
          />
        </div>

        {/* Danh sách các mục đang kích hoạt */}
        <div className="space-y-1.5">
          <span className="text-caption font-bold text-text-muted uppercase tracking-wider">
            Danh sách cam kết tiệm của bạn đang áp dụng:
          </span>
          <div className="flex flex-wrap gap-2 pt-1">
            {guarantees.map((guar, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1 text-caption font-semibold text-primary"
              >
                <span>{guar}</span>
                <button
                  type="button"
                  aria-label={`Xóa cam kết ${guar}`}
                  title="Xóa mục này"
                  onClick={() => handleRemoveGuarantee(idx)}
                  className="hover:text-danger transition-colors ml-0.5"
                >
                  <Trash2 size={13} />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 4. NÚT LƯU */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-body-sm font-bold text-white shadow-xs transition-opacity hover:opacity-95 disabled:opacity-50"
        >
          {saving ? (
            <span>Đang lưu...</span>
          ) : saveSuccess ? (
            <>
              <CheckCircle2 size={16} className="text-white" />
              <span>Đã lưu chính sách thành công!</span>
            </>
          ) : (
            <>
              <Check size={16} />
              <span>Lưu chính sách & cam kết</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
