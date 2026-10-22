import { randomUUID } from "node:crypto"
import type { Prisma } from "@/generated/prisma/client"
import { conflict, notFound } from "@/core/http/errors"
import { prisma } from "@/core/tenancy/infra/prisma"
import { scopedData, scopedWhere, type TenantContext } from "@/core/tenancy"
import { recordAuditLog } from "@/modules/audit/use-cases/record-audit-log"
import {
  COORDINATOR_REJECT_ORIGIN, COORDINATOR_REJECT_REASON_PREFIX, canAutoApproveForOrder, isCoordinatorRejectProposal, needsFollowUp,
  type CancellationPayload,
} from "../domain/cancellation-request"
import { moneyAfterRefund } from "../domain/refund-ledger"
import { CancellationRepository } from "./cancellation-repository"

type Loose = Record<string, unknown>
const obj = (v: unknown): Loose => (v && typeof v === "object" ? (v as Loose) : {})

/**
 * Đề xuất huỷ do Điều phối từ chối nhận đơn mà Điều hành không phản hồi kịp hạn: hệ thống tự duyệt
 * huỷ, rồi giao lại cho Điều hành phần hệ thống không tự làm được (chuyển hoàn tiền, liên hệ khách).
 * Việc đó nằm trong Hộp việc tới khi Điều hành đánh dấu xong — lịch sử ở order_events + audit log.
 */
export class CancellationFollowUpRepository {
  constructor(private readonly db = prisma, private readonly cancellations = new CancellationRepository(db)) {}

  /**
   * Đề xuất "Điều phối từ chối nhận đơn" còn PENDING, tạo trước `before` (bộ quét lọc kỹ hạn theo từng tiệm).
   * CHỈ loại từ chối nhận đơn (`payload.origin`, bản ghi cũ theo tiền tố lý do) — đề xuất huỷ / hoàn tiền
   * thường của Điều phối luôn chờ người duyệt. Bỏ qua đề xuất của đơn không thể tự huỷ (đã huỷ, đã giao,
   * đang giao) để chúng không chiếm chỗ mỗi phút; đọc theo trang, có trần số trang.
   */
  async listExpiredCoordinatorRejections(before: Date, take = 50, pageSize = 200, maxPages = 5) {
    const picked: Array<{ id: string; organization_id: string; order_id: string | null; created_at: Date; organization: { settings: Prisma.JsonValue } }> = []
    let cursor: string | undefined
    for (let page = 0; page < maxPages && picked.length < take; page += 1) {
      const rows = await this.db.greeting_messages.findMany({
        where: {
          kind: "CANCELLATION_REQUEST",
          sender_role: "COORDINATOR",
          created_at: { lte: before },
          AND: [
            { payload: { path: ["status"], equals: "PENDING" } },
            {
              OR: [
                { payload: { path: ["origin"], equals: COORDINATOR_REJECT_ORIGIN } },
                { payload: { path: ["reason"], string_starts_with: COORDINATOR_REJECT_REASON_PREFIX } },
              ],
            },
          ],
        },
        select: { id: true, organization_id: true, order_id: true, created_at: true, payload: true, organization: { select: { settings: true } } },
        orderBy: [{ created_at: "asc" }, { id: "asc" }],
        take: pageSize,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      })
      if (rows.length === 0) break
      cursor = rows[rows.length - 1]?.id
      const orderIds = [...new Set(rows.flatMap((r) => (r.order_id ? [r.order_id] : [])))]
      const orders = orderIds.length
        ? await this.db.orders.findMany({ where: { id: { in: orderIds } }, select: { id: true, organization_id: true, status: true, delivery_status: true } })
        : []
      const byId = new Map(orders.map((o) => [o.id, o]))
      for (const r of rows) {
        const order = r.order_id ? byId.get(r.order_id) : undefined
        // Đơn phải cùng tổ chức với đề xuất — không bao giờ huỷ chéo tiệm
        if (!order || order.organization_id !== r.organization_id) continue
        if (!isCoordinatorRejectProposal(r.payload)) continue
        if (!canAutoApproveForOrder({ status: order.status, deliveryStatus: order.delivery_status })) continue
        picked.push({ id: r.id, organization_id: r.organization_id, order_id: r.order_id, created_at: r.created_at, organization: r.organization })
        if (picked.length >= take) break
      }
      if (rows.length < pageSize) break
    }
    return picked
  }

  /** Tự duyệt huỷ do quá hạn — không ghi sổ hoàn, đánh dấu việc chờ Điều hành, báo Điều hành. */
  async autoApproveExpired(organizationId: string, requestId: string, timeoutMinutes: number) {
    const sysCtx: TenantContext = {
      organizationId,
      workspaceId: "system",
      userId: "system:cancellation-timeout",
      branchId: null,
      capabilities: new Set(["R6", "R10", "R11"]),
    }
    return this.cancellations.decide(sysCtx, {
      requestId,
      approve: true,
      note: `Hệ thống tự động phê duyệt hủy đơn do Điều hành không phản hồi trong thời gian quy định (${timeoutMinutes} phút).`,
      autoTimeoutMinutes: timeoutMinutes,
    })
  }

  /** Đơn đã huỷ / đề xuất hoàn đã duyệt còn chờ chuyển tiền hoàn — danh sách "Cần hoàn tiền" ở Hộp việc. */
  async listPending(ctx: TenantContext) {
    const rows = await this.db.greeting_messages.findMany({
      where: scopedWhere(ctx, {
        kind: "CANCELLATION_REQUEST",
        payload: { path: ["followUp", "status"], equals: "PENDING" },
      }),
      select: { id: true, order_id: true, body: true, payload: true, created_at: true },
      orderBy: { created_at: "asc" },
      take: 200,
    })
    return rows.map((r) => ({ ...r, payload: obj(r.payload) as unknown as CancellationPayload })).filter((r) => needsFollowUp(r.payload))
  }

  /**
   * Khoản hoàn đang chờ ở "Cần hoàn tiền" theo từng đơn (đơn → số tiền). Đơn có khoản này không được ghi
   * hoàn trực tiếp ở sổ thu — nếu không cùng một khoản hoàn bị ghi hai lần.
   */
  async pendingRefundsByOrder(ctx: TenantContext, orderIds: readonly string[]): Promise<Map<string, number>> {
    if (orderIds.length === 0) return new Map()
    const rows = await this.db.greeting_messages.findMany({
      where: scopedWhere(ctx, {
        kind: "CANCELLATION_REQUEST",
        order_id: { in: [...new Set(orderIds)] },
        payload: { path: ["followUp", "status"], equals: "PENDING" },
      }),
      select: { order_id: true, payload: true },
    })
    const due = new Map<string, number>()
    for (const r of rows) {
      const payload = obj(r.payload) as unknown as CancellationPayload
      if (!r.order_id || !needsFollowUp(payload) || !payload.followUp) continue
      due.set(r.order_id, (due.get(r.order_id) ?? 0) + Math.max(0, Math.round(payload.followUp.refundDueVnd)))
    }
    return due
  }

  /**
   * Điều hành xác nhận đã xử lý xong: nếu còn tiền phải hoàn thì lúc này mới ghi khoản REFUND vào
   * sổ thu (tiền đã thật sự chuyển). Hai người bấm cùng lúc → chỉ một bên ghi.
   */
  async complete(ctx: TenantContext, requestId: string, note: string) {
    return this.db.$transaction(async (tx) => {
      const req = await tx.greeting_messages.findFirst({
        where: scopedWhere(ctx, { id: requestId, kind: "CANCELLATION_REQUEST" }),
        select: { id: true, order_id: true, payload: true },
      })
      if (!req || !req.order_id) throw notFound()
      const payload = obj(req.payload) as unknown as CancellationPayload
      if (!needsFollowUp(payload) || !payload.followUp) throw conflict("Việc này đã được xử lý trước đó")
      const refundVnd = Math.max(0, Math.round(payload.followUp.refundDueVnd))

      const order = await tx.orders.findFirst({
        where: scopedWhere(ctx, { id: req.order_id }),
        select: { id: true, total_vnd: true, paid_vnd: true, balance_vnd: true },
      })
      if (!order) throw notFound()
      if (refundVnd > Number(order.paid_vnd)) throw conflict("Số tiền hoàn vượt quá số tiền đã thu, vui lòng kiểm tra sổ thu")

      const now = new Date()
      const doneNote = note.trim() || undefined
      if (refundVnd > 0) {
        await tx.order_payments.create({
          data: scopedData(ctx, {
            id: randomUUID(), order_id: order.id, kind: "REFUND", amount_vnd: refundVnd, payment_method: "BANK_TRANSFER",
            collected_by: ctx.userId, collected_at: now, note: `Hoàn tiền ${payload.autoApproved ? "đơn tự huỷ" : "theo đề xuất đã duyệt"}${doneNote ? `: ${doneNote}` : ""}`,
          }),
        })
        // Hoàn không tạo nợ phải thu — cùng luật sổ thu (`domain/refund-ledger.ts`)
        const after = moneyAfterRefund({ paidVnd: Number(order.paid_vnd), balanceVnd: Number(order.balance_vnd) }, refundVnd)
        const moved = await tx.orders.updateMany({
          where: scopedWhere(ctx, { id: order.id, paid_vnd: order.paid_vnd }),
          data: { paid_vnd: after.paidVnd, balance_vnd: after.balanceVnd },
        })
        if (moved.count === 0) throw conflict("Đơn hàng vừa được cập nhật thanh toán, vui lòng tải lại")
      }

      const done: CancellationPayload = {
        ...payload,
        actualRefundVnd: refundVnd,
        followUp: { ...payload.followUp, status: "DONE", doneBy: ctx.userId, doneAt: now.toISOString(), note: doneNote },
      }
      const updated = await tx.greeting_messages.updateMany({
        where: { id: req.id, organization_id: ctx.organizationId, payload: { path: ["followUp", "status"], equals: "PENDING" } },
        data: { payload: done as unknown as Prisma.InputJsonValue },
      })
      if (updated.count === 0) throw conflict("Việc này đã được xử lý bởi người khác")

      await recordAuditLog(ctx, {
        action: "order.cancellation.follow_up_done",
        entityType: "order",
        entityId: order.id,
        before: { paidVnd: Number(order.paid_vnd), followUp: payload.followUp },
        after: { refundVnd, followUp: done.followUp },
      }, tx)

      return { orderId: order.id, refundVnd }
    })
  }
}
