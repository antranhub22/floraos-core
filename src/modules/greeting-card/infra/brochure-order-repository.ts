import { prisma } from "@/core/tenancy/infra/prisma"
import { scopedWhere, type TenantContext } from "@/core/tenancy"
import { recordAuditLog } from "@/modules/audit/use-cases/record-audit-log"
import type { delivery_status, order_status, production_status } from "@/generated/prisma/client"

export const ORDER_STATUSES: readonly order_status[] = [
  "DRAFT", "CONFIRMED", "PROCESSING", "DELIVERED", "COMPLETED", "CANCELLED",
]

/** Đơn hàng nguồn Thẻ chào: tạo đơn, thu tiền, tra cứu, cập nhật xưởng. */
/** Mã đơn, mã link (không phân biệt hoa thường) hoặc số điện thoại khách (chỉ so phần số). */
function searchConditions(q: string) {
  const text = q.trim()
  const digits = text.replace(/\D/g, "")
  return [
    { code: { contains: text, mode: "insensitive" as const } },
    { greeting_sessions: { some: { send_code: { contains: text, mode: "insensitive" as const } } } },
    ...(digits.length >= 3 ? [{ customer: { phone: { contains: digits } } }] : []),
  ]
}

export class BrochureOrderRepository {
  constructor(private readonly db = prisma) {}

  /**
   * Danh sách đơn Thẻ chào cho các tab nội bộ. Cột tiền `Decimal` đổi sang
   * `number` TẠI ĐÂY: Prisma Decimal ra JSON thành CHUỖI, và UI cũ so sánh
   * `paid_vnd >= total_vnd` theo thứ tự chữ ("1000000" < "850000") nên đơn
   * đã thu đủ vẫn hiện "Chưa thu tiền".
   */
  /**
   * Bảng việc Điều phối: mọi đơn Thẻ chào chưa huỷ còn việc, cộng đơn đã giao trong 24 giờ qua;
   * tuỳ chọn một ngày giao. Trần `COORDINATOR_BOARD_MAX`, xếp ở use-case theo giờ giao.
   */
  async listCoordinatorBoard(ctx: TenantContext, options: { date?: string | undefined; saleId?: string | undefined; doneSince: Date; max: number }) {
    const rows = await this.db.orders.findMany({
      where: scopedWhere(ctx, {
        source: "BROCHURE",
        NOT: { status: "CANCELLED" as const },
        OR: [{ delivery_status: { not: "DELIVERED" as const } }, { updated_at: { gte: options.doneSince } }],
        ...(options.date ? { delivery_window: { path: ["date"], equals: options.date } } : {}),
        ...(options.saleId ? { greeting_sessions: { some: { sale_id: options.saleId } } } : {}),
      }),
      include: {
        customer: { select: { id: true, code: true, name: true, phone: true } },
        items: true,
        greeting_sessions: { select: { id: true, send_code: true, status: true, product_snapshot: true } },
      },
      orderBy: [{ created_at: "asc" }, { id: "asc" }],
      take: options.max,
    })
    return rows.map((o) => ({
      ...o,
      total_vnd: Number(o.total_vnd),
      paid_vnd: Number(o.paid_vnd),
      balance_vnd: Number(o.balance_vnd),
      items: o.items.map((i) => ({ ...i, unit_price_vnd: Number(i.unit_price_vnd) })),
    }))
  }

  async listBrochureOrders(
    ctx: TenantContext,
    options: {
      status?: order_status | undefined
      /** OUTSTANDING = còn phải thu (chưa huỷ); PAID = đã thu đủ. */
      payment?: "OUTSTANDING" | "PAID" | undefined
      /** Chỉ đơn từ link do sale này gửi (chế độ xem "chỉ đơn của mình") */
      saleId?: string | undefined
      /** Tìm theo mã đơn / mã link / số điện thoại khách (Điều hành đối chiếu sao kê) */
      q?: string | undefined
      /** Chỉ đơn khách đã bấm "Tôi đã chuyển khoản" */
      reported?: boolean | undefined
      limit: number
      cursor?: string | undefined
    }
  ) {
    const rows = await this.db.orders.findMany({
      where: scopedWhere(ctx, {
        source: "BROCHURE",
        ...(options.status ? { status: options.status } : {}),
        ...(options.saleId ? { greeting_sessions: { some: { sale_id: options.saleId } } } : {}),
        // Đơn chờ báo giá (tổng 0) cũng tính là "còn phải thu"
        ...(options.payment === "OUTSTANDING"
          ? { OR: [{ balance_vnd: { gt: 0 } }, { total_vnd: 0 }], NOT: { status: "CANCELLED" as const } }
          : {}),
        ...(options.payment === "PAID" ? { balance_vnd: { lte: 0 }, total_vnd: { gt: 0 } } : {}),
        ...(options.reported ? { greeting_sessions: { some: { status: "PAYMENT_REPORTED" as const, ...(options.saleId ? { sale_id: options.saleId } : {}) } } } : {}),
        ...(options.q ? { AND: [{ OR: searchConditions(options.q) }] } : {}),
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
      select: { id: true, code: true, status: true, total_vnd: true, paid_vnd: true, created_at: true, pricing_rule_ref: true },
    })
  }

  /** Tra cứu công khai: chỉ đơn nguồn Thẻ chào; mã trùng giữa hai tiệm → không trả gì. */
  async getTrackingOrderByCode(orderCode: string) {
    const matches = await this.db.orders.findMany({
      where: { code: orderCode.trim().toUpperCase(), source: "BROCHURE" },
      include: {
        items: { take: 1 },
        // Đủ để tách ảnh thành phẩm và ảnh người nhận (mỗi loại tối đa 5 ảnh + 2 video)
        qc_records: { orderBy: { created_at: "desc" }, take: 20 },
        // Chỉ để xác minh người xem (không trả ra ngoài)
        customer: { select: { phone: true } },
        greeting_sessions: {
          select: {
            send_code: true,
            status: true,
            catalog: { select: { filters: true } },
          },
        },
        organization: {
          select: { settings: true },
        },
      },
      take: 2,
    })
    return matches.length === 1 ? matches[0] ?? null : null
  }

  /** Sale phụ trách đơn (người gửi link) — `null` khi đơn không thuộc tổ chức / không phải đơn Thẻ chào. */
  async saleOfOrder(ctx: TenantContext, orderId: string): Promise<string | null> {
    const order = await this.db.orders.findFirst({
      where: scopedWhere(ctx, { id: orderId, source: "BROCHURE" }),
      select: { greeting_sessions: { select: { sale_id: true }, take: 1 } },
    })
    return order?.greeting_sessions[0]?.sale_id ?? null
  }

  /** Loại + dung lượng của các asset thuộc đúng tổ chức (asset tổ chức khác không có trong kết quả). */
  async ownedAssetsMeta(ctx: TenantContext, assetIds: readonly string[]) {
    return this.db.assets.findMany({
      where: scopedWhere(ctx, { id: { in: [...new Set(assetIds)] } }),
      select: { id: true, mime_type: true, file_size: true },
    })
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
      /** Ảnh/video của lần chụp này — một bản ghi QC chứa cả bộ */
      qcAssetIds?: readonly string[] | undefined
    }
  ) {
    return this.db.$transaction(async (tx) => {
      if (input.qcAssetIds && input.qcAssetIds.length > 0) {
        await tx.order_qc_records.create({
          data: {
            organization_id: ctx.organizationId,
            order_id: order.id,
            image_asset_ids: [...input.qcAssetIds],
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

      // Tác vụ xưởng cũng vào nhật ký kiểm toán như thao tác tiền: ai làm, lúc nào, đổi gì
      await recordAuditLog(
        ctx,
        {
          action: `greeting_card.order.${input.eventType.toLowerCase()}`,
          entityType: "order",
          entityId: order.id,
          before: { productionStatus: order.production_status, deliveryStatus: order.delivery_status },
          after: {
            ...(input.productionStatus ? { productionStatus: input.productionStatus } : {}),
            ...(input.deliveryStatus ? { deliveryStatus: input.deliveryStatus } : {}),
            ...(input.orderStatus ? { status: input.orderStatus } : {}),
            ...(input.noteAppend ? { note: input.noteAppend } : {}),
            ...(input.qcAssetIds?.length ? { assetIds: [...input.qcAssetIds] } : {}),
          },
        },
        tx
      )

      return { orderId: order.id, orderCode: order.code }
    })
  }
}
