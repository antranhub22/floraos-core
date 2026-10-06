import type { TenantContext } from "@/core/tenancy"
import { notFound } from "@/core/http/errors"
import { getCurrentOrganization } from "@/modules/organization/use-cases/get-current-organization"
import { TrackingPipelineRepository } from "../infra/tracking-pipeline-repository"
import { GreetingMessageRepository } from "../infra/greeting-message-repository"
import { parseStepSla } from "../domain/step-sla"
import { EVENT_ENTERS_STEP, EVENT_LABEL, stepSegments, type TimelineEvent } from "../domain/tracking-timeline"
import { paginate } from "../domain/tracking-views"
import { visibleTarget } from "./internal-messages"

const event = (kind: string, at: Date, actorId: string | null = null, note: string | null = null): TimelineEvent => ({
  at: at.toISOString(), kind, label: EVENT_LABEL[kind] ?? kind, entersStep: EVENT_ENTERS_STEP[kind] ?? null, actorId, note,
})

/**
 * Dòng thời gian của MỘT đơn/link: sự kiện (phân trang) + các đoạn ở từng bước so với thời gian chuẩn.
 * Cùng phạm vi xem với mọi view (sale "chỉ khách của mình" → 404 với đơn người khác).
 */
export async function getTrackingTimeline(
  ctx: TenantContext,
  ref: { orderId?: string | undefined; sessionId?: string | undefined },
  page: { limit: number; cursor?: string | undefined },
  now = new Date(),
  repo = new TrackingPipelineRepository(),
) {
  await visibleTarget(ctx, ref, new GreetingMessageRepository())
  const src = await repo.timelineSource(ctx, ref)
  if (!src) throw notFound()

  const events: TimelineEvent[] = []
  const s = src.session
  if (s) {
    const copied = s.events.some((e) => e.event_type === "LINK_COPIED")
    // Link riêng: đồng hồ bước 1 tính từ lúc sao chép gửi khách (như bảng theo dõi), không phải lúc tạo
    events.push({ ...event("LINK_CREATED", s.created_at), entersStep: copied ? null : "STEP_1_OPENED" })
    for (const e of s.events) {
      if (e.event_type === "SUBMIT_ORDER" && src.order) continue // lấy mốc từ chính đơn bên dưới
      const meta = e.metadata as Record<string, unknown> | null
      events.push(event(e.event_type, e.created_at, typeof meta?.["copiedBy"] === "string" ? (meta["copiedBy"] as string) : null))
    }
  }
  if (src.order) {
    events.push(event("SUBMIT_ORDER", src.order.created_at))
    for (const e of src.order.events) {
      if (e.axis === "internal_note") continue
      const kind = e.reason === "BROCHURE_PAYMENT_CONFIRMED" ? "PAYMENT_FIRST" : e.to_value === "CANCELLED" ? "ORDER_CANCELLED" : e.reason ?? e.to_value
      events.push(event(kind, e.created_at, e.actor_id, kind === "ORDER_CANCELLED" ? e.reason : null))
    }
    for (const p of src.order.payments) {
      const amount = `${Number(p.amount_vnd).toLocaleString("vi-VN")} đ`
      events.push({ ...event(p.kind === "REFUND" ? "REFUND" : "PAYMENT", p.collected_at, p.collected_by), note: amount })
    }
  }
  events.sort((a, b) => a.at.localeCompare(b.at) || a.kind.localeCompare(b.kind))

  const sla = parseStepSla((await getCurrentOrganization(ctx))?.settings)
  return {
    orderId: src.order?.id ?? null,
    sessionId: s?.id ?? null,
    segments: stepSegments(events, sla, now),
    events: paginate(events, page.limit, page.cursor),
  }
}
