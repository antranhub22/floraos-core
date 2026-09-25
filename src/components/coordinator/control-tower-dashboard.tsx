"use client"

import React, { useState, useEffect } from "react"
import {
  Radio,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Sparkles,
  Truck,
  ArrowRight,
  Eye,
  AlertCircle,
  X,
  Plus,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FeatureGuidanceCard } from "@/components/templates/shared/feature-guidance-card"
import { CoordinatorOrderBriefCard } from "@/components/templates/coordinator/coordinator-order-brief-card"
import { PartnerProductCard } from "@/components/templates/coordinator/partner-product-card"
import { PartnerProductionCard } from "@/components/templates/coordinator/partner-production-card"
import { AIQCReportCard } from "@/components/templates/coordinator/ai-qc-report-card"
import { DeliveryPODCard } from "@/components/templates/coordinator/delivery-pod-card"
import { ExceptionResolutionCard } from "@/components/templates/coordinator/exception-resolution-card"
import { PartnerAssignmentModal, type PartnerCandidate } from "@/components/templates/coordinator/partner-assignment-modal"
import { ProductionUpdateModal } from "@/components/templates/coordinator/production-update-modal"
import { OrderPlanningModal } from "@/components/templates/coordinator/order-planning-modal"
import { AiQcInspectionModal } from "@/components/templates/coordinator/ai-qc-inspection-modal"
import { DeliveryDispatchModal } from "@/components/templates/coordinator/delivery-dispatch-modal"
import { OrderClosureModal } from "@/components/templates/coordinator/order-closure-modal"
import { OrderClosureLearningCard } from "@/components/templates/coordinator/order-closure-learning-card"
import { SalesOrderIntakeCard } from "@/components/templates/coordinator/sales-order-intake-card"
import { MissingInfoRequestCard } from "@/components/templates/coordinator/missing-info-request-card"
import { SalesOrderIntakeModal } from "./sales-order-intake-modal"
import type { FlowerBomItem, StructuredAddress } from "@/modules/products/domain/product-master-index"

export interface CoordinationMockOrder {
  id: string
  orderCode: string
  stage: "INTAKE" | "PLANNING" | "ASSIGNING" | "IN_PRODUCTION" | "QUALITY_CHECK" | "DISPATCHING" | "DELIVERED" | "COMPLETED" | "EXCEPTION"
  stageLabel: string
  riskLevel: "NORMAL" | "ATTENTION" | "AT_RISK" | "CRITICAL"
  riskReason?: string | null | undefined
  customerName: string
  customerTier: string
  recipientName: string
  recipientPhone: string
  deliveryAddress: StructuredAddress | string
  deliveryTargetTime: string
  nextAction: string
  partnerName?: string | undefined
  productTitle: string
  sampleImageUrl?: string | undefined
  finishedImageUrls?: string[] | undefined
  flowers: FlowerBomItem[]
  cardMessage: string
  internalNote?: string | undefined
  aiScore?: number | undefined
  aiCritique?: string | undefined
  qcScore?: number | undefined
  qcStatus?: "PASSED" | "REWORK_REQUIRED" | undefined
  podImageUrl?: string | undefined
  hasException?: boolean | undefined
  exceptionData?: {
    code: string
    type: string
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    description: string
    resolution?: string | undefined
  } | undefined
  missingItems?: Array<{
    field: string
    label: string
    reason: string
  }> | undefined
  partnerPayoutVnd?: number | undefined
  unitPriceVnd?: number | undefined
}

const INITIAL_ORDERS: CoordinationMockOrder[] = [
  {
    id: "ord-001",
    orderCode: "FLR-2026-001",
    stage: "QUALITY_CHECK",
    stageLabel: "Chờ duyệt QC",
    riskLevel: "CRITICAL",
    riskReason: "Ảnh hoa thợ gửi có nguy cơ lệch màu nơ so với ảnh mẫu",
    customerName: "Nguyễn Văn An",
    customerTier: "VIP",
    recipientName: "Trần Thị Bình",
    recipientPhone: "0912345678",
    deliveryAddress: {
      street: "Phòng 802, Toà Lotte Center, 54 Liễu Giai",
      ward: "Phường Cống Vị",
      district: "Quận Ba Đình",
      city: "Hà Nội",
      country: "Việt Nam",
      formattedAddress: "Phòng 802, Toà Lotte Center, 54 Liễu Giai, Phường Cống Vị, Quận Ba Đình, Hà Nội, Việt Nam",
    },
    deliveryTargetTime: "17:00 Hôm nay",
    nextAction: "Duyệt ảnh AI QC hoặc yêu cầu thợ đổi nơ đỏ",
    partnerName: "Flora Xưởng Ba Đình",
    productTitle: "Bó Hồng Ohara Kem Sang Trọng",
    sampleImageUrl: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=600&q=80",
    finishedImageUrls: ["https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=600&q=80"],
    flowers: [
      { flowerName: "Hồng Ohara Kem", quantity: 15, unit: "cành", color: "Kem pastel", role: "Chủ đạo" },
      { flowerName: "Baby Trắng", quantity: 5, unit: "cành", color: "Trắng", role: "Điểm xuyến" },
      { flowerName: "Cúc Tana", quantity: 7, unit: "cành", color: "Trắng vàng", role: "Phụ" },
    ],
    cardMessage: "Chúc mừng sinh nhật em yêu, chúc em luôn rạng rỡ như đóa hoa này!",
    internalNote: "Khách VIP, bọc 2 lớp giấy lụa mờ cẩn thận tránh gió",
    aiScore: 92,
    aiCritique: "Hoa cắm tròn đều, 15 cành Ohara tươi mới đạt chuẩn, nơ nhung đỏ buộc chắc chắn.",
    hasException: false,
  },
  {
    id: "ord-002",
    orderCode: "FLR-2026-002",
    stage: "IN_PRODUCTION",
    stageLabel: "Đang cắm hoa",
    riskLevel: "AT_RISK",
    riskReason: "Còn 90 phút nhưng xưởng mới hoàn thành 40%",
    customerName: "Lê Hoàng Long",
    customerTier: "GOLD",
    recipientName: "Phạm Thu Hương",
    recipientPhone: "0988776655",
    deliveryAddress: {
      street: "Tầng 3 Khách sạn Daewoo, 360 Kim Mã",
      ward: "Phường Ngọc Khánh",
      district: "Quận Ba Đình",
      city: "Hà Nội",
      country: "Việt Nam",
      formattedAddress: "Tầng 3 Khách sạn Daewoo, 360 Kim Mã, Phường Ngọc Khánh, Quận Ba Đình, Hà Nội, Việt Nam",
    },
    deliveryTargetTime: "17:30 Hôm nay",
    nextAction: "Gọi điện giục thợ đẩy nhanh tiến độ cắm hoa",
    partnerName: "Tiệm Hoa Nghệ Thuật Đống Đa",
    productTitle: "Giỏ Hoa Khai Trương Tài Lộc",
    sampleImageUrl: "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&w=600&q=80",
    flowers: [
      { flowerName: "Hướng Dương", quantity: 10, unit: "bông", color: "Vàng rực", role: "Chủ đạo" },
      { flowerName: "Hồng Cam Spirit", quantity: 12, unit: "cành", color: "Cam tươi", role: "Phụ" },
    ],
    cardMessage: "Chúc mừng khai trương Hồng Phát - Vạn Sự Hanh Thông!",
    hasException: true,
    exceptionData: {
      code: "EXP-088",
      type: "DELAY_RISK",
      severity: "HIGH",
      description: "Thợ cắm chính đang hoàn thiện đơn tiệc trước đó, bắt đầu đơn này chậm 20 phút.",
      resolution: "Bổ sung 1 thợ phụ phụ trách cắt tỉa lá đệm và chuẩn bị giỏ mây.",
    },
  },
  {
    id: "ord-003",
    orderCode: "FLR-2026-003",
    stage: "DISPATCHING",
    stageLabel: "Đang giao hàng",
    riskLevel: "NORMAL",
    customerName: "Đỗ Minh Tuấn",
    customerTier: "SILVER",
    recipientName: "Bùi Thị Mai",
    recipientPhone: "0904321987",
    deliveryAddress: {
      street: "Số 18, Đường Hoàng Diệu",
      ward: "Phường Quán Thánh",
      district: "Quận Ba Đình",
      city: "Hà Nội",
      country: "Việt Nam",
      formattedAddress: "Số 18, Đường Hoàng Diệu, Phường Quán Thánh, Quận Ba Đình, Hà Nội, Việt Nam",
    },
    deliveryTargetTime: "16:45 Hôm nay",
    nextAction: "Theo dõi vị trí shipper trên bản đồ",
    partnerName: "Flora Xưởng Ba Đình",
    productTitle: "Bó Cúc Tana Mộc Mạc",
    sampleImageUrl: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=600&q=80",
    flowers: [
      { flowerName: "Cúc Tana", quantity: 30, unit: "cành", color: "Trắng vàng", role: "Chủ đạo" },
    ],
    cardMessage: "Chúc ngày mới an lành và tràn đầy năng lượng tích cực!",
    aiScore: 98,
    hasException: false,
  },
  {
    id: "ord-004",
    orderCode: "FLR-2026-004",
    stage: "DELIVERED",
    stageLabel: "Đã giao (Chờ đóng đơn)",
    riskLevel: "NORMAL",
    customerName: "Vũ Hải Đăng",
    customerTier: "BRONZE",
    recipientName: "Nguyễn Thùy Chi",
    recipientPhone: "0977112233",
    deliveryAddress: {
      street: "Tầng 12, Tòa Keangnam Landmark 72, Phạm Hùng",
      ward: "Phường Mễ Trì",
      district: "Quận Nam Từ Liêm",
      city: "Hà Nội",
      country: "Việt Nam",
      formattedAddress: "Tầng 12, Tòa Keangnam Landmark 72, Phạm Hùng, Phường Mễ Trì, Quận Nam Từ Liêm, Hà Nội, Việt Nam",
    },
    deliveryTargetTime: "15:00 Hôm nay",
    nextAction: "Bấm 'Nghiệm thu đóng đơn' để cập nhật điểm CRM và giải ngân đối tác",
    partnerName: "Xưởng Hoa Cầu Giấy",
    productTitle: "Bó Hồng Đỏ Quyến Rũ",
    sampleImageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
    podImageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
    flowers: [
      { flowerName: "Hồng Đỏ Explorer", quantity: 20, unit: "cành", color: "Đỏ nhung", role: "Chủ đạo" },
    ],
    cardMessage: "Mãi mãi bên nhau em nhé!",
    hasException: false,
    partnerPayoutVnd: 280000,
  },
  {
    id: "ord-005",
    orderCode: "FLR-2026-005",
    stage: "INTAKE",
    stageLabel: "Tiếp nhận đơn từ Sales",
    riskLevel: "ATTENTION",
    riskReason: "Sales chưa ghi rõ số phòng toà nhà & số điện thoại phụ của người nhận",
    customerName: "Hoàng Nhật Minh",
    customerTier: "SILVER",
    recipientName: "Đặng Mai Phương",
    recipientPhone: "0966881122",
    deliveryAddress: {
      street: "Tòa Keangnam Hanoi Landmark Tower, Phạm Hùng",
      ward: "Phường Mễ Trì",
      district: "Quận Nam Từ Liêm",
      city: "Hà Nội",
      country: "Việt Nam",
      formattedAddress: "Tòa Keangnam Hanoi Landmark Tower, Phạm Hùng, Phường Mễ Trì, Quận Nam Từ Liêm, Hà Nội, Việt Nam",
    },
    deliveryTargetTime: "18:30 Hôm nay",
    nextAction: "Yêu cầu Sales bổ sung số tầng/phòng trước khi điều phối thợ",
    productTitle: "Bình Hoa Tulip Trắng Tinh Khôi",
    sampleImageUrl: "https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&w=600&q=80",
    flowers: [
      { flowerName: "Tulip Hà Lan Trắng", quantity: 20, unit: "cành", color: "Trắng tinh", role: "Chủ đạo" },
      { flowerName: "Baby Trắng", quantity: 5, unit: "cành", color: "Trắng", role: "Điểm xuyến" },
    ],
    cardMessage: "Happy Birthday my sunshine!",
    internalNote: "Khách dặn giao đúng giờ tan tầm 18h30 để tạo bất ngờ",
    missingItems: [
      { field: "roomNumber", label: "Số phòng/Tầng", reason: "Tòa Keangnam rộng, cần số tầng chính xác" },
      { field: "secondaryPhone", label: "SĐT dự phòng", reason: "Tránh trường hợp người nhận bận họp máy bận" },
    ],
  },
]

const COORDINATOR_STORAGE_KEY = "floraos_coordinator_orders_v2"

export function getNextAdvancedOrder(o: CoordinationMockOrder): CoordinationMockOrder {
  if (o.stage === "INTAKE") {
    return {
      ...o,
      stage: "PLANNING",
      stageLabel: "Đã tiếp nhận (Chờ phân công)",
      riskLevel: "NORMAL",
      nextAction: "Phân công đối tác xưởng ngoài hoặc thợ cắm hoa",
    }
  }
  if (o.stage === "PLANNING" || o.stage === "ASSIGNING") {
    return {
      ...o,
      stage: "IN_PRODUCTION",
      stageLabel: "Đang cắm hoa",
      riskLevel: "NORMAL",
      nextAction: "Xưởng đang tiếp nhận cắm hoa theo BOM",
    }
  }
  if (o.stage === "IN_PRODUCTION") {
    return {
      ...o,
      stage: "QUALITY_CHECK",
      stageLabel: "Chờ duyệt QC",
      riskLevel: "NORMAL",
      nextAction: "Kiểm tra ảnh hoa thợ vừa cắm xong đối chiếu Master Index",
    }
  }
  if (o.stage === "QUALITY_CHECK") {
    return {
      ...o,
      stage: "DISPATCHING",
      stageLabel: "Đang giao hàng",
      riskLevel: "NORMAL",
      nextAction: "Shipper đang giao tới người nhận",
    }
  }
  if (o.stage === "DISPATCHING") {
    return {
      ...o,
      stage: "DELIVERED",
      stageLabel: "Đã giao (Chờ đóng đơn)",
      riskLevel: "NORMAL",
      nextAction: "Nghiệm thu đóng đơn và giải ngân đối tác",
    }
  }
  if (o.stage === "DELIVERED") {
    return {
      ...o,
      stage: "COMPLETED",
      stageLabel: "Hoàn tất 100%",
      riskLevel: "NORMAL",
      nextAction: "Đơn đã hoàn thành trọn vẹn",
    }
  }
  if (o.stage === "EXCEPTION") {
    return {
      ...o,
      hasException: false,
      stage: "IN_PRODUCTION",
      stageLabel: "Đang cắm hoa",
      riskLevel: "NORMAL",
      nextAction: "Đã xử lý xong sự cố, tiếp tục tiến trình",
    }
  }
  return o
}

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
  const [orders, setOrders] = useState<CoordinationMockOrder[]>(INITIAL_ORDERS)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<CoordinationMockOrder | null>(null)
  const [activeTab, setActiveTab] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [detailModalTab, setDetailModalTab] = useState<
    "SALES_INTAKE" | "BRIEF" | "MISSING_INFO" | "PRODUCTION" | "QC" | "DELIVERY" | "EXCEPTION" | "CLOSURE"
  >("BRIEF")
  const [internalIsCreateOpen, setInternalIsCreateOpen] = useState(false)
  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isProductionUpdateModalOpen, setIsProductionUpdateModalOpen] = useState(false)
  const [isQcModalOpen, setIsQcModalOpen] = useState(false)
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false)
  const [isClosureModalOpen, setIsClosureModalOpen] = useState(false)

  // Nạp dữ liệu bền vững từ localStorage sau khi client mount (triệt tiêu 100% lỗi SSR Hydration mismatch)
  useEffect(() => {
    setIsMounted(true)
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(COORDINATOR_STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setOrders(parsed)
          }
        }
      } catch (e) {
        console.error("Failed to load coordinator orders from localStorage:", e)
      }
    }
  }, [])

  // Đồng bộ lưu bền vững vào localStorage khi orders thay đổi sau khi đã mount
  useEffect(() => {
    if (!isMounted) return
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(COORDINATOR_STORAGE_KEY, JSON.stringify(orders))
      } catch (e) {
        console.error("Failed to save coordinator orders to localStorage:", e)
      }
    }
  }, [orders, isMounted])

  // Tải danh sách đơn từ Database Backend khi vào trang
  useEffect(() => {
    async function syncFromDb() {
      try {
        const res = await fetch("/api/v1/coordinator/orders")
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.orders) && data.orders.length > 0) {
            setOrders((prev) => {
              const dbCodes = new Set(data.orders.map((o: any) => o.orderCode || o.id))
              const localOnly = prev.filter((p) => !dbCodes.has(p.orderCode) && !dbCodes.has(p.id))
              return [...data.orders, ...localOnly]
            })
          }
        }
      } catch (err) {
        console.warn("Database sync offline, using local persistent storage:", err)
      }
    }
    syncFromDb()
  }, [])

  const effectiveIsCreateOpen = isCreateModalOpen !== undefined ? isCreateModalOpen : internalIsCreateOpen
  const handleOpenCreate = onOpenCreateModal || (() => setInternalIsCreateOpen(true))
  const handleCloseCreate = () => {
    setInternalIsCreateOpen(false)
    onCloseCreateModal?.()
  }

  const handleCreateOrder = async (newOrder: CoordinationMockOrder) => {
    setOrders((prev) => [newOrder, ...prev])
    // Bắn API lưu vào database ngầm
    try {
      await fetch("/api/v1/coordinator/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrder),
      })
    } catch (err) {
      console.warn("Coordinator API offline, saved in persistent localStorage:", err)
    }
  }

  const totalCount = orders.length
  const criticalCount = orders.filter((o) => o.riskLevel === "CRITICAL").length
  const atRiskCount = orders.filter((o) => o.riskLevel === "AT_RISK").length
  const onTrackCount = orders.filter((o) => o.riskLevel === "NORMAL").length

  const filteredOrders = orders.filter((o) => {
    if (activeTab !== "ALL") {
      if (activeTab === "INTAKE" && o.stage !== "INTAKE") return false
      if (activeTab === "PLANNING" && o.stage !== "PLANNING" && o.stage !== "ASSIGNING") return false
      if (activeTab === "IN_PRODUCTION" && o.stage !== "IN_PRODUCTION") return false
      if (activeTab === "QUALITY_CHECK" && o.stage !== "QUALITY_CHECK") return false
      if (activeTab === "DISPATCHING" && o.stage !== "DISPATCHING") return false
      if (activeTab === "DELIVERED" && o.stage !== "DELIVERED" && o.stage !== "COMPLETED") return false
      if (activeTab === "EXCEPTION" && !o.hasException) return false
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const addrStr =
        typeof o.deliveryAddress === "object" && o.deliveryAddress !== null
          ? `${o.deliveryAddress.street} ${o.deliveryAddress.ward} ${o.deliveryAddress.district} ${o.deliveryAddress.city} ${o.deliveryAddress.country || ""}`.toLowerCase()
          : o.deliveryAddress.toLowerCase()
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

  // Hàm đồng bộ đơn hàng vào state, localStorage và Database
  const syncOrder = (updatedOrder: CoordinationMockOrder) => {
    setOrders((prev) => {
      const next = prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(COORDINATOR_STORAGE_KEY, JSON.stringify(next))
        } catch (e) {
          console.error("Failed to sync orders to localStorage:", e)
        }
      }
      return next
    })
    setSelectedOrder((prev) => (prev && prev.id === updatedOrder.id ? updatedOrder : prev))

    // Đồng bộ DB ngầm
    fetch(`/api/v1/coordinator/orders/${updatedOrder.id}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage: updatedOrder.stage,
        nextAction: updatedOrder.nextAction,
        metadata: {
          riskLevel: updatedOrder.riskLevel,
          partnerName: updatedOrder.partnerName,
          finishedImageUrls: updatedOrder.finishedImageUrls,
          podImageUrl: updatedOrder.podImageUrl,
          qcScore: updatedOrder.qcScore,
        },
      }),
    }).catch((err) => console.warn("Background stage sync:", err))
  }

  // Chuyển bước theo đúng nghiệp vụ tác nghiệp của Điều phối viên: Mở đúng Form của bước đó
  const handleAdvanceStage = (orderId: string) => {
    const target = orders.find((o) => o.id === orderId)
    if (!target) return
    setSelectedOrder(target)

    switch (target.stage) {
      case "INTAKE":
        // P1 -> P2: Mở Form Lập Kế Hoạch Đơn Hàng (Order Planning Modal T02)
        setIsPlanningModalOpen(true)
        break
      case "PLANNING":
        // P2 -> P3: Mở Form Tìm & Chỉ Định Đối Tác Xưởng (Partner Assignment Modal T06)
        setIsAssignModalOpen(true)
        break
      case "ASSIGNING":
      case "IN_PRODUCTION":
        // P3/P4: Mở Form Phiếu Cắm Hoa & Cập Nhật Tiến Độ (Production Update Modal T08/T10)
        setIsProductionUpdateModalOpen(true)
        break
      case "QUALITY_CHECK":
        // P5: Mở Form Kiểm Định Chất Lượng AI QC (AI QC Inspection Modal T14)
        setIsQcModalOpen(true)
        break
      case "DISPATCHING":
        // P6: Mở Form Điều Phối Giao Hàng & Thu Thập POD (Delivery Dispatch Modal T20/T21)
        setIsDispatchModalOpen(true)
        break
      case "DELIVERED":
        // P7: Mở Form Nghiệm Thu & Đóng Đơn SLA (Order Closure Modal T25/T26)
        setIsClosureModalOpen(true)
        break
      case "COMPLETED":
        alert(`Đơn hàng #${target.orderCode} đã hoàn tất và đóng hồ sơ sạch!`)
        break
      default:
        setIsPlanningModalOpen(true)
        break
    }
  }

  // Xử lý xác nhận Kế hoạch P2 ➔ Chuyển sang P3 Tìm đối tác
  const handleConfirmPlan = (updatedOrder: CoordinationMockOrder) => {
    syncOrder(updatedOrder)
    setIsPlanningModalOpen(false)
    // Tự động mở ngay Modal phân công xưởng P3 cho Điều phối viên tác nghiệp
    setIsAssignModalOpen(true)
  }

  // Xử lý gán đối tác P3 ➔ Chuyển sang P4 Theo dõi gia công
  const handleAssignPartner = (partner: PartnerCandidate, notes?: string) => {
    if (!selectedOrder) return
    const partnerName = partner.name
    const updated: CoordinationMockOrder = {
      ...selectedOrder,
      partnerName,
      stage: "IN_PRODUCTION",
      stageLabel: "Đang cắm hoa",
      nextAction: `Xưởng ${partnerName} đang cắm theo BOM (điểm tương thích ${partner.matchScore}%)`,
      internalNote: notes
        ? `${selectedOrder.internalNote || ""}\n[Phân công P3]: Giao xưởng ${partnerName}. Ghi chú: ${notes}`.trim()
        : selectedOrder.internalNote,
    }
    syncOrder(updated)
    setIsAssignModalOpen(false)
  }

  // Xử lý cập nhật tiến độ cắm hoa P4 ➔ Khi cắm xong 100% tự động mở AI QC P5
  const handleProductionUpdateSubmit = (params: {
    progressPercent: number
    action: "UPDATE_PROGRESS" | "REPORT_MATERIAL_ISSUE" | "MARK_READY"
    finishedImageUrl?: string | undefined
    issueNote?: string | undefined
  }) => {
    if (!selectedOrder) return

    if (params.action === "MARK_READY" || params.progressPercent >= 100) {
      const finishedImgs = params.finishedImageUrl
        ? [params.finishedImageUrl]
        : selectedOrder.finishedImageUrls || [selectedOrder.sampleImageUrl || ""]
      const updated: CoordinationMockOrder = {
        ...selectedOrder,
        stage: "QUALITY_CHECK",
        stageLabel: "Đã cắm xong (Chờ kiểm định QC)",
        nextAction: "Thực hiện kiểm định thị giác AI QC đối chiếu ảnh mẫu",
        finishedImageUrls: finishedImgs,
      }
      syncOrder(updated)
      setIsProductionUpdateModalOpen(false)
      // Mở ngay Modal Kiểm Định AI QC P5
      setIsQcModalOpen(true)
    } else if (params.action === "REPORT_MATERIAL_ISSUE") {
      const newException = {
        code: `EXP-${Math.floor(100 + Math.random() * 900)}`,
        type: "MATERIAL_SHORTAGE",
        severity: "HIGH" as const,
        description: params.issueNote || "Xưởng báo thiếu nguyên vật liệu hoa cần thay thế",
        resolution: "Đang liên hệ Sales xin ý kiến khách về phương án thay thế",
      }
      const updated: CoordinationMockOrder = {
        ...selectedOrder,
        hasException: true,
        riskLevel: "CRITICAL",
        riskReason: "Thiếu nguyên liệu",
        exceptionData: newException,
        nextAction: "Liên hệ Sales xin ý kiến khách về phương án hoa thay thế",
      }
      syncOrder(updated)
      setIsProductionUpdateModalOpen(false)
      setDetailModalTab("EXCEPTION")
    } else {
      const updatedAction = `Xưởng hoàn thành ${params.progressPercent}%`
      const updated: CoordinationMockOrder = {
        ...selectedOrder,
        nextAction: updatedAction,
      }
      syncOrder(updated)
      setIsProductionUpdateModalOpen(false)
    }
  }

  // Xử lý duyệt Đạt QC P5 ➔ Tự động mở Modal Giao hàng P6
  const handleApprovePassQC = (updatedOrder: CoordinationMockOrder) => {
    syncOrder(updatedOrder)
    setIsQcModalOpen(false)
    // Tự động mở ngay Modal Điều phối giao hàng P6
    setIsDispatchModalOpen(true)
  }

  // Xử lý yêu cầu Rework QC P5
  const handleRequestRework = (updatedOrder: CoordinationMockOrder, reworkNotes: string) => {
    syncOrder(updatedOrder)
    setIsQcModalOpen(false)
    alert(`Đã gửi yêu cầu thợ sửa lại theo nội dung: "${reworkNotes}"`)
  }

  // Xử lý xác nhận Giao thành công P6 ➔ Tự động mở Modal Nghiệm thu P7
  const handleConfirmDelivered = (updatedOrder: CoordinationMockOrder) => {
    syncOrder(updatedOrder)
    setIsDispatchModalOpen(false)
    // Tự động mở ngay Modal Nghiệm thu & Đóng đơn P7
    setIsClosureModalOpen(true)
  }

  // Xử lý đóng đơn & lưu trữ hồ sơ P7
  const handleArchiveOrder = (updatedOrder: CoordinationMockOrder) => {
    syncOrder(updatedOrder)
    setIsClosureModalOpen(false)
    alert(`🏆 Đơn hàng #${updatedOrder.orderCode} đã hoàn tất và đóng hồ sơ sạch! SLA xuất sắc.`)
  }

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
          <span className="text-[11px] text-text-muted mt-2">Hôm nay</span>
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

      {/* 4. Order List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredOrders.length > 0 ? (
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
              deliveryAddress={ord.deliveryAddress}
              deliveryTargetTime={ord.deliveryTargetTime}
              nextAction={ord.nextAction}
              productTitle={ord.productTitle}
              sampleImageUrl={ord.sampleImageUrl}
              partnerName={ord.partnerName}
              hasMissingItems={Boolean(ord.missingItems && ord.missingItems.length > 0)}
              onOpenDetail={() => setSelectedOrder(ord)}
              onAdvanceStage={() => handleAdvanceStage(ord.id)}
              onOpenAssignModal={() => {
                setSelectedOrder(ord)
                setIsAssignModalOpen(true)
              }}
              onOpenMissingInfo={() => {
                setSelectedOrder(ord)
                setDetailModalTab("MISSING_INFO")
              }}
              onOpenProduction={() => {
                setSelectedOrder(ord)
                setIsProductionUpdateModalOpen(true)
              }}
              onOpenQC={() => {
                setSelectedOrder(ord)
                setIsQcModalOpen(true)
              }}
              onOpenPOD={() => {
                setSelectedOrder(ord)
                setIsDispatchModalOpen(true)
              }}
              onOpenClosure={() => {
                setSelectedOrder(ord)
                setIsClosureModalOpen(true)
              }}
            />
          ))
        ) : (
          <div className="p-12 text-center rounded-2xl border border-dashed border-border text-xs text-text-muted">
            Không tìm thấy đơn hàng nào phù hợp với bộ lọc
          </div>
        )}
      </div>

      {/* 5. Detail Modal / Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-surface z-10">
              <div className="flex items-center gap-2">
                <Radio size={18} className="text-red-600" />
                <h2 className="text-base font-extrabold text-text">
                  Hồ Sơ Điều Phối Đơn #{selectedOrder.orderCode}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 border-b border-border bg-surface-alt/40 flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setDetailModalTab("SALES_INTAKE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                  detailModalTab === "SALES_INTAKE" ? "bg-red-600 text-white" : "text-text-muted hover:text-text"
                }`}
              >
                P1 • Tiếp nhận Sales (T01)
              </button>
              <button
                onClick={() => setDetailModalTab("BRIEF")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                  detailModalTab === "BRIEF" ? "bg-red-600 text-white" : "text-text-muted hover:text-text"
                }`}
              >
                P2 • Tóm tắt Brief (T02)
              </button>
              {selectedOrder.missingItems && selectedOrder.missingItems.length > 0 && (
                <button
                  onClick={() => setDetailModalTab("MISSING_INFO")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1 ${
                    detailModalTab === "MISSING_INFO" ? "bg-amber-600 text-white" : "text-amber-800 bg-amber-100"
                  }`}
                >
                  <AlertTriangle size={12} />
                  <span>P1.3 • Thiếu tin (T03)</span>
                </button>
              )}
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1"
              >
                <span>P3 • Phân công xưởng (T06)</span>
              </button>
              <button
                onClick={() => setDetailModalTab("PRODUCTION")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                  detailModalTab === "PRODUCTION" ? "bg-red-600 text-white" : "text-text-muted hover:text-text"
                }`}
              >
                P4 • Phiếu cắm hoa (T07)
              </button>
              <button
                onClick={() => setDetailModalTab("QC")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                  detailModalTab === "QC" ? "bg-red-600 text-white" : "text-text-muted hover:text-text"
                }`}
              >
                P5 • AI QC Kiểm định (T14/T15)
              </button>
              <button
                onClick={() => setDetailModalTab("DELIVERY")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                  detailModalTab === "DELIVERY" ? "bg-red-600 text-white" : "text-text-muted hover:text-text"
                }`}
              >
                P6 • Giao hàng & POD (T21)
              </button>
              {selectedOrder.hasException && (
                <button
                  onClick={() => setDetailModalTab("EXCEPTION")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1 ${
                    detailModalTab === "EXCEPTION" ? "bg-red-600 text-white" : "text-red-700 bg-red-100"
                  }`}
                >
                  <AlertCircle size={12} />
                  <span>P8 • Sự cố phát sinh (T22)</span>
                </button>
              )}
              <button
                onClick={() => setDetailModalTab("CLOSURE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                  detailModalTab === "CLOSURE" ? "bg-red-600 text-white" : "text-text-muted hover:text-text"
                }`}
              >
                P7 • Nghiệm thu & SLA (T25)
              </button>
            </div>

            <div className="p-6">
              {detailModalTab === "SALES_INTAKE" && (
                <SalesOrderIntakeCard
                  orderCode={selectedOrder.orderCode}
                  source="Zalo Official Account"
                  customerName={selectedOrder.customerName}
                  customerTier={selectedOrder.customerTier}
                  recipientName={selectedOrder.recipientName}
                  recipientPhone={selectedOrder.recipientPhone}
                  deliveryAddress={selectedOrder.deliveryAddress}
                  deliveryTargetTime={selectedOrder.deliveryTargetTime}
                  productTitle={selectedOrder.productTitle}
                  sampleImageUrl={selectedOrder.sampleImageUrl}
                  unitPriceVnd={selectedOrder.unitPriceVnd || 750000}
                  priority="STANDARD"
                />
              )}

              {detailModalTab === "BRIEF" && (
                <PartnerProductCard
                  orderCode={selectedOrder.orderCode}
                  productTitle={selectedOrder.productTitle}
                  sampleImageUrl={selectedOrder.sampleImageUrl}
                  flowers={selectedOrder.flowers}
                  unitPriceVnd={selectedOrder.unitPriceVnd}
                  partnerPayoutVnd={selectedOrder.partnerPayoutVnd}
                  deliveryTargetTime={selectedOrder.deliveryTargetTime}
                  deliveryAddress={selectedOrder.deliveryAddress}
                  recipientName={selectedOrder.recipientName}
                  recipientPhone={selectedOrder.recipientPhone}
                  cardMessage={selectedOrder.cardMessage}
                  technicalNotes={selectedOrder.internalNote}
                  partnerName={selectedOrder.partnerName}
                  riskLevel={selectedOrder.riskLevel}
                  riskReason={selectedOrder.riskReason}
                  onAdvanceStage={() => handleAdvanceStage(selectedOrder.id)}
                />
              )}

              {detailModalTab === "MISSING_INFO" && selectedOrder.missingItems && (
                <MissingInfoRequestCard
                  orderCode={selectedOrder.orderCode}
                  salesPersonName="Lê Thùy Dương (Sales HN)"
                  missingItems={selectedOrder.missingItems}
                  onSendToSales={() => alert("Đã gửi thông báo nhắc nhở tới Zalo của nhân viên Sales!")}
                  onResolved={() => {
                    alert("Đã cập nhật thông tin thành công!")
                    setDetailModalTab("BRIEF")
                  }}
                />
              )}

              {detailModalTab === "PRODUCTION" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-surface-alt/50 p-3 rounded-xl border border-border">
                    <div className="text-xs">
                      <span className="text-text-muted">Xưởng thực hiện: </span>
                      <strong className="text-text font-bold">
                        {selectedOrder.partnerName || "Chưa phân công"}
                      </strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsAssignModalOpen(true)}
                        className="text-xs h-7 px-2.5 font-bold"
                      >
                        Phân công đối tác (T06)
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
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
                    flowers={selectedOrder.flowers}
                    cardMessage={selectedOrder.cardMessage}
                    internalNote={selectedOrder.internalNote}
                    partnerName={selectedOrder.partnerName}
                    onMarkReady={() => handleAdvanceStage(selectedOrder.id)}
                  />
                </div>
              )}

              {detailModalTab === "QC" && (
                <AIQCReportCard
                  orderCode={selectedOrder.orderCode}
                  qcStatus={selectedOrder.stage === "QUALITY_CHECK" ? "PENDING" : "PASSED"}
                  aiScore={selectedOrder.aiScore || 95}
                  aiCritique={selectedOrder.aiCritique || "Bó hoa đạt độ nở chuẩn, màu sắc hài hòa với mẫu thiết kế."}
                  finishedImageUrls={selectedOrder.finishedImageUrls || [selectedOrder.sampleImageUrl || ""]}
                  onApprove={() => handleAdvanceStage(selectedOrder.id)}
                />
              )}

              {detailModalTab === "DELIVERY" && (
                <DeliveryPODCard
                  orderCode={selectedOrder.orderCode}
                  shipperName="Lê Văn Hùng (AhaMove)"
                  shipperPhone="0933221100"
                  deliveryAddress={selectedOrder.deliveryAddress}
                  recipientName={selectedOrder.recipientName}
                  recipientPhone={selectedOrder.recipientPhone}
                  isDelivered={selectedOrder.stage === "DELIVERED" || selectedOrder.stage === "COMPLETED"}
                  podImageUrl={selectedOrder.podImageUrl || selectedOrder.sampleImageUrl}
                  onConfirmComplete={() => handleAdvanceStage(selectedOrder.id)}
                />
              )}

              {detailModalTab === "EXCEPTION" && selectedOrder.exceptionData && (
                <ExceptionResolutionCard
                  orderCode={selectedOrder.orderCode}
                  exceptionCode={selectedOrder.exceptionData.code}
                  type={selectedOrder.exceptionData.type}
                  severity={selectedOrder.exceptionData.severity}
                  description={selectedOrder.exceptionData.description}
                  resolutionPlan={selectedOrder.exceptionData.resolution}
                  status="IN_PROGRESS"
                  reportedAt="14:15 Hôm nay"
                  onResolve={() => {
                    alert("Đã giải quyết xong sự cố!")
                    setSelectedOrder(null)
                  }}
                />
              )}

              {detailModalTab === "CLOSURE" && (
                <OrderClosureLearningCard
                  orderCode={selectedOrder.orderCode}
                  recipeTitle={selectedOrder.productTitle}
                  partnerName={selectedOrder.partnerName || "Flora Xưởng Ba Đình"}
                  promisedDeliveryTime={selectedOrder.deliveryTargetTime}
                  actualDeliveryTime="16:40 (Sớm 20 phút)"
                  varianceMinutes={-20}
                  qcScore={selectedOrder.aiScore || 95}
                  initialPartnerRating={5}
                  onConfirmClosure={(review) => {
                    alert(`Đã hoàn tất nghiệm thu! Đánh giá đối tác: ${review.partnerRating} sao. Ghi chú: ${review.reviewNote}`)
                    handleAdvanceStage(selectedOrder.id)
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. Sales Order Intake Modal (T01 - Chặng P1) */}
      <SalesOrderIntakeModal
        isOpen={effectiveIsCreateOpen}
        onClose={handleCloseCreate}
        onSubmit={handleCreateOrder}
      />

      {/* 7. Order Planning Modal (T02 - Chặng P2) */}
      {selectedOrder && (
        <OrderPlanningModal
          isOpen={isPlanningModalOpen}
          order={selectedOrder}
          onClose={() => setIsPlanningModalOpen(false)}
          onConfirmPlan={handleConfirmPlan}
        />
      )}

      {/* 8. Partner Assignment Modal (T06 - Chặng P3) */}
      {selectedOrder && (
        <PartnerAssignmentModal
          isOpen={isAssignModalOpen}
          orderCode={selectedOrder.orderCode}
          recipeTitle={selectedOrder.productTitle}
          deliveryAddress={selectedOrder.deliveryAddress}
          deliveryTargetTime={selectedOrder.deliveryTargetTime}
          onClose={() => setIsAssignModalOpen(false)}
          onAssign={handleAssignPartner}
        />
      )}

      {/* 9. Production Update Modal (T08/T10 - Chặng P4) */}
      {selectedOrder && (
        <ProductionUpdateModal
          isOpen={isProductionUpdateModalOpen}
          orderCode={selectedOrder.orderCode}
          recipeTitle={selectedOrder.productTitle}
          currentProgressPercent={selectedOrder.stage === "IN_PRODUCTION" ? 50 : 0}
          sampleImageUrl={selectedOrder.sampleImageUrl}
          onClose={() => setIsProductionUpdateModalOpen(false)}
          onSubmitUpdate={handleProductionUpdateSubmit}
        />
      )}

      {/* 10. AI QC Inspection Modal (T14 - Chặng P5) */}
      {selectedOrder && (
        <AiQcInspectionModal
          isOpen={isQcModalOpen}
          order={selectedOrder}
          onClose={() => setIsQcModalOpen(false)}
          onApprovePass={handleApprovePassQC}
          onRequestRework={handleRequestRework}
        />
      )}

      {/* 11. Delivery Dispatch Modal (T20/T21 - Chặng P6) */}
      {selectedOrder && (
        <DeliveryDispatchModal
          isOpen={isDispatchModalOpen}
          order={selectedOrder}
          onClose={() => setIsDispatchModalOpen(false)}
          onConfirmDelivered={handleConfirmDelivered}
        />
      )}

      {/* 12. Order Closure & SLA Modal (T25/T26 - Chặng P7) */}
      {selectedOrder && (
        <OrderClosureModal
          isOpen={isClosureModalOpen}
          order={selectedOrder}
          onClose={() => setIsClosureModalOpen(false)}
          onArchiveOrder={handleArchiveOrder}
        />
      )}
    </div>
  )
}

