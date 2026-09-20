"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Camera,
  Eye,
  RotateCcw,
  LayoutGrid,
  ZoomIn,
  User,
  Users,
  Sparkles,
  BookOpen,
  Check,
} from "lucide-react"
import type { CameraAngleType, HumanInteractionType, StorylineMode } from "@/modules/media/domain/creative-studio-schemas"

export interface VisualStorytellingControlsProps {
  cameraAngle: CameraAngleType
  onCameraAngleChange: (angle: CameraAngleType) => void
  humanInteraction: HumanInteractionType
  onHumanInteractionChange: (interaction: HumanInteractionType) => void
  storylineMode: StorylineMode
  onStorylineModeChange: (mode: StorylineMode) => void
  disabled?: boolean
}

const CAMERA_ANGLES: Array<{
  id: CameraAngleType
  label: string
  desc: string
  icon: React.ElementType
}> = [
  { id: "front_view", label: "Trực diện 0°", desc: "Ngang tầm mắt, bố cục chuẩn mực", icon: Eye },
  { id: "three_quarter_45", label: "Góc nghiêng 45°", desc: "Tôn chiều sâu & nếp giấy gói", icon: RotateCcw },
  { id: "flat_lay_topdown", label: "Flat-lay 90°", desc: "Từ trên xuống cùng phụ kiện vintage", icon: LayoutGrid },
  { id: "macro_closeup", label: "Cận cảnh Macro", desc: "Chi tiết cánh hoa & giọt sương mai", icon: ZoomIn },
]

const HUMAN_INTERACTIONS: Array<{
  id: HumanInteractionType
  label: string
  desc: string
  badge: string
  icon: React.ElementType
}> = [
  { id: "none", label: "Chỉ hoa tươi", desc: "Tập trung 100% vào bó hoa", badge: "Chuẩn Catalog", icon: Camera },
  { id: "female_holding", label: "Mẫu nữ ôm hoa", desc: "Nữ thanh lịch ôm ngang ngực", badge: "Định cỡ hoa", icon: User },
  { id: "male_holding", label: "Mẫu nam cầm hoa", desc: "Nam lịch lãm chuẩn bị tặng", badge: "Quà tặng", icon: User },
  { id: "florist_artisan_hands", label: "Bàn tay thợ hoa", desc: "Thắt nơ lụa tỉ mỉ tại xưởng", badge: "Thủ công", icon: Sparkles },
  { id: "gifting_moment", label: "Khoảnh khắc tặng", desc: "Trao hoa đong đầy nụ cười", badge: "Cảm xúc", icon: Users },
]

const STORY_CHAPTERS = [
  { step: 1, title: "1. The Craft (Chế tác)", desc: "Bàn tay thợ cắm hoa tỉ mỉ tại xưởng" },
  { step: 2, title: "2. The Masterpiece (Kiệt tác)", desc: "Bó hoa chân dung sang trọng trong Studio" },
  { step: 3, title: "3. The Surprise (Đón nhận)", desc: "Mẫu nữ ôm hoa rạng rỡ tại quán cafe" },
  { step: 4, title: "4. The Living Memory (Tổ ấm)", desc: "Bó hoa tỏa sáng trong phòng khách" },
]

export function VisualStorytellingControls({
  cameraAngle,
  onCameraAngleChange,
  humanInteraction,
  onHumanInteractionChange,
  storylineMode,
  onStorylineModeChange,
  disabled = false,
}: VisualStorytellingControlsProps) {
  const isCarousel = storylineMode === "four_part_story_carousel"

  return (
    <Card className="w-full p-4.5 border border-border bg-surface flex flex-col gap-4.5 shadow-xs">
      {/* Header & Story Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border pb-3.5">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Camera size={15} strokeWidth={2.4} />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-text">
              Góc Chụp & Tương Tác Người Mẫu (Visual Storytelling)
            </div>
            <div className="text-[11.5px] text-text-muted">
              Đa dạng hóa góc nhìn sản phẩm & kích hoạt cảm xúc mua hàng
            </div>
          </div>
        </div>

        {/* Storyline Carousel Toggle Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onStorylineModeChange(isCarousel ? "single_shot" : "four_part_story_carousel")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition select-none ${
            isCarousel
              ? "bg-primary text-white border-primary shadow-xs"
              : "bg-surface-alt border-border text-text hover:border-primary/50"
          }`}
        >
          <BookOpen size={13} strokeWidth={2.4} />
          <span>{isCarousel ? "Đang bật: Trọn bộ Story (4 ảnh)" : "Tạo 1 ảnh đơn"}</span>
        </button>
      </div>

      {/* When Carousel is active, show the 4-part Storyline sequence */}
      {isCarousel ? (
        <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
              <Sparkles size={13} />
              Kịch bản Chiến dịch Story Carousel (Tự động tạo đồng bộ 4 ảnh)
            </span>
            <Badge tone="accent" className="text-[10px]">Tiết kiệm 4x thời gian</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
            {STORY_CHAPTERS.map((ch) => (
              <div key={ch.step} className="p-2.5 rounded-lg bg-surface border border-border flex flex-col gap-1 shadow-2xs">
                <div className="text-[11.5px] font-extrabold text-primary flex items-center gap-1">
                  <Check size={11} strokeWidth={3} />
                  {ch.title}
                </div>
                <div className="text-[11px] text-text-muted leading-snug">{ch.desc}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Section 1: Camera Angles */}
          <div>
            <div className="text-[11.5px] font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>1. Góc chụp máy ảnh (Camera Angles)</span>
              <span className="text-[11px] font-normal text-text-muted">Chọn 1 góc</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CAMERA_ANGLES.map((angle) => {
                const Icon = angle.icon
                const isSelected = cameraAngle === angle.id
                return (
                  <button
                    key={angle.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onCameraAngleChange(angle.id)}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition select-none ${
                      isSelected
                        ? "border-primary bg-primary/5 text-primary shadow-xs ring-1 ring-primary/30"
                        : "border-border bg-surface-alt hover:border-text-muted/40 text-text"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <Icon size={14} className={isSelected ? "text-primary" : "text-text-muted"} />
                      {isSelected && <Check size={12} strokeWidth={3} className="text-primary" />}
                    </div>
                    <div className="text-xs font-bold">{angle.label}</div>
                    <div className="text-[10.5px] text-text-muted line-clamp-1 mt-0.5">{angle.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Section 2: Human Interaction */}
          <div>
            <div className="text-[11.5px] font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>2. Bối cảnh tương tác người mẫu (Lifestyle Context)</span>
              <span className="text-[11px] font-normal text-text-muted">Tỷ lệ cơ thể trực quan</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {HUMAN_INTERACTIONS.map((item) => {
                const Icon = item.icon
                const isSelected = humanInteraction === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onHumanInteractionChange(item.id)}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition select-none ${
                      isSelected
                        ? "border-primary bg-primary/5 text-primary shadow-xs ring-1 ring-primary/30"
                        : "border-border bg-surface-alt hover:border-text-muted/40 text-text"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <Icon size={14} className={isSelected ? "text-primary" : "text-text-muted"} />
                      <Badge tone={isSelected ? "accent" : "neutral"} className="text-[9px] px-1 py-0">
                        {item.badge}
                      </Badge>
                    </div>
                    <div className="text-xs font-bold line-clamp-1">{item.label}</div>
                    <div className="text-[10.5px] text-text-muted line-clamp-1 mt-0.5">{item.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </Card>
  )
}
