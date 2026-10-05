"use client"

import { ADDRESS_FIELDS, ADDRESS_PART_MAX, type AddressParts } from "@/modules/greeting-card/domain/delivery-address"

const AUTOCOMPLETE: Partial<Record<keyof AddressParts, string>> = {
  houseNumber: "address-line1",
  street: "address-line2",
  ward: "address-level3",
  district: "address-level2",
  province: "address-level1",
}

/** Địa chỉ giao hoa 5 ô; Quận/Huyện không bắt buộc (cấp này đã bỏ từ 07/2025). */
export function AddressFields(props: {
  idPrefix: string
  value: AddressParts
  inputClassName: string
  onChange: (next: AddressParts) => void
}) {
  return (
    <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <legend className="mb-1 block text-body-sm font-bold text-foreground">
        Địa chỉ giao hoa <span className="text-danger">*</span>
      </legend>
      {ADDRESS_FIELDS.map((f) => {
        const id = `${props.idPrefix}-address-${f.key}`
        return (
          <div key={f.key} className={f.key === "province" ? "sm:col-span-2" : undefined}>
            <label htmlFor={id} className="mb-1 block text-caption font-semibold text-text-muted">
              {f.label} {f.required && <span className="text-danger">*</span>}
            </label>
            <input
              id={id}
              type="text"
              required={f.required}
              maxLength={ADDRESS_PART_MAX}
              placeholder={f.placeholder}
              autoComplete={AUTOCOMPLETE[f.key]}
              value={props.value[f.key] ?? ""}
              onChange={(e) => props.onChange({ ...props.value, [f.key]: e.target.value })}
              className={props.inputClassName}
            />
          </div>
        )
      })}
    </fieldset>
  )
}
