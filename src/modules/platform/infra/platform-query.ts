import { prisma } from "@/core/tenancy/infra/prisma"
import { STUCK_JOB_TIMEOUT_MS } from "@/modules/jobs/domain/job-rules"
import type { PlatformContext } from "@/core/platform/platform-context"

/**
 * Chỗ DUY NHẤT trong repo được phép truy vấn NHIỀU tổ chức cùng lúc
 * (kế hoạch mục 4.4 — rủi ro Critical duy nhất của cả P25). Mọi hàm ở đây
 * nhận `PlatformContext` làm tham số đầu — không phải để lọc theo tổ chức
 * (không có tổ chức nào để lọc), mà để mọi lời gọi qua tầng này đều đứng
 * sau `requirePlatformCapability` ở use-case gọi nó.
 *
 * KHÔNG repository tenant nào (`OrganizationRepository`,
 * `UsageRepository`, `AuditLogRepository`, `GenerationJobRepository`…)
 * được thêm một nhánh "bỏ lọc organization_id" để dùng lại ở đây — thêm
 * nhánh đó là lỗi chặn ở review. Tệp này gọi thẳng `prisma`, không đi qua
 * bất kỳ repository tenant nào.
 */

export type PlatformOrganizationSummary = {
  id: string
  name: string
  slug: string
  type: string
  creditBalance: number
  createdAt: Date
  memberCount: number
}

export async function listAllOrganizations(
  _pctx: PlatformContext
): Promise<PlatformOrganizationSummary[]> {
  const organizations = await prisma.organizations.findMany({
    orderBy: { created_at: "desc" },
    include: { _count: { select: { memberships: true } } },
  })
  return organizations.map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    type: org.type,
    creditBalance: org.credit_balance,
    createdAt: org.created_at,
    memberCount: org._count.memberships,
  }))
}

export type PlatformOrganizationDetail = PlatformOrganizationSummary & {
  branchCount: number
  workspaceKinds: string[]
}

export async function getAnyOrganization(
  _pctx: PlatformContext,
  organizationId: string
): Promise<PlatformOrganizationDetail | null> {
  const org = await prisma.organizations.findUnique({
    where: { id: organizationId },
    include: {
      _count: { select: { memberships: true, branches: true } },
      workspaces: { select: { kind: true } },
    },
  })
  if (!org) return null
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    type: org.type,
    creditBalance: org.credit_balance,
    createdAt: org.created_at,
    memberCount: org._count.memberships,
    branchCount: org._count.branches,
    workspaceKinds: org.workspaces.map((w) => w.kind),
  }
}

export type PlatformUsageRow = {
  organizationId: string
  organizationName: string
  feature: string
  quantity: number
  costCredit: number
}

/** Usage tổng hợp toàn hệ thống, gộp theo (tổ chức, tính năng). */
export async function summarizeUsageAcrossOrganizations(
  _pctx: PlatformContext,
  input: { since?: Date } = {}
): Promise<PlatformUsageRow[]> {
  const grouped = await prisma.usage.groupBy({
    by: ["organization_id", "feature"],
    ...(input.since ? { where: { created_at: { gte: input.since } } } : {}),
    _sum: { quantity: true, cost_credit: true },
  })
  if (grouped.length === 0) return []

  const organizationIds = [...new Set(grouped.map((row) => row.organization_id))]
  const organizations = await prisma.organizations.findMany({
    where: { id: { in: organizationIds } },
    select: { id: true, name: true },
  })
  const nameById = new Map(organizations.map((org) => [org.id, org.name]))

  return grouped.map(
    (row: {
      organization_id: string
      feature: string
      _sum: { quantity: number | null; cost_credit: number | null }
    }) => ({
      organizationId: row.organization_id,
      organizationName: nameById.get(row.organization_id) ?? "(đã xoá)",
      feature: row.feature,
      quantity: row._sum.quantity ?? 0,
      costCredit: row._sum.cost_credit ?? 0,
    })
  )
}

export type PlatformSystemHealth = {
  jobCountsByStatus: Record<string, number>
  stuckJobs: Array<{ id: string; organizationId: string; feature: string; startedAt: Date | null }>
}

/**
 * CHỈ ĐỌC (D-N5) — không đánh dấu job treo là FAILED. Việc đó vẫn thuộc
 * `scripts/scan-stuck-jobs.ts` (`YC-J10`), chạy ngoài request HTTP. Dùng
 * chung ngưỡng `STUCK_JOB_TIMEOUT_MS` để "job treo" nghĩa giống nhau ở cả
 * hai nơi.
 */
export async function readSystemHealth(_pctx: PlatformContext): Promise<PlatformSystemHealth> {
  const grouped = await prisma.generation_jobs.groupBy({
    by: ["status"],
    _count: { _all: true },
  })
  const jobCountsByStatus: Record<string, number> = {}
  for (const row of grouped) jobCountsByStatus[row.status] = row._count._all

  const threshold = new Date(Date.now() - STUCK_JOB_TIMEOUT_MS)
  const stuck = await prisma.generation_jobs.findMany({
    where: { status: "PROCESSING", started_at: { lt: threshold } },
    select: { id: true, organization_id: true, feature: true, started_at: true },
    orderBy: { started_at: "asc" },
    take: 100,
  })

  return {
    jobCountsByStatus,
    stuckJobs: stuck.map((job) => ({
      id: job.id,
      organizationId: job.organization_id,
      feature: job.feature,
      startedAt: job.started_at,
    })),
  }
}

export type PlatformAuditRow = {
  id: string
  source: "organization" | "platform"
  organizationId: string | null
  userId: string
  action: string
  entityType: string
  entityId: string
  createdAt: Date
}

/** Hợp `audit_logs` (mọi tổ chức) và `platform_audit_logs`, mới nhất trước. */
export async function listAuditAcrossOrganizations(
  _pctx: PlatformContext,
  limit = 100
): Promise<PlatformAuditRow[]> {
  const [orgLogs, platformLogs] = await Promise.all([
    prisma.audit_logs.findMany({
      orderBy: { created_at: "desc" },
      take: limit,
      select: {
        id: true,
        organization_id: true,
        user_id: true,
        action: true,
        entity_type: true,
        entity_id: true,
        created_at: true,
      },
    }),
    prisma.platform_audit_logs.findMany({
      orderBy: { created_at: "desc" },
      take: limit,
      select: {
        id: true,
        user_id: true,
        action: true,
        entity_type: true,
        entity_id: true,
        created_at: true,
      },
    }),
  ])

  const merged: PlatformAuditRow[] = [
    ...orgLogs.map(
      (row: {
        id: string
        organization_id: string
        user_id: string
        action: string
        entity_type: string
        entity_id: string
        created_at: Date
      }) => ({
        id: row.id,
        source: "organization" as const,
        organizationId: row.organization_id,
        userId: row.user_id,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        createdAt: row.created_at,
      })
    ),
    ...platformLogs.map(
      (row: {
        id: string
        user_id: string
        action: string
        entity_type: string
        entity_id: string
        created_at: Date
      }) => ({
        id: row.id,
        source: "platform" as const,
        organizationId: null,
        userId: row.user_id,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        createdAt: row.created_at,
      })
    ),
  ]

  merged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  return merged.slice(0, limit)
}
