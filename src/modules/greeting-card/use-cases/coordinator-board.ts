import type { TenantContext } from "@/core/tenancy"
import { log } from "@/core/observability/log"
import { COORDINATOR_BOARD_MAX, DONE_VISIBLE_MS, sortByDelivery } from "../domain/coordinator-board"
import { BrochureOrderRepository } from "../infra/brochure-order-repository"
import { GreetingCardRepository } from "../infra/greeting-card-repository"
import { TrackingPipelineRepository } from "../infra/tracking-pipeline-repository"
import { resolveSaleScope } from "./order-scope"

/**
 * `GET /greeting-card/coordinator-board` — toàn bộ đơn còn việc cho bảng Điều phối, xếp theo ngày +
 * giờ giao gần nhất (đếm "Cần làm / Đang làm / Xong" trên đủ đơn, không cắt 20 đơn như trước).
 */
export async function getCoordinatorBoard(ctx: TenantContext, input: { date?: string | undefined }, repo = new BrochureOrderRepository(), now = new Date()) {
  const saleId = (await resolveSaleScope(ctx)) ?? undefined
  const rows = await repo.listCoordinatorBoard(ctx, {
    date: input.date,
    saleId,
    doneSince: new Date(now.getTime() - DONE_VISIBLE_MS),
    max: COORDINATOR_BOARD_MAX,
  })
  const truncated = rows.length >= COORDINATOR_BOARD_MAX
  if (truncated) log.warn("greeting_card.coordinator_board_truncated", { organizationId: ctx.organizationId, feature: "greeting-card", max: COORDINATOR_BOARD_MAX })

  // Batch-resolve ảnh chuyển khoản lần 1 & lần 2 (tránh N+1, ký asset đúng tổ chức)
  const proofAssetIds = rows
    .flatMap((o) => [
      o.greeting_sessions[0]?.payment_proof_asset_id,
      o.greeting_sessions[0]?.payment_proof_balance_asset_id,
    ])
    .filter((id): id is string => typeof id === "string" && id.length > 0)
  const proofUrls = proofAssetIds.length > 0
    ? await new GreetingCardRepository().getAssetsStorageMap(ctx.organizationId, proofAssetIds)
    : new Map<string, string>()

  // Ảnh chụp mẫu thiếu ảnh (đơn tạo tay, mẫu chọn trước khi có ảnh) → bù bằng ảnh chính hiện tại trong kho
  const productIdOf = (o: (typeof rows)[number]) => o.items[0]?.product_id ?? o.greeting_sessions[0]?.selected_product_id ?? ""
  const productImages = await new TrackingPipelineRepository().productMainImages(ctx, rows.map(productIdOf))
  const withImage = <T,>(snap: T, url: string | undefined): T => {
    if (!url || (snap && typeof snap === "object" && (snap as { imageUrl?: unknown }).imageUrl)) return snap
    return { ...((snap && typeof snap === "object" ? snap : {}) as object), imageUrl: url } as T
  }

  const rowsWithProof = rows.map((o) => ({
    ...o,
    items: o.items.map((it, i) => (i === 0 ? { ...it, metadata: withImage(it.metadata, productImages.get(productIdOf(o))) } : it)),
    greeting_sessions: o.greeting_sessions.map((s, i) =>
      i === 0 && s.product_snapshot ? { ...s, product_snapshot: withImage(s.product_snapshot, productImages.get(productIdOf(o))) } : s
    ),
    payment_proof_url: o.greeting_sessions[0]?.payment_proof_asset_id
      ? (proofUrls.get(o.greeting_sessions[0].payment_proof_asset_id) ?? null)
      : null,
    payment_proof_balance_url: o.greeting_sessions[0]?.payment_proof_balance_asset_id
      ? (proofUrls.get(o.greeting_sessions[0].payment_proof_balance_asset_id) ?? null)
      : null,
  }))

  return { data: sortByDelivery(rowsWithProof), truncated }
}
