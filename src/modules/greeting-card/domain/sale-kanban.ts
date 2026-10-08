/**
 * Bảng Kanban của Sale: cùng một tập đơn/link (quy trình theo dõi), mỗi bước 1→9 là một cột riêng.
 * Trong cột, việc kẹt của Sale lên đầu rồi đến đơn vừa đổi bước. Pure TypeScript.
 */
import { sortWorklist } from "./worklist"
import { PIPELINE_STEPS, type StepDefinition, type TrackingPipelineStepId } from "./tracking-pipeline-types"
import type { StuckInfo } from "./step-sla"

export interface SaleKanbanColumn<T> {
  step: StepDefinition
  items: T[]
  /** Số thẻ trong cột đang kẹt ở phần việc của Sale. */
  needsMe: number
}

interface KanbanItem {
  currentStepId: TrackingPipelineStepId
  stepStartedAt: string
  stuck: StuckInfo | null
  deliveryDate?: string | null | undefined
  deliveryTimeSlot?: string | null | undefined
}

export function groupSaleKanban<T extends KanbanItem>(items: T[]): SaleKanbanColumn<T>[] {
  const sorted = [...items].sort((a, b) => {
    // 1. Việc kẹt của Sale lên đầu
    const aMine = a.stuck?.owner === "SALE" ? 1 : 0
    const bMine = b.stuck?.owner === "SALE" ? 1 : 0
    if (aMine !== bMine) return bMine - aMine

    // 2. Ưu tiên theo mốc thời gian giao hàng (đơn cần giao sớm đứng trước)
    if (a.deliveryDate && b.deliveryDate && a.deliveryDate !== b.deliveryDate) {
      return a.deliveryDate.localeCompare(b.deliveryDate)
    }
    if (a.deliveryDate && !b.deliveryDate) return -1
    if (!a.deliveryDate && b.deliveryDate) return 1

    // 3. Khung giờ giao hàng
    if (a.deliveryTimeSlot && b.deliveryTimeSlot && a.deliveryTimeSlot !== b.deliveryTimeSlot) {
      return a.deliveryTimeSlot.localeCompare(b.deliveryTimeSlot)
    }

    // 4. Nếu không có mốc giao: đơn vừa đổi bước lên trước (lùi fallback an toàn)
    const aStuck = a.stuck ? 1 : 0
    const bStuck = b.stuck ? 1 : 0
    if (aStuck !== bStuck) return aStuck - bStuck
    return Date.parse(b.stepStartedAt) - Date.parse(a.stepStartedAt)
  })

  return [...PIPELINE_STEPS]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((step) => {
      const colItems = sorted.filter((i) => i.currentStepId === step.id)
      return { step, items: colItems, needsMe: colItems.filter((i) => i.stuck?.owner === "SALE").length }
    })
}
