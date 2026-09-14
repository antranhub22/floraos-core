"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, Check, ChevronRight, Sparkles, ArrowLeft, AlertTriangle, Play, Clock } from "lucide-react"
import { ResultCard, type ResultField, type JudgmentState } from "@/components/result/result-card"
import { FlowSteps, type FlowStep } from "@/components/flow/flow-steps"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const FLOW_SCRIPT: FlowStep[] = [
  { key: "plan", label: "Soạn kịch bản cảnh" },
  { key: "review", label: "Duyệt kịch bản" },
]

const FLOW_VIDEO: FlowStep[] = [
  { key: "render", label: "Đang dựng video" },
]

const FIELDS_SCRIPT: ResultField[] = [
  { key: "scenes", label: "Danh sách cảnh", type: "list", editable: true, value: [], confidence: null, placeholder: "Thêm cảnh..." },
  { key: "transition", label: "Hiệu ứng chuyển cảnh", type: "text", editable: true, value: "Fade" },
  { key: "music", label: "Nhạc nền", type: "text", editable: true, value: "Không" },
  { key: "captions", label: "Phụ đề từng cảnh", type: "list", editable: true, value: [], confidence: null, placeholder: "Thêm phụ đề..." },
  { key: "cta", label: "CTA cuối video", type: "text", editable: true, value: "Đặt hàng ngay" },
]

const FIELDS_VIDEO: ResultField[] = [
  { key: "duration", label: "Thời lượng", type: "readonly", editable: false, value: "30s" },
  { key: "ratio", label: "Tỉ lệ", type: "readonly", editable: false, value: "9:16" },
  { key: "cost", label: "Chi phí ước tính", type: "readonly", editable: false, value: "25.000đ" },
  { key: "player", label: "Trình phát", type: "readonly", editable: false, value: "Sẵn sàng" },
]

export default function VideoStudioPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<"select" | "running-script" | "script" | "running-video" | "video" | "saved">("select")
  const [jobPhase, setJobPhase] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<"PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED" | null>(null)
  const [judgmentScript, setJudgmentScript] = useState<JudgmentState>("safe")
  const [judgmentVideo, setJudgmentVideo] = useState<JudgmentState>("safe")
  const [fieldsScript, setFieldsScript] = useState<ResultField[]>(FIELDS_SCRIPT)
  const [fieldsVideo, setFieldsVideo] = useState<ResultField[]>(FIELDS_VIDEO)
  const [savedScript, setSavedScript] = useState(false)
  const [savedVideo, setSavedVideo] = useState(false)

  function goRunningScript() {
    setPhase("running-script")
    setJobStatus("PENDING")
    setJobPhase("PLANNING")
    setTimeout(() => { setJobStatus("PROCESSING"); setJobPhase("SCRIPTING") }, 1200)
    setTimeout(() => { setJobStatus("COMPLETED") }, 3000)
    setTimeout(() => { setPhase("script") }, 3500)
  }
  function goRunningVideo() {
    setPhase("running-video")
    setJobStatus("PENDING")
    setJobPhase("RENDERING")
    setTimeout(() => { setJobStatus("PROCESSING") }, 800)
    setTimeout(() => { setJobStatus("COMPLETED") }, 3500)
    setTimeout(() => { setPhase("video") }, 4000)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-[18px] py-4">
        <div>
          <div className="text-xs text-text-muted">M04c</div>
          <div className="text-[17px] font-extrabold text-primary">AI Video Studio</div>
        </div>
        <Button variant="ghost" onClick={() => router.push("/")} className="flex items-center gap-1.5">
          <ArrowLeft size={16} strokeWidth={2} /> Quay về Trang chủ
        </Button>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto p-[18px]">
        {phase === "select" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            <div className="text-center">
              <div className="text-[17px] font-extrabold">① Nhập liệu</div>
              <div className="mt-1 text-[13px] text-text-muted">Chọn sản phẩm có Master Image đã duyệt + khuôn video</div>
            </div>
            <Card className="w-full max-w-md flex flex-col items-center gap-3 border-dashed border-2 border-border bg-surface-alt p-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface"><Play size={28} strokeWidth={1.5} className="text-text-muted" /></div>
              <div className="text-[14px] font-semibold">Chọn khuôn video</div>
              <div className="text-[12px] text-text-muted">Reel 15s · TikTok 30s · Story · Slideshow · Video sản phẩm · Motion ads</div>
              <Button onClick={goRunningScript}>Dựng kịch bản</Button>
            </Card>
          </div>
        )}

        {phase === "running-script" && (
          <div className="flex flex-1 flex-col items-center gap-5">
            <div className="text-center"><div className="text-[17px] font-extrabold">③ Đang xử lý</div><div className="mt-1 text-[13px] text-text-muted">{jobPhase ?? "Đang chuẩn bị..."}</div></div>
            <div className="w-full max-w-md">
              <FlowSteps steps={FLOW_SCRIPT} currentStep={jobPhase ?? "plan"} cancellable={jobStatus === "PENDING"}
                onCancel={() => { setJobStatus("CANCELLED"); setPhase("select") }} showLog
                logs={jobPhase ? [{ seq: 1, text: `Đang ${jobPhase}...`, at: new Date().toISOString() }] : []} />
            </div>
            <div className="flex items-start gap-2.5 rounded-xl bg-surface-alt p-3.5">
              <AlertTriangle size={16} strokeWidth={1.8} className="mt-0.5 flex-shrink-0 text-primary" />
              <div className="text-xs leading-relaxed text-text-muted">Job chạy ở máy chủ — không mất khi rời trang.</div>
            </div>
          </div>
        )}

        {phase === "script" && (
          <div className="flex flex-col items-center gap-5">
            <div className="flex items-center justify-between w-full max-w-3xl">
              <div><div className="text-xs text-text-muted">④ Thẻ kết quả — Kịch bản</div><div className="text-[17px] font-extrabold">Kịch bản cảnh</div></div>
              <Badge tone={savedScript ? "success" : judgmentScript === "blocked" ? "danger" : judgmentScript === "warning" ? "warning" : "neutral"}>
                {savedScript ? "Đã lưu nháp" : judgmentScript === "blocked" ? "Bị chặn" : judgmentScript === "warning" ? "Cảnh báo" : "An toàn"}
              </Badge>
            </div>
            <ResultCard
              fields={fieldsScript} judgment={judgmentScript}
              quality={{ score: 90, label: "Kịch bản đạt chuẩn", status: "safe" }}
              onSaveDraft={() => { setSavedScript(true); setTimeout(() => setSavedScript(false), 2000) }}
              onReject={() => setJudgmentScript("blocked")}
              onApprove={() => { setSavedScript(true); setJudgmentScript("safe"); setSavedScript(false); setTimeout(() => setPhase("running-video"), 800) }}
              onFieldChange={(key, value) => setFieldsScript((p) => p.map((f) => (f.key === key ? { ...f, value } : f)))}
            />
            {judgmentScript !== "blocked" && (
              <div className="w-full max-w-3xl border-t border-border pt-5">
                <Button onClick={goRunningVideo} className="w-full max-w-3xl">
                  Nhấn &ldquo;Dựng video&rdquo; — <Clock size={16} strokeWidth={2} className="mr-2" /> Có thể mất 1–3 phút
                </Button>
              </div>
            )}
          </div>
        )}

        {phase === "running-video" && (
          <div className="flex flex-1 flex-col items-center gap-5">
            <div className="text-center"><div className="text-[17px] font-extrabold">Đang dựng video</div><div className="mt-1 text-[13px] text-text-muted">{jobPhase ?? "Đang dựng..."}</div></div>
            <div className="w-full max-w-md">
              <FlowSteps steps={FLOW_VIDEO} currentStep={jobPhase ?? "render"} cancellable={jobStatus === "PENDING"}
                onCancel={() => { setJobStatus("CANCELLED"); setPhase("script") }} />
            </div>
          </div>
        )}

        {phase === "video" && (
          <div className="flex flex-col items-center gap-5">
            <div className="flex items-center justify-between w-full max-w-3xl">
              <div><div className="text-xs text-text-muted">④ Thẻ kết quả — Video</div><div className="text-[17px] font-extrabold">Kết quả video</div></div>
              <Badge tone={savedVideo ? "success" : judgmentVideo === "blocked" ? "danger" : judgmentVideo === "warning" ? "warning" : "neutral"}>
                {savedVideo ? "Đã lưu nháp" : judgmentVideo === "blocked" ? "Bị chặn" : judgmentVideo === "warning" ? "Cảnh báo" : "An toàn"}
              </Badge>
            </div>
            <ResultCard
              fields={fieldsVideo} judgment={judgmentVideo}
              quality={{ score: 91, label: "Video đạt chuẩn xuất bản", status: "safe" }}
              onSaveDraft={() => { setSavedVideo(true); setTimeout(() => setSavedVideo(false), 2000) }}
              onReject={() => setJudgmentVideo("blocked")}
              onApprove={() => { setSavedVideo(true); setJudgmentVideo("safe"); setSavedVideo(false); setTimeout(() => setPhase("saved"), 800) }}
              onFieldChange={(key, value) => setFieldsVideo((p) => p.map((f) => (f.key === key ? { ...f, value } : f)))}
            />
          </div>
        )}

        {phase === "saved" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-success-bg"><Check size={40} strokeWidth={2} className="text-secondary" /></div>
            <div className="text-center"><div className="text-[17px] font-extrabold">Đã lưu vào Kho video</div><div className="mt-1 text-[13px] text-text-muted">Video chính thức đã được lưu</div></div>
            <Button onClick={() => router.push("/")}>Quay về Trang chủ</Button>
          </div>
        )}
      </div>
    </div>
  )
}
