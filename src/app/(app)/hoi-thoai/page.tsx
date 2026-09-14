"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ArrowLeft, MessageSquare, RefreshCw, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Conversation = { id: string; customer: string; messages: { role: "user" | "ai"; text: string; source?: string }[] }

const MOCK_CONVS: Conversation[] = [
  {
    id: "c1", customer: "Lan Anh",
    messages: [
      { role: "user", text: "Bó hồng đỏ có size nào?" },
      { role: "ai", text: "Dạ hiện có 20 cành và 30 cành. Giá từ 1.200.000đ.", source: "Bó hồng đỏ 20 cành — Product Master" },
      { role: "user", text: "Cho đặt 30 cành nhé" },
      { role: "ai", text: "Dạ xác nhận đơn 30 cành. Nhân viên sẽ liên hệ xác nhận.", source: "Bó hồng đỏ 30 cành — Product Master" },
    ],
  },
  {
    id: "c2", customer: "Minh Tuấn",
    messages: [
      { role: "user", text: "Giỏ hoa có bao nhiêu loại?" },
      { role: "ai", text: "Hiện có 3 loại: nhỏ, vừa, lớn.", source: "Giỏ hoa — Product Master" },
    ],
  },
]

const SCOPE_FIELDS = [
  { key: "price", label: "Giá", type: "text" as const, value: "Được phép" },
  { key: "delivery", label: "Vùng giao hàng", type: "text" as const, value: "Nội thành" },
  { key: "similar", label: "Mẫu tương tự", type: "text" as const, value: "Được phép" },
  { key: "stock", label: "Tồn kho theo tone", type: "text" as const, value: "Được phép" },
  { key: "budget", label: "Gợi ý theo ngân sách", type: "text" as const, value: "Được phép" },
]

const SAMPLE_QS = ["Bó hồng đỏ giá bao nhiêu?", "Gửi trong nội thành được không?", "Có mẫu tương tự không?"]

export default function ChatAssistantPage() {
  const router = useRouter()
  const [tab, setTab] = useState<"conversation" | "config">("conversation")
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(MOCK_CONVS[0]!)
  const [scopeFields, setScopeFields] = useState(SCOPE_FIELDS)
  const [judgment, setJudgment] = useState<"safe" | "warning" | "blocked">("safe")
  const [saved, setSaved] = useState(false)
  const [threshold, setThreshold] = useState(70)

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-[18px] py-4">
        <div>
          <div className="text-xs text-text-muted">M08</div>
          <div className="text-[17px] font-extrabold text-primary">AI Chat Assistant</div>
        </div>
        <Button variant="ghost" onClick={() => router.push("/")} className="flex items-center gap-1.5">
          <ArrowLeft size={16} strokeWidth={2} /> Quay về Trang chủ
        </Button>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto p-[18px]">
        <div className="flex items-center gap-2 mb-4">
          <Button size="sm" variant={tab === "conversation" ? "primary" : "ghost"} onClick={() => setTab("conversation")}>Tab A — Hội thoại</Button>
          <Button size="sm" variant={tab === "config" ? "primary" : "ghost"} onClick={() => setTab("config")}>Tab B — Cấu hình</Button>
        </div>

        {tab === "conversation" && (
          <div className="flex flex-1 gap-4">
            <div className="w-64 flex flex-col gap-2">
              <div className="text-[13px] font-bold mb-1">Danh sách hội thoại</div>
              {MOCK_CONVS.map((c) => (
                <button key={c.id} onClick={() => setSelectedConv(c)}
                  className={`text-left p-3 rounded-lg text-[13px] ${selectedConv?.id === c.id ? "bg-primary text-white" : "bg-surface-alt hover:bg-surface"}`}>
                  {c.customer}
                </button>
              ))}
            </div>
            <div className="flex-1 flex flex-col">
              {selectedConv && (
                <>
                  <div className="text-[13px] font-bold mb-3">{selectedConv.customer}</div>
                  <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
                    {selectedConv.messages.map((m, i) => (
                      <div key={i} className={`rounded-lg p-3 ${m.role === "ai" ? "bg-surface-alt" : "bg-primary text-white"}`}>
                        <div className="text-[13px]">{m.text}</div>
                        {m.source && (
                          <div className={`text-[10px] mt-1 ${m.role === "ai" ? "text-text-muted" : "text-white/60"}`}>
                            Dẫn từ: {m.source}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="ghost" className="flex items-center gap-1"><RefreshCw size={14} strokeWidth={2} /> Chuyển cho nhân viên</Button>
                    <Button size="sm">Gắn cờ xem lại</Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {tab === "config" && (
          <div className="flex flex-col items-center gap-5">
            <div className="text-center"><div className="text-[17px] font-extrabold">④ Cấu hình phạm vi trả lời</div><div className="mt-1 text-[13px] text-text-muted">Chọn phạm vi AI được trả lời + soạn câu trả lời mẫu</div></div>

            <Card className="w-full max-w-3xl p-5 flex flex-col gap-3">
              {scopeFields.map((f) => (
                <div key={f.key} className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium">{f.label}</span>
                  <Badge tone="success">{f.value}</Badge>
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold">Ngưỡng &ldquo;AI không chắc → chuyển người&rdquo;</label>
                <input type="range" min={0} max={100} value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="accent-primary" />
                <div className="text-[11px] text-text-muted">{threshold}%</div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold">Câu trả lời mẫu (FAQ)</label>
                <textarea className="h-20 w-full rounded-lg border-[1.5px] border-border bg-surface px-2.5 py-2 text-[13px] outline-none focus:border-primary" placeholder="Soạn câu trả lời mẫu..." />
              </div>
            </Card>

            <div className="w-full max-w-3xl border-t border-border pt-5">
              <div className="text-[14px] font-bold mb-2">Xem trước — mô phỏng 3 câu hỏi mẫu</div>
              <div className="grid gap-2">
                {SAMPLE_QS.map((q, i) => (
                  <Card key={i} className="p-3">
                    <div className="text-[13px] font-bold">{q}</div>
                    <div className="text-[12px] text-text-muted mt-1">AI sẽ trả lời dựa trên cấu hình hiện tại...</div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between w-full max-w-3xl border-t border-border pt-5">
              <Button variant="ghost" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }}>Lưu nháp</Button>
              <Button onClick={() => { setSaved(true); setJudgment("safe"); setSaved(false); setTimeout(() => router.push("/"), 800) }}>
                Duyệt cấu hình → Áp dụng ngay
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
