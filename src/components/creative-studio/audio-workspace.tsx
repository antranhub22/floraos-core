"use client"

import { useState, useCallback, useContext } from "react"
import { Headphones, Play, Send, Loader2, CheckCircle2, AlertCircle, Music, Mic, Volume2 } from "lucide-react"
import { CreativeStudioContext } from "@/app/(app)/creative-studio/page"
import { CreativeGuidanceCard } from "@/components/templates/creative-studio/creative-guidance-card"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AudioScene { sceneIndex: number; voiceScript: string; targetDurationSeconds: number }

export function AudioWorkspace() {
  const context = useContext(CreativeStudioContext)
  const ctx = context ?? { topicId: "", productId: undefined, voiceId: undefined, musicMood: undefined }
  const [taskType, setTaskType] = useState<string>("VOICEOVER")
  const [scenes, setScenes] = useState<AudioScene[]>(ctx.topicId ? [{ sceneIndex: 1, voiceScript: "", targetDurationSeconds: 8 }, { sceneIndex: 2, voiceScript: "", targetDurationSeconds: 8 }] : [])
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

  const handleCreate = useCallback(async () => {
    setLoading(true); setError(null); setJobResult(null)
    try {
      const res = await fetch("/api/v1/audio/jobs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskType, scenes: scenes.map((s) => ({ sceneIndex: s.sceneIndex, voiceScript: s.voiceScript, targetDurationSeconds: s.targetDurationSeconds })),
          voiceId: voiceId || undefined, providerKey, qualityTier, musicMood: musicMood || undefined, topicAngleCategory: undefined,
        }),
      })
      if (!res.ok) { const body = (await res.json()).error?.message ?? `Lỗi ${res.status}`; throw new Error(body) }
      setJobResult(await res.json())
    } catch (err) { setError(err instanceof Error ? err.message : "Lỗi") }
    finally { setLoading(false) }
  }, [taskType, scenes, voiceId, providerKey, qualityTier, musicMood])

  const totalDuration = scenes.reduce((a, s) => a + s.targetDurationSeconds, 0)

  return (
    <div className="flex flex-col gap-5">
      <CreativeGuidanceCard area="area-c" />
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
        <Button onClick={handleCreate} disabled={loading || scenes.length === 0} className="gap-2">
          {loading ? <><Loader2 size={14} className="animate-spin" /> Đang tạo...</> : <><Send size={14} /> Tạo audio job</>}
        </Button>
      </div>
      {error && <Card className="border-rose-200 bg-rose-50 p-4 flex items-center gap-3"><AlertCircle size={16} className="text-rose-600 shrink-0" /><p className="text-xs text-rose-800">{error}</p></Card>}
      {jobResult && (
        <Card className="p-5">
          <h3 className="text-sm font-bold text-emerald-700 mb-3 flex items-center gap-2"><CheckCircle2 size={14} /> Đã tạo audio job</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-surface p-3 rounded-lg"><p className="text-[11px] text-text-muted">Job ID</p><p className="font-mono text-[11px] font-bold">{jobResult.job_id as string}</p></div>
            <div className="bg-surface p-3 rounded-lg"><p className="text-[11px] text-text-muted">Status</p><p className="font-bold">{jobResult.status as string}</p></div>
          </div>
        </Card>
      )}
    </div>
  )
}
