"use client"

import React, { useEffect } from "react"
import { X } from "lucide-react"
import { BrochureStepTimeoutSettings } from "./brochure-step-timeout-settings"
import { BrochureStepSlaSettings } from "./brochure-step-sla-settings"
import { BrochureLinkLifetimeSettings } from "./brochure-link-lifetime-settings"
import { BrochureVisibilitySettings } from "./brochure-visibility-settings"
import { BrochureDiscountSettings } from "./brochure-discount-settings"
import { BrochureDefaultOwnerSettings } from "./brochure-default-owner-settings"
import { BrochurePaymentSettings } from "./brochure-payment-settings"
import { BrochureBankSyncSettings } from "./brochure-bank-sync-settings"
import { BrochurePolicySettings } from "./brochure-policy-settings"
import { BrochureShippingSettings } from "./brochure-shipping-settings"
import { BrochureHolidaySettings } from "./brochure-holiday-settings"
import { BrochureNotifySettings } from "./brochure-notify-settings"

/** Ngăn Cài đặt của Điều hành — tách khỏi hộp việc để tab chỉ còn việc cần quyết. */
export function AdminSettingsDrawer({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="admin-settings-title">
      <button type="button" aria-label="Đóng cài đặt" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="relative flex h-full w-full max-w-3xl flex-col bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-4">
          <h2 id="admin-settings-title" className="text-title-sm font-extrabold text-foreground">Cài đặt Thẻ chào</h2>
          <button type="button" onClick={onClose} aria-label="Đóng cài đặt" className="rounded-full p-2 text-text-muted hover:bg-surface-muted">
            <X size={18} />
          </button>
        </div>
        <div className="flex flex-col gap-4 overflow-y-auto p-5">
          <BrochureStepTimeoutSettings />
          <BrochureLinkLifetimeSettings />
          <BrochureStepSlaSettings />
          <BrochureVisibilitySettings />
          <BrochureDiscountSettings />
          <BrochureDefaultOwnerSettings />
          <BrochurePaymentSettings />
          <BrochureBankSyncSettings />
          <BrochurePolicySettings />
          <BrochureShippingSettings />
          <BrochureHolidaySettings />
          <BrochureNotifySettings />
        </div>
      </div>
    </div>
  )
}
