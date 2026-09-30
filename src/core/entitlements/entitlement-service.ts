import { AppError } from "@/core/http/errors"
import { requireCapability } from "@/core/rbac/capabilities"
import type { TenantContext } from "@/core/tenancy"
import { OrganizationRepository } from "@/modules/organization/infra/organization-repository"

/**
 * Động cơ Quản lý Gói dịch vụ & Quyền năng lực Thương mại (Commercial Feature Entitlement).
 * Phân định rạch ròi:
 * 1. Authorization: Người dùng có được phép làm không (Role / Capability).
 * 2. Entitlement: Tổ chức có được dùng tính năng đó theo gói dịch vụ đã trả tiền không (Commercial Plan).
 */

export type CommercialPlan = "EXPERIENCE" | "STARTER" | "PRO" | "FLOWER_NETWORK" | "ENTERPRISE"

export const PLAN_FEATURES: Record<CommercialPlan, readonly string[]> = {
  EXPERIENCE: ["vision.basic", "catalog.basic", "experience.trial"],
  STARTER: [
    "vision.basic",
    "vision.batch",
    "catalog.basic",
    "catalog.publish",
    "pricing.basic",
    "sales.basic",
    "crm.basic",
    "orders.basic",
  ],
  PRO: [
    "vision.basic",
    "vision.batch",
    "catalog.basic",
    "catalog.publish",
    "pricing.basic",
    "sales.basic",
    "crm.basic",
    "orders.basic",
    "creative.studio",
    "media.variant",
    "ai.video.generate",
    "ai.voice.clone",
    "ai.chat.sales",
    "market_intel.full",
  ],
  FLOWER_NETWORK: [
    "vision.basic",
    "vision.batch",
    "catalog.basic",
    "catalog.publish",
    "pricing.basic",
    "sales.basic",
    "crm.basic",
    "orders.basic",
    "creative.studio",
    "media.variant",
    "ai.video.generate",
    "ai.voice.clone",
    "ai.chat.sales",
    "market_intel.full",
    "network.dispatch",
    "partner.management",
    "qc.inspection",
    "finance.reconciliation",
    "network.multi_branch",
  ],
  ENTERPRISE: [
    "vision.basic",
    "vision.batch",
    "catalog.basic",
    "catalog.publish",
    "pricing.basic",
    "sales.basic",
    "crm.basic",
    "orders.basic",
    "creative.studio",
    "media.variant",
    "ai.video.generate",
    "ai.voice.clone",
    "ai.chat.sales",
    "market_intel.full",
    "network.dispatch",
    "partner.management",
    "qc.inspection",
    "finance.reconciliation",
    "network.multi_branch",
    "custom.integrations",
    "dedicated.ai_resources",
  ],
}

export function resolvePlanFromOrg(
  creditPlan?: string | null,
  orgType?: string | null
): CommercialPlan {
  if (creditPlan) {
    const upperPlan = creditPlan.toUpperCase()
    if (upperPlan in PLAN_FEATURES) return upperPlan as CommercialPlan
  }
  if (orgType === "EXPERIENCE") return "EXPERIENCE"
  if (orgType === "FLOWER_NETWORK" || orgType === "CHAIN") return "FLOWER_NETWORK"
  return "PRO" // Mặc định gói đầy đủ cho các tổ chức cửa hàng chuẩn
}

export function hasPlanEntitlement(plan: CommercialPlan, featureKey: string): boolean {
  const allowed = PLAN_FEATURES[plan]
  if (!allowed) return false
  return allowed.includes(featureKey)
}

export async function requireFeatureAccess(
  ctx: TenantContext,
  capabilityCode: string,
  featureKey?: string
): Promise<void> {
  // Lớp 1: Kiểm tra quyền Role / Capability
  requireCapability(ctx, capabilityCode)

  if (!featureKey) return

  // Lớp 2: Kiểm tra hạn mức gói cước (Commercial Entitlement)
  const org = await new OrganizationRepository().current(ctx)
  if (!org) {
    throw new AppError("INTERNAL", "Không tìm thấy thông tin tổ chức")
  }

  const plan = resolvePlanFromOrg(org.credit_plan, org.type)
  if (!hasPlanEntitlement(plan, featureKey)) {
    throw new AppError(
      "ENTITLEMENT_REQUIRED",
      `Tính năng "${featureKey}" không nằm trong gói dịch vụ hiện tại (${plan}) của tổ chức. Vui lòng nâng cấp gói cước.`,
      {
        feature: featureKey,
        currentPlan: plan,
      }
    )
  }
}
