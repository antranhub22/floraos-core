import { randomUUID } from "node:crypto"
import type { Prisma } from "@/generated/prisma/client"
import { conflict, notFound, validationFailed } from "@/core/http/errors"
import { prisma } from "@/core/tenancy/infra/prisma"
import { scopedData, scopedWhere, type TenantContext } from "@/core/tenancy"
import { recordAuditLog } from "@/modules/audit/use-cases/record-audit-log"
import {
  canProposeDismissal,
  type DismissalInfo,
  type DismissalProposalInput,
} from "../domain/dismissal-policy"

type Loose = Record<string, unknown>
const obj = (v: unknown): Loose => (v && typeof v === "object" ? (v as Loose) : {})

export class DismissalRepository {
  constructor(private readonly db = prisma) {}

  private async resolveUserName(ctx: TenantContext): Promise<string> {
    const membership = await this.db.memberships.findFirst({
      where: scopedWhere(ctx, { user_id: ctx.userId }),
      select: { user: { select: { name: true, email: true } } },
    })
    return membership?.user.name?.trim() || membership?.user.email.split("@")[0] || "Nhân viên"
  }

  /**
   * Đề xuất hoặc hủy bỏ trực tiếp hiển thị của đơn / link Thẻ chào.
   */
  async propose(
    ctx: TenantContext,
    input: DismissalProposalInput,
    isCoordinatorOrAdmin: boolean,
  ): Promise<{ directApproved: boolean; dismissal: DismissalInfo }> {
    const now = new Date()
    const nowIso = now.toISOString()
    const userName = await this.resolveUserName(ctx)

    if (!input.reasonText || input.reasonText.trim().length < 2) {
      throw validationFailed({ reasonText: "Vui lòng nhập lý do hủy/bỏ hiển thị chi tiết." })
    }

    const fullReason = input.note
      ? `${input.reasonText} (${input.note.trim()})`
      : input.reasonText.trim()

    const initialDismissal: DismissalInfo = {
      status: isCoordinatorOrAdmin ? "APPROVED" : "PENDING",
      reason: fullReason,
      category: input.reasonId,
      note: input.note?.trim() || undefined,
      proposedBy: ctx.userId,
      proposedByName: userName,
      proposedAt: nowIso,
      ...(isCoordinatorOrAdmin
        ? {
            decidedBy: ctx.userId,
            decidedByName: userName,
            decidedAt: nowIso,
          }
        : {}),
    }

    if (input.type === "SESSION") {
      const session = await this.db.greeting_sessions.findFirst({
        where: scopedWhere(ctx, { id: input.id }),
      })
      if (!session) throw notFound()

      const check = canProposeDismissal({
        isCancelled: session.revoked_at !== null || (session.expires_at !== null && session.expires_at <= now),
        paidVnd: 0,
        currentStepId: session.status === "SELECTED" ? "STEP_2_CHOOSING" : "STEP_1_OPENED",
      })
      if (!check.allowed) throw conflict(check.reason ?? "Không thể hủy link này.")

      const snapshot = obj(session.product_snapshot)

      if (isCoordinatorOrAdmin) {
        // Điều hành duyệt trực tiếp
        await this.db.$transaction([
          this.db.greeting_sessions.update({
            where: { id: session.id },
            data: {
              revoked_at: now,
              revoked_by: ctx.userId,
              expires_at: now,
              product_snapshot: {
                ...snapshot,
                _dismissal: initialDismissal as unknown as Prisma.InputJsonValue,
              },
            },
          }),
          this.db.greeting_journey_events.create({
            data: scopedData(ctx, {
              id: randomUUID(),
              session_id: session.id,
              event_type: "DISMISSED",
              metadata: initialDismissal as unknown as Prisma.InputJsonValue,
            }),
          }),
        ])
      } else {
        // Sale đề xuất -> Chờ duyệt trong 5 phút
        await this.db.$transaction([
          this.db.greeting_sessions.update({
            where: { id: session.id },
            data: {
              product_snapshot: {
                ...snapshot,
                _dismissal: initialDismissal as unknown as Prisma.InputJsonValue,
              },
            },
          }),
          this.db.greeting_journey_events.create({
            data: scopedData(ctx, {
              id: randomUUID(),
              session_id: session.id,
              event_type: "DISMISS_PROPOSED",
              metadata: initialDismissal as unknown as Prisma.InputJsonValue,
            }),
          }),
        ])
      }

      await recordAuditLog(ctx, {
        action: isCoordinatorOrAdmin ? "session.dismiss.direct" : "session.dismiss.propose",
        entityType: "greeting_session",
        entityId: session.id,
        before: { revoked_at: session.revoked_at },
        after: { dismissal: initialDismissal },
      })

      return { directApproved: isCoordinatorOrAdmin, dismissal: initialDismissal }
    }

    // ORDER
    const order = await this.db.orders.findFirst({
      where: scopedWhere(ctx, { id: input.id }),
      include: { greeting_sessions: { take: 1 } },
    })
    if (!order) throw notFound()

    const check = canProposeDismissal({
      isCancelled: order.status === "CANCELLED",
      paidVnd: Number(order.paid_vnd || 0),
      currentStepId: order.production_status ? "STEP_6_ARRANGING" : "STEP_3_FILLING_FORM",
    })
    if (!check.allowed) throw conflict(check.reason ?? "Không thể hủy đơn này.")

    const ref = obj(order.pricing_rule_ref)

    if (isCoordinatorOrAdmin) {
      await this.db.$transaction(async (tx) => {
        await tx.orders.update({
          where: { id: order.id },
          data: {
            status: "CANCELLED",
            pricing_rule_ref: {
              ...ref,
              dismissal: initialDismissal as unknown as Prisma.InputJsonValue,
            },
          },
        })
        if (order.greeting_sessions[0]) {
          await tx.greeting_sessions.update({
            where: { id: order.greeting_sessions[0].id },
            data: { revoked_at: now, revoked_by: ctx.userId },
          })
        }
      })
    } else {
      await this.db.orders.update({
        where: { id: order.id },
        data: {
          pricing_rule_ref: {
            ...ref,
            dismissal: initialDismissal as unknown as Prisma.InputJsonValue,
          },
        },
      })
    }

    await recordAuditLog(ctx, {
      action: isCoordinatorOrAdmin ? "order.dismiss.direct" : "order.dismiss.propose",
      entityType: "order",
      entityId: order.id,
      before: { status: order.status },
      after: { dismissal: initialDismissal },
    })

    return { directApproved: isCoordinatorOrAdmin, dismissal: initialDismissal }
  }

  /**
   * Điều hành phê duyệt hoặc từ chối đề xuất hủy bỏ hiển thị.
   */
  async decide(
    ctx: TenantContext,
    input: { id: string; type: "ORDER" | "SESSION"; approve: boolean; note?: string },
  ): Promise<{ status: "APPROVED" | "REJECTED" }> {
    const now = new Date()
    const nowIso = now.toISOString()
    const userName = await this.resolveUserName(ctx)
    const decisionStatus = input.approve ? "APPROVED" : "REJECTED"

    if (input.type === "SESSION") {
      const session = await this.db.greeting_sessions.findFirst({
        where: scopedWhere(ctx, { id: input.id }),
      })
      if (!session) throw notFound()

      const snapshot = obj(session.product_snapshot)
      const current = obj(snapshot._dismissal) as unknown as DismissalInfo
      if (!current || current.status !== "PENDING") {
        throw conflict("Yêu cầu này không ở trạng thái chờ duyệt.")
      }

      const updatedDismissal: DismissalInfo = {
        ...current,
        status: decisionStatus,
        decidedBy: ctx.userId,
        decidedByName: userName,
        decidedAt: nowIso,
        note: input.note ? `${current.note || ""}; Phản hồi: ${input.note.trim()}` : current.note,
      }

      await this.db.$transaction([
        this.db.greeting_sessions.update({
          where: { id: session.id },
          data: {
            ...(input.approve ? { revoked_at: now, revoked_by: ctx.userId, expires_at: now } : {}),
            product_snapshot: {
              ...snapshot,
              _dismissal: updatedDismissal as unknown as Prisma.InputJsonValue,
            },
          },
        }),
        this.db.greeting_journey_events.create({
          data: scopedData(ctx, {
            id: randomUUID(),
            session_id: session.id,
            event_type: input.approve ? "DISMISSED" : "DISMISS_REJECTED",
            metadata: updatedDismissal as unknown as Prisma.InputJsonValue,
          }),
        }),
      ])

      await recordAuditLog(ctx, {
        action: input.approve ? "session.dismiss.approve" : "session.dismiss.reject",
        entityType: "greeting_session",
        entityId: session.id,
        before: { dismissal: current },
        after: { dismissal: updatedDismissal },
      })

      return { status: decisionStatus }
    }

    // ORDER
    const order = await this.db.orders.findFirst({
      where: scopedWhere(ctx, { id: input.id }),
      include: { greeting_sessions: { take: 1 } },
    })
    if (!order) throw notFound()

    const ref = obj(order.pricing_rule_ref)
    const current = obj(ref.dismissal) as unknown as DismissalInfo
    if (!current || current.status !== "PENDING") {
      throw conflict("Đơn này không có yêu cầu hủy nào đang chờ duyệt.")
    }

    const updatedDismissal: DismissalInfo = {
      ...current,
      status: decisionStatus,
      decidedBy: ctx.userId,
      decidedByName: userName,
      decidedAt: nowIso,
      note: input.note ? `${current.note || ""}; Phản hồi: ${input.note.trim()}` : current.note,
    }

    await this.db.$transaction(async (tx) => {
      await tx.orders.update({
        where: { id: order.id },
        data: {
          ...(input.approve ? { status: "CANCELLED" } : {}),
          pricing_rule_ref: {
            ...ref,
            dismissal: updatedDismissal as unknown as Prisma.InputJsonValue,
          },
        },
      })
      if (input.approve && order.greeting_sessions[0]) {
        await tx.greeting_sessions.update({
          where: { id: order.greeting_sessions[0].id },
          data: { revoked_at: now, revoked_by: ctx.userId },
        })
      }
    })

    await recordAuditLog(ctx, {
      action: input.approve ? "order.dismiss.approve" : "order.dismiss.reject",
      entityType: "order",
      entityId: order.id,
      before: { dismissal: current },
      after: { dismissal: updatedDismissal },
    })

    return { status: decisionStatus }
  }

  /**
   * Khôi phục đơn hàng / link Thẻ chào đã hủy hoặc đã bỏ hiển thị.
   */
  async restore(
    ctx: TenantContext,
    input: { id: string; type: "ORDER" | "SESSION"; reason?: string },
  ): Promise<void> {
    const now = new Date()
    const userName = await this.resolveUserName(ctx)
    const restoreNote = input.reason?.trim() || "Khôi phục lại tiến độ theo yêu cầu"

    if (input.type === "SESSION") {
      const session = await this.db.greeting_sessions.findFirst({
        where: scopedWhere(ctx, { id: input.id }),
      })
      if (!session) throw notFound()

      const snapshot = obj(session.product_snapshot)
      const futureExpiry = new Date(now.getTime() + 7 * 86_400_000)

      await this.db.$transaction([
        this.db.greeting_sessions.update({
          where: { id: session.id },
          data: {
            revoked_at: null,
            revoked_by: null,
            expires_at: futureExpiry,
            product_snapshot: {
              ...snapshot,
              _dismissal: null,
            },
          },
        }),
        this.db.greeting_journey_events.create({
          data: scopedData(ctx, {
            id: randomUUID(),
            session_id: session.id,
            event_type: "RESTORED",
            metadata: {
              restoredBy: ctx.userId,
              restoredByName: userName,
              restoredAt: now.toISOString(),
              reason: restoreNote,
            },
          }),
        }),
      ])

      await recordAuditLog(ctx, {
        action: "session.restore",
        entityType: "greeting_session",
        entityId: session.id,
        before: { revoked_at: session.revoked_at },
        after: { revoked_at: null, restoredBy: ctx.userId, reason: restoreNote },
      })
      return
    }

    // ORDER
    const order = await this.db.orders.findFirst({
      where: scopedWhere(ctx, { id: input.id }),
      include: { greeting_sessions: { take: 1 } },
    })
    if (!order) throw notFound()

    const ref = obj(order.pricing_rule_ref)
    const newStatus = Number(order.paid_vnd || 0) > 0 ? "CONFIRMED" : "DRAFT"

    await this.db.$transaction(async (tx) => {
      await tx.orders.update({
        where: { id: order.id },
        data: {
          status: newStatus,
          pricing_rule_ref: {
            ...ref,
            dismissal: null,
          },
        },
      })
      if (order.greeting_sessions[0]) {
        await tx.greeting_sessions.update({
          where: { id: order.greeting_sessions[0].id },
          data: {
            revoked_at: null,
            revoked_by: null,
            expires_at: new Date(now.getTime() + 7 * 86_400_000),
          },
        })
      }
    })

    await recordAuditLog(ctx, {
      action: "order.restore",
      entityType: "order",
      entityId: order.id,
      before: { status: order.status },
      after: { status: newStatus, restoredBy: ctx.userId, reason: restoreNote },
    })
  }
}
