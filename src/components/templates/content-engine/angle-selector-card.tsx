"use client"

import React from "react"
import { Heart, Award, Tag, Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"

export type ContentAngle = "emotional" | "technical" | "promotional"

export interface AngleSelectorCardProps {
  selectedAngle: ContentAngle
  onSelectAngle: (angle: ContentAngle) => void
}

/**
 * AngleSelectorCard (Thẻ chọn góc tiếp cận nội dung M06)
 */
export function AngleSelectorCard({
  selectedAngle,
  onSelectAngle,
}: AngleSelectorCardProps) {
  const angles = [
    {
      id: "emotional" as ContentAngle,
      icon: Heart,
      title: "Cảm xúc & Tình cảm",
      description: "Nhấn mạnh thông điệp yêu thương, kỷ niệm, gắn kết giữa người tặng và người nhận.",
    },
    {
      id: "technical" as ContentAngle,
      icon: Award,
      title: "Tay nghề & Đẳng cấp",
      description: "Làm nổi bật kỹ thuật cắm hoa nghệ thuật, độ tươi của hoa nhập và phối màu sang trọng.",
    },
    {
      id: "promotional" as ContentAngle,
      icon: Tag,
      title: "Ưu đãi & Kêu gọi chốt đơn",
      description: "Tập trung quà tặng kèm (thiệp, banner), freeship, ưu đãi số lượng giới hạn.",
    },
  ]

  return (
    <Card className="border border-border bg-card p-5 shadow-sm flex flex-col gap-4">
      <div>
        <div className="text-xs font-semibold text-text-muted">M06 Copywriting Angle</div>
        <div className="text-[16px] font-extrabold text-text">Chọn góc tiếp cận bài viết</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {angles.map((item) => {
          const isSelected = item.id === selectedAngle
          const Icon = item.icon
          return (
            <div
              key={item.id}
              onClick={() => onSelectAngle(item.id)}
              className={`cursor-pointer rounded-xl border p-3.5 transition-all flex flex-col gap-2 ${
                isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border hover:border-text-muted bg-background"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${isSelected ? "bg-primary text-white" : "bg-muted text-text-muted"}`}>
                  <Icon size={16} />
                </div>
                <div className="text-xs font-bold text-text">{item.title}</div>
              </div>
              <p className="text-[11.5px] text-text-muted leading-relaxed">
                {item.description}
              </p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
