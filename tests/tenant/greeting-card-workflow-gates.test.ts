import { randomUUID } from "node:crypto"
import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { disconnectDatabase, resetDatabase } from "../helpers/database"
import { createTenant, type Tenant } from "../helpers/fixtures"
import type { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/core/tenancy/infra/prisma"
import { GreetingCardRepository } from "@/modules/greeting-card/infra/greeting-card-repository"
import { PhotoApprovalRepository } from "@/modules/greeting-card/infra/photo-approval-repository"
import { ProductRepository } from "@/modules/products/infra/product-repository"
import { createSendLink } from "@/modules/greeting-card/use-cases/create-send-link"
import { submitBrochureOrder } from "@/modules/greeting-card/use-cases/submit-brochure-order"
import { selectBrochureProduct } from "@/modules/greeting-card/use-cases/select-brochure-product"
import { getCoordinatorBoard } from "@/modules/greeting-card/use-cases/coordinator-board"
import {
  assignBrochureFlorist,
  dispatchBrochureShipping,
  uploadBrochureProductPhoto,
} from "@/modules/greeting-card/use-cases/update-brochure-order-status"
import {
  BROCHURE_WORKFLOW_POLICY_KEY,
  LEAN_WORKFLOW_POLICY,
  STANDARD_WORKFLOW_POLICY,
  STRICT_WORKFLOW_POLICY,
  serializeWorkflowPolicy,
  type BrochureWorkflowPolicy,
} from "@/modules/greeting-card/domain/brochure-workflow-policy"

/** Quy trình vận hành là chuẩn duy nhất cho chốt giao hoa ở máy chủ (PO 17/10/2026). */

const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10)
const ORDER_INPUT = {
  customerName: "Khách Hàng", customerPhone: "0987654321", recipientName: "Người Nhận", recipientPhone: "0912345678",
  confirmedTerms: true, selectedPromotionId: "promo-discount-10", deliveryDate: inDays(10), deliveryAddress: "123 Đường Hoa, Quận 1",
}

async function codeOf(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise
    return undefined
  } catch (err) {
    return (err as { code?: string }).code
  }
}

describe("greeting-card: chốt giao hoa theo Quy trình vận hành", () => {
  let a: Tenant
  let b: Tenant

  beforeEach(async () => {
    await resetDatabase()
    a = await createTenant("alpha")
    b = await createTenant("beta")
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  async function useSettings(settings: Record<string, unknown>) {
    await prisma.organizations.update({ where: { id: a.organizationId }, data: { settings: settings as Prisma.InputJsonValue } })
  }
  const wf = (p: BrochureWorkflowPolicy) => ({ [BROCHURE_WORKFLOW_POLICY_KEY]: serializeWorkflowPolicy(p) })

  async function placeOrder() {
    const repo = new GreetingCardRepository()
    const product = await new ProductRepository().create(a.ctx, { code: `HOA-${randomUUID().slice(0, 6)}`, name: "Bó hoa", attributes: { price: 500000 } })
    const catalog = await repo.createCatalog(a.ctx, { code: `bo-${randomUUID().slice(0, 6)}`, name: "Bộ", productIds: [product.id], createdBy: a.userId })
    const link = await createSendLink(a.ctx, { catalogId: catalog.id })
    await selectBrochureProduct(link.sendCode, product.id)
    return submitBrochureOrder(link.sendCode, ORDER_INPUT)
  }
  const accept = (orderId: string) => prisma.orders.update({ where: { id: orderId }, data: { status: "CONFIRMED" } })

  async function asset() {
    return prisma.assets.create({
      data: {
        id: randomUUID(), organization_id: a.organizationId, kind: "ORIGINAL", state: "READY", version: 1,
        storage_key: `org/${a.organizationId}/unfiled/${randomUUID()}.jpg`, mime_type: "image/jpeg", created_by: a.userId,
      },
    })
  }

  /** Đẩy lùi mốc ảnh thành phẩm như thể đã tải từ `minutes` phút trước. */
  async function ageUpload(orderId: string, minutes: number) {
    await prisma.order_qc_records.updateMany({
      where: { order_id: orderId, notes: "PRODUCT_PHOTO_UPLOADED" },
      data: { created_at: new Date(Date.now() - minutes * 60_000) },
    })
  }

  it("đơn chưa nhận: không giao florist / chụp ảnh được (409); tổ chức khác vẫn 404", async () => {
    const order = await placeOrder()
    expect(await codeOf(assignBrochureFlorist(a.ctx, order.orderId, { floristNote: "Thợ A" }))).toBe("CONFLICT")
    expect(await codeOf(uploadBrochureProductPhoto(a.ctx, order.orderId, { skipPhoto: true }))).toBe("CONFLICT")
    expect(await codeOf(assignBrochureFlorist(b.ctx, order.orderId, { floristNote: "Thợ B" }))).toBe("NOT_FOUND")
    await accept(order.orderId)
    await assignBrochureFlorist(a.ctx, order.orderId, { floristNote: "Thợ A" })
  })

  it("thu đủ trước giao đọc theo quy trình đã lưu, không theo chính sách thanh toán cũ", async () => {
    await useSettings({ ...wf(LEAN_WORKFLOW_POLICY), brochure_policy: { require_full_before_dispatch: true } })
    const lean = await placeOrder()
    await accept(lean.orderId)
    await uploadBrochureProductPhoto(a.ctx, lean.orderId, { skipPhoto: true })
    await dispatchBrochureShipping(a.ctx, lean.orderId, { trackingNote: "Ship" })

    await useSettings({ ...wf({ ...STANDARD_WORKFLOW_POLICY, customerApprovalMode: "BYPASS", preset: "CUSTOM" }), brochure_policy: { require_full_before_dispatch: false } })
    const standard = await placeOrder()
    await accept(standard.orderId)
    await uploadBrochureProductPhoto(a.ctx, standard.orderId, { skipPhoto: true })
    expect(await codeOf(dispatchBrochureShipping(a.ctx, standard.orderId, { trackingNote: "Ship" }))).toBe("CONFLICT")
  })

  it("tiệm chưa lưu quy trình: giữ chính sách thanh toán cũ (không đổi ngầm)", async () => {
    await useSettings({ brochure_policy: { require_full_before_dispatch: false, require_product_photo_qc: false } })
    const order = await placeOrder()
    await accept(order.orderId)
    // Không bắt qua bước ảnh + không bắt thu đủ → giao thẳng như trước
    await dispatchBrochureShipping(a.ctx, order.orderId, { trackingNote: "Ship" })
  })

  it("Bắt buộc khách duyệt: khách im lặng bao lâu cũng không tự qua; Điều phối thấy lý do", async () => {
    await useSettings(wf({ ...STRICT_WORKFLOW_POLICY, requireFullPaymentBeforeDispatch: false, preset: "CUSTOM" }))
    const order = await placeOrder()
    await accept(order.orderId)
    await uploadBrochureProductPhoto(a.ctx, order.orderId, { assetId: (await asset()).id })
    await ageUpload(order.orderId, 240)
    expect(await codeOf(dispatchBrochureShipping(a.ctx, order.orderId, { trackingNote: "Ship" }))).toBe("CONFLICT")
    const row = (await getCoordinatorBoard(a.ctx, {})).data.find((o) => o.id === order.orderId)
    expect(row?.photo_approval).toMatchObject({ status: "PENDING", autoApprove: false })
  })

  it("Thời hạn từng bước: dùng số phút đã cài; tắt tự duyệt thì hết giờ vẫn chờ khách", async () => {
    await useSettings({
      ...wf({ ...STANDARD_WORKFLOW_POLICY, requireFullPaymentBeforeDispatch: false, preset: "CUSTOM" }),
      step_timeout_policy: { photo_review_timeout_minutes: 20, auto_approve_photo_on_timeout: false },
    })
    const order = await placeOrder()
    await accept(order.orderId)
    await uploadBrochureProductPhoto(a.ctx, order.orderId, { assetId: (await asset()).id })
    const row = (await getCoordinatorBoard(a.ctx, {})).data.find((o) => o.id === order.orderId)
    expect(row?.photo_approval).toMatchObject({ status: "PENDING", countdownMinutes: 20 })
    await ageUpload(order.orderId, 30)
    expect(await codeOf(dispatchBrochureShipping(a.ctx, order.orderId, { trackingNote: "Ship" }))).toBe("CONFLICT")
  })

  it("tải ảnh mới sau khi khách đã duyệt → phải duyệt lại; khách duyệt lần hai được ghi nhận", async () => {
    await useSettings(wf({ ...STRICT_WORKFLOW_POLICY, requireFullPaymentBeforeDispatch: false, preset: "CUSTOM" }))
    const order = await placeOrder()
    await accept(order.orderId)
    await uploadBrochureProductPhoto(a.ctx, order.orderId, { assetId: (await asset()).id })
    const approvals = new PhotoApprovalRepository()
    expect(await approvals.recordApproval(await prisma.orders.findUniqueOrThrow({ where: { id: order.orderId } }))).toEqual({ created: true })
    await ageUpload(order.orderId, 5) // lần tải đầu trước lần duyệt

    await uploadBrochureProductPhoto(a.ctx, order.orderId, { assetId: (await asset()).id })
    expect(await codeOf(dispatchBrochureShipping(a.ctx, order.orderId, { trackingNote: "Ship" }))).toBe("CONFLICT")
    expect(await approvals.recordApproval(await prisma.orders.findUniqueOrThrow({ where: { id: order.orderId } }))).toEqual({ created: true })
    await dispatchBrochureShipping(a.ctx, order.orderId, { trackingNote: "Ship" })
  })
})
