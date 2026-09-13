/**
 * Domain rules cho Product Copies (M01b) — dữ liệu bán hàng sinh từ phân tích đã duyệt.
 * 
 * Luật:
 * - `raw` là dự đoán gốc của máy (AIC-07, AIC-08, AIC-09, AIC-10), bất biến
 * - `edited` là bản người sửa trước khi duyệt, lưu tách biệt
 * - Chỉ duyệt (`H6`) khi có `analysis_id` trỏ tới `product_analyses` đã `APPROVED`
 * - Duyệt ghi Product Master + `audit_logs` trong một giao dịch
 * - Phân khúc giá là nhãn bán hàng, không ghi vào `orders` hay `pricing_rules`
 */

export type ProductCopyRaw = {
  /** Tên gợi ý: "Bó hồng đỏ 20 cành - Valentine" */
  suggested_name: string;
  /** Mô tả marketing: "Bó hoa hồng đỏ tinh tế, 20 cành, ý nghĩa tình yêu..." */
  suggested_description: string;
  /** Phong cách thiết kế: "Tay vợt sang trọng" */
  suggested_style: string;
  /** Thẻ gợi ý: ["hồng đỏ", "valentine", "tặng người yêu"] */
  suggested_tags: string[];
  /** Dịp gợi ý (mã từ bảng `occasions`): ["valentine", "anniversary"] */
  suggested_occasions: string[];
  /** Phân khúc giá: "budget" | "standard" | "premium" | "luxury" */
  suggested_price_segment: "budget" | "standard" | "premium" | "luxury";
};

export type ProductCopyEdited = Partial<ProductCopyRaw> & {
  /** Ghi đè tên do người duyệt sửa */
  suggested_name?: string;
  /** Ghi đè mô tả */
  suggested_description?: string;
  /** Ghi đè phong cách */
  suggested_style?: string;
  /** Ghi đè thẻ */
  suggested_tags?: string[];
  /** Ghi đè dịp */
  suggested_occasions?: string[];
  /** Ghi đè phân khúc */
  suggested_price_segment?: "budget" | "standard" | "premium" | "luxury";
};

export type ProductCopyEffective = ProductCopyRaw & ProductCopyEdited;

/**
 * Kiểm tra xem product_copy có thể duyệt không
 * - Phải có analysis_id hợp lệ
 * - product_analyses tương ứng phải đã APPROVED
 */
export function canApproveProductCopy(
  analysisApprovalState: "PENDING" | "APPROVED" | "REJECTED"
): boolean {
  return analysisApprovalState === "APPROVED";
}

/**
 * Lấy dữ liệu hiệu lực: edited ưu tiên, fallback raw
 */
export function resolveEffectiveProductCopy(
  raw: ProductCopyRaw,
  edited: ProductCopyEdited | null
): ProductCopyEffective {
  if (!edited) return raw;
  return {
    ...raw,
    ...edited,
    suggested_tags: edited.suggested_tags ?? raw.suggested_tags,
    suggested_occasions: edited.suggested_occasions ?? raw.suggested_occasions,
    suggested_style: edited.suggested_style ?? raw.suggested_style,
  };
}

/**
 * Validate raw data từ AI — đảm bảo có đủ các trường bắt buộc
 */
export function validateProductCopyRaw(data: unknown): data is ProductCopyRaw {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.suggested_name === "string" && d.suggested_name.length > 0 &&
    typeof d.suggested_description === "string" &&
    Array.isArray(d.suggested_tags) &&
    Array.isArray(d.suggested_occasions) &&
    ["budget", "standard", "premium", "luxury"].includes(d.suggested_price_segment as string)
  );
}

/**
 * Validate edited data — chỉ cho phép các trường đã định nghĩa
 */
export function validateProductCopyEdited(data: unknown): data is ProductCopyEdited {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  const allowedKeys = [
    "suggested_name",
    "suggested_description",
    "suggested_style",
    "suggested_tags",
    "suggested_occasions",
    "suggested_price_segment"
  ];
  return Object.keys(d).every(k => allowedKeys.includes(k));
}

/**
 * Schema cho payload tạo product_copy từ AI gateway
 * AI gateway trả về structured output theo AIC-07..10
 */
export const PRODUCT_COPY_AI_SCHEMA = {
  type: "object",
  properties: {
    suggested_name: { type: "string", minLength: 1, maxLength: 200 },
    suggested_description: { type: "string", minLength: 1, maxLength: 2000 },
    suggested_tags: { type: "array", items: { type: "string" }, maxItems: 20 },
    suggested_occasions: { type: "array", items: { type: "string" }, maxItems: 10 },
    suggested_price_segment: { 
      type: "string", 
      enum: ["budget", "standard", "premium", "luxury"] 
    },
  },
  required: ["suggested_name", "suggested_description", "suggested_tags", "suggested_occasions", "suggested_price_segment"],
  additionalProperties: false,
} as const;