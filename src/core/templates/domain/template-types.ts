/**
 * FloraOS Template Engine — Domain Types
 * Định nghĩa cấu trúc cho hệ thống template đa tenant.
 */

export type TemplateCategory =
  | "guidance"      // Mẫu hướng dẫn thao tác tính năng
  | "inspection"    // Mẫu kết quả phân tích cấu phần hoa / BOM
  | "commercial"    // Mẫu nội dung bán hàng / SEO / phân khúc giá
  | "sales_pitch"   // Mẫu thẻ chào khách A6 / kịch bản tư vấn Zalo
  | "production"    // Mẫu vận hành / phiếu cắm hoa / thiệp mừng

export type TemplateOutputFormat =
  | "react_component" // Render giao diện React tương tác
  | "plain_text"      // Render chuỗi text / emoji (Zalo, SMS, Messenger)
  | "html"            // Render HTML (email, web, trang in)
  | "canvas_image"    // Render hình ảnh canvas (A6 PNG/JPEG)
  | "pdf"             // Render tài liệu PDF vector

export interface TemplateVariableMeta {
  key: string
  label: string
  category: "product" | "flower" | "pricing" | "service" | "shop"
  description: string
  exampleValue: string
}

export interface TemplateDefinition {
  id: string
  category: TemplateCategory
  name: string
  description: string
  format: TemplateOutputFormat
  templateString: string
  requiredVariables: string[]
  isSystemGolden: boolean
  schemaVersion: number
}

export interface TemplateOverride {
  id: string
  organizationId: string
  templateId: string
  customTemplateString: string
  customVariables?: Record<string, string>
  updatedAt: string
}

export interface InterpolationContext {
  product?: {
    name?: string
    sku?: string
    style?: string
    category?: string
    description?: string
  }
  flower?: {
    summaryList?: string
    mainTones?: string
    facing?: string
    wrapping?: string
    totalStems?: number
    items?: Array<{ name: string; quantity: number; color?: string; role?: string }>
  }
  pricing?: {
    sellingPrice?: number
    sellingPriceVnd?: string
    originalPrice?: number
    originalPriceVnd?: string
    discountPercent?: number
    segment?: string
  }
  service?: {
    giftsList?: string[]
    giftsBullets?: string
    commitmentsList?: string[]
    commitmentsBullets?: string
  }
  shop?: {
    name?: string
    hotline?: string
    address?: string
    zaloLink?: string
    brandTone?: string
  }
  [key: string]: unknown
}
