"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Radio, Search, CheckCircle2, AlertTriangle, AlertCircle, X, Plus, RefreshCw, Ban } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FeatureGuidanceCard } from "@/components/templates/shared/feature-guidance-card"
import { CoordinatorOrderBriefCard } from "@/components/templates/coordinator/coordinator-order-brief-card"
import { PartnerProductCard } from "@/components/templates/coordinator/partner-product-card"
import { PartnerProductionCard } from "@/components/templates/coordinator/partner-production-card"
import { AIQCReportCard } from "@/components/templates/coordinator/ai-qc-report-card"
import { DeliveryPODCard } from "@/components/templates/coordinator/delivery-pod-card"
import { ExceptionResolutionCard } from "@/components/templates/coordinator/exception-resolution-card"
import { PartnerAssignmentModal } from "@/components/templates/coordinator/partner-assignment-modal"
import { ProductionUpdateModal } from "@/components/templates/coordinator/production-update-modal"
import { OrderPlanningModal } from "@/components/templates/coordinator/order-planning-modal"
import { AiQcInspectionModal } from "@/components/templates/coordinator/ai-qc-inspection-modal"
import { DeliveryDispatchModal, type DeliveryEventInput } from "@/components/templates/coordinator/delivery-dispatch-modal"
import { OrderClosureModal } from "@/components/templates/coordinator/order-closure-modal"
import { SalesOrderIntakeCard } from "@/components/templates/coordinator/sales-order-intake-card"
import { SalesOrderIntakeModal } from "./sales-order-intake-modal"
import {
  coordinatorApi,
  errorMessage,
  type CoordinationOrder,
  type CreateOrderRequest,
} from "./coordinator-api"
import type { FlowerBomItem, StructuredAddress } from "@/modules/products/domain/product-master-index"

/**
 * Control Tower — Chức năng 12 (Điều phối đơn hàng).
 *
 * CSDL là nguồn duy nhất. Bản trước khởi đầu bằng 5 đơn mẫu cứng, lưu toàn bộ
 * vào localStorage (khoá chung mọi tổ chức trên cùng trình duyệt) và gọi API
 * "ngầm" rồi nuốt lỗi — nên dữ liệu mỗi máy một khác và phần lớn thao tác
 * không bao giờ tới máy chủ. Nay mọi thao tác chờ máy chủ trả đơn đã cập nhật.
 */

/** Tự làm mới để mức rủi ro trễ (F09/F12) — tính theo giờ hiện tại — không đứng yên. */
const REFRESH_MS = 60_000

const EXCEPTION_TYPE_LABELS: Record<string, string> = {
  MISSING_INFORMATION: "Thiếu thông tin",
  PARTNER_DECLINE: "Đối tác từ chối",
  PARTNER_DELAY: "Đối tác trễ",
  MATERIAL_SHORTAGE: "Thiếu vật liệu",
  QC_FAILURE: "QC không đạt",
  DELIVERY_FAILURE: "Giao thất bại",
  CUSTOMER_CHANGE: "Khách đổi yêu cầu",
  COMMERCIAL_ISSUE: "Vấn đề thương mại",
}

type DetailTab = "SALES_INTAKE" | "BRIEF" | "PRODUCTION" | "QC" | "DELIVERY" | "EXCEPTION" | "CLOSURE"

function asAddress(value: unknown): StructuredAddress | string {
  if (value && typeof value === "object") {
    const a = value as Record<string, unknown>
    if (typeof a.street === "string") return a as unknown as StructuredAddress
    if (typeof a.formattedAddress === "string") return a.formattedAddress
  }
  return typeof value === "string" ? value : ""
}

function asFlowers(order: CoordinationOrder): FlowerBomItem[] {
  return order.flowers as unknown as FlowerBomItem[]
}

function priorityOf(order: CoordinationOrder): "STANDARD" | "RUSH" | "VIP" {
  const note = order.internalNote ?? ""
  if (note.startsWith("[Ưu tiên: RUSH]")) return "RUSH"
  if (note.startsWith("[Ưu tiên: VIP]")) return "VIP"
  return "STANDARD"
}

const fmtTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString("vi-VN") : "—")

export interface ControlTowerDashboardProps {
  isCreateModalOpen?: boolean | undefined
  onOpenCreateModal?: (() => void) | undefined
  onCloseCreateModal?: (() => void) | undefined
}

export function ControlTowerDashboard({
  isCreateModalOpen,
  onOpenCreateModal,
  onCloseCreateModal,
}: ControlTowerDashboardProps = {}) {
  const [orders, setOrders] = useState<CoordinationOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [detailModalTab, setDetailModalTab] = useState<DetailTab>("BRIEF")
  const [internalIsCreateOpen, setInternalIsCreateOpen] = useState(false)
  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isProductionUpdateModalOpen, setIsProductionUpdateModalOpen] = useState(false)
  const [isQcModalOpen, setIsQcModalOpen] = useState(false)
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false)
  const [isClosureModalOpen, setIsClosureModalOpen] = useState(false)
  const [resolutionDrafts, setResolutionDrafts] = useState<Record<string, string>>({})
  const [newException, setNewException] = useState({ type: "CUSTOMER_CHANGE", severity: "MEDIUM", description: "" })
  const [cancelReason, setCancelReason] = useState("")
  const [detailError, setDetailError] = useState<string | null>(null)

  const selectedOrder = orders.find((o) => o.id === selectedId) ?? null

  const refresh = useCallback(
    () =>
      coordinatorApi
        .listOrders()
        .then((list) => {
          setOrders(list)
          setLoadError(null)
        })
        .catch((error: unknown) => setLoadError(errorMessage(error)))
        .finally(() => setLoading(false)),
    []
  )

  useEffect(() => {
    const first = setTimeout(() => void refresh(), 0)
    const timer = setInterval(() => void refresh(), REFRESH_MS)
    return () => {
      clearTimeout(first)
      clearInterval(timer)
    }
  }, [refresh])

  const applyUpdate = (order: CoordinationOrder) => {
    setOrders((prev) => {
      const i = prev.findIndex((p) => p.id === order.id)
      if (i < 0) return [order, ...prev]
      const next = [...prev]
      next[i] = order
      return next
    })
    setSelectedId(order.id)
  }

  const effectiveIsCreateOpen = isCreateModalOpen !== undefined ? isCreateModalOpen : internalIsCreateOpen
  const handleOpenCreate = onOpenCreateModal || (() => setInternalIsCreateOpen(true))
  const handleCloseCreate = () => {
    setInternalIsCreateOpen(false)
    onCloseCreateModal?.()
  }

  const openDetail = (order: CoordinationOrder, tab: DetailTab = "BRIEF") => {
    setSelectedId(order.id)
    setDetailModalTab(tab)
    setDetailError(null)
    setIsDetailOpen(true)
  }

  // ── Thao tác: mỗi hàm chờ máy chủ; lỗi ném lên modal để hiện đúng câu máy chủ trả ──

  const handleCreateOrder = async (body: CreateOrderRequest) => {
    const order = await coordinatorApi.createOrder(body)
    applyUpdate(order)
    setNotice(`Đã tạo đơn #${order.orderCode}.`)
  }

  const handleConfirmPlan = async (nextAction: string) => {
    if (!selectedOrder) return
    applyUpdate(await coordinatorApi.updateStage(selectedOrder.id, "PLANNING", nextAction))
    setIsPlanningModalOpen(false)
    setIsAssignModalOpen(true)
  }

  const handleAssignPartner = async (partnerId: string, notes: string, overrideCapacity: boolean) => {
    if (!selectedOrder) return
    applyUpdate(
      await coordinatorApi.assignPartner(selectedOrder.id, {
        partnerId,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        ...(overrideCapacity ? { overrideCapacity } : {}),
      })
    )
    setIsAssignModalOpen(false)
  }

  const handleProductionUpdate = async (params: {
    progressPercent: number
    action: "UPDATE_PROGRESS" | "REPORT_MATERIAL_ISSUE" | "MARK_READY"
    finishedAssetIds?: string[] | undefined
    issueNote?: string | undefined
  }) => {
    if (!selectedOrder) return
    const order = await coordinatorApi.production(selectedOrder.id, {
      action: params.action,
      progressPercent: params.progressPercent,
      ...(params.finishedAssetIds ? { finishedAssetIds: params.finishedAssetIds } : {}),
      ...(params.issueNote ? { issueNote: params.issueNote } : {}),
    })
    applyUpdate(order)
    setIsProductionUpdateModalOpen(false)
    if (order.stage === "QUALITY_CHECK") setIsQcModalOpen(true)
    if (order.stage === "EXCEPTION") openDetail(order, "EXCEPTION")
  }

  const handleQc = async (decision: "PASSED" | "REWORK_REQUESTED" | "REJECTED", notes: string, checklist: Record<string, boolean>) => {
    if (!selectedOrder) return
    const order = await coordinatorApi.qc(selectedOrder.id, { decision, ...(notes ? { notes } : {}), checklist })
    applyUpdate(order)
    setIsQcModalOpen(false)
    if (order.stage === "DISPATCHING") setIsDispatchModalOpen(true)
    if (order.stage === "EXCEPTION") openDetail(order, "EXCEPTION")
  }

  const handleDelivery = async (input: DeliveryEventInput) => {
    if (!selectedOrder) return
    const order = await coordinatorApi.delivery(selectedOrder.id, input)
    applyUpdate(order)
    if (order.stage === "DELIVERED") {
      setIsDispatchModalOpen(false)
      setIsClosureModalOpen(true)
    } else if (order.stage === "EXCEPTION") {
      setIsDispatchModalOpen(false)
      openDetail(order, "EXCEPTION")
    }
  }

  const handleCloseOrder = async (input: { partnerRating?: number; partnerPayoutVnd?: number; notes?: string }) => {
    if (!selectedOrder) return
    const order = await coordinatorApi.close(selectedOrder.id, input)
    applyUpdate(order)
    setIsClosureModalOpen(false)
    setNotice(`Đơn #${order.orderCode} đã nghiệm thu và đóng.`)
  }

  const runDetailAction = async (fn: () => Promise<CoordinationOrder>) => {
    setDetailError(null)
    try {
      applyUpdate(await fn())
      return true
    } catch (error) {
      setDetailError(errorMessage(error))
      return false
    }
  }

  const handleResolveException = async (exceptionId: string) => {
    const resolution = resolutionDrafts[exceptionId]?.trim()
    if (!resolution) {
      setDetailError("Ghi cách đã xử lý sự cố trước khi đóng.")
      return
    }
    if (await runDetailAction(() => coordinatorApi.resolveException(exceptionId, resolution))) {
      setResolutionDrafts((prev) => ({ ...prev, [exceptionId]: "" }))
    }
  }

  const handleOpenException = async () => {
    if (!selectedOrder) return
    if (!newException.description.trim()) {
      setDetailError("Mô tả sự cố trước khi mở.")
      return
    }
    if (await runDetailAction(() => coordinatorApi.openException(selectedOrder.id, { ...newException, description: newException.description.trim() }))) {
      setNewException({ type: "CUSTOMER_CHANGE", severity: "MEDIUM", description: "" })
    }
  }

  const handleCancelOrder = async () => {
    if (!selectedOrder) return
    if (!cancelReason.trim()) {
      setDetailError("Ghi lý do huỷ đơn.")
      return
    }
    if (await runDetailAction(() => coordinatorApi.cancel(selectedOrder.id, cancelReason.trim()))) {
      setCancelReason("")
    }
  }

  // Nút "bước kế tiếp" mở đúng form nghiệp vụ của bước đó.
  const handleAdvanceStage = (order: CoordinationOrder) => {
    setSelectedId(order.id)
    switch (order.stage) {
      case "INTAKE":
      case "VALIDATING":
        setIsPlanningModalOpen(true)
        break
      case "PLANNING":
      case "ASSIGNING":
        setIsAssignModalOpen(true)
        break
      case "IN_PRODUCTION":
        setIsProductionUpdateModalOpen(true)
        break
      case "QUALITY_CHECK":
        setIsQcModalOpen(true)
        break
      case "DISPATCHING":
        setIsDispatchModalOpen(true)
        break
      case "DELIVERED":
        setIsClosureModalOpen(true)
        break
      case "EXCEPTION":
        openDetail(order, "EXCEPTION")
        break
      default:
        openDetail(order, "BRIEF")
    }
  }

  const totalCount = orders.filter((o) => o.stage !== "COMPLETED" && o.stage !== "CANCELLED").length
  const criticalCount = orders.filter((o) => o.riskLevel === "CRITICAL").length
  const atRiskCount = orders.filter((o) => o.riskLevel === "AT_RISK").length
  const onTrackCount = orders.filter((o) => o.riskLevel === "NORMAL" && o.stage !== "COMPLETED" && o.stage !== "CANCELLED").length

  const filteredOrders = orders.filter((o) => {
    if (activeTab !== "ALL") {
      if (activeTab === "INTAKE" && o.stage !== "INTAKE" && o.stage !== "VALIDATING") return false
      if (activeTab === "PLANNING" && o.stage !== "PLANNING" && o.stage !== "ASSIGNING") return false
      if (activeTab === "IN_PRODUCTION" && o.stage !== "IN_PRODUCTION") return false
      if (activeTab === "QUALITY_CHECK" && o.stage !== "QUALITY_CHECK") return false
      if (activeTab === "DISPATCHING" && o.stage !== "DISPATCHING") return false
      if (activeTab === "DELIVERED" && o.stage !== "DELIVERED" && o.stage !== "COMPLETED") return false
      if (activeTab === "EXCEPTION" && !o.hasException && o.stage !== "EXCEPTION") return false
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const addr = asAddress(o.deliveryAddress)
      const addrStr = (typeof addr === "string" ? addr : [addr.street, addr.ward, addr.district, addr.city].join(" ")).toLowerCase()
      return (
        o.orderCode.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.recipientName.toLowerCase().includes(q) ||
        o.productTitle.toLowerCase().includes(q) ||
        addrStr.includes(q)
      )
    }
    return true
  })

  const tabButton = (tab: DetailTab, label: string, extra = "") => (
    <button
      onClick={() => setDetailModalTab(tab)}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
        detailModalTab === tab ? "bg-red-600 text-white" : `text-text-muted hover:text-text ${extra}`
      }`}
    >
      {label}
    </button>
  )

  const fieldClass = "px-3 py-2 rounded-xl border border-border bg-surface text-text text-xs focus:outline-none focus:border-red-500"

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Feature Guidance Card */}
      <FeatureGuidanceCard
        badgeLabel="HƯỚNG DẪN ĐIỀU PHỐI ĐƠN HÀNG (M12)"
        title="Tháp Vận Hành Điều Phối & Giám Sát Đơn Hàng Ngành Hoa"
        description="Quản lý toàn bộ tiến trình từ thẩm định đơn, phân công đối tác xưởng ngoài, AI QC kiểm định chất lượng đối chiếu Master Index đến trao hoa tận tay người nhận (POD)."
        tips={[
          "⚡ Một Đơn Hàng Duy Nhất (SSOT): Tự động đồng bộ với 11 chức năng còn lại",
          "🎯 Atomic BOM: Đối tác cắm hoa nhìn thấy chính xác công thức cành hoa từ Master Index",
          "🤖 AI Vision QC: So khớp ảnh thành phẩm của thợ với ảnh mẫu trước khi cho phép giao",
          "📋 28 Templates chuẩn hóa: T01 (Tiếp nhận) ➔ T02-T06 (Kế hoạch & Phân công) ➔ T07-T11 (Cắm hoa) ➔ T14-T15 (AI QC) ➔ T20-T21 (POD) ➔ T25-T27 (Đóng đơn)",
        ]}
      />

      {/* Khối Tôn Chỉ Vận Hành Sổ Tay Điều Phối (P10 & P12) */}
      <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50/80 via-white to-amber-50/60 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Radio size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
              <span>SỔ TAY ĐIỀU PHỐI • MANTRA CỐT LÕI (P12)</span>
            </div>
            <div className="text-xs md:text-sm font-black text-text mt-0.5">
              “Nhận đúng — Hiểu đúng — Chọn đúng — Làm đúng — Kiểm tra đúng — Giao đúng — Đóng đúng”
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-bold text-text-muted bg-surface/80 px-3 py-1.5 rounded-xl border border-border/80">
          <span className="text-red-600 font-extrabold">5 Câu Hỏi P10:</span>
          <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">1. Đơn ở đâu?</span>
          <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">2. Tiếp theo làm gì?</span>
          <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">3. Ai giữ bóng?</span>
          <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">4. Có rủi ro gì?</span>
          <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">5. Khi nào xong?</span>
        </div>
      </div>

      {/* 2. Control Tower Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl border border-border bg-surface p-4 flex flex-col justify-between shadow-sm">
          <span className="text-xs font-bold text-text-muted">TỔNG ĐƠN ĐANG ĐIỀU PHỐI</span>
          <div className="text-3xl font-black text-text mt-1">{totalCount}</div>
          <span className="text-[11px] text-text-muted mt-2">Chưa đóng / chưa huỷ</span>
        </Card>

        <Card className="rounded-2xl border border-red-200 bg-red-50/50 p-4 flex flex-col justify-between shadow-sm">
          <span className="text-xs font-bold text-red-800 flex items-center gap-1">
            <AlertCircle size={14} className="text-red-600" />
            CẦN XỬ LÝ GẤP (CRITICAL)
          </span>
          <div className="text-3xl font-black text-red-950 mt-1">{criticalCount}</div>
          <span className="text-[11px] text-red-700 mt-2 font-medium">Sự cố hoặc lệch QC</span>
        </Card>

        <Card className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 flex flex-col justify-between shadow-sm">
          <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
            <AlertTriangle size={14} className="text-amber-600" />
            CÓ NGUY CƠ TRỄ (AT RISK)
          </span>
          <div className="text-3xl font-black text-amber-950 mt-1">{atRiskCount}</div>
          <span className="text-[11px] text-amber-700 mt-2 font-medium">Cần thúc đẩy thợ cắm</span>
        </Card>

        <Card className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 flex flex-col justify-between shadow-sm">
          <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
            <CheckCircle2 size={14} className="text-emerald-600" />
            ĐÚNG HẠN (ON TRACK)
          </span>
          <div className="text-3xl font-black text-emerald-950 mt-1">{onTrackCount}</div>
          <span className="text-[11px] text-emerald-700 mt-2 font-medium">Tiến độ an toàn</span>
        </Card>
      </div>

      {/* 3. Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "Tất cả đơn" },
            { id: "INTAKE", label: "P1 • Nhận đơn (T01)" },
            { id: "PLANNING", label: "P2-P3 • Kế hoạch & Xưởng (T02-T06)" },
            { id: "IN_PRODUCTION", label: "P4 • Đang cắm hoa (T07-T11)" },
            { id: "QUALITY_CHECK", label: "P5 • Kiểm định QC (T14-T15)" },
            { id: "DISPATCHING", label: "P6 • Giao hàng (T20-T21)" },
            { id: "DELIVERED", label: "P7 • Đóng đơn & SLA (T25-T27)" },
            { id: "EXCEPTION", label: "P8 • Sự cố phát sinh (T22)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-red-600 text-white shadow-sm"
                  : tab.id === "EXCEPTION"
                  ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                  : "bg-surface border border-border text-text-muted hover:text-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Tìm theo mã đơn, khách hàng, mẫu hoa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="bg-red-600 hover:bg-red-700 text-white text-xs gap-1.5 shrink-0 font-bold shadow-xs h-8 px-3"
          >
            <Plus size={13} />
            <span>Tiếp nhận đơn (Sales T01)</span>
          </Button>
        </div>
      </div>

      {notice && (
        <div role="status" className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs font-semibold flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} aria-label="Ẩn thông báo">
            <X size={14} />
          </button>
        </div>
      )}
      {loadError && (
        <div role="alert" className="p-3 rounded-xl border border-red-300 bg-red-50 text-red-800 text-xs font-semibold flex items-center justify-between gap-2">
          <span>Không tải được danh sách đơn: {loadError}</span>
          <Button size="sm" variant="outline" onClick={() => void refresh()} className="gap-1 h-7">
            <RefreshCw size={12} /> Thử lại
          </Button>
        </div>
      )}

      {/* 4. Order List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-border text-xs text-text-muted">Đang tải đơn…</div>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((ord) => (
            <CoordinatorOrderBriefCard
              key={ord.id}
              orderCode={ord.orderCode}
              stage={ord.stage}
              stageLabel={ord.stageLabel}
              riskLevel={ord.riskLevel}
              riskReason={ord.riskReason}
              customerName={ord.customerName}
              customerTier={ord.customerTier}
              recipientName={ord.recipientName}
              recipientPhone={ord.recipientPhone}
              deliveryAddress={asAddress(ord.deliveryAddress)}
              deliveryTargetTime={ord.deliveryTargetTime}
              nextAction={ord.nextAction}
              productTitle={ord.productTitle}
              sampleImageUrl={ord.sampleImageUrl}
              partnerName={ord.partnerName ?? undefined}
              hasMissingItems={false}
              onOpenDetail={() => openDetail(ord)}
              {...(ord.stage === "COMPLETED" || ord.stage === "CANCELLED" ? {} : { onAdvanceStage: () => handleAdvanceStage(ord) })}
              onOpenAssignModal={() => {
                setSelectedId(ord.id)
                setIsAssignModalOpen(true)
              }}
              onOpenMissingInfo={() => openDetail(ord, "EXCEPTION")}
              onOpenProduction={() => {
                setSelectedId(ord.id)
                setIsProductionUpdateModalOpen(true)
              }}
              onOpenQC={() => {
                setSelectedId(ord.id)
                setIsQcModalOpen(true)
              }}
              onOpenPOD={() => {
                setSelectedId(ord.id)
                setIsDispatchModalOpen(true)
              }}
              onOpenClosure={() => {
                setSelectedId(ord.id)
                setIsClosureModalOpen(true)
              }}
            />
          ))
        ) : (
          <div className="p-12 text-center rounded-2xl border border-dashed border-border text-xs text-text-muted">
            {orders.length === 0 ? "Chưa có đơn điều phối nào — bấm “Tiếp nhận đơn” để tạo đơn đầu tiên." : "Không có đơn nào khớp bộ lọc."}
          </div>
        )}
      </div>

      {/* 5. Hồ sơ đơn */}
      {isDetailOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-surface z-10">
              <div className="flex items-center gap-2">
                <Radio size={18} className="text-red-600" />
                <h2 className="text-base font-extrabold text-text">
                  Hồ Sơ Điều Phối Đơn #{selectedOrder.orderCode} · {selectedOrder.stageLabel}
                </h2>
              </div>
              <button onClick={() => setIsDetailOpen(false)} aria-label="Đóng" className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 border-b border-border bg-surface-alt/40 flex items-center gap-2 overflow-x-auto">
              {tabButton("SALES_INTAKE", "P1 • Tiếp nhận (T01)")}
              {tabButton("BRIEF", "P2 • Thẻ sản phẩm (T02)")}
              {tabButton("PRODUCTION", "P4 • Phiếu cắm hoa (T07)")}
              {tabButton("QC", "P5 • Kiểm định QC (T14)")}
              {tabButton("DELIVERY", "P6 • Giao hàng & POD (T21)")}
              {tabButton("EXCEPTION", `Sự cố (${selectedOrder.exceptions.filter((e) => e.status === "OPEN" || e.status === "IN_PROGRESS").length})`, selectedOrder.hasException ? "text-red-700 bg-red-100" : "")}
              {tabButton("CLOSURE", "P7 • Nghiệm thu (T25)")}
            </div>

            <div className="p-6 flex flex-col gap-4">
              {detailError && (
                <div role="alert" className="p-3 rounded-xl border border-red-300 bg-red-50 text-red-800 text-xs font-semibold">
                  {detailError}
                </div>
              )}

              {detailModalTab === "SALES_INTAKE" && (
                <SalesOrderIntakeCard
                  orderCode={selectedOrder.orderCode}
                  source="Tiếp nhận tại Control Tower"
                  customerName={selectedOrder.customerName}
                  customerTier={selectedOrder.customerTier}
                  recipientName={selectedOrder.recipientName}
                  recipientPhone={selectedOrder.recipientPhone}
                  deliveryAddress={asAddress(selectedOrder.deliveryAddress)}
                  deliveryTargetTime={selectedOrder.deliveryTargetTime}
                  productTitle={selectedOrder.productTitle}
                  sampleImageUrl={selectedOrder.sampleImageUrl}
                  unitPriceVnd={selectedOrder.unitPriceVnd}
                  priority={priorityOf(selectedOrder)}
                />
              )}

              {detailModalTab === "BRIEF" && (
                <PartnerProductCard
                  orderCode={selectedOrder.orderCode}
                  productTitle={selectedOrder.productTitle}
                  sampleImageUrl={selectedOrder.sampleImageUrl}
                  flowers={asFlowers(selectedOrder)}
                  unitPriceVnd={selectedOrder.unitPriceVnd}
                  partnerPayoutVnd={selectedOrder.partnerPayoutVnd ?? undefined}
                  deliveryTargetTime={selectedOrder.deliveryTargetTime}
                  deliveryAddress={asAddress(selectedOrder.deliveryAddress)}
                  recipientName={selectedOrder.recipientName}
                  recipientPhone={selectedOrder.recipientPhone}
                  cardMessage={selectedOrder.cardMessage}
                  technicalNotes={selectedOrder.internalNote ?? undefined}
                  partnerName={selectedOrder.partnerName ?? undefined}
                  riskLevel={selectedOrder.riskLevel}
                  riskReason={selectedOrder.riskReason}
                  {...(selectedOrder.stage === "COMPLETED" || selectedOrder.stage === "CANCELLED"
                    ? {}
                    : { onAdvanceStage: () => handleAdvanceStage(selectedOrder) })}
                />
              )}

              {detailModalTab === "PRODUCTION" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-surface-alt/50 p-3 rounded-xl border border-border text-xs">
                    <span>
                      Xưởng: <strong>{selectedOrder.partnerName ?? "Chưa phân công"}</strong> · Tiến độ{" "}
                      <strong>{selectedOrder.productionProgress}%</strong>
                    </span>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setIsAssignModalOpen(true)} className="text-xs h-7 px-2.5 font-bold">
                        Phân công đối tác (T06)
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={selectedOrder.stage !== "IN_PRODUCTION"}
                        onClick={() => setIsProductionUpdateModalOpen(true)}
                        className="text-xs h-7 px-2.5 font-bold"
                      >
                        Cập nhật tiến độ / Thiếu hoa (T10)
                      </Button>
                    </div>
                  </div>
                  <PartnerProductionCard
                    orderCode={selectedOrder.orderCode}
                    recipeTitle={selectedOrder.productTitle}
                    targetReadyTime={selectedOrder.deliveryTargetTime}
                    sampleImageUrl={selectedOrder.sampleImageUrl}
                    flowers={asFlowers(selectedOrder)}
                    cardMessage={selectedOrder.cardMessage}
                    internalNote={selectedOrder.internalNote}
                    partnerName={selectedOrder.partnerName ?? undefined}
                    onMarkReady={() => setIsProductionUpdateModalOpen(true)}
                  />
                </div>
              )}

              {detailModalTab === "QC" && (
                <AIQCReportCard
                  orderCode={selectedOrder.orderCode}
                  qcStatus={(selectedOrder.qc?.status as "PENDING" | "PASSED" | "REJECTED" | "REWORK_REQUESTED" | undefined) ?? "PENDING"}
                  aiScore={selectedOrder.qc?.aiScore ?? null}
                  aiCritique={selectedOrder.qc?.notes ?? null}
                  finishedImageUrls={selectedOrder.finishedImageUrls}
                  onApprove={() => setIsQcModalOpen(true)}
                />
              )}

              {detailModalTab === "DELIVERY" && (
                <DeliveryPODCard
                  orderCode={selectedOrder.orderCode}
                  shipperName={selectedOrder.delivery.shipperName ?? "Chưa bàn giao shipper"}
                  shipperPhone={selectedOrder.delivery.shipperPhone ?? ""}
                  deliveryAddress={asAddress(selectedOrder.deliveryAddress)}
                  recipientName={selectedOrder.recipientName}
                  recipientPhone={selectedOrder.recipientPhone}
                  isDelivered={selectedOrder.stage === "DELIVERED" || selectedOrder.stage === "COMPLETED"}
                  deliveredAt={selectedOrder.delivery.actualDeliveryAt ? fmtTime(selectedOrder.delivery.actualDeliveryAt) : null}
                  podImageUrl={selectedOrder.delivery.podImageUrl}
                  recipientSignatureName={selectedOrder.delivery.podRecipientName}
                  onConfirmComplete={() => setIsDispatchModalOpen(true)}
                />
              )}

              {detailModalTab === "EXCEPTION" && (
                <div className="flex flex-col gap-4 text-xs">
                  {selectedOrder.exceptions.length === 0 && <div className="text-text-muted">Đơn chưa có sự cố nào.</div>}
                  {selectedOrder.exceptions.map((exc) => {
                    const open = exc.status === "OPEN" || exc.status === "IN_PROGRESS"
                    return (
                      <div key={exc.id} className="flex flex-col gap-2">
                        <ExceptionResolutionCard
                          orderCode={selectedOrder.orderCode}
                          exceptionCode={exc.code}
                          type={EXCEPTION_TYPE_LABELS[exc.type] ?? exc.type}
                          severity={exc.severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"}
                          description={exc.description}
                          resolutionPlan={exc.resolution}
                          status={exc.status as "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CANCELLED"}
                          reportedAt={fmtTime(exc.createdAt)}
                        />
                        {open && (
                          <div className="flex items-center gap-2">
                            <input
                              className={`flex-1 ${fieldClass}`}
                              placeholder="Đã xử lý thế nào (bắt buộc)"
                              value={resolutionDrafts[exc.id] ?? ""}
                              onChange={(e) => setResolutionDrafts((prev) => ({ ...prev, [exc.id]: e.target.value }))}
                            />
                            <Button size="sm" onClick={() => void handleResolveException(exc.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                              Đóng sự cố
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {selectedOrder.stage !== "COMPLETED" && selectedOrder.stage !== "CANCELLED" && (
                    <div className="p-3 rounded-xl border border-dashed border-red-300 flex flex-col gap-2">
                      <span className="font-bold text-text">Mở sự cố mới (T22)</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <select className={fieldClass} value={newException.type} onChange={(e) => setNewException({ ...newException, type: e.target.value })}>
                          {Object.entries(EXCEPTION_TYPE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <select className={fieldClass} value={newException.severity} onChange={(e) => setNewException({ ...newException, severity: e.target.value })}>
                          <option value="LOW">Thấp</option>
                          <option value="MEDIUM">Trung bình</option>
                          <option value="HIGH">Cao</option>
                          <option value="CRITICAL">Khẩn cấp</option>
                        </select>
                      </div>
                      <input
                        className={fieldClass}
                        placeholder="Mô tả sự cố"
                        value={newException.description}
                        onChange={(e) => setNewException({ ...newException, description: e.target.value })}
                      />
                      <Button size="sm" variant="outline" onClick={() => void handleOpenException()} className="w-fit text-red-700 border-red-300 gap-1">
                        <AlertCircle size={13} /> Mở sự cố
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {detailModalTab === "CLOSURE" && (
                <div className="flex flex-col gap-3 text-xs">
                  {selectedOrder.stage === "COMPLETED" ? (
                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col gap-1">
                      <strong className="text-emerald-900">Đã đóng lúc {fmtTime(selectedOrder.closedAt)}</strong>
                      <span>Đối tác: {selectedOrder.partnerName ?? "—"} · Điểm: {selectedOrder.partnerRating ?? "—"}/5</span>
                      <span>
                        Tiền công đối tác:{" "}
                        {selectedOrder.partnerPayoutVnd === null ? "chưa chốt" : `${selectedOrder.partnerPayoutVnd.toLocaleString("vi-VN")} đ`}
                      </span>
                      {selectedOrder.closureNotes && <span>Ghi chú: {selectedOrder.closureNotes}</span>}
                    </div>
                  ) : selectedOrder.stage === "CANCELLED" ? (
                    <div className="p-4 rounded-xl border border-border bg-surface-alt">Đơn đã huỷ: {selectedOrder.cancelledReason}</div>
                  ) : (
                    <Button
                      size="sm"
                      disabled={selectedOrder.stage !== "DELIVERED"}
                      onClick={() => setIsClosureModalOpen(true)}
                      className="w-fit bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                    >
                      <CheckCircle2 size={13} /> Nghiệm thu & đóng đơn
                    </Button>
                  )}

                  {!["COMPLETED", "CANCELLED", "DELIVERED"].includes(selectedOrder.stage) && (
                    <div className="p-3 rounded-xl border border-dashed border-border flex flex-col gap-2">
                      <span className="font-bold text-text">Huỷ đơn (cần quyền điều hành)</span>
                      <input className={fieldClass} placeholder="Lý do huỷ" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
                      <Button size="sm" variant="outline" onClick={() => void handleCancelOrder()} className="w-fit gap-1 text-red-700 border-red-300">
                        <Ban size={13} /> Huỷ đơn
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. Tiếp nhận đơn (T01 — P1) */}
      <SalesOrderIntakeModal isOpen={effectiveIsCreateOpen} onClose={handleCloseCreate} onSubmit={handleCreateOrder} />

      {selectedOrder && (
        <>
          <OrderPlanningModal
            isOpen={isPlanningModalOpen}
            order={selectedOrder}
            onClose={() => setIsPlanningModalOpen(false)}
            onConfirmPlan={handleConfirmPlan}
          />
          <PartnerAssignmentModal
            key={`assign-${selectedOrder.id}-${isAssignModalOpen}`}
            isOpen={isAssignModalOpen}
            orderCode={selectedOrder.orderCode}
            recipeTitle={selectedOrder.productTitle}
            deliveryAddress={selectedOrder.deliveryAddress}
            deliveryTargetTime={selectedOrder.deliveryTargetTime}
            currentPartnerId={selectedOrder.partner?.id ?? null}
            onClose={() => setIsAssignModalOpen(false)}
            onAssign={handleAssignPartner}
          />
          <ProductionUpdateModal
            isOpen={isProductionUpdateModalOpen}
            orderCode={selectedOrder.orderCode}
            recipeTitle={selectedOrder.productTitle}
            currentProgressPercent={selectedOrder.productionProgress}
            onClose={() => setIsProductionUpdateModalOpen(false)}
            onSubmitUpdate={handleProductionUpdate}
          />
          <AiQcInspectionModal isOpen={isQcModalOpen} order={selectedOrder} onClose={() => setIsQcModalOpen(false)} onSubmit={handleQc} />
          <DeliveryDispatchModal
            key={`dispatch-${selectedOrder.id}-${isDispatchModalOpen}`}
            isOpen={isDispatchModalOpen}
            order={selectedOrder}
            onClose={() => setIsDispatchModalOpen(false)}
            onSubmit={handleDelivery}
          />
          <OrderClosureModal
            isOpen={isClosureModalOpen}
            order={selectedOrder}
            onClose={() => setIsClosureModalOpen(false)}
            onSubmit={handleCloseOrder}
          />
        </>
      )}
    </div>
  )
}
