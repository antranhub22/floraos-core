import { randomUUID } from "node:crypto"
import type { Prisma } from "@/generated/prisma/client"
import { conflict, notFound, validationFailed } from "@/core/http/errors"
import { prisma } from "@/core/tenancy/infra/prisma"
import { scopedData, scopedWhere, type TenantContext } from "@/core/tenancy"
import { recordAuditLog } from "@/modules/audit/use-cases/record-audit-log"
import {
  type CancellationPayload,
  type CancellationProposal,
  resolveRefundVnd,
  validateCancellationProposal,
} from "../domain/cancellation-request"
import type { MessageRole } from "../domain/internal-message"

type Loose = Record<string, unknown>
const obj = (v: unknown): Loose => (v && typeof v === "object" ? (v as Loose) : {})

export class CancellationRepository {
  constructor(private readonly db = prisma) {}

  async getOrderSummary(ctx: TenantContext, orderId: string) {
    const o = await this.db.orders.findFirst({
      where: scopedWhere(ctx, { id: orderId }),
      select: { id: true, code: true, status: true, total_vnd: true, paid_vnd: true, balance_vnd: true },
    })
    if (!o) return null
    return {
      id: o.id,
      code: o.code,
      status: o.status,
      totalVnd: Number(o.total_vnd),
      paidVnd: Number(o.paid_vnd),
      balanceVnd: Number(o.balance_vnd),
    }
  }

  /**
   * Tạo đề xuất Hủy/Hoàn tiền từ Sale hoặc Điều phối.
   * Lưu dưới dạng tin nhắn hệ thống loại CANCELLATION_REQUEST gửi tới to_role: ADMIN.
   */
  async createProposal(
    ctx: TenantContext,
    input: {
      orderId: string
      senderRole: MessageRole
      proposal: CancellationProposal
    }
  ) {
    const order = await this.getOrderSummary(ctx, input.orderId)
    if (!order) throw notFound()

    const err = validateCancellationProposal(input.proposal, order)
    if (err) throw validationFailed({ proposal: err })

    const payload: CancellationPayload = {
      ...input.proposal,
      status: "PENDING",
      orderId: order.id,
      orderCode: order.code,
      totalVnd: order.totalVnd,
      paidVnd: order.paidVnd,
      proposedBy: ctx.userId,
      proposedAt: new Date().toISOString(),
    }

    const msg = await this.db.greeting_messages.create({
      data: scopedData(ctx, {
        id: randomUUID(),
        order_id: order.id,
        step_key: "GENERAL",
        sender_id: ctx.userId,
        sender_role: input.senderRole,
        to_role: "ADMIN",
        kind: "CANCELLATION_REQUEST",
        body: input.proposal.reason,
        payload: payload as unknown as Prisma.InputJsonValue,
      }),
      select: { id: true, created_at: true },
    })

    await recordAuditLog(ctx, {
      action: "order.cancellation.propose",
      entityType: "order",
      entityId: order.id,
      before: { status: order.status },
      after: { proposal: payload },
    })

    return { id: msg.id, payload }
  }

  /**
   * Điều hành phê duyệt hoặc từ chối đề xuất Hủy/Hoàn tiền.
   */
  async decide(
    ctx: TenantContext,
    input: {
      requestId: string
      approve: boolean
      note: string
      actualRefundVnd?: number | undefined
    }
  ) {
    return this.db.$transaction(async (tx) => {
      const req = await tx.greeting_messages.findFirst({
        where: scopedWhere(ctx, { id: input.requestId, kind: "CANCELLATION_REQUEST" }),
        select: { id: true, order_id: true, sender_id: true, body: true, payload: true },
      })
      if (!req || !req.order_id) throw notFound()

      const payload = obj(req.payload) as unknown as CancellationPayload
      if (payload.status !== "PENDING") throw conflict("Yêu cầu này đã được xử lý trước đó")

      const order = await tx.orders.findFirst({
        where: scopedWhere(ctx, { id: req.order_id }),
        select: { id: true, code: true, status: true, total_vnd: true, paid_vnd: true, balance_vnd: true },
      })
      if (!order) throw notFound()

      if (input.approve && order.status === "CANCELLED") throw conflict("Đơn hàng này đã bị hủy trước đó.")

      const refundVnd = input.approve
        ? resolveRefundVnd(payload.type, Number(order.paid_vnd), payload.refundAmountVnd, input.actualRefundVnd)
        : 0

      if (input.approve && refundVnd > Number(order.paid_vnd)) {
        throw conflict(`Số tiền hoàn (${refundVnd.toLocaleString("vi-VN")}đ) vượt quá số tiền đã thu (${Number(order.paid_vnd).toLocaleString("vi-VN")}đ).`)
      }

      const now = new Date()

      // 1. Nếu duyệt và có hoàn tiền -> ghi sổ thu order_payments (kind: REFUND)
      if (input.approve && refundVnd > 0) {
        await tx.order_payments.create({
          data: scopedData(ctx, {
            id: randomUUID(),
            order_id: order.id,
            kind: "REFUND",
            amount_vnd: refundVnd,
            payment_method: "BANK_TRANSFER",
            collected_by: ctx.userId,
            collected_at: now,
            note: `Hoàn tiền theo đề xuất: ${input.note || payload.reason}`,
          }),
        })

        const newPaid = Number(order.paid_vnd) - refundVnd
        const newBalance = Number(order.total_vnd) - newPaid

        await tx.orders.updateMany({
          where: scopedWhere(ctx, { id: order.id }),
          data: {
            paid_vnd: newPaid,
            balance_vnd: newBalance,
          },
        })
      }

      // 2. Nếu duyệt hủy đơn (CANCEL_ONLY hoặc FULL_REFUND) -> chuyển trạng thái orders thành CANCELLED
      const shouldCancelOrder = input.approve && (payload.type === "CANCEL_ONLY" || payload.type === "FULL_REFUND")
      if (shouldCancelOrder) {
        await tx.orders.updateMany({
          where: scopedWhere(ctx, { id: order.id }),
          data: { status: "CANCELLED" },
        })

        await tx.order_events.create({
          data: scopedData(ctx, {
            id: randomUUID(),
            order_id: order.id,
            axis: "order",
            from_value: order.status,
            to_value: "CANCELLED",
            actor_id: ctx.userId,
            reason: `Đã duyệt đề xuất hủy đơn: ${input.note || payload.reason}`,
          }),
        })
      }

      // 3. Khóa trạng thái yêu cầu
      const decidedPayload: CancellationPayload = {
        ...payload,
        status: input.approve ? "APPROVED" : "REJECTED",
        decidedBy: ctx.userId,
        decidedAt: now.toISOString(),
        decidedNote: input.note || undefined,
        actualRefundVnd: refundVnd,
      }

      const updatedReq = await tx.greeting_messages.updateMany({
        where: { id: req.id, organization_id: ctx.organizationId, payload: { path: ["status"], equals: "PENDING" } },
        data: { payload: decidedPayload as unknown as Prisma.InputJsonValue },
      })
      if (updatedReq.count === 0) throw conflict("Yêu cầu này đã được xử lý bởi người khác")

      // 4. Tạo thông báo kết quả trả về cho người đề xuất
      await tx.greeting_messages.create({
        data: scopedData(ctx, {
          id: randomUUID(),
          order_id: order.id,
          step_key: "GENERAL",
          sender_id: ctx.userId,
          sender_role: "ADMIN",
          to_user_id: req.sender_id,
          kind: "CANCELLATION_DECISION",
          reply_to_id: req.id,
          body: input.note || (input.approve ? "Đã duyệt đề xuất hủy/hoàn tiền" : "Từ chối đề xuất hủy/hoàn tiền"),
          payload: decidedPayload as unknown as Prisma.InputJsonValue,
        }),
      })

      // 5. Ghi audit log
      await recordAuditLog(ctx, {
        action: input.approve ? "order.cancellation.approve" : "order.cancellation.reject",
        entityType: "order",
        entityId: order.id,
        before: { status: order.status, paidVnd: Number(order.paid_vnd) },
        after: {
          status: shouldCancelOrder ? "CANCELLED" : order.status,
          refundVnd,
          decided: decidedPayload,
        },
      }, tx)

      return {
        orderId: order.id,
        orderCode: order.code,
        status: decidedPayload.status,
        orderStatus: shouldCancelOrder ? "CANCELLED" : order.status,
        refundVnd,
      }
    })
  }

  /** Loại đề xuất đang chờ duyệt — route dùng để gác năng lực trước khi gọi `decide`. */
  async getPendingType(ctx: TenantContext, requestId: string): Promise<CancellationPayload["type"] | null> {
    const req = await this.db.greeting_messages.findFirst({
      where: scopedWhere(ctx, { id: requestId, kind: "CANCELLATION_REQUEST" }),
      select: { payload: true },
    })
    if (!req) return null
    const type = obj(req.payload).type
    return type === "CANCEL_ONLY" || type === "FULL_REFUND" || type === "PARTIAL_REFUND" ? type : null
  }

  /** Lấy danh sách đề xuất hủy/hoàn tiền đang chờ duyệt cho Điều hành */
  async listPending(ctx: TenantContext) {
    return this.db.greeting_messages.findMany({
      where: scopedWhere(ctx, { kind: "CANCELLATION_REQUEST", payload: { path: ["status"], equals: "PENDING" } }),
      select: { id: true, order_id: true, sender_id: true, body: true, payload: true, created_at: true },
      orderBy: { created_at: "asc" },
      take: 200,
    })
  }
}
