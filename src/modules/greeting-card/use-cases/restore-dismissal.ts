import type { TenantContext } from "@/core/tenancy"
import { DismissalRepository } from "../infra/dismissal-repository"

export async function restoreDismissal(
  ctx: TenantContext,
  input: { id: string; type: "ORDER" | "SESSION"; reason?: string },
  repo = new DismissalRepository(),
) {
  return repo.restore(ctx, input)
}
