/**
 * Pure TypeScript Domain Engine cho Bộ Sưu Tập Nhanh (Quick Collection Generator).
 * Không phụ thuộc Prisma, DB hay UI. Tuân thủ Clean Architecture & Zero-leak.
 */

export interface PriceRange {
  min: number
  max: number
  label?: string
}

export interface QuickCollectionCriteria {
  // Tiêu chí bắt buộc hoặc tùy chọn
  occasion?: string | undefined
  category?: string | undefined
  flowerType?: string | undefined
  colorTone?: string | undefined
  priceMin?: number | undefined
  priceMax?: number | undefined
  priceRanges?: PriceRange[] | undefined // Hỗ trợ chọn nhiều khung giá cùng lúc
  productLimit?: number | undefined // Số lượng sản phẩm muốn đưa vào (mặc định 6)
  
  // Thông tin cá nhân hóa (Personalized Customer Link)
  customerName?: string | undefined
  customerPhone?: string | undefined
  customTitle?: string | undefined
}

export interface QuickCollectionCandidate {
  id: string
  code: string
  name: string
  price: number | null
  category?: string | null | undefined
  shape?: string | null | undefined
  colorTheme?: string | null | undefined
  occasions?: string[] | undefined
  flowerTypes?: string[] | undefined
  imageUrl?: string | null | undefined
  status?: string | undefined
}

export interface ScoredCollectionProduct {
  product: QuickCollectionCandidate
  matchScore: number // 0 - 100
  matchTags: string[]
}

export interface QuickCollectionResult {
  selectedProducts: QuickCollectionCandidate[]
  totalMatched: number
  generatedName: string
  suggestedSlug: string
  customerMessage: string
  personalizedGreeting?: string | undefined
}

function normalize(str: string | null | undefined): string {
  if (!str) return ""
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

/**
 * Tính điểm tương thích sản phẩm dựa trên tiêu chí người dùng đưa ra.
 */
export function scoreProductForCollection(
  product: QuickCollectionCandidate,
  criteria: QuickCollectionCriteria
): { score: number; tags: string[] } {
  let score = 50 // Điểm cơ sở
  const tags: string[] = []

  // 1. Khoảng giá (Weight 30)
  const price = product.price ?? 0
  const ranges = criteria.priceRanges
  const min = criteria.priceMin
  const max = criteria.priceMax

  if (ranges && ranges.length > 0) {
    // Có danh sách nhiều khoảng giá được chọn
    const inAnyExact = ranges.some((r) => price >= r.min && price <= r.max)
    const inAnyNear = ranges.some((r) => price >= r.min * 0.85 && price <= r.max * 1.15)

    if (inAnyExact) {
      score += 30
      tags.push("Đúng tầm giá")
    } else if (inAnyNear) {
      score += 15
      tags.push("Gần tầm giá")
    } else {
      score -= 25
    }
  } else if (min !== undefined && max !== undefined) {
    if (price >= min && price <= max) {
      score += 30
      tags.push("Đúng tầm giá")
    } else if (price >= min * 0.85 && price <= max * 1.15) {
      score += 15
      tags.push("Gần tầm giá")
    } else {
      score -= 25
    }
  } else if (min !== undefined) {
    if (price >= min) {
      score += 20
      tags.push(`Từ ${(min / 1000).toLocaleString()}k`)
    } else {
      score -= 20
    }
  } else if (max !== undefined) {
    if (price <= max) {
      score += 20
      tags.push(`Dưới ${(max / 1000).toLocaleString()}k`)
    } else {
      score -= 25
    }
  }

  // 2. Dịp tặng (Weight 25)
  if (criteria.occasion && criteria.occasion.trim() !== "") {
    const normCritOcc = normalize(criteria.occasion)
    const productOccs = (product.occasions || []).map(normalize)
    const matched = productOccs.some((occ) => occ.includes(normCritOcc) || normCritOcc.includes(occ))
    if (matched) {
      score += 25
      tags.push(`Dịp ${criteria.occasion}`)
    }
  }

  // 3. Loại sản phẩm (Bó hoa, Giỏ hoa, Kệ hoa...) (Weight 20)
  if (criteria.category && criteria.category.trim() !== "") {
    const normCritCat = normalize(criteria.category)
    const prodCat = normalize(product.category)
    const prodShape = normalize(product.shape)
    if (prodCat.includes(normCritCat) || normCritCat.includes(prodCat) || prodShape.includes(normCritCat)) {
      score += 20
      tags.push(criteria.category)
    }
  }

  // 4. Loại hoa (Hoa hồng, Lan hồ điệp...) (Weight 15)
  if (criteria.flowerType && criteria.flowerType.trim() !== "") {
    const normCritFlower = normalize(criteria.flowerType)
    const prodName = normalize(product.name)
    const prodFlowers = (product.flowerTypes || []).map(normalize)
    const matched = prodFlowers.some((f) => f.includes(normCritFlower) || normCritFlower.includes(f)) || prodName.includes(normCritFlower)
    if (matched) {
      score += 15
      tags.push(criteria.flowerType)
    }
  }

  // 5. Tone màu (Weight 10)
  if (criteria.colorTone && criteria.colorTone.trim() !== "") {
    const normCritColor = normalize(criteria.colorTone)
    const prodColor = normalize(product.colorTheme)
    const prodName = normalize(product.name)
    if (prodColor.includes(normCritColor) || prodName.includes(normCritColor)) {
      score += 10
      tags.push(`Tone ${criteria.colorTone}`)
    }
  }

  // Ưu tiên sản phẩm có ảnh thật
  if (product.imageUrl) {
    score += 5
  }

  return { score: Math.max(0, score), tags }
}

/**
 * Tuyển chọn các sản phẩm phù hợp nhất và cấu trúc dữ liệu cho bộ sưu tập.
 */
export function generateQuickCollection(
  candidates: QuickCollectionCandidate[],
  criteria: QuickCollectionCriteria
): QuickCollectionResult {
  const limit = Math.max(1, Math.min(20, criteria.productLimit ?? 6))

  // Lọc chỉ lấy sản phẩm ACTIVE nếu có status
  const validCandidates = candidates.filter((p) => !p.status || p.status === "ACTIVE")

  // Chấm điểm và phân loại
  const scored: ScoredCollectionProduct[] = validCandidates.map((product) => {
    const { score, tags } = scoreProductForCollection(product, criteria)
    return { product, matchScore: score, matchTags: tags }
  })

  // Sắp xếp theo matchScore giảm dần
  scored.sort((a, b) => b.matchScore - a.matchScore)

  const selectedProducts = scored.slice(0, limit).map((s) => s.product)

  // Sinh tiêu đề bộ sưu tập
  let generatedName = criteria.customTitle?.trim() || ""
  if (!generatedName) {
    const parts: string[] = []
    if (criteria.customerName?.trim()) {
      parts.push(`Dành Riêng Cho ${criteria.customerName.trim()}`)
    } else {
      parts.push("Bộ Sưu Tập Hoa")
    }

    if (criteria.occasion) parts.push(criteria.occasion)
    if (criteria.category) parts.push(criteria.category)
    if (criteria.colorTone) parts.push(`Tone ${criteria.colorTone}`)

    generatedName = parts.join(" — ")
  }

  // Sinh slug định danh ngẫu nhiên
  const baseSlug = normalize(criteria.customerName || criteria.occasion || criteria.category || "bst")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "bst"
  const randomSuffix = Math.random().toString(36).substring(2, 7)
  const suggestedSlug = `${baseSlug}-${randomSuffix}`

  // Soạn sẵn tin nhắn gửi khách hàng (Zalo / SMS / Messenger)
  let customerMessage = ""
  if (criteria.customerName?.trim()) {
    customerMessage = `Dạ em chào ${criteria.customerName.trim()} ạ! Tiệm gửi ${criteria.customerName.trim()} link xem ${selectedProducts.length} mẫu hoa chọn riêng cho mình: {URL}\n${criteria.customerName.trim()} xem ưng mẫu nào báo em chuẩn bị ngay nhé ạ!`
  } else {
    customerMessage = `Dạ tiệm gửi anh/chị link ${selectedProducts.length} mẫu hoa theo yêu cầu: {URL}\nAnh/chị ưng mẫu nào nhắn tiệm hỗ trợ ngay nhé ạ!`
  }

  const personalizedGreeting = criteria.customerName?.trim()
    ? `Mẫu hoa chọn riêng cho ${criteria.customerName.trim()}`
    : undefined

  return {
    selectedProducts,
    totalMatched: scored.filter((s) => s.matchScore >= 50).length,
    generatedName,
    suggestedSlug,
    customerMessage,
    personalizedGreeting,
  }
}
