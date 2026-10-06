import { prisma } from "@/core/tenancy/infra/prisma"
import { scopedWhere, type TenantContext } from "@/core/tenancy"
import { log } from "@/core/observability/log"
import { BROWSING_EVENT_TYPES } from "../domain/customer-journey-events"

/** Bỏ các bước lướt mẫu vụn của khách — bảng theo dõi chỉ cần mốc nghiệp vụ. */
const MILESTONE_EVENTS = { event_type: { notIn: [...BROWSING_EVENT_TYPES] } }

/**
 * Cửa sổ của bảng theo dõi / Hộp việc. Bản cũ lấy 100 đơn + 50 link MỚI NHẤT bất kể trạng thái:
 * mùa lễ nhiều đơn thì đơn cũ đang kẹt rơi khỏi bảng và không ai được báo. Nay lấy MỌI đơn/link
 * còn việc (chưa xong, chưa huỷ, link còn hạn) + đơn hoàn tất trong 7 ngày; trần chỉ là lưới an toàn.
 */
export const PIPELINE_DONE_DAYS = 7
export const PIPELINE_IDLE_LINK_DAYS = 30
export const PIPELINE_MAX_ROWS = 2000

const ORDER_SELECT = {
  id: true, code: true, status: true, production_status: true, delivery_status: true,
  total_vnd: true, paid_vnd: true, balance_vnd: true, card_message: true,
  delivery_address: true, delivery_window: true, created_at: true, updated_at: true,
  customer: { select: { name: true, phone: true } },
  items: { take: 1, select: { metadata: true, description: true, unit_price_vnd: true } },
  payments: { select: { collected_at: true } },
  events: { select: { axis: true, created_at: true } },
  qc_records: { select: { created_at: true } },
  greeting_sessions: {
    take: 1,
    select: {
      id: true, send_code: true, sale_id: true, status: true, product_snapshot: true,
      catalog: { select: { id: true, name: true, code: true } },
      events: { where: MILESTONE_EVENTS, select: { event_type: true, created_at: true, metadata: true }, orderBy: { created_at: "asc" as const } },
    },
  },
} as const

export class TrackingPipelineRepository {
  constructor(private readonly db = prisma) {}

  async listBrochureOrders(ctx: TenantContext, saleId: string | null = null, now = new Date()) {
    const doneSince = new Date(now.getTime() - PIPELINE_DONE_DAYS * 86_400_000)
    const rows = await this.db.orders.findMany({
      // Đơn đã huỷ không còn bước nào để theo dõi; đơn hoàn tất chỉ giữ 7 ngày gần nhất
      where: scopedWhere(ctx, {
        source: "BROCHURE",
        NOT: { status: "CANCELLED" as const },
        OR: [{ status: { not: "COMPLETED" as const }, delivery_status: { not: "DELIVERED" as const } }, { updated_at: { gte: doneSince } }],
        ...(saleId ? { greeting_sessions: { some: { sale_id: saleId } } } : {}),
      }),
      select: ORDER_SELECT,
      orderBy: { created_at: "desc" },
      take: PIPELINE_MAX_ROWS,
    })
    if (rows.length >= PIPELINE_MAX_ROWS) {
      log.warn("greeting_card.pipeline_cap_reached", { organizationId: ctx.organizationId, feature: "greeting-card", kind: "orders" })
    }
    return rows
  }

  async listActiveSessions(ctx: TenantContext, saleId: string | null = null, now = new Date()) {
    const idleSince = new Date(now.getTime() - PIPELINE_IDLE_LINK_DAYS * 86_400_000)
    const rows = await this.db.greeting_sessions.findMany({
      // Link chưa có đơn, chưa thu hồi, còn hạn, có hoạt động trong 30 ngày
      where: scopedWhere(ctx, {
        order_id: null,
        revoked_at: null,
        last_active_at: { gte: idleSince },
        OR: [{ expires_at: null }, { expires_at: { gt: now } }],
        ...(saleId ? { sale_id: saleId } : {}),
      }),
      include: {
        catalog: { select: { id: true, name: true, code: true } },
        events: { where: MILESTONE_EVENTS, select: { event_type: true, created_at: true, metadata: true }, orderBy: { created_at: "asc" } },
      },
      orderBy: { last_active_at: "desc" },
      take: PIPELINE_MAX_ROWS,
    })
    if (rows.length >= PIPELINE_MAX_ROWS) {
      log.warn("greeting_card.pipeline_cap_reached", { organizationId: ctx.organizationId, feature: "greeting-card", kind: "links" })
    }
    return rows
  }

  /**
   * Nguồn dòng thời gian của MỘT đơn (hoặc một link chưa có đơn) — chỉ trong tổ chức; sale bị giới
   * hạn phạm vi được kiểm ở use-case. Đọc riêng một đối tượng, không đọc lại cả tập theo dõi.
   */
  async timelineSource(ctx: TenantContext, ref: { orderId?: string | undefined; sessionId?: string | undefined }) {
    const sessionSelect = {
      id: true, sale_id: true, created_at: true, send_code: true,
      events: { where: MILESTONE_EVENTS, select: { event_type: true, created_at: true, metadata: true }, orderBy: { created_at: "asc" as const } },
    }
    if (ref.orderId) {
      const order = await this.db.orders.findFirst({
        where: scopedWhere(ctx, { id: ref.orderId, source: "BROCHURE" }),
        select: {
          id: true, code: true, created_at: true,
          events: { select: { axis: true, from_value: true, to_value: true, reason: true, actor_id: true, created_at: true }, orderBy: { created_at: "asc" } },
          payments: { select: { kind: true, amount_vnd: true, collected_at: true, collected_by: true, note: true }, orderBy: { collected_at: "asc" } },
          greeting_sessions: { take: 1, select: sessionSelect },
        },
      })
      return order ? { order, session: order.greeting_sessions[0] ?? null } : null
    }
    if (ref.sessionId) {
      const session = await this.db.greeting_sessions.findFirst({ where: scopedWhere(ctx, { id: ref.sessionId }), select: { ...sessionSelect, order_id: true } })
      return session ? { order: null, session } : null
    }
    return null
  }

  /** Kênh chia sẻ (`?kenh=`) của đơn đặt từ link bộ sưu tập công khai — theo sự kiện ORDER. */
  async orderChannels(ctx: TenantContext, orderIds: string[]): Promise<Map<string, string>> {
    if (orderIds.length === 0) return new Map()
    const rows = await this.db.greeting_catalog_events.findMany({
      where: scopedWhere(ctx, { event_type: "ORDER", order_id: { in: orderIds } }),
      select: { order_id: true, channel: true },
    })
    return new Map(rows.filter((r) => r.order_id).map((r) => [r.order_id as string, r.channel]))
  }

  /** Tên hiển thị của các thành viên tổ chức (sale phụ trách link) — chỉ người thuộc đúng tổ chức. */
  async memberNames(ctx: TenantContext, userIds: string[]): Promise<Map<string, string>> {
    const ids = [...new Set(userIds)].filter(Boolean)
    if (ids.length === 0) return new Map()
    const rows = await this.db.memberships.findMany({
      where: scopedWhere(ctx, { user_id: { in: ids } }),
      select: { user_id: true, user: { select: { name: true, email: true } } },
    })
    return new Map(rows.map((r) => [r.user_id, r.user.name?.trim() || r.user.email.split("@")[0] || "Nhân viên"]))
  }
}
