// Dữ liệu mẫu cho popup xem trước — nhóm Content Engine (M07). Chỉ để
// minh hoạ giao diện, KHÔNG phải dữ liệu thật.
import React, { useState } from "react"
import { ContentGuidanceCard } from "@/components/templates/content-engine/content-guidance-card"
import { AngleSelectorCard, type ContentAngle } from "@/components/templates/content-engine/angle-selector-card"
import { ModelSelectorCard, type AIContentProvider } from "@/components/templates/content-engine/model-selector-card"
import { MultichannelPostCard, type MultichannelPostItem } from "@/components/templates/content-engine/multichannel-post-card"
import { SocialPostPreview } from "@/components/templates/content-engine/social-post-preview"
import { LinkedInPreview } from "@/components/templates/content-engine/linkedin-post-preview"

const SAMPLE_POST: MultichannelPostItem = {
  channel: "facebook",
  channelLabel: "Facebook",
  headline: "Nồng Nàn Yêu Thương 🌹",
  bodyText: "Bó hồng đỏ Ecuador phối baby trắng, tôn lên trọn vẹn tình cảm dành tặng người thương. Đặt ngay hôm nay để nhận ưu đãi đặc biệt!",
  hashtags: ["#hoatuoi", "#SiiNStore", "#quatang"],
  cta: "Inbox đặt hoa ngay",
}

const SAMPLE_POSTS: MultichannelPostItem[] = [
  SAMPLE_POST,
  {
    channel: "zalo",
    channelLabel: "Zalo",
    headline: "Nồng Nàn Yêu Thương",
    bodyText: "🌹 Bó hồng đỏ Ecuador phối baby trắng — ưu đãi 650.000đ hôm nay!",
    hashtags: ["#hoatuoi"],
    cta: "Nhắn Zalo đặt ngay",
  },
]

function AngleSelectorCardDemo() {
  const [angle, setAngle] = useState<ContentAngle>("emotional")
  return <AngleSelectorCard selectedAngle={angle} onSelectAngle={setAngle} />
}

function ModelSelectorCardDemo() {
  const [provider, setProvider] = useState<AIContentProvider>("ollama")
  return <ModelSelectorCard selectedProvider={provider} onSelectProvider={setProvider} selectedChannelsCount={2} />
}

export const contentEnginePreviews: Record<string, React.ReactNode> = {
  "content-guidance-card.tsx": <ContentGuidanceCard />,
  "angle-selector-card.tsx": <AngleSelectorCardDemo />,
  "model-selector-card.tsx": <ModelSelectorCardDemo />,
  "multichannel-post-card.tsx": (
    <MultichannelPostCard posts={SAMPLE_POSTS} productName="Nồng Nàn Yêu Thương" />
  ),
  "social-post-preview.tsx": (
    <SocialPostPreview post={SAMPLE_POST} productName="Nồng Nàn Yêu Thương" shopName="SiiN Store" />
  ),
  "linkedin-post-preview.tsx": (
    <LinkedInPreview
      post={{ ...SAMPLE_POST, channel: "linkedin", channelLabel: "LinkedIn" }}
      productName="Hoa tươi quà tặng doanh nghiệp"
      shopName="SiiN Store Corporate"
    />
  ),
}
