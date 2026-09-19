"use client"

import React, { useState, useEffect } from "react"
import { Gift, ShieldCheck, Plus, Trash2, Check, RefreshCw } from "lucide-react"
import type { BrandProfileDetail } from "@/modules/profiles/use-cases/get-brand-profile"
import type { UpsertBrandProfileInput } from "@/modules/profiles/infra/brand-profile-repository"
import { DEFAULT_FREE_GIFTS, DEFAULT_GUARANTEES } from "@/modules/products/domain/sales-pitch-template"

export interface SalesDefaultsFormProps {
  initialBrandData: BrandProfileDetail | null
  onSave: (data: UpsertBrandProfileInput) => Promise<boolean>
  saving: boolean
}

export function SalesDefaultsForm({ initialBrandData, onSave, saving }: SalesDefaultsFormProps) {
  const [gifts, setGifts] = useState<string[]>(DEFAULT_FREE_GIFTS)
  const [guarantees, setGuarantees] = useState<string[]>(DEFAULT_GUARANTEES)

  useEffect(() => {
    // Từ 17/09 (nợ #102), quà tặng/cam kết đọc từ `default_offers` — trường
    // riêng, tách khỏi `cta_templates` (nay đúng nghĩa câu kêu gọi hành
    // động, dùng ở product-copy-adapter.ts). Tổ chức đã lưu TRƯỚC 17/09 vẫn
    // còn dữ liệu ở vị trí cũ (`cta_templates.free_gifts`/`.guarantees`) —
    // đọc dự phòng từ đó khi `default_offers` chưa có, để không mất dữ liệu
    // AVI GIFT đã nhập qua form này trước bản sửa.
    const offers = (initialBrandData?.default_offers as { free_gifts?: string[]; guarantees?: string[] } | null) ?? null
    const legacyCta = (initialBrandData?.cta_templates as { free_gifts?: string[]; guarantees?: string[] } | null) ?? null

    const giftsSource = offers?.free_gifts ?? legacyCta?.free_gifts
    if (Array.isArray(giftsSource) && giftsSource.length > 0) {
      setGifts(giftsSource)
    }
    const guaranteesSource = offers?.guarantees ?? legacyCta?.guarantees
    if (Array.isArray(guaranteesSource) && guaranteesSource.length > 0) {
      setGuarantees(guaranteesSource)
    }
  }, [initialBrandData])

  const handleAddGift = () => {
    setGifts((prev) => [...prev, ""])
  }

  const handleUpdateGift = (index: number, val: string) => {
    setGifts((prev) => {
      const clone = [...prev]
      clone[index] = val
      return clone
    })
  }

  const handleRemoveGift = (index: number) => {
    setGifts((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddGuarantee = () => {
    setGuarantees((prev) => [...prev, ""])
  }

  const handleUpdateGuarantee = (index: number, val: string) => {
    setGuarantees((prev) => {
      const clone = [...prev]
      clone[index] = val
      return clone
    })
  }

  const handleRemoveGuarantee = (index: number) => {
    setGuarantees((prev) => prev.filter((_, i) => i !== index))
  }

  const handleReset = () => {
    setGifts([...DEFAULT_FREE_GIFTS])
    setGuarantees([...DEFAULT_GUARANTEES])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanGifts = gifts.map((g) => g.trim()).filter(Boolean)
    const cleanGuarantees = guarantees.map((g) => g.trim()).filter(Boolean)

    const payload: UpsertBrandProfileInput = {
      primary_color: initialBrandData?.primary_color ?? null,
      secondary_color: initialBrandData?.secondary_color ?? null,
      accent_color: initialBrandData?.accent_color ?? null,
      background_color: initialBrandData?.background_color ?? null,
      text_color: initialBrandData?.text_color ?? null,
      font_heading: initialBrandData?.font_heading ?? null,
      font_body: initialBrandData?.font_body ?? null,
      logo_asset_id: initialBrandData?.logo_asset_id ?? null,
      tone_of_voice: initialBrandData?.tone_of_voice ?? null,
      hashtags: (initialBrandData?.hashtags as Record<string, unknown> | null) ?? null,
      forbidden_styles: (initialBrandData?.forbidden_styles as Record<string, unknown> | null) ?? null,
      // Từ 17/09 (nợ #102): quà tặng/cam kết ghi vào `default_offers`, KHÔNG
      // còn ghi đè vào `cta_templates` — giữ nguyên `cta_templates` hiện có
      // (câu kêu gọi hành động, nếu tổ chức đã cấu hình) thay vì đè mất.
      cta_templates: (initialBrandData?.cta_templates as Record<string, unknown> | null) ?? null,
      default_offers: {
        free_gifts: cleanGifts,
        guarantees: cleanGuarantees,
      },
    }

    await onSave(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Khối 1: Quà tặng kèm mặc định */}
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500/10 text-pink-600">
              <Gift size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text">Quà tặng kèm mặc định (Free Gifts)</h3>
              <p className="text-xs text-text-muted">Tự động nạp vào Thẻ Chào Khách A6 và kịch bản tư vấn Zalo</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddGift}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-alt text-xs font-semibold text-text transition-colors"
          >
            <Plus size={14} className="text-primary" />
            <span>Thêm quà tặng</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {gifts.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-alt text-[11px] font-bold text-text-muted flex-shrink-0">
                {index + 1}
              </span>
              <input
                type="text"
                value={item}
                onChange={(e) => handleUpdateGift(index, e.target.value)}
                placeholder="Nhập nội dung quà tặng kèm..."
                className="flex-1 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs sm:text-sm text-text transition-all focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleRemoveGift(index)}
                title="Xóa quà tặng này"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {gifts.length === 0 && (
            <p className="text-xs text-text-muted italic text-center py-3">Chưa có quà tặng mặc định nào</p>
          )}
        </div>
      </div>

      {/* Khối 2: Cam kết dịch vụ vàng */}
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text">Cam kết chất lượng vàng (Guarantees)</h3>
              <p className="text-xs text-text-muted">Tạo lòng tin tuyệt đối giúp khách hàng an tâm chốt đơn</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddGuarantee}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-alt text-xs font-semibold text-text transition-colors"
          >
            <Plus size={14} className="text-emerald-600" />
            <span>Thêm cam kết</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {guarantees.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-alt text-[11px] font-bold text-text-muted flex-shrink-0">
                {index + 1}
              </span>
              <input
                type="text"
                value={item}
                onChange={(e) => handleUpdateGuarantee(index, e.target.value)}
                placeholder="Nhập nội dung cam kết..."
                className="flex-1 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs sm:text-sm text-text transition-all focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleRemoveGuarantee(index)}
                title="Xóa cam kết này"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {guarantees.length === 0 && (
            <p className="text-xs text-text-muted italic text-center py-3">Chưa có cam kết chất lượng nào</p>
          )}
        </div>
      </div>

      {/* Chân trang điều khiển */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors"
        >
          <RefreshCw size={14} />
          <span>Khôi phục cam kết & quà tặng ban đầu</span>
        </button>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold shadow-md hover:bg-primary/95 transition-all disabled:opacity-60"
        >
          <Check size={16} />
          <span>{saving ? "Đang lưu..." : "Lưu chính sách & cam kết"}</span>
        </button>
      </div>
    </form>
  )
}
