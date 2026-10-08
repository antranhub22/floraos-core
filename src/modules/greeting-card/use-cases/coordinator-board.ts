import type { TenantContext } from "@/core/tenancy"
import { log } from "@/core/observability/log"
import { COORDINATOR_BOARD_MAX, DONE_VISIBLE_MS, sortByDelivery } from "../domain/coordinator-board"
import { BrochureOrderRepository } from "../infra/brochure-order-repository"
import { resolveSaleScope } from "./order-scope"

/**
 * `GET /greeting-card/coordinator-board` — toàn bộ đơn còn việc cho bảng Điều phối, xếp theo ngày +
 * giờ giao gần nhất (đếm "Cần làm / Đang làm / Xong" trên đủ đơn, không cắt 20 đơn như trước).
 */
export async function getCoordinatorBoard(ctx: TenantContext, input: { date?: string | undefined }, repo = new BrochureOrderRepository(), now = new Date()) {
  const saleId = (await resolveSaleScope(ctx)) ?? undefined
  const rows = await repo.listCoordinatorBoard(ctx, {
    date: input.date,
    saleId,
    doneSince: new Date(now.getTime() - DONE_VISIBLE_MS),
    max: COORDINATOR_BOARD_MAX,
  })
  const truncated = rows.length >= COORDINATOR_BOARD_MAX
  if (truncated) log.warn("greeting_card.coordinator_board_truncated", { organizationId: ctx.organizationId, feature: "greeting-card", max: COORDINATOR_BOARD_MAX })
  return { data: sortByDelivery(rows), truncated }
}
