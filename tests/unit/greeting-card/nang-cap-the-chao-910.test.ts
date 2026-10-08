import { describe, expect, it } from "vitest"
import { groupSaleKanban } from "@/modules/greeting-card/domain/sale-kanban"
import { detectUserIntent, querySaasKnowledge } from "@/modules/chat-assistant/domain/saas-knowledge-base"
import type { TrackingPipelineStepId } from "@/modules/greeting-card/domain/tracking-pipeline-types"
import type { StuckInfo } from "@/modules/greeting-card/domain/step-sla"

describe("Nâng cấp Thẻ Chào Mẫu Hoa (Yêu cầu 9/10)", () => {
  it("groupSaleKanban: ưu tiên đơn có mốc thời gian giao hàng sớm hơn lên đầu cột", () => {
    const item1 = {
      id: "item-late",
      currentStepId: "STEP_6_ARRANGING" as TrackingPipelineStepId,
      stepStartedAt: "2026-10-09T01:00:00Z",
      deliveryDate: "2026-10-09",
      deliveryTimeSlot: "14:00 - 16:00",
      stuck: null,
    }
    const item2 = {
      id: "item-early",
      currentStepId: "STEP_6_ARRANGING" as TrackingPipelineStepId,
      stepStartedAt: "2026-10-09T02:00:00Z",
      deliveryDate: "2026-10-09",
      deliveryTimeSlot: "08:00 - 10:00",
      stuck: null,
    }
    const cols = groupSaleKanban([item1, item2])
    const arrCol = cols.find((c) => c.step.id === "STEP_6_ARRANGING")!
    expect(arrCol.items.map((i) => i.id)).toEqual(["item-early", "item-late"])
  })

  it("SaaS Copilot nhận diện đúng intent và truy vấn tri thức Thẻ Chào Mẫu Hoa", () => {
    expect(detectUserIntent("Hướng dẫn sử dụng Thẻ Chào mẫu hoa")).toBe("SAAS_HELP")
    expect(detectUserIntent("Cách Điều hành xác nhận tiền về cho link đặt hoa")).toBe("SAAS_HELP")

    const kbOverview = querySaasKnowledge("Quy trình Thẻ Chào mẫu hoa")
    expect(kbOverview).not.toBeNull()
    expect(kbOverview?.id).toBe("the_chao_tong_quan")

    const kbAdmin = querySaasKnowledge("Điều hành xác nhận tiền về và đối soát milestones")
    expect(kbAdmin).not.toBeNull()
    expect(kbAdmin?.id).toBe("the_chao_dieu_hanh")

    const kbSale = querySaasKnowledge("Quy trình cho sale theo dõi kanban khách hàng thẻ chào")
    expect(kbSale).not.toBeNull()
    expect(kbSale?.id).toBe("the_chao_sale")

    const kbCoordinator = querySaasKnowledge("Điều phối xưởng hoa nghiệm thu ảnh 10 phút giao gấp")
    expect(kbCoordinator).not.toBeNull()
    expect(kbCoordinator?.id).toBe("the_chao_dieu_phoi")
  })

  it("SALE_KANBAN_COLS có đủ 9 cột chuẩn đồng bộ với PIPELINE_STEPS", () => {
    const cols = groupSaleKanban([])
    expect(cols).toHaveLength(9)
    const stepIds = cols.map((c) => c.step.id)
    expect(stepIds).toEqual([
      "STEP_1_OPENED",
      "STEP_2_CHOOSING",
      "STEP_3_FILLING_FORM",
      "STEP_4_PAYMENT_PENDING",
      "STEP_5_PAYMENT_CONFIRMED",
      "STEP_6_ARRANGING",
      "STEP_7_READY_QC",
      "STEP_8_DELIVERING",
      "STEP_9_COMPLETED",
    ])
  })

  it("groupSaleKanban: ưu tiên đơn stuck của Sale lên trước kể cả giờ giao sau", () => {
    interface TestItem {
      id: string
      currentStepId: TrackingPipelineStepId
      stepStartedAt: string
      deliveryDate: string
      deliveryTimeSlot: string
      stuck: StuckInfo | null
    }

    const itemNormalEarly: TestItem = {
      id: "normal-early",
      currentStepId: "STEP_4_PAYMENT_PENDING",
      stepStartedAt: "2026-10-09T01:00:00Z",
      deliveryDate: "2026-10-09",
      deliveryTimeSlot: "08:00 - 10:00",
      stuck: null,
    }
    const itemStuckLate: TestItem = {
      id: "stuck-late",
      currentStepId: "STEP_4_PAYMENT_PENDING",
      stepStartedAt: "2026-10-09T01:00:00Z",
      deliveryDate: "2026-10-09",
      deliveryTimeSlot: "14:00 - 16:00",
      stuck: {
        stepId: "STEP_4_PAYMENT_PENDING",
        owner: "SALE",
        overdueMinutes: 10,
        message: "Khách chưa thanh toán",
      },
    }
    const cols = groupSaleKanban<TestItem>([itemNormalEarly, itemStuckLate])
    const paymentCol = cols.find((c) => c.step.id === "STEP_4_PAYMENT_PENDING")!
    expect(paymentCol.items.map((i) => i.id)).toEqual(["stuck-late", "normal-early"])
  })
})
