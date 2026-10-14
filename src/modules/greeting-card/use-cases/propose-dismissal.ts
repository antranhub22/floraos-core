import type { TenantContext } from "@/core/tenancy"
import { DismissalRepository } from "../infra/dismissal-repository"
import type { DismissalProposalInput } from "../domain/dismissal-policy"
import { canDecideDismissal } from "../domain/dismissal-policy"

/** Người có quyền duyệt (R4 — Điều hành/Điều phối) bỏ trực tiếp; người khác (Sale) chỉ đề xuất. */
export async function proposeDismissal(ctx: TenantContext, input: DismissalProposalInput, repo = new DismissalRepository()) {
  return repo.propose(ctx, input, canDecideDismissal(ctx.capabilities))
}
