"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, CheckCircle2, Download, XCircle, Edit, Eye, RefreshCw, Folder, Camera, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  TabActionHeader,
  type TabItem,
  type TabAction,
  type TabOverflowAction,
} from "@/components/ui/tab-header"

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

type PendingProductCopy = {
  id: string
  analysis_id: string
  product_id: string | null
  raw: {
    suggested_name: string
    suggested_description: string
    suggested_tags: string[]
    suggested_occasions: string[]
    suggested_price_segment: string
  }
  edited: {
    suggested_name?: string
    suggested_description?: string
    suggested_tags?: string[]
    suggested_occasions?: string[]
    suggested_price_segment?: string
  } | null
  created_at: string
}

function dinhDangGio(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("vi-VN")
}

export default function DuyetPage() {
  const router = useRouter()
  const [analyses, setAnalyses] = useState<PendingAnalysis[] | null>(null)
  const [optimizations, setOptimizations] = useState<PendingOptimization[] | null>(null)
  const [productCopies, setProductCopies] = useState<PendingProductCopy[] | null>(null)
  const [activeTab, setActiveTab] = useState<"analyses" | "optimizations" | "productCopies">("analyses")
  const [khongCoQuyenNao, setKhongCoQuyenNao] = useState(false)
  const [loi, setLoi] = useState<string | null>(null)
  const [dangDuyet, setDangDuyet] = useState<string | null>(null)

  const napLai = useCallback(async () => {
    const [resAnalyses, resOptimizations, resProductCopies] = await Promise.all([
      fetch("/api/v1/vision/analyses?limit=20"),
      fetch("/api/v1/media/optimizations?limit=20"),
      fetch("/api/v1/product-copies?approval_state=PENDING&limit=20"),
    ])

    if (resAnalyses.status === 401 || resOptimizations.status === 401 || resProductCopies.status === 401) {
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

    if (resProductCopies.ok) {
      const data = (await resProductCopies.json()) as { data: PendingProductCopy[] }
      setProductCopies(data.data)
    } else if (resProductCopies.status === 403) {
      setProductCopies(null)
    }

    setKhongCoQuyenNao(
      resAnalyses.status === 403 &&
      resOptimizations.status === 403 &&
      resProductCopies.status === 403
    )
  }, [router])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        await napLai()
      } catch (e) {
        if (!cancelled) setLoi(e instanceof Error ? e.message : "Không tải được hàng chờ duyệt")
      }
    }
    load()
    return () => { cancelled = true }
  }, [napLai])

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

  async function duyetProductCopy(id: string) {
    setDangDuyet(id)
    try {
      const res = await fetch(`/api/v1/product-copies/${id}/approve`, { method: "POST" })
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

  async function boProductCopy(id: string) {
    setLoi(null)
    setDangDuyet(id)
    try {
      const res = await fetch(`/api/v1/product-copies/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Không phù hợp" }),
      })
      if (!res.ok) throw new Error(`Không bỏ được dữ liệu bán hàng (${res.status})`)
      await napLai()
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không bỏ được dữ liệu bán hàng")
    } finally {
      setDangDuyet(null)
    }
  }

  const dangTai = analyses === null && optimizations === null && productCopies === null && !khongCoQuyenNao

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
            <div className="text-xs text-text-muted">Cần năng lực H3 (duyệt phân tích), I2 (duyệt ảnh tối ưu) hoặc H6 (duyệt dữ liệu bán hàng).</div>
          </Card>
        )}

        {/* Standardized SaaS Tab Action Header */}
        <TabActionHeader
          tabs={[
            {
              id: "analyses",
              label: "Phân tích ảnh (M01a)",
              icon: CheckCircle2,
              badge: analyses?.length ?? 0,
              badgeTone: "accent",
            },
            {
              id: "optimizations",
              label: "Ảnh tối ưu (M04a)",
              icon: AlertTriangle,
              badge: optimizations?.length ?? 0,
              badgeTone: "warning",
            },
            {
              id: "productCopies",
              label: "Dữ liệu bán hàng (M01b)",
              icon: Edit,
              badge: productCopies?.length ?? 0,
              badgeTone: "success",
            },
          ]}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as "analyses" | "optimizations" | "productCopies")}
          primaryActions={[
            {
              id: "refresh-queue",
              label: "Làm mới hàng đợi",
              icon: RefreshCw,
              variant: "outline",
              onClick: napLai,
            },
          ]}
          overflowActions={[
            {
              id: "export-analyses",
              label: "Tải toàn bộ lượt phân tích (CSV)",
              icon: Download,
              onClick: () => {
                window.location.href = "/api/v1/vision/analyses/export"
              },
            },
            {
              id: "goto-kho",
              label: "Chuyển tới Kho Dữ Liệu",
              icon: Folder,
              onClick: () => router.push("/tai-anh?tab=storage" as any),
            },
            {
              id: "goto-tai-anh",
              label: "Chuyển tới Tải ảnh",
              icon: Camera,
              onClick: () => router.push("/tai-anh"),
            },
          ]}
        />

        {activeTab === "analyses" && analyses !== null && (
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

        {activeTab === "optimizations" && optimizations !== null && (
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

        {activeTab === "productCopies" && productCopies !== null && (
          <Card className="flex flex-col gap-3 p-[18px]">
            <div className="text-[14.5px] font-bold">Dữ liệu bán hàng chờ duyệt ({productCopies.length})</div>
            {productCopies.length === 0 ? (
              <div className="py-2 text-center text-[13px] text-text-muted">Không có mục nào chờ duyệt.</div>
            ) : (
              productCopies.map((pc) => (
                <div key={pc.id} className="flex flex-col gap-2">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <div className="flex items-center gap-3 cursor-pointer hover:bg-surface-alt/50 rounded-lg p-1.5" onClick={() => router.push(`/san-pham/${pc.product_id ?? "unknown"}/tinh-nang/product-copy/${pc.id}?return=${encodeURIComponent(window.location.pathname)}` as any)}>
                    <CheckCircle2 size={18} strokeWidth={1.8} className="flex-shrink-0 text-secondary-text" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-semibold">{pc.raw.suggested_name}</div>
                      <div className="truncate text-xs text-text-muted">
                        Phân tích: {pc.analysis_id.slice(0, 8)} · {dinhDangGio(pc.created_at)}
                        {pc.product_id && ` · SP: ${pc.product_id.slice(0, 8)}`}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={dangDuyet === pc.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        router.push(`/san-pham/${pc.product_id ?? "unknown"}/tinh-nang/product-copy/${pc.id}?return=${encodeURIComponent(window.location.pathname)}` as any)
                      }}
                      className="flex-shrink-0"
                      aria-label="Xem chi tiết"
                      title="Xem chi tiết"
                    >
                      <Eye size={18} strokeWidth={1.8} />
                    </Button>
                    <button
                      type="button"
                      disabled={dangDuyet === pc.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        boProductCopy(pc.id)
                      }}
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-surface-alt disabled:opacity-40"
                      aria-label="Từ chối dữ liệu này"
                      title="Từ chối dữ liệu này"
                    >
                      <XCircle size={18} strokeWidth={1.8} />
                    </button>
                    <Button
                      size="sm"
                      disabled={dangDuyet === pc.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        duyetProductCopy(pc.id)
                      }}
                    >
                      {dangDuyet === pc.id ? "Đang duyệt…" : "Duyệt"}
                    </Button>
                  </div>
                  {pc.edited && (
                    <div className="ml-6 flex items-center gap-2 text-[11px] text-text-muted">
                      <Edit size={12} strokeWidth={1.8} />
                      <span>Đã chỉnh sửa: {Object.keys(pc.edited).join(", ")}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </Card>
        )}
      </div>
    </div>
  )
}