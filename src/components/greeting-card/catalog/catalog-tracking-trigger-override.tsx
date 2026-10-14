"use client"

import React from "react"
import { ShieldCheck } from "lucide-react"
import type { TrackingTriggerPolicy } from "@/modules/greeting-card/domain/brochure-payment-policy"

export interface CatalogTrackingTriggerOverrideProps {
  storeTriggerPolicy?: TrackingTriggerPolicy | undefined
  overrideValue: TrackingTriggerPolicy | null
  onChange: (val: TrackingTriggerPolicy | null) => void
}

export function CatalogTrackingTriggerOverride({
  storeTriggerPolicy = "PAYMENT_OR_COORDINATOR",
  overrideValue,
  onChange,
}: CatalogTrackingTriggerOverrideProps) {
  const storeLabel =
    storeTriggerPolicy === "PAYMENT_ONLY"
      ? "Chỉ Điều hành xác nhận đã thanh toán"
      : "Cho phép thêm Điều phối xác nhận Nhận đơn"

  return (
    <div className="space-y-2 pt-3 border-t border-border">
      <h4 className="text-body-sm font-extrabold text-foreground flex items-center gap-1.5">
        <ShieldCheck size={15} className="text-primary" />
        <span>Cơ chế kích hoạt bước tiếp theo (Theo dõi tiến độ)</span>
      </h4>
      <div className="flex flex-col gap-2">
        <label className="flex items-start gap-2 cursor-pointer text-body-sm">
          <input
            type="radio"
            name="tracking-trigger-policy-override"
            className="mt-0.5"
            checked={overrideValue === null}
            onChange={() => onChange(null)}
          />
          <span className="font-semibold text-foreground">
            Theo chính sách tiệm ({storeLabel})
          </span>
        </label>
        <label className="flex items-start gap-2 cursor-pointer text-body-sm">
          <input
            type="radio"
            name="tracking-trigger-policy-override"
            className="mt-0.5"
            checked={overrideValue === "PAYMENT_OR_COORDINATOR"}
            onChange={() => onChange("PAYMENT_OR_COORDINATOR")}
          />
          <div>
            <span className="font-semibold text-foreground">
              Cho phép thêm Điều phối xác nhận Nhận đơn
            </span>
            <span className="block text-caption text-text-muted">
              Điều hành xác nhận tiền HOẶC Điều phối bấm nhận đơn đều mở màn hình theo dõi tiến độ cho khách.
            </span>
          </div>
        </label>
        <label className="flex items-start gap-2 cursor-pointer text-body-sm">
          <input
            type="radio"
            name="tracking-trigger-policy-override"
            className="mt-0.5"
            checked={overrideValue === "PAYMENT_ONLY"}
            onChange={() => onChange("PAYMENT_ONLY")}
          />
          <div>
            <span className="font-semibold text-foreground">
              Chỉ Điều hành xác nhận đã thanh toán
            </span>
            <span className="block text-caption text-text-muted">
              Bắt buộc Điều hành phải xác nhận đã nhận tiền (đủ hoặc cọc) thì khách mới được mở theo dõi tiến độ.
            </span>
          </div>
        </label>
      </div>
      <p className="text-caption text-text-muted">
        Áp dụng cho các đơn hàng xuất phát từ bộ sưu tập này.
      </p>
    </div>
  )
}
