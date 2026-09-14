"use client"

import React from "react"
import { Check, Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface StudioVariantItem {
  id: string
  name: string
  thumbnailUrl: string
  description: string
  tag?: string
}

export interface StudioVariantCardProps {
  variants: StudioVariantItem[]
  selectedId?: string
  onSelectVariant: (id: string) => void
}

/**
 * StudioVariantCard (Thẻ chọn biến thể bối cảnh studio M04b)
 */
export function StudioVariantCard({
  variants,
  selectedId,
  onSelectVariant,
}: StudioVariantCardProps) {
  return (
    <Card className="border border-border bg-card p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-text-muted">M04b Background Presets</div>
          <div className="text-[16px] font-extrabold text-text">Chọn bối cảnh không gian</div>
        </div>
        <Badge tone="neutral" className="gap-1">
          <Sparkles size={12} />
          {variants.length} Bối cảnh có sẵn
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {variants.map((item) => {
          const isSelected = item.id === selectedId
          return (
            <div
              key={item.id}
              onClick={() => onSelectVariant(item.id)}
              className={`group relative cursor-pointer overflow-hidden rounded-xl border p-2 transition-all ${
                isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border hover:border-text-muted bg-background"
              }`}
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
                <img
                  src={item.thumbnailUrl}
                  alt={item.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {isSelected && (
                  <div className="absolute top-2 right-2 rounded-full bg-primary p-1 text-white shadow">
                    <Check size={12} />
                  </div>
                )}
                {item.tag && (
                  <div className="absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                    {item.tag}
                  </div>
                )}
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold text-text truncate">{item.name}</div>
                <div className="text-[11px] text-text-muted truncate">{item.description}</div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
