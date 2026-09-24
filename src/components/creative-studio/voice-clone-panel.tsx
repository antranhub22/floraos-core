"use client"

import { useEffect, useRef, useState } from "react"
import { Headphones, Loader2, Trash2, Upload } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { VOICE_CLONE_CONSENT_TEXT } from "@/modules/audio-studio/domain/audio-task-rules"
import { createVoiceClone, fetchVoiceClones, removeVoiceClone, type VoiceCloneItem } from "./audio-library-client"

const CLONE_CREDIT = 5

const STATUS: Record<VoiceCloneItem["status"], { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  READY: { label: "Sẵn sàng", tone: "success" },
  PENDING: { label: "Đang nhân bản…", tone: "warning" },
  FAILED: { label: "Lỗi — đã hoàn credit", tone: "danger" },
  DELETED: { label: "Đã xoá", tone: "neutral" },
}

/**
 * Giọng nhân bản của chủ tiệm (quyết định PO 24/09/2026 — ElevenLabs Instant
 * Voice Clone). Tải mẫu 1–3 phút + tick cam kết → job `audio.voice_clone`
 * (5 credit) → giọng READY dùng cho tác vụ Voice Clone.
 */
export function VoiceClonePanel({ value, onChange }: { value: string | null; onChange: (id: string | null, clone: VoiceCloneItem | null) => void }) {
  const [clones, setClones] = useState<VoiceCloneItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    let cancelled = false
    const load = () =>
      fetchVoiceClones()
        .then((list) => {
          if (cancelled) return
          setClones(list)
          if (!value) {
            const ready = list.find((c) => c.status === "READY")
            if (ready) onChangeRef.current(ready.id, ready)
          }
          // Còn giọng đang nhân bản → đọc lại sau 3 giây (kết quả hiện ngay khi xong).
          if (list.some((c) => c.status === "PENDING")) timer.current = setTimeout(load, 3000)
        })
        .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : "Không tải được giọng nhân bản"))
    void load()
    return () => {
      cancelled = true
      if (timer.current) clearTimeout(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey])

  return (
    <Card className="p-5">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-text">
        <Headphones size={14} /> Giọng nhân bản của tiệm
      </h3>
      <p className="mb-3 text-[12px] text-text-muted">
        Đọc lời thoại bằng chính giọng chủ tiệm (ElevenLabs). Giọng nhân bản không bao giờ bị thay bằng giọng khác — nhà
        cung cấp lỗi thì job dừng và hoàn credit.
      </p>
      {error && <p className="mb-2 text-[12px] text-rose-700">{error}</p>}
      {!clones && !error && (
        <p className="flex items-center gap-2 text-[12px] text-text-muted">
          <Loader2 size={12} className="animate-spin" /> Đang tải…
        </p>
      )}
      <div className="flex flex-col gap-2">
        {(clones ?? []).map((c) => (
          <div key={c.id} className={`rounded-lg border px-3 py-2 ${value === c.id ? "border-primary bg-primary/5" : "border-border"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-[12px] font-semibold text-text">
                <input type="radio" disabled={c.status !== "READY"} checked={value === c.id} onChange={() => onChange(c.id, c)} />
                {c.name}
              </label>
              <div className="flex items-center gap-2">
                <Badge tone={STATUS[c.status].tone}>{STATUS[c.status].label}</Badge>
                <button
                  type="button"
                  title="Xoá giọng (gỡ cả trên ElevenLabs)"
                  onClick={async () => {
                    if (!window.confirm(`Xoá giọng "${c.name}"? Giọng sẽ bị gỡ khỏi ElevenLabs.`)) return
                    await removeVoiceClone(c.id).catch((e: unknown) => setError(e instanceof Error ? e.message : "Không xoá được"))
                    if (value === c.id) onChange(null, null)
                    setReloadKey((k) => k + 1)
                  }}
                  className="text-rose-600 cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            {c.status === "FAILED" && c.error && <p className="mt-1 text-[11px] text-rose-700">{c.error}</p>}
          </div>
        ))}
        {clones && clones.length === 0 && <p className="text-[12px] text-text-muted">Chưa có giọng nhân bản nào.</p>}
      </div>
      <div className="mt-3">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowCreate((s) => !s)}>
          <Upload size={13} /> {showCreate ? "Đóng" : "Nhân bản giọng mới"}
        </Button>
        {showCreate && (
          <CreateCloneForm
            onDone={() => {
              setShowCreate(false)
              setReloadKey((k) => k + 1)
            }}
          />
        )}
      </div>
    </Card>
  )
}

function CreateCloneForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!file) return setError("Chọn tệp mẫu giọng")
    setBusy(true)
    setError(null)
    try {
      await createVoiceClone({ name, sample: file, consent })
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tạo được")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
      <ul className="list-disc pl-4 text-[11px] text-text-muted">
        <li>Tệp MP3/WAV/M4A dài 1–3 phút (tối thiểu 20 giây), một người nói, rõ, không nhạc nền, không tiếng vang.</li>
        <li>Đọc tự nhiên như khi tư vấn khách — giọng nhân bản sẽ giữ nhịp và ngữ điệu này.</li>
      </ul>
      <input className="w-full rounded border border-border px-2 py-1.5 text-xs" placeholder="Tên giọng (vd. Chị Lan chủ tiệm)" value={name} onChange={(e) => setName(e.target.value)} />
      <input type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-xs" />
      <label className="flex items-start gap-2 text-[11px] text-text">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
        {VOICE_CLONE_CONSENT_TEXT}
      </label>
      {error && <p className="text-[12px] text-rose-700">{error}</p>}
      <Button size="sm" onClick={submit} disabled={busy || !consent || name.trim().length < 2} className="gap-1.5">
        {busy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} Nhân bản giọng ({CLONE_CREDIT} credit)
      </Button>
    </div>
  )
}
