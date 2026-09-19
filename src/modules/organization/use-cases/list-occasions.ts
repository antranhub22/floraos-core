import type { TenantContext } from "@/core/tenancy"
import { OccasionRepository } from "@/modules/organization/infra/occasion-repository"

/** `GET /occasions` (nợ #104 — quản lý dịp, dùng chung F1 với hồ sơ tổ chức). */
export function listOccasions(ctx: TenantContext) {
  return new OccasionRepository().listAll(ctx)
}
