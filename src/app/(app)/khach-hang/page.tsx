"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronRight, ArrowLeft, AlertTriangle, Users, Heart, Send, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const MOCK_CUSTOMERS = [
  { id: "k1", name: "Lan Anh", upcoming: "18/10 — sinh nhật vợ", totalOrders: 5, lastBuy: "Bó hồng đỏ" },
  { id: "k2", name: "Minh Tuấn", upcoming: "Không có", totalOrders: 2, lastBuy: "Giỏ hoa chúc mừng" },
  { id: "k3", name: "Phương Thao", upcoming: "8/3 — Ngày của Mẹ", totalOrders: 8, lastBuy: "Hộp hoa hồng phấn" },
]

const CAMPAIGN_FIELDS = [
  { key: "customer", label: "Tên khách hàng, dịp phát hiện", type: "readonly" as const, editable: false, value: "" },
  { key: "reason", label: "Lý do gợi ý", type: "readonly" as const, editable: false, value: "" },
  { key: "content", label: "Nội dung nhắc (soạn sẵn)", type: "text" as const, editable: true, value: "" },
  { key: "channel", label: "Kênh gửi", type: "text" as const, editable: true, value: "" },
  { key: "voucher", label: "Voucher đính kèm", type: "text" as const, editable: true, value: "" },
]

export default function CRMPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<"list" | "profile" | "running" | "results" | "saved">("list")
  const [selectedCustomer, setSelectedCustomer] = useState<(typeof MOCK_CUSTOMERS)[0] | null>(null)
  const [jobPhase, setJobPhase] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<"PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED" | null>(null)
  const [judgment, setJudgment] = useState<"safe" | "warning" | "blocked">("safe")
  const [saved, setSaved] = useState(false)
  const [consent, setConsent] = useState(true)
  const [showDelete, setShowDelete] = useState(false)

  function runCampaign(c: typeof MOCK_CUSTOMERS[0]) {
    setSelectedCustomer(c)
    setPhase("running")
    setJobStatus("PENDING")
    setJobPhase("SCANNING")
    setTimeout(() => { setJobStatus("PROCESSING"); setJobPhase("ANALYZING") }, 800)
    setTimeout(() => { setJobStatus("COMPLETED") }, 2500)
    setTimeout(() => { setPhase("results") }, 3000)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-[18px] py-4">
        <div>
          <div className="text-xs text-text-muted">M09</div>
          <div className="text-[17px] font-extrabold text-primary">CRM & Khách hàng</div>
        </div>
        <Button variant="ghost" onClick={() => router.push("/")} className="flex items-center gap-1.5">
          <ArrowLeft size={16} strokeWidth={2} /> Quay về Trang chủ
        </Button>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto p-[18px]">
        {phase === "list" && (
          <div className="flex flex-1 flex-col items-center gap-5">
            <div className="text-center"><div className="text-[17px] font-extrabold">① Danh sách khách hàng</div><div className="mt-1 text-[13px] text-text-muted">Nhập tay hoặc tự động từ đơn hàng</div></div>
            <div className="w-full max-w-3xl">
              {MOCK_CUSTOMERS.map((c) => (
                <Card key={c.id} className="flex items-center gap-4 mb-3">
                  <div className="flex-1">
                    <div className="text-[14px] font-bold">{c.name}</div>
                    <div className="text-[12px] text-text-muted">{c.upcoming} · {c.totalOrders} đơn · Mua gần nhất: {c.lastBuy}</div>
                  </div>
                  <Badge tone="neutral">{c.upcoming === "Không có" ? "Không có dịp" : "Có dịp"}</Badge>
                  <Button onClick={() => runCampaign(c)} className="flex items-center gap-1">
                    Gợi ý nhắc mua <Sparkles2 size={14} strokeWidth={2} />
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {phase === "running" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5">
            <div className="text-center"><div className="text-[17px] font-extrabold">③ Đang phân tích</div><div className="mt-1 text-[13px] text-text-muted">AI quét theo lô — KHÔNG gửi tên/số điện thoại/địa chỉ ra ngoài</div></div>
            <div className="w-full max-w-md">
              <div className="rounded-xl bg-surface-alt p-4 text-[12px] text-text-muted flex items-start gap-2">
                <ShieldCheck size={16} strokeWidth={1.8} className="mt-0.5 flex-shrink-0 text-primary" />
                Chỉ đọc dịp + lịch sử mua — dữ liệu cá nhân không đi ngoài
              </div>
            </div>
          </div>
        )}

        {phase === "results" && selectedCustomer && (
          <div className="flex flex-col items-center gap-5">
            <div className="flex items-center justify-between w-full max-w-3xl">
              <div><div className="text-xs text-text-muted">④ Thẻ kết quả — Gợi ý nhắc mua</div><div className="text-[17px] font-extrabold">{selectedCustomer.name}</div></div>
              <Badge tone={saved ? "success" : judgment === "blocked" ? "danger" : judgment === "warning" ? "warning" : "neutral"}>
                {saved ? "Đã lưu nháp" : judgment === "blocked" ? "Bị chặn" : judgment === "warning" ? "Cảnh báo" : "An toàn"}
              </Badge>
            </div>

            <div className="w-full max-w-3xl flex flex-col gap-3">
              <ResultCardSimple fields={CAMPAIGN_FIELDS.map((f) => ({ ...f, value: f.key === "customer" ? `${selectedCustomer.name} — ${selectedCustomer.upcoming}` : f.key === "reason" ? `Mua ${selectedCustomer.lastBuy} cách đây ~2 tháng` : f.value }))} judgment={judgment}
                onSaveDraft={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }}
                onReject={() => setJudgment("blocked")}
                onApprove={() => { setSaved(true); setJudgment("safe"); setSaved(false); setPhase("saved") }}
              />
            </div>

            <div className="w-full max-w-3xl border-t border-border pt-5">
              <div className="flex items-start gap-2.5 rounded-xl bg-warning-bg border border-warning p-4">
                <AlertTriangle size={16} strokeWidth={1.8} className="mt-0.5 flex-shrink-0 text-warning" />
                <div className="flex-1">
                  <div className="text-[14px] font-bold text-warning">Đồng ý & quyền dữ liệu</div>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input type="checkbox" checked={consent} onChange={() => setConsent(!consent)} className="h-4 w-4 accent-primary" />
                    <span className="text-[13px]">Khách hàng đồng ý nhận nhắc</span>
                  </label>
                  <button type="button" onClick={() => setShowDelete(!showDelete)} className="text-[12px] font-bold text-danger mt-1 block">
                    Yêu cầu xoá dữ liệu
                  </button>
                  {showDelete && (
                    <div className="mt-2 rounded-lg bg-surface-alt p-3 text-[12px] text-text-muted">
                      Thực thi ngay khi khách hàng yêu cầu — xoá toàn bộ dữ liệu cá nhân.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {phase === "saved" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-success-bg"><Check size={40} strokeWidth={2} className="text-secondary" /></div>
            <div className="text-center"><div className="text-[17px] font-extrabold">Đã lưu — lên lịch gửi</div><div className="mt-1 text-[13px] text-text-muted">Nội dung nhắc mua đã vào hàng chờ gửi</div></div>
            <Button onClick={() => router.push("/")}>Quay về Trang chủ</Button>
          </div>
        )}
      </div>
    </div>
  )
}

function ResultCardSimple({ fields, judgment, onSaveDraft, onReject, onApprove, quality, onFieldChange }: {
  fields: { key: string; label: string; type: "text" | "readonly"; editable: boolean; value: string }[]
  judgment: "safe" | "warning" | "blocked"
  onSaveDraft?: () => void
  onReject?: () => void
  onApprove?: () => void
  quality?: { score: number; label: string; status: "safe" }
  onFieldChange?: (key: string, value: string) => void
}) {
  return (
    <div className="flex flex-col gap-3 border border-border rounded-xl bg-surface p-4">
      <div className="flex flex-col divide-y divide-border">
        {fields.map((f) => (
          <div key={f.key} className="flex items-center justify-between gap-2 py-2">
            <span className="text-[13px] text-text-muted">{f.label}</span>
            <span className={`text-[13px] ${f.editable ? "font-semibold text-text" : "font-semibold text-text"}`}>{f.value || "—"}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-border pt-3">
        {onSaveDraft && <Button variant="secondary" onClick={onSaveDraft}>Lưu nháp</Button>}
        {onReject && <Button variant="ghost" onClick={onReject}>Từ chối</Button>}
        {onApprove && judgment !== "blocked" && <Button onClick={onApprove}>Duyệt</Button>}
        {judgment === "blocked" && <div className="text-[12.5px] text-danger">Bị chặn — không thể duyệt</div>}
      </div>
    </div>
  )
}

function Sparkles2({ size, strokeWidth }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth ?? 2}>
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
    </svg>
  )
}
