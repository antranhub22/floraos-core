/**
 * Luật thuần cho kết quả phân tích ảnh (`product_analyses`, đặc tả 07 mục 9,
 * P5). Không import Prisma — test không cần cơ sở dữ liệu (quy ước
 * `AGENTS.md`: `domain/` không import hạ tầng).
 *
 * `raw` là dự đoán gốc của máy theo đúng hợp đồng `PhanTichSanPhamHoa`
 * (`workers/vision/contracts/Schema.json`, thu hoạch R1) — không khai lại
 * hình dạng đó bằng tay ở đây (`YC-N3`), vì mọi field ngoài những gì các hàm
 * dưới đây cần được coi là `unknown` và đọc phòng thủ.
 */

export type ApprovalState = "PENDING" | "APPROVED" | "REJECTED"

/** `PATCH /vision/analyses/:id` (`H2`) — không sửa được sau khi đã duyệt. */
export function canEditAnalysis(state: ApprovalState): boolean {
  return state !== "APPROVED"
}

/**
 * `POST /vision/analyses/:id/approve` (`H3`). Đặc tả 06 mục 8: "Duyệt một
 * bản ghi đã APPROVED trả 409." Bản ghi `REJECTED` duyệt lại được — người
 * dùng có thể đã sửa `edited` sau khi từ chối lần đầu.
 */
export function canApproveAnalysis(state: ApprovalState): boolean {
  return state !== "APPROVED"
}

/**
 * Bản sửa của người thắng bản gốc của máy khi có — cặp *raw/edited* tách
 * biệt (`YC-R3`) chỉ có ý nghĩa nếu nơi đọc kết quả luôn ưu tiên `edited`.
 */
export function resolveEffectiveAnalysis(
  raw: Record<string, unknown>,
  edited: Record<string, unknown> | null
): Record<string, unknown> {
  return edited ?? raw
}

export type ProductFieldsFromAnalysis = {
  category: string | null
  shape: string | null
  facing: string | null
  container: string | null
  attributes: Record<string, unknown>
}

function readNullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null
}

/**
 * Trích `identity.{category,shape,facing,container}` từ hợp đồng Vision để
 * ghi vào `products` (đặc tả 07 mục 9: `category` là "enum identity.category
 * của hợp đồng Vision"). Đọc phòng thủ — đầu ra AI có thể thiếu trường hoặc
 * sai hình dạng, hàm này không bao giờ ném lỗi, chỉ trả `null`.
 *
 * `attributes` giữ nguyên toàn bộ `bom` (định mức vật tư) và `confidence` —
 * Product Master cần dữ liệu này cho M02 (giá) và M03 (tra cứu) ở P6, không
 * chỉ bốn trường nhận dạng.
 */
export function extractProductFieldsFromAnalysis(
  analysis: Record<string, unknown>
): ProductFieldsFromAnalysis {
  const identity =
    typeof analysis.identity === "object" && analysis.identity !== null
      ? (analysis.identity as Record<string, unknown>)
      : {}

  return {
    category: readNullableString(identity.category),
    shape: readNullableString(identity.shape),
    facing: readNullableString(identity.facing),
    container: readNullableString(identity.container),
    attributes: {
      bom: analysis.bom ?? null,
      confidence: analysis.confidence ?? null,
      checklist: analysis.checklist ?? null,
      san_xuat: analysis.san_xuat ?? null,
    },
  }
}

/**
 * Tên nháp cho sản phẩm mới tạo lúc duyệt, khi `product_analyses.product_id`
 * là `null` (chưa gắn sản phẩm nào — `POST /vision/analyses` cho phép
 * `product_id: null`, đặc tả 06 mục 8). Hợp đồng Vision không có trường tên
 * sản phẩm, chỉ có `identity.category`; đây là một giả định hiển thị, ghi ở
 * `TECHNICAL_DEBT.md`, chờ chủ sản phẩm xác nhận có cần trường tên riêng lúc
 * tạo lượt phân tích hay không.
 */
export function draftProductName(fields: ProductFieldsFromAnalysis): string {
  return fields.category ?? "Sản phẩm chưa đặt tên"
}
