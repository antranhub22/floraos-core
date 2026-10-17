import { randomUUID } from "node:crypto"
import type { Prisma } from "@/generated/prisma/client"
import { conflict, notFound } from "@/core/http/errors"
import { prisma } from "@/core/tenancy/infra/prisma"
import { scopedData, scopedWhere, type TenantContext } from "@/core/tenancy"
import { recordAuditLog } from "@/modules/audit/use-cases/record-audit-log"
import {
  expectedFirstTransferVnd,
  needsReportedPaymentCheck,
  type ReportedPaymentCheck,
  type ReportedPaymentOutcome,
} from "../domain/reported-payment-check"

type Loose = Record<string, unknown>
const obj = (v: unknown): Loose => (v && typeof v === "object" ? (v as Loose) : {})
const INCOMING = ["DEPOSIT", "BALANCE"] as const
/** Đơn huỷ quá lâu thì không nhắc nữa — tránh quét cả lịch sử. */
const LOOKBACK_MS = 60 * 24 * 60 * 60 * 1000

/** Đơn đã huỷ khi khách đã báo chuyển khoản mà tiệm chưa ghi nhận tiền — Điều hành kiểm và chốt. */
export class ReportedPaymentCheckRepository {
  constructor(private readonly db = prisma) {}

  async listPending(ctx: TenantContext, saleId: string | null, now = new Date(), take = 200) {
    const rows = await this.db.orders.findMany({
      where: scopedWhere(ctx, {
        source: "BROCHURE",
        status: "CANCELLED" as const,
        paid_vnd: 0,
        updated_at: { gte: new Date(now.getTime() - LOOKBACK_MS) },
        greeting_sessions: {
          some: {
            OR: [{ status: "PAYMENT_REPORTED" as const }, { payment_proof_asset_id: { not: null } }],
            ...(saleId ? { sale_id: saleId } : {}),
          },
        },
      }),
      select: {
        id: true, code: true, total_vnd: true, paid_vnd: true, pricing_rule_ref: true, updated_at: true,
        customer: { select: { name: true } },
        payments: { where: { kind: { in: [...INCOMING] } }, select: { id: true } },
        greeting_sessions: { select: { id: true, status: true, customer_name: true, payment_proof_asset_id: true }, take: 1 },
      },
      orderBy: { updated_at: "desc" },
      take,
    })
    return rows
      .filter((o) => needsReportedPaymentCheck({
        status: "CANCELLED",
        paidVnd: Number(o.paid_vnd),
        incomingPayments: o.payments.length,
        sessionStatus: o.greeting_sessions[0]?.status,
        hasPaymentProof: Boolean(o.greeting_sessions[0]?.payment_proof_asset_id),
        pricingRuleRef: o.pricing_rule_ref,
      }))
      .map((o) => ({
        orderId: o.id,
        code: o.code,
        sessionId: o.greeting_sessions[0]?.id ?? null,
        customerName: o.customer?.name ?? o.greeting_sessions[0]?.customer_name ?? "Khách",
        expectedVnd: expectedFirstTransferVnd(Number(o.total_vnd), o.pricing_rule_ref),
        proofAssetId: o.greeting_sessions[0]?.payment_proof_asset_id ?? null,
        cancelledAt: o.updated_at,
      }))
  }

  /**
   * Chốt kết quả kiểm. Đã hoàn tiền → ghi vào sổ thu cả khoản khách đã chuyển lẫn khoản hoàn (cùng số
   * tiền, kèm ảnh bill) để lịch sử thu khớp sao kê; số đã thu của đơn vẫn là 0. Hai người bấm cùng lúc
   * → chỉ một bên ghi.
   */
  async resolve(ctx: TenantContext, orderId: string, input: { outcome: ReportedPaymentOutcome; amountVnd: number; note: string }) {
    return this.db.$transaction(async (tx) => {
      const order = await tx.orders.findFirst({
        where: scopedWhere(ctx, { id: orderId, source: "BROCHURE" }),
        select: {
          id: true, status: true, paid_vnd: true, pricing_rule_ref: true, updated_at: true,
          payments: { where: { kind: { in: [...INCOMING] } }, select: { id: true } },
          greeting_sessions: { select: { status: true, payment_proof_asset_id: true }, take: 1 },
        },
      })
      if (!order) throw notFound()
      const pending = needsReportedPaymentCheck({
        status: order.status,
        paidVnd: Number(order.paid_vnd),
        incomingPayments: order.payments.length,
        sessionStatus: order.greeting_sessions[0]?.status,
        hasPaymentProof: Boolean(order.greeting_sessions[0]?.payment_proof_asset_id),
        pricingRuleRef: order.pricing_rule_ref,
      })
      if (!pending) throw conflict("Việc này đã được xử lý trước đó")

      const now = new Date()
      const note = input.note.trim() || undefined
      const amountVnd = input.outcome === "REFUNDED" ? Math.round(input.amountVnd) : 0
      const check: ReportedPaymentCheck = { outcome: input.outcome, amountVnd, by: ctx.userId, at: now.toISOString(), note }

      const moved = await tx.orders.updateMany({
        where: scopedWhere(ctx, { id: order.id, updated_at: order.updated_at }),
        data: { pricing_rule_ref: { ...obj(order.pricing_rule_ref), reportedPaymentCheck: check } as unknown as Prisma.InputJsonValue },
      })
      if (moved.count === 0) throw conflict("Đơn hàng vừa được cập nhật, vui lòng tải lại")

      if (amountVnd > 0) {
        const base = { order_id: order.id, amount_vnd: amountVnd, payment_method: "BANK_TRANSFER", collected_by: ctx.userId, collected_at: now }
        await tx.order_payments.createMany({
          data: [
            scopedData(ctx, {
              ...base, id: randomUUID(), kind: "DEPOSIT" as const,
              evidence_asset_id: order.greeting_sessions[0]?.payment_proof_asset_id ?? null,
              note: "Khách chuyển khoản trước khi đơn bị huỷ (ghi nhận khi hoàn tiền)",
            }),
            scopedData(ctx, { ...base, id: randomUUID(), kind: "REFUND" as const, note: `Hoàn tiền đơn đã huỷ${note ? `: ${note}` : ""}` }),
          ],
        })
      }

      await recordAuditLog(ctx, {
        action: "order.cancellation.reported_payment_checked",
        entityType: "order",
        entityId: order.id,
        before: { paidVnd: Number(order.paid_vnd), reportedPaymentCheck: null },
        after: { reportedPaymentCheck: check },
      }, tx)

      return { orderId: order.id, outcome: input.outcome, amountVnd }
    })
  }
}
