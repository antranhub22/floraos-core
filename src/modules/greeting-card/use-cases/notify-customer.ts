import { openSecret, sealSecret } from "@/core/security/secret-box"
import { runInBackground } from "@/core/runtime/background"
import { log } from "@/core/observability/log"
import { GreetingNotificationRepository } from "../infra/greeting-notification-repository"
import {
  NOTIFY_EVENT_LABELS,
  maskPhone,
  smsText,
  toInternationalPhone,
  type NotifyEvent,
  type NotifyParams,
} from "../domain/customer-notifications"
import { sendZnsMessage, type FetchLike, type ZnsCredentials } from "../adapters/zalo-zns-adapter"
import { sendEsmsMessage, type EsmsCredentials } from "../adapters/esms-adapter"

export const NOTIFY_SECRET_PURPOSE = "greeting-card-notify"

export type NotifyOutcome = "SENT" | "FAILED" | "SKIPPED" | "DUPLICATE" | "DISABLED"

function publicBaseUrl(): string {
  return (process.env["PUBLIC_APP_URL"] || process.env["RENDER_EXTERNAL_URL"] || "").replace(/\/$/, "")
}

/**
 * Gửi tin cho khách ở một mốc đơn. Không bao giờ ném lỗi ra ngoài: thông báo
 * là việc phụ, không được làm hỏng thao tác chính (thu tiền, giao hàng...).
 * Mỗi (đơn, mốc) gửi đúng một lần; lần trước FAILED thì lần kích hoạt sau gửi lại.
 */
export async function notifyOrderEvent(
  organizationId: string,
  orderId: string,
  event: NotifyEvent,
  repo = new GreetingNotificationRepository(),
  fetchImpl: FetchLike = fetch
): Promise<NotifyOutcome> {
  const config = await repo.getChannelConfig(organizationId)
  if (!config?.notify_enabled || !config.notify_channel || !config.notify_config_encrypted) return "DISABLED"
  const channel = config.notify_channel as "ZNS" | "ESMS"
  const templates = (config.notify_templates as Record<string, string> | null) ?? {}
  if (channel === "ZNS" && !templates[event]) return "DISABLED" // tiệm chưa đăng ký mẫu ZNS cho mốc này

  const order = await repo.orderFacts(organizationId, orderId)
  if (!order) return "SKIPPED"
  const phone = toInternationalPhone(order.customer?.phone)
  const claim = await repo.claim(organizationId, orderId, event, channel, phone ? maskPhone(phone) : "không có SĐT")
  if (!claim) return "DUPLICATE"
  if (!phone) {
    await repo.finish(claim.id, { status: "SKIPPED", error: "Khách không có số điện thoại hợp lệ" })
    return "SKIPPED"
  }

  const sendCode = order.source_session_id ? await repo.sendCodeOf(organizationId, order.source_session_id) : null
  const base = publicBaseUrl()
  const params: NotifyParams = {
    order_code: order.code,
    customer_name: order.customer?.name ?? "Quý khách",
    shop_name: order.organization.business_profile?.display_name || order.organization.name,
    status: NOTIFY_EVENT_LABELS[event],
    amount: `${Number(order.paid_vnd).toLocaleString("vi-VN")} đ`,
    tracking_url: base && sendCode ? `${base}/b/${sendCode}` : "",
  }

  try {
    const creds = JSON.parse(openSecret(config.notify_config_encrypted, NOTIFY_SECRET_PURPOSE)) as unknown
    let messageId: string | null
    if (channel === "ZNS") {
      const result = await sendZnsMessage(
        { creds: creds as ZnsCredentials, templateId: templates[event]!, phone, params, trackingId: claim.id },
        fetchImpl
      )
      if (result.updatedCredentials) {
        await repo.saveSealedCredentials(organizationId, sealSecret(JSON.stringify(result.updatedCredentials), NOTIFY_SECRET_PURPOSE))
      }
      messageId = result.messageId
    } else {
      const result = await sendEsmsMessage(
        { creds: creds as EsmsCredentials, phone, content: smsText(event, params), requestId: claim.id },
        fetchImpl
      )
      messageId = result.messageId
    }
    await repo.finish(claim.id, { status: "SENT", providerMessageId: messageId })
    return "SENT"
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log.warn("greeting_card.notify_failed", { organizationId, feature: "greeting-card", event, channel, message })
    await repo.finish(claim.id, { status: "FAILED", error: message })
    return "FAILED"
  }
}

/** Gửi nền sau khi thao tác chính đã ghi xong — người dùng không phải chờ nhà mạng. */
export function queueOrderNotification(organizationId: string, orderId: string, event: NotifyEvent): void {
  runInBackground(`notify:${event}`, () => notifyOrderEvent(organizationId, orderId, event))
}
