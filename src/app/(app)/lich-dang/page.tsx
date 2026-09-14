"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronRight, ArrowLeft, AlertTriangle, Calendar, RefreshCw, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type ContentItem = {
  id: string
  title: string
  channel: string
  status: "scheduled" | "publishing" | "posted" | "error"
  time: string
}

const MOCK_CONTENT: ContentItem[] = [
  { id: "c1", title: "Bó hồng đỏ — 20/10", channel: "Facebook", status: "scheduled", time: "Hôm nay 20:00" },
  { id: "c2", title: "Giỏ hoa chúc mừng", channel: "Instagram", status: "posted", time: "Hôm qua 10:00" },
  { id: "c3", title: "Hộp hoa hồng phấn", channel: "TikTok", status: "publishing", time: "Đang đăng..." },
  { id: "c4", title: "Bình hoa để bàn", channel: "Zalo OA", status: "error", time: "Lỗi nền tảng" },
]

const STATUS_LABEL: Record<string, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  scheduled: { label: "Đã lên lịch", tone: "success" },
  publishing: { label: "Đang đăng", tone: "warning" },
  posted: { label: "Đã đăng", tone: "success" },
  error: { label: "Lỗi", tone: "danger" },
}

export default function SocialPublishingPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"calendar" | "repost" | "auto">("calendar")
  const [autoApprove, setAutoApprove] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>(["c1"])
  const [notice, setNotice] = useState<string | null>(null)

  function confirmSchedule() {
    setNotice("Đã xác nhận lịch đăng — nội dung đang được xử lý.")
    setTimeout(() => setNotice(null), 3000)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-[18px] py-4">
        <div>
          <div className="text-xs text-text-muted">M07 (phần đăng)</div>
          <div className="text-[17px] font-extrabold text-primary">Social Publishing</div>
        </div>
        <Button variant="ghost" onClick={() => router.push("/")} className="flex items-center gap-1.5">
          <ArrowLeft size={16} strokeWidth={2} /> Quay về Trang chủ
        </Button>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto p-[18px]">
        <div className="flex items-center gap-2 mb-4">
          {(["calendar", "repost", "auto"] as const).map((tab) => (
            <Button key={tab} size="sm" variant={activeTab === tab ? "primary" : "ghost"} onClick={() => setActiveTab(tab)} className="capitalize">
              {tab === "calendar" ? "Lịch đăng" : tab === "repost" ? "Đăng lại thông minh" : "Tự duyệt"}
            </Button>
          ))}
        </div>

        {notice && (
          <div className="mb-4 rounded-lg bg-success-bg px-4 py-2 text-[12.5px] font-medium text-secondary">{notice}</div>
        )}

        {activeTab === "calendar" && (
          <div className="flex flex-col gap-5">
            <div className="text-center">
              <div className="text-[17px] font-extrabold">⑤ Xác nhận lịch đăng</div>
              <div className="mt-1 text-[13px] text-text-muted">Chọn bài từ Thư viện nội dung đã duyệt → chọn nền tảng + thời điểm → xác nhận</div>
            </div>

            <div className="w-full max-w-3xl">
              {MOCK_CONTENT.filter((c) => c.status === "scheduled" || c.status === "error").map((item) => (
                <Card key={item.id} className="flex items-center gap-4 mb-3">
                  <input type="checkbox" checked={selectedItems.includes(item.id)}
                    onChange={() => setSelectedItems((p) => p.includes(item.id) ? p.filter((i) => i !== item.id) : [...p, item.id])}
                    className="h-4 w-4 accent-primary" />
                  <div className="flex-1">
                    <div className="text-[14px] font-bold">{item.title}</div>
                    <div className="text-[12px] text-text-muted">{item.channel} · {item.time}</div>
                  </div>
                  <Badge tone={STATUS_LABEL[item.status]!.tone}>{STATUS_LABEL[item.status]!.label}</Badge>
                  {item.status === "error" && (
                    <Button size="sm" variant="ghost"><RefreshCw size={14} strokeWidth={2} className="mr-1" /> Thử lại</Button>
                  )}
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between w-full max-w-3xl">
              <div className="text-[12px] text-text-muted">
                {selectedItems.length} bài đã chọn
              </div>
              <Button onClick={confirmSchedule} disabled={selectedItems.length === 0}>
                Xác nhận lịch đăng
              </Button>
            </div>

            <div className="w-full max-w-3xl border-t border-border pt-4">
              <div className="text-[14px] font-bold mb-2">Xem trước nền tảng</div>
              <div className="grid grid-cols-4 gap-3">
                {["Facebook", "Instagram", "TikTok", "Zalo"].map((p) => (
                  <Card key={p} className="p-3 text-center">
                    <div className="text-[12px] font-bold">{p}</div>
                    <div className="mt-1 text-[10px] text-text-muted">Xem trước khung hiển thị</div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "repost" && (
          <div className="flex flex-col gap-5">
            <div className="text-[17px] font-extrabold">Đăng lại thông minh</div>
            <div className="text-[12.5px] text-text-muted">Bài cũ được Analytics đánh dấu hiệu quả cao</div>
            {MOCK_CONTENT.filter((c) => c.status === "posted").map((item) => (
              <Card key={item.id} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-[14px] font-bold">{item.title}</div>
                  <div className="text-[12px] text-text-muted">{item.channel} · {item.time}</div>
                </div>
                <Badge tone="success">Hiệu quả cao</Badge>
                <Button onClick={() => { setSelectedItems([...selectedItems, item.id]); setActiveTab("calendar") }} className="flex items-center gap-1">
                  Đăng lại <ChevronRight size={14} strokeWidth={2} />
                </Button>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "auto" && (
          <div className="flex flex-col gap-5">
            <div className="text-[17px] font-extrabold">Tự duyệt theo thời hạn</div>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[14px] font-bold">Công tắc tự duyệt</div>
                  <div className="mt-1 text-[12px] text-text-muted">Tắt theo mặc định — chỉ ai có quyền Điều hành mới thấy</div>
                </div>
                <button role="switch" aria-checked={autoApprove} onClick={() => setAutoApprove(!autoApprove)}
                  className={`relative h-7 w-12 rounded-full transition-colors ${autoApprove ? "bg-primary" : "bg-border"}`}>
                  <span className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white transition-transform ${autoApprove ? "translate-x-5" : ""}`} />
                </button>
              </div>
            </Card>
            {autoApprove && (
              <div className="rounded-xl bg-warning-bg border border-warning p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} strokeWidth={1.8} className="mt-0.5 flex-shrink-0 text-warning" />
                  <div className="text-[12.5px] leading-relaxed text-warning">
                    Bài chờ quá 24 giờ sẽ tự đăng. Đổi giá, khuyến mại, hoặc thông tin có tính pháp lý/y tế không bao giờ tự đăng dù bật công tắc này.
                  </div>
                </div>
              </div>
            )}
            <div className="text-[12px] text-text-muted">Mỗi lần bật/tắt ghi lại người thao tác.</div>
          </div>
        )}
      </div>
    </div>
  )
}
