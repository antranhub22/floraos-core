"use client"

import { AlertTriangle, CheckCircle2, Download, Eye, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"

export type PendingAnalysis = {
  id: string
  asset_id: string
  provider: string
  created_at: string
}

export type PendingOptimization = {
  job_id: string
  result: string | null
  completed_at: string | null
  requires_warning: boolean
}

export type PendingProductCopy = {
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

export function AnalysesApprovalPanel({
  analyses,
  dangDuyet,
  onApprove,
  onReject,
  onNavigateUpload,
}: {
  analyses: PendingAnalysis[]
  dangDuyet: string | null
  onApprove: (id: string) => Promise<void>
  onReject: (id: string) => Promise<void>
  onNavigateUpload: () => void
}) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="text-body font-bold">Phân tích ảnh chờ duyệt ({analyses.length})</div>
      {analyses.length === 0 ? (
        <EmptyState
          title="Không có phân tích nào chờ duyệt"
          reason="Tất cả các lượt phân tích ảnh hoa đã được duyệt hoặc xử lý."
          action={{
            label: "Tải ảnh mới để phân tích",
            onClick: onNavigateUpload,
          }}
        />
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {analyses.map((a) => (
            <div key={a.id} className="flex min-h-11 items-center justify-between gap-3 py-2.5">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <CheckCircle2 size={18} strokeWidth={1.8} className="flex-shrink-0 text-secondary" />
                <div className="min-w-0">
                  <div className="truncate text-body-sm font-semibold">Lượt phân tích #{a.id.slice(0, 8)}</div>
                  <div className="truncate text-caption text-text-muted">
                    {a.provider} · {dinhDangGio(a.created_at)}
                  </div>
                </div>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <Button
                  size="sm"
                  disabled={dangDuyet === a.id}
                  onClick={() => onApprove(a.id)}
                >
                  {dangDuyet === a.id ? "Đang duyệt…" : "Duyệt"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={dangDuyet === a.id}
                  onClick={() => onReject(a.id)}
                >
                  Không đạt
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {analyses.length > 0 && (
        <a
          href="/api/v1/vision/analyses/export"
          download
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-3.5 py-2 text-caption font-semibold text-text-muted hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Download size={15} strokeWidth={1.9} />
          Tải toàn bộ lượt phân tích để đối soát (CSV)
        </a>
      )}
    </Card>
  )
}

export function OptimizationsApprovalPanel({
  optimizations,
  dangDuyet,
  onApprove,
  onNavigateStudio,
}: {
  optimizations: PendingOptimization[]
  dangDuyet: string | null
  onApprove: (jobId: string, requiresWarning: boolean) => Promise<void>
  onNavigateStudio: () => void
}) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="text-body font-bold">Ảnh tối ưu chờ duyệt ({optimizations.length})</div>
      {optimizations.length === 0 ? (
        <EmptyState
          title="Không có ảnh tối ưu nào chờ duyệt"
          reason="Không có tác vụ xử lý tối ưu ảnh nào đang chờ duyệt."
          action={{
            label: "Tới Creative Studio",
            onClick: onNavigateStudio,
          }}
        />
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {optimizations.map((o) => (
            <div key={o.job_id} className="flex min-h-11 items-center justify-between gap-3 py-2.5">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                {o.requires_warning ? (
                  <AlertTriangle size={18} strokeWidth={1.9} className="flex-shrink-0 text-warning" />
                ) : (
                  <CheckCircle2 size={18} strokeWidth={1.8} className="flex-shrink-0 text-secondary" />
                )}
                <div className="min-w-0">
                  <div className="truncate text-body-sm font-semibold">Job #{o.job_id.slice(0, 8)}</div>
                  <div className="truncate text-caption text-text-muted">
                    {o.result ?? "—"} · {dinhDangGio(o.completed_at)}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant={o.requires_warning ? "warning" : "primary"}
                disabled={dangDuyet === o.job_id}
                onClick={() => onApprove(o.job_id, o.requires_warning)}
              >
                {dangDuyet === o.job_id ? "Đang duyệt…" : "Duyệt"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export function ProductCopiesApprovalPanel({
  productCopies,
  dangDuyet,
  onApprove,
  onReject,
  onViewDetail,
  onNavigateCreate,
}: {
  productCopies: PendingProductCopy[]
  dangDuyet: string | null
  onApprove: (id: string, name: string) => Promise<void>
  onReject: (id: string, name: string) => Promise<void>
  onViewDetail: (productId: string | null, id: string) => void
  onNavigateCreate: () => void
}) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="text-body font-bold">Dữ liệu bán hàng chờ duyệt ({productCopies.length})</div>
      {productCopies.length === 0 ? (
        <EmptyState
          title="Không có dữ liệu bán hàng nào chờ duyệt"
          reason="Mọi nội dung mô tả bán hàng đã được duyệt hoặc chuyển giao."
          action={{
            label: "Tạo nội dung bán hàng",
            onClick: onNavigateCreate,
          }}
        />
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {productCopies.map((pc) => (
            <div key={pc.id} className="flex flex-col gap-1 py-2.5">
              <div className="flex min-h-11 items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onViewDetail(pc.product_id, pc.id)}
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left hover:opacity-80 focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <CheckCircle2 size={18} strokeWidth={1.8} className="flex-shrink-0 text-secondary" />
                  <div className="min-w-0">
                    <div className="truncate text-body-sm font-semibold">{pc.raw.suggested_name}</div>
                    <div className="truncate text-caption text-text-muted">
                      Phân tích: #{pc.analysis_id.slice(0, 8)} · {dinhDangGio(pc.created_at)}
                      {pc.product_id && ` · SP: #${pc.product_id.slice(0, 8)}`}
                    </div>
                  </div>
                </button>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetail(pc.product_id, pc.id)}
                    aria-label="Xem chi tiết"
                    title="Xem chi tiết"
                  >
                    <Eye size={16} aria-hidden="true" />
                  </Button>
                  <Button
                    size="sm"
                    disabled={dangDuyet === pc.id}
                    onClick={() => onApprove(pc.id, pc.raw.suggested_name)}
                  >
                    {dangDuyet === pc.id ? "Đang duyệt…" : "Duyệt"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={dangDuyet === pc.id}
                    onClick={() => onReject(pc.id, pc.raw.suggested_name)}
                  >
                    Không đạt
                  </Button>
                </div>
              </div>
              {pc.edited && (
                <div className="pl-7 text-caption text-text-muted">
                  Đã chỉnh sửa: {Object.keys(pc.edited).join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
