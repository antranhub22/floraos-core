/**
 * Campaign Package Repository — Prisma, bảng `campaign_packages` (TENANT).
 *
 * Mọi truy vấn đi qua `scopedWhere`/`scopedData`: `organization_id` chỉ đến từ
 * `TenantContext` (phiên máy chủ), không bao giờ từ body/query.
 *
 * Kèm các truy vấn ĐỌC số liệu thật cho Chặng 11–13 (đơn hàng, hội thoại,
 * `content_metrics`) — gom ở đây để use-case không import Prisma.
 */

import type { Prisma, PrismaClient, campaign_packages } from "@/generated/prisma/client"
import { prisma } from "@/core/tenancy/infra/prisma"
import { scopedData, scopedWhere, type TenantContext } from "@/core/tenancy"

import type {
  CampaignPackageStatus,
  MetricFact,
  OrderFact,
  PostRef,
} from "../domain/campaign-package-rules"

type DbClient = PrismaClient | Prisma.TransactionClient

export type { campaign_packages }

export interface CreateCampaignPackageRow {
  readonly productId: string | null
  readonly masterAssetId: string
  readonly name: string
  readonly mode: string
  readonly topic: unknown
  readonly content: unknown
  readonly variantAssetIds: readonly string[]
  readonly videoJobId: string | null
  /** Mọi video của gói (mỗi khung một video); phần tử đầu = `videoJobId`. */
  readonly videoJobIds: readonly string[]
  readonly audioJobId: string | null
}

export interface UpdateCampaignPackageRow {
  readonly name?: string | undefined
  readonly content?: unknown
  readonly variantAssetIds?: readonly string[] | undefined
  readonly videoJobId?: string | null | undefined
  readonly videoJobIds?: readonly string[] | undefined
  readonly audioJobId?: string | null | undefined
}

function json(value: unknown): Prisma.InputJsonValue {
  return (value ?? null) as Prisma.InputJsonValue
}

export class CampaignPackageRepository {
  constructor(private readonly db: DbClient = prisma) {}

  create(ctx: TenantContext, row: CreateCampaignPackageRow): Promise<campaign_packages> {
    return this.db.campaign_packages.create({
      data: scopedData(ctx, {
        product_id: row.productId,
        master_asset_id: row.masterAssetId,
        name: row.name,
        mode: row.mode,
        topic: json(row.topic),
        content: json(row.content),
        variant_asset_ids: [...row.variantAssetIds],
        video_job_id: row.videoJobId,
        video_job_ids: [...row.videoJobIds],
        audio_job_id: row.audioJobId,
        status: "DRAFT",
        created_by: ctx.userId,
      }),
    })
  }

  findById(ctx: TenantContext, id: string): Promise<campaign_packages | null> {
    return this.db.campaign_packages.findFirst({ where: scopedWhere(ctx, { id }) })
  }

  list(
    ctx: TenantContext,
    options: { masterAssetId?: string | undefined; status?: CampaignPackageStatus | undefined; limit: number }
  ): Promise<campaign_packages[]> {
    return this.db.campaign_packages.findMany({
      where: scopedWhere(ctx, {
        ...(options.masterAssetId ? { master_asset_id: options.masterAssetId } : {}),
        ...(options.status ? { status: options.status } : {}),
      }),
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      take: options.limit,
    })
  }

  /** Sửa gói → kết quả QA cũ hết giá trị: đưa về DRAFT, xoá báo cáo QA. */
  async updateDraft(
    ctx: TenantContext,
    id: string,
    row: UpdateCampaignPackageRow
  ): Promise<campaign_packages | null> {
    const res = await this.db.campaign_packages.updateMany({
      where: scopedWhere(ctx, { id, NOT: { status: "APPROVED" } }),
      data: {
        ...(row.name !== undefined ? { name: row.name } : {}),
        ...(row.content !== undefined ? { content: json(row.content) } : {}),
        ...(row.variantAssetIds !== undefined ? { variant_asset_ids: [...row.variantAssetIds] } : {}),
        ...(row.videoJobId !== undefined ? { video_job_id: row.videoJobId } : {}),
        ...(row.videoJobIds !== undefined ? { video_job_ids: [...row.videoJobIds] } : {}),
        ...(row.audioJobId !== undefined ? { audio_job_id: row.audioJobId } : {}),
        status: "DRAFT",
        qa_report: json(null),
        qa_checked_at: null,
      },
    })
    if (res.count === 0) return null
    return this.findById(ctx, id)
  }

  async saveQa(
    ctx: TenantContext,
    id: string,
    status: CampaignPackageStatus,
    report: unknown,
    checkedAt: Date
  ): Promise<campaign_packages | null> {
    const res = await this.db.campaign_packages.updateMany({
      where: scopedWhere(ctx, { id, NOT: { status: "APPROVED" } }),
      data: { status, qa_report: json(report), qa_checked_at: checkedAt },
    })
    if (res.count === 0) return null
    return this.findById(ctx, id)
  }

  /** Chốt chặn đua: chỉ chuyển sang APPROVED từ đúng trạng thái đã đọc. */
  async approve(
    ctx: TenantContext,
    id: string,
    fromStatus: CampaignPackageStatus,
    at: Date
  ): Promise<boolean> {
    const res = await this.db.campaign_packages.updateMany({
      where: scopedWhere(ctx, { id, status: fromStatus }),
      data: { status: "APPROVED", approved_by: ctx.userId, approved_at: at },
    })
    return res.count === 1
  }

  async saveLaunchPlan(ctx: TenantContext, id: string, plan: unknown): Promise<campaign_packages | null> {
    const res = await this.db.campaign_packages.updateMany({
      where: scopedWhere(ctx, { id, status: "APPROVED" }),
      data: { launch_plan: json(plan) },
    })
    if (res.count === 0) return null
    return this.findById(ctx, id)
  }

  // ── Số liệu thật cho Chặng 11–13 ─────────────────────────────────────────

  async orderFactsForProduct(ctx: TenantContext, productId: string, since: Date): Promise<OrderFact[]> {
    const rows = await this.db.orders.findMany({
      where: scopedWhere(ctx, {
        created_at: { gte: since },
        items: { some: { product_id: productId } },
      }),
      select: {
        created_at: true,
        status: true,
        items: { where: { product_id: productId }, select: { quantity: true, unit_price_vnd: true } },
      },
      take: 1000,
    })
    return rows.map((o) => ({
      createdAt: o.created_at,
      status: o.status,
      productQuantity: o.items.reduce((a, i) => a + i.quantity, 0),
      productRevenueVnd: o.items.reduce((a, i) => a + Number(i.unit_price_vnd) * i.quantity, 0),
    }))
  }

  countConversationsSince(ctx: TenantContext, since: Date): Promise<number> {
    return this.db.chat_conversations.count({ where: scopedWhere(ctx, { created_at: { gte: since } }) })
  }

  async metricFacts(ctx: TenantContext, refs: readonly PostRef[]): Promise<MetricFact[]> {
    if (refs.length === 0) return []
    const rows = await this.db.content_metrics.findMany({
      where: scopedWhere(ctx, {
        OR: refs.map((r) => ({ platform: r.platform, content_id: r.contentId })),
      }),
      take: 5000,
    })
    return rows.map((m) => ({
      platform: m.platform,
      contentId: m.content_id,
      reach: m.reach,
      impressions: m.impressions,
      engagement: m.engagement,
      clicks: m.clicks,
      conversions: m.conversions,
    }))
  }
}
