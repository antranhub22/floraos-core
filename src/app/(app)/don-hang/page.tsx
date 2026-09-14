"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronRight, ArrowLeft, AlertTriangle, ClipboardList, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Order = {
  id: string
  customer: string
  product: string
  qty: number
  price: number
  status: "Moi" | "PhanCong" | "DangLam" | "DaGiao"
  sla: string
  staff?: string
}

const MOCK_ORDERS: Order[] = [
  { id: "D001", customer: "Lan Anh", product: "Bó hồng đỏ 20 cành", qty: 2, price: 1200000, status: "Moi", sla: "2h 15p" },
  { id: "D002", customer: "Minh Tuấn", product: "Giỏ hoa chúc mừng", qty: 1, price: 850000, status: "PhanCong", sla: "45p", staff: "Thợ Nguyễn" },
  { id: "D003", customer: "Phương Thao", product: "Hộp hoa hồng phấn", qty: 3, price: 2100000, status: "DangLam", sla: "1h 30p", staff: "Thảo Tư" },
  { id: "D004", customer: "Quang Vinh", product: "Bình hoa để bàn", qty: 1, price: 450000, status: "DaGiao", sla: "Đã giao" },
]

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  Moi: "success",
  PhanCong: "neutral",
  DangLam: "warning",
  DaGiao: "neutral",
}

const COLUMNS: { key: Order["status"]; label: string }[] = [
  { key: "Moi", label: "Mới" },
  { key: "PhanCong", label: "Phân công thợ cắm" },
  { key: "DangLam", label: "Đang làm" },
  { key: "DaGiao", label: "Đã giao" },
]

const FIELDS_ORDER: { key: string; label: string; type: "text" | "readonly"; editable: boolean; value: string }[] = [
  { key: "customer", label: "Khách hàng", type: "text", editable: true, value: "" },
  { key: "product", label: "Sản phẩm", type: "text", editable: false, value: "" },
  { key: "qty", label: "Số lượng", type: "text", editable: true, value: "" },
  { key: "message", label: "Lời nhắn thiệp", type: "text", editable: true, value: "" },
  { key: "price", label: "Tổng tiền", type: "readonly", editable: false, value: "" },
]

export default function DonHangPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<"create" | "quote" | "running" | "approved" | "saved" | "kanban">("create")
  const [jobPhase, setJobPhase] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<"PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED" | null>(null)
  const [fields, setFields] = useState<typeof FIELDS_ORDER>(FIELDS_ORDER.map((f) => ({ ...f, value: "" })))
  const [judgment, setJudgment] = useState<"safe" | "warning" | "blocked">("safe")
  const [saved, setSaved] = useState(false)

  function goRunning() {
    setPhase("running")
    setJobStatus("PENDING")
    setJobPhase("QUOTING")
    setTimeout(() => { setJobStatus("PROCESSING"); setJobPhase("PRICING") }, 1000)
    setTimeout(() => { setJobStatus("COMPLETED") }, 2500)
    setTimeout(() => setPhase("quote"), 3000)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-[18px] py-4">
        <div>
          <div className="text-xs text-text-muted">M10</div>
          <div className="text-[17px] font-extrabold text-primary">Đơn hàng & Vận hành</div>
        </div>
        <Button variant="ghost" onClick={() => router.push("/")} className="flex items-center gap-1.5">
          <ArrowLeft size={16} strokeWidth={2} /> Quay về Trang chủ
        </Button>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto p-[18px]">
        {phase === "create" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            <div className="text-center"><div className="text-[17px] font-extrabold">① Tạo đơn</div><div className="mt-1 text-[13px] text-text-muted">Chọn khách hàng + sản phẩm + ngày giao + lời nhắn thiệp</div></div>
            <Card className="w-full max-w-md flex flex-col gap-3">
              {fields.map((f) => (
                <div key={f.key} className="flex flex-col gap-1">
                  <label className="text-[12px] font-bold">{f.label}</label>
                  {f.type === "text" ? (
                    <input type="text" defaultValue={f.value}
                      onChange={(e) => setFields((p) => p.map((x) => (x.key === f.key ? { ...x, value: e.target.value } : x)))}
                      className="h-10 rounded-lg border-[1.5px] border-border bg-surface px-2.5 text-[13px] outline-none focus:border-primary" />
                  ) : (
                    <div className="h-10 flex items-center px-2.5 text-[13px] bg-surface rounded-lg">{f.value || "—"}</div>
                  )}
                </div>
              ))}
            </Card>
            <Button onClick={goRunning} className="h-[50px] px-8">
              <ClipboardList size={18} strokeWidth={2} className="mr-2" /> Tạo phiếu chào giá
            </Button>
          </div>
        )}

        {phase === "running" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5">
            <div className="text-center"><div className="text-[17px] font-extrabold">③ Đang xử lý</div><div className="mt-1 text-[13px] text-text-muted">{jobPhase ?? "Đang chuẩn bị..."}</div></div>
            <div className="w-full max-w-md">
              <div className="rounded-xl bg-surface-alt p-4 text-[12px] text-text-muted flex items-start gap-2">
                <AlertTriangle size={16} strokeWidth={1.8} className="mt-0.5 flex-shrink-0 text-primary" />
                Job chạy ở máy chủ — không mất khi rời trang
              </div>
            </div>
          </div>
        )}

        {phase === "quote" && (
          <div className="flex flex-col items-center gap-5">
            <div className="flex items-center justify-between w-full max-w-3xl">
              <div><div className="text-xs text-text-muted">④ Thẻ phiếu chào giá</div><div className="text-[17px] font-extrabold">Phiếu chào giá</div></div>
              <Badge tone={saved ? "success" : judgment === "blocked" ? "danger" : judgment === "warning" ? "warning" : "neutral"}>
                {saved ? "Đã lưu nháp" : judgment === "blocked" ? "Bị chặn" : judgment === "warning" ? "Cảnh báo" : "Mới"}
              </Badge>
            </div>

            <Card className="w-full max-w-3xl p-5">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-[13px]"><span className="text-text-muted">Khách hàng</span><span className="font-semibold">{fields.find((f) => f.key === "customer")?.value || "—"}</span></div>
                <div className="flex justify-between text-[13px]"><span className="text-text-muted">Sản phẩm</span><span className="font-semibold">{fields.find((f) => f.key === "product")?.value || "—"}</span></div>
                <div className="flex justify-between text-[13px]"><span className="text-text-muted">Số lượng</span><span className="font-semibold">{fields.find((f) => f.key === "qty")?.value || "—"}</span></div>
                <div className="flex justify-between text-[13px]"><span className="text-text-muted">Lời nhắn</span><span className="font-semibold">{fields.find((f) => f.key === "message")?.value || "—"}</span></div>
                <div className="border-t border-border pt-3 flex justify-between text-[15px] font-extrabold"><span>Tổng tiền</span><span>{fields.find((f) => f.key === "price")?.value || "—"}</span></div>
              </div>
              <div className="mt-3 rounded-lg bg-surface-alt p-3 text-center text-[12px] text-text-muted">Xem trước bản in A6</div>
            </Card>

            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }}>Lưu nháp</Button>
              {judgment !== "blocked" && (
                <>
                  <Button variant="ghost" onClick={() => setJudgment("blocked")}>Từ chối</Button>
                  <Button onClick={() => { setSaved(true); setJudgment("safe"); setSaved(false); setPhase("kanban") }}>Duyệt (xác nhận đơn chính thức)</Button>
                </>
              )}
            </div>
          </div>
        )}

        {phase === "kanban" && (
          <div className="flex flex-col gap-5">
            <div className="text-center"><div className="text-[17px] font-extrabold">Bảng điều phối</div><div className="mt-1 text-[13px] text-text-muted">Kéo thẻ đơn sang cột kế, hoặc phân công thợ cắm trực tiếp</div></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {COLUMNS.map((col) => (
                <div key={col.key} className="flex flex-col gap-2">
                  <div className="text-[13px] font-bold px-1">{col.label}</div>
                  {MOCK_ORDERS.filter((o) => o.status === col.key).map((o) => (
                    <Card key={o.id} className="p-3">
                      <div className="text-[13px] font-bold">{o.id}</div>
                      <div className="text-[11px] text-text-muted">{o.customer} · {o.product}</div>
                      <div className="text-[11px] mt-1">SLA: {o.sla}</div>
                      {o.staff && <div className="text-[11px]">Thợ: {o.staff}</div>}
                      {col.key === "Moi" && (
                        <input type="text" placeholder="Gán thợ cắm"
                          onChange={(e) => {
                            const target = MOCK_ORDERS.find((x) => x.id === o.id)
                            if (target && e.target.value) target.staff = e.target.value
                          }}
                          className="mt-2 h-8 w-full rounded border border-border px-2 text-[12px] outline-none focus:border-primary" />
                      )}
                    </Card>
                  ))}
                </div>
              ))}
            </div>
            <div className="text-[12px] text-text-muted">Đơn quá giờ SLA → thẻ tự chuyển viền đỏ, nổi lên đầu cột. In phiếu đơn: nút riêng, không cần duyệt.</div>
          </div>
        )}
      </div>
    </div>
  )
}
