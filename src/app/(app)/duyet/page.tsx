"use client"

// Hàng chờ duyệt — trước đây là màn "Sắp có" (nợ #48, TECHNICAL_DEBT.md:
// "vision.analyses và media.optimizations chỉ có POST, chưa có GET liệt
// kê"). Nay nối hai endpoint đọc mới (list-pending-analyses.ts,
// list-pending-optimizations.ts) cộng hai endpoint duyệt đã có sẵn.
//
// Một người có thể chỉ có H3 hoặc chỉ có I2 (không nhất thiết cả hai) —
// gọi cả hai endpoint, 403 ở endpoint nào thì ẩn hẳn khối đó thay vì báo lỗi.

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, CheckCircle2, Download, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type PendingAnalysis = {
  id: string
  asset_id: string
  provider: string
  created_at: string
}

type PendingOptimization = {
  job_id: string
  result: string | null
  completed_at: string | null
  requires_warning: boolean
}

function dinhDangGio(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("vi-VN")
}

export default function DuyetPage() {
  const router = useRouter()
  const [analyses, setAnalyses] = useState<PendingAnalysis[] | null>(null)
  const [optimizations, setOptimizations] = useState<PendingOptimization[] | null>(null)
  const [khongCoQuyenNao, setKhongCoQuyenNao] = useState(false)
  const [loi, setLoi] = useState<string | null>(null)
  const [dangDuyet, setDangDuyet] = useState<string | null>(null)

  async function napLai() {
    const [resAnalyses, resOptimizations] = await Promise.all([
      fetch("/api/v1/vision/analyses?limit=20"),
      fetch("/api/v1/media/optimizations?limit=20"),
    ])

    if (resAnalyses.status === 401 || resOptimizations.status === 401) {
      router.push("/dang-nhap")
      return
    }

    if (resAnalyses.ok) {
      const data = (await resAnalyses.json()) as { data: PendingAnalysis[] }
      setAnalyses(data.data)
    } else if (resAnalyses.status === 403) {
      setAnalyses(null)
    }

    if (resOptimizations.ok) {
      const data = (await resOptimizations.json()) as { data: PendingOptimization[] }
      setOptimizations(data.data)
    } else if (resOptimizations.status === 403) {
      setOptimizations(null)
    }

    setKhongCoQuyenNao(resAnalyses.status === 403 && resOptimizations.status === 403)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    napLai().catch((e) => setLoi(e instanceof Error ? e.message : "Không tải được hàng chờ duyệt"))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function duyetPhanTich(id: string) {
    setDangDuyet(id)
    try {
      const res = await fetch(`/api/v1/vision/analyses/${id}/approve`, { method: "POST" })
      if (!res.ok) throw new Error(`Duyệt thất bại (${res.status})`)
      await napLai()
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Duyệt thất bại")
    } finally {
      setDangDuyet(null)
    }
  }

  async function duyetToiUu(jobId: string, canhBaoTruoc: boolean) {
    if (canhBaoTruoc && !window.confirm("Ảnh này ở mức CẢNH BÁO — xác nhận vẫn muốn duyệt?")) {
      return
    }
    setDangDuyet(jobId)
    try {
      const res = await fetch(`/api/v1/media/optimizations/${jobId}/approve`, { method: "POST" })
      if (!res.ok) throw new Error(`Duyệt thất bại (${res.status})`)
      await napLai()
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Duyệt thất bại")
    } finally {
      setDangDuyet(null)
    }
  }

  async function boPhanTich(id: string) {
    setLoi(null)
    setDangDuyet(id)
    try {
      const res = await fetch(`/api/v1/vision/analyses/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ly_do: null }),
      })
      if (!res.ok) throw new Error(`Không bỏ được kết quả (${res.status})`)
      await napLai()
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không bỏ được kết quả")
    } finally {
      setDangDuyet(null)
    }
  }

  const dangTai = analyses === null && optimizations === null && !khongCoQuyenNao

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center border-b border-border bg-surface px-[18px] py-4">
        <div className="text-[17px] font-extrabold text-primary">Hàng đợi duyệt</div>
      </div>

      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-4">
        {loi && (
          <div className="rounded-xl border-[1.5px] border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700">
            {loi}
          </div>
        )}

        {dangTai && <div className="py-8 text-center text-[13px] text-text-muted">Đang tải…</div>}

        {khongCoQuyenNao && (
          <Card className="flex flex-col items-center gap-2 p-8 text-center">
            <div className="text-[13.5px] font-semibold">Tài khoản này chưa có quyền duyệt</div>
            <div className="text-xs text-text-muted">Cần năng lực H3 (duyệt phân tích) hoặc I2 (duyệt ảnh tối ưu).</div>
          </Card>
        )}

        {analyses !== null && (
          <Card className="flex flex-col gap-3 p-[18px]">
            <div className="text-[14.5px] font-bold">Phân tích ảnh chờ duyệt ({analyses.length})</div>
            {analyses.length === 0 ? (
              <div className="py-2 text-center text-[13px] text-text-muted">Không có mục nào chờ duyệt.</div>
            ) : (
              analyses.map((a) => (
                <div key={a.id} className="flex items-center gap-3">
                  <CheckCircle2 size={18} strokeWidth={1.8} className="flex-shrink-0 text-secondary-text" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold">Lượt phân tích #{a.id.slice(0, 8)}</div>
                    <div className="truncate text-xs text-text-muted">
                      {a.provider} · {dinhDangGio(a.created_at)}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={dangDuyet === a.id}
                    onClick={() => boPhanTich(a.id)}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-surface-alt disabled:opacity-40"
                    aria-label="Bỏ kết quả này"
                    title="Bỏ kết quả này"
                  >
                    <XCircle size={18} strokeWidth={1.8} />
                  </button>
                  <Button
                    size="sm"
                    disabled={dangDuyet === a.id}
                    onClick={() => duyetPhanTich(a.id)}
                  >
                    {dangDuyet === a.id ? "Đang duyệt…" : "Duyệt"}
                  </Button>
                </div>
              ))
            )}

            {/* Cùng năng lực H3 với danh sách phía trên, nên hiện cùng chỗ.
                Tệp CSV mã hoá UTF-8 kèm BOM — Excel mở thẳng, không cần
                bước nhập dữ liệu nào.

                Dùng `<a>` chứ không `<Link>`: đây là một lượt TẢI TỆP từ
                route API, không phải điều hướng trang. `<Link>` chuyển hướng
                phía client nên trình duyệt không bao giờ thấy
                `content-disposition: attachment`, và tệp không được lưu. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/api/v1/vision/analyses/export"
              download
              className="flex items-center justify-center gap-2 rounded-xl border-[1.5px] border-border px-3.5 py-2.5 text-[12.5px] font-semibold text-text-muted hover:bg-surface-alt"
            >
              <Download size={15} strokeWidth={1.9} />
              Tải toàn bộ lượt phân tích để đối soát
            </a>
          </Card>
        )}

        {optimizations !== null && (
          <Card className="flex flex-col gap-3 p-[18px]">
            <div className="text-[14.5px] font-bold">Ảnh tối ưu chờ duyệt ({optimizations.length})</div>
            {optimizations.length === 0 ? (
              <div className="py-2 text-center text-[13px] text-text-muted">Không có mục nào chờ duyệt.</div>
            ) : (
              optimizations.map((o) => (
                <div key={o.job_id} className="flex items-center gap-3">
                  {o.requires_warning ? (
                    <AlertTriangle size={18} strokeWidth={1.9} className="flex-shrink-0 text-warning" />
                  ) : (
                    <CheckCircle2 size={18} strokeWidth={1.8} className="flex-shrink-0 text-secondary-text" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold">Job #{o.job_id.slice(0, 8)}</div>
                    <div className="truncate text-xs text-text-muted">
                      {o.result ?? "—"} · {dinhDangGio(o.completed_at)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={o.requires_warning ? "warning" : "primary"}
                    disabled={dangDuyet === o.job_id}
                    onClick={() => duyetToiUu(o.job_id, o.requires_warning)}
                  >
                    {dangDuyet === o.job_id ? "Đang duyệt…" : "Duyệt"}
                  </Button>
                </div>
              ))
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
