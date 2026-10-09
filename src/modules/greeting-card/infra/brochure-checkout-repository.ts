import type { AddressParts } from "../domain/delivery-address"
import { prisma } from "@/core/tenancy/infra/prisma"
import { conflict, validationFailed } from "@/core/http/errors"
import { Prisma } from "@/generated/prisma/client"
import { isUniqueViolation } from "@/modules/coordinator/infra/transaction"
import { randomCode } from "../domain/greeting-card-rules"
import type { BrochureQuote, VoucherFacts } from "../domain/brochure-pricing"
import type { OrderPolicySnapshot } from "../domain/order-policies"
import type { ProductSnapshot } from "../domain/greeting-card-types"
import { countBySlot, slotFullMessage } from "../domain/slot-capacity"
import { recordAuditLog } from "@/modules/audit/use-cases/record-audit-log"

export interface CreateBrochureOrderData {
  organizationId: string
  sessionId: string
  code: string
  customerName: string
  customerPhone: string
  customerEmail?: string | null | undefined
  recipientName: string
  recipientPhone: string
  deliveryAddress: string
  /** 5 ô địa chỉ (form mới) — lưu kèm để in phiếu/lọc theo phường, tỉnh */
  addressParts?: AddressParts | null | undefined
  deliveryDate: string
  deliveryTimeSlot: string
  cardMessage?: string | null | undefined
  /** Ghi chú cho người giao + link bản đồ — gộp vào `delivery_address` */
  delivery?: { notes?: string; mapUrl?: string } | undefined
  note?: string | null | undefined
  snapshot: ProductSnapshot
  variant: { id: string; name: string } | null
  quote: BrochureQuote
  voucherId: string | null
  /** Bản chụp ưu đãi/thỏa thuận khách đã đồng ý (Spec #2, #5). */
  policies?: OrderPolicySnapshot | undefined
  /** Trần đơn của khung giờ khách chọn — kiểm lại trong giao dịch, có khoá (PO 08/10/2026). */
  slotGuard?: { slotId: string; max: number } | null | undefined
  /** Mã thanh toán đã áp (DC30…) — kiểm lại lượt dùng trong giao dịch, có khoá, và ghi audit. */
  paymentCodeGuard?: { code: string; maxUses: number | null } | null | undefined
}

type Db = Pick<typeof prisma, "orders">

/** Số đơn chưa huỷ đã dùng một mã thanh toán (đọc từ bản chụp `pricing_rule_ref.paymentPlan`). */
function paymentCodeUses(db: Db, organizationId: string, code: string): Promise<number> {
  return db.orders.count({
    where: {
      organization_id: organizationId, status: { not: "CANCELLED" },
      pricing_rule_ref: { path: ["paymentPlan", "paymentCode"], equals: code },
    },
  })
}

/** Khung giờ đã lưu của các đơn Thẻ chào chưa huỷ, giao ngày `date` (YYYY-MM-DD). */
async function timeSlotsOn(db: Db, organizationId: string, date: string): Promise<Array<string | null>> {
  const rows = await db.orders.findMany({
    where: {
      organization_id: organizationId, source: "BROCHURE", status: { not: "CANCELLED" },
      delivery_window: { path: ["date"], equals: date },
    },
    select: { delivery_window: true },
  })
  return rows.map((r) => {
    const slot = (r.delivery_window as { timeSlot?: unknown } | null)?.timeSlot
    return typeof slot === "string" ? slot : null
  })
}

/**
 * Đặt hàng công khai: khách hàng theo SĐT, mã giảm giá, tạo đơn. Mọi hàm
 * nhận `organizationId` lấy từ phiên/catalog ở server — không từ client.
 */
export class BrochureCheckoutRepository {
  constructor(private readonly db = prisma) {}

  async findCustomerIdByPhone(organizationId: string, phone: string): Promise<string | null> {
    if (!phone) return null
    const row = await this.db.customers.findFirst({
      where: { organization_id: organizationId, phone },
      select: { id: true },
    })
    return row?.id ?? null
  }

  /** Mã giảm giá theo mã (không phân biệt hoa thường) trong đúng tổ chức. */
  async findVoucher(organizationId: string, code: string): Promise<VoucherFacts | null> {
    const v = await this.db.vouchers.findFirst({
      where: { organization_id: organizationId, code: { equals: code.trim(), mode: "insensitive" } },
    })
    if (!v) return null
    return {
      id: v.id,
      code: v.code,
      discountType: v.discount_type,
      discountValue: Number(v.discount_value),
      minOrderVnd: Number(v.min_order_vnd),
      maxDiscountVnd: v.max_discount_vnd === null ? null : Number(v.max_discount_vnd),
      expiresAt: v.expires_at,
      isUsed: v.is_used,
      customerId: v.customer_id,
    }
  }

  async countPaymentCodeUses(organizationId: string, code: string): Promise<number> {
    return paymentCodeUses(this.db, organizationId, code)
  }

  /** Số đơn Thẻ chào của một SĐT người đặt trong tổ chức từ `since` (chống đơn rác). */
  async countRecentOrdersByPhone(organizationId: string, phone: string, since: Date): Promise<number> {
    if (!phone) return 0
    return this.db.orders.count({
      where: { organization_id: organizationId, source: "BROCHURE", created_at: { gte: since }, customer: { phone } },
    })
  }

  /** Số đơn chưa huỷ theo khung giờ của một ngày giao (để hiện "đã kín" và kiểm trước khi tạo phiên). */
  async countOrdersBySlot(organizationId: string, date: string): Promise<Map<string, number>> {
    return countBySlot(await timeSlotsOn(this.db, organizationId, date))
  }

  /** Đơn vừa đặt từ link bộ sưu tập chung có cùng SĐT + mẫu (để trả lại thay vì tạo đơn trùng). */
  async findRecentPublicOrders(input: { organizationId: string; catalogId: string; customerPhone: string; productId: string; since: Date }) {
    return this.db.greeting_sessions.findMany({
      where: {
        organization_id: input.organizationId, catalog_id: input.catalogId, customer_phone: input.customerPhone,
        selected_product_id: input.productId, order_id: { not: null }, created_at: { gte: input.since },
      },
      select: {
        id: true, send_code: true, product_snapshot: true,
        order: { select: { id: true, code: true, total_vnd: true, paid_vnd: true, created_at: true, status: true, delivery_address: true, delivery_window: true, pricing_rule_ref: true } },
      },
      orderBy: { created_at: "desc" },
      take: 5,
    })
  }

  /**
   * Khách theo SĐT. Làm NGOÀI giao dịch tạo đơn: mã `KH-xxxx` sinh theo đếm
   * có thể trùng (khách đã xoá, hai đơn đồng thời) — trùng thì lấy đuôi ngẫu
   * nhiên, thay vì làm hỏng cả đơn.
   */
  /** Số đơn chưa huỷ của tiệm giao ngày `date` (mọi nguồn — năng lực xưởng/shipper là của cả tiệm). */
  async countOrdersOnDeliveryDate(organizationId: string, date: string, excludeOrderId?: string | undefined) {
    return this.db.orders.count({
      where: {
        organization_id: organizationId,
        status: { not: "CANCELLED" },
        delivery_window: { path: ["date"], equals: date },
        ...(excludeOrderId ? { id: { not: excludeOrderId } } : {}),
      },
    })
  }

  async findOrCreateCustomer(data: Pick<CreateBrochureOrderData, "organizationId" | "customerPhone" | "customerName" | "deliveryAddress"> & { email?: string | undefined }) {
    const where = { organization_id: data.organizationId, phone: data.customerPhone }
    const existing = await this.db.customers.findFirst({ where, select: { id: true, email: true } })
    if (existing) {
      if (data.email && !existing.email) {
        await this.db.customers.update({ where: { id: existing.id }, data: { email: data.email } }).catch(() => null)
      }
      return existing.id
    }

    const count = await this.db.customers.count({ where: { organization_id: data.organizationId } })
    const candidates = [`KH-${String(count + 1).padStart(4, "0")}`, `KH-${randomCode(6)}`, `KH-${randomCode(8)}`]
    for (const code of candidates) {
      try {
        const created = await this.db.customers.create({
          data: { ...where, code, name: data.customerName, address: data.deliveryAddress, email: data.email || null },
          select: { id: true },
        })
        return created.id
      } catch (error) {
        if (!isUniqueViolation(error)) throw error
        const raced = await this.db.customers.findFirst({ where, select: { id: true } })
        if (raced) return raced.id
      }
    }
    throw conflict("Không tạo được hồ sơ khách hàng, vui lòng thử lại")
  }

  /**
   * Tạo đơn + gắn vào phiên + dùng mã giảm giá trong MỘT giao dịch. Phiên chỉ
   * nhận đơn khi chưa có đơn; mã giảm giá chỉ dùng được khi `is_used = false`
   * — hai khách dùng cùng một mã cùng lúc thì một người nhận 409.
   */
  async createBrochureOrder(data: CreateBrochureOrderData, customerId: string) {
    const { quote } = data
    return this.db.$transaction(async (tx) => {
      if (data.slotGuard) {
        // Khoá theo (tổ chức, ngày, khung): hai khách tranh suất cuối cùng lúc → chỉ một người được
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`brochure-slot:${data.organizationId}:${data.deliveryDate}:${data.slotGuard.slotId}`}))`
        const taken = countBySlot(await timeSlotsOn(tx, data.organizationId, data.deliveryDate)).get(data.slotGuard.slotId) ?? 0
        if (taken >= data.slotGuard.max) throw validationFailed({ deliveryTimeSlot: slotFullMessage(data.deliveryTimeSlot) })
      }
      const codeGuard = data.paymentCodeGuard
      if (codeGuard?.maxUses) {
        // Hai khách tranh lượt cuối của cùng một mã → chỉ một người được
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`payment-code:${data.organizationId}:${codeGuard.code}`}))`
        if ((await paymentCodeUses(tx, data.organizationId, codeGuard.code)) >= codeGuard.maxUses) {
          throw validationFailed({ paymentCode: "Mã thanh toán đã hết lượt sử dụng" })
        }
      }
      const order = await tx.orders.create({
        data: {
          organization_id: data.organizationId,
          customer_id: customerId,
          code: data.code,
          source: "BROCHURE",
          source_session_id: data.sessionId,
          status: "DRAFT",
          production_status: "WAITING",
          delivery_status: "PENDING",
          total_vnd: quote.totalVnd,
          paid_vnd: 0,
          balance_vnd: quote.totalVnd,
          voucher_id: data.voucherId,
          // Ưu đãi + thỏa thuận khách đã đồng ý lúc đặt — bản chụp, không đổi khi tiệm sửa chính sách sau
          pricing_rule_ref: { source: "BROCHURE_QUOTE", ...quote, policies: data.policies ?? null } as unknown as Prisma.InputJsonValue,
          card_message: data.cardMessage ?? null,
          internal_note: data.note ?? null,
          delivery_window: { date: data.deliveryDate, timeSlot: data.deliveryTimeSlot },
          delivery_address: {
            recipientName: data.recipientName,
            phone: data.recipientPhone,
            street: data.deliveryAddress,
            ...(data.addressParts ? { parts: { ...data.addressParts } } : {}),
            ...(quote.shippingZone ? { zone: quote.shippingZone.name } : {}),
            ...data.delivery,
          },
          created_by: "customer-brochure",
          items: {
            create: {
              organization_id: data.organizationId,
              product_id: data.snapshot.id,
              quantity: quote.quantity,
              unit_price_vnd: quote.unitPriceVnd,
              description: data.variant ? `${data.snapshot.name} — ${data.variant.name}` : data.snapshot.name,
              metadata: { ...data.snapshot, variant: data.variant } as unknown as Prisma.InputJsonValue,
            },
          },
        },
      })

      if (data.voucherId) {
        const used = await tx.vouchers.updateMany({
          where: { id: data.voucherId, organization_id: data.organizationId, is_used: false },
          data: { is_used: true, used_at: new Date(), order_id: order.id },
        })
        if (used.count === 0) throw conflict("Mã giảm giá vừa được sử dụng cho đơn khác")
      }

      const attached = await tx.greeting_sessions.updateMany({
        where: { id: data.sessionId, order_id: null },
        data: {
          order_id: order.id,
          status: "ORDER_SUBMITTED",
          customer_name: data.customerName,
          customer_phone: data.customerPhone,
          product_snapshot: data.snapshot as unknown as Prisma.InputJsonValue,
          last_active_at: new Date(),
        },
      })
      if (attached.count === 0) throw conflict("Thẻ chào này đã có đơn hàng")

      await tx.greeting_journey_events.create({
        data: {
          organization_id: data.organizationId,
          session_id: data.sessionId,
          event_type: "SUBMIT_ORDER",
          metadata: { orderId: order.id, orderCode: order.code, amount: quote.totalVnd },
        },
      })
      if (codeGuard) {
        // Truy vết mã thanh toán: mã nào, đơn nào, lúc nào, ai áp (khách tự nhập trên trang đặt hoa)
        await recordAuditLog(
          { organizationId: data.organizationId, workspaceId: "", userId: "customer", branchId: null, capabilities: new Set() },
          {
            action: "greeting_card.payment_code.apply",
            entityType: "order",
            entityId: order.id,
            after: { paymentCode: codeGuard.code, orderCode: order.code, policy: quote.paymentPlan?.policy ?? null, appliedBy: "CUSTOMER", result: "SUCCESS" },
          },
          tx,
        )
      }

      return order
    })
  }
}
