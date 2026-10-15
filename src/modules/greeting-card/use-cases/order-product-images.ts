import type { TenantContext } from "@/core/tenancy"
import { TrackingPipelineRepository } from "../infra/tracking-pipeline-repository"
import { fillOrderProductImage, orderProductId, type OrderWithProductRefs } from "../domain/order-product-image"

/** Bù ảnh mẫu hoa cho danh sách đơn (một truy vấn gộp, đúng tổ chức) — dùng chung mọi API trả đơn thô. */
export async function withOrderProductImages<T extends OrderWithProductRefs>(ctx: TenantContext, orders: T[], repo = new TrackingPipelineRepository()): Promise<T[]> {
  const images = await repo.productMainImages(ctx, orders.map(orderProductId))
  return images.size === 0 ? orders : orders.map((o) => fillOrderProductImage(o, images))
}
