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
}

export function groupSaleKanban<T extends KanbanItem>(items: T[]): SaleKanbanColumn<T>[] {
  const sorted = sortWorklist(items, "SALE")
  return [...PIPELINE_STEPS]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((step) => {
      const colItems = sorted.filter((i) => i.currentStepId === step.id)
      return { step, items: colItems, needsMe: colItems.filter((i) => i.stuck?.owner === "SALE").length }
    })
}
