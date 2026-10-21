import type { CoordinatorOrderFacts } from "@/modules/greeting-card/domain/coordinator-card-actions"
import type { BrochureOrder } from "./coordinator-order-card"

/** Dữ kiện đơn cho hàm chặn tác vụ dùng chung (Lưới thẻ + Kanban + máy chủ). */
export function coordinatorFactsOf(order: BrochureOrder): CoordinatorOrderFacts {
  return {
    status: order.status, productionStatus: order.production_status, deliveryStatus: order.delivery_status,
    totalVnd: order.total_vnd, paidVnd: order.paid_vnd, photoApproval: order.photo_approval,
  }
}
