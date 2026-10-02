"use client"

import React from "react"
import { Calendar, Palette } from "lucide-react"
import { CAMPAIGN_OCCASIONS, CAMPAIGN_ARCHETYPES } from "./landing-campaign-constants"

interface CampaignOccasionStylePickerProps {
  selectedOccasion: string
  onOccasionChange: (id: string) => void
  selectedArchetype: string
  onArchetypeChange: (id: string) => void
}

export function CampaignOccasionStylePicker({
  selectedOccasion,
  onOccasionChange,
  selectedArchetype,
  onArchetypeChange,
}: CampaignOccasionStylePickerProps) {
  return (
    <div className="space-y-4">
      {/* 1. Chọn dịp */}
      <div>
        <label className="block text-xs font-bold text-text mb-2 flex items-center gap-1.5">
          <Calendar size={14} className="text-primary" />
          <span>1. Chọn dịp sự kiện</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CAMPAIGN_OCCASIONS.map((occ) => (
            <button
              key={occ.id}
              type="button"
              onClick={() => onOccasionChange(occ.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedOccasion === occ.id
                  ? "border-primary bg-primary-bg/30 text-primary font-bold shadow-xs"
                  : "border-border bg-surface text-text hover:border-border-hover text-xs font-medium"
              }`}
            >
              <div className="text-xs">{occ.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Chọn phong cách */}
      <div>
        <label className="block text-xs font-bold text-text mb-2 flex items-center gap-1.5">
          <Palette size={14} className="text-primary" />
          <span>2. Phong cách thiết kế trang</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {CAMPAIGN_ARCHETYPES.map((arch) => (
            <button
              key={arch.id}
              type="button"
              onClick={() => onArchetypeChange(arch.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedArchetype === arch.id
                  ? "border-primary bg-primary-bg/30 shadow-xs"
                  : "border-border bg-surface hover:border-border-hover"
              }`}
            >
              <div className="text-xs font-bold text-text">{arch.name}</div>
              <div className="text-caption text-text-muted mt-0.5">{arch.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
