import { randomUUID } from "node:crypto"
import type { Prisma } from "@/generated/prisma/client"
import { conflict, notFound } from "@/core/http/errors"
import { prisma } from "@/core/tenancy/infra/prisma"
import { scopedData, scopedWhere, type TenantContext } from "@/core/tenancy"
import { recordAuditLog } from "@/modules/audit/use-cases/record-audit-log"
import type { DiscountPayload } from "../domain/discount-request"
import type { MessageRole } from "../domain/internal-message"

type Loose = Record<string, unknown>
const obj = (v: unknown): Loose => (v && typeof v === "object" ? (v as Loose) : {})

/** Xin giảm giá = tin nhắn loại DISCOUNT_REQUEST gửi Điều hành; quyết định = tin trả lời + cập nhật giá chốt. */
export class DiscountRepository {
  constructor(private readonly db = prisma) {}

  /** Tổng đơn làm gốc tính giảm: giá trước mọi lần giảm đã duyệt (duyệt lần sau thay lần trước). */
  async orderBase(ctx: TenantContext, orderId: string) {
    const o = await this.db.orders.findFirst({
      where: scopedWhere(ctx, { id: orderId, source: "BROCHURE" }),
      select: { id: true, code: true, status: true, total_vnd: true, paid_vnd: true, pricing_rule_ref: true },
    })
    if (!o) return null
    const manual = obj(obj(o.pricing_rule_ref).manualDiscount)
    const base = typeof manual.baseTotalVnd === "number" ? manual.baseTotalVnd : Number(o.total_vnd)
    return { id: o.id, code: o.code, status: o.status, totalVnd: Number(o.total_vnd), paidVnd: Number(o.paid_vnd), baseTotalVnd: base }
  }

  async createRequest(ctx: TenantContext, input: { orderId: string; senderRole: MessageRole; reason: string; payload: DiscountPayload }) {
    return this.db.greeting_messages.create({
      data: scopedData(ctx, {
        id: randomUUID(), order_id: input.orderId, step_key: "GENERAL", sender_id: ctx.userId, sender_role: input.senderRole,
        to_role: "ADMIN", kind: "DISCOUNT_REQUEST", body: input.reason, payload: input.payload as unknown as Prisma.InputJsonValue,
      }),
      select: { id: true, created_at: true },
    })
  }

  /**
   * Duyệt/từ chối một lần, nguyên tử: yêu cầu phải còn PENDING (khoá lạc quan trên payload),
   * tổng đơn chưa đổi từ lúc đọc; duyệt thì tổng mới không được thấp hơn số đã thu.
   */
  async decide(ctx: TenantContext, input: { requestId: string; approve: boolean; approvedVnd: number; approvedPercent?: number | undefined; note: string }) {
    return this.db.$transaction(async (tx) => {
      const req = await tx.greeting_messages.findFirst({
        where: scopedWhere(ctx, { id: input.requestId, kind: "DISCOUNT_REQUEST" }),
        select: { id: true, order_id: true, sender_id: true, body: true, payload: true },
      })
      if (!req || !req.order_id) throw notFound()
      const payload = obj(req.payload) as unknown as DiscountPayload
      if (payload.status !== "PENDING") throw conflict("Yêu cầu này đã được xử lý")
      const order = await tx.orders.findFirst({
        where: scopedWhere(ctx, { id: req.order_id }),
        select: { id: true, code: true, status: true, total_vnd: true, paid_vnd: true, pricing_rule_ref: true },
      })
      if (!order) throw notFound()
      if (input.approve && order.status === "CANCELLED") throw conflict("Đơn đã huỷ, không áp giảm giá được")

      const ref = obj(order.pricing_rule_ref)
      const prevManual = obj(ref.manualDiscount)
      const base = typeof prevManual.baseTotalVnd === "number" ? prevManual.baseTotalVnd : Number(order.total_vnd)
      const newTotal = base - input.approvedVnd
      if (input.approve) {
        if (newTotal < Number(order.paid_vnd)) throw conflict("Khách đã trả nhiều hơn giá sau giảm — hoàn tiền trước rồi mới giảm")
        const moved = await tx.orders.updateMany({
          where: { id: order.id, organization_id: ctx.organizationId, total_vnd: order.total_vnd, status: { not: "CANCELLED" } },
          data: {
            total_vnd: newTotal,
            balance_vnd: newTotal - Number(order.paid_vnd),
            pricing_rule_ref: {
              ...ref,
              manualDiscount: {
                baseTotalVnd: base, vnd: input.approvedVnd, ...(input.approvedPercent ? { percent: input.approvedPercent } : {}),
                reason: req.body, note: input.note || null, approvedBy: ctx.userId, approvedAt: new Date().toISOString(), requestId: req.id,
              },
            } as Prisma.InputJsonValue,
          },
        })
        if (moved.count === 0) throw conflict("Giá đơn vừa thay đổi, vui lòng tải lại")
      }

      const decided: DiscountPayload = {
        ...payload, status: input.approve ? "APPROVED" : "REJECTED", decidedBy: ctx.userId, decidedAt: new Date().toISOString(),
        ...(input.approve ? { approvedVnd: input.approvedVnd } : {}), ...(input.note ? { note: input.note } : {}),
      }
      const locked = await tx.greeting_messages.updateMany({
        where: { id: req.id, organization_id: ctx.organizationId, payload: { path: ["status"], equals: "PENDING" } },
        data: { payload: decided as unknown as Prisma.InputJsonValue },
      })
      if (locked.count === 0) throw conflict("Yêu cầu này đã được xử lý")

      await tx.greeting_messages.create({
        data: scopedData(ctx, {
          id: randomUUID(), order_id: order.id, step_key: "GENERAL", sender_id: ctx.userId, sender_role: "ADMIN",
          to_user_id: req.sender_id, kind: "DISCOUNT_DECISION", reply_to_id: req.id,
          body: input.note || (input.approve ? "Đã duyệt giảm giá" : "Chưa duyệt giảm giá"),
          payload: decided as unknown as Prisma.InputJsonValue,
        }),
      })
      await recordAuditLog(ctx, {
        action: input.approve ? "greeting_card.discount.approve" : "greeting_card.discount.reject",
        entityType: "order", entityId: order.id,
        before: { totalVnd: Number(order.total_vnd) },
        after: { totalVnd: input.approve ? newTotal : Number(order.total_vnd), approvedVnd: input.approve ? input.approvedVnd : 0, note: input.note || null },
      }, tx)
      return { orderId: order.id, orderCode: order.code, status: decided.status, totalVnd: input.approve ? newTotal : Number(order.total_vnd) }
    })
  }

  /** Yêu cầu đang chờ duyệt (cho Hộp việc của Điều hành). */
  async listPending(ctx: TenantContext) {
    return this.db.greeting_messages.findMany({
      where: scopedWhere(ctx, { kind: "DISCOUNT_REQUEST", payload: { path: ["status"], equals: "PENDING" } }),
      select: { id: true, order_id: true, sender_id: true, body: true, payload: true, created_at: true },
      orderBy: { created_at: "asc" },
      take: 100,
    })
  }
}
