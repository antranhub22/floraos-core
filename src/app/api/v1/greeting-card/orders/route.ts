import { validationFailed } from "@/core/http/errors"
import { handle, jsonResponse } from "@/core/http/response"
import { requireCapability } from "@/core/rbac/capabilities"
import { requireTenantContext } from "@/modules/organization/use-cases/resolve-session"
import { BrochureOrderRepository, ORDER_STATUSES } from "@/modules/greeting-card/infra/brochure-order-repository"
import { GreetingCardRepository } from "@/modules/greeting-card/infra/greeting-card-repository"
import { parseListQuery, toPage } from "@/modules/greeting-card/contracts/list-query"
import { resolveSaleScope } from "@/modules/greeting-card/use-cases/order-scope"
import { withOrderProductImages } from "@/modules/greeting-card/use-cases/order-product-images"
import { GREETING_CARD_CAPABILITY } from "@/modules/greeting-card/domain/greeting-card-capabilities"

export const GET = handle(async (request) => {
  const { ctx } = await requireTenantContext(request)
  requireCapability(ctx, GREETING_CARD_CAPABILITY.orderRead)
  const url = new URL(request.url)
  const statusParam = url.searchParams.get("status") || undefined
  const status = ORDER_STATUSES.find((s) => s === statusParam)
  if (statusParam && !status) throw validationFailed({ status: `Phải là một trong: ${ORDER_STATUSES.join(", ")}` })

  const paymentParam = url.searchParams.get("payment") || undefined
  const payment = (["OUTSTANDING", "PAID"] as const).find((p) => p === paymentParam)
  if (paymentParam && !payment) throw validationFailed({ payment: "Phải là OUTSTANDING hoặc PAID" })
  const { limit, cursor } = parseListQuery(url)
  const q = url.searchParams.get("q")?.trim().slice(0, 40) || undefined
  const reported = url.searchParams.get("reported") === "1"

  const repo = new BrochureOrderRepository()
  const saleId = (await resolveSaleScope(ctx)) ?? undefined
  const rows = await repo.listBrochureOrders(ctx, { status, payment, saleId, q, reported, limit, cursor })

  // Batch-resolve ảnh chuyển khoản và kết quả phân tích AI (tránh N+1) — chỉ ký asset của đúng tổ chức
  const proofAssetIds = rows
    .flatMap((o) => [
      o.greeting_sessions[0]?.payment_proof_asset_id,
      o.greeting_sessions[0]?.payment_proof_balance_asset_id,
    ])
    .filter((id): id is string => typeof id === "string" && id.length > 0)

  const proofAssetsMap = proofAssetIds.length > 0
    ? await new GreetingCardRepository().getPaymentProofAssetsMap(ctx.organizationId, proofAssetIds)
    : new Map<string, { url: string; analysis?: unknown }>()

  const rowsWithProof = rows.map((o) => {
    const proof1 = o.greeting_sessions[0]?.payment_proof_asset_id
      ? proofAssetsMap.get(o.greeting_sessions[0].payment_proof_asset_id)
      : null
    const proof2 = o.greeting_sessions[0]?.payment_proof_balance_asset_id
      ? proofAssetsMap.get(o.greeting_sessions[0].payment_proof_balance_asset_id)
      : null

    return {
      ...o,
      paymentProofUrl: proof1?.url ?? null,
      paymentProofAnalysis: proof1?.analysis ?? null,
      paymentProofBalanceUrl: proof2?.url ?? null,
      paymentProofBalanceAnalysis: proof2?.analysis ?? null,
    }
  })

  return jsonResponse(toPage(await withOrderProductImages(ctx, rowsWithProof), limit))
})

