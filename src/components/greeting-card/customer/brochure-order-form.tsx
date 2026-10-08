"use client"

import React, { useId, useState } from "react"
import { ArrowLeft, Send, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  ORDER_FIELD_MAX,
  MAX_DELIVERY_LEAD_DAYS,
  validateCustomerOrderInput,
} from "@/modules/greeting-card/domain/greeting-card-rules"
import type {
  ProductSnapshot,
  CustomerOrderSubmitInput,
} from "@/modules/greeting-card/domain/greeting-card-types"
import type { ShippingConfig } from "@/modules/greeting-card/domain/brochure-pricing"
import { BrochureOrderOptions } from "./brochure-order-options"
import { useBrochureQuote } from "./use-brochure-quote"
import { OrderReview } from "./order-review"
import { useOrderDraft } from "./use-order-draft"
import { useSavedState } from "./use-saved-state"
import { AddressFields } from "./address-fields"
import { HoneypotField } from "./honeypot-field"
import { composeAddress, validateAddressParts } from "@/modules/greeting-card/domain/delivery-address"
import { deliveryScheduleError, earliestDeliveryDate } from "@/modules/greeting-card/domain/delivery-schedule"
import { DeliveryTimePicker } from "./delivery-time-picker"
import { PromotionPicker } from "./promotion-picker"
import { SelectedProductHeader } from "./selected-product-header"
import { OrderNotesFields } from "./order-notes-fields"

import type { PublicAppliedPolicies } from "@/modules/greeting-card/domain/store-policy"

interface BrochureOrderFormProps {
  productSnapshot: ProductSnapshot
  /** Size/biến thể bán online của mẫu đã chọn. */
  variants: Array<{ id: string; name: string; priceVnd: number }>
  shipping: ShippingConfig
  appliedPolicies?: PublicAppliedPolicies | null | undefined
  /** Endpoint báo giá + phần thân cố định (vd. `productId` ở link công khai). */
  quoteUrl: string
  quoteExtraBody?: Record<string, string> | undefined
  onBack: () => void
  onSubmit: (input: CustomerOrderSubmitInput) => Promise<void>
}

// Chữ trong ô ≥ 16px (`text-title`) để iPhone không tự phóng to khi khách chạm vào ô
const INPUT =
  "w-full h-12 px-3 rounded-lg border border-border bg-background text-title font-normal text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"

export function BrochureOrderForm({
  productSnapshot,
  variants,
  shipping,
  appliedPolicies,
  quoteUrl,
  quoteExtraBody = {},
  onBack,
  onSubmit,
}: BrochureOrderFormProps) {
  const uid = useId()
  const {
    customerName, customerPhone, recipientName, recipientPhone, deliveryDate, deliveryTimeSlot, addressParts,
    cardMessage, senderNote, deliveryNote, mapUrl,
    setCustomerName, setCustomerPhone, setRecipientName, setRecipientPhone, setDeliveryDate, setDeliveryTimeSlot, setAddressParts,
    setNotes, clearDraft,
  } = useOrderDraft()
  const deliveryAddress = composeAddress(addressParts)

  const [selectedPromotionId, setSelectedPromotionId] = useState<string>(appliedPolicies?.promotions[0]?.id ?? "")
  const [loading, setLoading] = useState(false)
  const pricing = useBrochureQuote(quoteUrl, quoteExtraBody, customerPhone, { id: productSnapshot.id, variantIds: variants.map((v) => v.id) })
  const minDate = earliestDeliveryDate(shipping)
  const maxDate = new Date(Date.parse(`${minDate}T00:00:00Z`) + MAX_DELIVERY_LEAD_DAYS * 86_400_000)
    .toISOString()
    .slice(0, 10)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  // Bước "Xem lại đơn" nhớ trên máy: rời trang lúc đang xem lại thì quay về đúng bước này
  const [review, setReview, clearReview] = useSavedState<CustomerOrderSubmitInput | null>(`order-review:${productSnapshot.id}`, null)
  const [website, setWebsite] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)

    // Cùng bộ luật với server (SĐT, ngày giao theo giờ VN, độ dài) — báo lỗi ngay, đỡ một vòng mạng.
    const check = validateCustomerOrderInput({
      customerName, customerPhone, recipientName, recipientPhone,
      deliveryDate, deliveryTimeSlot, deliveryAddress, cardMessage, senderNote, deliveryNote, mapUrl,
    })
    const scheduleError = !deliveryDate ? null
      : deliveryTimeSlot.trim() ? deliveryScheduleError(deliveryDate, deliveryTimeSlot, shipping) : "Vui lòng chọn khung giờ giao hoa"
    if (scheduleError) {
      check.errors.deliveryDate = scheduleError
      check.valid = false
    }
    const addressErrors = validateAddressParts(addressParts)
    if (Object.keys(addressErrors).length > 0) {
      delete check.errors.deliveryAddress // báo đúng ô còn thiếu thay vì "địa chỉ chung"
      Object.assign(check.errors, addressErrors)
      check.valid = false
    }
    if (shipping.zones.length > 0 && !pricing.selection.shippingZoneId) {
      check.errors.shippingZoneId = "Vui lòng chọn khu vực giao hoa"
      check.valid = false
    }
    if (!check.valid) {
      setErrorMessage(Object.values(check.errors)[0] ?? "Thông tin đặt hàng chưa hợp lệ")
      return
    }

    // Sang bước "Xem lại đơn"; chỉ gửi khi khách bấm xác nhận
    window.scrollTo({ top: 0 })
    setReview({
      customerName,
      customerPhone,
      recipientName,
      recipientPhone,
      deliveryDate,
      deliveryTimeSlot,
      deliveryAddress,
      addressParts,
      cardMessage,
      senderNote,
      deliveryNote,
      mapUrl,
      website,
      quantity: pricing.selection.quantity,
      selectedPromotionId: selectedPromotionId || undefined,
      ...(pricing.selection.variantId ? { variantId: pricing.selection.variantId } : {}),
      ...(pricing.selection.shippingZoneId ? { shippingZoneId: pricing.selection.shippingZoneId } : {}),
      ...(pricing.selection.voucherCode ? { voucherCode: pricing.selection.voucherCode } : {}),
    })
  }

  async function handleConfirm(confirmedTerms: boolean) {
    if (!review) return
    setErrorMessage(null)
    setLoading(true)
    try {
      await onSubmit({ ...review, confirmedTerms })
      clearDraft()
      clearReview()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Đã có lỗi xảy ra khi đặt hoa")
    } finally {
      setLoading(false)
    }
  }

  if (review) {
    return (
      <div className="w-full max-w-lg mx-auto bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-sm">
        <OrderReview
          product={productSnapshot}
          variantName={variants.find((v) => v.id === review.variantId)?.name ?? null}
          input={review}
          quote={pricing.quote}
          appliedPolicies={appliedPolicies}
          submitting={loading}
          error={errorMessage}
          onEdit={() => setReview(null)}
          onConfirm={(agreed) => void handleConfirm(agreed)}
        />
      </div>
    )
  }

  return (
    <div className="w-full max-w-xl lg:max-w-2xl mx-auto bg-surface rounded-2xl border border-border p-5 sm:p-7 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1.5 text-text-muted hover:text-foreground text-caption"
        >
          <ArrowLeft size={16} />
          <span>Đổi mẫu hoa</span>
        </Button>
        <span className="text-caption font-bold uppercase tracking-wider text-primary">
          Điền đơn đặt hoa
        </span>
      </div>

      <SelectedProductHeader product={productSnapshot} />

      {errorMessage && (
        <div
          role="alert"
          // Form dài trên điện thoại: đưa thông báo lỗi vào tầm nhìn ngay khi nó xuất hiện
          ref={(el) => el?.scrollIntoView({ behavior: "smooth", block: "center" })}
          className="mb-5 p-3 rounded-xl bg-danger-bg border border-danger/30 text-danger text-body-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <HoneypotField value={website} onChange={setWebsite} />
        <BrochureOrderOptions
          variants={variants}
          basePrice={productSnapshot.price}
          shipping={shipping}
          selection={pricing.selection}
          onChange={pricing.update}
          quote={pricing.quote}
          errors={pricing.errors}
          loading={pricing.loading}
        />

        {appliedPolicies && (
          <PromotionPicker policies={appliedPolicies} value={selectedPromotionId} onChange={setSelectedPromotionId} />
        )}

        {/* Người đặt */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${uid}-customerName`} className="block text-body-sm font-bold text-foreground mb-1">
              Họ tên của bạn <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Nguyễn Văn A"
              value={customerName}
              maxLength={ORDER_FIELD_MAX.name}
              id={`${uid}-customerName`} autoComplete="name" onChange={(e) => setCustomerName(e.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <label htmlFor={`${uid}-customerPhone`} className="block text-body-sm font-bold text-foreground mb-1">
              Số điện thoại của bạn <span className="text-danger">*</span>
            </label>
            <input
              type="tel"
              required
              placeholder="VD: 0901234567"
              value={customerPhone}
              maxLength={15}
              id={`${uid}-customerPhone`} autoComplete="tel" inputMode="tel" onChange={(e) => setCustomerPhone(e.target.value)}
              className={INPUT}
            />
          </div>
        </div>

        {/* Người nhận */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${uid}-recipientName`} className="block text-body-sm font-bold text-foreground mb-1">
              Họ tên người nhận hoa <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Trần Thị B"
              value={recipientName}
              maxLength={ORDER_FIELD_MAX.name}
              id={`${uid}-recipientName`} autoComplete="off" onChange={(e) => setRecipientName(e.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <label htmlFor={`${uid}-recipientPhone`} className="block text-body-sm font-bold text-foreground mb-1">
              Số điện thoại người nhận <span className="text-danger">*</span>
            </label>
            <input
              type="tel"
              required
              placeholder="VD: 0912345678"
              value={recipientPhone}
              maxLength={15}
              id={`${uid}-recipientPhone`} autoComplete="off" inputMode="tel" onChange={(e) => setRecipientPhone(e.target.value)}
              className={INPUT}
            />
          </div>
        </div>

        {/* Ngày & Giờ giao */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${uid}-deliveryDate`} className="block text-body-sm font-bold text-foreground mb-1">
              Ngày giao hoa <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              required
              min={minDate}
              max={maxDate}
              value={deliveryDate}
              id={`${uid}-deliveryDate`} onChange={(e) => setDeliveryDate(e.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <label htmlFor={`${uid}-deliveryTimeSlot`} className="block text-body-sm font-bold text-foreground mb-1">
              Khung giờ mong muốn
            </label>
            <DeliveryTimePicker
              id={`${uid}-deliveryTimeSlot`}
              date={deliveryDate}
              value={deliveryTimeSlot}
              shipping={shipping}
              inputClassName={INPUT}
              onChange={setDeliveryTimeSlot}
            />
          </div>
        </div>

        <AddressFields idPrefix={uid} value={addressParts} inputClassName={INPUT} onChange={setAddressParts} />

        <OrderNotesFields
          idPrefix={uid}
          value={{ cardMessage, senderNote, deliveryNote, mapUrl }}
          inputClassName={INPUT}
          onChange={setNotes}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading}
          className="mt-2 w-full h-12 bg-primary hover:bg-primary-dark text-white font-extrabold text-body flex items-center justify-center gap-2 rounded-xl shadow-md"
        >
          <Send size={18} aria-hidden="true" />
          <span>{loading ? "Đang gửi đơn hàng..." : "Xem lại đơn"}</span>
        </Button>
      </form>
    </div>
  )
}
