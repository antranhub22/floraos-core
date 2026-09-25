/**
 * Coordinator Repository — Chức năng 12.
 *
 * Mọi truy vấn đi qua `scopedWhere`/`scopedData` (organization_id chỉ đến từ
 * `TenantContext`). KHÔNG còn nhánh "bảng chưa tồn tại thì trả rỗng": bản
 * trước nuốt lỗi P2021 nên thiếu migration vẫn trông như chạy được. Nay thiếu
 * bảng là lỗi 500 thật, lộ ngay lần gọi đầu.
 */

import { scopedData, scopedWhere, type TenantContext } from "@/core/tenancy"
import { prisma } from "@/core/tenancy/infra/prisma"
import type { Prisma } from "@/generated/prisma/client"
import type { CoordinatorStage, CoordinationRiskLevel } from "../domain/coordinator-types"
import { changedAxes, type StageTransitionFacts } from "../domain/stage-transitions"
import type { MappedOrderAxes } from "../domain/state-mapper"
import type { DbClient } from "./transaction"

const ORDER_INCLUDE = {
  coordination: { include: { partner: true } },
  items: true,
  qc_records: { orderBy: { created_at: "desc" as const }, take: 1 },
  exceptions: { orderBy: { created_at: "asc" as const } },
} satisfies Prisma.ordersInclude

export type CoordinatorOrderRow = Prisma.ordersGetPayload<{ include: typeof ORDER_INCLUDE }>
export type PartnerRow = Prisma.partnersGetPayload<object>
export type ExceptionRow = Prisma.order_exceptionsGetPayload<object>

export interface CreateCoordinatorOrderData {
  code: string
  stage: CoordinatorStage
  axes: MappedOrderAxes
  riskLevel: CoordinationRiskLevel
  nextAction: string
  totalVnd: number
  customerId: string | null
  cardMessage: string | null
  internalNote: string | null
  deliveryWindow: { timeSlot: string; targetAt: string | null }
  deliveryAddress: Record<string, unknown>
  estimatedDeliveryAt: Date | null
  sampleAssetId: string | null
  items: Array<{ description: string; quantity: number; metadata: Record<string, unknown> }>
  metadata: Record<string, unknown>
}

export class CoordinatorRepository {
  constructor(private readonly db: DbClient = prisma) {}

  // ── Đọc ────────────────────────────────────────────────────────────────

  findOrder(ctx: TenantContext, idOrCode: string): Promise<CoordinatorOrderRow | null> {
    return this.db.orders.findFirst({
      where: scopedWhere(ctx, {
        OR: [{ id: idOrCode }, { code: idOrCode }],
        coordination: { isNot: null },
      }),
      include: ORDER_INCLUDE,
    })
  }

  listOrders(
    ctx: TenantContext,
    options: { stage?: CoordinatorStage | undefined; limit: number }
  ): Promise<CoordinatorOrderRow[]> {
    return this.db.orders.findMany({
      where: scopedWhere(ctx, {
        coordination: options.stage ? { is: { stage: options.stage } } : { isNot: null },
      }),
      include: ORDER_INCLUDE,
      orderBy: { created_at: "desc" },
      take: options.limit,
    })
  }

  countOrdersWithCodePrefix(ctx: TenantContext, prefix: string): Promise<number> {
    return this.db.orders.count({ where: scopedWhere(ctx, { code: { startsWith: prefix } }) })
  }

  countOpenExceptions(ctx: TenantContext, orderId: string): Promise<number> {
    return this.db.order_exceptions.count({
      where: scopedWhere(ctx, { order_id: orderId, status: { in: ["OPEN", "IN_PROGRESS"] } }),
    })
  }

  countExceptions(ctx: TenantContext, orderId: string): Promise<number> {
    return this.db.order_exceptions.count({ where: scopedWhere(ctx, { order_id: orderId }) })
  }

  async facts(ctx: TenantContext, row: CoordinatorOrderRow): Promise<StageTransitionFacts> {
    const c = row.coordination!
    return {
      partnerAssigned: Boolean(c.partner_id),
      latestQcStatus: row.qc_records[0]?.status ?? null,
      podCaptured: Boolean(c.pod_asset_id || c.pod_recipient_name),
      openExceptionCount: await this.countOpenExceptions(ctx, row.id),
      resumeStage: c.resume_stage ?? null,
    }
  }

  // ── Ghi đơn ─────────────────────────────────────────────────────────────

  async createOrder(ctx: TenantContext, data: CreateCoordinatorOrderData): Promise<{ id: string; code: string }> {
    const order = await this.db.orders.create({
      data: scopedData(ctx, {
        code: data.code,
        customer_id: data.customerId,
        status: data.axes.status,
        production_status: data.axes.productionStatus,
        delivery_status: data.axes.deliveryStatus,
        total_vnd: data.totalVnd,
        card_message: data.cardMessage,
        internal_note: data.internalNote,
        delivery_window: data.deliveryWindow as Prisma.InputJsonValue,
        delivery_address: data.deliveryAddress as Prisma.InputJsonValue,
        created_by: ctx.userId,
      }),
    })

    if (data.items.length > 0) {
      await this.db.order_items.createMany({
        data: data.items.map((it) =>
          scopedData(ctx, {
            order_id: order.id,
            description: it.description,
            quantity: it.quantity,
            unit_price_vnd: 0,
            metadata: it.metadata as Prisma.InputJsonValue,
          })
        ),
      })
    }

    await this.db.order_coordinations.create({
      data: scopedData(ctx, {
        order_id: order.id,
        coordinator_id: ctx.userId,
        stage: data.stage,
        risk_level: data.riskLevel,
        next_action: data.nextAction,
        estimated_delivery_at: data.estimatedDeliveryAt,
        sample_asset_id: data.sampleAssetId,
        metadata: data.metadata as Prisma.InputJsonValue,
      }),
    })

    await this.recordEvent(ctx, order.id, "order", null, data.axes.status, "Tiếp nhận đơn điều phối")
    return { id: order.id, code: order.code }
  }

  /**
   * Chuyển bước: ba trục `orders` + `order_coordinations` + `order_events` cho
   * từng trục đổi giá trị (M10 đo SLA từ chuỗi sự kiện này).
   */
  async applyTransition(
    ctx: TenantContext,
    row: CoordinatorOrderRow,
    params: {
      from: CoordinatorStage
      to: CoordinatorStage
      axes: MappedOrderAxes
      nextAction: string
      reason: string
      coordination?: Prisma.order_coordinationsUncheckedUpdateInput
    }
  ): Promise<boolean> {
    const before: MappedOrderAxes = {
      status: row.status,
      productionStatus: row.production_status,
      deliveryStatus: row.delivery_status,
    }
    // Khoá lạc quan: chỉ chuyển nếu bước vẫn là `from`. Hai điều phối viên
    // bấm cùng lúc thì người thứ hai nhận 409, không ghi đè lẫn nhau.
    const moved = await this.db.order_coordinations.updateMany({
      where: scopedWhere(ctx, { order_id: row.id, stage: params.from }),
      data: { ...params.coordination, stage: params.to, next_action: params.nextAction },
    })
    if (moved.count === 0) return false

    const changes = changedAxes(before, params.axes)
    if (changes.length > 0) {
      await this.db.orders.updateMany({
        where: scopedWhere(ctx, { id: row.id }),
        data: {
          status: params.axes.status,
          production_status: params.axes.productionStatus,
          delivery_status: params.axes.deliveryStatus,
        },
      })
    }
    for (const ch of changes) {
      await this.recordEvent(ctx, row.id, ch.axis, ch.from, ch.to, params.reason)
    }
    return true
  }

  async updateCoordination(
    ctx: TenantContext,
    orderId: string,
    data: Prisma.order_coordinationsUncheckedUpdateInput
  ): Promise<void> {
    await this.db.order_coordinations.updateMany({
      where: scopedWhere(ctx, { order_id: orderId }),
      data,
    })
  }

  async updateOrderAxis(
    ctx: TenantContext,
    orderId: string,
    data: Prisma.ordersUncheckedUpdateManyInput
  ): Promise<void> {
    await this.db.orders.updateMany({ where: scopedWhere(ctx, { id: orderId }), data })
  }

  async recordEvent(
    ctx: TenantContext,
    orderId: string,
    axis: "order" | "production" | "delivery",
    from: string | null,
    to: string,
    reason: string
  ): Promise<void> {
    await this.db.order_events.create({
      data: scopedData(ctx, {
        order_id: orderId,
        axis,
        from_value: from,
        to_value: to,
        actor_id: ctx.userId,
        reason,
      }),
    })
  }

  // ── QC ─────────────────────────────────────────────────────────────────

  createQcRecord(
    ctx: TenantContext,
    data: {
      orderId: string
      status: "PASSED" | "REJECTED" | "REWORK_REQUESTED"
      imageAssetIds: string[]
      checklist: Record<string, unknown> | null
      notes: string | null
    }
  ) {
    return this.db.order_qc_records.create({
      data: scopedData(ctx, {
        order_id: data.orderId,
        inspector_id: ctx.userId,
        status: data.status,
        image_asset_ids: data.imageAssetIds as Prisma.InputJsonValue,
        ...(data.checklist ? { checklist_result: data.checklist as Prisma.InputJsonValue } : {}),
        notes: data.notes,
      }),
    })
  }

  // ── Sự cố ──────────────────────────────────────────────────────────────

  createException(
    ctx: TenantContext,
    data: { orderId: string; code: string; type: string; severity: string; description: string }
  ): Promise<ExceptionRow> {
    return this.db.order_exceptions.create({
      data: scopedData(ctx, {
        order_id: data.orderId,
        code: data.code,
        type: data.type,
        severity: data.severity,
        description: data.description,
        status: "OPEN",
        reported_by: ctx.userId,
      }),
    })
  }

  findException(ctx: TenantContext, id: string): Promise<ExceptionRow | null> {
    return this.db.order_exceptions.findFirst({ where: scopedWhere(ctx, { id }) })
  }

  async resolveException(ctx: TenantContext, id: string, resolution: string): Promise<void> {
    await this.db.order_exceptions.updateMany({
      where: scopedWhere(ctx, { id }),
      data: { status: "RESOLVED", resolution, resolved_by: ctx.userId, resolved_at: new Date() },
    })
  }

  // ── Đối tác ────────────────────────────────────────────────────────────

  listPartners(ctx: TenantContext, options: { activeOnly: boolean }): Promise<PartnerRow[]> {
    return this.db.partners.findMany({
      where: scopedWhere(ctx, options.activeOnly ? { is_active: true } : {}),
      orderBy: [{ is_active: "desc" }, { rating: "desc" }, { name: "asc" }],
      take: 200,
    })
  }

  findPartner(ctx: TenantContext, id: string): Promise<PartnerRow | null> {
    return this.db.partners.findFirst({ where: scopedWhere(ctx, { id }) })
  }

  createPartner(
    ctx: TenantContext,
    data: {
      code: string
      name: string
      phone: string
      address: string | null
      district: string | null
      province: string | null
      tier: string
      capacityDaily: number
    }
  ): Promise<PartnerRow> {
    return this.db.partners.create({
      data: scopedData(ctx, {
        code: data.code,
        name: data.name,
        phone: data.phone,
        address: data.address,
        district: data.district,
        province: data.province,
        tier: data.tier,
        capacity_daily: data.capacityDaily,
      }),
    })
  }

  async updatePartner(
    ctx: TenantContext,
    id: string,
    data: Prisma.partnersUncheckedUpdateManyInput
  ): Promise<void> {
    await this.db.partners.updateMany({ where: scopedWhere(ctx, { id }), data })
  }

  /** Đơn đang chạy của một đối tác hôm nay — để so với `capacity_daily`. */
  countActiveOrdersForPartner(ctx: TenantContext, partnerId: string): Promise<number> {
    return this.db.order_coordinations.count({
      where: scopedWhere(ctx, {
        partner_id: partnerId,
        stage: { in: ["ASSIGNING", "IN_PRODUCTION", "QUALITY_CHECK"] as CoordinatorStage[] },
      }),
    })
  }
}
