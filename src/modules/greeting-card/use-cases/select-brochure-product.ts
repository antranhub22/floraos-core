import { conflict } from "@/core/http/errors"
import { GreetingCardRepository } from "../infra/greeting-card-repository"
import { canTransitionSessionStatus } from "../domain/greeting-card-rules"
import type { GreetingSessionStatus, ProductSnapshot } from "../domain/greeting-card-types"
import { loadPublicSession, resolveOrderableProduct } from "./brochure-session-access"
import { snapshotOf } from "./brochure-product-mapper"

/**
 * Khách chốt một mẫu trên thẻ. Ảnh chụp mẫu (tên, giá, ảnh) dựng hoàn toàn
 * ở server — bản cũ lấy nguyên object `product` khách gửi lên, nên khách sửa
 * được giá trước khi đặt.
 */
export async function selectBrochureProduct(
  sendCode: string,
  productId: string,
  repo = new GreetingCardRepository()
): Promise<ProductSnapshot> {
  const session = await loadPublicSession(sendCode, repo)
  if (session.order_id || !canTransitionSessionStatus(session.status as GreetingSessionStatus, "SELECTED")) {
    throw conflict("Thẻ chào này đã có đơn hàng, không thể đổi mẫu")
  }

  const product = await resolveOrderableProduct(session, productId, repo)
  const snapshot = snapshotOf(product)

  await repo.updateSession(session.id, {
    status: "SELECTED",
    selectedProductId: product.id,
    productSnapshot: snapshot,
    selectedAt: new Date(snapshot.selectedAt),
  })
  await repo.recordJourneyEvent(session.organization_id, session.id, "SELECT_PRODUCT", {
    productId: product.id,
    price: snapshot.price,
  })
  return snapshot
}
