/**
 * Đường dẫn lưu trữ theo tổ chức, không theo người dùng (đặc tả 07 mục 5,
 * đặc tả 05 mục 5): `org/<organization_id>/<product_id>/<asset_id>.<ext>`.
 * Người dùng đổi vai, rời tổ chức hoặc bị xoá; quyền sở hữu dữ liệu thuộc về
 * tổ chức.
 *
 * `product_id` có thể null (asset ở workspace trải nghiệm, hoặc asset chưa
 * gắn sản phẩm nào) — đặc tả không nói đường dẫn trong trường hợp đó, dùng
 * `unfiled` làm đoạn cố định thay vì để trống (một đoạn rỗng làm đường dẫn
 * mơ hồ giữa hai cấp thư mục).
 *
 * Thuần: không import hạ tầng.
 */
export function buildStorageKey(input: {
  organizationId: string
  productId: string | null
  assetId: string
  extension: string
}): string {
  const ext = input.extension.replace(/^\./, "").toLowerCase()
  const product = input.productId ?? "unfiled"
  return `org/${input.organizationId}/${product}/${input.assetId}.${ext}`
}

const EXTENSION_BY_MIME: Readonly<Record<string, string>> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
}

export function extensionForMimeType(mimeType: string): string {
  const ext = EXTENSION_BY_MIME[mimeType.toLowerCase()]
  if (!ext) throw new Error(`Kiểu tệp không được hỗ trợ: ${mimeType}`)
  return ext
}
