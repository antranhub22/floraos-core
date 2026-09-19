// Dữ liệu mẫu cho popup xem trước — nhóm Creative Studio (M04). Chỉ để
// minh hoạ giao diện, KHÔNG phải dữ liệu thật.
import React, { useState } from "react"
import { CreativeGuidanceCard } from "@/components/templates/creative-studio/creative-guidance-card"
import { BeforeAfterPreviewCard } from "@/components/templates/creative-studio/before-after-preview-card"
import { StudioVariantCard, type StudioVariantItem } from "@/components/templates/creative-studio/studio-variant-card"
import { StudioSceneSelector } from "@/components/templates/creative-studio/studio-scene-selector"
import { EnhancerProviderSelector } from "@/components/templates/creative-studio/enhancer-provider-selector"
import { OptimizationModeSelector } from "@/components/templates/creative-studio/optimization-mode-selector"
import { AppliedChangesBreakdown } from "@/components/templates/creative-studio/applied-changes-breakdown"

const SAMPLE_VARIANTS: StudioVariantItem[] = [
  { id: "wedding", name: "Bàn tiệc cưới", thumbnailUrl: "/images/sample-flower.jpg", description: "Bối cảnh sang trọng bàn tiệc", tag: "Phổ biến" },
  { id: "living-room", name: "Phòng khách", thumbnailUrl: "/images/sample-flower.jpg", description: "Không gian ấm cúng gia đình" },
  { id: "hand-held", name: "Cầm tay", thumbnailUrl: "/images/sample-flower.jpg", description: "Góc chụp cận cảnh cầm tay" },
]

function StudioSceneSelectorDemo() {
  const [value, setValue] = useState("warm_gray")
  return <StudioSceneSelector value={value} onChange={setValue} />
}

function EnhancerProviderSelectorDemo() {
  const [value, setValue] = useState("studio")
  return <EnhancerProviderSelector value={value} onChange={setValue} />
}

function OptimizationModeSelectorDemo() {
  const [mode, setMode] = useState<"auto" | "custom">("auto")
  const [caps, setCaps] = useState<string[]>(["upscale_clarity", "remove_watermark", "remove_background"])
  return (
    <OptimizationModeSelector
      mode={mode}
      onModeChange={setMode}
      selectedCapabilities={caps}
      onCapabilitiesChange={setCaps}
      selectedProvider="studio"
    />
  )
}

function StudioVariantCardDemo() {
  const [selected, setSelected] = useState("wedding")
  return <StudioVariantCard variants={SAMPLE_VARIANTS} selectedId={selected} onSelectVariant={setSelected} />
}

export const creativeStudioPreviews: Record<string, React.ReactNode> = {
  "creative-guidance-card.tsx": <CreativeGuidanceCard area="area-a" />,
  "before-after-preview-card.tsx": (
    <BeforeAfterPreviewCard
      presetName="Studio Xám Ấm (Hàn Quốc)"
      presetTone="success"
      aspectRatio="1:1"
    />
  ),
  "studio-variant-card.tsx": <StudioVariantCardDemo />,
  "studio-scene-selector.tsx": <StudioSceneSelectorDemo />,
  "enhancer-provider-selector.tsx": <EnhancerProviderSelectorDemo />,
  "optimization-mode-selector.tsx": <OptimizationModeSelectorDemo />,
  "applied-changes-breakdown.tsx": <AppliedChangesBreakdown providerName="Studio AI Pipeline" mode="auto" />,
}
