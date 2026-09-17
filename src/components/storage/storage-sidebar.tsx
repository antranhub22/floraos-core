"use client"

import { useState, useMemo } from "react"
import {
  Folder,
  Layers,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  Search,
  RefreshCw,
  Tag,
  Image as ImageIcon,
  FileText,
  ChevronRight,
  ChevronLeft,
  Filter,
  ArrowRight,
  Clock,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  type SalesPitchData,
  generateZaloPitchScript,
  formatCurrencyVnd,
} from "@/modules/products/domain/sales-pitch-template"
import type { RawAssetItem, ApprovedAnalysisItem } from "./account-storage-hub"

export type SidebarFilter = "all" | "raw" | "approved" | "finalized"

interface StorageSidebarProps {
  rawAssets: RawAssetItem[]
  approvedAnalyses: ApprovedAnalysisItem[]
  finalizedPitches: SalesPitchData[]
  loading?: boolean
  selectedId?: string | null
  onRefresh?: () => void
  onSelectRawPhoto: (photo: RawAssetItem) => void
  onSelectApprovedAnalysis: (analysis: ApprovedAnalysisItem, action: "m01b" | "m01c") => void
  onSelectFinalizedPitch: (pitch: SalesPitchData) => void
  className?: string
}

export function StorageSidebar({
  rawAssets = [],
  approvedAnalyses = [],
  finalizedPitches = [],
  loading = false,
  selectedId,
  onRefresh,
  onSelectRawPhoto,
  onSelectApprovedAnalysis,
  onSelectFinalizedPitch,
  className = "",
}: StorageSidebarProps) {
  const [filter, setFilter] = useState<SidebarFilter>("all")
  const [query, setQuery] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Combined unified items list with pipeline progress tags
  const unifiedItems = useMemo(() => {
    type UnifiedItem =
      | { type: "raw"; id: string; data: RawAssetItem; title: string; subtitle: string; imageUrl?: string | null | undefined }
      | { type: "approved"; id: string; data: ApprovedAnalysisItem; title: string; subtitle: string; imageUrl?: string | null | undefined }
      | { type: "finalized"; id: string; data: SalesPitchData; title: string; subtitle: string; imageUrl?: string | null | undefined }

    const items: UnifiedItem[] = []

    // 1. Raw photos
    rawAssets.forEach((a) => {
      items.push({
        type: "raw",
        id: a.id,
        data: a,
        title: a.name,
        subtitle: a.isLocal ? "Ảnh vừa tải từ máy" : "Ảnh gốc máy chủ",
        imageUrl: a.image_url,
      })
    })

    // 2. Approved M01a analyses
    approvedAnalyses.forEach((a) => {
      const effective = (a.edited ?? a.raw) as Record<string, unknown>
      const identity = (effective.identity as Record<string, unknown> | undefined) ?? {}
      const bom = (effective.bom as Record<string, unknown> | undefined) ?? {}
      const flowers = Array.isArray(bom.flowers) ? bom.flowers : []
      const flowerCount =
        typeof effective.flower_count === "number"
          ? effective.flower_count
          : flowers.reduce((s: number, f: any) => s + (Number(f.quantity ?? f.count) || 0), 0)

      const title =
        a.product?.name || (effective.product_name as string) || (identity.category as string) || "Bó hoa thiết kế"
      const subtitle = `${flowerCount} cành • ${identity.phong_cach || "Đã duyệt BOM"}`

      items.push({
        type: "approved",
        id: a.id,
        data: a,
        title,
        subtitle,
        imageUrl: a.image_url,
      })
    })

    // 3. Finalized Pitches
    finalizedPitches.forEach((p, idx) => {
      items.push({
        type: "finalized",
        id: p.id ?? `${p.productName}-${idx}`,
        data: p,
        title: p.productName,
        subtitle: `${formatCurrencyVnd(p.priceVnd)} • ${p.style}`,
        imageUrl: p.imageUrl,
      })
    })

    return items
  }, [rawAssets, approvedAnalyses, finalizedPitches])

  // Filter & search
  const filteredItems = useMemo(() => {
    let list = unifiedItems
    if (filter !== "all") {
      list = list.filter((i) => i.type === filter)
    }
    if (query.trim()) {
      const q = query.toLowerCase().trim()
      list = list.filter((i) => i.title.toLowerCase().includes(q) || i.subtitle.toLowerCase().includes(q))
    }
    return list
  }, [unifiedItems, filter, query])

  const handleCopyZaloQuick = async (pitch: SalesPitchData, e: React.MouseEvent) => {
    e.stopPropagation()
    const script = generateZaloPitchScript(pitch)
    try {
      await navigator.clipboard.writeText(script)
      setCopiedId(pitch.id ?? pitch.productName)
      setTimeout(() => setCopiedId(null), 2500)
    } catch {
      setCopiedId(pitch.id ?? pitch.productName)
      setTimeout(() => setCopiedId(null), 2500)
    }
  }

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center py-4 px-2 border-r border-border bg-surface w-14 flex-shrink-0 h-full">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="p-2 rounded-xl bg-surface-alt hover:bg-primary/10 hover:text-primary transition-colors text-text-muted mb-4"
          title="Mở rộng Kho Dữ Liệu"
        >
          <ChevronRight size={18} />
        </button>
        <div className="writing-vertical text-xs font-bold text-text-muted tracking-wider uppercase mt-4 flex items-center gap-2">
          <Folder size={14} className="rotate-90 text-primary" />
          <span>Kho Dữ Liệu</span>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-500" title={`Ảnh gốc (${rawAssets.length})`} />
          <span className="h-2 w-2 rounded-full bg-blue-500" title={`Đã duyệt BOM (${approvedAnalyses.length})`} />
          <span className="h-2 w-2 rounded-full bg-emerald-500" title={`Sale Pitch (${finalizedPitches.length})`} />
        </div>
      </div>
    )
  }

  return (
    <aside
      className={`flex flex-col border-r border-border bg-surface w-72 sm:w-80 flex-shrink-0 h-full shadow-sm z-10 ${className}`}
    >
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-border flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white">
              <Folder size={15} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-[13px] font-extrabold text-text tracking-tight">Kho Dữ Liệu Sản Phẩm</h3>
              <div className="text-[10.5px] text-text-muted">Chọn thẻ để tiếp tục luồng xử lý</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="p-1.5 rounded-lg text-text-muted hover:bg-surface-alt hover:text-text transition-colors"
                title="Làm mới kho dữ liệu"
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 rounded-lg text-text-muted hover:bg-surface-alt hover:text-text transition-colors"
              title="Thu gọn sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên, loại hoa..."
            className="w-full pl-7 pr-2.5 py-1.5 rounded-xl border border-border bg-surface-alt text-xs outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[11px] no-scrollbar">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-2 py-0.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filter === "all" ? "bg-primary text-white font-bold" : "bg-surface-alt text-text-muted hover:text-text"
            }`}
          >
            Tất cả ({unifiedItems.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("raw")}
            className={`px-2 py-0.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filter === "raw" ? "bg-amber-500 text-white font-bold" : "bg-surface-alt text-text-muted hover:text-text"
            }`}
          >
            Ảnh gốc ({rawAssets.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("approved")}
            className={`px-2 py-0.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filter === "approved" ? "bg-blue-600 text-white font-bold" : "bg-surface-alt text-text-muted hover:text-text"
            }`}
          >
            Đã duyệt BOM ({approvedAnalyses.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("finalized")}
            className={`px-2 py-0.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filter === "finalized" ? "bg-emerald-600 text-white font-bold" : "bg-surface-alt text-text-muted hover:text-text"
            }`}
          >
            Sale Pitch ({finalizedPitches.length})
          </button>
        </div>
      </div>

      {/* Cards Scrollable List */}
      <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2">
        {filteredItems.length === 0 && (
          <div className="py-12 text-center text-xs text-text-muted flex flex-col items-center gap-2 px-4">
            <ImageIcon size={24} className="opacity-40" />
            <span>Không tìm thấy thẻ sản phẩm phù hợp</span>
          </div>
        )}

        {filteredItems.map((item) => {
          const isSelected = selectedId === item.id

          // 1. THẺ ẢNH GỐC (Chưa phân tích AI M01a)
          if (item.type === "raw") {
            const rawAsset = item.data as RawAssetItem
            return (
              <div
                key={`raw-${item.id}`}
                onClick={() => onSelectRawPhoto(rawAsset)}
                className={`group relative flex flex-col gap-2 rounded-2xl border p-2.5 cursor-pointer transition-all hover:shadow-md ${
                  isSelected
                    ? "border-primary bg-primary/[0.04] ring-1 ring-primary/40"
                    : "border-border bg-surface hover:border-primary/40"
                }`}
              >
                <div className="flex gap-2.5 items-center">
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-surface-alt border border-border">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-text-muted">
                        <ImageIcon size={18} className="opacity-40" />
                      </div>
                    )}
                    <Badge className="absolute left-1 top-1 bg-amber-500 text-white text-[8.5px] py-0 px-1 border-none font-bold">
                      GỐC
                    </Badge>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-bold text-text truncate">{item.title}</div>
                    <div className="text-[10.5px] text-text-muted truncate mt-0.5">{item.subtitle}</div>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                      <span>• Chưa phân tích cấu phần</span>
                    </div>
                  </div>
                </div>

                {/* Uncompleted Action Button */}
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectRawPhoto(rawAsset)
                  }}
                  className="w-full text-xs h-7 gap-1 bg-primary hover:bg-primary/90 text-white font-bold"
                >
                  <Sparkles size={12} />
                  Kích hoạt phân tích AI (M01a) →
                </Button>
              </div>
            )
          }

          // 2. THẺ ĐÃ DUYỆT BOM (Chờ sinh Copy M01b hoặc Pitch M01c)
          if (item.type === "approved") {
            const analysis = item.data as ApprovedAnalysisItem
            return (
              <div
                key={`approved-${item.id}`}
                onClick={() => onSelectApprovedAnalysis(analysis, "m01c")}
                className={`group relative flex flex-col gap-2 rounded-2xl border p-2.5 cursor-pointer transition-all hover:shadow-md ${
                  isSelected
                    ? "border-primary bg-primary/[0.04] ring-1 ring-primary/40"
                    : "border-border bg-surface hover:border-primary/40"
                }`}
              >
                <div className="flex gap-2.5 items-center">
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-surface-alt border border-border">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-text-muted">
                        <ImageIcon size={18} className="opacity-40" />
                      </div>
                    )}
                    <Badge className="absolute left-1 top-1 bg-blue-600 text-white text-[8.5px] py-0 px-1 border-none font-bold">
                      M01a
                    </Badge>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="text-[12px] font-bold text-text truncate">{item.title}</div>
                      <Badge tone="success" className="text-[9px] py-0 px-1 font-bold">
                        ĐÃ DUYỆT
                      </Badge>
                    </div>
                    <div className="text-[10.5px] text-text-muted truncate mt-0.5">{item.subtitle}</div>
                    <div className="mt-0.5 text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                      Chờ sinh Copy bán hàng &amp; Thẻ chào
                    </div>
                  </div>
                </div>

                {/* 2 Uncompleted Actions */}
                <div className="grid grid-cols-2 gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectApprovedAnalysis(analysis, "m01b")
                    }}
                    className="text-[11px] h-7 gap-1 px-1 font-semibold hover:text-primary border-border"
                    title="Sinh câu từ bán hàng M01b"
                  >
                    <Sparkles size={11} className="text-accent" />
                    Sinh Copy (M01b)
                  </Button>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectApprovedAnalysis(analysis, "m01c")
                    }}
                    className="text-[11px] h-7 gap-1 px-1 bg-primary hover:bg-primary/90 text-white font-bold"
                    title="Tạo thẻ chào khách hàng M01c"
                  >
                    <Tag size={11} />
                    Tạo Thẻ Chào →
                  </Button>
                </div>
              </div>
            )
          }

          // 3. THẺ SALE PITCH ĐÃ HOÀN THÀNH (FINAL)
          if (item.type === "finalized") {
            const pitch = item.data as SalesPitchData
            const isCopied = copiedId === (pitch.id ?? pitch.productName)

            return (
              <div
                key={`finalized-${item.id}`}
                onClick={() => onSelectFinalizedPitch(pitch)}
                className={`group relative flex flex-col gap-2 rounded-2xl border-2 p-2.5 cursor-pointer transition-all hover:shadow-md ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-500/[0.06] ring-1 ring-emerald-500/50"
                    : "border-emerald-500/30 bg-surface hover:border-emerald-500/60"
                }`}
              >
                <div className="flex gap-2.5 items-center">
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-surface-alt border border-border">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-text-muted">
                        <ImageIcon size={18} className="opacity-40" />
                      </div>
                    )}
                    <Badge className="absolute left-1 top-1 bg-emerald-600 text-white text-[8.5px] py-0 px-1 border-none font-bold">
                      FINAL
                    </Badge>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="text-[12px] font-bold text-text truncate">{item.title}</div>
                      <span className="text-[11px] font-extrabold text-primary">
                        {formatCurrencyVnd(pitch.priceVnd)}
                      </span>
                    </div>
                    <div className="text-[10.5px] text-text-muted truncate mt-0.5">{item.subtitle}</div>
                    <div className="mt-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={10} strokeWidth={2.5} /> Sẵn sàng tư vấn khách
                    </div>
                  </div>
                </div>

                {/* Actions for Finalized Pitch */}
                <div className="grid grid-cols-2 gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectFinalizedPitch(pitch)
                    }}
                    className="text-[11px] h-7 gap-1 px-1 border-border font-semibold text-text"
                  >
                    Xem &amp; Sửa lại
                  </Button>
                  <Button
                    size="sm"
                    onClick={(e) => handleCopyZaloQuick(pitch, e)}
                    className={`text-[11px] h-7 gap-1 px-1 font-bold ${
                      isCopied ? "bg-emerald-600 text-white" : "bg-primary hover:bg-primary/90 text-white"
                    }`}
                  >
                    {isCopied ? <Check size={12} strokeWidth={2.5} /> : <Copy size={12} />}
                    {isCopied ? "Đã copy!" : "Copy Zalo"}
                  </Button>
                </div>
              </div>
            )
          }

          return null
        })}
      </div>

      {/* Sidebar Footer Stats */}
      <div className="p-2.5 border-t border-border bg-surface-alt/50 text-[11px] text-text-muted flex items-center justify-between">
        <span>Tổng cộng: {unifiedItems.length} sản phẩm</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
          {finalizedPitches.length} đã xong Final
        </span>
      </div>
    </aside>
  )
}
