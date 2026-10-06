import type { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/core/tenancy/infra/prisma"
import { scopedWhere, type TenantContext } from "@/core/tenancy"
import { conflict, notFound, unprocessable } from "@/core/http/errors"
import { recordAuditLog } from "@/modules/audit/use-cases/record-audit-log"
import { cancelBlocker, quoteBlocker } from "../domain/brochure-payment-policy"

export interface IncomingPayment {
  amountVnd: number
  method: "BANK_TRANSFER" | "CASH" | "OTHER"
  reference: string
  note: string
}

export interface PaymentResult {
  orderId: string
  orderCode: string
  status: string
  paidVnd: number
  balanceVnd: number
  kind: "DEPOSIT" | "BALANCE"
  paymentId: string
}

/**
 * Sổ thu đơn Thẻ chào: thu (cọc / phần còn lại), hoàn tiền, huỷ đơn. Mỗi
 * thao tác là MỘT giao dịch cập nhật `orders.paid_vnd/balance_vnd` có điều
 * kiện theo số đã thu đọc được (khoá lạc quan) — hai người bấm cùng lúc,
 * hay webhook ngân hàng gửi trùng, không ghi thu hai lần. Có audit log.
 */
export class BrochurePaymentRepository {
  constructor(private readonly db = prisma) {}

  private async loadOrder(ctx: TenantContext, orderId: string) {
    const order = await this.db.orders.findFirst({ where: scopedWhere(ctx, { id: orderId, source: "BROCHURE" }) })
    if (!order) throw notFound()
    return order
  }

  async recordIncomingPayment(ctx: TenantContext, orderId: string, input: IncomingPayment): Promise<PaymentResult> {
    const order = await this.loadOrder(ctx, orderId)
    if (order.status === "CANCELLED") throw conflict("Đơn hàng đã huỷ, không thể ghi nhận thanh toán")
    const total = Number(order.total_vnd)
    const paidBefore = Number(order.paid_vnd)
    const balanceBefore = total - paidBefore
    if (total <= 0) throw conflict("Đơn đang chờ báo giá — hãy báo giá trước khi thu tiền")
    if (balanceBefore <= 0) throw conflict("Đơn hàng đã được thanh toán đủ")
    if (!Number.isInteger(input.amountVnd) || input.amountVnd <= 0) throw unprocessable("Số tiền thu không hợp lệ")
    if (input.amountVnd > balanceBefore) {
      throw unprocessable(`Số tiền vượt quá phần còn phải thu (${balanceBefore.toLocaleString("vi-VN")} đ)`)
    }

    const paidAfter = paidBefore + input.amountVnd
    const kind = paidAfter < total ? "DEPOSIT" : "BALANCE"
    const nextStatus = order.status === "DRAFT" ? "CONFIRMED" : order.status

    return this.db.$transaction(async (tx) => {
      const moved = await tx.orders.updateMany({
        where: { id: order.id, organization_id: ctx.organizationId, paid_vnd: order.paid_vnd, status: { not: "CANCELLED" } },
        data: { paid_vnd: paidAfter, balance_vnd: total - paidAfter, status: nextStatus },
      })
      if (moved.count === 0) throw conflict("Đơn hàng vừa được cập nhật thanh toán, vui lòng tải lại")

      const payment = await tx.order_payments.create({
        data: {
          organization_id: ctx.organizationId,
          order_id: order.id,
          kind,
          amount_vnd: input.amountVnd,
          payment_method: input.method,
          reference: input.reference,
          collected_by: ctx.userId,
          note: input.note,
        },
      })

      if (order.status === "DRAFT") {
        await tx.order_events.create({
          data: {
            organization_id: ctx.organizationId,
            order_id: order.id,
            axis: "order",
            from_value: "DRAFT",
            to_value: "CONFIRMED",
            reason: "BROCHURE_PAYMENT_CONFIRMED",
            actor_id: ctx.userId,
          },
        })
      }
      if (order.source_session_id) {
        await tx.greeting_sessions.updateMany({
          where: { id: order.source_session_id, organization_id: ctx.organizationId },
          data: { status: "COMPLETED" },
        })
        await tx.greeting_journey_events.create({
          data: {
            organization_id: ctx.organizationId,
            session_id: order.source_session_id,
            event_type: "ADMIN_CONFIRMED_PAYMENT",
            metadata: { paymentId: payment.id, amount: input.amountVnd, kind, confirmedBy: ctx.userId },
          },
        })
      }
      await recordAuditLog(
        ctx,
        {
          action: "greeting_card.order.payment.record",
          entityType: "order",
          entityId: order.id,
          before: { paidVnd: paidBefore, status: order.status },
          after: { paidVnd: paidAfter, status: nextStatus, paymentId: payment.id, kind, reference: input.reference },
        },
        tx
      )

      return {
        orderId: order.id,
        orderCode: order.code,
        status: nextStatus,
        paidVnd: paidAfter,
        balanceVnd: total - paidAfter,
        kind,
        paymentId: payment.id,
      }
    })
  }

  async refund(ctx: TenantContext, orderId: string, input: { amountVnd: number; reason: string }) {
    const order = await this.loadOrder(ctx, orderId)
    const paidBefore = Number(order.paid_vnd)
    if (!Number.isInteger(input.amountVnd) || input.amountVnd <= 0) throw unprocessable("Số tiền hoàn không hợp lệ")
    if (input.amountVnd > paidBefore) throw unprocessable("Không thể hoàn quá số tiền đã thu")
    const paidAfter = paidBefore - input.amountVnd
    const total = Number(order.total_vnd)

    return this.db.$transaction(async (tx) => {
      const moved = await tx.orders.updateMany({
        where: { id: order.id, organization_id: ctx.organizationId, paid_vnd: order.paid_vnd },
        data: { paid_vnd: paidAfter, balance_vnd: total - paidAfter },
      })
      if (moved.count === 0) throw conflict("Đơn hàng vừa được cập nhật thanh toán, vui lòng tải lại")
      const payment = await tx.order_payments.create({
        data: {
          organization_id: ctx.organizationId,
          order_id: order.id,
          kind: "REFUND",
          amount_vnd: input.amountVnd,
          payment_method: "BANK_TRANSFER",
          reference: `REFUND-${order.code}`,
          collected_by: ctx.userId,
          note: input.reason,
        },
      })
      await recordAuditLog(
        ctx,
        {
          action: "greeting_card.order.payment.refund",
          entityType: "order",
          entityId: order.id,
          before: { paidVnd: paidBefore },
          after: { paidVnd: paidAfter, paymentId: payment.id, amountVnd: input.amountVnd, reason: input.reason },
        },
        tx
      )
      return { orderId: order.id, orderCode: order.code, paidVnd: paidAfter, refundedVnd: input.amountVnd }
    })
  }

  /**
   * Cửa hàng báo giá trọn gói cho đơn đặt mẫu chưa niêm yết giá (tổng đang
   * là 0). Chỉ ghi khi tổng vẫn là 0 — hai người báo giá cùng lúc thì một
   * người nhận 409.
   */
  async setQuote(ctx: TenantContext, orderId: string, totalVnd: number, reason: string | null = null) {
    const order = await this.loadOrder(ctx, orderId)
    const blocker = quoteBlocker({ status: order.status, totalVnd: Number(order.total_vnd) }, totalVnd)
    if (blocker) throw (order.status === "CANCELLED" || Number(order.total_vnd) > 0 ? conflict(blocker) : unprocessable(blocker))
    const paid = Number(order.paid_vnd)
    const ref = (order.pricing_rule_ref ?? {}) as Record<string, unknown>

    return this.db.$transaction(async (tx) => {
      const moved = await tx.orders.updateMany({
        where: { id: order.id, organization_id: ctx.organizationId, total_vnd: 0, status: { not: "CANCELLED" } },
        data: {
          total_vnd: totalVnd,
          balance_vnd: totalVnd - paid,
          pricing_rule_ref: { ...ref, awaitingQuote: false, quotedTotalVnd: totalVnd, quotedAt: new Date().toISOString(), ...(reason ? { quoteReason: reason } : {}) } as Prisma.InputJsonValue,
          internal_note: [order.internal_note, `[Báo giá] ${totalVnd.toLocaleString("vi-VN")} đ${reason ? ` — ${reason}` : ""}`].filter(Boolean).join("\n"),
        },
      })
      if (moved.count === 0) throw conflict("Đơn hàng vừa được báo giá, vui lòng tải lại")
      await recordAuditLog(
        ctx,
        {
          action: "greeting_card.order.quote",
          entityType: "order",
          entityId: order.id,
          before: { totalVnd: 0 },
          after: { totalVnd, ...(reason ? { reason } : {}) },
        },
        tx
      )
      return { orderId: order.id, orderCode: order.code, totalVnd, balanceVnd: totalVnd - paid }
    })
  }

  /** Huỷ đơn + trả lại mã giảm giá đã dùng. Tiền đã thu KHÔNG tự hoàn — hoàn bằng thao tác riêng (R10). */
  async cancel(ctx: TenantContext, orderId: string, reason: string) {
    const order = await this.loadOrder(ctx, orderId)
    const blocker = cancelBlocker({ status: order.status, deliveryStatus: order.delivery_status })
    if (blocker) throw conflict(blocker)

    return this.db.$transaction(async (tx) => {
      const moved = await tx.orders.updateMany({
        where: { id: order.id, organization_id: ctx.organizationId, status: order.status },
        data: {
          status: "CANCELLED",
          internal_note: [order.internal_note, `[Huỷ] ${reason}`].filter(Boolean).join("\n"),
        },
      })
      if (moved.count === 0) throw conflict("Đơn hàng vừa thay đổi trạng thái, vui lòng tải lại")
      await tx.vouchers.updateMany({
        where: { organization_id: ctx.organizationId, order_id: order.id },
        data: { is_used: false, used_at: null, order_id: null },
      })
      await tx.order_events.create({
        data: {
          organization_id: ctx.organizationId,
          order_id: order.id,
          axis: "order",
          from_value: order.status,
          to_value: "CANCELLED",
          reason,
          actor_id: ctx.userId,
        },
      })
      await recordAuditLog(
        ctx,
        {
          action: "greeting_card.order.cancel",
          entityType: "order",
          entityId: order.id,
          before: { status: order.status },
          after: { status: "CANCELLED", reason },
        },
        tx
      )
      return { orderId: order.id, orderCode: order.code, status: "CANCELLED" as const, paidVnd: Number(order.paid_vnd) }
    })
  }
}
