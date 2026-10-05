import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { disconnectDatabase, resetDatabase } from "../helpers/database"
import { createTenant, type Tenant } from "../helpers/fixtures"
import { prisma } from "@/core/tenancy/infra/prisma"
import { resetCircuitBreakers } from "@/core/http/circuit-breaker"
import { flushBackground } from "@/core/runtime/background"
import { GreetingCardRepository } from "@/modules/greeting-card/infra/greeting-card-repository"
import { GreetingNotificationRepository } from "@/modules/greeting-card/infra/greeting-notification-repository"
import { ProductRepository } from "@/modules/products/infra/product-repository"
import { createSendLink } from "@/modules/greeting-card/use-cases/create-send-link"
import { submitBrochureOrder } from "@/modules/greeting-card/use-cases/submit-brochure-order"
import { selectBrochureProduct } from "@/modules/greeting-card/use-cases/select-brochure-product"
import { notifyOrderEvent } from "@/modules/greeting-card/use-cases/notify-customer"
import { updateNotifySettings } from "@/modules/greeting-card/use-cases/notify-settings"
import { getIntegrationStatus } from "@/modules/greeting-card/use-cases/integration-status"
import { adminConfirmBrochurePayment } from "@/modules/greeting-card/use-cases/confirm-brochure-payment"

/** greeting_notifications + greeting_integrations: gửi tin Zalo ZNS / eSMS theo mốc đơn (nhà cung cấp giả lập). */

const inTenDays = () => new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10)

type Call = { url: string; body: string; headers: Record<string, string> }
function fakeFetch(responses: Array<Record<string, unknown>>, calls: Call[]) {
  return async (url: string, init?: RequestInit) => {
    calls.push({ url, body: String(init?.body ?? ""), headers: (init?.headers ?? {}) as Record<string, string> })
    return new Response(JSON.stringify(responses.shift() ?? {}), { status: 200 })
  }
}

describe("greeting-card notifications", () => {
  let a: Tenant
  let b: Tenant
  beforeEach(async () => {
    await resetDatabase()
    resetCircuitBreakers()
    a = await createTenant("alpha")
    b = await createTenant("beta")
  })
  afterAll(async () => {
    await disconnectDatabase()
  })

  async function orderFor(t: Tenant) {
    const product = await new ProductRepository().create(t.ctx, { code: "P", name: "Bó hồng", attributes: { price: 500000 } })
    const catalog = await new GreetingCardRepository().createCatalog(t.ctx, { code: "c", name: "C", productIds: [product.id], createdBy: t.userId })
    const link = await createSendLink(t.ctx, { catalogId: catalog.id })
    await selectBrochureProduct(link.sendCode, product.id)
    return submitBrochureOrder(link.sendCode, {
      customerName: "Lan", customerPhone: "0912345678", recipientName: "N", recipientPhone: "0987654321",
      deliveryDate: inTenDays(), deliveryAddress: "12 Lê Lợi, Q1",
    })
  }

  it("ZNS: làm mới token khi chưa biết hạn, LƯU cặp token mới, gửi đúng mẫu + SĐT 84…, mốc chỉ gửi một lần", async () => {
    const order = await orderFor(a)
    await updateNotifySettings(a.ctx, {
      enabled: true, channel: "ZNS",
      credentials: { appId: "app1", secretKey: "sk-app", accessToken: "old-at", refreshToken: "old-rt" },
      templates: { PAYMENT_COMPLETED: "tpl-paid" },
    })
    const calls: Call[] = []
    const fetchImpl = fakeFetch([
      { access_token: "new-at", refresh_token: "new-rt", expires_in: "90000" },
      { error: 0, message: "Success", data: { msg_id: "zmsg-1" } },
    ], calls)
    const repo = new GreetingNotificationRepository()

    expect(await notifyOrderEvent(a.organizationId, order.orderId, "PAYMENT_COMPLETED", repo, fetchImpl)).toBe("SENT")
    expect(calls[0]?.url).toContain("oauth.zaloapp.com")
    expect(calls[0]?.body).toContain("refresh_token=old-rt")
    const sent = JSON.parse(calls[1]!.body) as { phone: string; template_id: string; template_data: { order_code: string } }
    expect(sent).toMatchObject({ phone: "84912345678", template_id: "tpl-paid", template_data: { order_code: order.orderCode } })
    expect(calls[1]?.headers["access_token"]).toBe("new-at")

    // Cặp token mới đã được lưu (mã hoá) — lần sau dùng new-at, không làm mới lại
    const calls2: Call[] = []
    await prisma.greeting_notifications.deleteMany({})
    expect(await notifyOrderEvent(a.organizationId, order.orderId, "PAYMENT_COMPLETED", repo, fakeFetch([{ error: 0 }], calls2))).toBe("SENT")
    expect(calls2).toHaveLength(1)
    expect(calls2[0]?.headers["access_token"]).toBe("new-at")

    expect(await notifyOrderEvent(a.organizationId, order.orderId, "PAYMENT_COMPLETED", repo, fakeFetch([], []))).toBe("DUPLICATE")
    // Mốc không có mẫu ZNS → không gửi
    expect(await notifyOrderEvent(a.organizationId, order.orderId, "READY", repo, fakeFetch([], []))).toBe("DISABLED")
    const log = await prisma.greeting_notifications.findFirstOrThrow({ where: { order_id: order.orderId } })
    expect(log.recipient_masked).toBe("84912***678")
  })

  it("eSMS: lỗi nhà mạng ghi FAILED và lần kích hoạt sau gửi lại; tổ chức khác không có cấu hình thì không gửi", async () => {
    const order = await orderFor(a)
    await updateNotifySettings(a.ctx, {
      enabled: true, channel: "ESMS", credentials: { apiKey: "k-esms", secretKey: "s-esms", brandname: "TIEMHOA" },
    })
    const repo = new GreetingNotificationRepository()
    expect(await notifyOrderEvent(a.organizationId, order.orderId, "DISPATCHED", repo, fakeFetch([{ CodeResult: "99", ErrorMessage: "Sai brandname" }], []))).toBe("FAILED")
    expect((await prisma.greeting_notifications.findFirstOrThrow({ where: { order_id: order.orderId } })).error).toMatch(/Sai brandname/)

    const calls: Call[] = []
    expect(await notifyOrderEvent(a.organizationId, order.orderId, "DISPATCHED", repo, fakeFetch([{ CodeResult: "100", SMSID: "s1" }], calls))).toBe("SENT")
    expect(JSON.parse(calls[0]!.body)).toMatchObject({ Phone: "84912345678", Brandname: "TIEMHOA", SmsType: "2" })
    expect(JSON.parse(calls[0]!.body).Content).toMatch(/dang duoc giao/)

    expect(await notifyOrderEvent(b.organizationId, order.orderId, "DISPATCHED", repo, fakeFetch([], []))).toBe("DISABLED")
  })

  it("thông tin kết nối không đọc ngược ra được; bật mà thiếu thông tin thì báo lỗi; tắt kênh thì thao tác chính không gửi tin", async () => {
    await expect(updateNotifySettings(a.ctx, { enabled: true, channel: "ESMS" })).rejects.toMatchObject({ code: "VALIDATION_FAILED" })
    await updateNotifySettings(a.ctx, { enabled: true, channel: "ESMS", credentials: { apiKey: "k-bi-mat", secretKey: "s-bi-mat", brandname: "TIEM" } })
    const status = await getIntegrationStatus(a.ctx)
    expect(status.notify).toMatchObject({ enabled: true, channel: "ESMS", configured: true })
    const raw = await prisma.greeting_integrations.findFirstOrThrow({ where: { organization_id: a.organizationId } })
    expect(JSON.stringify(raw)).not.toContain("k-bi-mat")
    expect(JSON.stringify(status)).not.toContain("k-bi-mat")

    // Thông báo chạy nền sau thao tác chính; tắt kênh thì không gửi gì (test không gọi mạng thật)
    await updateNotifySettings(a.ctx, { enabled: false, channel: "ESMS" })
    const order = await orderFor(a)
    const paid = await adminConfirmBrochurePayment(a.ctx, order.orderId)
    expect(paid.balanceVnd).toBe(0)
    await flushBackground()
    expect(await prisma.greeting_notifications.count({ where: { order_id: order.orderId } })).toBe(0)
  })
})
