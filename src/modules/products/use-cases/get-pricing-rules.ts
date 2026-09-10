import type { TenantContext } from "@/core/tenancy"
import {
  mergeEffectiveFloorCeilingRatio,
  mergeEffectivePricingConfig,
} from "@/modules/products/domain/pricing-rules"
import { PricingRuleRepository } from "@/modules/products/infra/pricing-rule-repository"

/**
 * `GET /pricing-rules` (`L5`, đặc tả 06 mục 6). Trả cấu hình giá HIỆU LỰC —
 * đã hợp nhất mặc định/tổ chức/chi nhánh — không trả nguyên bản lịch sử các
 * dòng đã ghi (`PricingRuleRepository.currentRows` chỉ là bước trung gian).
 *
 * `branchId` mặc định lấy từ phiên (`ctx.branchId`, `null` = toàn tổ chức);
 * `overrideBranchId` cho phép xem cấu hình hiệu lực CỦA MỘT CHI NHÁNH KHÁC —
 * dùng khi Điều hành ở phạm vi tổ chức muốn xem chi nhánh cụ thể đang áp
 * dụng gì, không cần chuyển phiên sang chi nhánh đó.
 */
export async function getPricingRules(ctx: TenantContext, overrideBranchId?: string | null) {
  const branchId = overrideBranchId !== undefined ? overrideBranchId : ctx.branchId
  const rows = await new PricingRuleRepository().currentRows(ctx)

  const config = mergeEffectivePricingConfig(rows, branchId)
  const floorCeilingRatio = mergeEffectiveFloorCeilingRatio(rows, branchId)

  return {
    branch_id: branchId,
    partner_tier_bonus: config.partnerTierBonus,
    surcharge_groups: config.surchargeGroups,
    optimal_price_ratio: config.optimalPriceRatio,
    floor_ceiling_ratio: floorCeilingRatio,
  }
}
