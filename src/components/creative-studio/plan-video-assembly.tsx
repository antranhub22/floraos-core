"use client"

/**
 * Đợt 4 (24/09/2026) — "Dựng video từ bộ tài sản" ở Khu vực E.
 *
 * Video lắp từ ĐÚNG các tài sản của kịch bản sản xuất tổng (Chặng 05): ảnh
 * Khu vực D của từng cảnh, nguyên bản phối Khu vực C, phụ đề / chuyển cảnh /
 * khuôn / khung của kịch bản. Thiếu gì thì chặn và chỉ đúng khu vực phải làm
 * (quyết định PO). Kiểm tra lại tự động mỗi khi mở trang.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { AlertTriangle, CheckCircle2, Clapperboard, Loader2, RefreshCw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { resolveApprovedMaster } from "./package-client"
import type { LoadedScenePlan } from "./scene-plan-client"

type Problem = { kind: string; sceneIndex?: number; message: string }

interface AssemblyResponse {
  ready: boolean
  problems: Problem[]
  warnings: string[]
  format: string
  aspect_ratio: string
  total_duration_seconds: number
  scenes: Array<{ sceneIndex: number; durationSeconds: number; imageAssetId: string; textOverlay: string }>
  audio_job_id: string | null
  video_job_id: string | null
}

async function readError(res: Response): Promise<string> {
  const b = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
  return b.error?.message || `HTTP ${res.status}`
}

export function PlanVideoAssembly({
  loaded,
  assetId,
  audioJobId,
  title,
  onGoArea,
  onCreated,
}: {
  loaded: LoadedScenePlan
  assetId: string | undefined
  audioJobId: string | null
  title: string
  onGoArea: (area: "c" | "d", focusScene?: number) => void
  onCreated: (videoJobId: string) => void
}) {
  const [report, setReport] = useState<AssemblyResponse | null>(null)
  const [busy, setBusy] = useState<null | "check" | "build">(null)
  const [error, setError] = useState<string | null>(null)
  // Tiêu đề chỉ dùng khi tạo job — không kiểm tra lại mỗi lần gõ.
  const titleRef = useRef(title)
  useEffect(() => {
    titleRef.current = title
  }, [title])

  const call = useCallback(
    async (dryRun: boolean): Promise<AssemblyResponse | null> => {
      const masterId = await resolveApprovedMaster(assetId).catch(() => null)
      if (!masterId) {
        setError("Chưa có Master Image đã duyệt — mở Khu vực D để chốt ảnh gốc làm Master và sinh ảnh từng cảnh.")
        return null
      }
      const res = await fetch("/api/v1/creative-production/video-assembly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scene_plan_id: loaded.ref,
          ...(loaded.jobId ? {} : { plan: loaded.plan }),
          master_asset_id: masterId,
          ...(audioJobId ? { audio_job_id: audioJobId } : {}),
          title: titleRef.current,
          dry_run: dryRun,
        }),
      })
      if (!res.ok) throw new Error(await readError(res))
      return (await res.json()) as AssemblyResponse
    },
    [assetId, audioJobId, loaded]
  )

  const check = useCallback(async () => {
    setBusy("check")
    setError(null)
    try {
      setReport(await call(true))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không kiểm tra được")
    } finally {
      setBusy(null)
    }
  }, [call])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kiểm tra sẵn sàng khi mở / đổi kịch bản
    void check()
  }, [check])

  const build = async () => {
    setBusy("build")
    setError(null)
    try {
      const r = await call(false)
      setReport(r)
      if (r?.video_job_id) onCreated(r.video_job_id)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không dựng được video")
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card className="p-5 border-primary/30">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold text-text">
          <Clapperboard size={14} /> Dựng video từ bộ tài sản của kịch bản
        </h3>
        <Badge tone="neutral" className="text-[10px]">
          Kịch bản phiên bản {loaded.plan.revision} · khung {loaded.plan.publishing.aspectRatio}
        </Badge>
      </div>
      <p className="mb-3 text-[12px] text-text-muted">
        Ảnh từng cảnh lấy từ Khu vực D, âm thanh dùng <b>nguyên bản phối Khu vực C</b> (không đọc lại), phụ đề, chuyển cảnh,
        thời lượng và khuôn theo kịch bản Chặng 05. Thiếu tài sản nào thì chưa dựng được.
      </p>

      {report && (
        <div className="mb-3 flex flex-col gap-1.5 text-[12px]">
          {report.ready ? (
            <p className="flex items-center gap-1.5 font-semibold text-emerald-700">
              <CheckCircle2 size={14} /> Đủ tài sản: {report.scenes.length} cảnh · ~{Math.round(report.total_duration_seconds)}s ·{" "}
              {report.aspect_ratio} · khuôn {report.format}
            </p>
          ) : (
            report.problems.map((p, i) => (
              <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-rose-800">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle size={13} /> {p.message}
                </span>
                {p.kind === "missing_image" ? (
                  <button type="button" onClick={() => onGoArea("d", p.sceneIndex)} className="font-bold underline cursor-pointer">
                    Sinh cảnh {p.sceneIndex} ở Khu vực D →
                  </button>
                ) : p.kind !== "duration" ? (
                  <button type="button" onClick={() => onGoArea("c")} className="font-bold underline cursor-pointer">
                    Mở Khu vực C →
                  </button>
                ) : null}
              </div>
            ))
          )}
          {report.warnings.map((w, i) => (
            <p key={i} className="text-amber-700">⚠ {w}</p>
          ))}
        </div>
      )}
      {error && <p className="mb-2 text-[12px] text-rose-700">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="gap-1.5" disabled={busy !== null} onClick={() => void check()}>
          {busy === "check" ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Kiểm tra lại
        </Button>
        <Button size="sm" className="gap-1.5" disabled={busy !== null || !report?.ready} onClick={() => void build()}>
          {busy === "build" ? <Loader2 size={13} className="animate-spin" /> : <Clapperboard size={13} />} Dựng video từ bộ tài sản
        </Button>
        <span className="text-[11px] text-text-muted">Tạo bản nháp miễn phí → duyệt kịch bản (P3) → render 5 credit → duyệt video (P4).</span>
      </div>
    </Card>
  )
}
