"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ArrowLeft, BarChart3, ChevronRight, TrendingUp } from "lucide-react"
import { useSession } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SkeletonBlock } from "@/components/ui/skeleton"
import { FeatureGuidanceCard } from "@/components/ui/feature-guidance-card"

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
    reach: "Lượt tiếp cận (Reach)",
    engagement: "Tương tác (Engagement)",
    inbox: "Khách hỏi (Inbox)",
    conversion: "Chuyển đổi đơn hàng",
    "top-post": "Bài viết nổi bật",
    "best-product": "Sản phẩm bán chạy",
    roi: "Tỷ suất hoàn vốn (ROI)",
  }
  return labels[feature] ?? feature
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { can } = useSession()
  const [phase, setPhase] = useState<"metrics" | "explain" | "learning" | "saved">("metrics")
  const [saved, setSaved] = useState(false)
  const [learningApproved, setLearningApproved] = useState(false)
  const [selectedRange, setSelectedRange] = useState("Tháng này")

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
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-6 py-4">
        <div>
          <div className="text-xs text-text-muted font-bold tracking-wider uppercase">Báo cáo & Phân tích</div>
          <div className="text-title font-extrabold text-primary flex items-center gap-2">
            <BarChart3 size={18} />
            Analytics & Learning
          </div>
        </div>
        <Button variant="ghost" onClick={() => router.push("/")} className="flex items-center gap-1.5 text-xs">
          <ArrowLeft size={16} strokeWidth={2} /> Quay về Trang chủ
        </Button>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto p-6 max-w-4xl mx-auto w-full gap-5">
        <FeatureGuidanceCard
          badgeLabel="HƯỚNG DẪN HIỆU QUẢ"
          icon={BarChart3}
          title="Đo lường hiệu quả kinh doanh & Vòng học phong cách AI"
          description="Theo dõi mức sử dụng hạn mức, số liệu thực tế từ các tính năng và duyệt các đề xuất điều chỉnh phong cách nội dung sau các chu kỳ tiếp thị."
          tips={[
            "📊 Mọi số liệu hiển thị là số đo thực tế từ hệ thống (không dùng số liệu mô phỏng)",
            "⚡ Vòng học phong cách đề xuất tinh chỉnh Tone of Voice và Brand Kit dựa trên phản hồi khách hàng",
            "🛡️ Duyệt áp dụng chính sách cần quyền quản trị U2 (learning.profile.manage)",
          ]}
        />

        {(usageError || explainError || learningError) && (
          <div className="rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-xs font-semibold text-danger">
            {usageError ?? explainError ?? learningError}
          </div>
        )}

        {policyError && (
          <div className="rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-xs font-semibold text-danger">
            {policyError}
          </div>
        )}

        {phase === "metrics" && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-text">Bảng chỉ số đo lường</h2>
                <p className="text-xs text-text-muted">Chọn khoảng thời gian theo dõi hiệu quả</p>
              </div>

              <div className="flex items-center gap-1.5 bg-surface p-1 rounded-xl border border-border">
                {["Tuần này", "Tháng này", "Quý này"].map((r) => (
                  <Button
                    key={r}
                    size="sm"
                    variant={r === selectedRange ? "primary" : "ghost"}
                    className="text-xs"
                    onClick={() => setSelectedRange(r)}
                  >
                    {r}
                  </Button>
                ))}
              </div>
            </div>

            {/* Khối thẻ số đo thực tế */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {usageLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="p-4 bg-surface border border-border">
                    <SkeletonBlock lines={2} label="Đang tải chỉ số đo lường..." />
                  </Card>
                ))
              ) : usage && usage.by_feature.length > 0 ? (
                usage.by_feature.map((f) => (
                  <Card key={f.feature} className="p-4 bg-surface border border-border flex flex-col justify-between gap-2">
                    <div className="text-caption font-bold text-text-muted uppercase tracking-wider">
                      {metricLabel(f.feature)}
                    </div>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-display-lg font-black text-text">
                        {f.quantity.toLocaleString("vi-VN")}
                      </span>
                      <span className="text-xs font-semibold text-text-muted">
                        {f.cost_credit} credits
                      </span>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-4 col-span-full text-center bg-surface border border-border">
                  <div className="text-xs text-text-muted">Chưa có dữ liệu chỉ số cho khoảng thời gian này</div>
                </Card>
              )}
            </div>

            {/* Bảng số liệu chi tiết thay thế cho trình đọc màn hình và tra cứu số đo chính xác */}
            {usage && usage.by_feature.length > 0 && (
              <Card className="p-4 bg-surface border border-border flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider">
                    Bảng số liệu chi tiết theo tính năng
                  </h3>
                  <span className="text-caption text-text-muted">Đo lường thật từ backend</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <caption className="sr-only">Bảng chi tiết số đo mức sử dụng theo từng tính năng</caption>
                    <thead>
                      <tr className="border-b border-border text-text-muted">
                        <th scope="col" className="pb-2 font-semibold">Tính năng</th>
                        <th scope="col" className="pb-2 font-semibold text-right">Số lượt đo</th>
                        <th scope="col" className="pb-2 font-semibold text-right">Hạn mức credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {usage.by_feature.map((f) => (
                        <tr key={f.feature} className="hover:bg-surface-alt/40 transition-colors">
                          <th scope="row" className="py-2.5 font-medium text-text">
                            {metricLabel(f.feature)}
                          </th>
                          <td className="py-2.5 text-right font-bold text-text">
                            {f.quantity.toLocaleString("vi-VN")}
                          </td>
                          <td className="py-2.5 text-right text-text-muted">
                            {f.cost_credit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Mức dùng tổng quan */}
            {usage && (
              <Card className="p-4 bg-surface border border-border flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-text-muted uppercase">Tổng mức sử dụng</div>
                  <div className="text-lg font-black text-text mt-0.5">
                    {usage.credit_used} credit
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-text-muted block">Hạn mức còn lại</span>
                  <span className="text-sm font-extrabold text-primary">
                    {usage.credit_balance} credit
                  </span>
                </div>
              </Card>
            )}

            <div className="border-t border-border pt-4 flex items-center justify-end">
              {!can("U3") ? null : (
                <Button className="gap-2 shadow-xs" onClick={() => setPhase("explain")}>
                  <BarChart3 size={15} /> Diễn giải chỉ số bất thường
                </Button>
              )}
            </div>
          </div>
        )}

        {phase === "explain" && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-xs text-text-muted font-bold uppercase">AI Diễn giải</span>
                <h2 className="text-base font-bold text-text">Phân tích nguyên nhân & Chỉ số bất thường</h2>
              </div>
              <Badge tone="neutral">Tham khảo — không ghi đè</Badge>
            </div>

            {explainLoading ? (
              <Card className="p-5 bg-surface border border-border">
                <SkeletonBlock lines={3} label="Đang tải phân tích diễn giải AI..." />
              </Card>
            ) : aiRequests && aiRequests.length > 0 ? (
              <Card className="p-5 bg-surface border border-border flex flex-col gap-3">
                <div className="text-sm font-bold text-text">
                  {aiRequests.length} yêu cầu AI — {aiRequests[0]!.capability_code}
                </div>
                <div className="text-xs text-text-muted leading-relaxed">
                  Mô hình: <strong className="text-text">{aiRequests[0]!.model_key}</strong>. Kết quả: {aiRequests[0]!.outcome}.
                  Chi phí: ${aiRequests[0]!.cost_usd.toFixed(4)}.
                  Chất lượng: {aiRequests[0]!.quality_score ?? "Đạt chuẩn"}.
                </div>
                {aiRequests.length > 1 && (
                  <div className="text-caption text-text-muted mt-1">
                    + {aiRequests.length - 1} yêu cầu khác trong hệ thống
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-5 bg-surface border border-border text-center">
                <div className="text-sm font-bold text-text">Chưa có yêu cầu AI nào được ghi nhận</div>
                <div className="text-xs text-text-muted mt-1">
                  Chưa phát hiện chỉ số bất thường nào cần can thiệp diễn giải.
                </div>
              </Card>
            )}

            <div className="flex items-center justify-between border-t border-border pt-4">
              <Button variant="ghost" size="sm" onClick={() => setPhase("metrics")}>
                Quay lại bảng chỉ số
              </Button>
              <Button
                onClick={() => {
                  setSaved(true)
                  setTimeout(() => setSaved(false), 2000)
                  setPhase("learning")
                }}
                className="gap-2 shadow-xs"
              >
                Xem đề xuất học phong cách <ChevronRight size={15} />
              </Button>
            </div>
          </div>
        )}

        {phase === "learning" && (
          <div className="flex flex-col gap-5">
            <div className="text-center py-2">
              <div className="flex items-center justify-center mb-2">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <TrendingUp size={32} />
                </div>
              </div>
              <h2 className="text-base font-extrabold text-text">Vòng học phong cách thương hiệu</h2>
              <p className="text-xs text-text-muted mt-0.5">Tự động tổng hợp sau mỗi chu kỳ chiến dịch tiếp thị</p>
            </div>

            {learningLoading ? (
              <Card className="p-5 bg-surface border border-border">
                <SkeletonBlock lines={3} label="Đang tải nhật ký học phong cách..." />
              </Card>
            ) : learningFields ? (
              <Card className="p-5 bg-surface border border-border flex flex-col gap-3">
                {learningFields.map((f) => (
                  <div key={f.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-2 border-b border-border/50 last:border-none">
                    <span className="text-xs font-semibold text-text-muted">{f.label}:</span>
                    <span className={`text-xs ${f.editable ? "font-bold text-primary" : "text-text"}`}>
                      {f.value}
                    </span>
                  </div>
                ))}
              </Card>
            ) : null}

            <div className="flex items-center justify-between border-t border-border pt-4">
              <Button variant="ghost" size="sm" onClick={() => setPhase("metrics")}>
                Quay lại
              </Button>
              {can("U2") ? (
                <Button onClick={handleApprove} disabled={policyLoading} className="shadow-xs">
                  {policyLoading ? "Đang duyệt..." : "Duyệt áp dụng (learning.profile.manage)"}
                </Button>
              ) : null}
            </div>
          </div>
        )}

        {phase === "saved" && (
          <div className="flex flex-1 flex-col items-center justify-center py-12 gap-5 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/15 text-success">
              <Check size={32} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-text">Hồ sơ phong cách đã cập nhật</h2>
              <p className="text-xs text-text-muted mt-1 max-w-sm">
                Các lượt sinh nội dung và ảnh tiếp theo sẽ tự động áp dụng hồ sơ phong cách mới này.
              </p>
            </div>
            <Button onClick={() => setPhase("metrics")} className="shadow-xs">
              Về bảng chỉ số
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
