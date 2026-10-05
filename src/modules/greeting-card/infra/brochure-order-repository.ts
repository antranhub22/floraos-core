import { prisma } from "@/core/tenancy/infra/prisma"
import { scopedWhere, type TenantContext } from "@/core/tenancy"
import { conflict, notFound } from "@/core/http/errors"
import type { delivery_status, order_status, production_status } from "@/generated/prisma/client"

export const ORDER_STATUSES: readonly order_status[] = [
  "DRAFT", "CONFIRMED", "PROCESSING", "DELIVERED", "COMPLETED", "CANCELLED",
]

/** Đơn hàng nguồn Thẻ chào: tạo đơn, thu tiền, tra cứu, cập nhật xưởng. */
export class BrochureOrderRepository {
  constructor(private readonly db = prisma) {}

  /**
   * Danh sách đơn Thẻ chào cho các tab nội bộ. Cột tiền `Decimal` đổi sang
   * `number` TẠI ĐÂY: Prisma Decimal ra JSON thành CHUỖI, và UI cũ so sánh
   * `paid_vnd >= total_vnd` theo thứ tự chữ ("1000000" < "850000") nên đơn
   * đã thu đủ vẫn hiện "Chưa thu tiền".
   */
  async listBrochureOrders(
    ctx: TenantContext,
    options: { status?: order_status | undefined; limit: number; cursor?: string | undefined }
  ) {
    const rows = await this.db.orders.findMany({
      where: scopedWhere(ctx, {
        source: "BROCHURE",
        ...(options.status ? { status: options.status } : {}),
      }),
      include: {
        customer: { select: { id: true, code: true, name: true, phone: true } },
        items: true,
        payments: true,
        greeting_sessions: { select: { id: true, send_code: true, status: true, product_snapshot: true } },
      },
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      take: options.limit + 1, // dư 1 dòng để biết còn trang sau
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    })
    return rows.map((o) => ({
      ...o,
      total_vnd: Number(o.total_vnd),
      paid_vnd: Number(o.paid_vnd),
      balance_vnd: Number(o.balance_vnd),
      items: o.items.map((i) => ({ ...i, unit_price_vnd: Number(i.unit_price_vnd) })),
      payments: o.payments.map((p) => ({ ...p, amount_vnd: Number(p.amount_vnd) })),
    }))
  }

  async findBrochureOrder(ctx: TenantContext, orderId: string) {
    return this.db.orders.findFirst({
      where: scopedWhere(ctx, { id: orderId, source: "BROCHURE" }),
    })
  }

  async findOrderById(organizationId: string, orderId: string) {
    return this.db.orders.findFirst({
      where: { id: orderId, organization_id: organizationId },
      select: { id: true, code: true, status: true, total_vnd: true, paid_vnd: true },
    })
  }

  /**
   * Xác nhận đã nhận đủ tiền. Chỉ đơn còn DRAFT mới chuyển được — chuyển
   * trạng thái có điều kiện ngay trong giao dịch nên bấm hai lần (hay hai
   * người cùng bấm) chỉ ghi MỘT phiếu thu.
   */
  async confirmPaymentTransaction(
    ctx: TenantContext,
    orderId: string,
    input: { reference?: string | null | undefined; note?: string | null | undefined }
  ) {
    const order = await this.findBrochureOrder(ctx, orderId)
    if (!order) throw notFound()
    if (order.status === "CANCELLED") throw conflict("Đơn hàng đã huỷ, không thể xác nhận thanh toán")
    if (order.status !== "DRAFT") throw conflict("Đơn hàng đã được xác nhận thanh toán trước đó")

    const totalAmount = Number(order.total_vnd)
    const outstanding = Math.max(0, totalAmount - Number(order.paid_vnd))

    return this.db.$transaction(async (tx) => {
      const moved = await tx.orders.updateMany({
        where: { id: order.id, organization_id: ctx.organizationId, status: "DRAFT" },
        data: { status: "CONFIRMED", paid_vnd: totalAmount, balance_vnd: 0 },
      })
      if (moved.count === 0) throw conflict("Đơn hàng đã được xác nhận thanh toán trước đó")

      const payment = await tx.order_payments.create({
        data: {
          organization_id: ctx.organizationId,
          order_id: order.id,
          kind: "BALANCE",
          amount_vnd: outstanding,
          payment_method: "BANK_TRANSFER",
          reference: input.reference || `BROCHURE-${order.code}`,
          collected_by: ctx.userId,
          note: input.note || "Xác nhận chuyển khoản qua Thẻ chào",
        },
      })

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
            metadata: { paymentId: payment.id, amount: outstanding, confirmedBy: ctx.userId },
          },
        })
      }

      return {
        orderId: order.id,
        orderCode: order.code,
        status: "CONFIRMED" as const,
        paidVnd: totalAmount,
        balanceVnd: 0,
      }
    })
  }

  /** Tra cứu công khai: chỉ đơn nguồn Thẻ chào; mã trùng giữa hai tiệm → không trả gì. */
  async getTrackingOrderByCode(orderCode: string) {
    const matches = await this.db.orders.findMany({
      where: { code: orderCode.trim().toUpperCase(), source: "BROCHURE" },
      include: {
        items: { take: 1 },
        qc_records: { orderBy: { created_at: "desc" }, take: 1 },
      },
      take: 2,
    })
    return matches.length === 1 ? matches[0] ?? null : null
  }

  async assetBelongsToTenant(ctx: TenantContext, assetId: string): Promise<boolean> {
    const asset = await this.db.assets.findFirst({ where: scopedWhere(ctx, { id: assetId }), select: { id: true } })
    return asset !== null
  }

  /**
   * Cập nhật tiến độ xưởng + ghi `order_events` (+ phiếu QC kèm ảnh nếu có)
   * trong một giao dịch. Kiểm thứ tự tác vụ nằm ở use-case.
   */
  async applyProgress(
    ctx: TenantContext,
    order: { id: string; code: string; internal_note: string | null; production_status: production_status; delivery_status: delivery_status },
    input: {
      eventType: string
      productionStatus?: production_status | undefined
      deliveryStatus?: delivery_status | undefined
      orderStatus?: order_status | undefined
      noteAppend?: string | undefined
      qcImageAssetId?: string | undefined
    }
  ) {
    return this.db.$transaction(async (tx) => {
      if (input.qcImageAssetId) {
        await tx.order_qc_records.create({
          data: {
            organization_id: ctx.organizationId,
            order_id: order.id,
            image_asset_ids: [input.qcImageAssetId],
            status: "PASSED",
            notes: input.eventType,
            inspector_id: ctx.userId,
          },
        })
      }

      await tx.orders.update({
        where: { id: order.id },
        data: {
          ...(input.productionStatus ? { production_status: input.productionStatus } : {}),
          ...(input.deliveryStatus ? { delivery_status: input.deliveryStatus } : {}),
          ...(input.orderStatus ? { status: input.orderStatus } : {}),
          ...(input.noteAppend
            ? { internal_note: [order.internal_note, input.noteAppend].filter(Boolean).join("\n") }
            : {}),
        },
      })

      const isDelivery = input.deliveryStatus !== undefined
      await tx.order_events.create({
        data: {
          organization_id: ctx.organizationId,
          order_id: order.id,
          axis: isDelivery ? "delivery" : "production",
          from_value: isDelivery ? order.delivery_status : order.production_status,
          to_value: input.deliveryStatus ?? input.productionStatus ?? "UPDATED",
          reason: input.eventType,
          actor_id: ctx.userId,
        },
      })

      return { orderId: order.id, orderCode: order.code }
    })
  }
}
