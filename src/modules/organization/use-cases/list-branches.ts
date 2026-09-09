import type { TenantContext } from "@/core/tenancy"
import { BranchRepository } from "@/modules/organization/infra/branch-repository"

/** `GET /branches` (`F6`, đặc tả 06 mục 4). */
export function listBranches(ctx: TenantContext) {
  return new BranchRepository().list(ctx)
}
