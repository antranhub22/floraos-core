"use client"

import React, { useState, useMemo, useEffect } from "react"
import { Sparkles, ArrowLeft, ShieldCheck, Download, RotateCcw, Check, Wand2, FileText, Headphones, Film } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { TabActionHeader, type TabItem, type TabAction, type TabOverflowAction } from "@/components/ui/tab-header"
import { CreativeGuidanceCard } from "@/components/templates/creative-studio/creative-guidance-card"
import { OptimizeWorkspace } from "@/components/creative-studio/optimize-workspace"
import { VariantWorkspace } from "@/components/creative-studio/variant-workspace"
import { ContentsWorkspace } from "@/components/creative-studio/contents-workspace"
import { AudioWorkspace } from "@/components/creative-studio/audio-workspace"
import { VideoWorkspace } from "@/components/creative-studio/video-workspace"
import { useCreativeStudioData } from "@/components/creative-studio/use-creative-studio-data"
import { Button } from "@/components/ui/button"

// ============================================================
// CreativeStudioContext — carry-forward from Chặng 1-4
// ============================================================

interface CreativeStudioContextType {
  topicId: string
  mode: "CREATIVE" | "AUTHENTIC"
  sourceImageUrl: string
  sourceVideoUrl: string | undefined
  productName: string
  productId: string | undefined
  voiceId: string | undefined
  musicMood: string | undefined
}

export const CreativeStudioContext = React.createContext<CreativeStudioContextType | null>(null)

// ============================================================
// Tab definitions
// ============================================================

const CREATIVE_STUDIO_TABS: Record<
  string,
  {
    id: string
    label: string
    icon: typeof Sparkles
    workspace: "area-a" | "area-b" | "area-c" | "area-d" | "area-e"
    description: string
  }
> = {
  "area-a": {
    id: "area-a",
    label: "Khu vực A — Tối ưu ảnh/video đầu vào",
    icon: Sparkles,
    workspace: "area-a",
    description: "M04a — Tối ưu ảnh gốc, tạo Master Image",
  },
  "area-b": {
    id: "area-b",
    label: "Khu vực B — Viết contents",
    icon: FileText,
    workspace: "area-b",
    description: "Contents — CREATIVE / AUTHENTIC",
  },
  "area-c": {
    id: "area-c",
    label: "Khu vực C — Tạo audio",
    icon: Headphones,
    workspace: "area-c",
    description: "TTS + BGM + Phối trộn",
  },
  "area-d": {
    id: "area-d",
    label: "Khu vực D — Tạo biến thể ảnh",
    icon: Wand2,
    workspace: "area-d",
    description: "M04b — Biến thể marketing",
  },
  "area-e": {
    id: "area-e",
    label: "Khu vực E — Tạo video",
    icon: Film,
    workspace: "area-e",
    description: "M04c — Video Studio",
  },
}

// ============================================================
// PAGE SHELL
// ============================================================

export default function CreativeStudioPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const data = useCreativeStudioData()

  // --- Context from URL (carry-forward Chặng 1-4) ---
  const [context, setContext] = useState<CreativeStudioContextType>(() => ({
    topicId: searchParams.get("topic") || "",
    mode: (searchParams.get("mode") as "CREATIVE" | "AUTHENTIC") || "CREATIVE",
    sourceImageUrl: searchParams.get("imageUrl") || "",
    sourceVideoUrl: searchParams.get("videoUrl") || undefined,
    productName: searchParams.get("productName") || "",
    productId: searchParams.get("productId") || undefined,
    voiceId: searchParams.get("voiceId") || undefined,
    musicMood: searchParams.get("musicMood") || undefined,
  }))

  // --- Active tab ---
  const [activeTabId, setActiveTabId] = useState<string>("area-a")
  const [phase, setPhase] = useState<string>("config")

  // --- Tabs ---
  const tabs: TabItem[] = useMemo(() =>
    Object.values(CREATIVE_STUDIO_TABS).map((tab) => ({
      id: tab.id,
      label: tab.label,
      icon: tab.icon,
    })),
    []
  )

  // --- Primary Actions ---
  const primaryActions: TabAction[] = useMemo(() => {
    const actions: TabAction[] = []

    if (activeTabId === "area-a") {
      actions.push({
        id: "optimize",
        label: "Tối ưu ảnh/video",
        icon: Sparkles,
        variant: "primary",
        onClick: () => { /* OptimizeWorkspace handles internally */ },
      })
      actions.push({
        id: "save-draft",
        label: "Lưu nháp",
        icon: Check,
        variant: "outline",
        onClick: () => {},
      })
    } else if (activeTabId === "area-b") {
      actions.push({
        id: "generate-content",
        label: context.mode === "CREATIVE" ? "Tạo nội dung Creative" : "Tạo nội dung Authentic",
        icon: Wand2,
        variant: "primary",
        onClick: () => {},
      })
    } else if (activeTabId === "area-c") {
      actions.push({
        id: "generate-audio",
        label: "Tạo audio",
        icon: Headphones,
        variant: "primary",
        onClick: () => {},
      })
    } else if (activeTabId === "area-d") {
      actions.push({
        id: "generate-variants",
        label: "Tạo biến thể",
        icon: Wand2,
        variant: "primary",
        onClick: () => {},
      })
    } else if (activeTabId === "area-e") {
      actions.push({
        id: "generate-video",
        label: "Tạo video",
        icon: Film,
        variant: "primary",
        onClick: () => {},
      })
    }

    return actions
  }, [activeTabId, context.mode])

  // --- Overflow Actions ---
  const overflowActions: TabOverflowAction[] = useMemo(() => [
    { id: "go-home", label: "Quay về Trang chủ", icon: ArrowLeft, onClick: () => router.push("/") },
    ...(activeTabId !== "area-a" ? [{
      id: "back-to-a",
      label: "Quay lại Khu vực A",
      icon: ArrowLeft,
      dividerAbove: true,
      onClick: () => setActiveTabId("area-a"),
    }] : []),
  ], [activeTabId, router])

  // --- Tab change handler ---
  const handleTabChange = (tabId: string) => {
    setActiveTabId(tabId)
    if (tabId === "area-d") setPhase("config")
    if (tabId === "area-a") setPhase("config")
  }

  // --- Render workspace by tab ---
  const renderWorkspace = () => {
    switch (activeTabId) {
      case "area-a":
        return <OptimizeWorkspace data={data} />
      case "area-d":
        return <VariantWorkspace data={data} />
      case "area-b":
        return <ContentsWorkspace />
      case "area-c":
        return <AudioWorkspace />
      case "area-d":
        return <VariantWorkspace data={data} />
      case "area-e":
        return <VideoWorkspace />
      default:
        return null
    }
  }

  // --- Render ---
  return (
    <CreativeStudioContext.Provider value={context}>
      <div className="flex h-full flex-col overflow-hidden bg-background">
        {/* Top Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-4 py-3">
          <div>
            <div className="text-xs text-text-muted">
              {context.mode} mode · Chặng 5-14 Sáng tạo nội dung
            </div>
            <div className="text-[17px] font-extrabold text-primary">AI Creative Studio</div>
          </div>
          <TabActionHeader
            tabs={tabs}
            activeTab={activeTabId}
            onTabChange={handleTabChange}
            primaryActions={primaryActions}
            overflowActions={overflowActions}
          />
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto p-4 md:p-6 gap-6">
          {/* Feature Guidance Card */}
          <div className="w-full max-w-3xl mx-auto">
            <CreativeGuidanceCard area={activeTabId as "area-a" | "area-b" | "area-c" | "area-d" | "area-e"} />
          </div>

          {/* Context Info Bar */}
          <div className="w-full max-w-3xl mx-auto rounded-xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">📦 Context carry-forward (Chặng 1-4)</p>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <div><span className="text-stone-500">Topic:</span> <span className="font-medium">{context.topicId || "—"}</span></div>
              <div><span className="text-stone-500">Mode:</span> <span className="font-medium">{context.mode}</span></div>
              <div><span className="text-stone-500">Product:</span> <span className="font-medium">{context.productName || "—"}</span></div>
              <div><span className="text-stone-500">Source:</span> <span className="font-medium">{context.sourceImageUrl ? "Image" : context.sourceVideoUrl ? "Video" : "—"}</span></div>
            </div>
          </div>

          {/* Workspace */}
          {renderWorkspace()}
        </div>
      </div>
    </CreativeStudioContext.Provider>
  )
}
