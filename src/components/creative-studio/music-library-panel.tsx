"use client"

import { useEffect, useState } from "react"
import { Loader2, Music, Trash2, Upload } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  fetchMusicTracks,
  removeMusicTrack,
  uploadMusicTrack,
  type MusicTrackItem,
} from "./audio-library-client"

const MOOD_LABEL: Record<string, string> = {
  romantic: "Lãng mạn",
  upbeat: "Sôi động",
  chill: "Thư giãn",
  warm: "Ấm áp",
  luxury: "Sang trọng",
}
const LICENSE_LABEL: Record<string, string> = {
  owned: "Tiệm sở hữu",
  royalty_free: "Royalty-free",
  licensed: "Đã mua giấy phép",
  creative_commons: "Creative Commons",
  original: "Sáng tác gốc",
}

/**
 * Thư viện nhạc nền Khu vực C (24/09/2026): chọn bài, nghe thử, xem giấy phép,
 * tiệm tự tải bài riêng (bắt buộc khai nguồn + cam kết quyền dùng).
 */
export function MusicLibraryPanel({
  value,
  onChange,
  required,
  preferredMood,
}: {
  value: string | null
  onChange: (trackId: string | null, track: MusicTrackItem | null) => void
  required: boolean
  preferredMood?: string | undefined
}) {
  const [tracks, setTracks] = useState<MusicTrackItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mood, setMood] = useState<string>("all")
  const [showUpload, setShowUpload] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchMusicTracks()
      .then((list) => {
        if (cancelled) return
        setTracks(list)
        // Chọn sẵn một bài hợp mood của chủ đề (ưu tiên bài đã xác minh giấy phép).
        if (!value && required) {
          const pick =
            list.find((t) => t.mood === preferredMood && t.license_verified) ??
            list.find((t) => t.mood === preferredMood) ??
            list.find((t) => t.license_verified) ??
            list[0]
          if (pick) onChange(pick.track_id, pick)
        }
      })
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : "Không tải được thư viện nhạc"))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey])

  const visible = (tracks ?? []).filter((t) => mood === "all" || t.mood === mood)
  const selected = (tracks ?? []).find((t) => t.track_id === value) ?? null

  return (
    <Card className="p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold text-text">
          <Music size={14} /> Nhạc nền {required ? "" : "(tuỳ chọn)"}
        </h3>
        <div className="flex flex-wrap items-center gap-1.5">
          {["all", ...Object.keys(MOOD_LABEL)].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMood(m)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold cursor-pointer ${
                mood === m ? "border-primary bg-primary/10 text-primary" : "border-border text-text-muted"
              }`}
            >
              {m === "all" ? "Tất cả" : MOOD_LABEL[m]}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mb-2 text-[12px] text-rose-700">{error}</p>}
      {!tracks && !error && (
        <p className="flex items-center gap-2 text-[12px] text-text-muted">
          <Loader2 size={12} className="animate-spin" /> Đang tải thư viện nhạc…
        </p>
      )}

      <div className="flex flex-col gap-2">
        {!required && (
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-[12px]">
            <input type="radio" checked={value === null} onChange={() => onChange(null, null)} />
            Không dùng nhạc nền
          </label>
        )}
        {visible.map((t) => (
          <div
            key={t.track_id}
            className={`rounded-lg border px-3 py-2 ${value === t.track_id ? "border-primary bg-primary/5" : "border-border"}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-[12px] font-semibold text-text">
                <input type="radio" checked={value === t.track_id} onChange={() => onChange(t.track_id, t)} />
                {t.title}
                <span className="font-normal text-text-muted">
                  · {MOOD_LABEL[t.mood] ?? t.mood}
                  {t.duration_seconds ? ` · ${Math.round(t.duration_seconds)}s` : ""}
                  {t.source === "org" ? " · nhạc của tiệm" : ""}
                </span>
              </label>
              <div className="flex items-center gap-2">
                <Badge tone={t.license_verified ? "success" : "warning"}>
                  {t.license_verified ? LICENSE_LABEL[t.license_type] ?? t.license_type : "Chưa xác minh bản quyền"}
                </Badge>
                {t.source === "org" && (
                  <button
                    type="button"
                    title="Gỡ bài này"
                    onClick={async () => {
                      if (!window.confirm(`Gỡ "${t.title}" khỏi thư viện của tiệm?`)) return
                      await removeMusicTrack(t.track_id).catch((e: unknown) =>
                        setError(e instanceof Error ? e.message : "Không gỡ được")
                      )
                      if (value === t.track_id) onChange(null, null)
                      setReloadKey((k) => k + 1)
                    }}
                    className="text-rose-600 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
            <audio controls preload="none" src={t.preview_url} className="mt-1.5 h-8 w-full" />
            <p className="mt-1 text-[10px] text-text-muted">Nguồn: {t.license_source}</p>
          </div>
        ))}
        {tracks && visible.length === 0 && (
          <p className="text-[12px] text-text-muted">Chưa có bài nào cho mood này — tải nhạc của tiệm lên bên dưới.</p>
        )}
      </div>

      {selected && !selected.license_verified && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
          Bài này chưa có hồ sơ giấy phép thương mại. Chỉ nên dùng để thử — trước khi đăng quảng cáo hãy chọn bài đã xác
          minh hoặc tải nhạc tiệm có giấy phép.
        </p>
      )}

      <div className="mt-3">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowUpload((s) => !s)}>
          <Upload size={13} /> {showUpload ? "Đóng" : "Tải nhạc của tiệm"}
        </Button>
        {showUpload && (
          <MusicUploadForm
            onDone={(t) => {
              setShowUpload(false)
              setReloadKey((k) => k + 1)
              onChange(t.track_id, t)
            }}
          />
        )}
      </div>
    </Card>
  )
}

function MusicUploadForm({ onDone }: { onDone: (t: MusicTrackItem) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [mood, setMood] = useState("romantic")
  const [licenseType, setLicenseType] = useState("licensed")
  const [licenseSource, setLicenseSource] = useState("")
  const [attest, setAttest] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!file) return setError("Chọn tệp nhạc (MP3/WAV/M4A, tối đa 20MB)")
    setBusy(true)
    setError(null)
    try {
      onDone(await uploadMusicTrack({ file, title, mood, licenseType, licenseSource, attest }))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được")
    } finally {
      setBusy(false)
    }
  }

  const input = "w-full rounded border border-border px-2 py-1.5 text-xs focus:border-primary focus:outline-none"
  return (
    <div className="mt-3 grid grid-cols-1 gap-2 rounded-lg border border-border bg-surface p-3 sm:grid-cols-2">
      <input type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-xs sm:col-span-2" />
      <input className={input} placeholder="Tên bài" value={title} onChange={(e) => setTitle(e.target.value)} />
      <select className={input} value={mood} onChange={(e) => setMood(e.target.value)}>
        {Object.entries(MOOD_LABEL).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      <select className={input} value={licenseType} onChange={(e) => setLicenseType(e.target.value)}>
        <option value="licensed">Đã mua giấy phép</option>
        <option value="royalty_free">Royalty-free (có điều khoản thương mại)</option>
        <option value="owned">Tiệm sở hữu / tự sáng tác</option>
        <option value="creative_commons">Creative Commons cho phép thương mại</option>
      </select>
      <input className={input} placeholder="Nguồn: nơi mua, mã giấy phép hoặc đường dẫn" value={licenseSource} onChange={(e) => setLicenseSource(e.target.value)} />
      <label className="flex items-start gap-2 text-[11px] text-text-muted sm:col-span-2">
        <input type="checkbox" checked={attest} onChange={(e) => setAttest(e.target.checked)} className="mt-0.5" />
        Tôi xác nhận tiệm có quyền dùng bài này trong video/bài quảng cáo trên mạng xã hội, và thông tin nguồn ở trên là đúng.
      </label>
      {error && <p className="text-[12px] text-rose-700 sm:col-span-2">{error}</p>}
      <Button size="sm" onClick={submit} disabled={busy || !attest} className="gap-1.5 sm:col-span-2">
        {busy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} Tải lên thư viện của tiệm
      </Button>
    </div>
  )
}
