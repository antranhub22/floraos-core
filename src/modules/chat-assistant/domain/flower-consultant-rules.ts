/**
 * Flower Consultant Rules (Luật tư vấn ngành hoa và bóc tách ý định người dùng).
 * Thuần logic, không import Prisma hay thư viện ngoài.
 */

import type { ProductMasterIndex } from "@/modules/products/domain/product-master-index"
import type { SuggestedFlowerCard } from "./chat-types"

/**
 * `quotePriceVnd` bằng 0 nghĩa là sản phẩm CHƯA có giá bán lẻ thật cấu hình (Master Index
 * chưa có nguồn giá bán lẻ chính thức — xem rà soát mục 7.2). Không được coi 0 là một mức
 * giá thật khi tư vấn/báo giá cho khách.
 */
export function hasRealPrice(quotePriceVnd: number): boolean {
  return quotePriceVnd > 0
}

/** Chuỗi hiển thị giá trung thực cho khách trong chat — không bao giờ hiện "0 đ". */
export function formatQuotePriceForChat(quotePriceVnd: number): string {
  return hasRealPrice(quotePriceVnd) ? `${quotePriceVnd.toLocaleString("vi-VN")} đ` : "chưa cập nhật giá, liên hệ shop"
}

/**
 * Trích xuất ngân sách mong muốn từ tin nhắn chat
 * Hỗ trợ: "500k", "1 triệu", "1tr5", "800 ngàn", "tầm 600.000"...
 */
export function extractBudgetFromQuery(query: string): number | null {
  const lower = query.toLowerCase()

  // 1.5 triệu, 2 triệu
  const trieuMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:triệu|trieu|tr)/)
  if (trieuMatch?.[1]) {
    const val = parseFloat(trieuMatch[1].replace(",", "."))
    return Math.round(val * 1_000_000)
  }

  // 500k, 650k
  const kMatch = lower.match(/(\d+)\s*k\b/)
  if (kMatch?.[1]) {
    return parseInt(kMatch[1], 10) * 1_000
  }

  // 500 ngàn, 700 nghìn
  const nganMatch = lower.match(/(\d+)\s*(?:ngàn|nghìn|ngan|nghin)/)
  if (nganMatch?.[1]) {
    return parseInt(nganMatch[1], 10) * 1_000
  }

  // 500.000 đ hoặc 500000
  const rawNumMatch = lower.match(/(\d{1,3}(?:\.\d{3})+|\d{5,8})\s*(?:đ|vnd|dong)?/)
  if (rawNumMatch?.[1]) {
    const cleaned = rawNumMatch[1].replace(/\./g, "")
    const num = parseInt(cleaned, 10)
    if (num >= 50_000 && num <= 50_000_000) return num
  }

  return null
}

/**
 * Trích xuất dịp tặng hoa từ tin nhắn
 */
export function extractOccasionFromQuery(query: string): string | null {
  const lower = query.toLowerCase()
  if (lower.includes("sinh nhật") || lower.includes("sinh nhat") || lower.includes("sn")) return "Sinh nhật"
  if (lower.includes("khai trương") || lower.includes("khai truong")) return "Khai trương"
  if (lower.includes("kỷ niệm") || lower.includes("ky niem")) return "Kỷ niệm"
  if (lower.includes("tình yêu") || lower.includes("tỏ tình") || lower.includes("to tinh") || lower.includes("người yêu")) return "Tình yêu"
  if (lower.includes("chia buồn") || lower.includes("tang lễ") || lower.includes("viếng")) return "Chia buồn"
  if (lower.includes("chúc mừng") || lower.includes("thăng chức") || lower.includes("tốt nghiệp")) return "Chúc mừng"
  return null
}

/**
 * Khớp và chọn lọc 1–3 mẫu hoa tối ưu nhất từ Product Master Index
 */
export function matchProductsFromMasterIndex(
  products: ProductMasterIndex[],
  budget: number | null,
  occasion: string | null
): SuggestedFlowerCard[] {
  if (products.length === 0) return []

  // Lọc theo ngân sách (biên độ +/- 35%) và dịp sử dụng
  const scored = products.map((p) => {
    let score = 0
    const price = p.pricing.quotePriceVnd
    const priceKnown = hasRealPrice(price)

    if (budget !== null && priceKnown) {
      const diff = Math.abs(price - budget)
      const ratio = diff / budget
      if (ratio <= 0.15) score += 50
      else if (ratio <= 0.35) score += 30
      else if (ratio <= 0.5) score += 10
      else score -= 20
    } else if (budget !== null && !priceKnown) {
      // Chưa có giá thật — không thể xếp hạng theo ngân sách, xếp thấp hơn mẫu có giá thật
      // để tránh gợi ý nhầm một sản phẩm chưa định giá cho khách đang hỏi theo tầm tiền.
      score -= 10
    } else {
      score += 20
    }

    if (occasion !== null) {
      if (p.occasions.some((o) => o.toLowerCase().includes(occasion.toLowerCase()))) {
        score += 40
      }
    }

    let reason = "Mẫu hoa thiết kế tinh tế, phù hợp ngân sách của bạn"
    if (occasion && budget && priceKnown) {
      reason = `Thiết kế hoa tặng ${occasion} lý tưởng trong tầm giá ${formatQuotePriceForChat(price)}`
    } else if (occasion) {
      reason = `Mẫu hoa được ưa chuộng hàng đầu cho dịp ${occasion}`
    } else if (budget && priceKnown) {
      reason = `Mẫu hoa đẹp xuất sắc trong phân khúc ${formatQuotePriceForChat(price)}`
    } else if (!priceKnown) {
      reason = "Mẫu hoa đẹp, tiệm chưa cập nhật giá bán — liên hệ để được báo giá chính xác"
    }

    return {
      card: {
        productId: p.id,
        productCode: p.code,
        productName: p.name,
        sampleImageUrl: p.masterImageUrl,
        priceVnd: price,
        category: p.category,
        wrapStyle: p.bom.wrapStyle,
        reason,
      },
      score,
    }
  })

  // Sắp xếp điểm cao nhất lên đầu và lấy tối đa 3 mẫu
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.card)
}
