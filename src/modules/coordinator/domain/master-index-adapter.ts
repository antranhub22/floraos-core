/**
 * Master Index Adapter for Coordinator Operations.
 * Trích xuất Atomic BOM và Customer Profile từ Product/Customer Master Index SSOT.
 */

import type {
  ProductMasterIndex,
  FlowerBomItem,
  FoliageBomItem,
  WrappingLayer,
  AccessoryBomItem,
  StructuredAddress,
} from "@/modules/products/domain/product-master-index"
import type { FloristProductionCardData } from "./coordinator-types"

/**
 * Trích xuất thông số cắm hoa chuẩn từ metadata của OrderItem hoặc ProductMasterIndex.
 */
export function extractFloristRecipeFromOrderItem(item: {
  productTitle?: string
  description?: string | null
  metadata?: Record<string, unknown> | null
  orderCode: string
  orderId: string
  targetReadyTime: string
  deliveryAddress: StructuredAddress | string
  cardMessage?: string | null
  internalNote?: string | null
}): FloristProductionCardData {
  const meta = item.metadata ?? {}
  const rawFlowers = (meta.flowers as FlowerBomItem[]) || []
  const rawFoliage = (meta.foliage as FoliageBomItem[]) || []
  const rawWrapping = (meta.wrapping as WrappingLayer[]) || []
  const rawAccessories = (meta.accessories as AccessoryBomItem[]) || []

  // Nếu trong metadata chưa có BOM nguyên tử (đơn tạo tay không qua Master Index)
  // thì cung cấp fallback rõ ràng để giao diện không bị lỗi crash
  const flowers: FlowerBomItem[] = rawFlowers.length > 0
    ? rawFlowers
    : [
        {
          flowerName: item.description || item.productTitle || "Mẫu hoa theo yêu cầu",
          quantity: 1,
          unit: "cành",
          color: "Tự nhiên",
          role: "Chủ đạo",
        },
      ]

  // ĐP-1.4 (26/09/2026): trước bản này, thiếu dữ liệu BOM thật thì hàm này BỊA
  // ra "Lá đệm theo mùa" / "Giấy gói cao cấp" / "Thiệp chúc mừng" — đối tác xưởng
  // đọc phiếu tưởng đó là yêu cầu thật của Sales. Theo nguyên tắc "không bịa dữ
  // liệu" (AGENTS.md), thiếu thì trả mảng RỖNG; giao diện (`partner-production-card.tsx`)
  // đã tự ẩn khối tương ứng khi mảng rỗng.
  const foliage: FoliageBomItem[] = rawFoliage
  const wrapping: WrappingLayer[] = rawWrapping
  const accessories: AccessoryBomItem[] = rawAccessories

  return {
    orderId: item.orderId,
    orderCode: item.orderCode,
    recipeTitle: item.productTitle || item.description || "Bó hoa tươi thiết kế",
    targetReadyTime: item.targetReadyTime,
    deliveryAddress: item.deliveryAddress,
    cardMessage: item.cardMessage,
    internalNote: item.internalNote,
    flowers,
    foliage,
    wrapping,
    accessories,
    sampleImageUrl: (meta.sampleImageUrl as string) || null,
  }
}

// MI-6 (ĐP-2.4, 26/09/2026): `extractCustomerCoordinationBrief` từng sống ở đây đã XOÁ.
// Đọc tóm tắt hồ sơ khách qua `projectCustomerCoordinationBrief` của Customer Master Index
// (`@/modules/crm/domain/customer-master-index`) — Hợp đồng MI §3/§7 cấm Điều phối tự trích
// lát cắt CMI thay vì đi qua projection chính chủ.
