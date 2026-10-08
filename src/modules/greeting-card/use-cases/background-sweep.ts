import type { TenantContext } from "@/core/tenancy"
import { log } from "@/core/observability/log"
import { BackgroundSweepRepository } from "../infra/background-sweep-repository"
import { BrochurePaymentRepository } from "../infra/brochure-payment-repository"
import { parsePaymentPolicy } from "../domain/brochure-payment-policy"
import { NOTIFY_EVENTS, type NotifyEvent } from "../domain/customer-notifications"
import {
  AUTO_CANCEL_REASON, PAYMENT_TIMEOUT_REASON, RETRY_BACKOFF_MS, RETRY_WINDOW_MS, STALE_SENDING_MS, holdAction,
} from "../domain/background-sweep"
import { notifyOrderEvent, queueOrderNotification } from "./notify-customer"

const HOLD_LOOKBACK_MS = 7 * 86_400_000

export interface SweepResult {
  staleFailed: number
  retried: number
  reminded: number
  cancelled: number
}

/** Ngữ cảnh "hệ thống" cho thao tác tự động — audit ghi rõ nguồn, không mang năng lực của ai. */
function systemContext(organizationId: string): TenantContext {
  return { organizationId, workspaceId: "", userId: "system:hold-expiry", branchId: null, capabilities: new Set() }
}

/**
 * Một vòng quét: (1) tin kẹt → lỗi, (2) gửi lại tin lỗi có giới hạn, (3) nhắc/huỷ đơn quá hạn giữ.
 * Không bao giờ ném lỗi ra ngoài — lỗi từng đơn được ghi log, vòng sau làm tiếp.
 */
export async function runBackgroundSweep(
  now = new Date(),
  repo = new BackgroundSweepRepository(),
  payments = new BrochurePaymentRepository(),
): Promise<SweepResult> {
  const result: SweepResult = { staleFailed: 0, retried: 0, reminded: 0, cancelled: 0 }

  result.staleFailed = await repo.failStaleSending(new Date(now.getTime() - STALE_SENDING_MS))

  const retryable = await repo.listRetryable(new Date(now.getTime() - RETRY_BACKOFF_MS), new Date(now.getTime() - RETRY_WINDOW_MS))
  for (const n of retryable) {
    if (!(NOTIFY_EVENTS as readonly string[]).includes(n.event_key)) continue
    // `claim` chỉ cho FAILED → SENDING một lần: instance khác quét cùng lúc nhận DUPLICATE
    const outcome = await notifyOrderEvent(n.organization_id, n.order_id, n.event_key as NotifyEvent).catch(() => "FAILED" as const)
    if (outcome === "SENT") result.retried += 1
  }

  for (const o of await repo.listUnpaidDrafts(new Date(now.getTime() - HOLD_LOOKBACK_MS))) {
    const quotedAt = (o.pricing_rule_ref as { quotedAt?: unknown } | null)?.quotedAt
    // Đơn báo giá sau: giữ đơn tính từ lúc có giá, không phải lúc đặt
    const startedAt = typeof quotedAt === "string" && !Number.isNaN(Date.parse(quotedAt)) ? new Date(quotedAt) : o.created_at
    const action = holdAction(
      {
        status: o.status, totalVnd: Number(o.total_vnd), paidVnd: Number(o.paid_vnd), createdAt: startedAt,
        customerReportedPaid: o.greeting_sessions[0]?.status === "PAYMENT_REPORTED",
      },
      parsePaymentPolicy(o.organization.settings),
      now,
    )
    try {
      if (action === "REMIND") {
        // Mốc nhắc chống trùng theo (đơn, mốc) — mỗi đơn chỉ nhắc một lần
        if ((await notifyOrderEvent(o.organization_id, o.id, "PAYMENT_REMINDER")) === "SENT") result.reminded += 1
      } else if (action === "CANCEL" || action === "FAIL_PAYMENT") {
        const failed = action === "FAIL_PAYMENT"
        await payments.cancel(systemContext(o.organization_id), o.id, failed ? PAYMENT_TIMEOUT_REASON : AUTO_CANCEL_REASON, { paymentFailed: failed })
        queueOrderNotification(o.organization_id, o.id, "CANCELLED")
        result.cancelled += 1
      }
    } catch (error) {
      // Đơn vừa đổi trạng thái (khách vừa trả, người khác vừa huỷ) — bỏ qua, vòng sau xét lại
      log.warn("greeting_card.sweep_order_skipped", {
        organizationId: o.organization_id, feature: "greeting-card", action,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }
  return result
}
