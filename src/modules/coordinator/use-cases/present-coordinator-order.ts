/**
 * Hình dạng đơn điều phối trả về giao diện (Control Tower). Ảnh lưu dưới dạng
 * id `assets` và chỉ đổi ra URL ký sẵn lúc đọc — URL ký có hạn, lưu URL vào
 * CSDL là lưu thứ sẽ chết sau một giờ.
 */

import type { TenantContext } from "@/core/tenancy/tenant-context"
import { getStorageProvider } from "@/modules/assets/adapters/storage-provider-factory"
import { AssetRepository } from "@/modules/assets/infra/asset-repository"
import type {
  AccessoryBomItem,
  CoordinatorProductSnapshot,
  FoliageBomItem,
  WrappingLayer,
} from "@/modules/products/domain/product-master-index"
import {
  DELIVERY_LOCATION_BEHAVIORS,
  ORDER_TYPE_BEHAVIORS,
  type ConditionalFieldGroup,
} from "@/modules/field-platform/domain/behaviors"
import type { CoordinatorStage } from "../domain/coordinator-types"
import { evaluateRisk, stageLabel } from "../domain/operation-rules"
import type { CoordinatorOrderRow } from "../infra/coordinator-repository"

const IMAGE_URL_TTL_SECONDS = 3600

/**
 * ĐP-4a (26/09/2026, PO D2), §2.15.7 — suy ra, không lưu tay.
 * REFUNDED: có ít nhất một dòng REFUND và tổng thực thu hiện tại = 0.
 */
function derivePaymentStatus(
  paidVnd: number,
  totalVnd: number,
  hasRefund: boolean
): "UNPAID" | "PARTIALLY_PAID" | "PAID" | "REFUNDED" {
  if (hasRefund && paidVnd <= 0) return "REFUNDED"
  if (paidVnd <= 0) return "UNPAID"
  if (paidVnd < totalVnd) return "PARTIALLY_PAID"
  return "PAID"
}

/**
 * ĐP-4a.1 (26/09/2026), Đặc tả trường §12 — nhóm trường có điều kiện được
 * BẬT theo hành vi của `orderType`/`deliveryLocationType` (`behaviors.ts`,
 * ĐP-3). Chỉ trả về DANH SÁCH NHÓM đang bật — các Ô NHẬP chi tiết của từng
 * nhóm (vd. tên người mất/giờ viếng cho SYMPATHY) CHƯA XÂY ở đợt 4a.1: đặc
 * tả gốc ghi danh sách trường đó "lưu ở archive", không tìm thấy trong tài
 * liệu hiện có — để lại cho lượt sau khi xác định được đúng danh sách.
 */
function activeConditionalFieldGroups(orderType: string | null, deliveryLocationType: string | null): ConditionalFieldGroup[] {
  const groups = new Set<ConditionalFieldGroup>()
  const orderTypeBehavior = orderType ? ORDER_TYPE_BEHAVIORS[orderType] : undefined
  if (orderTypeBehavior) {
    for (const g of orderTypeBehavior.conditionalGroups) groups.add(g)
  }
  const locationBehavior = deliveryLocationType ? DELIVERY_LOCATION_BEHAVIORS[deliveryLocationType] : undefined
  if (locationBehavior) {
    for (const g of locationBehavior.conditionalGroups) groups.add(g)
  }
  return Array.from(groups)
}

export interface CoordinatorFlower {
  flowerName: string
  quantity: number
  unit: string
  color: string
  role: string
}

/**
 * ĐP-2.11 (26/09/2026): đọc snapshot Master Index (MI-5) đã ghi vào
 * `order_items[0].metadata.product` lúc tạo đơn (ĐP-2.7). Đơn CŨ (trước ĐP-2,
 * hoặc đơn mẫu ngoài danh mục không có `productId`) không có khối này —
 * trả `null`, KHÔNG suy đoán hay dựng snapshot giả.
 */
function readProductSnapshot(value: unknown): CoordinatorProductSnapshot | null {
  if (!value || typeof value !== "object") return null
  const v = value as Record<string, unknown>
  if (typeof v.productId !== "string" || typeof v.code !== "string" || !v.bom) return null
  return v as unknown as CoordinatorProductSnapshot
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
  /** SĐT khách mua (khách lẻ, không có customerId từ CMI). ĐP-1.3. */
  customerPhone: string
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
  /** ĐP-2.6/2.11: `productId` khi đơn chọn mẫu từ Product Master Index; `null` cho đơn mẫu ngoài danh mục. */
  productId: string | null
  /** Snapshot Master Index bất biến lúc tạo đơn (MI-5, §5) — `null` khi không có `productId`. */
  product: CoordinatorProductSnapshot | null
  foliage: FoliageBomItem[]
  wrapping: WrappingLayer[]
  accessories: AccessoryBomItem[]
  substitutionPolicy: { allowed: boolean; note?: string | undefined } | null
  referenceImageUrls: string[]
  cardMessage: string
  /** ĐP-4a.1 (26/09/2026) — `cardMessage` bắt buộc khi true. */
  cardRequired: boolean
  internalNote: string | null
  /** Chỉ dẫn điều phối viên ghi cho ĐỐI TÁC lúc phân công (ĐP-1.7) — khác `internalNote` là ghi chú nội bộ. */
  partnerInstruction: string | null
  // ── ĐP-4a.1 (26/09/2026) — T01: đủ trường P0/P1 (Đặc tả trường §2.1/§3.1) ──
  source: string | null
  sourceReference: string | null
  channel: string | null
  orderType: string | null
  /** Có thể khác `input.priority` gốc — máy GỢI Ý khi Sales bỏ trống lúc tạo (§2.15.1). */
  priority: string | null
  serviceLevel: string | null
  deliveryType: string | null
  deliveryLocationType: string | null
  /** §12 — nhóm trường có điều kiện đang bật theo `orderType`/`deliveryLocationType`. */
  conditionalFieldGroups: ConditionalFieldGroup[]
  receivedAt: string | null
  deliveryWindowStart: string | null
  deliveryWindowEnd: string | null
  salesOwnerId: string | null
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
  /** ĐP-4a (26/09/2026, PO D2) — sổ thu. Tổng đã thu, luỹ kế mọi dòng `order_payments`. */
  paidVnd: number
  /** Còn phải thu = unitPriceVnd − paidVnd. Máy chủ tính, không nhập tay. */
  balanceVnd: number
  /** Suy ra từ paidVnd/balanceVnd (§2.15.7) — KHÔNG lưu tay. */
  paymentStatus: "UNPAID" | "PARTIALLY_PAID" | "PAID" | "REFUNDED"
  partnerPayoutVnd: number | null
  partnerRating: number | null
  closureNotes: string | null
  closedAt: string | null
  cancelledReason: string | null
  createdAt: string
  updatedAt: string
  /** ĐP-3.16 (26/09/2026): giá trị trường tự tạo (Console Vận hành > Trường dữ liệu). */
  customFields: Record<string, unknown>
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
    const firstItem = r.items[0]
    const itemMeta = (firstItem?.metadata ?? {}) as Record<string, unknown>
    const productSnapshot = readProductSnapshot(itemMeta.product)

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
      customerPhone: str("customerPhone"),
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
      productId: firstItem?.product_id ?? null,
      product: productSnapshot,
      foliage: productSnapshot?.bom.foliage ?? [],
      wrapping: productSnapshot?.bom.wrapping ?? [],
      accessories: productSnapshot?.bom.accessories ?? [],
      substitutionPolicy: productSnapshot?.substitutionPolicy ?? null,
      referenceImageUrls: productSnapshot?.referenceImageUrls ?? [],
      cardMessage: r.card_message ?? "",
      cardRequired: c.card_required,
      internalNote: r.internal_note,
      partnerInstruction: typeof meta.partnerInstruction === "string" ? meta.partnerInstruction : null,
      source: c.source,
      sourceReference: c.source_reference,
      channel: c.channel,
      orderType: c.order_type,
      priority: c.priority,
      serviceLevel: c.service_level,
      deliveryType: c.delivery_type,
      deliveryLocationType: c.delivery_location_type,
      conditionalFieldGroups: activeConditionalFieldGroups(c.order_type, c.delivery_location_type),
      receivedAt: iso(c.received_at),
      deliveryWindowStart: iso(c.delivery_window_start),
      deliveryWindowEnd: iso(c.delivery_window_end),
      salesOwnerId: c.sales_owner_id,
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
      paidVnd: Number(r.paid_vnd),
      balanceVnd: Number(r.balance_vnd),
      paymentStatus: derivePaymentStatus(
        Number(r.paid_vnd),
        Number(r.total_vnd),
        r.payments.some((p) => p.kind === "REFUND")
      ),
      partnerPayoutVnd: c.partner_payout_vnd === null ? null : Number(c.partner_payout_vnd),
      partnerRating: c.partner_rating,
      closureNotes: c.closure_notes,
      closedAt: iso(c.closed_at),
      cancelledReason: c.cancelled_reason,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
      customFields: (c.custom_fields as Record<string, unknown> | null) ?? {},
    }
  })
}
