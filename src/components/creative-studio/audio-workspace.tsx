"use client"

import { useState, useCallback, useContext, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Headphones, Send, Loader2, CheckCircle2, AlertCircle, Music, Mic, Volume2 } from "lucide-react"
import { CreativeStudioContext } from "@/app/(app)/creative-studio/page"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StageGateApprovalBar } from "@/components/ui/stage-gate-approval-bar"
import type { AudioQualityTier, AudioTaskType, TtsProviderKey } from "@/modules/audio-studio/domain/audio-types"
import {
  AUDIO_TASK_SPECS,
  AUDIO_TASK_TYPES,
  MAX_VOICE_SCRIPT_LENGTH,
  SELECTABLE_TTS_PROVIDERS,
  audioJobCreditCost,
  estimateSpeechSeconds,
  validateAudioTask,
} from "@/modules/audio-studio/domain/audio-task-rules"
import { suggestMoodForTopicAngle } from "@/modules/audio-studio/domain/music-catalog"
import { VOICE_CATALOG } from "@/modules/audio-studio/domain/voice-catalog"
import { findScenePlan, type ScenePlan } from "./scene-plan-client"
import { MusicLibraryPanel } from "./music-library-panel"
import { VoiceClonePanel } from "./voice-clone-panel"
import { readAudioApiError } from "./audio-library-client"

interface AudioScene { sceneIndex: number; voiceScript: string; targetDurationSeconds: number }

interface AudioJobDetail {
  job_id: string
  stage: "DRAFT" | "GENERATING" | "COMPLETED" | "FAILED"
  task_type: AudioTaskType
  voice_display_name: string | null
  provider_key: string | null
  provider_used: string | null
  provider_fallback: boolean
  music_track_name: string | null
  has_voice: boolean
  total_duration_seconds: number
  loudness_lufs: number | null
  scenes: Array<{ sceneIndex: number; targetDurationSeconds?: number; actualDurationSeconds: number; extended?: boolean }>
  audio_url: string | null
  voice_only_url: string | null
  credits_cost: number
  refunded: boolean
  error: string | null
}

const TASK_ICON: Record<AudioTaskType, typeof Mic> = { VOICEOVER: Mic, MUSIC_SELECT: Music, AUDIO_MIX: Volume2, VOICE_CLONE: Headphones }

const PROVIDER_LABEL: Record<string, string> = {
  openai: "OpenAI TTS",
  elevenlabs: "ElevenLabs",
  minimax: "MiniMax",
  edge_tts: "Microsoft Edge (miễn phí)",
}

export function AudioWorkspace() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const context = useContext(CreativeStudioContext)
  const ctx = context ?? { topicId: "", productId: undefined, voiceId: undefined, musicMood: undefined, productName: "", selectedTopic: null, mode: "CREATIVE" as const }
  const [taskType, setTaskType] = useState<AudioTaskType>("AUDIO_MIX")
  const spec = AUDIO_TASK_SPECS[taskType]

  const navigateToArea = (area: "b" | "c" | "d" | "e" | "f") => {
    const params = new URLSearchParams(searchParams?.toString() || "")
    params.set("area", area)
    router.push(`/creative-studio?${params.toString()}` as never)
  }

  // Lời thoại mặc định từ chủ đề Chặng 04–05 (khi chưa có kịch bản bối cảnh).
  const buildInitialScenes = (): AudioScene[] => {
    const topic = ctx.selectedTopic
    if (!topic) {
      return ctx.topicId
        ? [{ sceneIndex: 1, voiceScript: "", targetDurationSeconds: 8 }, { sceneIndex: 2, voiceScript: "", targetDurationSeconds: 8 }]
        : []
    }
    return [
      { sceneIndex: 1, voiceScript: topic.hook || `Giới thiệu ${ctx.productName}`, targetDurationSeconds: 5 },
      { sceneIndex: 2, voiceScript: `${ctx.productName} — ${topic.title}`, targetDurationSeconds: 8 },
      { sceneIndex: 3, voiceScript: topic.cta || "Đặt hàng ngay hôm nay!", targetDurationSeconds: 4 },
    ]
  }

  const [scenes, setScenes] = useState<AudioScene[]>(buildInitialScenes)
  const [scenesEdited, setScenesEdited] = useState(false)

  // Lời thoại theo KỊCH BẢN BỐI CẢNH của chủ đề (cùng kịch bản với Khu vực D) — chỉ tra.
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

  const scenesFromPlan = (plan: ScenePlan): AudioScene[] =>
    plan.scenes.map((sc) => {
      const script = sc.voiceScript || sc.textOverlay || sc.title
      const base = sc.beat === "CTA" ? 4 : sc.beat === "CLIMAX" ? 7 : 5
      // Đủ thời gian đọc tự nhiên (worker không còn tua nhanh giọng).
      return { sceneIndex: sc.sceneIndex, voiceScript: script, targetDurationSeconds: Math.max(base, Math.ceil(estimateSpeechSeconds(script) + 0.5)) }
    })

  useEffect(() => {
    if (!scenePlan || scenesEdited) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- nạp lời thoại từ kịch bản đã tra được
    setScenes(scenesFromPlan(scenePlan))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenePlan])

  const [voiceId, setVoiceId] = useState(ctx.voiceId ?? "flora-nu-truyen-cam")
  const [providerKey, setProviderKey] = useState<TtsProviderKey>("openai")
  const [qualityTier, setQualityTier] = useState<AudioQualityTier>("hd")
  const [musicTrackId, setMusicTrackId] = useState<string | null>(null)
  const [musicLicenseOk, setMusicLicenseOk] = useState<boolean | null>(null)
  const [voiceCloneId, setVoiceCloneId] = useState<string | null>(null)
  const [musicDuration, setMusicDuration] = useState(15)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const preferredMood =
    ctx.musicMood && ctx.musicMood !== "none"
      ? ctx.musicMood
      : ctx.selectedTopic?.angleCategory
        ? suggestMoodForTopicAngle(ctx.selectedTopic.angleCategory)
        : undefined

  const updateScene = useCallback((index: number, field: keyof AudioScene, value: string | number) => {
    setScenesEdited(true)
    setScenes((prev) => prev.map((s) => (s.sceneIndex === index ? { ...s, [field]: value } : s)))
  }, [])

  const addScene = useCallback(() => {
    setScenesEdited(true)
    setScenes((prev) => [...prev, { sceneIndex: prev.length + 1, voiceScript: "", targetDurationSeconds: 5 }])
  }, [])

  const removeScene = useCallback((index: number) => {
    setScenesEdited(true)
    setScenes((prev) => prev.filter((s) => s.sceneIndex !== index).map((s, i) => ({ ...s, sceneIndex: i + 1 })))
  }, [])

  const totalDuration = spec.needsVoice
    ? scenes.reduce((a, s) => a + Math.max(s.targetDurationSeconds, estimateSpeechSeconds(s.voiceScript) + 0.3), 0)
    : musicDuration
  const effectiveMusic = spec.music === "none" ? null : musicTrackId
  const credit = audioJobCreditCost({ taskType, providerKey, qualityTier, scenes })
  const validation = validateAudioTask({ taskType, scenes, musicTrackId: effectiveMusic, voiceCloneId })
  const firstProblem = Object.values(validation)[0] ?? null

  // Theo dõi job tới khi xong/lỗi (dùng chung lúc vừa tạo và lúc mở lại trang có `audioJobId`).
  const [audioJob, setAudioJob] = useState<AudioJobDetail | null>(null)
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [waitSeconds, setWaitSeconds] = useState(0)
  const [polling, setPolling] = useState(false)
  const pollToken = useRef(0)

  const pollAudioJob = useCallback(async (jobId: string, opts: { updateUrl: boolean }) => {
    const token = ++pollToken.current
    setPolling(true)
    setError(null)
    const startedAt = Date.now()
    const deadline = startedAt + 10 * 60 * 1000
    try {
      while (Date.now() < deadline && token === pollToken.current) {
        const poll = await fetch(`/api/v1/audio/jobs/${encodeURIComponent(jobId)}`)
        if (poll.ok) {
          const detail = (await poll.json()) as AudioJobDetail
          if (token !== pollToken.current) return
          setAudioJob(detail)
          setWaitSeconds(Math.round((Date.now() - startedAt) / 1000))
          if (detail.stage === "COMPLETED") {
            if (opts.updateUrl) {
              const params = new URLSearchParams(searchParams?.toString() || "")
              params.set("audioJobId", jobId)
              router.replace(`/creative-studio?${params.toString()}` as never)
            }
            return
          }
          if (detail.stage === "FAILED") {
            setError(detail.error || "Worker không phối được âm thanh")
            return
          }
        } else if (poll.status === 404) {
          setError("Không tìm thấy job âm thanh này trong tổ chức.")
          return
        }
        await new Promise((r) => setTimeout(r, 2000))
      }
      if (token === pollToken.current) {
        setError("Chưa có kết quả sau 10 phút. Job vẫn nằm trong hàng đợi — bấm “Kiểm tra lại” sau khi worker media chạy.")
      }
    } finally {
      if (token === pollToken.current) setPolling(false)
    }
  }, [router, searchParams])

  const urlAudioJobId = searchParams?.get("audioJobId") ?? null
  useEffect(() => {
    if (!urlAudioJobId || audioJob?.job_id === urlAudioJobId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- nạp kết quả job từ API theo định danh trên URL
    setCurrentJobId(urlAudioJobId)
    void pollAudioJob(urlAudioJobId, { updateUrl: false })
    return () => {
      pollToken.current++
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlAudioJobId])

  const handleCreate = async () => {
    setLoading(true); setError(null); setAudioJob(null); setWaitSeconds(0)
    try {
      const res = await fetch("/api/v1/audio/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json", "idempotency-key": `audio-${crypto.randomUUID()}` },
        body: JSON.stringify({
          taskType,
          scenes: spec.needsVoice
            ? scenes.map((s) => ({ sceneIndex: s.sceneIndex, voiceScript: s.voiceScript, targetDurationSeconds: s.targetDurationSeconds }))
            : [],
          totalDurationSeconds: Math.max(1, Math.round(totalDuration)),
          voiceId: taskType === "VOICE_CLONE" ? undefined : voiceId,
          voiceCloneId: taskType === "VOICE_CLONE" ? voiceCloneId ?? undefined : undefined,
          providerKey: taskType === "VOICE_CLONE" ? undefined : providerKey,
          qualityTier,
          musicTrackId: effectiveMusic ?? undefined,
          musicMood: effectiveMusic ? undefined : "none",
        }),
      })
      if (!res.ok) throw new Error(await readAudioApiError(res))
      const created = (await res.json()) as { jobId: string }
      setCurrentJobId(created.jobId)
      setLoading(false)
      await pollAudioJob(created.jobId, { updateUrl: true })
    } catch (err) { setError(err instanceof Error ? err.message : "Lỗi") }
    finally { setLoading(false) }
  }

  const stage = audioJob?.stage ?? "DRAFT"
  const queuedTooLong = polling && stage === "DRAFT" && waitSeconds >= 20
  const selectedVoice = VOICE_CATALOG.find((v) => v.voiceId === voiceId)

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-5">
        <h3 className="text-sm font-bold text-text mb-3 flex items-center gap-2"><Headphones size={14} /> Loại tác vụ</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {AUDIO_TASK_TYPES.map((tt) => {
            const Icon = TASK_ICON[tt]
            const s = AUDIO_TASK_SPECS[tt]
            return (
              <button key={tt} type="button" onClick={() => setTaskType(tt)} className={`rounded-xl border px-3 py-2.5 text-left transition-all cursor-pointer ${taskType === tt ? "border-primary bg-primary/10" : "border-border bg-background hover:border-border-hover"}`}>
                <span className={`flex items-center gap-1.5 text-xs font-bold ${taskType === tt ? "text-primary" : "text-text"}`}><Icon size={14} /> {s.label}</span>
                <span className="mt-1 block text-[11px] leading-snug text-text-muted">{s.description}</span>
              </button>
            )
          })}
        </div>
      </Card>

      {spec.needsVoice && taskType !== "VOICE_CLONE" && (
        <Card className="p-5">
          <h3 className="text-sm font-bold text-text mb-3 flex items-center gap-2"><Mic size={14} /> Giọng đọc & nhà cung cấp</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {VOICE_CATALOG.map((v) => (
              <button key={v.voiceId} type="button" onClick={() => setVoiceId(v.voiceId)} className={`rounded-lg border px-3 py-2 text-left cursor-pointer ${voiceId === v.voiceId ? "border-primary bg-primary/5" : "border-border"}`}>
                <span className="block text-[12px] font-bold text-text">{v.displayName}</span>
                <span className="block text-[11px] text-text-muted">{v.gender === "female" ? "Nữ" : "Nam"} · {v.description}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-semibold text-text-muted block mb-1">Nhà cung cấp</label>
              <Select value={providerKey} onValueChange={(v) => setProviderKey(v as TtsProviderKey)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SELECTABLE_TTS_PROVIDERS.map((p) => <SelectItem key={p} value={p}>{PROVIDER_LABEL[p] ?? p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-text-muted block mb-1">Chất lượng</label>
              <Select value={qualityTier} onValueChange={(v) => setQualityTier(v as AudioQualityTier)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="hd">HD</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-text-muted">
            Nhà cung cấp lỗi thì hệ thống lùi sang nhà cung cấp khác với <b>cùng giọng</b> {selectedVoice ? `(${selectedVoice.displayName})` : ""} và báo rõ trên kết quả.
          </p>
        </Card>
      )}

      {taskType === "VOICE_CLONE" && (
        <>
          <VoiceClonePanel value={voiceCloneId} onChange={(id) => setVoiceCloneId(id)} />
          <Card className="p-5">
            <label className="text-[11px] font-semibold text-text-muted block mb-1">Chất lượng giọng nhân bản</label>
            <Select value={qualityTier} onValueChange={(v) => setQualityTier(v as AudioQualityTier)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard (ElevenLabs Turbo)</SelectItem>
                <SelectItem value="premium">Premium (ElevenLabs Multilingual v2)</SelectItem>
              </SelectContent>
            </Select>
          </Card>
        </>
      )}

      {spec.music !== "none" && (
        <MusicLibraryPanel
          value={musicTrackId}
          required={spec.music === "required"}
          preferredMood={preferredMood}
          onChange={(id, t) => {
            setMusicTrackId(id)
            setMusicLicenseOk(t ? t.license_verified : null)
          }}
        />
      )}

      {taskType === "MUSIC_SELECT" && (
        <Card className="p-5">
          <label className="text-[11px] font-semibold text-text-muted block mb-1">Thời lượng bản nhạc (giây)</label>
          <input type="number" min={5} max={120} value={musicDuration} onChange={(e) => setMusicDuration(Math.min(120, Math.max(5, parseInt(e.target.value) || 15)))} className="w-32 rounded border border-border px-2 py-1 text-xs focus:border-primary focus:outline-none" />
          <p className="mt-1 text-[11px] text-text-muted">Nhạc được cắt/lặp đủ thời lượng, fade in/out, chuẩn độ to -14 LUFS.</p>
        </Card>
      )}

      {spec.needsVoice && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-text flex items-center gap-2"><Mic size={14} /> Lời thoại ({scenes.length} cảnh)</h3>
            <Button variant="secondary" size="sm" onClick={addScene} className="gap-1.5" disabled={scenes.length >= 12}><Mic size={12} /> Thêm cảnh</Button>
          </div>
          {scenePlan ? (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface-alt px-3 py-2 text-[12px] text-text-muted">
              <span>
                Lời thoại theo kịch bản bối cảnh của chủ đề ({scenePlan.scenes.length} cảnh, cùng kịch bản với ảnh ở Khu vực D
                {scenePlan.source === "rule" ? " — kịch bản cơ bản" : ""}).
              </span>
              {scenesEdited && (
                <button type="button" onClick={() => { setScenes(scenesFromPlan(scenePlan)); setScenesEdited(false) }} className="font-bold text-primary hover:underline cursor-pointer">
                  Dùng lại lời thoại của kịch bản
                </button>
              )}
            </div>
          ) : (
            <p className="mb-3 text-[12px] text-text-muted">
              Chưa có kịch bản bối cảnh cho chủ đề này — lời thoại đang điền từ hook/tiêu đề/CTA. Viết kịch bản ở Khu vực D để ảnh và giọng đọc kể cùng một câu chuyện.
            </p>
          )}
          <div className="flex flex-col gap-3">
            {scenes.map((scene) => {
              const est = estimateSpeechSeconds(scene.voiceScript)
              const longer = est > scene.targetDurationSeconds
              return (
                <div key={scene.sceneIndex} className="bg-surface p-3 rounded-xl border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <Badge tone="neutral">Cảnh #{scene.sceneIndex}</Badge>
                    {scenes.length > 1 && (
                      <button type="button" onClick={() => removeScene(scene.sceneIndex)} className="text-[10px] text-rose-600 font-semibold cursor-pointer">Xóa</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[110px_1fr]">
                    <div>
                      <label className="text-[10px] font-semibold text-text-muted block mb-1">Thời lượng (s)</label>
                      <input type="number" min="1" max="60" value={scene.targetDurationSeconds} onChange={(e) => updateScene(scene.sceneIndex, "targetDurationSeconds", Math.min(60, parseFloat(e.target.value) || 1))} className="w-full rounded border border-border px-2 py-1 text-xs focus:border-primary focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-text-muted block mb-1">Lời thoại</label>
                      <textarea rows={2} maxLength={MAX_VOICE_SCRIPT_LENGTH} value={scene.voiceScript} onChange={(e) => updateScene(scene.sceneIndex, "voiceScript", e.target.value)} placeholder="Nhập lời thoại…" className="w-full rounded border border-border px-2 py-1 text-xs focus:border-primary focus:outline-none" />
                      <p className={`mt-0.5 text-[10px] ${longer ? "text-amber-700" : "text-text-muted"}`}>
                        {scene.voiceScript.length}/{MAX_VOICE_SCRIPT_LENGTH} ký tự · đọc ~{est}s
                        {longer ? ` — dài hơn ${scene.targetDurationSeconds}s, cảnh sẽ tự kéo dài để đọc trọn câu` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-text-muted">
          {firstProblem ? <span className="text-amber-700">{firstProblem}</span> : <>Tổng ~{Math.round(totalDuration)}s · {spec.label}</>}
        </p>
        <Button onClick={handleCreate} disabled={loading || polling || Boolean(firstProblem)} className="gap-2">
          {loading ? <><Loader2 size={14} className="animate-spin" /> Đang tạo...</> : polling ? <><Loader2 size={14} className="animate-spin" /> Đang chờ kết quả...</> : <><Send size={14} /> Tạo {spec.label} · {credit === 0 ? "miễn phí" : `${credit} credit`}</>}
        </Button>
      </div>
      {spec.music !== "none" && effectiveMusic && musicLicenseOk === false && (
        <p className="text-[11px] text-amber-700">Bài nhạc đang chọn chưa có hồ sơ giấy phép thương mại.</p>
      )}
      {error && <Card className="border-rose-200 bg-rose-50 p-4 flex items-center gap-3"><AlertCircle size={16} className="text-rose-600 shrink-0" /><p className="text-xs text-rose-800">{error}{audioJob?.refunded ? " — đã hoàn credit." : ""}</p></Card>}
      {currentJobId && (
        <Card className="p-5 border-emerald-200 bg-emerald-50/40">
          <h3 className="text-sm font-bold text-emerald-800 mb-1 flex items-center gap-2">
            {stage === "COMPLETED" ? <CheckCircle2 size={15} className="text-emerald-600" /> : stage === "FAILED" ? <AlertCircle size={15} className="text-rose-600" /> : <Loader2 size={15} className="animate-spin text-emerald-600" />}
            {stage === "COMPLETED" ? "Đã xong — nghe thử bên dưới" : stage === "FAILED" ? "Thất bại" : stage === "GENERATING" ? "Worker đang xử lý âm thanh..." : "Đang xếp hàng chờ worker nhận việc..."}
            {polling && stage !== "COMPLETED" && stage !== "FAILED" && <span className="font-normal text-emerald-700">({waitSeconds}s)</span>}
          </h3>
          {queuedTooLong && (
            <p className="mb-3 text-[12px] text-amber-700">
              Chưa worker nào nhận job này. Kiểm tra terminal đang chạy <code>npm run worker:media</code> (hoặc <code>npm run dev:all</code>) — nếu nó được bật trước khi cập nhật mã, hãy tắt và chạy lại. Job vẫn nằm trong hàng đợi, không cần tạo lại.
            </p>
          )}
          {stage === "COMPLETED" && audioJob?.provider_fallback && (
            <p className="mb-2 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[12px] text-amber-800">
              {PROVIDER_LABEL[audioJob.provider_key ?? ""] ?? audioJob.provider_key} lỗi — giọng đã được đọc bằng {PROVIDER_LABEL[audioJob.provider_used ?? ""] ?? audioJob.provider_used} (cùng giọng trong danh mục).
            </p>
          )}
          {stage === "COMPLETED" && audioJob?.audio_url && (
            <div className="mb-3 rounded-lg border border-emerald-200 bg-white p-3">
              <audio controls preload="auto" src={audioJob.audio_url} className="w-full">Trình duyệt không phát được âm thanh.</audio>
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-text-muted">
                <span>
                  {audioJob.total_duration_seconds ? `${Math.round(audioJob.total_duration_seconds * 10) / 10}s` : "—"}
                  {audioJob.loudness_lufs !== null ? ` · ${audioJob.loudness_lufs} LUFS` : ""}
                  {audioJob.scenes.some((s) => s.extended) ? " · có cảnh được kéo dài để đọc trọn câu" : ""}
                </span>
                <span className="flex gap-3">
                  <a href={audioJob.audio_url} download className="font-bold text-primary hover:underline">Tải bản chính</a>
                  {audioJob.voice_only_url && <a href={audioJob.voice_only_url} download className="font-bold text-primary hover:underline">Tải bản chỉ giọng</a>}
                </span>
              </div>
            </div>
          )}
          {stage === "COMPLETED" && !audioJob?.audio_url && (
            <p className="mb-3 text-[12px] text-rose-700">Job xong nhưng không có tệp âm thanh trong kho.</p>
          )}
          {!polling && stage !== "COMPLETED" && stage !== "FAILED" && (
            <Button size="sm" variant="outline" className="mb-3" onClick={() => void pollAudioJob(currentJobId, { updateUrl: true })}>Kiểm tra lại</Button>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-white p-3 rounded-lg border border-emerald-100"><p className="text-[11px] text-text-muted">Tác vụ</p><p className="font-bold text-stone-800 truncate">{AUDIO_TASK_SPECS[audioJob?.task_type ?? taskType].label}</p></div>
            <div className="bg-white p-3 rounded-lg border border-emerald-100"><p className="text-[11px] text-text-muted">Giọng đọc</p><p className="font-bold text-stone-800 truncate">{audioJob?.voice_display_name ?? (spec.needsVoice ? "—" : "Không có")}</p></div>
            <div className="bg-white p-3 rounded-lg border border-emerald-100"><p className="text-[11px] text-text-muted">Nhạc nền</p><p className="font-bold text-stone-800 truncate">{audioJob?.music_track_name ?? "Không có"}</p></div>
            <div className="bg-white p-3 rounded-lg border border-emerald-100"><p className="text-[11px] text-text-muted">Chi phí</p><p className="font-bold text-amber-600 font-mono">{audioJob ? (audioJob.refunded ? "đã hoàn" : `${audioJob.credits_cost} credit`) : "—"}</p></div>
          </div>
        </Card>
      )}

      {/* ── CỔNG PHÊ DUYỆT CHẶNG 06b ── */}
      <div className="space-y-2 pt-2">
        <StageGateApprovalBar
          stageCode="Chặng 06b — AUDIO & VOICEOVER"
          title="Phê duyệt Lồng tiếng AI & Nhạc nền Cảm xúc"
          description={`${spec.label}: nghe bản ở trên trước khi xác nhận; chủ shop xác nhận để tiến sang Tạo Biến thể ảnh Tiếp thị (Khu vực D).`}
          isApproved={audioJob?.stage === "COMPLETED"}
          approveLabel="Phê duyệt Audio & Chuyển sang Tạo Biến thể ảnh (Khu vực D) →"
          onApprove={() => navigateToArea("d")}
          metrics={[
            { label: "Tác vụ", value: spec.label },
            { label: "Thời lượng", value: `~${Math.round(totalDuration)}s` },
            { label: "Nhạc nền", value: audioJob?.music_track_name ?? (effectiveMusic ? "Đã chọn" : "Không") },
            { label: "Giọng đọc", value: taskType === "VOICE_CLONE" ? "Giọng nhân bản" : spec.needsVoice ? selectedVoice?.displayName ?? "—" : "Không" },
          ]}
        />
        <div className="flex justify-between items-center text-xs text-stone-500 pt-1">
          <button type="button" onClick={() => navigateToArea("b")} className="hover:text-stone-800 transition">← Quay lại Khu vực B (Nội dung)</button>
          <button type="button" onClick={() => navigateToArea("f")} className="font-medium text-stone-500 hover:text-stone-800 transition underline decoration-dotted">⚡ Đi thẳng đến Đóng gói chiến dịch (Chặng 07) →</button>
        </div>
      </div>
    </div>
  )
}
