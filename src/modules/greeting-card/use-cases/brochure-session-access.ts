import { notFound } from "@/core/http/errors"
import { GreetingCardRepository } from "../infra/greeting-card-repository"
import { linkAvailability, validateSendCode } from "../domain/greeting-card-rules"
import type { GreetingCatalogProduct } from "../domain/greeting-card-types"
import { collectImageAssetIds, toCatalogProduct } from "./brochure-product-mapper"

export type PublicSession = NonNullable<Awaited<ReturnType<GreetingCardRepository["getPublicSessionBySendCode"]>>>

/**
 * Phiên công khai theo mã gửi. Mã sai định dạng hoặc không có → 404 (không
 * chạm DB với mã rác). Catalog đã ngừng thì link chết, trừ khi khách đã có
 * đơn (vẫn phải xem được thanh toán và theo dõi). Link hết hạn hoặc đã thu
 * hồi (chưa có đơn) cũng trả 404.
 */
export async function loadPublicSession(sendCode: string, repo: GreetingCardRepository): Promise<PublicSession> {
  if (!validateSendCode(sendCode)) throw notFound()
  const session = await repo.getPublicSessionBySendCode(sendCode)
  if (!session) throw notFound()
  if (!session.catalog.is_active && !session.order_id) throw notFound()
  const availability = linkAvailability({
    expiresAt: session.expires_at,
    revokedAt: session.revoked_at,
    hasOrder: session.order_id !== null,
  })
  if (availability !== "ACTIVE") throw notFound()
  return session
}

/**
 * Mẫu thuộc đúng catalog của phiên — chỉ khi đó mới được chọn/đặt. Mẫu chưa
 * niêm yết giá vẫn đặt được; cửa hàng báo giá sau.
 */
export async function resolveOrderableProduct(
  session: PublicSession,
  productId: string,
  repo: GreetingCardRepository
): Promise<GreetingCatalogProduct> {
  const item = session.catalog.items.find((i) => i.product.id === productId)
  if (!item) throw notFound()
  const urls = await repo.getAssetsStorageMap(session.organization_id, collectImageAssetIds([item]))
  return toCatalogProduct(item, urls)
}
