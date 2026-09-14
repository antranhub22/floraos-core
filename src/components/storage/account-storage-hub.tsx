"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Folder,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Search,
  RefreshCw,
  ArrowRight,
  Pencil,
  Eye,
  Tag,
  Image as ImageIcon,
  FileText,
  AlertCircle,
  Calendar,
  Gift,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Trash2,
  Plus,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  TabActionHeader,
  type TabItem,
  type TabAction,
  type TabOverflowAction,
} from "@/components/ui/tab-header"
import { useSession } from "@/lib/session"
import {
  type SalesPitchData,
  generateZaloPitchScript,
  formatCurrencyVnd,
} from "@/modules/products/domain/sales-pitch-template"

export interface RawAssetItem {
  id: string
  name: string
  storage_key?: string
  image_url?: string | null
  mime_type?: string
  file_size?: number
  created_at?: string
  isLocal?: boolean
  file?: File
}

export interface ApprovedAnalysisItem {
  id: string
  product_id: string | null
  asset_id: string
  image_url?: string | null
  job_id: string
  provider: string
  model: string
  raw: Record<string, unknown>
  edited: Record<string, unknown> | null
  approval_state: "APPROVED"
  approved_at: string | null
  approved_by: string | null
  created_at: string
  product?: {
    id: string
    name: string
    code: string
    category: string | null
  } | null
}

interface AccountStorageHubProps {
  initialTab?: StorageTab
  localPhotos?: Array<{ id: string; file?: File; previewUrl: string; name: string }>
  finalizedPitches?: SalesPitchData[]
  onSelectRawPhoto?: (photo: RawAssetItem) => void
  onSelectApprovedAnalysis?: (analysis: ApprovedAnalysisItem, targetTab: "m01b" | "m01c") => void
  onSelectFinalizedPitch?: (pitch: SalesPitchData) => void
  onDeleteFinalizedPitch?: (pitchId: string) => void
  className?: string
}

const EMPTY_PHOTOS: Array<{ id: string; file?: File; previewUrl: string; name: string }> = []
const EMPTY_PITCHES: SalesPitchData[] = []

export function AccountStorageHub({
  initialTab = "approved",
  localPhotos = EMPTY_PHOTOS,
  finalizedPitches = EMPTY_PITCHES,
  onSelectRawPhoto,
  onSelectApprovedAnalysis,
  onSelectFinalizedPitch,
  onDeleteFinalizedPitch,
  className = "",
}: AccountStorageHubProps) {
  const router = useRouter()
  const session = useSession()
  const [activeTab, setActiveTab] = useState<StorageTab>(initialTab)
  const [searchQuery, setSearchQuery] = useState("")

  // Raw assets state
  const [serverAssets, setServerAssets] = useState<RawAssetItem[]>([])
  const [loadingRaw, setLoadingRaw] = useState(false)
  const [errorRaw, setErrorRaw] = useState<string | null>(null)

  // Approved analyses state
  const [approvedItems, setApprovedItems] = useState<ApprovedAnalysisItem[]>([])
  const [loadingApproved, setLoadingApproved] = useState(false)
  const [errorApproved, setErrorApproved] = useState<string | null>(null)

  // Finalized pitches state with localStorage sync
  const [internalFinalizedPitches, setInternalFinalizedPitches] = useState<SalesPitchData[]>(finalizedPitches)

  useEffect(() => {
    if (finalizedPitches.length > 0) {
      setInternalFinalizedPitches(finalizedPitches)
      return
    }
    try {
      const orgKey = session.organization?.id ?? "default"
      const saved = localStorage.getItem(`floraos_finalized_pitches_${orgKey}`)
      if (saved) {
        const parsed = JSON.parse(saved) as SalesPitchData[]
        setInternalFinalizedPitches(parsed)
      }
    } catch { /* ignore */ }
  }, [finalizedPitches.length, session.organization?.id])

  // Fallback handlers with router
  const handleSelectRaw = (photo: RawAssetItem) => {
    if (onSelectRawPhoto) {
      onSelectRawPhoto(photo)
    } else {
      router.push(`/tai-anh?mode=analyze&asset_id=${encodeURIComponent(photo.id)}`)
    }
  }

  const handleSelectApproved = (item: ApprovedAnalysisItem, targetTab: "m01b" | "m01c") => {
    if (onSelectApprovedAnalysis) {
      onSelectApprovedAnalysis(item, targetTab)
    } else {
      router.push(`/tai-anh?tab=${targetTab}&analysis_id=${encodeURIComponent(item.id)}`)
    }
  }

  const handleSelectFinalized = (pitch: SalesPitchData) => {
    if (onSelectFinalizedPitch) {
      onSelectFinalizedPitch(pitch)
    } else {
      const pitchId = pitch.id ?? pitch.productName
      router.push(`/tai-anh?tab=m01c&pitch_id=${encodeURIComponent(pitchId)}`)
    }
  }

  const handleDeletePitch = (pitchId: string) => {
    if (onDeleteFinalizedPitch) {
      onDeleteFinalizedPitch(pitchId)
    }
    setInternalFinalizedPitches((prev) => {
      const updated = prev.filter((p) => (p.id ?? p.productName) !== pitchId)
      try {
        const orgKey = session.organization?.id ?? "default"
        localStorage.setItem(`floraos_finalized_pitches_${orgKey}`, JSON.stringify(updated))
      } catch { /* ignore */ }
      return updated
    })
  }

  // Copied state for quick Zalo copy in tab 3
  const [copiedPitchId, setCopiedPitchId] = useState<string | null>(null)

  // Fetch Raw Assets
  const fetchRawAssets = async () => {
    setLoadingRaw(true)
    setErrorRaw(null)
    try {
      const res = await fetch("/api/v1/assets?limit=50", {
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) throw new Error(`Lỗi tải ảnh gốc (${res.status})`)
      const json = (await res.json()) as { data?: any[] }
      const items: RawAssetItem[] = (json.data ?? []).map((a) => ({
        id: a.id,
        name: a.name ?? a.filename ?? a.storage_key ?? a.id,
        storage_key: a.storage_key,
        mime_type: a.mime_type,
        file_size: a.file_size,
        created_at: a.created_at,
        image_url: a.image_url ?? null,
      }))
      setServerAssets(items)
    } catch (e) {
      setErrorRaw(e instanceof Error ? e.message : "Không tải được danh sách ảnh gốc")
    } finally {
      setLoadingRaw(false)
    }
  }

  // Fetch Approved Analyses
  const fetchApprovedAnalyses = async () => {
    setLoadingApproved(true)
    setErrorApproved(null)
    try {
      const res = await fetch("/api/v1/vision/analyses?approval_state=APPROVED&limit=50", {
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) throw new Error(`Lỗi tải phân tích đã duyệt (${res.status})`)
      const json = (await res.json()) as { data?: ApprovedAnalysisItem[] }
      setApprovedItems(json.data ?? [])
    } catch (e) {
      setErrorApproved(e instanceof Error ? e.message : "Không tải được danh sách phân tích đã duyệt")
    } finally {
      setLoadingApproved(false)
    }
  }

  useEffect(() => {
    fetchRawAssets()
    fetchApprovedAnalyses()
  }, [])

  // All raw assets combined (local uploads + server assets)
  const allRawAssets: RawAssetItem[] = useMemo(() => {
    const locals: RawAssetItem[] = localPhotos.map((p) => ({
      id: p.id,
      name: p.name,
      image_url: p.previewUrl,
      isLocal: true,
      file: p.file,
    }))
    return [...locals, ...serverAssets]
  }, [localPhotos, serverAssets])

  // Filtered raw assets
  const filteredRawAssets = useMemo(() => {
    if (!searchQuery.trim()) return allRawAssets
    const q = searchQuery.toLowerCase().trim()
    return allRawAssets.filter((a) => a.name.toLowerCase().includes(q))
  }, [allRawAssets, searchQuery])

  // Filtered approved items
  const filteredApprovedItems = useMemo(() => {
    if (!searchQuery.trim()) return approvedItems
    const q = searchQuery.toLowerCase().trim()
    return approvedItems.filter((item) => {
      const pName = item.product?.name?.toLowerCase() ?? ""
      const pCode = item.product?.code?.toLowerCase() ?? ""
      const effective = (item.edited ?? item.raw) as Record<string, unknown>
      const identity = (effective.identity as Record<string, unknown> | undefined) ?? {}
      const bom = (effective.bom as Record<string, unknown> | undefined) ?? {}
      const flowers = Array.isArray(bom.flowers)
        ? bom.flowers.map((f: { name?: string }) => f.name?.toLowerCase() ?? "").join(" ")
        : ""
      const style = typeof identity.style === "string" ? identity.style.toLowerCase() : ""
      return pName.includes(q) || pCode.includes(q) || flowers.includes(q) || style.includes(q)
    })
  }, [approvedItems, searchQuery])

  // Filtered finalized pitches
  const filteredFinalizedPitches = useMemo(() => {
    if (!searchQuery.trim()) return internalFinalizedPitches
    const q = searchQuery.toLowerCase().trim()
    return internalFinalizedPitches.filter((p) => {
      const name = p.productName.toLowerCase()
      const desc = p.description.toLowerCase()
      const style = p.style.toLowerCase()
      const occasions = p.occasions.join(" ").toLowerCase()
      const flowers = p.mainFlowers.map((f) => f.name.toLowerCase()).join(" ")
      return name.includes(q) || desc.includes(q) || style.includes(q) || occasions.includes(q) || flowers.includes(q)
    })
  }, [internalFinalizedPitches, searchQuery])

  // Quick Copy Zalo Handler for Tab 3
  const handleQuickCopyZalo = async (pitch: SalesPitchData) => {
    const script = generateZaloPitchScript(pitch)
    try {
      await navigator.clipboard.writeText(script)
      setCopiedPitchId(pitch.id ?? pitch.productName)
      setTimeout(() => setCopiedPitchId(null), 2500)
    } catch {
      setCopiedPitchId(pitch.id ?? pitch.productName)
      setTimeout(() => setCopiedPitchId(null), 2500)
    }
  }

  return (
    <div className={`flex flex-col gap-5 w-full ${className}`}>
      {/* Header & 3-Tab Navigator */}
      <div className="flex flex-col gap-4 rounded-3xl bg-surface p-5 border border-border shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-accent uppercase tracking-wider">FloraOS Media Hub</span>
              <Badge className="bg-primary/10 text-primary font-semibold text-[11px]">Kho Lưu Trữ Tài Khoản</Badge>
            </div>
            <h2 className="mt-1 text-xl font-extrabold text-text tracking-tight">
              Quản Lý Dữ Liệu Sản Phẩm & Sale Pitch
            </h2>
            <p className="text-[13px] text-text-muted mt-0.5">
              Phân loại 3 phân vùng chuẩn hóa: Ảnh gốc, Ảnh đã duyệt chờ sinh dữ liệu, và Sale Pitch đã hoàn thành.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm trong kho..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-border bg-surface-alt text-[13px] outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Standardized SaaS Tab Action Header (Tabs on Left + Actions on Top-Right) */}
        <TabActionHeader
          tabs={[
            {
              id: "raw",
              label: "1. Ảnh Gốc",
              icon: Folder,
              badge: allRawAssets.length,
              badgeTone: "neutral",
            },
            {
              id: "approved",
              label: "2. Ảnh Đã Duyệt (M01a)",
              icon: Layers,
              badge: approvedItems.length,
              badgeTone: "accent",
            },
            {
              id: "finalized",
              label: "3. Sale Pitch Hoàn Thành",
              icon: CheckCircle2,
              badge: internalFinalizedPitches.length,
              badgeTone: "success",
            },
          ]}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as StorageTab)}
          primaryActions={
            activeTab === "raw"
              ? [
                  {
                    id: "upload-new",
                    label: "+ Tải ảnh mới",
                    icon: Plus,
                    variant: "primary",
                    onClick: () => router.push("/tai-anh"),
                  },
                ]
              : activeTab === "approved"
              ? [
                  {
                    id: "refresh-approved",
                    label: "Làm mới",
                    icon: RefreshCw,
                    variant: "outline",
                    onClick: fetchApprovedAnalyses,
                  },
                ]
              : [
                  {
                    id: "create-pitch",
                    label: "+ Tạo Thẻ Chào mới",
                    icon: Plus,
                    variant: "primary",
                    onClick: () => router.push("/tai-anh?tab=m01c"),
                  },
                ]
          }
          overflowActions={
            activeTab === "raw"
              ? [
                  {
                    id: "refresh-raw",
                    label: "Làm mới danh sách ảnh",
                    icon: RefreshCw,
                    onClick: fetchRawAssets,
                  },
                  {
                    id: "goto-tai-anh",
                    label: "Chuyển tới trang Tải ảnh",
                    icon: ExternalLink,
                    onClick: () => router.push("/tai-anh"),
                  },
                ]
              : activeTab === "approved"
              ? [
                  {
                    id: "go-approval-queue",
                    label: "Đi tới Hàng chờ duyệt",
                    icon: ExternalLink,
                    onClick: () => router.push("/duyet"),
                  },
                ]
              : [
                  {
                    id: "refresh-finalized",
                    label: "Tải lại danh sách",
                    icon: RefreshCw,
                    onClick: () => fetchApprovedAnalyses(),
                  },
                ]
          }
        />
      </div>

      {/* TAB CONTENT 1: Ảnh Gốc */}
      {activeTab === "raw" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Danh sách ảnh gốc ({filteredRawAssets.length} ảnh)
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRawAssets}
              disabled={loadingRaw}
              className="text-xs gap-1.5"
            >
              <RefreshCw size={13} className={loadingRaw ? "animate-spin" : ""} />
              Làm mới kho ảnh
            </Button>
          </div>

          {errorRaw && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle size={15} />
              {errorRaw}
            </div>
          )}

          {filteredRawAssets.length === 0 && !loadingRaw && (
            <Card className="p-8 text-center bg-surface-alt border-dashed">
              <ImageIcon size={32} className="mx-auto text-text-muted mb-2 opacity-50" />
              <div className="text-sm font-bold text-text">Chưa có ảnh gốc nào</div>
              <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                Tải ảnh sản phẩm từ thiết bị lên tại tab &quot;Phân tích ảnh mới&quot; để lưu trữ và bắt đầu nhận diện hoa tự động.
              </p>
            </Card>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {filteredRawAssets.map((asset) => (
              <Card
                key={asset.id}
                className="overflow-hidden rounded-2xl border border-border bg-surface hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-surface-alt">
                  {asset.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={asset.image_url}
                      alt={asset.name}
                      className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-text-muted">
                      <ImageIcon size={24} className="opacity-40" />
                    </div>
                  )}
                  {asset.isLocal && (
                    <Badge className="absolute left-2 top-2 bg-blue-500/85 text-white text-[10px] py-0 px-1.5 font-bold border-none">
                      Mới tải lên
                    </Badge>
                  )}
                </div>

                <div className="p-3 flex flex-col gap-2">
                  <div className="text-[12px] font-semibold text-text truncate" title={asset.name}>
                    {asset.name}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSelectRaw(asset)}
                    className="w-full text-xs h-7 gap-1 bg-primary hover:bg-primary/90 text-white font-semibold"
                  >
                    <Sparkles size={12} />
                    Phân tích ảnh này
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: Ảnh Đã Duyệt Chờ Sinh Dữ Liệu (M01a Approved) */}
      {activeTab === "approved" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Danh sách sản phẩm đã chốt cấu phần BOM ({filteredApprovedItems.length})
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchApprovedAnalyses}
              disabled={loadingApproved}
              className="text-xs gap-1.5"
            >
              <RefreshCw size={13} className={loadingApproved ? "animate-spin" : ""} />
              Làm mới danh sách
            </Button>
          </div>

          {errorApproved && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle size={15} />
              {errorApproved}
            </div>
          )}

          {filteredApprovedItems.length === 0 && !loadingApproved && (
            <Card className="p-8 text-center bg-surface-alt border-dashed">
              <Layers size={32} className="mx-auto text-text-muted mb-2 opacity-50" />
              <div className="text-sm font-bold text-text">Chưa có phân tích nào được phê duyệt</div>
              <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                Hãy chuyển sang tab &quot;M01a: Phân tích kỹ thuật&quot; để nhận diện và duyệt BOM sản phẩm trước khi sinh dữ liệu bán hàng.
              </p>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredApprovedItems.map((item) => {
              const effective = (item.edited ?? item.raw) as Record<string, unknown>
              const identity = (effective.identity as Record<string, unknown> | undefined) ?? {}
              const bom = (effective.bom as Record<string, unknown> | undefined) ?? {}
              const flowers = Array.isArray(bom.flowers) ? bom.flowers : []
              const flowerCount =
                typeof effective.flower_count === "number"
                  ? effective.flower_count
                  : typeof effective.total_stems === "number"
                  ? effective.total_stems
                  : flowers.reduce((sum: number, f: any) => sum + (Number(f.quantity ?? f.count) || 0), 0)

              const displayName =
                item.product?.name ||
                (effective.product_name as string) ||
                (identity.category as string) ||
                "Bó hoa thiết kế"
              const displayStyle = (identity.phong_cach as string) || (identity.style as string) || "Hiện đại"
              const displayOccasion = identity.dip_su_dung ? String(identity.dip_su_dung) : null

              return (
                <Card
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-border bg-surface p-4 hover:shadow-md transition-all flex flex-col justify-between gap-3"
                >
                  <div className="flex gap-3.5">
                    {/* Thumbnail Image */}
                    <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-surface-alt border border-border">
                      {item.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image_url}
                          alt={displayName}
                          className="h-full w-full object-cover object-center"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-text-muted">
                          <ImageIcon size={22} className="opacity-40" />
                        </div>
                      )}
                      <span className="absolute bottom-1 right-1 rounded-md bg-black/70 px-1 py-0.5 text-[9.5px] font-bold text-white">
                        {flowerCount} cành
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <Badge tone="success" className="text-[10px] py-0 px-1.5 font-bold gap-1">
                            <CheckCircle2 size={10} /> ĐÃ DUYỆT BOM
                          </Badge>
                          <span className="text-[11px] text-text-muted font-medium">{displayStyle}</span>
                          {displayOccasion && (
                            <span className="text-[11px] text-primary font-semibold truncate">• {displayOccasion}</span>
                          )}
                        </div>

                        <h4 className="text-[14px] font-bold text-text truncate">{displayName}</h4>

                        {flowers.length > 0 && (
                          <div className="mt-1 text-[11.5px] text-text-muted truncate">
                            {flowers.map((f: any) => `${f.name || "Hoa"}${f.quantity ? ` (${f.quantity})` : ""}`).join(", ")}
                          </div>
                        )}
                      </div>

                      <div className="text-[10.5px] text-text-muted flex items-center gap-1 mt-1">
                        <Clock size={11} />
                        {item.approved_at ? new Date(item.approved_at).toLocaleDateString("vi-VN") : "Gần đây"}
                      </div>
                    </div>
                  </div>

                  {/* Actions for this approved item */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border/80">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectApproved(item, "m01b")}
                      className="flex-1 text-xs h-8 gap-1 border-border font-semibold text-text hover:text-primary"
                    >
                      <Sparkles size={13} className="text-accent" />
                      1. Sinh Copy (M01b)
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSelectApproved(item, "m01c")}
                      className="flex-1 text-xs h-8 gap-1 bg-primary hover:bg-primary/90 text-white font-bold"
                    >
                      <Tag size={13} />
                      2. Tạo Thẻ Chào (M01c)
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: Sale Pitch Đã Hoàn Thành (Finalized Pitches) */}
      {activeTab === "finalized" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Danh sách Thẻ Chào Khách đã xuất bản Final ({filteredFinalizedPitches.length})
            </span>
            <span className="text-xs text-text-muted">
              Nhấn &quot;Copy nhanh Zalo&quot; để gửi khách hàng ngay lập tức
            </span>
          </div>

          {filteredFinalizedPitches.length === 0 && (
            <Card className="p-8 text-center bg-surface-alt border-dashed">
              <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2 opacity-60" />
              <div className="text-sm font-bold text-text">Chưa có Sale Pitch nào được chốt duyệt Final</div>
              <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                Khi bạn chỉnh sửa Thẻ Chào Sản Phẩm tại tab &quot;M01c: Thẻ chào sản phẩm&quot; và bấm <strong>&quot;Chốt duyệt &amp; Xuất bản Final&quot;</strong>, thẻ sẽ tự động lưu vào kho này để sử dụng lâu dài.
              </p>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFinalizedPitches.map((pitch, idx) => {
              const pitchKey = pitch.id ?? `${pitch.productName}-${idx}`
              const isCopied = copiedPitchId === pitchKey

              return (
                <Card
                  key={pitchKey}
                  className="overflow-hidden rounded-2xl border-2 border-emerald-500/25 bg-surface p-4 hover:shadow-lg transition-all flex flex-col justify-between gap-3.5"
                >
                  <div className="flex gap-3.5">
                    {/* Thumbnail */}
                    <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-surface-alt border border-border">
                      {pitch.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={pitch.imageUrl}
                          alt={pitch.productName}
                          className="h-full w-full object-cover object-center"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-text-muted">
                          <ImageIcon size={24} className="opacity-40" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-black/75 py-0.5 text-center text-[10px] font-bold text-white">
                        {pitch.dimensions.heightCm}×{pitch.dimensions.widthCm} cm
                      </div>
                    </div>

                    {/* Information */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] py-0 px-1.5 border border-emerald-500/30 gap-0.5">
                            <CheckCircle2 size={10} strokeWidth={2.5} /> FINAL
                          </Badge>
                          <span className="text-[12px] font-extrabold text-primary">
                            {formatCurrencyVnd(pitch.priceVnd)}
                          </span>
                        </div>

                        <h4 className="text-[14px] font-extrabold text-text tracking-tight truncate leading-tight">
                          {pitch.productName}
                        </h4>

                        <div className="mt-1 flex flex-wrap gap-1">
                          {pitch.occasions.slice(0, 2).map((occ, i) => (
                            <span
                              key={i}
                              className="rounded-md bg-surface-alt px-1.5 py-0.5 text-[10.5px] font-medium text-text-muted border border-border/60"
                            >
                              {occ}
                            </span>
                          ))}
                        </div>

                        <div className="mt-1 text-[11.5px] text-text-muted line-clamp-1">
                          {pitch.mainFlowers.map((f) => `${f.name}${f.quantity ? ` (${f.quantity})` : ""}`).join(", ")}
                        </div>
                      </div>

                      <div className="text-[10px] text-text-muted flex items-center justify-between mt-1">
                        <span>{pitch.style}</span>
                        <span>{pitch.finalizedAt ? new Date(pitch.finalizedAt).toLocaleDateString("vi-VN") : "Hôm nay"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 pt-2.5 border-t border-border/80">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectFinalized(pitch)}
                      className="flex-1 text-xs h-8 gap-1 font-semibold text-text hover:text-primary"
                    >
                      <Eye size={13} /> Xem Thẻ Chào
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleQuickCopyZalo(pitch)}
                      className={`flex-1 text-xs h-8 gap-1 font-bold ${
                        isCopied ? "bg-emerald-600 text-white" : "bg-primary hover:bg-primary/90 text-white"
                      }`}
                    >
                      {isCopied ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} />}
                      {isCopied ? "Đã copy!" : "Copy kịch bản Zalo"}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePitch(pitchKey)}
                      className="h-8 w-8 p-0 text-text-muted hover:text-red-600 hover:bg-red-50"
                      title="Xóa Thẻ Chào này"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
