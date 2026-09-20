/**
 * Creative Production Repository — Persistence layer.
 *
 * Quản lý lưu trữ CampaignPackage và trạng thái sản xuất.
 * Delegate sang GenerationJobRepository cho các jobs.
 *
 * Phase hiện tại: In-memory store.
 * Phase tương lai: Prisma + bảng campaign_packages.
 *
 * KHÔNG import Prisma trực tiếp — tuân thủ Clean Architecture.
 */

import type {
  CampaignPackage,
  ProducedAsset,
  MediaPlanItem,
} from "../domain/production-types"

// ============================================================
// PORT INTERFACE
// ============================================================

/**
 * Repository port cho Creative Production.
 * Infrastructure sẽ inject implementation thật.
 */
export interface ICreativeProductionRepository {
  /** Lưu campaign package mới */
  saveCampaign(campaign: CampaignPackage): Promise<void>

  /** Lấy campaign theo ID */
  getCampaign(campaignId: string, organizationId: string): Promise<CampaignPackage | null>

  /** Cập nhật trạng thái campaign */
  updateCampaignStatus(
    campaignId: string,
    organizationId: string,
    status: CampaignPackage["status"],
  ): Promise<void>

  /** Thêm asset đã sản xuất vào campaign */
  addProducedAsset(
    campaignId: string,
    organizationId: string,
    asset: ProducedAsset,
  ): Promise<void>

  /** Cập nhật trạng thái 1 media plan item */
  updateMediaPlanItemStatus(
    campaignId: string,
    itemIndex: number,
    status: MediaPlanItem["status"],
    jobId?: string,
  ): Promise<void>

  /** Liệt kê campaigns theo organization */
  listCampaigns(
    organizationId: string,
    options?: { status?: CampaignPackage["status"]; limit?: number },
  ): Promise<readonly CampaignPackage[]>
}

// ============================================================
// IN-MEMORY IMPLEMENTATION (Phase 1)
// ============================================================

/**
 * In-memory repository — dùng cho testing và prototype.
 * Phase tương lai: thay bằng Prisma-backed implementation.
 */
export class InMemoryCreativeProductionRepository
  implements ICreativeProductionRepository
{
  private readonly store = new Map<string, CampaignPackage>()

  async saveCampaign(campaign: CampaignPackage): Promise<void> {
    this.store.set(campaign.campaignId, campaign)
  }

  async getCampaign(
    campaignId: string,
    _organizationId: string,
  ): Promise<CampaignPackage | null> {
    return this.store.get(campaignId) ?? null
  }

  async updateCampaignStatus(
    campaignId: string,
    _organizationId: string,
    status: CampaignPackage["status"],
  ): Promise<void> {
    const campaign = this.store.get(campaignId)
    if (!campaign) return

    this.store.set(campaignId, { ...campaign, status })
  }

  async addProducedAsset(
    campaignId: string,
    _organizationId: string,
    asset: ProducedAsset,
  ): Promise<void> {
    const campaign = this.store.get(campaignId)
    if (!campaign) return

    this.store.set(campaignId, {
      ...campaign,
      producedAssets: [...campaign.producedAssets, asset],
    })
  }

  async updateMediaPlanItemStatus(
    campaignId: string,
    itemIndex: number,
    status: MediaPlanItem["status"],
    jobId?: string,
  ): Promise<void> {
    const campaign = this.store.get(campaignId)
    if (!campaign) return

    const items = [...campaign.mediaPlan.items]
    const item = items[itemIndex]
    if (!item) return

    items[itemIndex] = { ...item, status, jobId: jobId ?? item.jobId }

    this.store.set(campaignId, {
      ...campaign,
      mediaPlan: { ...campaign.mediaPlan, items },
    })
  }

  async listCampaigns(
    _organizationId: string,
    options?: { status?: CampaignPackage["status"]; limit?: number },
  ): Promise<readonly CampaignPackage[]> {
    let results = [...this.store.values()]

    if (options?.status) {
      results = results.filter((c) => c.status === options.status)
    }

    if (options?.limit) {
      results = results.slice(0, options.limit)
    }

    return results
  }

  /** Helper cho testing — xóa hết */
  clear(): void {
    this.store.clear()
  }

  /** Helper cho testing — đếm */
  get size(): number {
    return this.store.size
  }
}
