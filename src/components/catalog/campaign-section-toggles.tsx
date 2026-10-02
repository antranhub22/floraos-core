"use client"

import React from "react"
import { Sliders } from "lucide-react"
import type { EnabledSectionsConfig } from "./landing-campaign-preview"

interface CampaignSectionTogglesProps {
  enabledSections: EnabledSectionsConfig
  onChange: React.Dispatch<React.SetStateAction<EnabledSectionsConfig>>
}

const SECTION_ITEMS = [
  { id: "story", label: "Triết lý nghệ nhân" },
  { id: "perks", label: "4 Cam kết vàng" },
  { id: "process", label: "Quy trình 3 bước" },
  { id: "gallery", label: "Khoảnh khắc xưởng hoa" },
  { id: "reviews", label: "Đánh giá khách hàng" },
  { id: "faq", label: "FAQ hỏi đáp" },
  { id: "lead", label: "Bắt lead nhận voucher" },
]

export function CampaignSectionToggles({
  enabledSections,
  onChange,
}: CampaignSectionTogglesProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-text flex items-center gap-1.5">
        <Sliders size={14} className="text-primary" />
        <span>Bước 5: Bật/Tắt các phân đoạn (8 Sections)</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {SECTION_ITEMS.map((sec) => {
          const isEnabled = enabledSections[sec.id as keyof EnabledSectionsConfig]
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() =>
                onChange((prev) => ({
                  ...prev,
                  [sec.id]: !prev[sec.id as keyof EnabledSectionsConfig],
                }))
              }
              className={`px-3 py-1.5 rounded-xl border text-caption font-bold transition-all ${
                isEnabled
                  ? "border-primary bg-primary-bg/20 text-primary"
                  : "border-border bg-surface text-text-muted opacity-60"
              }`}
            >
              {isEnabled ? `✓ ${sec.label}` : `✕ ${sec.label}`}
            </button>
          )
        })}
      </div>
    </div>
  )
}
