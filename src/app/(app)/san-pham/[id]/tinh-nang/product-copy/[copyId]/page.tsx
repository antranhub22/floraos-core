"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Save, CheckCircle2, XCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useSession } from "@/lib/session"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type ProductCopy = {
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
  approval_state: "PENDING" | "APPROVED" | "REJECTED"
  approved_by: string | null
  approved_at: string | null
  created_at: string
}

type ProductCopyField =
  | "suggested_name"
  | "suggested_description"
  | "suggested_tags"
  | "suggested_occasions"
  | "suggested_price_segment"

const FIELD_LABELS: Record<ProductCopyField, string> = {
  suggested_name: "Tên sản phẩm",
  suggested_description: "Mô tả",
  suggested_tags: "Thẻ (tags)",
  suggested_occasions: "Dịp phù hợp",
  suggested_price_segment: "Phân khúc giá",
}

const PRICE_SEGMENTS = ["budget", "standard", "premium", "luxury"] as const

export default function ProductCopyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { capabilities } = useSession()

  const productId = params.id as string
  const copyId = params.copyId as string
  const returnTo = searchParams.get("return") ?? `/san-pham/${productId}/tinh-nang`

  const [copy, setCopy] = useState<ProductCopy | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Local edit state
  const [localEdited, setLocalEdited] = useState<Partial<Record<ProductCopyField, string | string[]>>>({})

  useEffect(() => {
    async function fetchCopy() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/v1/product-copies/${copyId}`)
        if (res.status === 401) {
          router.push("/dang-nhap")
          return
        }
        if (!res.ok) throw new Error(`Không tải được dữ liệu (${res.status})`)
        const data = await res.json()
        setCopy(data)
        // Initialize local edit state from existing edited or raw
        setLocalEdited(data.edited ?? data.raw)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Không tải được dữ liệu")
      } finally {
        setLoading(false)
      }
    }
    fetchCopy()
  }, [copyId, router])

  const canEdit = capabilities.includes("H5")
  const canApprove = capabilities.includes("H6")
  const isPending = copy?.approval_state === "PENDING"

  function handleFieldChange(field: ProductCopyField, value: string | string[]) {
    setLocalEdited((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!canEdit) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/product-copies/${copyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ edited: localEdited }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }))
        throw new Error(err.message ?? "Lưu thất bại")
      }
      const data = await res.json()
      setCopy(data)
      setLocalEdited(data.edited ?? data.raw)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lưu thất bại")
    } finally {
      setSaving(false)
    }
  }

  async function handleApprove() {
    if (!canApprove) return
    if (!window.confirm("Xác nhận duyệt dữ liệu bán hàng này? Sẽ tạo/cập nhật sản phẩm trong Product Master.")) return
    setActionLoading("approve")
    try {
      const res = await fetch(`/api/v1/product-copies/${copyId}/approve`, { method: "POST" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }))
        throw new Error(err.message ?? "Duyệt thất bại")
      }
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Duyệt thất bại")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject() {
    if (!canApprove) return
    const reason = prompt("Lý do từ chối:")
    if (!reason) return
    setActionLoading("reject")
    try {
      const res = await fetch(`/api/v1/product-copies/${copyId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }))
        throw new Error(err.message ?? "Từ chối thất bại")
      }
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Từ chối thất bại")
    } finally {
      setActionLoading(null)
    }
  }

  function getEffectiveValue(field: ProductCopyField): string | string[] {
    const val = localEdited[field] ?? copy?.raw[field]
    return val ?? ""
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-text-muted">Đang tải dữ liệu bán hàng…</p>
        </div>
      </div>
    )
  }

  if (error && !copy) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-bg">
          <AlertCircle size={32} strokeWidth={1.8} className="text-danger" />
        </div>
        <h2 className="text-[17px] font-bold">Không tải được dữ liệu</h2>
        <p className="text-text-muted max-w-xs">{error}</p>
        <Button variant="secondary" onClick={() => router.refresh()}>
          <RefreshCw size={15} strokeWidth={2} /> Thử lại
        </Button>
      </div>
    )
  }

  if (!copy) return null

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-[18px] py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                router.push(returnTo as any)
              }}
            >
              <ArrowLeft size={20} strokeWidth={2} />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <div className="text-[17px] font-extrabold text-primary">
                  Dữ liệu bán hàng #{copy.id.slice(0, 8)}
                </div>
                <Badge
                  tone={
                    copy.approval_state === "APPROVED"
                      ? "success"
                      : copy.approval_state === "REJECTED"
                      ? "danger"
                      : "warning"
                  }
                  className="text-[10.5px]"
                >
                  {copy.approval_state === "APPROVED"
                    ? "Đã duyệt"
                    : copy.approval_state === "REJECTED"
                    ? "Đã từ chối"
                    : "Chờ duyệt"}
                </Badge>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[12.5px] text-text-muted">
                <span>Phân tích: <code className="font-mono">{copy.analysis_id.slice(0, 8)}…</code></span>
                {copy.product_id && (
                  <>
                    <span className="flex h-4 w-[1px] bg-border" />
                    <span>Sản phẩm: <code className="font-mono">{copy.product_id.slice(0, 8)}…</code></span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.refresh()}>
              <RefreshCw size={18} strokeWidth={2} className="text-text-muted" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 rounded-xl border-[1.5px] border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700">
              {error}
            </div>
          )}

          {/* Raw vs Edited Comparison */}
          <Card className="mb-4">
            <div className="border-b border-border px-4 py-3">
              <h3 className="font-bold text-[14.5px]">So sánh Raw ↔ Edited</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Field Name */}
                <div className="font-medium text-text-muted">Trường</div>
                <div className="font-medium text-text-muted text-center">Raw (AI)</div>
                <div className="font-medium text-text-muted text-center">Edited (User)</div>
              </div>
              <div className="mt-2 space-y-3">
                {([
                  "suggested_name",
                  "suggested_description",
                  "suggested_tags",
                  "suggested_occasions",
                  "suggested_price_segment",
                ] as ProductCopyField[]).map((field) => {
                  const rawValue = copy.raw[field]
                  const editedValue = localEdited[field] ?? copy.edited?.[field]
                  const isEdited = editedValue !== undefined && editedValue !== rawValue

                  return (
                    <div key={field} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                      <div className="font-medium text-[13px] text-text-muted">
                        {FIELD_LABELS[field]}
                      </div>
                      <div className="text-center text-[13px]">
                        {Array.isArray(rawValue) ? (
                          <span className="flex flex-wrap justify-center gap-1">
                            {rawValue.map((t, i) => (
                              <Badge key={i} tone="neutral" className="text-[10px] h-4 px-1.5">
                                {t}
                              </Badge>
                            ))}
                          </span>
                        ) : (
                          <code className="font-mono text-[12px] bg-surface-alt px-2 py-1 rounded">
                            {String(rawValue)}
                          </code>
                        )}
                      </div>
                      <div className="text-center">
                        {field === "suggested_price_segment" ? (
                          <select
                            value={String(getEffectiveValue(field))}
                            onChange={(e) => handleFieldChange(field, e.target.value)}
                            disabled={!canEdit || !isPending}
                            className="w-full max-w-xs mx-auto h-9 rounded-xl border-[1.5px] border-border bg-surface pl-3 pr-8 text-sm outline-none focus:border-primary disabled:opacity-50"
                          >
                            {PRICE_SEGMENTS.map((seg) => (
                              <option key={seg} value={seg}>
                                {seg.charAt(0).toUpperCase() + seg.slice(1)}
                              </option>
                            ))}
                          </select>
                        ) : Array.isArray(getEffectiveValue(field)) ? (
                          <div className="flex flex-wrap justify-center gap-1">
                            {String(getEffectiveValue(field))
                              .split(",")
                              .map((t) => t.trim())
                              .filter(Boolean)
                              .map((tag, i) => (
                                <Badge
                                  key={i}
                                  tone={isEdited ? "accent" : "neutral"}
                                  className="text-[10px] h-4 px-1.5"
                                >
                                  {tag}
                                </Badge>
                              ))}
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={String(getEffectiveValue(field))}
                            onChange={(e) => handleFieldChange(field, e.target.value)}
                            disabled={!canEdit || !isPending}
                            className="w-full max-w-xs mx-auto h-9 rounded-xl border-[1.5px] border-border bg-surface pl-3 pr-3 text-sm outline-none focus:border-primary disabled:opacity-50"
                          />
                        )}
                        {isEdited && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="ml-1.5 text-[10px] text-primary font-medium">●</span>
                              </TooltipTrigger>
                              <TooltipContent side="top" align="center" className="p-2 text-[10px]">
                                Đã chỉnh sửa
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>

          {/* Actions */}
          <Card className="mb-4">
            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                {isPending && canEdit && (
                  <Button onClick={handleSave} disabled={saving} className="flex-1">
                    {saving ? "Đang lưu…" : "Lưu chỉnh sửa"}
                    <Save size={16} strokeWidth={2} className="ml-2" />
                  </Button>
                )}
                {isPending && canApprove && (
                  <>
                    <Button
                      variant="secondary"
                      onClick={handleReject}
                      disabled={actionLoading === "reject"}
                      className="flex-1"
                    >
                      {actionLoading === "reject" ? "Đang từ chối…" : "Từ chối"}
                      <XCircle size={16} strokeWidth={2} className="ml-2" />
                    </Button>
                    <Button
                      onClick={handleApprove}
                      disabled={actionLoading === "approve"}
                      className="flex-1"
                    >
                      {actionLoading === "approve" ? "Đang duyệt…" : "Duyệt & Ghi Product Master"}
                      <CheckCircle2 size={16} strokeWidth={2} className="ml-2" />
                    </Button>
                  </>
                )}
                {!isPending && (
                  <Badge
                    tone={
                      copy.approval_state === "APPROVED" ? "success" : "danger"
                    }
                    className="text-[10.5px] flex-1 text-center"
                  >
                    {copy.approval_state === "APPROVED"
                      ? `Đã duyệt bởi ${copy.approved_by?.slice(0, 8)} lúc ${new Date(copy.approved_at!).toLocaleString("vi-VN")}`
                      : `Đã từ chối`}
                  </Badge>
                )}
              </div>
            </div>
          </Card>

          {/* Metadata */}
          <Card>
            <div className="border-b border-border px-4 py-3">
              <h3 className="font-bold text-[14.5px]">Thông tin</h3>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4 text-[13px]">
              <div>
                <div className="text-text-muted">Trạng thái duyệt</div>
                <div className="font-medium capitalize">{copy.approval_state.toLowerCase()}</div>
              </div>
              <div>
                <div className="text-text-muted">Người tạo</div>
                <div className="font-medium">{copy.id.slice(0, 8)}…</div>
              </div>
              <div>
                <div className="text-text-muted">Tạo lúc</div>
                <div className="font-medium">{new Date(copy.created_at).toLocaleString("vi-VN")}</div>
              </div>
              {copy.approved_at && (
                <>
                  <div>
                    <div className="text-text-muted">Duyệt lúc</div>
                    <div className="font-medium">{new Date(copy.approved_at).toLocaleString("vi-VN")}</div>
                  </div>
                  <div>
                    <div className="text-text-muted">Người duyệt</div>
                    <div className="font-medium">{copy.approved_by?.slice(0, 8)}…</div>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  )
}