import type { TenantContext } from "@/core/tenancy"
import { OrderVatRepository } from "../infra/order-vat-repository"
import { normalizeInvoiceInfo, type VatChange, type VatInvoiceInfo } from "../domain/order-vat"
import { assertOrderInScope } from "./order-scope"

export async function getOrderVat(ctx: TenantContext, orderId: string, repo = new OrderVatRepository()) {
  await assertOrderInScope(ctx, orderId)
  return repo.get(ctx, orderId)
}

/** Bật/tắt VAT (8% hoặc 10%) và lưu thông tin xuất hoá đơn. Tổng & còn lại do máy chủ tính lại. */
export async function setOrderVat(
  ctx: TenantContext,
  orderId: string,
  input: VatChange & Partial<Record<keyof VatInvoiceInfo, string | null | undefined>>,
  repo = new OrderVatRepository()
) {
  await assertOrderInScope(ctx, orderId)
  return repo.set(ctx, orderId, { enabled: input.enabled, rate: input.rate }, normalizeInvoiceInfo(input))
}
