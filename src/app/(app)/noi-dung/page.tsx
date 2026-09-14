"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, Check, ChevronRight, Sparkles, ArrowLeft, AlertTriangle, Rss } from "lucide-react"
import { ResultCard, type ResultField, type JudgmentState } from "@/components/result/result-card"
import { FlowSteps, type FlowStep } from "@/components/flow/flow-steps"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const FLOW_CONTENT: FlowStep[] = [
  { key: "generate", label: "Đang soạn nội dung" },
]

const CHANNELS = ["Facebook", "Instagram", "TikTok", "Zalo OA"]

const FIELDS_COMMON: ResultField[] = [
  { key: "title", label: "Tiêu đề", type: "text", editable: true, value: "", confidence: null },
  { key: "content", label: "Nội dung bài", type: "textarea", editable: true, value: "", confidence: null },
  { key: "hashtag", label: "Hashtag", type: "list", editable: true, value: [], confidence: null, placeholder: "Thêm hashtag..." },
  { key: "seo", label: "Mô tả SEO", type: "textarea", editable: true, value: "", confidence: null },
  { key: "cta", label: "CTA", type: "text", editable: true, value: "", confidence: null },
]

export default function ContentEnginePage() {
  const router = useRouter()
  const [phase, setPhase] = useState<"select" | "running" | "results" | "saved">("select")
  const [jobPhase, setJobPhase] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<"PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED" | null>(null)
  const [judgment, setJudgment] = useState<JudgmentState>("safe")
  const [saved, setSaved] = useState(false)
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const [channelFields, setChannelFields] = useState<Record<string, ResultField[]>>({})

  function goRunning() {
    if (selectedChannels.length === 0) return
    setPhase("running")
    setJobStatus("PENDING")
    setJobPhase("GENERATING")
    setTimeout(() => setJobStatus("PROCESSING"), 500)
    setTimeout(() => {
      setJobStatus("COMPLETED")
      const fields: Record<string, ResultField[]> = {}
      CHANNELS.forEach((ch) => {
        fields[ch] = FIELDS_COMMON.map((f) => ({
          ...f,
          value: f.type === "list" ? [] : "",
        }))
      })
      setChannelFields(fields)
      setTimeout(() => setPhase("results"), 500)
    }, 3000)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-[18px] py-4">
        <div>
          <div className="text-xs text-text-muted">M07</div>
          <div className="text-[17px] font-extrabold text-primary">AI Content Engine</div>
        </div>
        <Button variant="ghost" onClick={() => router.push("/")} className="flex items-center gap-1.5">
          <ArrowLeft size={16} strokeWidth={2} /> Quay về Trang chủ
        </Button>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto p-[18px]">
        {phase === "select" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            <div className="text-center"><div className="text-[17px] font-extrabold">① Chọn sản phẩm + kênh</div><div className="mt-1 text-[13px] text-text-muted">Chọn sản phẩm từ Product Master + ít nhất 1 kênh</div></div>
            <Card className="w-full max-w-md flex flex-col items-center gap-3 border-dashed border-2 border-border bg-surface-alt p-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface"><Rss size={28} strokeWidth={1.5} className="text-text-muted" /></div>
              <div className="text-[14px] font-semibold">Chọn kênh</div>
              <div className="text-[12px] text-text-muted">Facebook · Instagram · TikTok · Zalo OA (chọn nhiều)</div>
              {CHANNELS.map((ch) => (
                <label key={ch} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selectedChannels.includes(ch)}
                    onChange={() => setSelectedChannels((p) => p.includes(ch) ? p.filter((c) => c !== ch) : [...p, ch])}
                    className="h-4 w-4 accent-primary" />
                  <span className="text-[13px]">{ch}</span>
                </label>
              ))}
              <Button onClick={goRunning} disabled={selectedChannels.length === 0}>
                <Sparkles size={16} strokeWidth={2} className="mr-2" /> Sinh nội dung
              </Button>
            </Card>
          </div>
        )}

        {phase === "running" && (
          <div className="flex flex-1 flex-col items-center gap-5">
            <div className="text-center"><div className="text-[17px] font-extrabold">③ Đang xử lý</div><div className="mt-1 text-[13px] text-text-muted">{jobPhase ?? "Đang soạn..."}</div></div>
            <div className="w-full max-w-md">
              <FlowSteps steps={FLOW_CONTENT} currentStep={jobPhase ?? "generate"} cancellable={jobStatus === "PENDING"}
                onCancel={() => { setJobStatus("CANCELLED"); setPhase("select") }} />
            </div>
          </div>
        )}

        {phase === "results" && (
          <div className="flex flex-col items-center gap-5">
            <div className="flex items-center justify-between w-full max-w-3xl">
              <div><div className="text-xs text-text-muted">④ LƯỚI THẺ KẾT QUẢ — theo kênh</div><div className="text-[17px] font-extrabold">Nội dung theo kênh</div></div>
              <Badge tone={saved ? "success" : judgment === "blocked" ? "danger" : judgment === "warning" ? "warning" : "neutral"}>
                {saved ? "Đã lưu nháp" : judgment === "blocked" ? "Bị chặn" : judgment === "warning" ? "Cảnh báo" : "An toàn"}
              </Badge>
            </div>
            {selectedChannels.map((ch) => (
              <div key={ch} className="w-full max-w-3xl">
                <div className="flex items-center gap-2 mb-2">
                  <Badge tone="accent">{ch}</Badge>
                  {judgment !== "blocked" && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => setJudgment("blocked")}>Từ chối</Button>
                      <Button size="sm" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }}>Lưu nháp</Button>
                      <Button size="sm" onClick={() => { setSaved(true); setJudgment("safe"); setSaved(false); setTimeout(() => { setJudgment("safe"); setSaved(false) }, 200) }}>Duyệt</Button>
                    </>
                  )}
                </div>
                <ResultCard
                  fields={channelFields[ch] ?? FIELDS_COMMON.map((f) => ({ ...f, value: "" }))}
                  judgment={judgment}
                  quality={{ score: 88, label: `${ch} — phù hợp giọng thương hiệu`, status: "safe" }}
                  onSaveDraft={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }}
                  onReject={() => setJudgment("blocked")}
                  onApprove={() => { setSaved(true); setJudgment("safe"); setSaved(false) }}
                  onFieldChange={(key, value) => setChannelFields((p) => ({ ...p, [ch]: p[ch]?.map((f) => (f.key === key ? { ...f, value } : f)) ?? [] }))}
                  onFieldAdd={(key, item) => setChannelFields((p) => ({ ...p, [ch]: p[ch]?.map((f) => (f.key === key && f.type === "list" ? { ...f, value: [...(f.value as { id: string; value: string }[]), item] } : f)) ?? [] }))}
                  onFieldRemove={(key, itemId) => setChannelFields((p) => ({ ...p, [ch]: p[ch]?.map((f) => (f.key === key && f.type === "list" ? { ...f, value: (f.value as { id: string; value: string }[]).filter((i) => i.id !== itemId) } : f)) ?? [] }))}
                />
              </div>
            ))}
            <div className="w-full max-w-3xl border-t border-border pt-5">
              <div className="rounded-xl bg-primary/5 p-4 flex items-center justify-between">
                <div>
                  <div className="text-[14px] font-bold text-primary">Gợi ý: Lên lịch đăng ngay</div>
                  <div className="text-[12px] text-text-muted">Nhảy sang Social Publishing với nội dung vừa duyệt</div>
                </div>
                <Button onClick={() => router.push("/lich-dang" as never)} className="flex items-center gap-2">
                  Đi đến Social Publishing
                  <ChevronRight size={16} strokeWidth={2.4} />
                </Button>
              </div>
            </div>
          </div>
        )}

        {phase === "saved" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-success-bg"><Check size={40} strokeWidth={2} className="text-secondary" /></div>
            <div className="text-center"><div className="text-[17px] font-extrabold">Đã lưu vào Thư viện nội dung</div><div className="mt-1 text-[13px] text-text-muted">Nội dung theo kênh đã được lưu</div></div>
            <Button onClick={() => router.push("/")}>Quay về Trang chủ</Button>
          </div>
        )}
      </div>
    </div>
  )
}
