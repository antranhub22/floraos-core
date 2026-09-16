"use client"

import React, { useState, useEffect } from "react"
import { Palette, Type, Sparkles, ShieldAlert, Check, RefreshCw } from "lucide-react"
import type { BrandProfileDetail } from "@/modules/profiles/use-cases/get-brand-profile"
import type { UpsertBrandProfileInput } from "@/modules/profiles/infra/brand-profile-repository"
import { isValidHexColor } from "@/modules/profiles/domain/profile-rules"

export interface BrandProfileFormProps {
  initialData: BrandProfileDetail | null
  onSave: (data: UpsertBrandProfileInput) => Promise<boolean>
  saving: boolean
}

interface ColorFieldConfig {
  key: "primary_color" | "secondary_color" | "accent_color" | "background_color" | "text_color"
  label: string
  description: string
  defaultColor: string
}

const COLOR_FIELDS: ColorFieldConfig[] = [
  {
    key: "primary_color",
    label: "Màu chủ đạo (Primary)",
    description: "Nút bấm, thanh tiêu đề, viền nổi bật",
    defaultColor: "#e11d48",
  },
  {
    key: "secondary_color",
    label: "Màu phụ (Secondary)",
    description: "Huy hiệu, thẻ phụ, nhãn trạng thái",
    defaultColor: "#fda4af",
  },
  {
    key: "accent_color",
    label: "Màu nhấn (Accent)",
    description: "Giá ưu đãi, thông báo sốt dẻo, ngôi sao đánh giá",
    defaultColor: "#f59e0b",
  },
  {
    key: "background_color",
    label: "Màu nền trang (Background)",
    description: "Nền E-Catalog, nền Landing Page",
    defaultColor: "#ffffff",
  },
  {
    key: "text_color",
    label: "Màu chữ chính (Text)",
    description: "Văn bản nội dung và tiêu đề chính",
    defaultColor: "#111827",
  },
]

const FONT_OPTIONS = [
  { label: "Inter (Hiện đại, rõ nét)", value: "Inter" },
  { label: "Playfair Display (Sang trọng, cổ điển)", value: "Playfair Display" },
  { label: "Montserrat (Mạnh mẽ, phong cách)", value: "Montserrat" },
  { label: "Merriweather (Thanh lịch, dễ đọc)", value: "Merriweather" },
  { label: "Lora (Thơ mộng, nghệ thuật)", value: "Lora" },
]

const TONE_OPTIONS = [
  { label: "Thơ mộng & Lãng mạn (Dành cho hoa tình yêu, Valentine)", value: "romantic" },
  { label: "Sang trọng & Đẳng cấp (Dành cho hoa sự kiện, đối tác)", value: "luxury" },
  { label: "Ấm áp & Thân thiện (Dành cho hoa gia đình, sinh nhật)", value: "warm" },
  { label: "Trẻ trung & Năng động (Dành cho giới trẻ, chúc mừng)", value: "modern" },
]

export function BrandProfileForm({ initialData, onSave, saving }: BrandProfileFormProps) {
  const [colors, setColors] = useState({
    primary_color: "#e11d48",
    secondary_color: "#fda4af",
    accent_color: "#f59e0b",
    background_color: "#ffffff",
    text_color: "#111827",
  })
  const [fontHeading, setFontHeading] = useState("Playfair Display")
  const [fontBody, setFontBody] = useState("Inter")
  const [logoAssetId, setLogoAssetId] = useState("")
  const [toneOfVoice, setToneOfVoice] = useState("romantic")
  const [hashtagsText, setHashtagsText] = useState("#hoatuoi, #tiemhoa, #hoathietke, #hoasinhnhat")
  const [ctaText, setCtaText] = useState("Ghé thăm tiệm hoa hoặc nhắn Zalo để được nghệ nhân tư vấn riêng!")
  const [forbiddenWords, setForbiddenWords] = useState("hoa rẻ, xả hàng tồn, phá giá")
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialData) {
      setColors({
        primary_color: initialData.primary_color || "#e11d48",
        secondary_color: initialData.secondary_color || "#fda4af",
        accent_color: initialData.accent_color || "#f59e0b",
        background_color: initialData.background_color || "#ffffff",
        text_color: initialData.text_color || "#111827",
      })
      setFontHeading(initialData.font_heading || "Playfair Display")
      setFontBody(initialData.font_body || "Inter")
      setLogoAssetId(initialData.logo_asset_id || "")
      setToneOfVoice(initialData.tone_of_voice || "romantic")

      if (initialData.hashtags) {
        const tags = Array.isArray(initialData.hashtags)
          ? initialData.hashtags
          : (initialData.hashtags as any)?.default || []
        if (Array.isArray(tags) && tags.length > 0) {
          setHashtagsText(tags.join(", "))
        }
      }

      if (initialData.cta_templates) {
        const cta = (initialData.cta_templates as any)?.default || ""
        if (cta) setCtaText(cta)
      }

      if (initialData.forbidden_styles) {
        const banned = (initialData.forbidden_styles as any)?.banned_words || []
        if (Array.isArray(banned) && banned.length > 0) {
          setForbiddenWords(banned.join(", "))
        }
      }
    }
  }, [initialData])

  const handleColorChange = (key: keyof typeof colors, val: string) => {
    setColors((prev) => ({ ...prev, [key]: val }))
    if (errors[key] && isValidHexColor(val)) {
      setErrors((prev) => {
        const clone = { ...prev }
        delete clone[key]
        return clone
      })
    }
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    for (const [key, val] of Object.entries(colors)) {
      if (val && !isValidHexColor(val)) {
        errs[key] = "Mã màu phải có dạng #RGB hoặc #RRGGBB"
      }
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const hashtagsList = hashtagsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    const bannedList = forbiddenWords
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    const payload: UpsertBrandProfileInput = {
      primary_color: colors.primary_color,
      secondary_color: colors.secondary_color,
      accent_color: colors.accent_color,
      background_color: colors.background_color,
      text_color: colors.text_color,
      font_heading: fontHeading,
      font_body: fontBody,
      logo_asset_id: logoAssetId.trim() || null,
      tone_of_voice: toneOfVoice,
      hashtags: { default: hashtagsList },
      cta_templates: { default: ctaText.trim() },
      forbidden_styles: { banned_words: bannedList },
    }

    await onSave(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Khối 1: Bảng 5 mã màu thương hiệu */}
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500/10 text-pink-600">
              <Palette size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text">Bảng màu nhận diện thương hiệu (5 Mã Hex SSOT)</h3>
              <p className="text-xs text-text-muted">Áp dụng trực tiếp vào E-Catalog, Video Studio và Thẻ chào sản phẩm</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              setColors({
                primary_color: "#e11d48",
                secondary_color: "#fda4af",
                accent_color: "#f59e0b",
                background_color: "#ffffff",
                text_color: "#111827",
              })
            }
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors"
          >
            <RefreshCw size={13} />
            <span>Mặc định tiệm hoa</span>
          </button>
        </div>

        {/* Live Color Preview Bar */}
        <div className="mb-6 p-4 rounded-xl border border-border bg-surface-alt flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs font-semibold text-text-muted">Xem trước phối màu thương hiệu:</span>
          <div className="flex items-center gap-2">
            <div
              className="px-4 py-2 rounded-lg text-xs font-bold text-white shadow-xs"
              style={{ backgroundColor: colors.primary_color }}
            >
              Nút chính
            </div>
            <div
              className="px-3 py-1.5 rounded-md text-xs font-semibold border"
              style={{
                backgroundColor: colors.secondary_color,
                color: colors.text_color,
                borderColor: colors.primary_color,
              }}
            >
              Huy hiệu
            </div>
            <div
              className="px-2.5 py-1 rounded text-xs font-extrabold text-white"
              style={{ backgroundColor: colors.accent_color }}
            >
              Hot Sale
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COLOR_FIELDS.map((cfg) => {
            const currentVal = colors[cfg.key]
            const hasErr = Boolean(errors[cfg.key])

            return (
              <div key={cfg.key} className="rounded-xl border border-border/80 bg-surface-alt/40 p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-text">{cfg.label}</span>
                  <div
                    className="h-5 w-5 rounded-full border border-black/10 shadow-xs"
                    style={{ backgroundColor: isValidHexColor(currentVal) ? currentVal : "#cccccc" }}
                  />
                </div>
                <p className="text-[11px] text-text-muted mb-3 leading-tight">{cfg.description}</p>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={isValidHexColor(currentVal) ? currentVal : "#000000"}
                    onChange={(e) => handleColorChange(cfg.key, e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={currentVal}
                    onChange={(e) => handleColorChange(cfg.key, e.target.value)}
                    placeholder="#e11d48"
                    className={`flex-1 rounded-lg border bg-surface px-2.5 py-1.5 text-xs font-mono font-medium text-text uppercase ${
                      hasErr ? "border-red-500 ring-1 ring-red-500/20" : "border-border focus:border-primary"
                    }`}
                  />
                </div>
                {hasErr && <p className="mt-1 text-[10px] text-red-500">{errors[cfg.key]}</p>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Khối 2: Typography & Logo */}
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-border mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
            <Type size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text">Kiểu chữ & Logo thương hiệu</h3>
            <p className="text-xs text-text-muted">Định hình phong thái truyền thông qua phông chữ và dấu ấn logo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">
              Phông chữ tiêu đề (Heading Font)
            </label>
            <select
              value={fontHeading}
              onChange={(e) => setFontHeading(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs sm:text-sm text-text transition-all focus:border-primary focus:outline-none"
            >
              {FONT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">
              Phông chữ nội dung (Body Font)
            </label>
            <select
              value={fontBody}
              onChange={(e) => setFontBody(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs sm:text-sm text-text transition-all focus:border-primary focus:outline-none"
            >
              {FONT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-text mb-1.5">
              Logo thương hiệu (Đường dẫn URL ảnh PNG trong suốt hoặc Asset ID)
            </label>
            <input
              type="text"
              value={logoAssetId}
              onChange={(e) => setLogoAssetId(e.target.value)}
              placeholder="https://... hoặc mã asset logo của tiệm"
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs sm:text-sm text-text transition-all focus:border-primary focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-text-muted">
              Logo này sẽ được tự động đóng dấu Watermark mờ lên video TikTok/Reels và hiển thị trên E-Catalog
            </p>
          </div>
        </div>
      </div>

      {/* Khối 3: Giọng văn thương hiệu & Rào chắn nội dung AI */}
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-border mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text">Giọng văn AI & Rào chắn thương hiệu</h3>
            <p className="text-xs text-text-muted">Khóa chặt hành vi của AI Gateway khi tự động sinh bài viết tiếp thị</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">
              Định vị giọng điệu chính (Tone of Voice)
            </label>
            <select
              value={toneOfVoice}
              onChange={(e) => setToneOfVoice(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs sm:text-sm text-text transition-all focus:border-primary focus:outline-none"
            >
              {TONE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">
              Bộ Hashtags mặc định (phân cách bằng dấu phẩy)
            </label>
            <input
              type="text"
              value={hashtagsText}
              onChange={(e) => setHashtagsText(e.target.value)}
              placeholder="#hoatuoi, #tiemhoa, #hoathietke"
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs sm:text-sm text-text transition-all focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">
              Mẫu câu kêu gọi hành động mặc định (Default Call-to-Action)
            </label>
            <input
              type="text"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              placeholder="Nhắn tin ngay cho tiệm để nhận ưu đãi cắm hoa theo yêu cầu"
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs sm:text-sm text-text transition-all focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <ShieldAlert size={14} className="text-amber-500" />
              <label className="text-xs font-semibold text-text">
                Từ cấm & Phong cách cấm kỵ (Forbidden Words - phân cách bằng dấu phẩy)
              </label>
            </div>
            <input
              type="text"
              value={forbiddenWords}
              onChange={(e) => setForbiddenWords(e.target.value)}
              placeholder="hoa rẻ, phá giá, xả hàng tồn..."
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs sm:text-sm text-text transition-all focus:border-primary focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-text-muted">
              AI Content Engine sẽ tự động loại bỏ tuyệt đối các từ này trong mọi bài đăng bán hoa
            </p>
          </div>
        </div>
      </div>

      {/* Nút lưu ở chân form */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold shadow-md hover:bg-primary/95 transition-all disabled:opacity-60"
        >
          <Check size={16} />
          <span>{saving ? "Đang lưu..." : "Lưu nhận diện thương hiệu"}</span>
        </button>
      </div>
    </form>
  )
}
