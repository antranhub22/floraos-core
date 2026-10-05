/**
 * Địa chỉ giao hoa 5 ô (PO chốt 06/10/2026). Từ 01/07/2025 Việt Nam bỏ cấp
 * quận/huyện nên ô Quận/Huyện là tuỳ chọn (khách quen ghi theo địa chỉ cũ).
 * Pure TypeScript — dùng chung form khách và máy chủ.
 */

export interface AddressParts {
  /** Số nhà / toà / căn hộ */
  houseNumber: string
  /** Đường / thôn / ấp / tổ */
  street: string
  /** Phường / xã / đặc khu */
  ward: string
  /** Quận / huyện (cũ) — tuỳ chọn */
  district?: string | undefined
  /** Tỉnh / thành phố */
  province: string
}

export const ADDRESS_PART_MAX = 120

export const ADDRESS_FIELDS: readonly { key: keyof AddressParts; label: string; placeholder: string; required: boolean }[] = [
  { key: "houseNumber", label: "Số nhà", placeholder: "VD: 45, Căn 12A.05", required: true },
  { key: "street", label: "Đường / Thôn / Ấp", placeholder: "VD: Lê Lợi", required: true },
  { key: "ward", label: "Phường / Xã", placeholder: "VD: Phường Bến Thành", required: true },
  { key: "district", label: "Quận / Huyện (nếu có)", placeholder: "VD: Quận 1 (không bắt buộc)", required: false },
  { key: "province", label: "Tỉnh / Thành phố", placeholder: "VD: TP. Hồ Chí Minh", required: true },
]

/** Lỗi theo từng ô (tiếng Việt); rỗng nếu hợp lệ. */
export function validateAddressParts(parts: Partial<AddressParts>): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const f of ADDRESS_FIELDS) {
    const value = (parts[f.key] ?? "").trim()
    if (f.required && !value) errors[f.key] = `Vui lòng nhập ${f.label.toLowerCase()}`
    else if (value.length > ADDRESS_PART_MAX) errors[f.key] = `${f.label} tối đa ${ADDRESS_PART_MAX} ký tự`
  }
  return errors
}

/** Một dòng địa chỉ đầy đủ cho shipper/in phiếu: "45 Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh". */
export function composeAddress(parts: Partial<AddressParts>): string {
  const head = [parts.houseNumber, parts.street].map((s) => (s ?? "").trim()).filter(Boolean).join(" ")
  return [head, parts.ward, parts.district, parts.province]
    .map((s) => (s ?? "").trim())
    .filter(Boolean)
    .join(", ")
}

/**
 * Form mới gửi `addressParts`: máy chủ tự ghép dòng địa chỉ (không tin dòng client gửi)
 * và trả lỗi theo từng ô. Form cũ chỉ có `deliveryAddress` → giữ nguyên.
 */
export function normalizeOrderAddress<T extends { deliveryAddress: string; addressParts?: AddressParts | undefined }>(
  input: T,
): { input: T; errors: Record<string, string> } {
  if (!input.addressParts) return { input, errors: {} }
  const errors = validateAddressParts(input.addressParts)
  const parts: AddressParts = {
    houseNumber: input.addressParts.houseNumber.trim(),
    street: input.addressParts.street.trim(),
    ward: input.addressParts.ward.trim(),
    province: input.addressParts.province.trim(),
    ...(input.addressParts.district?.trim() ? { district: input.addressParts.district.trim() } : {}),
  }
  return { input: { ...input, addressParts: parts, deliveryAddress: composeAddress(parts) }, errors }
}
