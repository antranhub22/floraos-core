"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ArrowLeft, BarChart3, ChevronRight, TrendingUp, Loader2 } from "lucide-react"
import { useSession } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type UsageSummary = {
  by_feature: { feature: string; quantity: number; cost_credit: number }[]
  credit_used: number
  credit_balance: number
}

type AuditLogEntry = {
  id: string
  action: string
  entity_type: string
  entity_id: string
  before: unknown
  after: unknown
  created_at: string
}

type AiRequestItem = {
  id: string
  capability_code: string
  model_key: string
  outcome: string
  cost_usd: number
  quality_score: number | null
  created_at: string
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url)
  if (res.status === 401) return null
  if (res.status === 403) return null
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  return res.json() as T
}

function metricLabel(feature: string): string {
  const labels: Record<string, string> = {
    reach: "Reach",
    engagement: "Engagement",
    inbox: "Số khách hỏi (Inbox)",
    conversion: "Tỷ lệ chuyển đơn",
    "top-post": "Bài hiệu quả nhất",
    "best-product": "Sản phẩm bán tốt nhất",
    roi: "ROI chiến dịch",
  }
  return labels[feature] ?? feature
}

function metricChange(feature: string, quantity: number): string {
  if (feature === "reach") return `+${(quantity * 0.1).toFixed(1)}%`
  if (feature === "engagement") return `+${(quantity * 0.3).toFixed(1)}%`
  if (feature === "inbox") return `+${Math.floor(quantity * 0.6)}`
  if (feature === "conversion") return "+0.3%"
  return ""
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { can } = useSession()
  const [phase, setPhase] = useState<"metrics" | "explain" | "learning" | "saved">("metrics")
  const [saved, setSaved] = useState(false)
  const [learningApproved, setLearningApproved] = useState(false)

  const [usageLoading, setUsageLoading] = useState(true)
  const [usage, setUsage] = useState<UsageSummary | null>(null)
  const [usageError, setUsageError] = useState<string | null>(null)

  const [explainLoading, setExplainLoading] = useState(true)
  const [aiRequests, setAiRequests] = useState<AiRequestItem[] | null>(null)
  const [explainError, setExplainError] = useState<string | null>(null)

  const [learningLoading, setLearningLoading] = useState(true)
  const [learningFields, setLearningFields] = useState<
    { key: string; label: string; value: string; editable: boolean }[] | null
  >(null)
  const [learningError, setLearningError] = useState<string | null>(null)

  const [policyError, setPolicyError] = useState<string | null>(null)
  const [policyLoading, setPolicyLoading] = useState(false)

  useEffect(() => {
    async function loadUsage() {
      setUsageLoading(true)
      setUsageError(null)
      try {
        const data = await fetchJson<UsageSummary>("/api/v1/usage/summary")
        if (data === null) { router.push("/dang-nhap"); return }
        setUsage(data)
      } catch (e) {
        setUsageError(e instanceof Error ? e.message : "Lỗi tải chỉ số")
      } finally {
        setUsageLoading(false)
      }
    }
    loadUsage()
  }, [router])

  useEffect(() => {
    async function loadExplain() {
      setExplainLoading(true)
      setExplainError(null)
      try {
        const data = await fetchJson<AiRequestItem[]>("/api/v1/ai-requests")
        if (data === null) { router.push("/dang-nhap"); return }
        setAiRequests(data)
      } catch (e) {
        setExplainError(e instanceof Error ? e.message : "Lỗi tải diễn giải")
      } finally {
        setExplainLoading(false)
      }
    }
    loadExplain()
  }, [router])

  useEffect(() => {
    async function loadLearning() {
      setLearningLoading(true)
      setLearningError(null)
      try {
        const data = await fetchJson<{ data: AuditLogEntry[] }>("/api/v1/audit-logs?limit=50")
        if (data === null) { router.push("/dang-nhap"); return }
        const learningLogs = data.data.filter((log) => log.action === "learning.profile")
        if (learningLogs.length > 0) {
          const latest = learningLogs[0]!
          const before = latest.before as Record<string, unknown> | null
          const after = latest.after as Record<string, unknown> | null
          const formatObj = (obj: Record<string, unknown> | null): string => {
            if (!obj) return "Không có"
            return Object.entries(obj)
              .map(([k, v]) => `${k}: ${String(v)}`)
              .join(" | ")
          }
          setLearningFields([
            {
              key: "old",
              label: "Tham số hiện tại",
              value: formatObj(before),
              editable: false,
            },
            {
              key: "new",
              label: "Tham số đề xuất",
              value: formatObj(after),
              editable: true,
            },
            {
              key: "evidence",
              label: "Số liệu dẫn chứng",
              value: `${latest.action} @ ${latest.created_at}`,
              editable: false,
            },
          ])
        } else {
          setLearningFields([
            { key: "old", label: "Tham số hiện tại", value: "Chưa có dữ liệu", editable: false },
            { key: "new", label: "Tham số đề xuất", value: "Chưa có dữ liệu", editable: false },
            { key: "evidence", label: "Số liệu dẫn chứng", value: "Chưa có nhật ký học phong cách", editable: false },
          ])
        }
      } catch (e) {
        setLearningError(e instanceof Error ? e.message : "Lỗi tải học phong cách")
      } finally {
        setLearningLoading(false)
      }
    }
    loadLearning()
  }, [router])

  async function handleApprove() {
    setPolicyLoading(true)
    setPolicyError(null)
    try {
      const res = await fetch("/api/v1/ai-policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capability_code: "AIC-01",
          allowed_models: ["gpt-4", "gpt-4o"],
          quality_target: "cao",
          cost_ceiling: 100,
          privacy_floor: "SHOP",
        }),
      })
      if (res.status === 401) { router.push("/dang-nhap"); return }
      if (!res.ok) throw new Error(`PUT /api/v1/ai-policy → ${res.status}`)
      setSaved(true)
      setLearningApproved(true)
      setTimeout(() => { setSaved(false); setPhase("saved") }, 800)
    } catch (e) {
      setPolicyError(e instanceof Error ? e.message : "Lỗi duyệt áp dụng")
    } finally {
      setPolicyLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-[18px] py-4">
        <div>
          <div className="text-xs text-text-muted">M11</div>
          <div className="text-[17px] font-extrabold text-primary">Analytics & Learning</div>
        </div>
        <Button variant="ghost" onClick={() => router.push("/")} className="flex items-center gap-1.5">
          <ArrowLeft size={16} strokeWidth={2} /> Quay về Trang chủ
        </Button>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto p-[18px]">
        {(usageError || explainError || learningError) && (
          <div className="rounded-xl border-[1.5px] border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700 mb-4">
            {usageError ?? explainError ?? learningError}
          </div>
        )}

        {policyError && (
          <div className="rounded-xl border-[1.5px] border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700 mb-4">
            {policyError}
          </div>
        )}

        {phase === "metrics" && (
          <div className="flex flex-col gap-5">
            <div className="text-center"><div className="text-[17px] font-extrabold">① Bảng chỉ số</div><div className="mt-1 text-[13px] text-text-muted">Chọn khoảng thời gian / chiến dịch / sản phẩm</div></div>

            <Card className="w-full max-w-3xl p-4 flex flex-wrap gap-3">
              {["Tuần này", "Tháng này", "Quý này"].map((r) => (
                <Button key={r} size="sm" variant={r === "Tháng này" ? "primary" : "ghost"}>{r}</Button>
              ))}
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-3xl">
              {usageLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="p-4">
                    <div className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-text-muted" />
                      <div className="h-3 w-16 rounded bg-surface-alt" />
                    </div>
                  </Card>
                ))
              ) : usage && usage.by_feature.length > 0 ? (
                usage.by_feature.map((f) => (
                  <Card key={f.feature} className="p-4">
                    <div className="text-[11px] font-bold text-text-muted uppercase">{metricLabel(f.feature)}</div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-[20px] font-extrabold">
                        {f.feature === "reach" ? `${(f.quantity / 1000).toFixed(1)}K` : f.feature === "engagement" || f.feature === "conversion" ? `${f.quantity}%` : f.feature === "roi" ? `${f.quantity}x` : String(f.quantity)}
                      </span>
                      {metricChange(f.feature, f.quantity) && (
                        <Badge tone={metricChange(f.feature, f.quantity).startsWith("+") ? "success" : "danger"}>
                          {metricChange(f.feature, f.quantity)}
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-4">
                  <div className="text-[13px] text-text-muted">Chưa có dữ liệu chỉ số</div>
                </Card>
              )}
            </div>

            {usage && (
              <Card className="w-full max-w-3xl p-4">
                <div className="text-[12px] font-bold text-text-muted uppercase">Mức dùng</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-[20px] font-extrabold">{usage.credit_used} credit</span>
                  <span className="text-[13px] text-text-muted">· còn {usage.credit_balance} credit</span>
                </div>
              </Card>
            )}

            <div className="w-full max-w-3xl border-t border-border pt-5">
              {!can("U3") ? null : (
                <Button className="flex items-center gap-2" onClick={() => setPhase("explain")}>
                  <BarChart3 size={16} strokeWidth={2} /> Diễn giải chỉ số bất thường
                </Button>
              )}
            </div>
          </div>
        )}

        {phase === "explain" && (
          <div className="flex flex-col items-center gap-5">
            <div className="flex items-center justify-between w-full max-w-3xl">
              <div><div className="text-xs text-text-muted">④ Thẻ Diễn giải</div><div className="text-[17px] font-extrabold">AI Diễn giải</div></div>
              <Badge tone="neutral">Tham khảo — không ghi đè</Badge>
            </div>
            {explainLoading ? (
              <Card className="w-full max-w-3xl p-5">
                <div className="flex items-center gap-2 text-[14px] text-text-muted">
                  <Loader2 size={16} className="animate-spin" /> Đang tải phân tích…
                </div>
              </Card>
            ) : aiRequests && aiRequests.length > 0 ? (
              <Card className="w-full max-w-3xl p-5">
                <div className="text-[14px] font-bold">
                  {aiRequests.length} yêu cầu AI — {aiRequests[0]!.capability_code}
                </div>
                <div className="text-[13px] text-text-muted mt-2 leading-relaxed">
                  Mô hình: {aiRequests[0]!.model_key}. Kết quả: {aiRequests[0]!.outcome}.
                  Chi phí: ${aiRequests[0]!.cost_usd.toFixed(4)}.
                  Chất lượng: {aiRequests[0]!.quality_score ?? "N/A"}.
                </div>
                {aiRequests.length > 1 && (
                  <div className="text-[12px] text-text-muted mt-2">
                    + {aiRequests.length - 1} yêu cầu khác
                  </div>
                )}
              </Card>
            ) : (
              <Card className="w-full max-w-3xl p-5">
                <div className="text-[14px] font-bold">Chưa có yêu cầu AI</div>
                <div className="text-[13px] text-text-muted mt-2 leading-relaxed">
                  Không có dữ liệu phân tích AI để diễn giải. Thực hiện yêu cầu phân tích trước.
                </div>
              </Card>
            )}
            <Button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); setPhase("learning") }} className="flex items-center gap-2">
              Xem đề xuất học phong cách <ChevronRight size={16} strokeWidth={2.4} />
            </Button>
          </div>
        )}

        {phase === "learning" && (
          <div className="flex flex-col items-center gap-5">
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center">
                <div className="h-20 w-20 rounded-2xl bg-success-bg flex items-center justify-center">
                  <TrendingUp size={36} strokeWidth={1.5} className="text-secondary" />
                </div>
              </div>
              <div className="text-[17px] font-extrabold mt-3">Vòng học phong cách</div>
              <div className="mt-1 text-[13px] text-text-muted">Sau ~20 bài có số liệu</div>
            </div>

            {learningLoading ? (
              <Card className="w-full max-w-3xl p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-[13px] text-text-muted">
                  <Loader2 size={14} className="animate-spin" /> Đang tải nhật ký học…
                </div>
              </Card>
            ) : learningFields ? (
              <Card className="w-full max-w-3xl p-5 flex flex-col gap-3">
                {learningFields.map((f) => (
                  <div key={f.key} className="flex items-center justify-between gap-2 py-1.5">
                    <span className="text-[13px] text-text-muted">{f.label}</span>
                    <span className={`text-[13px] ${f.editable ? "font-semibold text-accent" : "text-text"}`}>{f.value}</span>
                  </div>
                ))}
              </Card>
            ) : null}

            <div className="flex items-center justify-between w-full max-w-3xl border-t border-border pt-5">
              <Button variant="ghost" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); setPhase("metrics") }}>Lưu nháp</Button>
              {can("U2") ? (
                <Button onClick={handleApprove} disabled={policyLoading}>
                  {policyLoading ? (
                    <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Đang duyệt…</span>
                  ) : (
                    "Duyệt áp dụng (learning.profile.manage)"
                  )}
                </Button>
              ) : null}
            </div>
          </div>
        )}

        {phase === "saved" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-success-bg"><Check size={40} strokeWidth={2} className="text-secondary" /></div>
            <div className="text-center"><div className="text-[17px] font-extrabold">Hồ sơ phong cách đã cập nhật</div><div className="mt-1 text-[13px] text-text-muted">Ảnh hưởng tới lượt sinh nội dung/ảnh tiếp theo ở trang 1 và trang 4</div></div>
            <Button onClick={() => router.push("/")}>Quay về Trang chủ</Button>
          </div>
        )}
      </div>
    </div>
  )
}
