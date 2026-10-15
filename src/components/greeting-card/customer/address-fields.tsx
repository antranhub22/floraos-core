import React, { useState } from "react"
import { ADDRESS_PART_MAX, type AddressParts } from "@/modules/greeting-card/domain/delivery-address"
import {
  ADDRESS_SYSTEM_LABEL,
  districtNames,
  guessAddressSystem,
  provinceNames,
  wardNames,
  type AddressSystem,
} from "@/modules/greeting-card/domain/vn-address-units"
import { PickOrTypeField } from "./pick-or-type-field"
import { useVnAddressUnits } from "./use-vn-address-units"

/**
 * Địa chỉ giao hoa: khách chọn hệ địa chỉ cũ (Tỉnh → Quận/Huyện → Phường/Xã, mặc định)
 * hoặc mới từ 01/07/2025 (Tỉnh → Phường/Xã), rồi bấm chọn từng cấp; không có trong danh sách thì tự nhập.
 */
export function AddressFields(props: {
  idPrefix: string
  value: AddressParts
  inputClassName: string
  onChange: (next: AddressParts) => void
}) {
  const { idPrefix, value, inputClassName, onChange } = props
  const [system, setSystem] = useState<AddressSystem>(() => guessAddressSystem(value))
  const units = useVnAddressUnits(system)
  const data = units.data
  const provinces = data ? provinceNames(data) : []
  const districts = data ? districtNames(data, value.province) : []
  const wards = data ? wardNames(data, value.province, value.district) : []
  const loadingHint = units.loading ? "Đang tải danh sách..." : null

  function switchSystem(next: AddressSystem) {
    if (next === system) return
    setSystem(next)
    // Tên tỉnh/phường hai hệ khác nhau → chọn lại từ đầu, giữ số nhà và đường
    onChange({ houseNumber: value.houseNumber, street: value.street, ward: "", province: "" })
  }

  return (
    <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <legend className="mb-1 block text-body-sm font-bold text-foreground">
        Địa chỉ nhận hoa <span className="text-danger">*</span>
      </legend>

      <div role="radiogroup" aria-label="Kiểu địa chỉ" className="flex flex-wrap gap-2 sm:col-span-2">
        {(["old", "new"] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={system === s}
            onClick={() => switchSystem(s)}
            className={`min-h-11 flex-1 rounded-xl border px-3 text-body-sm font-semibold transition ${
              system === s ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface text-text-muted hover:border-primary/40"
            }`}
          >
            {ADDRESS_SYSTEM_LABEL[s]}
          </button>
        ))}
      </div>
      {units.error && <p role="alert" className="text-caption text-danger sm:col-span-2">{units.error}</p>}

      <PickOrTypeField
        id={`${idPrefix}-province`}
        label="Tỉnh / Thành phố"
        required
        value={value.province}
        options={provinces}
        placeholder="VD: Thành phố Hồ Chí Minh"
        pickPlaceholder={loadingHint ?? "— Chọn Tỉnh / Thành phố —"}
        inputClassName={inputClassName}
        onChange={(province) => onChange({ ...value, province, district: undefined, ward: "" })}
      />

      {system === "old" && (
        <PickOrTypeField
          id={`${idPrefix}-district`}
          label="Quận / Huyện"
          required
          value={value.district ?? ""}
          options={districts}
          placeholder="VD: Quận 1"
          pickPlaceholder={value.province ? "— Chọn Quận / Huyện —" : "Chọn Tỉnh / Thành phố trước"}
          inputClassName={inputClassName}
          onChange={(district) => onChange({ ...value, district, ward: "" })}
        />
      )}

      <PickOrTypeField
        id={`${idPrefix}-ward`}
        label="Phường / Xã"
        required
        value={value.ward}
        options={wards}
        placeholder="VD: Phường Bến Thành"
        pickPlaceholder="— Chọn Phường / Xã —"
        inputClassName={inputClassName}
        onChange={(ward) => onChange({ ...value, ward })}
      />

      <div>
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

      <div className={system === "old" ? "sm:col-span-2" : ""}>
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
