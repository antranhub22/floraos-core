/**
 * Use-case: tiếp nhận đơn điều phối (F01, R2).
 *
 * Mã đơn sinh ở máy chủ, tuần tự theo ngày (`FLR-YYMMDD-NNNN`) — client không
 * đặt mã. Bản trước sinh `FLR-2026-<3 số ngẫu nhiên>` ở CẢ client lẫn máy
 * chủ: 900 mã một năm, trùng là chuyện chắc chắn.
 */

import { AppError } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy/tenant-context"
import { CustomerRepository } from "@/modules/crm/infra/customer-repository"
import type { CoordinationRiskLevel } from "../domain/coordinator-types"
import { coordinatorOrderCode, defaultNextAction } from "../domain/operation-rules"
import { mapStageToOrderAxes } from "../domain/state-mapper"
import { CoordinatorRepository } from "../infra/coordinator-repository"
import { isUniqueViolation, runInTransaction } from "../infra/transaction"
import type { CoordinatorOrderView } from "./present-coordinator-order"
import { audit, ensureAssetsOwned, getOrderView } from "./shared"

export interface CreateCoordinatorOrderInput {
  customerId?: string | undefined
  customerName: string
  customerTier?: string | undefined
  recipientName: string
  recipientPhone: string
  deliveryAddress: Record<string, unknown>
  deliveryTargetTime: string
  deliveryTargetAt?: string | undefined
  productTitle: string
  sampleImageUrl?: string | undefined
  sampleAssetId?: string | undefined
  unitPriceVnd: number
  flowers: Array<{ flowerName: string; quantity: number; unit: string; color: string; role: string }>
  cardMessage?: string | undefined
  internalNote?: string | undefined
  riskLevel?: CoordinationRiskLevel | undefined
}

const MAX_CODE_ATTEMPTS = 5

export async function createCoordinatorOrder(
  ctx: TenantContext,
  input: CreateCoordinatorOrderInput,
  now = new Date()
): Promise<CoordinatorOrderView> {
  if (input.customerId) {
    const customer = await new CustomerRepository().getById(ctx, input.customerId)
    if (!customer) throw new AppError("UNPROCESSABLE_ENTITY", "Khách hàng không tồn tại", { customerId: input.customerId })
  }

  const stage = "INTAKE" as const
  const prefix = coordinatorOrderCode(0, now).slice(0, -4)

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    try {
      const created = await runInTransaction(async (tx) => {
        if (input.sampleAssetId) await ensureAssetsOwned(ctx, tx, [input.sampleAssetId])
        const repo = new CoordinatorRepository(tx)
        const seq = (await repo.countOrdersWithCodePrefix(ctx, prefix)) + 1 + attempt
        const result = await repo.createOrder(ctx, {
          code: coordinatorOrderCode(seq, now),
          stage,
          axes: mapStageToOrderAxes(stage),
          riskLevel: input.riskLevel ?? "NORMAL",
          nextAction: defaultNextAction(stage),
          totalVnd: input.unitPriceVnd,
          customerId: input.customerId ?? null,
          cardMessage: input.cardMessage?.trim() || null,
          internalNote: input.internalNote?.trim() || null,
          deliveryWindow: { timeSlot: input.deliveryTargetTime, targetAt: input.deliveryTargetAt ?? null },
          deliveryAddress: input.deliveryAddress,
          estimatedDeliveryAt: input.deliveryTargetAt ? new Date(input.deliveryTargetAt) : null,
          sampleAssetId: input.sampleAssetId ?? null,
          items: input.flowers.map((f) => ({
            description: `${f.flowerName} (${f.color}, ${f.role})`,
            quantity: f.quantity,
            metadata: { flowerName: f.flowerName, color: f.color, role: f.role, unit: f.unit },
          })),
          metadata: {
            customerName: input.customerName,
            customerTier: input.customerTier ?? "NEW",
            recipientName: input.recipientName,
            recipientPhone: input.recipientPhone,
            productTitle: input.productTitle,
            sampleImageUrl: input.sampleImageUrl ?? null,
            flowers: input.flowers,
          },
        })
        await audit(ctx, tx, "coordinator.order.create", result.id, null, { code: result.code, stage })
        return result
      })
      return getOrderView(ctx, created.id)
    } catch (error) {
      if (isUniqueViolation(error) && attempt < MAX_CODE_ATTEMPTS - 1) continue
      throw error
    }
  }
  throw new AppError("CONFLICT", "Không cấp được mã đơn — thử lại.")
}
