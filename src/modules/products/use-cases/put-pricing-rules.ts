import { notFound, validationFailed } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import {
  isPricingRuleKey,
  validatePricingRuleValue,
  type PricingRuleKey,
} from "@/modules/products/domain/pricing-rules"
import { PricingRuleRepository } from "@/modules/products/infra/pricing-rule-repository"
import { BranchRepository } from "@/modules/organization/infra/branch-repository"

import { getPricingRules } from "./get-pricing-rules"

/**
 * `PUT /pricing-rules` (`L6`, đặc tả 06 mục 6). CHÈN một dòng mới cho một
 * khoá — không sửa dòng cũ (`PricingRuleRepository`, lý do ở đó). `branch_id`
 * bỏ trống nghĩa là quy tắc áp cho toàn tổ chức; có khai thì phải là một chi
 * nhánh có thật của chính tổ chức đang gọi (không tin thẳng id do client gửi
 * — cùng nguyên tắc `scopedWhere`/`scopedData`).
 */
export async function putPricingRules(
  ctx: TenantContext,
  input: { key: string; value: unknown; branchId?: string | null | undefined }
) {
  if (!isPricingRuleKey(input.key)) {
    throw validationFailed({
      key: `Khoá không nhận diện được. Hợp lệ: partner_tier_bonus, surcharge_groups, optimal_price_ratio, floor_ceiling_ratio`,
    })
  }
  const key: PricingRuleKey = input.key

  const problem = validatePricingRuleValue(key, input.value)
  if (problem) throw validationFailed({ value: problem })

  const branchId = input.branchId ?? null
  if (branchId !== null) {
    const branch = await new BranchRepository().findById(ctx, branchId)
    if (!branch) throw notFound()
  }

  await new PricingRuleRepository().create(ctx, {
    key,
    value: input.value,
    branchId,
    createdBy: ctx.userId,
  })

  return getPricingRules(ctx, branchId)
}
