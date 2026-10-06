import { prisma } from "@/core/tenancy/infra/prisma"
import { scopedWhere, type TenantContext } from "@/core/tenancy"
import { notFound } from "@/core/http/errors"
import { Prisma } from "@/generated/prisma/client"
import type { InternalNoteRole, TrackingPipelineStepId } from "../domain/tracking-pipeline-types"

export class TrackingPipelineRepository {
  constructor(private readonly db = prisma) {}

  async listBrochureOrders(ctx: TenantContext, saleId: string | null = null) {
    return this.db.orders.findMany({
      // Đơn đã huỷ không còn bước nào để theo dõi
      where: scopedWhere(ctx, {
        source: "BROCHURE",
        NOT: { status: "CANCELLED" as const },
        ...(saleId ? { greeting_sessions: { some: { sale_id: saleId } } } : {}),
      }),
      include: {
        customer: true,
        items: true,
        payments: true,
        events: {
          orderBy: { created_at: "asc" },
        },
        qc_records: {
          orderBy: { created_at: "desc" },
        },
        greeting_sessions: {
          include: {
            catalog: { select: { id: true, name: true, code: true } },
            events: { orderBy: { created_at: "asc" } },
          },
        },
      },
      orderBy: { created_at: "desc" },
      take: 100,
    })
  }

  async listActiveSessions(ctx: TenantContext, saleId: string | null = null) {
    return this.db.greeting_sessions.findMany({
      // Link chưa có đơn, còn hiệu lực (chưa thu hồi)
      where: scopedWhere(ctx, { order_id: null, revoked_at: null, ...(saleId ? { sale_id: saleId } : {}) }),
      include: {
        catalog: { select: { id: true, name: true, code: true } },
        events: { orderBy: { created_at: "asc" } },
      },
      orderBy: { last_active_at: "desc" },
      take: 50,
    })
  }

  /** Kênh chia sẻ (`?kenh=`) của đơn đặt từ link bộ sưu tập công khai — theo sự kiện ORDER. */
  async orderChannels(ctx: TenantContext, orderIds: string[]): Promise<Map<string, string>> {
    if (orderIds.length === 0) return new Map()
    const rows = await this.db.greeting_catalog_events.findMany({
      where: scopedWhere(ctx, { event_type: "ORDER", order_id: { in: orderIds } }),
      select: { order_id: true, channel: true },
    })
    return new Map(rows.filter((r) => r.order_id).map((r) => [r.order_id as string, r.channel]))
  }

  /** Tên hiển thị của các thành viên tổ chức (sale phụ trách link) — chỉ người thuộc đúng tổ chức. */
  async memberNames(ctx: TenantContext, userIds: string[]): Promise<Map<string, string>> {
    const ids = [...new Set(userIds)].filter(Boolean)
    if (ids.length === 0) return new Map()
    const rows = await this.db.memberships.findMany({
      where: scopedWhere(ctx, { user_id: { in: ids } }),
      select: { user_id: true, user: { select: { name: true, email: true } } },
    })
    return new Map(rows.map((r) => [r.user_id, r.user.name?.trim() || r.user.email.split("@")[0] || "Nhân viên"]))
  }

  /** Tên người gửi lấy từ tài khoản đăng nhập — không nhận tên do client tự khai. */
  async getUserDisplayName(userId: string): Promise<string | null> {
    const user = await this.db.users.findUnique({ where: { id: userId }, select: { name: true, email: true } })
    if (!user) return null
    return user.name?.trim() || user.email.split("@")[0] || null
  }

  async addOrderInternalNote(
    ctx: TenantContext,
    input: {
      orderId: string
      stepKey: TrackingPipelineStepId | "GENERAL"
      role: InternalNoteRole
      roleLabel: string
      senderName: string
      content: string
    }
  ) {
    const order = await this.db.orders.findFirst({
      where: scopedWhere(ctx, { id: input.orderId, source: "BROCHURE" }),
    })
    if (!order) throw notFound()

    const appendText = `[${input.roleLabel} - ${input.senderName}] (${input.stepKey}): ${input.content}`

    return this.db.$transaction(async (tx) => {
      const event = await tx.order_events.create({
        data: {
          organization_id: ctx.organizationId,
          order_id: order.id,
          axis: "internal_note",
          from_value: input.stepKey,
          to_value: input.role,
          actor_id: ctx.userId,
          reason: input.content,
        },
      })

      await tx.orders.update({
        where: { id: order.id },
        data: {
          internal_note: [order.internal_note, appendText].filter(Boolean).join("\n"),
        },
      })

      return event
    })
  }

  async addSessionInternalNote(
    ctx: TenantContext,
    input: {
      sessionId: string
      stepKey: TrackingPipelineStepId | "GENERAL"
      role: InternalNoteRole
      roleLabel: string
      senderName: string
      content: string
    }
  ) {
    const session = await this.db.greeting_sessions.findFirst({
      where: scopedWhere(ctx, { id: input.sessionId }),
    })
    if (!session) throw notFound()

    return this.db.greeting_journey_events.create({
      data: {
        organization_id: ctx.organizationId,
        session_id: session.id,
        event_type: "INTERNAL_NOTE",
        metadata: {
          stepKey: input.stepKey,
          role: input.role,
          roleLabel: input.roleLabel,
          senderName: input.senderName,
          content: input.content,
        } as unknown as Prisma.InputJsonValue,
      },
    })
  }
}
