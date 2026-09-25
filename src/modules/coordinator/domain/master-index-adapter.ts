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
import type { CustomerMasterIndex } from "@/modules/crm/domain/customer-master-index"
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

  const foliage: FoliageBomItem[] = rawFoliage.length > 0
    ? rawFoliage
    : [
        {
          name: "Lá đệm theo mùa",
          quantity: null,
          unit: "lá",
          color: "Xanh lá",
          role: "Nền",
        },
      ]

  const wrapping: WrappingLayer[] = rawWrapping.length > 0
    ? rawWrapping
    : [
        {
          layer: "Lớp ngoài",
          material: (meta.wrapStyle as string) || "Giấy gói cao cấp",
          color: "Tone chuẩn",
          texture: "Mịn",
        },
      ]

  const accessories: AccessoryBomItem[] = rawAccessories.length > 0
    ? rawAccessories
    : [
        {
          name: "Thiệp chúc mừng",
          material: "Giấy mỹ thuật",
          color: "Trắng kem",
          quantity: 1,
          printedText: item.cardMessage || null,
        },
      ]

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

/**
 * Trích xuất tóm tắt hồ sơ khách hàng phục vụ ưu tiên điều phối.
 */
export function extractCustomerCoordinationBrief(customer?: CustomerMasterIndex | null) {
  if (!customer) {
    return {
      tier: "NEW" as const,
      isVip: false,
      preferredFlowers: [],
      notes: "Khách vãng lai / Đặt trực tiếp",
    }
  }

  return {
    tier: customer.metrics.tier,
    isVip: customer.metrics.tier === "VIP" || customer.metrics.tier === "GOLD",
    preferredFlowers: customer.preferences.preferredFlowers,
    notes: customer.notes || "Khách hàng thân thiết",
  }
}
