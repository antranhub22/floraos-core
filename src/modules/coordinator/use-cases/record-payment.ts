/**
 * Use-case: sổ thu (ĐP-4a, 26/09/2026, PO D2). Mỗi lần thu hoặc hoàn tiền là
 * MỘT DÒNG `order_payments`; `orders.paid_vnd`/`balance_vnd` được cập nhật
 * TRONG CÙNG giao dịch (§2.14 mục 2 — không ai sửa tay hai con số này).
 *
 * `paymentStatus` KHÔNG được ghi ở đây — nó là trường suy ra, tính lúc đọc
 * (`present-coordinator-order.ts`, §2.15.7), không lưu.
 *
 * Quyền: `kind = REFUND` đòi R10 (trần cứng điều hành) — kiểm ở route
 * (`payments/route.ts`), vì route mới biết `body.kind` trước khi gọi vào
 * đây. Use-case chỉ chặn logic nghiệp vụ (không hoàn quá số đã thu).
 */

import { AppError } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy/tenant-context"
import { CoordinatorRepository } from "../infra/coordinator-repository"
import type { CoordinatorOrderView } from "./present-coordinator-order"
import { audit, getOrderView, loadOrderOrThrow, runCoordinatorTx } from "./shared"

export interface RecordPaymentInput {
  kind: "DEPOSIT" | "BALANCE" | "REFUND"
  amountVnd: number
  paymentMethod?: string | undefined
  reference?: string | undefined
  evidenceAssetId?: string | undefined
  note?: string | undefined
}

export interface OrderPaymentView {
  id: string
  kind: "DEPOSIT" | "BALANCE" | "REFUND"
  amountVnd: number
  paymentMethod: string | null
  reference: string | null
  evidenceAssetId: string | null
  collectedBy: string
  collectedAt: string
  note: string | null
}

export async function recordCoordinatorPayment(
  ctx: TenantContext,
  orderIdOrCode: string,
  input: RecordPaymentInput
): Promise<CoordinatorOrderView> {
  const orderId = await runCoordinatorTx(async (tx) => {
    const repo = new CoordinatorRepository(tx)
    const row = await loadOrderOrThrow(ctx, repo, orderIdOrCode)
    const paidBefore = Number(row.paid_vnd)
    const totalVnd = Number(row.total_vnd)

    const delta = input.kind === "REFUND" ? -input.amountVnd : input.amountVnd
    const paidAfter = paidBefore + delta
    if (input.kind === "REFUND" && paidAfter < 0) {
      throw new AppError("UNPROCESSABLE_ENTITY", "Không thể hoàn quá số tiền đã thu.")
    }
    const balanceAfter = totalVnd - paidAfter

    const payment = await repo.recordPayment(
      ctx,
      row.id,
      {
        kind: input.kind,
        amountVnd: input.amountVnd,
        paymentMethod: input.paymentMethod?.trim() || null,
        reference: input.reference?.trim() || null,
        evidenceAssetId: input.evidenceAssetId ?? null,
        note: input.note?.trim() || null,
      },
      paidAfter,
      balanceAfter
    )
    await audit(
      ctx,
      tx,
      input.kind === "REFUND" ? "coordinator.order.payment.refund" : "coordinator.order.payment.record",
      row.id,
      { paidVnd: paidBefore, balanceVnd: totalVnd - paidBefore },
      { paidVnd: paidAfter, balanceVnd: balanceAfter, paymentId: payment.id, kind: input.kind, amountVnd: input.amountVnd }
    )
    return row.id
  })
  return getOrderView(ctx, orderId)
}

export async function listCoordinatorPayments(ctx: TenantContext, orderIdOrCode: string): Promise<OrderPaymentView[]> {
  const repo = new CoordinatorRepository()
  const row = await loadOrderOrThrow(ctx, repo, orderIdOrCode)
  const rows = await repo.listPayments(ctx, row.id)
  return rows.map((p) => ({
    id: p.id,
    kind: p.kind,
    amountVnd: Number(p.amount_vnd),
    paymentMethod: p.payment_method,
    reference: p.reference,
    evidenceAssetId: p.evidence_asset_id,
    collectedBy: p.collected_by,
    collectedAt: p.collected_at.toISOString(),
    note: p.note,
  }))
}
