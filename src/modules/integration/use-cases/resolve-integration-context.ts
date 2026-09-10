import { AppError, unauthenticated } from "@/core/http/errors"
import type { TenantContext } from "@/core/tenancy"
import type { integration_client } from "@/modules/integration/infra/entities"
import { IntegrationTokenRepository } from "@/modules/integration/infra/integration-token-repository"
import { hashIntegrationToken } from "@/modules/integration/infra/token-crypto"
import { WorkspaceRepository } from "@/modules/organization/infra/workspace-repository"

export type IntegrationContext = {
  readonly organizationId: string
  readonly client: integration_client
  readonly tokenId: string
}

function bearerTokenFrom(request: Request): string | null {
  const header = request.headers.get("authorization")
  if (!header) return null
  const match = /^Bearer\s+(.+)$/.exec(header)
  const raw = match?.[1]
  return raw ? raw.trim() : null
}

/**
 * Giải `IntegrationContext` từ `Authorization: Bearer <token>` — điểm vào
 * của mọi route `/api/v1/integration/*` (đặc tả 06 mục 11, `YC-T8`).
 * Tương đương `requireTenantContext` của phiên người dùng, nhưng danh tính
 * đến từ một token đã ký, không phải cookie phiên — `organization_id`
 * không bao giờ do client tự khai (đặc tả 08 mục 3).
 */
export async function requireIntegrationContext(request: Request): Promise<IntegrationContext> {
  const token = bearerTokenFrom(request)
  if (!token) throw unauthenticated()

  const row = await new IntegrationTokenRepository().findActiveByHash(
    hashIntegrationToken(token),
    new Date()
  )
  if (!row) throw unauthenticated()

  return { organizationId: row.organization_id, client: row.client, tokenId: row.id }
}

/**
 * Dựng một `TenantContext` để TÁI DÙNG thẳng các use-case đã có của phiên
 * người dùng (`listProducts`, `getBusinessProfile`, `enqueueJob`, …) — đúng
 * nguyên tắc thu hoạch REUSE trước BUILD (`AGENTS.md`, chín câu hỏi #1).
 *
 * `capabilities` luôn RỖNG: token không phải một vai giao diện, nên không
 * được tra `hasCapability`/`requireCapability` — phạm vi của nó là chính
 * tập route `/integration/*` đang gọi nó (đặc tả 08 mục 3), áp trực tiếp
 * trong từng route đó, không qua bảng quyền 114 mã. Hệ quả tự nhiên: các
 * use-case tái dùng (vd. `listProducts` đọc `hasCapability(ctx, "L5")` để
 * quyết định lộ khối `pricing`) luôn ẩn phần đó với engine ngoài — không cần
 * mã riêng để chặn.
 *
 * `userId` là một chuỗi tổng hợp, không phải `users.id` thật — an toàn vì
 * `generation_jobs.user_id`/`usage.user_id`/`assets.created_by` không mang
 * khoá ngoại tới `users` (`prisma/schema.prisma`).
 */
export async function toTenantContext(ic: IntegrationContext): Promise<TenantContext> {
  const workspace = await new WorkspaceRepository().findDefaultForSessionOrganization(
    ic.organizationId
  )
  if (!workspace) throw new AppError("INTERNAL", "Tổ chức không có workspace nào")

  return {
    organizationId: ic.organizationId,
    workspaceId: workspace.id,
    userId: `integration:${ic.client.toLowerCase()}:${ic.tokenId}`,
    branchId: null,
    capabilities: new Set<string>(),
  }
}
