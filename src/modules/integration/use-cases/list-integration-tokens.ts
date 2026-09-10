import type { TenantContext } from "@/core/tenancy"
import { IntegrationTokenRepository } from "@/modules/integration/infra/integration-token-repository"

export type IntegrationTokenSummary = {
  id: string
  client: string
  created_at: Date
  expires_at: Date
  revoked_at: Date | null
  rotated_from_id: string | null
}

/** `GET /integration-tokens` (`F9`). Không bao giờ trả `token_hash` — chỉ metadata. */
export async function listIntegrationTokens(ctx: TenantContext): Promise<IntegrationTokenSummary[]> {
  const rows = await new IntegrationTokenRepository().list(ctx)
  return rows.map((row) => ({
    id: row.id,
    client: row.client,
    created_at: row.created_at,
    expires_at: row.expires_at,
    revoked_at: row.revoked_at,
    rotated_from_id: row.rotated_from_id,
  }))
}
