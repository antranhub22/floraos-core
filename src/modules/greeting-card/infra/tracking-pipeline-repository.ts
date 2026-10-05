import { prisma } from "@/core/tenancy/infra/prisma"
import { scopedWhere, type TenantContext } from "@/core/tenancy"
import { notFound } from "@/core/http/errors"
import { Prisma } from "@/generated/prisma/client"
import type { InternalNoteRole, TrackingPipelineStepId } from "../domain/tracking-pipeline-types"

export class TrackingPipelineRepository {
  constructor(private readonly db = prisma) {}

  async listBrochureOrders(ctx: TenantContext) {
    return this.db.orders.findMany({
      where: scopedWhere(ctx, {
        source: "BROCHURE",
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

  async listActiveSessions(ctx: TenantContext) {
    return this.db.greeting_sessions.findMany({
      where: scopedWhere(ctx, {
        order_id: null,
      }),
      include: {
        catalog: { select: { id: true, name: true, code: true } },
        events: { orderBy: { created_at: "asc" } },
      },
      orderBy: { last_active_at: "desc" },
      take: 50,
    })
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
