import { resolveSaleScope } from "./order-scope"
import type { TenantContext } from "@/core/tenancy"
import { TrackingPipelineRepository } from "../infra/tracking-pipeline-repository"
import { getCurrentOrganization } from "@/modules/organization/use-cases/get-current-organization"
import { parseStepSla, stuckOf } from "../domain/step-sla"
import { channelLabel } from "../domain/catalog-channel"
import { orderStepStartedAt, sessionStepStartedAt } from "../domain/pipeline-clock"
import { linkFactsOf, pendingLinkTitle, type LinkFacts } from "../domain/link-ownership"
import { defaultOwnerOf } from "./share-links"
import {
  PIPELINE_STEPS,
  ROLE_LABELS,
  type InternalNoteMessage,
  type InternalNoteRole,
  type TrackingPipelineItem,
  type TrackingPipelineStepId,
  type TrackingStepState,
} from "../domain/tracking-pipeline-types"

/** Trường JSON lỏng (ảnh chụp mẫu, địa chỉ, khung giờ, metadata ghi chú) — đọc phòng thủ, không `any`. */
type LooseJson = {
  name?: string
  price?: number
  imageUrl?: string
  recipientName?: string
  phone?: string
  street?: string
  date?: string
  timeSlot?: string
  zone?: string
  role?: string
  stepKey?: string
  senderName?: string
  content?: string
}

function loose(value: unknown): LooseJson {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as LooseJson) : {}
}

function resolveOrderStep(order: {
  status: string
  production_status: string
  delivery_status: string
  total_vnd: number | unknown
  paid_vnd: number | unknown
  sessionStatus?: string | null | undefined
}): TrackingPipelineStepId {
  const total = Number(order.total_vnd || 0)
  const paid = Number(order.paid_vnd || 0)

  if (order.delivery_status === "DELIVERED" || order.status === "COMPLETED") {
    return "STEP_9_COMPLETED"
  }
  if (order.delivery_status === "DELIVERING" || order.delivery_status === "DISPATCHED") {
    return "STEP_8_DELIVERING"
  }
  if (order.production_status === "READY" || order.production_status === "DONE") {
    return "STEP_7_READY_QC"
  }
  if (order.production_status === "ARRANGING") {
    return "STEP_6_ARRANGING"
  }
  if (order.status === "CONFIRMED" || (paid > 0 && paid >= total)) {
    return "STEP_5_PAYMENT_CONFIRMED"
  }
  if (order.sessionStatus === "PAYMENT_REPORTED" || paid > 0) {
    return "STEP_4_PAYMENT_PENDING"
  }
  return "STEP_3_FILLING_FORM"
}

function resolveSessionStep(session: {
  status: string
  opened_at?: Date | null | undefined
}): TrackingPipelineStepId {
  if (session.status === "PAYMENT_REPORTED") return "STEP_4_PAYMENT_PENDING"
  if (session.status === "ORDER_SUBMITTED") return "STEP_3_FILLING_FORM"
  // Đã mở link = xong bước "mở link", đang chọn mẫu
  if (session.status === "SELECTED" || session.status === "BROWSING" || session.status === "OPENED") return "STEP_2_CHOOSING"
  return "STEP_1_OPENED"
}

export async function getTrackingPipeline(
  ctx: TenantContext,
  repo = new TrackingPipelineRepository()
): Promise<TrackingPipelineItem[]> {
  const saleId = await resolveSaleScope(ctx)
  const [orders, activeSessions, org, fallbackOwner] = await Promise.all([
    repo.listBrochureOrders(ctx, saleId),
    repo.listActiveSessions(ctx, saleId),
    getCurrentOrganization(ctx),
    defaultOwnerOf(ctx.organizationId),
  ])
  // Đơn/link cũ (trước khi có nút "Sao chép link mang tên bạn") → người phụ trách mặc định
  const ownerOf = (id: string | undefined) => (id === "public" ? fallbackOwner ?? undefined : id)
  const sla = parseStepSla(org?.settings)
  const now = new Date()
  const channels = await repo.orderChannels(ctx, orders.map((o) => o.id))
  // Link riêng → "Link riêng của sale"; link sao chép → kênh lúc sao chép; link cũ → kênh `?kenh=` của đơn
  const channelOf = (facts: LinkFacts | null, orderId?: string) =>
    facts?.kind === "PERSONAL" ? "Link riêng của sale"
      : facts?.kind === "SHARED" ? `Link bộ sưu tập · ${channelLabel(facts.shareChannel ?? "")}`
      : `Link chung · ${channelLabel(orderId ? channels.get(orderId) ?? "" : "")}`

  const stepMap = new Map(PIPELINE_STEPS.map((s) => [s.id, s]))
  const saleIds = [
    ...orders.map((o) => ownerOf(o.greeting_sessions[0]?.sale_id) ?? ""),
    ...activeSessions.map((s) => ownerOf(s.sale_id) ?? ""),
  ]
  const names = await repo.memberNames(ctx, saleIds)
  const saleNameOf = (id: string | undefined) => {
    const owner = ownerOf(id)
    return !owner ? "Chưa gán" : names.get(owner) ?? "Nhân viên đã rời"
  }

  // 1. Process Orders
  const orderItems: TrackingPipelineItem[] = orders.map((order) => {
    const session = order.greeting_sessions[0]
    const snapshot = session?.product_snapshot ? loose(session.product_snapshot) : loose(order.items[0]?.metadata)
    const deliveryAddress = loose(order.delivery_address)
    const deliveryWindow = loose(order.delivery_window)

    const currentStepId = resolveOrderStep({
      status: order.status,
      production_status: order.production_status,
      delivery_status: order.delivery_status,
      total_vnd: order.total_vnd,
      paid_vnd: order.paid_vnd,
      sessionStatus: session?.status,
    })

    const currentStepDef = stepMap.get(currentStepId) ?? PIPELINE_STEPS[0]!
    const currentIndex = currentStepDef.orderIndex

    // Extract notes from order_events where axis === 'internal_note'
    const notes: InternalNoteMessage[] = (order.events || [])
      .filter((e) => e.axis === "internal_note")
      .map((e) => {
        const role = (e.to_value as InternalNoteRole) || "SALE"
        const stepKey = (e.from_value as TrackingPipelineStepId) || "GENERAL"
        const step = stepMap.get(stepKey as TrackingPipelineStepId)
        return {
          id: e.id,
          orderId: order.id,
          sessionId: session?.id || null,
          stepKey,
          stepTitle: step ? step.title : "Lưu ý chung",
          role,
          roleLabel: ROLE_LABELS[role] || "Nhân viên",
          senderName: e.actor_id || "Nhân viên",
          content: e.reason || "",
          createdAt: e.created_at.toISOString(),
        }
      })

    const steps: TrackingStepState[] = PIPELINE_STEPS.map((def) => {
      let status: "completed" | "current" | "pending" = "pending"
      if (def.orderIndex < currentIndex) status = "completed"
      else if (def.orderIndex === currentIndex) status = "current"

      const noteCount = notes.filter((n) => n.stepKey === def.id).length
      return {
        id: def.id,
        title: def.title,
        shortTitle: def.shortTitle,
        roleResponsible: def.roleResponsible,
        orderIndex: def.orderIndex,
        status,
        noteCount,
      }
    })

    return {
      id: order.id,
      type: "ORDER",
      orderId: order.id,
      sessionId: session?.id || "",
      orderCode: order.code,
      sendCode: session?.send_code || order.code,
      catalogName: session?.catalog?.name || "Bộ sưu tập Thẻ chào",
      customerName: order.customer?.name || deliveryAddress?.recipientName || "Khách hàng",
      customerPhone: order.customer?.phone || deliveryAddress?.phone || "",
      recipientName: deliveryAddress?.recipientName ?? null,
      recipientPhone: deliveryAddress?.phone ?? null,
      deliveryAddress: deliveryAddress?.street ?? null,
      deliveryDate: deliveryWindow?.date ?? null,
      deliveryTimeSlot: deliveryWindow?.timeSlot ?? null,
      deliveryZone: deliveryAddress?.zone ?? null,
      saleName: saleNameOf(session?.sale_id),
      cardMessage: order.card_message ?? null,
      productName: snapshot?.name || order.items[0]?.description || "Mẫu hoa Thẻ chào",
      productPrice: Number(snapshot?.price || order.items[0]?.unit_price_vnd || 0),
      productImageUrl: snapshot?.imageUrl || null,
      totalVnd: Number(order.total_vnd || 0),
      paidVnd: Number(order.paid_vnd || 0),
      balanceVnd: Number(order.balance_vnd || 0),
      currentStepId,
      // Đơn đã gửi mà chưa chuyển khoản vẫn ở bước 3 — gọi đúng tên việc đang chờ
      currentStepTitle: currentStepId === "STEP_3_FILLING_FORM" ? "Đã đặt đơn — chờ khách chuyển khoản" : currentStepDef.title,
      stepStartedAt: orderStepStartedAt(order),
      stuck: stuckOf({ currentStepId, stepStartedAt: orderStepStartedAt(order) }, sla, now),
      saleId: ownerOf(session?.sale_id) ?? null,
      channel: channelOf(session ? linkFactsOf(session) : null, order.id),
      linkKind: session ? linkFactsOf(session).kind : "LEGACY",
      copiedAt: session ? linkFactsOf(session).copiedAt : null,
      expiresAt: null,
      steps,
      notes,
      lastActiveAt: order.updated_at.toISOString(),
      createdAt: order.created_at.toISOString(),
    }
  })

  // 2. Process Sessions without order
  const sessionItems: TrackingPipelineItem[] = activeSessions.map((session) => {
    const facts = linkFactsOf(session)
    // Link riêng chưa sao chép = chưa gửi khách: chưa tính giờ "khách chưa mở"
    const notSent = session.status === "CREATED" && facts.kind === "PERSONAL" && !facts.copiedAt
    const startedAt = session.status === "CREATED" && facts.copiedAt ? facts.copiedAt : sessionStepStartedAt(session)
    const snapshot = loose(session.product_snapshot)
    const currentStepId = resolveSessionStep({
      status: session.status,
      opened_at: session.opened_at,
    })
    const currentStepDef = stepMap.get(currentStepId) ?? PIPELINE_STEPS[0]!
    const currentIndex = currentStepDef.orderIndex

    // Extract notes from greeting_journey_events with event_type === 'INTERNAL_NOTE'
    const notes: InternalNoteMessage[] = (session.events || [])
      .filter((e) => e.event_type === "INTERNAL_NOTE")
      .map((e) => {
        const meta = loose(e.metadata)
        const role = (meta.role as InternalNoteRole) || "SALE"
        const stepKey = (meta.stepKey as TrackingPipelineStepId) || "GENERAL"
        const step = stepMap.get(stepKey as TrackingPipelineStepId)
        return {
          id: e.id,
          orderId: null,
          sessionId: session.id,
          stepKey,
          stepTitle: step ? step.title : "Lưu ý chung",
          role,
          roleLabel: ROLE_LABELS[role] || "Nhân viên",
          senderName: meta.senderName || "Nhân viên",
          content: meta.content || "",
          createdAt: e.created_at.toISOString(),
        }
      })

    const steps: TrackingStepState[] = PIPELINE_STEPS.map((def) => {
      let status: "completed" | "current" | "pending" = "pending"
      if (def.orderIndex < currentIndex) status = "completed"
      else if (def.orderIndex === currentIndex) status = "current"

      const noteCount = notes.filter((n) => n.stepKey === def.id).length
      return {
        id: def.id,
        title: def.title,
        shortTitle: def.shortTitle,
        roleResponsible: def.roleResponsible,
        orderIndex: def.orderIndex,
        status,
        noteCount,
      }
    })

    return {
      id: `session-${session.id}`,
      type: "SESSION",
      orderId: null,
      sessionId: session.id,
      orderCode: null,
      sendCode: session.send_code,
      catalogName: session.catalog?.name || "Bộ sưu tập Thẻ chào",
      customerName: session.customer_name || "Khách đang xem mẫu",
      customerPhone: session.customer_phone || "",
      recipientName: null,
      recipientPhone: null,
      deliveryAddress: null,
      deliveryDate: null,
      saleName: saleNameOf(session.sale_id),
      cardMessage: null,
      productName: snapshot?.name || "Chưa chốt mẫu",
      productPrice: Number(snapshot?.price || 0),
      productImageUrl: snapshot?.imageUrl || null,
      totalVnd: Number(snapshot?.price || 0),
      paidVnd: 0,
      balanceVnd: Number(snapshot?.price || 0),
      currentStepId,
      currentStepTitle: pendingLinkTitle({ status: session.status, copiedAt: facts.copiedAt, kind: facts.kind }),
      stepStartedAt: startedAt,
      stuck: notSent ? null : stuckOf({ currentStepId, stepStartedAt: startedAt }, sla, now),
      saleId: ownerOf(session.sale_id) ?? null,
      channel: channelOf(facts),
      linkKind: facts.kind,
      copiedAt: facts.copiedAt,
      expiresAt: session.expires_at?.toISOString() ?? null,
      steps,
      notes,
      lastActiveAt: session.last_active_at.toISOString(),
      createdAt: session.created_at.toISOString(),
    }
  })

  // Combine and sort by lastActiveAt descending
  return [...orderItems, ...sessionItems].sort(
    (a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
  )
}
