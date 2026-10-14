import type { TenantContext } from "@/core/tenancy"
import { DismissalRepository } from "../infra/dismissal-repository"
import type { DismissalProposalInput } from "../domain/dismissal-policy"
import { roleOf } from "../domain/internal-message"

export async function proposeDismissal(
  ctx: TenantContext,
  input: DismissalProposalInput,
  repo = new DismissalRepository(),
) {
  const role = roleOf(ctx.capabilities)
  const isCoordinatorOrAdmin =
    role === "ADMIN" ||
    role === "COORDINATOR" ||
    ctx.capabilities.has("R6") ||
    ctx.capabilities.has("F2") ||
    ctx.capabilities.has("R4")

  return repo.propose(ctx, input, isCoordinatorOrAdmin)
}
