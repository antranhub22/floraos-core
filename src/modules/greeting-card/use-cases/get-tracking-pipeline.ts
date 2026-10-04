import type { TenantContext } from "@/core/tenancy"
import { TrackingPipelineRepository } from "../infra/tracking-pipeline-repository"
import {
  PIPELINE_STEPS,
  ROLE_LABELS,
  type InternalNoteMessage,
  type InternalNoteRole,
  type TrackingPipelineItem,
  type TrackingPipelineStepId,
  type TrackingStepState,
} from "../domain/tracking-pipeline-types"

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
  if (session.status === "SELECTED" || session.status === "BROWSING") return "STEP_2_CHOOSING"
  return "STEP_1_OPENED"
}

export async function getTrackingPipeline(
  ctx: TenantContext,
  repo = new TrackingPipelineRepository()
): Promise<TrackingPipelineItem[]> {
  const [orders, activeSessions] = await Promise.all([
    repo.listBrochureOrders(ctx),
    repo.listActiveSessions(ctx),
  ])

  const stepMap = new Map(PIPELINE_STEPS.map((s) => [s.id, s]))

  // 1. Process Orders
  const orderItems: TrackingPipelineItem[] = orders.map((order) => {
    const session = order.greeting_sessions[0]
    const snapshot = (session?.product_snapshot as any) || (order.items[0]?.metadata as any) || {}
    const deliveryAddress = order.delivery_address as any
    const deliveryWindow = order.delivery_window as any

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
      cardMessage: order.card_message ?? null,
      productName: snapshot?.name || order.items[0]?.description || "Mẫu hoa Thẻ chào",
      productPrice: Number(snapshot?.price || order.items[0]?.unit_price_vnd || 0),
      productImageUrl: snapshot?.imageUrl || null,
      totalVnd: Number(order.total_vnd || 0),
      paidVnd: Number(order.paid_vnd || 0),
      balanceVnd: Number(order.balance_vnd || 0),
      currentStepId,
      currentStepTitle: currentStepDef.title,
      steps,
      notes,
      lastActiveAt: order.updated_at.toISOString(),
      createdAt: order.created_at.toISOString(),
    }
  })

  // 2. Process Sessions without order
  const sessionItems: TrackingPipelineItem[] = activeSessions.map((session) => {
    const snapshot = (session.product_snapshot as any) || {}
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
        const meta = (e.metadata as any) || {}
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
      cardMessage: null,
      productName: snapshot?.name || "Chưa chốt mẫu",
      productPrice: Number(snapshot?.price || 0),
      productImageUrl: snapshot?.imageUrl || null,
      totalVnd: Number(snapshot?.price || 0),
      paidVnd: 0,
      balanceVnd: Number(snapshot?.price || 0),
      currentStepId,
      currentStepTitle: currentStepDef.title,
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
