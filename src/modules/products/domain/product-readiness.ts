/**
 * Tiêu chí đánh giá mức độ sẵn sàng bán của sản phẩm hoa (Product Readiness).
 * SSOT cho vai Product Manager (T6.1 / Role UX 03b).
 *
 * Luật thuần — không import Prisma, không phụ thuộc CSDL.
 */

export interface ProductReadinessInput {
  id: string
  name: string
  code: string
  status: "DRAFT" | "ACTIVE" | "ARCHIVED" | string
  category?: string | null | undefined
  style?: string | null | undefined
  shape?: string | null | undefined
  masterImageUrl?: string | null | undefined
  pricing?: {
    quotePriceVnd?: number | null | undefined
    costPriceVnd?: number | null | undefined
  } | null | undefined
  bom?: {
    flowers?: Array<unknown> | undefined
  } | null | undefined
}

export interface ProductReadinessResult {
  productId: string
  productCode: string
  productName: string
  isReady: boolean
  score: number // 0 đến 100%
  missingReasons: string[]
  criteria: {
    hasActiveStatus: boolean
    hasMasterImage: boolean
    hasCategory: boolean
    hasPricingOrBom: boolean
  }
}

/**
 * Đánh giá một sản phẩm hoa đã đủ điều kiện thương mại sẵn sàng bán hay chưa.
 * Mỗi tiêu chí đóng góp 25% trọng số (tổng 100 điểm):
 * 1. Trạng thái ACTIVE (25%)
 * 2. Đã có ảnh chính thức (25%)
 * 3. Đã có phân loại danh mục (25%)
 * 4. Đã có công thức cắm hoa (BOM) hoặc giá bán niêm yết (25%)
 */
export function computeProductReadiness(product: ProductReadinessInput): ProductReadinessResult {
  const missingReasons: string[] = []

  const hasActiveStatus = product.status === "ACTIVE"
  if (!hasActiveStatus) {
    missingReasons.push("Sản phẩm chưa kích hoạt (đang ở trạng thái Nháp hoặc Lưu trữ)")
  }

  const hasMasterImage = Boolean(product.masterImageUrl && product.masterImageUrl.trim().length > 0)
  if (!hasMasterImage) {
    missingReasons.push("Thiếu ảnh sản phẩm chính thức")
  }

  const hasCategory = Boolean(product.category && product.category.trim().length > 0)
  if (!hasCategory) {
    missingReasons.push("Chưa phân loại danh mục (Bó hoa, Giỏ hoa, Kệ khai trương...)")
  }

  const hasQuotePrice = typeof product.pricing?.quotePriceVnd === "number" && product.pricing.quotePriceVnd > 0
  const hasCostPrice = typeof product.pricing?.costPriceVnd === "number" && product.pricing.costPriceVnd > 0
  const hasBomFlowers = Array.isArray(product.bom?.flowers) && product.bom.flowers.length > 0
  const hasPricingOrBom = hasQuotePrice || hasCostPrice || hasBomFlowers

  if (!hasPricingOrBom) {
    missingReasons.push("Chưa có giá niêm yết hoặc công thức cành hoa (BOM)")
  }

  let score = 0
  if (hasActiveStatus) score += 25
  if (hasMasterImage) score += 25
  if (hasCategory) score += 25
  if (hasPricingOrBom) score += 25

  return {
    productId: product.id,
    productCode: product.code,
    productName: product.name,
    isReady: missingReasons.length === 0,
    score,
    missingReasons,
    criteria: {
      hasActiveStatus,
      hasMasterImage,
      hasCategory,
      hasPricingOrBom,
    },
  }
}
