/**
 * Use-case: chuyển bước điều phối (R3). Máy chủ quyết định bước nào hợp lệ
 * (`checkStageTransition`) từ bằng chứng trong CSDL — không tin client.
 */

import type { TenantContext } from "@/core/tenancy/tenant-context"
import type { CoordinatorStage } from "../domain/coordinator-types"
import { defaultNextAction } from "../domain/operation-rules"
import { axesAfterTransition } from "../domain/stage-transitions"
import { CoordinatorRepository } from "../infra/coordinator-repository"
import type { CoordinatorOrderView } from "./present-coordinator-order"
import { audit, concurrentUpdate, ensureTransition, getOrderView, loadOrderOrThrow, runCoordinatorTx } from "./shared"

export async function updateCoordinatorStage(
  ctx: TenantContext,
  orderIdOrCode: string,
  nextStage: CoordinatorStage,
  nextAction?: string | undefined
): Promise<CoordinatorOrderView> {
  const orderId = await runCoordinatorTx(async (tx) => {
    const repo = new CoordinatorRepository(tx)
    const row = await loadOrderOrThrow(ctx, repo, orderIdOrCode)
    const from = row.coordination!.stage
    ensureTransition(from, nextStage, await repo.facts(ctx, row))

    const moved = await repo.applyTransition(ctx, row, {
      from,
      to: nextStage,
      axes: axesAfterTransition(nextStage, {
        status: row.status,
        productionStatus: row.production_status,
        deliveryStatus: row.delivery_status,
      }),
      nextAction: nextAction?.trim() || defaultNextAction(nextStage),
      reason: `Điều phối chuyển bước ${from} → ${nextStage}`,
      coordination: from === "EXCEPTION" ? { resume_stage: null } : {},
    })
    if (!moved) throw concurrentUpdate()
    await audit(ctx, tx, "coordinator.stage.update", row.id, { stage: from }, { stage: nextStage })
    return row.id
  })
  return getOrderView(ctx, orderId)
}
