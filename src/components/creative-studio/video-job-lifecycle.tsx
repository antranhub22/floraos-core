"use client"

/**
 * Vòng đời video job ngay trong Khu vực E (24/09/2026).
 *
 * Trước đây "Tạo video" chỉ tạo BẢN NHÁP (storyboard) rồi báo "Đã tạo video
 * job" + thanh "Đã được Chủ shop phê duyệt" — không có video nào để xem, và
 * duyệt kịch bản (P3) / render / duyệt video (P4) phải sang màn khác. Nay làm
 * đủ ở đây, trạng thái đọc thật từ `GET /video/jobs/:id`.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { CheckCircle2, Clapperboard, Download, Loader2, RotateCcw, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export type VideoJobDetail = {
  id: string
  stage: string
  script_approval: string
  video_approval: string
  error_message?: string | null
  final_video_view_url?: string | null
}

const STAGE_LABEL: Record<string, string> = {
  DRAFT: "Bản nháp",
  SCRIPT_READY: "Kịch bản sẵn sàng",
  SCRIPT_APPROVED: "Kịch bản đã duyệt",
  RENDERING: "Đang render",
  RENDER_COMPLETED: "Đã render — chờ duyệt video",
  APPROVED: "Video đã duyệt",
  REJECTED: "Bị từ chối",
  FAILED: "Render lỗi",
}

async function readError(res: Response): Promise<string> {
  const b = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
  return b.error?.message || `HTTP ${res.status}`
}

export function VideoJobLifecycle({
  jobId,
  renderCredit,
  onChange,
  sceneImages,
}: {
  jobId: string
  renderCredit: number
  onChange?: (job: VideoJobDetail) => void
  /** Ảnh hiện có trên storyboard (thường là ảnh Khu vực D) — máy chủ dùng để
   *  lấp cảnh của job còn trống ảnh khi render (24/09/2026). */
  sceneImages?: Array<{ scene_index: number; asset_id: string }> | undefined
}) {
  const [job, setJob] = useState<VideoJobDetail | null>(null)
  const [busy, setBusy] = useState<null | "script" | "render" | "video">(null)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<number | null>(null)
  // Giữ callback mới nhất trong ref — cha thường truyền hàm inline, để nó trong
  // deps của `load` sẽ nạp lại vô hạn.
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const load = useCallback(async () => {
    const res = await fetch(`/api/v1/video/jobs/${encodeURIComponent(jobId)}`)
    if (!res.ok) throw new Error(await readError(res))
    const j = (await res.json()) as VideoJobDetail
    setJob(j)
    onChangeRef.current?.(j)
    return j
  }, [jobId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- nạp trạng thái job từ API
    load().catch((e) => setError(e instanceof Error ? e.message : "Không đọc được video job"))
    return () => {
      if (pollRef.current) window.clearTimeout(pollRef.current)
    }
  }, [load])

  // Đang render: hỏi lại mỗi 3 giây tới khi xong/lỗi.
  useEffect(() => {
    if (job?.stage !== "RENDERING") return
    pollRef.current = window.setTimeout(() => {
      load().catch(() => undefined)
    }, 3000)
    return () => {
      if (pollRef.current) window.clearTimeout(pollRef.current)
    }
  }, [job, load])

  const act = async (kind: "script" | "render" | "video") => {
    setBusy(kind)
    setError(null)
    try {
      const path = kind === "script" ? "approve-script" : kind === "render" ? "render" : "approve-video"
      const res = await fetch(`/api/v1/video/jobs/${encodeURIComponent(jobId)}/${path}`, {
        method: "POST",
        ...(kind === "render" && sceneImages?.length
          ? { headers: { "content-type": "application/json" }, body: JSON.stringify({ scene_images: sceneImages }) }
          : {}),
      })
      if (!res.ok) throw new Error(await readError(res))
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Thao tác không thành công")
    } finally {
      setBusy(null)
    }
  }

  if (!job) {
    return (
      <Card className="p-5 text-xs text-text-muted flex items-center gap-2">
        {error ? <span className="text-danger">{error}</span> : <><Loader2 size={14} className="animate-spin" /> Đang đọc video job...</>}
      </Card>
    )
  }

  const scriptOk = job.script_approval === "APPROVED"
  const rendered = job.stage === "RENDER_COMPLETED" || job.stage === "APPROVED"
  const canRender = scriptOk && (job.stage === "SCRIPT_APPROVED" || job.stage === "FAILED")

  return (
    <Card className="p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-bold text-text flex items-center gap-2">
          <Clapperboard size={14} /> Video job <span className="font-mono text-[11px] text-text-muted">{job.id.slice(0, 8)}</span>
        </h3>
        <Badge tone={job.stage === "FAILED" ? "danger" : job.stage === "APPROVED" ? "success" : "neutral"} className="text-[11px]">
          {STAGE_LABEL[job.stage] ?? job.stage}
        </Badge>
      </div>

      <ol className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[12px]">
        <li className={`rounded-lg border p-3 ${scriptOk ? "border-success bg-success-bg" : "border-border"}`}>
          <div className="font-bold text-text">1. Duyệt kịch bản (P3)</div>
          <div className="text-text-muted mt-0.5">{scriptOk ? "Đã duyệt" : "Chưa duyệt — kiểm tra storyboard rồi duyệt"}</div>
          {!scriptOk && (
            <Button size="sm" className="mt-2" disabled={busy !== null} onClick={() => void act("script")}>
              {busy === "script" ? "Đang duyệt..." : "Duyệt kịch bản"}
            </Button>
          )}
        </li>
        <li className={`rounded-lg border p-3 ${rendered ? "border-success bg-success-bg" : "border-border"}`}>
          <div className="font-bold text-text">2. Render video ({renderCredit} credit)</div>
          <div className="text-text-muted mt-0.5">
            {job.stage === "RENDERING"
              ? "Worker đang dựng video..."
              : rendered
              ? "Đã render"
              : job.stage === "FAILED"
              ? "Lần render trước lỗi"
              : "Chạy sau khi duyệt kịch bản"}
          </div>
          {job.stage === "RENDERING" && <Loader2 size={14} className="animate-spin mt-2 text-primary" />}
          {canRender && (
            <Button size="sm" className="mt-2 gap-1" disabled={busy !== null} onClick={() => void act("render")}>
              {job.stage === "FAILED" ? <RotateCcw size={12} /> : null}
              {busy === "render" ? "Đang gửi..." : job.stage === "FAILED" ? "Render lại" : "Render video"}
            </Button>
          )}
        </li>
        <li className={`rounded-lg border p-3 ${job.video_approval === "APPROVED" ? "border-success bg-success-bg" : "border-border"}`}>
          <div className="font-bold text-text">3. Duyệt video (P4)</div>
          <div className="text-text-muted mt-0.5">
            {job.video_approval === "APPROVED" ? "Đã duyệt — dùng được ở Khu vực F" : "Xem video rồi duyệt"}
          </div>
          {job.stage === "RENDER_COMPLETED" && job.video_approval !== "APPROVED" && (
            <Button size="sm" className="mt-2 gap-1" disabled={busy !== null} onClick={() => void act("video")}>
              <ShieldCheck size={12} /> {busy === "video" ? "Đang duyệt..." : "Duyệt video"}
            </Button>
          )}
        </li>
      </ol>

      {job.stage === "FAILED" && job.error_message && (
        <div className="rounded-lg border border-danger bg-danger-bg px-3 py-2 text-[12px] text-danger">
          Lỗi render: {job.error_message}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-danger bg-danger-bg px-3 py-2 text-[12px] text-danger">{error}</div>
      )}

      {rendered && (
        job.final_video_view_url ? (
          <div className="flex flex-col items-center gap-2">
            <video
              key={job.final_video_view_url}
              src={job.final_video_view_url}
              controls
              playsInline
              className="max-h-[520px] rounded-xl border border-border bg-black"
            />
            <a
              href={job.final_video_view_url}
              download
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <Download size={12} /> Tải video
            </a>
            {job.video_approval === "APPROVED" && (
              <span className="text-[12px] text-success flex items-center gap-1">
                <CheckCircle2 size={12} /> Video đã duyệt
              </span>
            )}
          </div>
        ) : (
          <div className="text-[12px] text-danger">Render báo xong nhưng không có tệp video để phát.</div>
        )
      )}
    </Card>
  )
}
