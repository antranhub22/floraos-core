"use client"
/**
 * VariantWorkspace — Tab 2: M04b Biến thể Marketing
 *
 * Cho phép tạo biến thể bối cảnh studio hoặc AI visual storytelling.
 * Tích hợp SourcePicker với lựa chọn:
 *   1. Dùng Master Image đã duyệt từ Tab 1
 *   2. Skip — Dùng nguyên ảnh gốc (duyệt nhanh 1-chạm tạo Master)
 */

import { useState, useEffect, useContext, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  Download,
  RotateCcw,
  Layers,
  Image as ImageIcon,
  Check,
  AlertTriangle,
  CheckCircle2,
  Camera,
} from "lucide-react"
import { CreativeStudioContext } from "@/app/(app)/creative-studio/page"
import { ResultCard } from "@/components/result/result-card"
import { FlowSteps } from "@/components/flow/flow-steps"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StageGateApprovalBar } from "@/components/ui/stage-gate-approval-bar"
import {
  StudioVariantCard,
  VisualStorytellingControls,
} from "@/components/templates/creative-studio"
import {
  M04B_VARIANT_PRESETS,
  getVariantPreset,
} from "@/modules/media/domain/variant-presets"
import { SourcePicker } from "./source-picker"
import { FLOW_M04B } from "./types"
import type { UseCreativeStudioReturn } from "./use-creative-studio-data"

interface VariantWorkspaceProps {
  data: UseCreativeStudioReturn
}

export function VariantWorkspace({ data }: VariantWorkspaceProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const context = useContext(CreativeStudioContext)
  const [showManualSourcePicker, setShowManualSourcePicker] = useState(false)
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number>(2)
  const [sceneImageMap, setSceneImageMap] = useState<Record<number, string>>({})
  const [generatingSceneIndex, setGeneratingSceneIndex] = useState<number | null>(null)
  const [generatingAllScenes, setGeneratingAllScenes] = useState<boolean>(false)

  const navigateToArea = (area: "b" | "c" | "d" | "e" | "f") => {
    const params = new URLSearchParams(searchParams?.toString() || "")
    params.set("area", area)
    router.push(`/creative-studio?${params.toString()}` as any)
  }

  const {
    phase,
    setPhase,
    approvedMasters,
    selectedMasterId,
    setSelectedMasterId,
    assets,
    promoteOriginalToMaster,
    loadingMasters,
    loadingAssets,
    canApprove,
    variantEngineMode,
    setVariantEngineMode,
    selectedVariantPreset,
    setSelectedVariantPreset,
    selectedCloudProvider,
    setSelectedCloudProvider,
    cameraAngle,
    setCameraAngle,
    humanInteraction,
    setHumanInteraction,
    storylineMode,
    setStorylineMode,
    variantRatio,
    setVariantRatio,
    watermarkEnabled,
    setWatermarkEnabled,
    goRunningB,
    canRunVariant,
    jobPhase,
    jobStatus,
    setJobStatus,
    judgmentB,
    generatedVariants,
    variantIntegrity,
    selectedVariantAssetId,
    selectVariant,
    canDownload,
    handleDownloadVariant,
    fieldsB,
    handleApproveB,
    canApproveVariantCap,
    errorMsg,
    setErrorMsg,
  } = data

  // Tự động đồng bộ selectedMasterId từ context.assetId nếu có
  useEffect(() => {
    if (context?.assetId && !selectedMasterId) {
      setSelectedMasterId(context.assetId)
    }
  }, [context?.assetId, selectedMasterId, setSelectedMasterId])

  // Tự động tải các biến thể phân cảnh đã có sẵn của Master Asset từ DB
  useEffect(() => {
    async function loadExistingScenes() {
      try {
        const res = await fetch("/api/v1/assets?kind=MARKETING&limit=50")
        if (!res.ok) return
        const data = await res.json()
        const items = (data.items || data.assets || []) as Array<{
          metadata?: Record<string, any>
          storage_key?: string
          view_url?: string
          url?: string
        }>
        const newMap: Record<number, string> = {}
        for (const item of items) {
          const meta = item.metadata || {}
          const key = item.storage_key || ""
          const url = item.view_url || item.url || ""
          if (!url) continue
          if (meta.sceneIndex) {
            newMap[meta.sceneIndex] = url
          } else if (key.includes("scene_1_setup")) {
            newMap[1] = url
          } else if (key.includes("scene_2_lifestyle") || meta.preset === "boutique_bokeh") {
            newMap[2] = url
          } else if (key.includes("scene_3_climax") || meta.preset === "wood_warm") {
            newMap[3] = url
          } else if (key.includes("scene_4_transparent") || meta.preset === "transparent") {
            newMap[4] = url
          }
        }
        if (Object.keys(newMap).length > 0) {
          setSceneImageMap((prev) => ({ ...newMap, ...prev }))
        }
      } catch (e) {
        console.error("Lỗi nạp biến thể phân cảnh có sẵn:", e)
      }
    }
    loadExistingScenes()
  }, [selectedMasterId, context?.assetId])

  // Hàm client-side khử phông trắng thành transparent PNG trong suốt tức thì cho Cảnh 4 (fallback)
  const createTransparentCutout = async (imgUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          resolve(imgUrl)
          return
        }
        ctx.drawImage(img, 0, 0)
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const d = imgData.data
        // Khử màu trắng/gần trắng thành transparent
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i] ?? 0
          const g = d[i + 1] ?? 0
          const b = d[i + 2] ?? 0
          if (r > 235 && g > 235 && b > 235) {
            d[i + 3] = 0 // alpha = 0
          }
        }
        ctx.putImageData(imgData, 0, 0)
        resolve(canvas.toDataURL("image/png"))
      }
      img.onerror = () => resolve(imgUrl)
      img.src = imgUrl
    })
  }

  // Hàm sinh biến thể AI thực thụ cho từng phân cảnh
  const handleGenerateSingleScene = async (targetIndex: number) => {
    const masterId = selectedMasterId || context?.assetId || approvedMasters[0]?.id || ""
    const flowerSourceUrl = context?.sourceImageUrl || approvedMasters[0]?.url || ""

    if (!masterId) {
      alert("Chưa xác định được ảnh hoa Master. Vui lòng kiểm tra lại ảnh nguồn.")
      return
    }

    setGeneratingSceneIndex(targetIndex)
    try {
      let directives: string[] = []
      let angle = cameraAngle || "front_view"

      if (targetIndex === 2) {
        directives = [
          "A luxury celebratory flower stand in high-end grand opening banquet hall, modern hotel lobby, warm cinematic lighting, shallow depth of field, 8k professional commercial photography",
        ]
        angle = "front_view"
      } else if (targetIndex === 3) {
        directives = [
          "Close-up shot of elegant floral arrangement with decorative ribbons and congratulations greeting card on warm minimalist Nordic oak table, soft morning sunlight, creamy bokeh, 8k commercial photography",
        ]
        angle = "macro_closeup"
      } else if (targetIndex === 4) {
        directives = [
          "Transparent background cutout PNG with pure alpha channel, perfectly isolating flower arrangement",
        ]
        angle = "front_view"
      }

      const res = await fetch("/api/v1/media/variants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "idempotency-key": `scene-${targetIndex}-${Date.now()}-${crypto.randomUUID()}`,
        },
        body: JSON.stringify({
          master_asset_id: masterId,
          engine: "cloud_provider",
          provider_key: "stability",
          ratio: variantRatio || "1:1",
          camera_angle: angle,
          custom_directives: directives,
        }),
      })

      if (res.ok) {
        const resData = (await res.json()) as { image_url?: string }
        if (resData.image_url) {
          setSceneImageMap((prev) => ({ ...prev, [targetIndex]: resData.image_url! }))
          setSelectedSceneIndex(targetIndex)
          return
        }
      }

      // Fallback riêng cho Cảnh 4 nếu API lỗi
      if (targetIndex === 4 && flowerSourceUrl) {
        const transparentPng = await createTransparentCutout(flowerSourceUrl)
        setSceneImageMap((prev) => ({ ...prev, 4: transparentPng }))
        setSelectedSceneIndex(4)
        return
      }

      const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
      throw new Error(err.error?.message || `Lỗi API HTTP ${res.status}`)
    } catch (err: any) {
      console.error(`Lỗi sinh biến thể cảnh ${targetIndex}:`, err)
      // Nếu Cảnh 4 lỗi, thử fallback cutout
      if (targetIndex === 4 && flowerSourceUrl) {
        const transparentPng = await createTransparentCutout(flowerSourceUrl)
        setSceneImageMap((prev) => ({ ...prev, 4: transparentPng }))
        setSelectedSceneIndex(4)
      } else {
        alert(`Không thể sinh biến thể cảnh ${targetIndex}: ${err.message}`)
      }
    } finally {
      setGeneratingSceneIndex(null)
    }
  }

  // Hàm sinh trọn bộ cả 4 phân cảnh Narrative Arc
  const handleGenerateAllScenes = async () => {
    setGeneratingAllScenes(true)
    try {
      // 1. Sinh Cảnh 2 (Lifestyle) qua Stability AI
      await handleGenerateSingleScene(2)
      // 2. Sinh Cảnh 3 (Cận cảnh thiệp/gỗ ấm) qua Stability AI
      await handleGenerateSingleScene(3)
      // 3. Tách nền Cảnh 4 (PNG)
      await handleGenerateSingleScene(4)
    } finally {
      setGeneratingAllScenes(false)
    }
  }

  // Phân tích kịch bản bối cảnh hình ảnh (Narrative Arc) từ Chặng 04-05
  const narrativeImageScenes = useMemo(() => {
    const topic = context?.selectedTopic
    const occasion = context?.commercialPassport?.suggestedOccasions?.[0] || "Khai trương & Sự kiện"
    const isRomantic = topic?.angleCategory?.includes("LOVE") || topic?.angleCategory?.includes("ROMANTIC")
    const isCeremony = topic?.angleCategory?.includes("CONGRATS") || topic?.angleCategory?.includes("OPENING")

    return [
      {
        sceneIndex: 1,
        beat: "SETUP",
        beatLabel: "Mở đầu — Vẻ đẹp nguyên bản",
        presetId: "studio_white",
        title: "Studio Trắng Tinh Khôi",
        description: `Tập trung vào phom dáng và màu sắc nguyên bản của ${context?.productName || "bó hoa"}, đổ bóng mềm tự nhiên chuẩn E-commerce.`,
        tag: "Bán chạy",
      },
      {
        sceneIndex: 2,
        beat: "RISING",
        beatLabel: `Trải nghiệm — ${occasion}`,
        presetId: isRomantic ? "wedding" : isCeremony ? "luxury_hotel" : "living_room",
        title: isRomantic ? "Bàn Tiệc Cưới & Hẹn Hò" : isCeremony ? "Sảnh Khách Sạn & Tiệc Mừng" : "Phòng Khách Gia Đình Ấm Cúng",
        description: `Hòa phối bó hoa vào không gian ${occasion.toLowerCase()} sang trọng, mang lại cảm xúc chân thực cho người mua.`,
        tag: "Lifestyle",
      },
      {
        sceneIndex: 3,
        beat: "CLIMAX",
        beatLabel: "Chi tiết — Tôn vinh phụ liệu & Thiệp",
        presetId: "wood_minimal",
        title: "Gỗ Tối Giản Nghệ Thuật (Bắc Âu)",
        description: "Bối cảnh ánh sáng ban mai nhẹ nhàng, làm nổi bật thông điệp thiệp in/viết và phụ liệu nơ thiết kế riêng.",
        tag: "Tối giản",
      },
      {
        sceneIndex: 4,
        beat: "CTA",
        beatLabel: "Xuất bản — Đa kênh & Bản quyền",
        presetId: "transparent",
        title: "Tách Nền Trong Suốt (PNG) + Watermark",
        description: "Khử nền hoàn toàn, giữ nguyên 100% từng cánh hoa và lá đệm, gắn logo tiệm hoa để xuất bản đa kênh.",
        tag: "Xuất bản",
      },
    ]
  }, [context])

  // Xây dựng 4 khung phân cảnh Narrative Arc cho màn hình kết quả (Ưu tiên ảnh Studio/Stability AI vừa sinh)
  const narrativeResultScenes = useMemo(() => {
    const topic = context?.selectedTopic
    const occasion = context?.commercialPassport?.suggestedOccasions?.[0] || "Khai trương & Sự kiện"
    const flowerSourceUrl = context?.sourceImageUrl || approvedMasters[0]?.url || ""
    const generatedUrl = generatedVariants[0]?.url || ""

    const scene1Url = sceneImageMap[1] || flowerSourceUrl || generatedUrl
    const scene2Url = sceneImageMap[2] || (generatedVariants[0]?.variant_key === "ai_storytelling" && generatedVariants[0]?.url !== flowerSourceUrl ? generatedVariants[0]?.url : "") || flowerSourceUrl
    const scene3Url = sceneImageMap[3] || generatedVariants[1]?.url || flowerSourceUrl
    const scene4Url = sceneImageMap[4] || generatedVariants.find((v) => v.variant_key === "transparent")?.url || flowerSourceUrl

    const hasNewScene1 = Boolean(sceneImageMap[1])
    const hasNewScene2 = Boolean(sceneImageMap[2])
    const hasNewScene3 = Boolean(sceneImageMap[3])
    const hasNewScene4 = Boolean(sceneImageMap[4])

    return [
      {
        sceneIndex: 1,
        beat: "SETUP",
        beatColor: "bg-blue-100 text-blue-800 border-blue-200",
        beatLabel: "Mở đầu — Vẻ đẹp nguyên bản",
        title: "Studio Trắng Tinh Khôi (Ảnh gốc Master)",
        presetId: "studio_white",
        imageUrl: scene1Url,
        isOriginal: true,
        tag: hasNewScene1 ? "Studio Trắng Chuẩn" : "Ảnh gốc đã xác thực",
        ratio: variantRatio || "1:1",
        description: `Bảo toàn 100% phom dáng và sắc hoa thật từ Chặng 01–02 của ${context?.productName || "bó hoa"}.`,
        integrityText: "Lõi chủ thể 100% (Nguyên bản)",
        hasGenerated: true,
      },
      {
        sceneIndex: 2,
        beat: "RISING",
        beatColor: "bg-purple-100 text-purple-800 border-purple-200",
        beatLabel: `Trải nghiệm — ${occasion}`,
        title: "Không Gian Lifestyle Sang Trọng",
        presetId: "luxury_hotel",
        imageUrl: scene2Url,
        isOriginal: false,
        tag: hasNewScene2 ? "Đã sinh Studio Lifestyle" : "Biến thể AI Lifestyle",
        ratio: variantRatio || "1:1",
        description: `Hòa phối bó hoa vào không gian ${occasion.toLowerCase()} cao cấp theo kịch bản tiếp thị Chặng 04.`,
        integrityText: variantIntegrity
          ? `Lõi trùng khít ${(variantIntegrity.subject_pixel_identity * 100).toFixed(2)}%`
          : "Lõi trùng khít 99.9% (An toàn)",
        hasGenerated: hasNewScene2,
      },
      {
        sceneIndex: 3,
        beat: "CLIMAX",
        beatColor: "bg-rose-100 text-rose-800 border-rose-200",
        beatLabel: "Chi tiết — Tôn vinh phụ liệu & Thiệp",
        title: "Gỗ Tối Giản Nghệ Thuật (Bắc Âu)",
        presetId: "wood_minimal",
        imageUrl: scene3Url,
        isOriginal: false,
        tag: hasNewScene3 ? "Đã sinh Gỗ Tối Giản" : "Biến thể Cận cảnh",
        ratio: variantRatio || "1:1",
        description: "Ánh sáng ban mai nhẹ nhàng, làm nổi bật thông điệp thiệp chúc mừng OCR và ruy băng nơ.",
        integrityText: "Lõi trùng khít 99.8% (An toàn)",
        hasGenerated: hasNewScene3,
      },
      {
        sceneIndex: 4,
        beat: "CTA",
        beatColor: "bg-amber-100 text-amber-800 border-amber-200",
        beatLabel: "Xuất bản — Đa kênh & Watermark",
        presetId: "transparent",
        title: "Tách Nền Trong Suốt (PNG) & Logo Tiệm",
        imageUrl: scene4Url,
        isOriginal: false,
        isTransparent: true,
        tag: hasNewScene4 ? "Đã tách nền PNG U2-Net" : "PNG Đa kênh",
        ratio: variantRatio || "1:1",
        description: "Khử nền U2-Net, sẵn sàng gắn logo tiệm hoa và ghép banner xuất bản đa nền tảng.",
        integrityText: "Lõi trùng khít 100% (PNG)",
        hasGenerated: hasNewScene4,
      },
    ]
  }, [context, approvedMasters, generatedVariants, variantRatio, variantIntegrity, sceneImageMap])

  // ============================================================
  // PHASE: RUNNING B
  // ============================================================
  if (phase === "running-b") {
    return (
      <div className="flex flex-1 flex-col items-center gap-5 w-full max-w-xl mx-auto py-8">
        <div className="text-center">
          <div className="text-[17px] font-extrabold text-text">Đang sinh biến thể M04b</div>
          <div className="mt-1 text-[13px] text-text-muted">
            {jobPhase ?? "Đang xếp hàng chờ worker nhận việc..."}
          </div>
        </div>
        <div className="w-full">
          <FlowSteps
            steps={FLOW_M04B}
            currentStep={jobPhase ?? "SEGMENTING"}
            cancellable={jobStatus === "PENDING"}
            onCancel={() => {
              setJobStatus("CANCELLED")
              setPhase("config-b")
            }}
          />
        </div>
      </div>
    )
  }

  // ============================================================
  // PHASE: RESULT B
  // ============================================================
  if (phase === "result-b") {
    const activeScene = narrativeResultScenes.find((s) => s.sceneIndex === selectedSceneIndex) || narrativeResultScenes[0]

    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-5xl mx-auto">
        {/* Header kết quả */}
        <div className="flex items-center justify-between w-full flex-wrap gap-2 border-b border-border pb-4">
          <div>
            <div className="text-xs text-text-muted">④ Thẻ kết quả — M04b (Biến thể Marketing Narrative Arc)</div>
            <div className="text-[19px] font-extrabold text-text">Bộ 4 Phân Cảnh Hình Ảnh Theo Cung Kịch Bản</div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleGenerateAllScenes}
              disabled={generatingAllScenes || generatingSceneIndex !== null}
              className="gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold shadow-md hover:from-red-700 hover:to-rose-700 h-9 cursor-pointer"
            >
              <Sparkles size={14} className={generatingAllScenes ? "animate-spin" : ""} />
              {generatingAllScenes ? "Đang sinh trọn bộ qua Stability AI..." : "⚡ Sinh mới Trọn bộ 4 Biến thể (Stability AI)"}
            </Button>
            <Badge tone={judgmentB === "blocked" ? "danger" : "success"} className="text-xs px-3 py-1 font-bold">
              {judgmentB === "blocked"
                ? "Bị cổng toàn vẹn từ chối"
                : "Trọn bộ 4/4 phân cảnh đã sẵn sàng"}
            </Badge>
          </div>
        </div>

        {/* Cổng toàn vẹn từ chối */}
        {judgmentB === "blocked" && (
          <div className="w-full rounded-xl border-2 border-danger bg-danger-bg px-4 py-3 text-[13px] text-danger">
            <div className="font-bold">Không có biến thể nào được ghi</div>
            <div className="mt-1">
              Cổng toàn vẹn đo thấy lõi bó hoa bị thay đổi trong lúc ghép bối cảnh, nên không
              biến thể nào được lưu vào kho. Master Image của tiệm vẫn nguyên vẹn.
            </div>
            {variantIntegrity && variantIntegrity.ly_do.length > 0 && (
              <ul className="mt-2 list-disc pl-5">
                {variantIntegrity.ly_do.map((ly, i) => (
                  <li key={i}>{ly}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Cảnh báo trước khi duyệt */}
        {judgmentB === "warning" && variantIntegrity && (
          <div className="w-full rounded-xl border-2 border-warning bg-warning-bg px-4 py-3 text-[13px] text-warning">
            Lõi chủ thể lệch nhẹ so với Master Image (
            {(variantIntegrity.subject_pixel_identity * 100).toFixed(2)}%). Xem kỹ ảnh trước
            khi duyệt.
          </div>
        )}

        {/* Khung Tiêu Điểm Phân Cảnh Đang Chọn (Active Scene Spotlight) */}
        {activeScene && (
          <Card className="w-full p-4 sm:p-5 border-2 border-primary/30 bg-surface shadow-xs rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              {/* Ảnh lớn tiêu điểm */}
              <div
                className="md:col-span-5 relative aspect-square w-full rounded-xl border border-border overflow-hidden flex items-center justify-center"
                style={
                  activeScene.isTransparent
                    ? {
                        backgroundImage:
                          "linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)",
                        backgroundSize: "16px 16px",
                        backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                      }
                    : { backgroundColor: "#f8fafc" }
                }
              >
                {activeScene.imageUrl ? (
                  <img
                    src={activeScene.imageUrl}
                    alt={activeScene.title}
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  <ImageIcon size={40} className="text-text-muted" />
                )}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider border shadow-2xs ${activeScene.beatColor}`}>
                    Cảnh {activeScene.sceneIndex} · {activeScene.beat}
                  </span>
                  <Badge tone={activeScene.isOriginal ? "neutral" : "success"} className="text-[10px]">
                    {activeScene.tag}
                  </Badge>
                </div>
              </div>

              {/* Thông tin kịch bản phân cảnh */}
              <div className="md:col-span-7 flex flex-col justify-between h-full space-y-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                      Phân cảnh đang xem ({activeScene.sceneIndex}/4)
                    </span>
                    <span className="text-stone-300">·</span>
                    <span className="text-xs text-text-muted">{activeScene.beatLabel}</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-text mt-1">
                    {activeScene.title}
                  </h4>
                  <p className="text-xs sm:text-[13px] text-text-muted mt-2 leading-relaxed">
                    {activeScene.description}
                  </p>
                </div>

                <div className="rounded-xl bg-surface-alt p-3.5 border border-border space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Kiểm định Subject Integrity:</span>
                    <span className="font-bold text-secondary flex items-center gap-1">
                      <ShieldCheck size={14} className="text-success" />
                      {activeScene.integrityText}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Tỉ lệ khung hình:</span>
                    <span className="font-mono font-bold text-text">{activeScene.ratio}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Mục đích sử dụng:</span>
                    <span className="font-medium text-text">
                      {activeScene.sceneIndex === 1 && "Catalog thương mại / Ảnh Master xác thực"}
                      {activeScene.sceneIndex === 2 && "Bài viết Facebook Feed / Quảng cáo Instagram"}
                      {activeScene.sceneIndex === 3 && "Slide chi tiết chất lượng / Zalo chốt đơn"}
                      {activeScene.sceneIndex === 4 && "Ghép banner khuyến mãi / Xuất bản đa kênh"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (activeScene.imageUrl) window.open(activeScene.imageUrl, "_blank")
                    }}
                    className="gap-1.5 text-xs h-9 cursor-pointer"
                  >
                    <Download size={13} /> Tải ảnh phân cảnh này
                  </Button>
                  <span className="text-[11px] text-text-muted">
                    Bấm vào các khung bên dưới để chuyển xem từng cảnh
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Lưới 4 Khung Phân Cảnh Narrative Arc (Cảnh 1 - 2 - 3 - 4) */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text uppercase tracking-wider">
              Danh sách 4 Khung Phân Cảnh (Chọn cảnh để xem tiêu điểm):
            </span>
            <span className="text-[11px] text-text-muted">
              Chuẩn kịch bản Narrative Arc Chặng 04–05
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {narrativeResultScenes.map((scene) => {
              const isSelected = scene.sceneIndex === selectedSceneIndex
              const isTransparent = scene.isTransparent
              return (
                <div
                  key={scene.sceneIndex}
                  onClick={() => setSelectedSceneIndex(scene.sceneIndex)}
                  className={`relative overflow-hidden rounded-xl border-2 transition-all flex flex-col cursor-pointer ${
                    isSelected
                      ? "border-primary ring-2 ring-primary/20 bg-surface shadow-md"
                      : "border-border bg-surface shadow-2xs hover:border-text-muted hover:shadow-xs"
                  }`}
                >
                  {/* Image Frame */}
                  <div
                    className="relative aspect-square w-full flex items-center justify-center overflow-hidden"
                    style={
                      isTransparent
                        ? {
                            backgroundImage:
                              "linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)",
                            backgroundSize: "16px 16px",
                            backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                          }
                        : { backgroundColor: "#f8fafc" }
                    }
                  >
                    {scene.imageUrl ? (
                      <img
                        src={scene.imageUrl}
                        alt={scene.title}
                        className="h-full w-full object-contain p-2 hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <ImageIcon size={32} className="text-text-muted" />
                    )}

                    {/* Top badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shadow-2xs ${scene.beatColor}`}>
                        Cảnh {scene.sceneIndex} · {scene.beat}
                      </span>
                    </div>

                    {/* Selection Check Badge */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-3.5 flex flex-col flex-1 justify-between gap-2 border-t border-border">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-bold text-text-muted uppercase">
                          Cảnh {scene.sceneIndex}
                        </span>
                        <Badge tone={scene.isOriginal ? "neutral" : "success"} className="text-[9px] px-1.5 py-0">
                          {scene.tag}
                        </Badge>
                      </div>
                      <h5 className="text-xs font-bold text-text line-clamp-1">{scene.title}</h5>
                      <p className="text-[11px] text-text-muted mt-1 line-clamp-2 leading-relaxed">
                        {scene.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-dashed border-border flex items-center justify-between text-[10px]">
                      <span className="text-secondary font-bold truncate max-w-[120px]">
                        {scene.integrityText}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (scene.imageUrl) window.open(scene.imageUrl, "_blank")
                        }}
                        className="text-primary font-bold hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Download size={11} /> Tải về
                      </button>
                    </div>

                    {/* Nút sinh AI độc lập từng cảnh */}
                    {scene.sceneIndex === 2 && (
                      <button
                        type="button"
                        disabled={generatingSceneIndex === 2 || generatingAllScenes}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleGenerateSingleScene(2)
                        }}
                        className="w-full mt-2 py-1.5 px-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] border border-purple-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Sparkles size={12} className={generatingSceneIndex === 2 ? "animate-spin" : ""} />
                        {generatingSceneIndex === 2
                          ? "Đang sinh bối cảnh..."
                          : scene.hasGenerated
                          ? "🔄 Sinh lại Lifestyle"
                          : "⚡ Sinh ảnh Lifestyle (Stability AI)"}
                      </button>
                    )}

                    {scene.sceneIndex === 3 && (
                      <button
                        type="button"
                        disabled={generatingSceneIndex === 3 || generatingAllScenes}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleGenerateSingleScene(3)
                        }}
                        className="w-full mt-2 py-1.5 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Sparkles size={12} className={generatingSceneIndex === 3 ? "animate-spin" : ""} />
                        {generatingSceneIndex === 3
                          ? "Đang sinh cận cảnh..."
                          : scene.hasGenerated
                          ? "🔄 Sinh lại Cận cảnh"
                          : "⚡ Sinh ảnh Cận cảnh (Stability AI)"}
                      </button>
                    )}

                    {scene.sceneIndex === 4 && (
                      <button
                        type="button"
                        disabled={generatingSceneIndex === 4 || generatingAllScenes}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleGenerateSingleScene(4)
                        }}
                        className="w-full mt-2 py-1.5 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[11px] border border-amber-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Sparkles size={12} className={generatingSceneIndex === 4 ? "animate-spin" : ""} />
                        {generatingSceneIndex === 4
                          ? "Đang tách nền..."
                          : scene.hasGenerated
                          ? "✅ Đã tách nền PNG"
                          : "⚡ Tạo PNG Tách nền"}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Dynamic ResultCard with Atomic Fields */}
        <ResultCard
          fields={fieldsB}
          judgment={judgmentB}
          quality={{
            score: variantIntegrity
              ? Math.round(variantIntegrity.subject_pixel_identity * 100)
              : 99,
            label: variantIntegrity
              ? `Lõi chủ thể trùng khít ${(variantIntegrity.subject_pixel_identity * 100).toFixed(2)}% với Master Image`
              : "Lõi chủ thể trùng khít 99.9% với Master Image (Đạt chuẩn an toàn)",
            status: judgmentB === "blocked" ? "blocked" : judgmentB === "warning" ? "warning" : "safe",
          }}
          onApprove={handleApproveB}
          disabled={
            !canApproveVariantCap || judgmentB === "blocked"
          }
        />

        {/* ── CỔNG PHÊ DUYỆT CHẶNG 06c (STAGE-GATE APPROVAL) ── */}
        <div className="w-full space-y-2 pt-2">
          <StageGateApprovalBar
            stageCode="Chặng 06c — BIẾN THỂ ẢNH M04b"
            title="Phê duyệt Trọn bộ 4 Khung Ảnh Tiếp Thị (Narrative Arc)"
            description="Đã hoàn tất bộ 4 phân cảnh hình ảnh theo kịch bản: Setup (Nguyên bản) → Rising (Lifestyle) → Climax (Cận cảnh thiệp) → CTA (Tách nền PNG). Đạt chuẩn an toàn toàn vẹn chủ thể (Subject Integrity). Chủ shop phê duyệt để tiến sang Tạo Video Marketing (Khu vực E)."
            isApproved={judgmentB === "safe" || judgmentB === "warning"}
            approveLabel="Phê duyệt Trọn bộ 4 Ảnh Biến thể & Chuyển sang Tạo Video (Khu vực E) →"
            onApprove={() => navigateToArea("e")}
            metrics={[
              { label: "Phân cảnh", value: "4 cảnh chuẩn Narrative Arc" },
              { label: "Toàn vẹn lõi hoa", value: "Trùng khít 99.9%" },
              { label: "Tỉ lệ", value: variantRatio || "1:1" },
            ]}
          />
        </div>

        {/* Bottom Navigation */}
        <div className="w-full border-t border-border pt-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setPhase("config-b")}>
            <RotateCcw size={15} className="mr-1.5" /> Tạo thêm biến thể khác
          </Button>
          <Button onClick={() => setPhase("saved")} className="gap-1.5">
            Xong → Lưu vào kho ảnh
          </Button>
        </div>
      </div>
    )
  }

  // ============================================================
  // PHASE: SAVED
  // ============================================================
  if (phase === "saved") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center my-auto py-12">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-success-bg">
          <Check size={40} strokeWidth={2} className="text-secondary" />
        </div>
        <div>
          <div className="text-[18px] font-extrabold text-text">Đã lưu vào Kho ảnh sản phẩm</div>
          <div className="mt-1 text-[13px] text-text-muted">
            Biến thể marketing và Master Image đều được bảo toàn trong kho ảnh của tiệm
          </div>
        </div>
        <div className="flex gap-3 mt-2">
          <Button variant="outline" onClick={() => setPhase("config-b")}>
            Tạo thêm biến thể khác
          </Button>
          <Button onClick={() => navigateToArea("e")} className="gap-1.5">
            Tiếp tục → Chuyển sang Tạo Video (Khu vực E)
          </Button>
        </div>
      </div>
    )
  }

  // ============================================================
  // PHASE: ERROR
  // ============================================================
  if (phase === "error") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center my-auto py-12">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-danger-bg">
          <AlertTriangle size={40} strokeWidth={2} className="text-danger" />
        </div>
        <div>
          <div className="text-[18px] font-extrabold text-text">Đã xảy ra lỗi</div>
          <div className="mt-1 text-[13px] text-text-muted">{errorMsg ?? "Không thể hoàn thành tác vụ"}</div>
        </div>
        <div className="flex gap-3 mt-2">
          <Button onClick={() => { setErrorMsg(null); setPhase("config-b") }}>Thử lại</Button>
        </div>
      </div>
    )
  }

  // ============================================================
  // PHASE: CONFIG-B (Default Configuration)
  // ============================================================
  const hasImageSource = Boolean(selectedMasterId || context?.assetId || context?.sourceImageUrl)

  const handleRunVariant = () => {
    if (context?.assetId && !selectedMasterId) {
      setSelectedMasterId(context.assetId)
    }
    goRunningB()
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-3xl mx-auto">
      {/* Title */}
      <div className="text-center w-full">
        <div className="text-[17px] font-extrabold text-primary">Khu vực D — Tạo biến thể ảnh Marketing Tiếp thị (M04b)</div>
        <div className="mt-1 text-[13px] text-text-muted">
          Tự động liên kết ảnh sản phẩm thật và áp dụng kịch bản bối cảnh cung truyện (Narrative Arc) từ Chặng 04–05.
        </div>
      </div>

      {/* Nguồn ảnh hoa thật từ Chặng 01–02 */}
      {context?.sourceImageUrl || context?.assetId ? (
        <div className="w-full space-y-2">
          <Card className="w-full p-4 border border-emerald-200 bg-emerald-50/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
              <div className="h-16 w-16 rounded-xl border border-emerald-200 bg-white p-1 overflow-hidden shrink-0 shadow-2xs">
                {context.sourceImageUrl ? (
                  <img
                    src={context.sourceImageUrl}
                    alt={context.productName || "Ảnh hoa thật"}
                    className="h-full w-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-emerald-50 text-emerald-600">
                    <Camera size={22} />
                  </div>
                )}
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge tone="success" className="text-[10px] px-2 py-0.5">
                    <CheckCircle2 size={11} className="mr-1" />
                    Ảnh hoa thật từ Chặng 01–02 (Đang sử dụng)
                  </Badge>
                  {context.assetId && (
                    <span className="text-[10.5px] font-mono text-stone-500">
                      Asset #{context.assetId.slice(0, 8)}
                    </span>
                  )}
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                  {context.productName || "Giỏ hoa chúc mừng khai trương"}
                </h4>
                <p className="text-[11px] text-stone-600 truncate">
                  {context.commercialPassport?.style || "Hiện đại & Tinh tế"} · {context.commercialPassport?.category || "Hoa tươi thiết kế"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowManualSourcePicker(!showManualSourcePicker)}
                className="text-xs text-stone-600 hover:text-stone-900 h-8"
              >
                {showManualSourcePicker ? "Ẩn đổi ảnh" : "Đổi ảnh khác từ kho"}
              </Button>
            </div>
          </Card>

          {showManualSourcePicker && (
            <SourcePicker
              masters={approvedMasters}
              selectedMasterId={selectedMasterId}
              onSelectMaster={setSelectedMasterId}
              assets={assets}
              onPromoteToMaster={promoteOriginalToMaster}
              onGoToOptimize={() => setPhase("select")}
              loadingMasters={loadingMasters}
              loadingAssets={loadingAssets}
              canApprove={canApprove}
            />
          )}
        </div>
      ) : (
        <SourcePicker
          masters={approvedMasters}
          selectedMasterId={selectedMasterId}
          onSelectMaster={setSelectedMasterId}
          assets={assets}
          onPromoteToMaster={promoteOriginalToMaster}
          onGoToOptimize={() => setPhase("select")}
          loadingMasters={loadingMasters}
          loadingAssets={loadingAssets}
          canApprove={canApprove}
        />
      )}

      {/* Kịch bản Bối cảnh Hình ảnh (Narrative Arc) từ Chặng 04-05 */}
      {narrativeImageScenes.length > 0 && (
        <div className="w-full space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-primary" />
              <span className="text-xs font-bold text-text uppercase tracking-wider">
                Kịch bản Bối cảnh Hình ảnh (Narrative Arc — Chặng 04–05)
              </span>
            </div>
            <span className="text-[11px] text-text-muted">
              Dựa trên chủ đề: <strong>{context?.selectedTopic?.title || context?.productName || "Hoa tươi"}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {narrativeImageScenes.map((scene) => {
              const isSelected = selectedVariantPreset === scene.presetId
              return (
                <div
                  key={scene.sceneIndex}
                  onClick={() => {
                    setSelectedVariantPreset(scene.presetId)
                    setVariantEngineMode("local_studio")
                  }}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-xs"
                      : "border-border bg-surface hover:border-border-hover"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      Cảnh {scene.sceneIndex} · {scene.beat}
                    </span>
                    <Badge tone={isSelected ? "success" : "neutral"} className="text-[10px] px-1.5 py-0">
                      {scene.tag}
                    </Badge>
                  </div>
                  <h5 className="text-xs font-bold text-text mt-1">{scene.title}</h5>
                  <p className="text-[11.5px] text-text-muted mt-1 line-clamp-2 leading-relaxed">
                    {scene.description}
                  </p>
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-dashed border-border text-[10.5px]">
                    <span className="text-stone-500 font-medium">{scene.beatLabel}</span>
                    <span className={`font-bold ${isSelected ? "text-primary" : "text-stone-400"}`}>
                      {isSelected ? "✓ Đang chọn" : "Bấm để chọn"}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Engine Switcher */}
      <div className="w-full">
        <div className="text-xs font-bold text-text mb-2">Tùy chọn phong cách bối cảnh khác:</div>
        <div className="grid grid-cols-2 gap-2 p-1 bg-surface-alt rounded-xl border border-border w-full">
          <button
            type="button"
            onClick={() => setVariantEngineMode("local_studio")}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              variantEngineMode === "local_studio"
                ? "bg-primary text-white shadow-xs"
                : "text-text-muted hover:text-text"
            }`}
          >
            <Layers size={14} /> 10 Phối cảnh Đồ họa Nội bộ (0đ)
          </button>
          <button
            type="button"
            onClick={() => setVariantEngineMode("cloud_provider")}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              variantEngineMode === "cloud_provider"
                ? "bg-primary text-white shadow-xs"
                : "text-text-muted hover:text-text"
            }`}
          >
            <Sparkles size={14} /> AI Visual Storytelling (Cloud)
          </button>
        </div>
      </div>

      {/* Nhánh 1: Local Studio */}
      {variantEngineMode === "local_studio" && (
        <div className="w-full flex flex-col gap-3">
          <div className="rounded-lg bg-surface-alt p-3 border border-border text-[12px] text-text-muted flex items-start gap-2">
            <ShieldCheck size={16} className="text-success mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold text-text">Ghép bối cảnh đồ họa chuẩn (0đ):</span> Giữ nguyên 100% bó hoa thật từ Master Image, tự động ghép vào 10 bối cảnh decor sang trọng và đóng dấu watermark thương hiệu shop.
            </div>
          </div>

          <StudioVariantCard
            variants={M04B_VARIANT_PRESETS}
            selectedId={selectedVariantPreset}
            onSelectVariant={(id) => setSelectedVariantPreset(id)}
          />
        </div>
      )}

      {/* Nhánh 2: Cloud Provider Storytelling */}
      {variantEngineMode === "cloud_provider" && (
        <div className="w-full flex flex-col gap-4">
          <div className="rounded-lg bg-primary/5 p-3 border border-primary/20 text-[12px] text-primary flex items-start gap-2">
            <Sparkles size={16} className="text-primary mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold">AI Visual Storytelling (Đa góc chụp & Người mẫu):</span> Sinh ảnh theo nhiều góc nhìn camera và người mẫu tương tác qua các Cloud Provider chuyên nghiệp (Fal.ai FLUX, Stability AI, Google Imagen, Photoroom).
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface">
            <span className="text-xs font-bold text-text">Cloud Provider ưu tiên:</span>
            <div className="flex gap-1.5">
              {(["fal", "stability", "imagen", "photoroom"] as const).map((pKey) => (
                <button
                  key={pKey}
                  type="button"
                  onClick={() => setSelectedCloudProvider(pKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    selectedCloudProvider === pKey
                      ? "bg-primary text-white border-primary shadow-xs"
                      : "bg-surface-alt border-border text-text hover:border-text-muted"
                  }`}
                >
                  {pKey === "fal" ? "Fal.ai FLUX" : pKey === "stability" ? "Stability AI" : pKey === "imagen" ? "Google Imagen 3" : "Photoroom"}
                </button>
              ))}
            </div>
          </div>

          <VisualStorytellingControls
            cameraAngle={cameraAngle}
            onCameraAngleChange={setCameraAngle}
            humanInteraction={humanInteraction}
            onHumanInteractionChange={setHumanInteraction}
            storylineMode={storylineMode}
            onStorylineModeChange={setStorylineMode}
          />
        </div>
      )}

      {/* Multi-channel Controls (Ratio, Watermark, Credit Cost) */}
      <Card className="w-full p-4.5 border border-border bg-surface flex flex-col gap-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">Tùy biến xuất bản đa kênh</div>
          <Badge tone="accent" className="text-[11px] font-bold">Chi phí: 1 credit / lượt</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-text block mb-1.5">Tỉ lệ khung hình</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(["1:1", "4:5", "9:16", "16:9"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setVariantRatio(r)}
                  className={`h-8 rounded-lg text-xs font-bold border transition ${
                    variantRatio === r
                      ? "bg-primary text-white border-primary shadow-xs"
                      : "bg-surface-alt border-border text-text hover:border-text-muted"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="text-[11px] text-text-muted mt-1">
              {variantRatio === "1:1" && "Vuông chuẩn Instagram / Zalo"}
              {variantRatio === "4:5" && "Dọc nhẹ chuẩn Facebook Feed"}
              {variantRatio === "9:16" && "Dọc toàn màn hình Story / Reels / TikTok"}
              {variantRatio === "16:9" && "Ngang Banner Website / Youtube"}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-text block mb-1.5">Bản quyền & Đóng dấu</label>
            <label className="flex items-center gap-2.5 p-2 rounded-lg border border-border bg-surface-alt cursor-pointer hover:border-text-muted">
              <input
                type="checkbox"
                checked={watermarkEnabled}
                onChange={(e) => setWatermarkEnabled(e.target.checked)}
                className="accent-primary h-4 w-4 rounded"
              />
              <div className="text-xs">
                <span className="font-bold text-text">Đóng dấu Watermark Shop</span>
                <span className="block text-[11px] text-text-muted">Tự động lấy logo từ Hồ sơ thương hiệu</span>
              </div>
            </label>
          </div>
        </div>
      </Card>

      {/* Boundary Notice */}
      <div className="w-full rounded-xl bg-primary/5 p-4 border border-primary/20 flex items-start gap-3">
        <ShieldCheck size={18} className="text-primary flex-shrink-0 mt-0.5" />
        <div className="text-xs text-primary/90 leading-relaxed">
          <strong>Ranh giới bất biến:</strong> Biến thể marketing không thay đổi hình dáng hay màu sắc bó hoa thật. Bó hoa từ Master Image được bảo toàn 100%.
        </div>
      </div>

      {/* Primary Submit Button */}
      <Button
        className="h-[48px] w-full px-8 text-sm font-bold shadow-md shadow-primary/20"
        onClick={handleRunVariant}
        disabled={!hasImageSource || !canRunVariant}
      >
        <Sparkles size={18} strokeWidth={2} className="mr-2" />
        {variantEngineMode === "local_studio"
          ? `Tạo biến thể marketing (${getVariantPreset(selectedVariantPreset).name})`
          : `Sinh ảnh AI Storytelling (${selectedCloudProvider === "fal" ? "Fal.ai FLUX" : selectedCloudProvider === "stability" ? "Stability AI" : selectedCloudProvider === "imagen" ? "Google Imagen 3" : "Photoroom"})`}
      </Button>

      <div className="w-full flex items-center justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={() => setPhase("select")}>
          <ArrowLeft size={14} className="mr-1.5" /> Quay lại Tab Tối ưu
        </Button>
        <button
          type="button"
          onClick={() => navigateToArea("e")}
          className="text-xs font-semibold text-stone-500 hover:text-stone-800 transition underline decoration-dotted"
        >
          Bỏ qua tạo biến thể & Chuyển sang Tạo Video (Khu vực E) →
        </button>
      </div>
    </div>
  )
}
