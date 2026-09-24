"use client"

import React, { useState, useCallback, useContext, useEffect } from "react"
import { Sparkles, Wand2, FileText, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { CreativeStudioContext } from "@/app/(app)/creative-studio/page"
import { CreativeResultViewer, type CreativeResultViewerProps } from "./creative-result-viewer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import type { ConcreteTopic } from "@/modules/market-intelligence/domain/product-intelligence-types"
import { findScenePlan, type ScenePlan } from "./scene-plan-client"

interface TopicSelector {
  topicId: string
  topicTitle: string
  topicAngle: string
  topicCategory: string
  topicHook: string
  topicCta: string
  topicEmotionalTone: string
  format: string
  selected: boolean
}

const ANGLE_LABELS: Record<string, { label: string }> = {
  PRODUCT_SHOWCASE: { label: "Giới thiệu sản phẩm & Giá" },
  EDUCATIONAL: { label: "Chia sẻ bí quyết & Cẩm nang" },
  PROBLEM_SOLUTION: { label: "Gỡ rối tình huống tặng quà" },
  EMOTIONAL: { label: "Chạm cảm xúc & Tình cảm" },
  TREND: { label: "Bắt sóng trào lưu thịnh hành" },
  PRICE_VALUE: { label: "Phân khúc giá & Giá trị" },
}

export function ContentsWorkspace() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const context = useContext(CreativeStudioContext)
  const ctx = context ?? {
    topicId: "",
    mode: "CREATIVE" as const,
    sourceImageUrl: "",
    sourceVideoUrl: undefined,
    productName: "",
    productId: undefined,
    voiceId: undefined,
    musicMood: undefined,
    report: null,
    topics: [],
    selectedTopic: null,
  }

  const [mode, setMode] = useState<"CREATIVE" | "AUTHENTIC">(ctx.mode)
  const [topics, setTopics] = useState<TopicSelector[]>([])
  const [voiceId, setVoiceId] = useState(ctx.voiceId ?? "")
  const [musicMood, setMusicMood] = useState(ctx.musicMood ?? "none")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Kịch bản bối cảnh sinh ở Chặng 05 (24/09/2026) — cung truyện của chủ đề
  // đã chọn hiển thị theo ĐÚNG kịch bản này (cùng kịch bản với ảnh D, lời
  // thoại C), thay cho cung truyện theo luật của `produce`. Chỉ tra, không trừ credit.
  const [scenePlan, setScenePlan] = useState<ScenePlan | null>(null)
  const urlPlanId = searchParams?.get("scenePlanId") ?? null
  useEffect(() => {
    if (!context) return
    let cancelled = false
    findScenePlan(
      {
        mode: context.mode,
        productName: context.productName,
        productId: context.productId,
        assetId: context.assetId,
        selectedTopic: context.selectedTopic,
        commercialPassport: context.commercialPassport,
        platforms: context.platforms,
        outputs: context.outputs,
      },
      urlPlanId
    )
      .then(({ loaded }) => {
        if (!cancelled) setScenePlan(loaded?.plan ?? null)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context?.assetId, context?.selectedTopic?.id, context?.mode, urlPlanId])

  // Initialize topics from context when report is loaded
  useEffect(() => {
    if (ctx.topics && ctx.topics.length > 0) {
      const mappedTopics: TopicSelector[] = ctx.topics.map((t) => ({
        topicId: t.id,
        topicTitle: t.title,
        topicAngle: t.angleCategory,
        topicCategory: ANGLE_LABELS[t.angleCategory]?.label || t.angleCategory,
        topicHook: t.hook,
        topicCta: t.cta,
        topicEmotionalTone: "Tích cực",
        format: t.format,
        selected: t.id === ctx.selectedTopic?.id || false,
      }))
      // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ state từ nguồn ngoài (URL/API), chủ đích
      setTopics(mappedTopics)
    } else if (ctx.topicId) {
      // Fallback to basic topic from URL params
      setTopics([
        {
          topicId: ctx.topicId,
          topicTitle: ctx.productName || ctx.topicId,
          topicAngle: "PRODUCT_SHOWCASE",
          topicCategory: "Giới thiệu sản phẩm",
          topicHook: "",
          topicCta: "",
          topicEmotionalTone: "Tích cực",
          format: "REELS_TIKTOK_9_16",
          selected: true,
        },
      ])
    }
  }, [ctx.topics, ctx.selectedTopic, ctx.topicId, ctx.productName])

  const toggleTopic = useCallback((topicId: string) => {
    setTopics((prev) => prev.map((t) => (t.topicId === topicId ? { ...t, selected: !t.selected } : t)))
  }, [])

  const handleProduce = useCallback(async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const selected = topics.filter((t) => t.selected)
      // Build commercialPassport from report or fallback to basic info
      // Passport do trang Creative Studio dựng từ report thật (page.tsx) —
      // không tự dựng lại ở đây với `category = priceSegment` như bản trước.
      const cp = context?.commercialPassport
      const passport = {
        productName: ctx.report?.commercialPassport?.suggestedName || ctx.productName,
        category: cp?.category ?? "",
        style: cp?.style ?? "",
        components: cp?.components ?? [],
        colors: cp?.colors ?? [],
        ...(cp?.priceRange ? { priceRange: cp.priceRange } : {}),
        ...(cp?.targetAudience ? { targetAudience: cp.targetAudience } : {}),
        ...(cp?.suggestedOccasions ? { suggestedOccasions: cp.suggestedOccasions } : {}),
      }

      const res = await fetch("/api/v1/creative-production/produce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: {
            mode,
            productContext: {
              sourceImageUrl: ctx.sourceImageUrl,
              sourceVideoUrl: ctx.sourceVideoUrl,
              commercialPassport: passport,
            },
            selectedTopics: selected.map((t) => ({
              topicId: t.topicId,
              topicTitle: t.topicTitle,
              topicAngle: t.topicAngle,
              topicCategory: t.topicCategory,
              topicHook: t.topicHook,
              topicCta: t.topicCta,
              topicEmotionalTone: t.topicEmotionalTone,
            })),
            voiceId: voiceId || undefined,
            musicMood: musicMood || undefined,
          },
        }),
      })
      if (!res.ok) {
        const body = (await res.json()).error?.message ?? `Lỗi ${res.status}`
        throw new Error(body)
      }
      setResult(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi")
    } finally {
      setLoading(false)
    }
  }, [mode, topics, voiceId, musicMood, ctx])

  const selectedTopics = topics.filter((t) => t.selected)

  const navigateToArea = (area: "b" | "c" | "d" | "e" | "f") => {
    const params = new URLSearchParams(searchParams?.toString() || "")
    params.set("area", area)
    router.push(`/creative-studio?${params.toString()}` as never)
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="border-2 border-dashed border-red-300 bg-red-50/70 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-extrabold text-red-950 flex items-center gap-2">
              <Sparkles className="text-red-600" size={20} /> Chế độ sản xuất nội dung
            </h3>
            <p className="text-[13px] text-red-700/90 mt-1 max-w-lg mx-auto">
              {mode === "CREATIVE" ? "CREATIVE: AI biến thể ảnh + cung truyện 5 nhịp + video viral" : "AUTHENTIC: Giữ ảnh gốc 100%, crop theo platform"}
            </p>
          </div>
          <Select value={mode} onValueChange={(v: "CREATIVE" | "AUTHENTIC") => setMode(v)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="CREATIVE"><span className="flex items-center gap-2"><Sparkles size={12} /> CREATIVE</span></SelectItem>
              <SelectItem value="AUTHENTIC"><span className="flex items-center gap-2"><FileText size={12} /> AUTHENTIC</span></SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="text-sm font-bold text-text mb-3">Chủ đề từ Chặng 4 ({selectedTopics.length} đã chọn)</h3>
        {topics.length === 0 ? (
          <p className="text-xs text-text-muted">Chưa có chủ đề nào được truyền từ Chặng 4</p>
        ) : (
          <div className="flex flex-col gap-2">
            {topics.map((topic) => (
              <div
                key={topic.topicId}
                onClick={() => toggleTopic(topic.topicId)}
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  topic.selected ? "border-primary bg-primary/5" : "border-border hover:border-border-hover"
                }`}
              >
                <div className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 ${topic.selected ? "bg-primary border-primary" : "border-border"}`}>
                  {topic.selected && <CheckCircle2 size={12} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0"><p className="text-xs font-bold text-text truncate">{topic.topicTitle}</p><p className="text-[10px] text-text-muted">{topic.topicCategory} · {topic.topicAngle}</p></div>
                <Badge tone={topic.selected ? "success" : "neutral"} className="text-[10px]">{topic.selected ? "Đã chọn" : "Chưa chọn"}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card className="p-5">
        <h3 className="text-sm font-bold text-text mb-3">Cấu hình phụ</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-text-muted block mb-1">Giọng đọc</label>
            <input type="text" value={voiceId} onChange={(e) => setVoiceId(e.target.value)} placeholder="vi-VN-Standard-A" className="w-full rounded-lg border border-border px-3 py-2 text-xs focus:border-primary focus:outline-none" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-text-muted block mb-1">Âm nhạc</label>
            <Select value={musicMood} onValueChange={setMusicMood}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["none","romantic","upbeat","chill","warm","luxury"].map((m) => <SelectItem key={m} value={m}>{m === "none" ? "Không có" : m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-text-muted">Gọi <code className="bg-surface px-1.5 py-0.5 rounded text-xs">POST /api/v1/creative-production/produce</code></p>
        <Button onClick={handleProduce} disabled={loading || selectedTopics.length === 0} className="gap-2">
          {loading ? <><Loader2 size={14} className="animate-spin" /> Đang sản xuất...</> : <><Send size={14} /> Sản xuất {mode}</>}
        </Button>
      </div>
      {error && <Card className="border-rose-200 bg-rose-50 p-4 flex items-center gap-3"><AlertCircle size={16} className="text-rose-600 shrink-0" /><p className="text-xs text-rose-800">{error}</p></Card>}
      {result && (
        <CreativeResultViewer
          mode={mode}
          topicResults={withScenePlan(
            (result.topicResults as CreativeResultViewerProps["topicResults"] | undefined) ?? [],
            scenePlan
          )}
          totalCredits={(result.totalEstimatedCredits as number) ?? 0}
          onGoToAudio={() => navigateToArea("c")}
          onGoToPackage={() => navigateToArea("f")}
        />
      )}
    </div>
  )
}

/** Thay cung truyện theo luật của chủ đề trùng bằng kịch bản bối cảnh đã lưu. */
function withScenePlan(
  items: CreativeResultViewerProps["topicResults"],
  plan: ScenePlan | null
): CreativeResultViewerProps["topicResults"] {
  if (!plan) return items
  return items.map((item) =>
    item.topicId !== plan.topicId
      ? item
      : {
          ...item,
          planPosts: plan.content.posts.map((p) => ({ channel: p.channel, text: p.text, hashtags: p.hashtags })),
          arc: {
            emotionalTone: plan.emotionalTone,
            narrativeReasoning: `${plan.source === "ai" ? "Kịch bản AI" : "Kịch bản cơ bản"} từ Chặng 05 — ${plan.reasoning}`,
            totalDurationSeconds: plan.video.totalDurationSeconds,
            scenes: plan.scenes.map((sc, i) => ({
              sceneIndex: sc.sceneIndex,
              beat: sc.beat,
              beatTitle: sc.title,
              sceneDescription: [sc.setting, sc.lighting].filter(Boolean).join(" · "),
              voiceScript: sc.voiceScript,
              textOverlay: sc.textOverlay,
              // Thời lượng theo kịch bản sản xuất tổng (v2) — cùng số C/E dùng.
              durationSeconds: sc.durationSeconds ?? item.arc?.scenes[i]?.durationSeconds ?? 5,
              motionEffect: sc.motionEffect,
            })),
          },
        }
  )
}
