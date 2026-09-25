/**
 * Infrastructure Repository for M10 — Orders.
 * Enforces Tenant Isolation on all queries via scoped organization_id.
 */

import { prisma } from "@/core/tenancy/infra/prisma"
import type {
  Prisma,
  order_assignments,
  order_events,
  order_items,
  orders,
} from "@/generated/prisma/client"
import type {
  CreateOrderInput,
  UpdateOrderInput,
  OrderFilter,
  OrderRecord,
  OrderItemRecord,
  OrderEventRecord,
} from "../domain/order-types"

/** Hàng `orders` kèm các quan hệ mà truy vấn nào `include` thì có. */
type OrderRow = orders & {
  items?: order_items[]
  assignments?: order_assignments[]
  events?: order_events[]
}

function mapPrismaOrder(row: OrderRow): OrderRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    branchId: row.branch_id,
    code: row.code,
    customerId: row.customer_id,
    status: row.status,
    productionStatus: row.production_status,
    deliveryStatus: row.delivery_status,
    totalVnd: Number(row.total_vnd),
    pricingRuleRef: row.pricing_rule_ref as Record<string, unknown> | null,
    voucherId: row.voucher_id,
    cardMessage: row.card_message,
    internalNote: row.internal_note,
    deliveryWindow: row.delivery_window as OrderRecord["deliveryWindow"],
    deliveryAddress: row.delivery_address as OrderRecord["deliveryAddress"],
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: row.items?.map((it): OrderItemRecord => ({
      id: it.id,
      organizationId: it.organization_id,
      orderId: it.order_id,
      productId: it.product_id,
      variantId: it.variant_id,
      description: it.description,
      quantity: it.quantity,
      unitPriceVnd: Number(it.unit_price_vnd),
      metadata: it.metadata as Record<string, unknown> | null,
    })),
    assignments: row.assignments?.map((as) => ({
      id: as.id,
      organizationId: as.organization_id,
      orderId: as.order_id,
      assigneeId: as.assignee_id,
      assignedBy: as.assigned_by,
      difficulty: as.difficulty ?? undefined,
      assignedAt: as.assigned_at,
      releasedAt: as.released_at,
    })),
    events: row.events?.map((ev) => ({
      id: ev.id,
      organizationId: ev.organization_id,
      orderId: ev.order_id,
      axis: ev.axis as OrderEventRecord["axis"],
      fromValue: ev.from_value,
      toValue: ev.to_value,
      actorId: ev.actor_id,
      reason: ev.reason,
      createdAt: ev.created_at,
    })),
  }
}

export class OrderRepository {
  async countTodayOrders(organizationId: string, date = new Date()): Promise<number> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    return prisma.orders.count({
      where: {
        organization_id: organizationId,
        created_at: { gte: startOfDay, lte: endOfDay },
      },
    })
  }

  async create(
    organizationId: string,
    code: string,
    input: CreateOrderInput,
    totalVnd: number,
    createdBy: string
  ): Promise<OrderRecord> {
    const row = await prisma.$transaction(async (tx) => {
      const ord = await tx.orders.create({
        data: {
          organization_id: organizationId,
          branch_id: input.branchId ?? null,
          code,
          customer_id: input.customerId ?? null,
          total_vnd: totalVnd,
          pricing_rule_ref: (input.pricingRuleRef as unknown as Prisma.InputJsonValue) ?? null,
          voucher_id: input.voucherId ?? null,
          card_message: input.cardMessage ?? null,
          internal_note: input.internalNote ?? null,
          delivery_window: (input.deliveryWindow as unknown as Prisma.InputJsonValue) ?? null,
          delivery_address: (input.deliveryAddress as unknown as Prisma.InputJsonValue) ?? null,
          created_by: createdBy,
          events: {
            create: {
              organization_id: organizationId,
              axis: "order",
              to_value: "DRAFT",
              actor_id: createdBy,
              reason: "Khởi tạo đơn hàng",
            },
          },
        },
      })

      if (input.items && input.items.length > 0) {
        await tx.order_items.createMany({
          data: input.items.map((it) => ({
            organization_id: organizationId,
            order_id: ord.id,
            product_id: it.productId ?? null,
            variant_id: it.variantId ?? null,
            description: it.description ?? null,
            quantity: it.quantity,
            unit_price_vnd: it.unitPriceVnd,
            metadata: (it.metadata as unknown as Prisma.InputJsonValue) ?? undefined,
          })),
        })
      }

      return tx.orders.findUniqueOrThrow({
        where: { id: ord.id },
        include: {
          items: true,
          events: true,
        },
      })
    })

    return mapPrismaOrder(row)
  }

  async findById(organizationId: string, id: string): Promise<OrderRecord | null> {
    const row = await prisma.orders.findFirst({
      where: { id, organization_id: organizationId },
      include: {
        items: true,
        assignments: true,
        events: { orderBy: { created_at: "asc" } },
      },
    })
    return row ? mapPrismaOrder(row) : null
  }

  async findByCode(organizationId: string, code: string): Promise<OrderRecord | null> {
    const row = await prisma.orders.findUnique({
      where: { organization_id_code: { organization_id: organizationId, code } },
      include: {
        items: true,
        assignments: true,
        events: { orderBy: { created_at: "asc" } },
      },
    })
    return row ? mapPrismaOrder(row) : null
  }

  async list(organizationId: string, filter: OrderFilter = {}): Promise<{ orders: OrderRecord[]; total: number }> {
    const where: Prisma.ordersWhereInput = {
      organization_id: organizationId,
    }

    if (filter.status) where.status = filter.status
    if (filter.productionStatus) where.production_status = filter.productionStatus
    if (filter.deliveryStatus) where.delivery_status = filter.deliveryStatus
    if (filter.branchId) where.branch_id = filter.branchId
    if (filter.customerId) where.customer_id = filter.customerId

    if (filter.search) {
      where.OR = [
        { code: { contains: filter.search, mode: "insensitive" } },
        { card_message: { contains: filter.search, mode: "insensitive" } },
      ]
    }

    if (filter.fromDate || filter.toDate) {
      const createdAtFilter: Record<string, Date> = {}
      if (filter.fromDate) createdAtFilter.gte = filter.fromDate
      if (filter.toDate) createdAtFilter.lte = filter.toDate
      where.created_at = createdAtFilter
    }

    const [total, rows] = await Promise.all([
      prisma.orders.count({ where }),
      prisma.orders.findMany({
        where,
        include: {
          items: true,
          assignments: true,
          events: { orderBy: { created_at: "asc" } },
        },
        orderBy: { created_at: "desc" },
        take: filter.limit ?? 50,
      }),
    ])

    return {
      orders: rows.map(mapPrismaOrder),
      total,
    }
  }

  async update(
    organizationId: string,
    id: string,
    input: UpdateOrderInput
  ): Promise<OrderRecord> {
    const data: Prisma.ordersUpdateInput = {}
    if (input.status) data.status = input.status
    if (input.productionStatus) data.production_status = input.productionStatus
    if (input.deliveryStatus) data.delivery_status = input.deliveryStatus
    if (input.cardMessage !== undefined) data.card_message = input.cardMessage
    if (input.internalNote !== undefined) data.internal_note = input.internalNote
    if (input.deliveryWindow !== undefined) data.delivery_window = input.deliveryWindow as unknown as Prisma.InputJsonValue
    if (input.deliveryAddress !== undefined) data.delivery_address = input.deliveryAddress as unknown as Prisma.InputJsonValue

    const row = await prisma.orders.update({
      where: { id },
      data,
      include: {
        items: true,
        assignments: true,
        events: { orderBy: { created_at: "asc" } },
      },
    })

    return mapPrismaOrder(row)
  }

  async createAssignment(
    organizationId: string,
    orderId: string,
    assigneeId: string,
    assignedBy: string,
    difficulty = "trung_binh"
  ) {
    return prisma.order_assignments.create({
      data: {
        organization_id: organizationId,
        order_id: orderId,
        assignee_id: assigneeId,
        assigned_by: assignedBy,
        difficulty,
      },
    })
  }

  async recordEvent(
    organizationId: string,
    orderId: string,
    axis: "order" | "production" | "delivery",
    toValue: string,
    actorId?: string,
    fromValue?: string,
    reason?: string
  ) {
    return prisma.order_events.create({
      data: {
        organization_id: organizationId,
        order_id: orderId,
        axis,
        from_value: fromValue ?? null,
        to_value: toValue,
        actor_id: actorId ?? null,
        reason: reason ?? null,
      },
    })
  }
}
