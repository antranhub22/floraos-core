"use client"

import { useState, useCallback, useContext, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Headphones, Play, Send, Loader2, CheckCircle2, AlertCircle, Music, Mic, Volume2 } from "lucide-react"
import { CreativeStudioContext } from "@/app/(app)/creative-studio/page"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StageGateApprovalBar } from "@/components/ui/stage-gate-approval-bar"

interface AudioScene { sceneIndex: number; voiceScript: string; targetDurationSeconds: number }

interface AudioJobDetail {
  job_id: string
  stage: "DRAFT" | "GENERATING" | "COMPLETED" | "FAILED"
  total_duration_seconds: number
  audio_url: string | null
  error: string | null
}

export function AudioWorkspace() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const context = useContext(CreativeStudioContext)
  const ctx = context ?? { topicId: "", productId: undefined, voiceId: undefined, musicMood: undefined, productName: "", selectedTopic: null, mode: "CREATIVE" as const }
  const [taskType, setTaskType] = useState<string>("VOICEOVER")

  const navigateToArea = (area: "b" | "c" | "d" | "e" | "f") => {
    const params = new URLSearchParams(searchParams?.toString() || "")
    params.set("area", area)
    router.push(`/creative-studio?${params.toString()}` as never)
  }

  // Auto-populate scenes from selectedTopic (Chặng 4 output → Tab C input)
  const buildInitialScenes = (): AudioScene[] => {
    const topic = ctx.selectedTopic
    if (!topic) {
      return ctx.topicId
        ? [{ sceneIndex: 1, voiceScript: "", targetDurationSeconds: 8 }, { sceneIndex: 2, voiceScript: "", targetDurationSeconds: 8 }]
        : []
    }
    // Scene 1: Hook (mở đầu thu hút)
    // Scene 2: Nội dung chính (productName + angle)
    // Scene 3: CTA (kêu gọi hành động)
    return [
      { sceneIndex: 1, voiceScript: topic.hook || `Giới thiệu ${ctx.productName}`, targetDurationSeconds: 5 },
      { sceneIndex: 2, voiceScript: `${ctx.productName} — ${topic.title}`, targetDurationSeconds: 8 },
      { sceneIndex: 3, voiceScript: topic.cta || "Đặt hàng ngay hôm nay!", targetDurationSeconds: 4 },
    ]
  }

  const [scenes, setScenes] = useState<AudioScene[]>(buildInitialScenes)
  const [voiceId, setVoiceId] = useState(ctx.voiceId ?? "")
  const [providerKey, setProviderKey] = useState<string>("openai")
  const [qualityTier, setQualityTier] = useState<string>("hd")
  const [musicMood, setMusicMood] = useState<string>(ctx.musicMood ?? "none")
  const [loading, setLoading] = useState(false)
  const [jobResult, setJobResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const updateScene = useCallback((index: number, field: keyof AudioScene, value: string | number) => {
    setScenes((prev) => prev.map((s) => (s.sceneIndex === index ? { ...s, [field]: value } : s)))
  }, [])

  const addScene = useCallback(() => {
    setScenes((prev) => [...prev, { sceneIndex: prev.length + 1, voiceScript: "", targetDurationSeconds: 5 }])
  }, [])

  const removeScene = useCallback((index: number) => {
    setScenes((prev) => prev.filter((s) => s.sceneIndex !== index).map((s, i) => ({ ...s, sceneIndex: i + 1 })))
  }, [])

  const totalDuration = scenes.reduce((a, s) => a + s.targetDurationSeconds, 0)

  // 23/09/2026: gửi Idempotency-Key (YC-U7) và CHỜ worker `audio.generate`
  // phối xong — trước đây chỉ hiện "đã xếp hàng", không có kết quả nghe được.
  const [audioJob, setAudioJob] = useState<AudioJobDetail | null>(null)
  const [waitSeconds, setWaitSeconds] = useState(0)
  const [polling, setPolling] = useState(false)
  const pollToken = useRef(0)

  // Theo dõi một job âm thanh tới khi xong/lỗi. Dùng chung cho lúc vừa tạo và
  // lúc mở lại trang có `audioJobId` trên URL (nghe lại được, không phải tạo lại).
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
              // Mang định danh (không mang dữ liệu) sang các khu vực sau — Khu vực F đọc lại qua API.
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

  // Mở lại trang (hoặc quay lại tab C) khi đã có audioJobId → nạp lại bản phối để nghe.
  const urlAudioJobId = searchParams?.get("audioJobId") ?? null
  useEffect(() => {
    if (!urlAudioJobId || audioJob?.job_id === urlAudioJobId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- nạp kết quả job từ API theo định danh trên URL
    setJobResult({ jobId: urlAudioJobId })
    void pollAudioJob(urlAudioJobId, { updateUrl: false })
    return () => {
      pollToken.current++
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlAudioJobId])

  const handleCreate = async () => {
    setLoading(true); setError(null); setJobResult(null); setAudioJob(null); setWaitSeconds(0)
    try {
      const duration = scenes.reduce((a, s) => a + s.targetDurationSeconds, 0)
      const res = await fetch("/api/v1/audio/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json", "idempotency-key": `audio-${crypto.randomUUID()}` },
        body: JSON.stringify({
          taskType,
          scenes: scenes.map((s) => ({ sceneIndex: s.sceneIndex, voiceScript: s.voiceScript, targetDurationSeconds: s.targetDurationSeconds })),
          totalDurationSeconds: duration > 0 ? duration : 15,
          voiceId: voiceId || undefined,
          providerKey,
          qualityTier,
          musicMood: musicMood || undefined,
          topicAngleCategory: ctx.selectedTopic?.angleCategory,
        }),
      })
      if (!res.ok) { const body = (await res.json().catch(() => ({}))).error?.message ?? `Lỗi ${res.status}`; throw new Error(body) }
      const created = (await res.json()) as Record<string, unknown> & { jobId: string }
      setJobResult(created)
      setLoading(false)
      await pollAudioJob(created.jobId, { updateUrl: true })
    } catch (err) { setError(err instanceof Error ? err.message : "Lỗi") }
    finally { setLoading(false) }
  }

  const currentJobId = (jobResult?.jobId as string | undefined) ?? audioJob?.job_id ?? null
  const stage = audioJob?.stage ?? "DRAFT"
  // Job chưa được worker nhận quá 20 giây: gần như chắc chắn worker media không
  // chạy, hoặc đang chạy bản cũ chưa có xử lý `audio.generate` (nối 23/09/2026).
  const queuedTooLong = polling && stage === "DRAFT" && waitSeconds >= 20

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-5">
        <h3 className="text-sm font-bold text-text mb-3 flex items-center gap-2"><Headphones size={14} /> Loại tác vụ</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(["VOICEOVER","MUSIC_SELECT","AUDIO_MIX","VOICE_CLONE"] as const).map((tt) => (
            <button key={tt} type="button" onClick={() => setTaskType(tt)} className={`rounded-xl border px-3 py-2.5 text-xs font-bold text-center transition-all cursor-pointer ${taskType === tt ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-text-muted hover:border-border-hover"}`}>
              {tt === "VOICEOVER" && <Mic size={14} className="mx-auto mb-1" />}
              {tt === "MUSIC_SELECT" && <Music size={14} className="mx-auto mb-1" />}
              {tt === "AUDIO_MIX" && <Volume2 size={14} className="mx-auto mb-1" />}
              {tt === "VOICE_CLONE" && <Headphones size={14} className="mx-auto mb-1" />}
              {tt.replace("_", " ")}
            </button>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="text-sm font-bold text-text mb-3">Cấu hình & Provider</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-text-muted block mb-1">Provider</label>
            <Select value={providerKey} onValueChange={setProviderKey}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["openai","elevenlabs","minimax","edge_tts","local_fallback"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-text-muted block mb-1">Chất lượng</label>
            <Select value={qualityTier} onValueChange={setQualityTier}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="hd">HD</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
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
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-text flex items-center gap-2"><Mic size={14} /> Voiceover ({scenes.length} cảnh)</h3>
          <Button variant="secondary" size="sm" onClick={addScene} className="gap-1.5"><Mic size={12} /> Thêm</Button>
        </div>
        <div className="flex flex-col gap-3">
          {scenes.map((scene) => (
            <div key={scene.sceneIndex} className="bg-surface p-3 rounded-xl border border-border">
              <div className="flex items-center justify-between mb-2">
                <Badge tone="neutral">Cảnh #{scene.sceneIndex}</Badge>
                {scenes.length > 1 && (
                  <button type="button" onClick={() => removeScene(scene.sceneIndex)} className="text-[10px] text-rose-600 font-semibold cursor-pointer">Xóa</button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-text-muted block mb-1">Thời lượng (s)</label>
                  <input type="number" min="1" max="60" value={scene.targetDurationSeconds} onChange={(e) => updateScene(scene.sceneIndex, "targetDurationSeconds", parseFloat(e.target.value) || 1)} className="w-full rounded border border-border px-2 py-1 text-xs focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-text-muted block mb-1">Voice Script</label>
                  <input type="text" value={scene.voiceScript} onChange={(e) => updateScene(scene.sceneIndex, "voiceScript", e.target.value)} placeholder="Nhập lời thoại AI..." className="w-full rounded border border-border px-2 py-1 text-xs focus:border-primary focus:outline-none" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-text-muted">Gọi <code className="bg-surface px-1.5 py-0.5 rounded text-xs">POST /api/v1/audio/jobs</code></p>
        <Button onClick={handleCreate} disabled={loading || polling || scenes.length === 0} className="gap-2">
          {loading ? <><Loader2 size={14} className="animate-spin" /> Đang tạo...</> : polling ? <><Loader2 size={14} className="animate-spin" /> Đang chờ kết quả...</> : <><Send size={14} /> Tạo audio job</>}
        </Button>
      </div>
      {error && <Card className="border-rose-200 bg-rose-50 p-4 flex items-center gap-3"><AlertCircle size={16} className="text-rose-600 shrink-0" /><p className="text-xs text-rose-800">{error}</p></Card>}
      {jobResult && (
        <Card className="p-5 border-emerald-200 bg-emerald-50/40">
          <h3 className="text-sm font-bold text-emerald-800 mb-1 flex items-center gap-2">
            {stage === "COMPLETED" ? <CheckCircle2 size={15} className="text-emerald-600" /> : stage === "FAILED" ? <AlertCircle size={15} className="text-rose-600" /> : <Loader2 size={15} className="animate-spin text-emerald-600" />}
            {stage === "COMPLETED"
              ? "Đã phối xong — nghe thử bên dưới"
              : stage === "FAILED"
              ? "Phối âm thanh thất bại"
              : stage === "GENERATING"
              ? "Worker đang lồng tiếng & phối nhạc..."
              : "Đang xếp hàng chờ worker nhận việc..."}
            {polling && stage !== "COMPLETED" && stage !== "FAILED" && <span className="font-normal text-emerald-700">({waitSeconds}s)</span>}
          </h3>
          {queuedTooLong && (
            <p className="mb-3 text-[12px] text-amber-700">
              Chưa worker nào nhận job này. Kiểm tra terminal đang chạy <code>npm run worker:media</code> (hoặc <code>npm run dev:all</code>) — nếu nó được bật trước khi cập nhật mã, hãy tắt và chạy lại để worker nhận việc <code>audio.generate</code>. Job vẫn nằm trong hàng đợi, không cần tạo lại.
            </p>
          )}
          {stage === "COMPLETED" && audioJob?.audio_url && (
            <div className="mb-3 rounded-lg border border-emerald-200 bg-white p-3">
              <audio controls preload="auto" src={audioJob.audio_url} className="w-full">
                Trình duyệt không phát được âm thanh.
              </audio>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-text-muted">
                <span>Thời lượng: {audioJob.total_duration_seconds ? `${Math.round(audioJob.total_duration_seconds * 10) / 10}s` : "—"}</span>
                <a href={audioJob.audio_url} download className="font-bold text-primary hover:underline">Tải bản phối</a>
              </div>
            </div>
          )}
          {stage === "COMPLETED" && !audioJob?.audio_url && (
            <p className="mb-3 text-[12px] text-rose-700">Job xong nhưng không có tệp âm thanh trong kho.</p>
          )}
          {!polling && currentJobId && stage !== "COMPLETED" && (
            <Button size="sm" variant="outline" className="mb-3" onClick={() => void pollAudioJob(currentJobId, { updateUrl: true })}>
              Kiểm tra lại
            </Button>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs"><p className="text-[11px] text-text-muted">Job ID</p><p className="font-mono text-[11px] font-bold text-stone-800 truncate">{currentJobId ?? "Đã tạo"}</p></div>
            <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs"><p className="text-[11px] text-text-muted">Giọng đọc</p><p className="font-bold text-stone-800 truncate">{(jobResult.voiceDisplayName as string) || voiceId || "Mặc định"}</p></div>
            <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs"><p className="text-[11px] text-text-muted">Nhạc nền</p><p className="font-bold text-stone-800 truncate">{(jobResult.musicTrackName as string) || (musicMood !== "none" ? musicMood : "Không có")}</p></div>
            <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs"><p className="text-[11px] text-text-muted">Chi phí</p><p className="font-bold text-amber-600 font-mono">{jobResult.usage ? `${(jobResult.usage as { costCredit?: number }).costCredit ?? 0} credit đã trừ` : "—"}</p></div>
          </div>
        </Card>
      )}

      {/* ── CỔNG PHÊ DUYỆT CHẶNG 06b (STAGE-GATE APPROVAL) ── */}
      <div className="space-y-2 pt-2">
        <StageGateApprovalBar
          stageCode="Chặng 06b — AUDIO & VOICEOVER"
          title="Phê duyệt Lồng tiếng AI & Nhạc nền Cảm xúc"
          description={`Lời thoại ${scenes.length} phân cảnh và nhạc nền. Nghe bản phối ở trên trước khi xác nhận; chủ shop xác nhận để tiến sang Tạo Biến thể ảnh Tiếp thị (Khu vực D).`}
          isApproved={audioJob?.stage === "COMPLETED"}
          approveLabel="Phê duyệt Audio & Chuyển sang Tạo Biến thể ảnh (Khu vực D) →"
          onApprove={() => navigateToArea("d")}
          metrics={[
            { label: "Phân cảnh", value: `${scenes.length} cảnh thoại` },
            { label: "Thời lượng", value: `~${totalDuration}s` },
            { label: "Âm nhạc", value: musicMood !== "none" ? musicMood : "Tự nhiên" },
            { label: "Giọng đọc", value: voiceId || "Mặc định" },
          ]}
        />
        <div className="flex justify-between items-center text-xs text-stone-500 pt-1">
          <button
            type="button"
            onClick={() => navigateToArea("b")}
            className="hover:text-stone-800 transition"
          >
            ← Quay lại Khu vực B (Nội dung)
          </button>
          <button
            type="button"
            onClick={() => navigateToArea("f")}
            className="font-medium text-stone-500 hover:text-stone-800 transition underline decoration-dotted"
          >
            ⚡ Đi thẳng đến Đóng gói chiến dịch (Chặng 07) →
          </button>
        </div>
      </div>
    </div>
  )
}
