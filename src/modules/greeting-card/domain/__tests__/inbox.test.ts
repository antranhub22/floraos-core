import { describe, it, expect } from "vitest"
import { inboxActions, type PipelineLike } from "../inbox"

describe("inboxActions — cơ chế thanh toán lần 2 và thu nợ sau giao", () => {
  const baseOrder: PipelineLike = {
    id: "ord-1",
    type: "ORDER",
    orderId: "ord-1",
    sessionId: "sess-1",
    orderCode: "DH101",
    sendCode: "S101",
    customerName: "Nguyễn Văn A",
    productName: "Bó hoa hồng đỏ",
    productImageUrl: "/img/rose.jpg",
    totalVnd: 1_000_000,
    paidVnd: 300_000,
    balanceVnd: 700_000,
    currentStepId: "STEP_7_READY_QC",
    currentStepTitle: "Hoa hoàn thiện & Duyệt mẫu",
    productionStatus: "READY",
    deliveryStatus: "PENDING",
    stepStartedAt: new Date().toISOString(),
    stuck: null,
    saleId: "sale-99",
  }

  it("Cơ chế 1: Sale phụ trách nhận action nhắc khách duyệt ảnh và thanh toán lần 2", () => {
    const actions = inboxActions([baseOrder], "SALE", "sale-99")
    const remindAction = actions.find((a) => a.kind === "REMIND_BALANCE_PAYMENT")
    expect(remindAction).toBeDefined()
    expect(remindAction?.title).toContain("Nhắc khách")
    expect(remindAction?.detail).toContain("700.000")
    expect(remindAction?.tab).toBe("sales")

    // Sale khác không nhận được action này
    const otherSaleActions = inboxActions([baseOrder], "SALE", "sale-other")
    expect(otherSaleActions.find((a) => a.kind === "REMIND_BALANCE_PAYMENT")).toBeUndefined()
  })

  it("Cơ chế 1: Điều phối nhận action chờ thanh toán lần 2", () => {
    const actions = inboxActions([baseOrder], "COORDINATOR", "coord-1")
    const waitAction = actions.find((a) => a.kind === "WAITING_SECOND_PAYMENT")
    expect(waitAction).toBeDefined()
    expect(waitAction?.title).toContain("Chờ khách thanh toán lần 2")
    expect(waitAction?.tab).toBe("coordinator")
  })

  it("Cơ chế 2: Sau khi giao hàng (DELIVERED) còn nợ cọc → Sale và Admin nhận action thu tiền sau giao", () => {
    const deliveredOrder: PipelineLike = {
      ...baseOrder,
      currentStepId: "STEP_9_COMPLETED",
      deliveryStatus: "DELIVERED",
    }

    const saleActions = inboxActions([deliveredOrder], "SALE", "sale-99")
    const saleCollect = saleActions.find((a) => a.kind === "COLLECT_POST_DELIVERY_BALANCE")
    expect(saleCollect).toBeDefined()
    expect(saleCollect?.title).toContain("Thu phần tiền còn lại sau giao")
    expect(saleCollect?.detail).toContain("700.000")

    const adminActions = inboxActions([deliveredOrder], "ADMIN", "admin-1")
    const adminCollect = adminActions.find((a) => a.kind === "COLLECT_POST_DELIVERY_BALANCE")
    expect(adminCollect).toBeDefined()
    expect(adminCollect?.tab).toBe("payment")
  })

  it("Đơn đã trả đủ 100% không sinh các action đòi nợ lần 2", () => {
    const fullPaidOrder: PipelineLike = {
      ...baseOrder,
      paidVnd: 1_000_000,
      balanceVnd: 0,
    }
    const saleActions = inboxActions([fullPaidOrder], "SALE", "sale-99")
    expect(saleActions.find((a) => a.kind === "REMIND_BALANCE_PAYMENT")).toBeUndefined()

    const coordActions = inboxActions([fullPaidOrder], "COORDINATOR", "coord-1")
    expect(coordActions.find((a) => a.kind === "WAITING_SECOND_PAYMENT")).toBeUndefined()
  })
})
