"use client"

import React, { useState, useMemo, useEffect, useCallback } from "react"
import { Sparkles, ArrowLeft, ShieldCheck, Download, RotateCcw, Check, Wand2, FileText, Headphones, Film, Package, AlertTriangle, Camera } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { TabActionHeader, type TabItem, type TabAction, type TabOverflowAction } from "@/components/ui/tab-header"
import { CreativeGuidanceCard } from "@/components/templates/creative-studio/creative-guidance-card"
import { ProductIntelligenceWorkspace } from "@/components/market-intelligence/product-intelligence-workspace"
import { OptimizeWorkspace } from "@/components/creative-studio/optimize-workspace"
import { VariantWorkspace } from "@/components/creative-studio/variant-workspace"
import { ContentsWorkspace } from "@/components/creative-studio/contents-workspace"
import { AudioWorkspace } from "@/components/creative-studio/audio-workspace"
import { VideoWorkspace } from "@/components/creative-studio/video-workspace"
import { PackageWorkspace } from "@/components/creative-studio/package-workspace"
import { ValidationScreen } from "@/components/creative-studio/validation-screen"
import { useCreativeStudioData } from "@/components/creative-studio/use-creative-studio-data"
import { Button } from "@/components/ui/button"
import { validateTransition } from "@/modules/creative-production/domain/validate-transition"

import type { ProductIntelligenceReport, ConcreteTopic } from "@/modules/market-intelligence/domain/product-intelligence-types"

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
  assetId: string | undefined
  voiceId: string | undefined
  musicMood: string | undefined
  report: ProductIntelligenceReport | null
  topics: ConcreteTopic[]
  selectedTopic: ConcreteTopic | null
  commercialPassport?: {
    category: string
    style: string
    components: string[]
    colors: string[]
    priceRange?: string | undefined
    targetAudience?: string | undefined
    suggestedOccasions?: string[] | undefined
  } | undefined
}

export const CreativeStudioContext = React.createContext<CreativeStudioContextType | null>(null)

// ... rest of the file

// ============================================================
// Tab definitions
// ============================================================

const CREATIVE_STUDIO_TABS: Record<
  string,
  {
    id: string
    label: string
    icon: typeof Sparkles
    workspace: "area-a" | "area-b" | "area-c" | "area-d" | "area-e" | "area-f"
    description: string
  }
> = {
  "area-a": {
    id: "area-a",
    label: "Khu vực A — Quét theo ảnh sản phẩm",
    icon: Camera,
    workspace: "area-a",
    description: "Chặng 1-5 — Bóc tách Vision & Chọn chủ đề trọng tâm",
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
  "area-f": {
    id: "area-f",
    label: "Khu vực F — Gói chiến dịch",
    icon: Package,
    workspace: "area-f",
    description: "Chặng 07 — Package Dashboard",
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
  // 22/09/2026 (nợ #118): URL chỉ mang định danh — `topic` là report.id (=
  // product_analysis_runs.id) khi bàn giao qua Product Intelligence, `selectedTopic`
  // là chủ đề cụ thể user đã chọn trong report đó. `imageUrl` KHÔNG còn được đọc
  // từ query string (ảnh luôn resolve tươi từ `assetId` — xem effect dưới).
  const [context, setContext] = useState<CreativeStudioContextType>(() => ({
    topicId: searchParams.get("selectedTopic") || searchParams.get("topic") || "",
    mode: (searchParams.get("mode") as "CREATIVE" | "AUTHENTIC") || "CREATIVE",
    sourceImageUrl: "",
    sourceVideoUrl: searchParams.get("videoUrl") || undefined,
    productName: searchParams.get("productName") || "",
    productId: searchParams.get("productId") || undefined,
    assetId: searchParams.get("assetId") || undefined,
    voiceId: searchParams.get("voiceId") || undefined,
    musicMood: searchParams.get("musicMood") || undefined,
    report: null,
    topics: [],
    selectedTopic: null,
  }))

  // --- Trạng thái tải tường minh (Lớp 3 — không lỗi im lặng) ---
  const [imageLoadError, setImageLoadError] = useState<string | null>(null)
  const [reportLoadError, setReportLoadError] = useState<string | null>(null)

  // --- Resolve ảnh hiển thị bằng assetId — KHÔNG tin bất kỳ URL nào truyền qua query
  // string (Data URL/blob đã từng làm chết cứng nút "Bắt đầu sáng tạo", nợ #118) ---
  useEffect(() => {
    const assetId = context.assetId
    if (!assetId) return
    let cancelled = false
    fetch(`/api/v1/assets/${encodeURIComponent(assetId)}/view-url`)
      .then((res) => {
        if (!res.ok) throw new Error("Không tải được ảnh sản phẩm từ kho (asset có thể đã bị xoá).")
        return res.json()
      })
      .then((json) => {
        if (cancelled) return
        setContext((prev) => ({ ...prev, sourceImageUrl: json.url }))
      })
      .catch((err) => {
        if (cancelled) return
        setImageLoadError(err instanceof Error ? err.message : "Không tải được ảnh sản phẩm.")
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.assetId])

  // --- Tải lại report Product Intelligence bằng report.id (param `topic`) ---
  const loadReport = useCallback(() => {
    const runId = searchParams.get("topic")
    if (!runId) return

    fetch(`/api/v1/product-intelligence/${encodeURIComponent(runId)}`)
      .then((res) => {
        // 404 không phải lỗi ở đây — luồng bàn giao không qua Product Intelligence
        // (vd. /tai-anh) dùng `topic` như một nhãn hiển thị thuần, không phải run id.
        if (res.status === 404) return null
        if (!res.ok) throw new Error("Không tải được báo cáo Product Intelligence.")
        return res.json()
      })
      .then((json) => {
        if (!json) return
        const report = json.report as ProductIntelligenceReport
        const topics = report.topics || []
        const selectedTopicId = searchParams.get("selectedTopic") || runId
        const selectedTopic = topics.find((t) => t.id === selectedTopicId) || topics[0] || null

        // Extract commercialPassport from report for validation
        // Build from report components/attributes if commercialPassport missing
        const commercialPassport = {
          category: report.commercialPassport?.priceSegment || report.attributes?.shape || "Hoa tươi thiết kế",
          style: report.commercialPassport?.style || report.attributes?.style || "Hiện đại & Tinh tế",
          components: report.components && report.components.length > 0
            ? report.components.map((c) => c.flowerType)
            : ["Hoa tươi tuyển chọn"],
          colors: [
            ...(report.attributes?.mainColors || []),
            ...(report.attributes?.secondaryColors || []),
          ].length > 0 ? [
            ...(report.attributes?.mainColors || []),
            ...(report.attributes?.secondaryColors || []),
          ] : ["Tone màu hài hòa"],
          priceRange: report.commercialPassport?.priceRange
            ? `${report.commercialPassport.priceRange.minPrice} - ${report.commercialPassport.priceRange.maxPrice} VNĐ`
            : report.commercialPassport?.priceSegment,
          targetAudience: report.commercialPassport?.targetAudience?.buyerPersona,
          suggestedOccasions: report.commercialPassport?.occasions,
        }

        setContext((prev) => ({
          ...prev,
          report,
          topics,
          selectedTopic,
          commercialPassport,
        }))
      })
      .catch((err) => {
        setReportLoadError(err instanceof Error ? err.message : "Không tải được báo cáo Product Intelligence.")
      })
  }, [searchParams])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  // Đồng bộ context từ URL khi chuyển đổi hoặc bàn giao từ Chặng 05
  useEffect(() => {
    const topicParam = searchParams.get("selectedTopic") || searchParams.get("topic")
    const modeParam = searchParams.get("mode") as "CREATIVE" | "AUTHENTIC" | null
    const nameParam = searchParams.get("productName")
    const prodIdParam = searchParams.get("productId")
    const assetIdParam = searchParams.get("assetId")
    const videoParam = searchParams.get("videoUrl")
    const voiceParam = searchParams.get("voiceId")
    const musicParam = searchParams.get("musicMood")

    setContext((prev) => {
      const fallbackPassport = prev.commercialPassport ?? (nameParam || prev.productName ? {
        category: "Hoa tươi thiết kế",
        style: "Hiện đại & Tinh tế",
        components: ["Hoa tươi tuyển chọn"],
        colors: ["Tone màu hài hòa"],
      } : undefined)

      return {
        ...prev,
        ...(topicParam ? { topicId: topicParam } : {}),
        ...(modeParam ? { mode: modeParam } : {}),
        ...(nameParam ? { productName: nameParam } : {}),
        ...(prodIdParam !== null ? { productId: prodIdParam || undefined } : {}),
        ...(assetIdParam !== null ? { assetId: assetIdParam || undefined } : {}),
        ...(videoParam !== null ? { sourceVideoUrl: videoParam || undefined } : {}),
        ...(voiceParam !== null ? { voiceId: voiceParam || undefined } : {}),
        ...(musicParam !== null ? { musicMood: musicParam || undefined } : {}),
        commercialPassport: fallbackPassport,
      }
    })
  }, [searchParams])

  // --- Initial active tab from URL 'tab' or 'area' parameter ---
  const getInitialTabId = (): string => {
    const tabParam = searchParams.get("tab")
    if (tabParam && tabParam in CREATIVE_STUDIO_TABS) {
      return tabParam
    }
    const area = searchParams.get("area")
    switch (area) {
      case "b":
        return "area-b"
      case "c":
        return "area-c"
      case "d":
        return "area-d"
      case "e":
        return "area-e"
      case "f":
        return "area-f"
      default:
        return "area-a"
    }
  }

  // --- Active tab ---
  const [activeTabId, setActiveTabId] = useState<string>(() => getInitialTabId())
  const [phase, setPhase] = useState<string>("config")
  const [validationDismissed, setValidationDismissed] = useState(false)

  // Đồng bộ activeTabId khi URL query thay đổi (?tab=area-a hoặc ?area=b)
  useEffect(() => {
    const tabParam = searchParams.get("tab")
    if (tabParam && tabParam in CREATIVE_STUDIO_TABS) {
      setActiveTabId(tabParam)
    } else {
      const area = searchParams.get("area")
      if (area) {
        const mapped = `area-${area}`
        if (mapped in CREATIVE_STUDIO_TABS) {
          setActiveTabId(mapped)
        }
      }
    }
  }, [searchParams])

  // --- Validation (Chặng chuyển tiếp) ---
  // Khu vực A chính là nơi THỰC HIỆN Chặng 1 đến 5 (tải ảnh, bóc tách Vision, Trend Fit và chọn chủ đề),
  // nên KHÔNG BAO GIỜ bị chặn bởi ValidationScreen. ValidationScreen chỉ áp dụng cho Khu vực B-F
  // khi người dùng vào thẳng các bước sản xuất mà chưa hoàn thành Chặng 1-5.
  const validationResult = useMemo(() => validateTransition({
    topicId: context.topicId || undefined,
    mode: context.mode,
    sourceImageUrl: context.sourceImageUrl || undefined,
    sourceVideoUrl: context.sourceVideoUrl,
    productName: context.productName || undefined,
    productId: context.productId,
    assetId: context.assetId,
    commercialPassport: context.commercialPassport,
    hasReport: !!context.report,
    hasTopics: context.topics.length > 0,
    voiceId: context.voiceId,
    musicMood: context.musicMood,
  }), [context])

  const showValidation = activeTabId !== "area-a" && !validationResult.valid && !validationDismissed

  // ... rest of the component

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
    } else if (activeTabId === "area-f") {
      actions.push({
        id: "package-campaign",
        label: "Đóng gói chiến dịch",
        icon: Package,
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
        return <ProductIntelligenceWorkspace />
      case "area-b":
        return <ContentsWorkspace />
      case "area-c":
        return <AudioWorkspace />
      case "area-d":
        return <VariantWorkspace data={data} />
      case "area-e":
        return <VideoWorkspace />
      case "area-f":
        return <PackageWorkspace />
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
          {(imageLoadError || reportLoadError) && (
            <div className="w-full max-w-3xl mx-auto rounded-xl border border-amber-200 bg-amber-50/80 p-3 flex items-start gap-2 text-[12.5px] text-amber-800">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                {imageLoadError && <p>{imageLoadError}</p>}
                {reportLoadError && <p>{reportLoadError}</p>}
              </div>
            </div>
          )}
          {showValidation ? (
            /* Validation Screen — hiển thị khi thiếu required data ở các Khu vực B-F */
            <ValidationScreen
              result={validationResult}
              onContinue={() => setValidationDismissed(true)}
              onGoBack={() => setActiveTabId("area-a")}
            />
          ) : (
            <>
              {/* Feature Guidance Card */}
              <div className="w-full max-w-3xl mx-auto">
                <CreativeGuidanceCard area={activeTabId as "area-a" | "area-b" | "area-c" | "area-d" | "area-e" | "area-f"} />
              </div>

              {/* Context Info Bar — chỉ hiển thị tại Khu vực B-F khi đã có topic/product */}
              {activeTabId !== "area-a" && (context.topicId || context.productName) && (
                <div className="w-full max-w-3xl mx-auto rounded-xl border border-stone-200 bg-stone-50 p-4">
                  <p className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">📦 Context carry-forward (Chặng 1-5)</p>
                  <div className="grid grid-cols-2 gap-2 text-[12px]">
                    <div><span className="text-stone-500">Topic:</span> <span className="font-medium">{context.topicId || "—"}</span></div>
                    <div><span className="text-stone-500">Mode:</span> <span className="font-medium">{context.mode}</span></div>
                    <div><span className="text-stone-500">Product:</span> <span className="font-medium">{context.productName || "—"}</span></div>
                    <div><span className="text-stone-500">Source:</span> <span className="font-medium">{context.sourceImageUrl ? "Image" : context.sourceVideoUrl ? "Video" : "—"}</span></div>
                  </div>
                </div>
              )}

              {/* Workspace */}
              {renderWorkspace()}
            </>
          )}
        </div>
      </div>
    </CreativeStudioContext.Provider>
  )
}
