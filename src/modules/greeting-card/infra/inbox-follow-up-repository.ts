import type { Prisma } from "@/generated/prisma/client"
import { conflict, notFound } from "@/core/http/errors"
import { prisma } from "@/core/tenancy/infra/prisma"
import { scopedWhere, type TenantContext } from "@/core/tenancy"
import { recordAuditLog } from "@/modules/audit/use-cases/record-audit-log"
import { dismissalOf } from "../domain/dismissal-policy"
import { CUSTOMER_NOTICE_LOOKBACK_MS, needsSaleCustomerNotice, type SaleNotified } from "../domain/inbox-follow-ups"

type Loose = Record<string, unknown>
const obj = (v: unknown): Loose => (v && typeof v === "object" && !Array.isArray(v) ? (v as Loose) : {})

/** `sale_id` của link khi chưa có Sale phụ trách (link bộ sưu tập công khai). */
export const UNASSIGNED_SALE_IDS = ["public", ""] as const

/**
 * Dữ liệu cho việc bổ sung của Hộp việc: nhận đơn chưa có Sale, báo khách khi đơn bị huỷ.
 * Mọi truy vấn trong tổ chức của người gọi; đơn tổ chức khác → 404.
 */
export class InboxFollowUpRepository {
  constructor(private readonly db = prisma) {}

  /** Đơn đang xử lý chưa có Sale phụ trách — cho Sale "chỉ khách của mình" (bảng theo dõi của họ lọc mất). */
  async listUnassignedOpenOrders(ctx: TenantContext, take = 100) {
    const rows = await this.db.orders.findMany({
      where: scopedWhere(ctx, {
        source: "BROCHURE",
        status: { notIn: ["COMPLETED" as const, "CANCELLED" as const] },
        delivery_status: { not: "DELIVERED" as const },
        greeting_sessions: { some: { sale_id: { in: [...UNASSIGNED_SALE_IDS] } } },
      }),
      select: {
        id: true, code: true, pricing_rule_ref: true,
        customer: { select: { name: true } },
        items: { take: 1, select: { description: true } },
        greeting_sessions: { take: 1, select: { id: true, send_code: true, customer_name: true } },
      },
      orderBy: { created_at: "desc" },
      take,
    })
    return rows
      .filter((o) => dismissalOf(obj(o.pricing_rule_ref).dismissal)?.status !== "APPROVED")
      .map((o) => ({
        id: o.id, orderId: o.id, orderCode: o.code, sessionId: o.greeting_sessions[0]?.id ?? "",
        sendCode: o.greeting_sessions[0]?.send_code ?? o.code,
        customerName: o.customer?.name ?? o.greeting_sessions[0]?.customer_name ?? "Khách hàng",
        productName: o.items[0]?.description ?? "Mẫu hoa Thẻ chào", productImageUrl: null,
      }))
  }

  /** Đơn đã huỷ của các Sale này cần báo khách (lọc theo quy tắc `needsSaleCustomerNotice`). */
  async listCancelledToNotify(ctx: TenantContext, saleIds: readonly string[], now = new Date(), take = 200) {
    if (saleIds.length === 0) return []
    const rows = await this.db.orders.findMany({
      where: scopedWhere(ctx, {
        source: "BROCHURE",
        status: "CANCELLED" as const,
        updated_at: { gte: new Date(now.getTime() - CUSTOMER_NOTICE_LOOKBACK_MS) },
        greeting_sessions: { some: { sale_id: { in: [...saleIds] } } },
      }),
      select: {
        id: true, code: true, pricing_rule_ref: true,
        customer: { select: { name: true } },
        events: { where: { axis: "order", to_value: "CANCELLED" }, select: { actor_id: true, created_at: true }, orderBy: { created_at: "desc" }, take: 1 },
        greeting_sessions: { take: 1, select: { id: true, customer_name: true } },
      },
      orderBy: { updated_at: "desc" },
      take,
    })
    return rows.flatMap((o) => {
      const ev = o.events[0]
      if (!ev || !needsSaleCustomerNotice({ cancelledAt: ev.created_at, cancelledBy: ev.actor_id, pricingRuleRef: o.pricing_rule_ref }, now)) return []
      return [{
        orderId: o.id, code: o.code, sessionId: o.greeting_sessions[0]?.id ?? null,
        customerName: o.customer?.name ?? o.greeting_sessions[0]?.customer_name ?? "Khách", cancelledAt: ev.created_at,
      }]
    })
  }

  /**
   * Sale nhận đơn chưa có người phụ trách: chỉ ghi khi link của đơn còn `public`/rỗng (một câu lệnh có điều kiện —
   * hai người bấm cùng lúc thì một bên nhận, bên kia 409). Người đã nhận bấm lại → không đổi gì.
   */
  async claim(ctx: TenantContext, orderId: string): Promise<{ orderId: string; saleId: string; alreadyMine: boolean }> {
    return this.db.$transaction(async (tx) => {
      const order = await tx.orders.findFirst({
        where: scopedWhere(ctx, { id: orderId, source: "BROCHURE" }),
        select: { id: true, status: true, greeting_sessions: { select: { id: true, sale_id: true } } },
      })
      if (!order) throw notFound()
      if (order.status === "CANCELLED" || order.status === "COMPLETED") throw conflict("Đơn đã huỷ hoặc đã hoàn tất, không cần nhận")
      if (order.greeting_sessions.length === 0) throw conflict("Đơn không đi từ link chào khách nên không có Sale phụ trách để nhận")
      const moved = await tx.greeting_sessions.updateMany({
        where: scopedWhere(ctx, { order_id: order.id, sale_id: { in: [...UNASSIGNED_SALE_IDS] } }),
        data: { sale_id: ctx.userId },
      })
      if (moved.count === 0) {
        const owners = await tx.greeting_sessions.findMany({ where: scopedWhere(ctx, { order_id: order.id }), select: { sale_id: true } })
        if (owners.some((s) => s.sale_id === ctx.userId)) return { orderId: order.id, saleId: ctx.userId, alreadyMine: true }
        throw conflict("Đơn đã có Sale khác nhận")
      }
      await recordAuditLog(ctx, {
        action: "greeting_card.order.claim",
        entityType: "order",
        entityId: order.id,
        before: { saleIds: order.greeting_sessions.map((s) => s.sale_id) },
        after: { saleId: ctx.userId },
      }, tx)
      return { orderId: order.id, saleId: ctx.userId, alreadyMine: false }
    })
  }

  /** Sale xác nhận đã báo khách đơn bị huỷ — lưu `pricing_rule_ref.saleNotifiedCustomer`, khoá lạc quan. */
  async markCustomerNotified(ctx: TenantContext, orderId: string, now = new Date()): Promise<SaleNotified> {
    return this.db.$transaction(async (tx) => {
      const order = await tx.orders.findFirst({
        where: scopedWhere(ctx, { id: orderId, source: "BROCHURE" }),
        select: { id: true, status: true, pricing_rule_ref: true, updated_at: true },
      })
      if (!order) throw notFound()
      if (order.status !== "CANCELLED") throw conflict("Đơn chưa bị huỷ")
      const ref = obj(order.pricing_rule_ref)
      if (obj(ref.saleNotifiedCustomer).at) throw conflict("Đã ghi nhận báo khách cho đơn này rồi")
      const notified: SaleNotified = { by: ctx.userId, at: now.toISOString() }
      const moved = await tx.orders.updateMany({
        where: scopedWhere(ctx, { id: order.id, updated_at: order.updated_at }),
        data: { pricing_rule_ref: { ...ref, saleNotifiedCustomer: notified } as unknown as Prisma.InputJsonValue },
      })
      if (moved.count === 0) throw conflict("Đơn hàng vừa được cập nhật, vui lòng tải lại")
      await recordAuditLog(ctx, {
        action: "greeting_card.order.customer_notified",
        entityType: "order",
        entityId: order.id,
        before: { saleNotifiedCustomer: null },
        after: { saleNotifiedCustomer: notified },
      }, tx)
      return notified
    })
  }
}
