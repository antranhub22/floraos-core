import React, { useState, useMemo } from "react"
import { ADDRESS_PART_MAX, type AddressParts } from "@/modules/greeting-card/domain/delivery-address"
import { ALL_VN_PROVINCES, VN_POPULAR_PROVINCES } from "@/modules/greeting-card/domain/vn-provinces"
import { ChevronDown, MapPin, Search } from "lucide-react"

/**
 * Địa chỉ giao hoa nâng cấp (Spec #8):
 * - Cascading Address Selection: Tỉnh/Thành phố → Phường/Xã → Địa chỉ cụ thể.
 * - Nhập nhanh, tự gợi ý, giảm lỗi địa chỉ, cho phép chỉnh sửa thủ công.
 * - 100% tiếng Việt thống nhất (không còn nhãn "Province").
 */
export function AddressFields(props: {
  idPrefix: string
  value: AddressParts
  inputClassName: string
  onChange: (next: AddressParts) => void
}) {
  const { idPrefix, value, inputClassName, onChange } = props

  // Phân tích danh sách phường/xã gợi ý theo tỉnh thành đang chọn
  const provinceData = useMemo(() => {
    return VN_POPULAR_PROVINCES.find((p) => p.name === value.province)
  }, [value.province])

  const suggestedWards = provinceData?.wards ?? []

  function handleProvinceChange(province: string) {
    onChange({
      ...value,
      province,
      // Khi đổi tỉnh thành khác, nếu phường hiện tại không thuộc tỉnh mới thì có thể để người dùng chọn lại
    })
  }

  function handleWardSelect(ward: string) {
    // Tự tách quận/huyện nếu có trong ngoặc: "Phường Bến Nghé (Quận 1)"
    const match = ward.match(/^(.*?)\s*\((.*?)\)$/)
    if (match) {
      onChange({
        ...value,
        ward: match[1]?.trim() ?? ward,
        district: match[2]?.trim() ?? value.district,
      })
    } else {
      onChange({
        ...value,
        ward,
      })
    }
  }

  return (
    <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <legend className="mb-1 block text-body-sm font-bold text-foreground">
        Địa chỉ nhận hoa <span className="text-danger">*</span>
      </legend>

      {/* 1. TỈNH / THÀNH PHỐ (CASCADING BƯỚC 1) */}
      <div className="sm:col-span-1">
        <label htmlFor={`${idPrefix}-province`} className="mb-1 block text-caption font-semibold text-text-muted">
          Tỉnh / Thành phố <span className="text-danger">*</span>
        </label>
        <select
          id={`${idPrefix}-province`}
          required
          value={value.province || "TP. Hồ Chí Minh"}
          onChange={(e) => handleProvinceChange(e.target.value)}
          className={inputClassName}
        >
          <option value="">— Chọn Tỉnh / Thành phố —</option>
          {ALL_VN_PROVINCES.map((prov) => (
            <option key={prov} value={prov}>
              {prov}
            </option>
          ))}
        </select>
      </div>

      {/* 2. PHƯỜNG / XÃ (CASCADING BƯỚC 2) */}
      <div className="sm:col-span-1">
        <label htmlFor={`${idPrefix}-ward`} className="mb-1 block text-caption font-semibold text-text-muted">
          Phường / Xã <span className="text-danger">*</span>
        </label>
        {suggestedWards.length > 0 ? (
          <div className="space-y-1">
            <select
              id={`${idPrefix}-ward`}
              value={value.district ? `${value.ward} (${value.district})` : value.ward}
              onChange={(e) => handleWardSelect(e.target.value)}
              className={inputClassName}
            >
              <option value="">— Chọn Phường / Xã —</option>
              {suggestedWards.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
              <option value="__other__">Khác (tự nhập tay)...</option>
            </select>
          </div>
        ) : (
          <input
            id={`${idPrefix}-ward`}
            type="text"
            required
            maxLength={ADDRESS_PART_MAX}
            placeholder="VD: Phường Bến Thành"
            value={value.ward ?? ""}
            onChange={(e) => onChange({ ...value, ward: e.target.value })}
            className={inputClassName}
          />
        )}
      </div>

      {/* 3. ĐƯỜNG / THÔN / ẤP */}
      <div className="sm:col-span-1">
        <label htmlFor={`${idPrefix}-street`} className="mb-1 block text-caption font-semibold text-text-muted">
          Đường / Thôn / Ấp <span className="text-danger">*</span>
        </label>
        <input
          id={`${idPrefix}-street`}
          type="text"
          required
          maxLength={ADDRESS_PART_MAX}
          placeholder="VD: Lê Lợi, Nguyễn Huệ..."
          value={value.street ?? ""}
          onChange={(e) => onChange({ ...value, street: e.target.value })}
          className={inputClassName}
        />
      </div>

      {/* 4. SỐ NHÀ / TÒA NHÀ / CĂN HỘ */}
      <div className="sm:col-span-1">
        <label htmlFor={`${idPrefix}-houseNumber`} className="mb-1 block text-caption font-semibold text-text-muted">
          Số nhà / Tòa nhà / Phòng <span className="text-danger">*</span>
        </label>
        <input
          id={`${idPrefix}-houseNumber`}
          type="text"
          required
          maxLength={ADDRESS_PART_MAX}
          placeholder="VD: 45, Tòa Bitexco Tầng 12..."
          value={value.houseNumber ?? ""}
          onChange={(e) => onChange({ ...value, houseNumber: e.target.value })}
          className={inputClassName}
        />
      </div>
    </fieldset>
  )
}
