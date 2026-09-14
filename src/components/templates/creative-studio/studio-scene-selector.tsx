"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Camera, Sun, TreePine, Palette } from "lucide-react"

export interface StudioScenePreset {
  id: string
  name: string
  desc: string
  badge: string
  colorPreview: string
  icon: React.ElementType
}

export const STUDIO_SCENE_PRESETS: StudioScenePreset[] = [
  {
    id: "warm_gray",
    name: "Studio Xám Ấm (Hàn Quốc)",
    desc: "Softbox 45° từ trên-trái, khử viền rèm cũ, đổ bóng 2 tầng tiếp xúc tự nhiên.",
    badge: "Khuyên dùng",
    colorPreview: "linear-gradient(135deg, #fcfaf6 0%, #ebe7e0 100%)",
    icon: Sparkles,
  },
  {
    id: "off_white",
    name: "Studio Trắng Kem (E-commerce)",
    desc: "Phông trắng ngà softbox dải rộng, chuẩn thương mại bán hàng đa kênh & catalog.",
    badge: "Chuẩn TMĐT",
    colorPreview: "linear-gradient(135deg, #ffffff 0%, #f4f2ec 100%)",
    icon: Sun,
  },
  {
    id: "lifestyle_clean",
    name: "Ảnh Mộc Chân Thực (Giữ Nền Gốc)",
    desc: "Giữ 100% không gian phòng/rèm chụp thực tế, chỉ tẩy sạch logo, tem nhãn & nâng sáng.",
    badge: "Chân thực 100%",
    colorPreview: "linear-gradient(135deg, #eae8e1 0%, #d8d3c5 100%)",
    icon: Camera,
  },
  {
    id: "wood_warm",
    name: "Studio Gỗ Ấm (Vintage Florist)",
    desc: "Tông màu gỗ sồi và nắng ấm dịu nhẹ, phong cách tiệm hoa nghệ thuật thủ công.",
    badge: "Ấm cúng",
    colorPreview: "linear-gradient(135deg, #f7efe6 0%, #e0d0be 100%)",
    icon: TreePine,
  },
  {
    id: "boutique_bokeh",
    name: "Không Gian Bokeh (Tiệm Hoa)",
    desc: "Hiệu ứng xóa phông Bokeh quang học f/1.8 với ánh sáng ấm áp, phong cách nghệ thuật.",
    badge: "Nhiếp ảnh f/1.8",
    colorPreview: "linear-gradient(135deg, #fbf4ec 0%, #d8c3ad 100%)",
    icon: Sparkles,
  },
]

export interface StudioSceneSelectorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function StudioSceneSelector({
  value,
  onChange,
  disabled = false,
}: StudioSceneSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Palette className="h-3.5 w-3.5 text-red-600" />
          Bối cảnh Studio & Phong cách (Scene Presets)
        </label>
        <span className="text-[11px] text-slate-600">4 phong cách</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {STUDIO_SCENE_PRESETS.map((preset) => {
          const isSelected = value === preset.id
          const Icon = preset.icon

          return (
            <button
              key={preset.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(preset.id)}
              className={`group relative flex flex-col items-start p-3 rounded-xl border text-left transition-all duration-200 ${
                isSelected
                  ? "border-red-500 bg-red-50/40 shadow-sm ring-1 ring-red-400"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
              } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border border-slate-300 shadow-inner flex-shrink-0"
                    style={{ background: preset.colorPreview }}
                  />
                  <span
                    className={`text-xs font-bold ${
                      isSelected ? "text-red-950" : "text-slate-800"
                    }`}
                  >
                    {preset.name}
                  </span>
                </div>
                <Badge
                  tone={isSelected ? "accent" : "neutral"}
                  className="text-[10px] py-0 px-1.5 font-semibold"
                >
                  {preset.badge}
                </Badge>
              </div>

              <p className="text-[11.5px] leading-relaxed text-slate-500">
                {preset.desc}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
