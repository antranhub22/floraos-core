import type { TenantContext } from "@/core/tenancy"
import { AppError } from "@/core/http/errors"
import { DismissalRepository } from "../infra/dismissal-repository"
import { roleOf } from "../domain/internal-message"

export async function decideDismissal(
  ctx: TenantContext,
  input: { id: string; type: "ORDER" | "SESSION"; approve: boolean; note?: string },
  repo = new DismissalRepository(),
) {
  const role = roleOf(ctx.capabilities)
  const isCoordinatorOrAdmin =
    role === "ADMIN" ||
    role === "COORDINATOR" ||
    ctx.capabilities.has("R6") ||
    ctx.capabilities.has("F2") ||
    ctx.capabilities.has("R4")

  if (!isCoordinatorOrAdmin) {
    throw new AppError("CAPABILITY_DENIED", "Chỉ Điều hành hoặc Điều phối mới có quyền phê duyệt đề xuất hủy hiển thị.")
  }

  return repo.decide(ctx, input)
}

