import { notFound } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import { IntegrationTokenRepository } from "@/modules/integration/infra/integration-token-repository"

/**
 * `DELETE /integration-tokens/:id` (`F9`). Thu hồi ngay bằng `revoked_at` —
 * không xoá bản ghi, giữ vết cho `rotated_from_id` và cho kiểm toán vận
 * hành.
 */
export async function revokeIntegrationToken(ctx: TenantContext, id: string): Promise<void> {
  const ok = await new IntegrationTokenRepository().revoke(ctx, id, new Date())
  if (!ok) throw notFound()
}
