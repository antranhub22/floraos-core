/**
 * Hình dạng đơn điều phối trả về giao diện (Control Tower). Ảnh lưu dưới dạng
 * id `assets` và chỉ đổi ra URL ký sẵn lúc đọc — URL ký có hạn, lưu URL vào
 * CSDL là lưu thứ sẽ chết sau một giờ.
 */

import type { TenantContext } from "@/core/tenancy/tenant-context"
import { getStorageProvider } from "@/modules/assets/adapters/storage-provider-factory"
import { AssetRepository } from "@/modules/assets/infra/asset-repository"
import type { CoordinatorStage } from "../domain/coordinator-types"
import { evaluateRisk, stageLabel } from "../domain/operation-rules"
import type { CoordinatorOrderRow } from "../infra/coordinator-repository"

const IMAGE_URL_TTL_SECONDS = 3600

export interface CoordinatorFlower {
  flowerName: string
  quantity: number
  unit: string
  color: string
  role: string
}

function flowerList(value: unknown): CoordinatorFlower[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((v) => {
    if (!v || typeof v !== "object") return []
    const f = v as Record<string, unknown>
    if (typeof f.flowerName !== "string") return []
    return [
      {
        flowerName: f.flowerName,
        quantity: typeof f.quantity === "number" ? f.quantity : 1,
        unit: typeof f.unit === "string" ? f.unit : "cành",
        color: typeof f.color === "string" ? f.color : "",
        role: typeof f.role === "string" ? f.role : "",
      },
    ]
  })
}

export interface CoordinatorOrderView {
  id: string
  orderCode: string
  stage: CoordinatorStage
  stageLabel: string
  riskLevel: "NORMAL" | "ATTENTION" | "AT_RISK" | "CRITICAL"
  riskReason: string | null
  customerId: string | null
  customerName: string
  customerTier: string
  recipientName: string
  recipientPhone: string
  deliveryAddress: unknown
  deliveryTargetTime: string
  deliveryTargetAt: string | null
  nextAction: string
  partner: { id: string; name: string; phone: string } | null
  partnerName: string | null
  productTitle: string
  sampleImageUrl: string | null
  finishedImageUrls: string[]
  productionProgress: number
  flowers: CoordinatorFlower[]
  cardMessage: string
  internalNote: string | null
  qc: { status: string; notes: string | null; aiScore: number | null; inspectedAt: string } | null
  delivery: {
    carrier: string | null
    shipperName: string | null
    shipperPhone: string | null
    state: string | null
    podImageUrl: string | null
    podRecipientName: string | null
    podCapturedAt: string | null
    actualDeliveryAt: string | null
  }
  exceptions: Array<{
    id: string
    code: string
    type: string
    severity: string
    description: string
    status: string
    resolution: string | null
    createdAt: string
    resolvedAt: string | null
  }>
  hasException: boolean
  unitPriceVnd: number
  partnerPayoutVnd: number | null
  partnerRating: number | null
  closureNotes: string | null
  closedAt: string | null
  cancelledReason: string | null
  createdAt: string
  updatedAt: string
}

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null)

async function signedAssetUrls(ctx: TenantContext, ids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  if (ids.length === 0) return out
  const repo = new AssetRepository()
  const storage = getStorageProvider()
  for (const id of new Set(ids)) {
    const asset = await repo.findById(ctx, id)
    if (asset) out.set(id, await storage.signedUrl(asset.storage_key, IMAGE_URL_TTL_SECONDS, "GET"))
  }
  return out
}

function assetIdList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : []
}

export async function presentCoordinatorOrders(
  ctx: TenantContext,
  rows: CoordinatorOrderRow[],
  now = new Date()
): Promise<CoordinatorOrderView[]> {
  const ids: string[] = []
  for (const r of rows) {
    const c = r.coordination!
    if (c.sample_asset_id) ids.push(c.sample_asset_id)
    if (c.pod_asset_id) ids.push(c.pod_asset_id)
    ids.push(...assetIdList(c.finished_asset_ids))
  }
  const urls = await signedAssetUrls(ctx, ids)

  return rows.map((r) => {
    const c = r.coordination!
    const meta = (c.metadata ?? {}) as Record<string, unknown>
    const window = (r.delivery_window ?? {}) as { timeSlot?: string; targetAt?: string | null }
    const openExceptions = r.exceptions.filter((e) => e.status === "OPEN" || e.status === "IN_PROGRESS")
    const risk = evaluateRisk({
      stage: c.stage,
      targetDeliveryAt: c.estimated_delivery_at,
      openExceptionCount: openExceptions.length,
      deliveryState: c.delivery_state,
      now,
    })
    const qc = r.qc_records[0]
    const str = (k: string, fallback = "") => (typeof meta[k] === "string" ? (meta[k] as string) : fallback)

    return {
      id: r.id,
      orderCode: r.code,
      stage: c.stage,
      stageLabel: stageLabel(c.stage),
      riskLevel: risk.riskLevel,
      riskReason: risk.reason,
      customerId: r.customer_id,
      customerName: str("customerName"),
      customerTier: str("customerTier", "NEW"),
      recipientName: str("recipientName"),
      recipientPhone: str("recipientPhone"),
      deliveryAddress: r.delivery_address,
      deliveryTargetTime: window.timeSlot ?? "",
      deliveryTargetAt: iso(c.estimated_delivery_at),
      nextAction: c.next_action ?? "",
      partner: c.partner ? { id: c.partner.id, name: c.partner.name, phone: c.partner.phone } : null,
      partnerName: c.partner?.name ?? null,
      productTitle: str("productTitle"),
      sampleImageUrl: (c.sample_asset_id && urls.get(c.sample_asset_id)) || str("sampleImageUrl") || null,
      finishedImageUrls: assetIdList(c.finished_asset_ids)
        .map((id) => urls.get(id))
        .filter((u): u is string => Boolean(u)),
      productionProgress: c.production_progress,
      flowers: flowerList(meta.flowers),
      cardMessage: r.card_message ?? "",
      internalNote: r.internal_note,
      qc: qc
        ? { status: qc.status, notes: qc.notes, aiScore: qc.ai_score, inspectedAt: qc.created_at.toISOString() }
        : null,
      delivery: {
        carrier: c.carrier,
        shipperName: c.shipper_name,
        shipperPhone: c.shipper_phone,
        state: c.delivery_state,
        podImageUrl: (c.pod_asset_id && urls.get(c.pod_asset_id)) || null,
        podRecipientName: c.pod_recipient_name,
        podCapturedAt: iso(c.pod_captured_at),
        actualDeliveryAt: iso(c.actual_delivery_at),
      },
      exceptions: r.exceptions.map((e) => ({
        id: e.id,
        code: e.code,
        type: e.type,
        severity: e.severity,
        description: e.description,
        status: e.status,
        resolution: e.resolution,
        createdAt: e.created_at.toISOString(),
        resolvedAt: iso(e.resolved_at),
      })),
      hasException: openExceptions.length > 0,
      unitPriceVnd: Number(r.total_vnd),
      partnerPayoutVnd: c.partner_payout_vnd === null ? null : Number(c.partner_payout_vnd),
      partnerRating: c.partner_rating,
      closureNotes: c.closure_notes,
      closedAt: iso(c.closed_at),
      cancelledReason: c.cancelled_reason,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
    }
  })
}
