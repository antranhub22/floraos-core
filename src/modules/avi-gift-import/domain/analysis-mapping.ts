/**
 * Luật thuần cho lượt nạp phân tích ảnh LỊCH SỬ của AVI GIFT (P8, nợ #34 —
 * `docs/dac-ta/TECHNICAL_DEBT.md`). Không import Prisma, không đọc tệp —
 * đầu vào là JSON trung gian do `scripts/nap-avi-gift/doc-phan-tich.py` sinh
 * ra từ `ket-qua/results.jsonl` + thư mục `images/` thật.
 *
 * Đây là lượt nạp thứ HAI của P8. Lượt một (`catalog-mapping.ts`) nạp danh
 * mục giá 1.316 SKU, tất cả `DRAFT` vì chưa có ảnh. Lượt này nạp tám sản
 * phẩm CÓ ẢNH THẬT và đã qua phân tích nhận diện đầy đủ ở v1.
 *
 * Vì sao `product_analyses.approval_state = APPROVED` ngay lúc nạp, không đi
 * qua luồng Review→Approve (`H3`): tám lượt phân tích này đã được dùng trong
 * vận hành thật ở v1 — chúng là dữ liệu LỊCH SỬ, không phải đề xuất mới của
 * máy đang chờ người xem. Bắt duyệt lại là bắt người xác nhận lại một việc
 * họ đã làm. Lượt nạp chính là sự kiện duyệt, ghi một lần, có `approved_by`
 * và `approved_at` thật.
 *
 * Vì sao `assets.approval_state` VẪN để `PENDING` (mặc định): đó là cột của
 * P9 (Identity Guard + Cổng 2), nợ #30 — và mấy tấm này là ảnh CHỤP của cửa
 * hàng, chưa từng qua Identity Guard, cũng không phải Master Image do máy
 * dựng. Đặt `APPROVED` cho chúng là giả mạo một lượt duyệt ảnh chưa từng
 * chạy, và sẽ làm `GET /integration/products/:id/master-image` trả ra ảnh
 * gốc như thể đã qua cổng.
 */

/** Ảnh thật trong thư mục sản phẩm — mỗi tấm thành một `assets`. */
export type AnalysisImageSource = {
  fileName: string
  absolutePath: string
  mimeType: string
  fileSize: number | null
  width: number | null
  height: number | null
  sha256: string
}

export type AnalysisSourceRow = {
  code: string
  /** Tên tệp của tấm ảnh mà lượt phân tích đã chạy trên đó. */
  analyzedFileName: string
  /** Dấu thời gian v1 ghi lại, dạng "2026-08-10 12:45:34" (giờ địa phương). */
  analyzedAt: string | null
  schemaVersion: number | null
  images: AnalysisImageSource[]
  analysis: Record<string, unknown>
}

/**
 * Xuất xứ của tám lượt phân tích này, ghi vào `product_analyses` để sau này
 * còn phân biệt được dữ liệu chạy ở v1 với dữ liệu chạy trên core.
 *
 * `provider`/`model` KHÔNG bịa: v1 chạy qua OpenAI, nhưng `results.jsonl`
 * không ghi lại tên model cụ thể của từng lượt — nên ghi đúng chừng đó và
 * nói rõ là lịch sử, thay vì điền một chuỗi model trông như thật.
 */
export const HISTORICAL_PROVIDER = "openai"
export const HISTORICAL_MODEL = "khong-ghi-lai-o-v1"
export const HISTORICAL_CONTRACT_NAME = "PhanTichSanPhamHoa"

/** Feature của `generation_jobs` tổng hợp — một dòng duy nhất đại diện cho
 *  cả tám lượt phân tích đã chạy ở v1. */
export const HISTORICAL_JOB_FEATURE = "vision.analysis"
export const HISTORICAL_JOB_IDEMPOTENCY_KEY = "avi-gift-phan-tich-lich-su-v1"

export const ANALYSIS_IMPORT_SOURCE = "ket-qua/results.jsonl + images/ (FloraOS v1)"

export class InvalidAnalysisRowError extends Error {}

/**
 * `contract_version` suy từ `schema_version` của v1 (10 ở cả tám dòng). Cột
 * này là `String` không rỗng trong lược đồ, nên phải có giá trị — dùng
 * `v1-schema-<n>` để đọc lên biết ngay đây là hợp đồng của v1, không phải
 * phiên bản hợp đồng của core.
 */
export function contractVersionFromSchema(schemaVersion: number | null): string {
  if (schemaVersion === null || !Number.isInteger(schemaVersion)) return "v1-schema-khong-ro"
  return `v1-schema-${schemaVersion}`
}

/**
 * "2026-08-10 12:45:34" → `Date`. v1 ghi giờ ĐỊA PHƯƠNG không kèm múi giờ;
 * `new Date("2026-08-10 12:45:34")` trong Node đọc đúng theo giờ máy chạy,
 * mà máy chạy lượt nạp cùng múi giờ với cửa hàng (Asia/Ho_Chi_Minh) nên
 * không lệch. Chuỗi hỏng hoặc thiếu thì trả `null` — tầng trên dùng
 * `importedAt` thay, không đoán một mốc thời gian sai.
 */
export function parseHistoricalTimestamp(value: string | null): Date | null {
  if (!value) return null
  const parsed = new Date(value.replace(" ", "T"))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export type ProductAnalysisImportRow = {
  code: string
  analyzedFileName: string
  analyzedAt: Date | null
  contractVersion: string
  images: AnalysisImageSource[]
  raw: Record<string, unknown>
}

/**
 * Một bản ghi JSON trung gian → một dòng nạp. Ném khi thiếu thứ không suy
 * được: mã sản phẩm, khối `analysis`, danh sách ảnh, hoặc khi tấm ảnh đã
 * phân tích không nằm trong danh sách ảnh (bản ghi tự mâu thuẫn — dừng ngay
 * còn hơn tạo một `product_analyses` trỏ vào `asset` không tồn tại).
 */
export function mapAnalysisRow(row: AnalysisSourceRow): ProductAnalysisImportRow {
  const code = row.code?.trim()
  if (!code) throw new InvalidAnalysisRowError("Thiếu code")

  if (!row.analysis || Object.keys(row.analysis).length === 0) {
    throw new InvalidAnalysisRowError(`Mã ${code} không có khối analysis`)
  }
  if (!row.images || row.images.length === 0) {
    throw new InvalidAnalysisRowError(`Mã ${code} không có ảnh nào`)
  }
  if (!row.images.some((image) => image.fileName === row.analyzedFileName)) {
    throw new InvalidAnalysisRowError(
      `Mã ${code}: ảnh đã phân tích (${row.analyzedFileName}) không có trong danh sách ảnh`
    )
  }

  return {
    code,
    analyzedFileName: row.analyzedFileName,
    analyzedAt: parseHistoricalTimestamp(row.analyzedAt),
    contractVersion: contractVersionFromSchema(row.schemaVersion),
    images: row.images,
    raw: row.analysis,
  }
}

/**
 * Bốn trường nhận dạng của `products` — ở lượt nạp NÀY thì lấy được thật,
 * khác hẳn lượt nạp danh mục (`catalog-mapping.ts`) cố ý để `null` cả bốn.
 * Khác biệt nằm ở nguồn: bốn giá trị dưới đây do MÁY nhận ra từ ảnh qua M01
 * và đã qua sử dụng vận hành, đúng nghĩa "enum `identity.category` của hợp
 * đồng Vision" (đặc tả 07 mục 9) — không phải từ vựng nghiệp vụ người gõ tay.
 */
export type IdentityFields = {
  category: string | null
  shape: string | null
  facing: string | null
  container: string | null
}

export function extractIdentity(raw: Record<string, unknown>): IdentityFields {
  const identity = raw.identity
  if (typeof identity !== "object" || identity === null) {
    return { category: null, shape: null, facing: null, container: null }
  }
  const read = (key: string): string | null => {
    const value = (identity as Record<string, unknown>)[key]
    return typeof value === "string" && value.trim() !== "" ? value.trim() : null
  }
  return {
    category: read("category"),
    shape: read("shape"),
    facing: read("facing"),
    container: read("container"),
  }
}

/**
 * Tên đặt cho sản phẩm PHẢI TẠO MỚI — ba mã có phân tích thật nhưng không có
 * trong danh mục 1.316 (`GHTM`, `MM17082026`, `KG-20260831-001`; chốt với
 * anh Tony 09/10: tạo `products` mới, không bỏ và không để `product_id`
 * rỗng). Không có tên thương mại nào ở nguồn nên dựng từ chính kết quả nhận
 * dạng, và giữ mã trong tên để người đọc biết ngay nó đến từ đâu.
 */
export function draftNameForNewProduct(code: string, identity: IdentityFields): string {
  const parts = [identity.category, identity.shape].filter(
    (part): part is string => part !== null
  )
  return parts.length > 0 ? `${parts.join(" ")} ${code}` : code
}

/**
 * Đuôi tệp cho `buildStorageKey`. Suy từ TÊN TỆP chứ không từ `mime_type`:
 * giữ nguyên đuôi thật của ảnh gốc để đối chiếu ngược lại nguồn dễ hơn.
 */
export function extensionFromFileName(fileName: string): string {
  const match = /\.([A-Za-z0-9]+)$/.exec(fileName)
  if (!match?.[1]) throw new InvalidAnalysisRowError(`Tên tệp không có đuôi: ${fileName}`)
  return match[1].toLowerCase()
}
