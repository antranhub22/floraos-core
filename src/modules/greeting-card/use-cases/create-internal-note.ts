import type { TenantContext } from "@/core/tenancy"
import { TrackingPipelineRepository } from "../infra/tracking-pipeline-repository"
import {
  ROLE_LABELS,
  type InternalNoteRole,
  type TrackingPipelineStepId,
} from "../domain/tracking-pipeline-types"

export interface CreateInternalNoteInput {
  orderId?: string | null | undefined
  sessionId?: string | null | undefined
  stepKey: TrackingPipelineStepId | "GENERAL"
  role: InternalNoteRole
  senderName: string
  content: string
}

export async function createInternalNote(
  ctx: TenantContext,
  input: CreateInternalNoteInput,
  repo = new TrackingPipelineRepository()
) {
  const content = input.content.trim()
  if (!content) {
    throw new Error("Nội dung tin nhắn nội bộ không được để trống")
  }

  const roleLabel = ROLE_LABELS[input.role] || "Nhân viên"
  const senderName = input.senderName.trim() || roleLabel

  if (input.orderId) {
    return repo.addOrderInternalNote(ctx, {
      orderId: input.orderId,
      stepKey: input.stepKey,
      role: input.role,
      roleLabel,
      senderName,
      content,
    })
  }

  if (input.sessionId) {
    return repo.addSessionInternalNote(ctx, {
      sessionId: input.sessionId,
      stepKey: input.stepKey,
      role: input.role,
      roleLabel,
      senderName,
      content,
    })
  }

  throw new Error("Phải chỉ định đơn hàng (orderId) hoặc phiên (sessionId) để gửi tin nhắn")
}
