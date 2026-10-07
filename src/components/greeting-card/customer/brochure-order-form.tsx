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
import { FlowerImage } from "@/components/greeting-card/flower-image"
import { OrderReview } from "./order-review"
import { useOrderDraft } from "./use-order-draft"
import { useSavedState } from "./use-saved-state"
import { AddressFields } from "./address-fields"
import { HoneypotField } from "./honeypot-field"
import { composeAddress, validateAddressParts } from "@/modules/greeting-card/domain/delivery-address"
import { DELIVERY_SLOTS, availableSlots, deliveryScheduleError, earliestDeliveryDate } from "@/modules/greeting-card/domain/delivery-schedule"

interface BrochureOrderFormProps {
  productSnapshot: ProductSnapshot
  /** Size/biến thể bán online của mẫu đã chọn. */
  variants: Array<{ id: string; name: string; priceVnd: number }>
  shipping: ShippingConfig
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
  quoteUrl,
  quoteExtraBody = {},
  onBack,
  onSubmit,
}: BrochureOrderFormProps) {
  const uid = useId()
  const {
    customerName, customerPhone, recipientName, recipientPhone, deliveryDate, deliveryTimeSlot, addressParts, cardMessage, senderNote,
    setCustomerName, setCustomerPhone, setRecipientName, setRecipientPhone, setDeliveryDate, setDeliveryTimeSlot, setAddressParts,
    setCardMessage, setSenderNote, clearDraft,
  } = useOrderDraft()
  const deliveryAddress = composeAddress(addressParts)

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
      deliveryDate, deliveryTimeSlot, deliveryAddress, cardMessage, senderNote,
    })
    const scheduleError = deliveryDate ? deliveryScheduleError(deliveryDate, deliveryTimeSlot, shipping) : null
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
      website,
      quantity: pricing.selection.quantity,
      ...(pricing.selection.variantId ? { variantId: pricing.selection.variantId } : {}),
      ...(pricing.selection.shippingZoneId ? { shippingZoneId: pricing.selection.shippingZoneId } : {}),
      ...(pricing.selection.voucherCode ? { voucherCode: pricing.selection.voucherCode } : {}),
    })
  }

  async function handleConfirm() {
    if (!review) return
    setErrorMessage(null)
    setLoading(true)
    try {
      await onSubmit(review)
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
          submitting={loading}
          error={errorMessage}
          onEdit={() => setReview(null)}
          onConfirm={() => void handleConfirm()}
        />
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg mx-auto bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-sm">
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

      {/* Product Snapshot Header */}
      <div className="flex items-center gap-3.5 p-3 rounded-xl bg-surface-muted border border-border mb-5">
        <FlowerImage src={productSnapshot.imageUrl} driveLink={productSnapshot.driveLink} alt={productSnapshot.name} sizes="64px" fallback="icon" className="w-16 h-16 rounded-lg shrink-0 border border-border" />
        <div className="flex-1 min-w-0">
          <div className="text-caption text-text-muted">Mẫu đã chọn:</div>
          <div className="text-body font-extrabold text-foreground truncate">
            {productSnapshot.name}
          </div>
          <div className="text-body-sm font-extrabold text-primary">
            {productSnapshot.price > 0 ? `${productSnapshot.price.toLocaleString("vi-VN")} đ` : "Liên hệ"}
          </div>
        </div>
      </div>

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
            <select
              value={deliveryTimeSlot}
              id={`${uid}-deliveryTimeSlot`} onChange={(e) => setDeliveryTimeSlot(e.target.value)}
              className={INPUT}
            >
              {(deliveryDate ? availableSlots(deliveryDate, shipping) : DELIVERY_SLOTS.map((x) => x.label)).map((slot) => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>
        </div>

        <AddressFields idPrefix={uid} value={addressParts} inputClassName={INPUT} onChange={setAddressParts} />

        {/* Lời nhắn thiệp */}
        <div>
          <label htmlFor={`${uid}-cardMessage`} className="block text-body-sm font-bold text-foreground mb-1">
            Nội dung thiệp mừng / băng rôn
          </label>
          <textarea
            rows={2}
            placeholder="VD: Chúc mừng ngày 20/10 người phụ nữ tuyệt vời của anh..."
            value={cardMessage}
            maxLength={ORDER_FIELD_MAX.cardMessage}
            id={`${uid}-cardMessage`} onChange={(e) => setCardMessage(e.target.value)}
            className={`${INPUT} h-auto p-3 resize-none`}
          />
        </div>

        {/* Ghi chú thêm */}
        <div>
          <label htmlFor={`${uid}-senderNote`} className="block text-body-sm font-bold text-foreground mb-1">
            Ghi chú thêm cho thợ cắm hoa
          </label>
          <input
            type="text"
            placeholder="VD: Giao hoa nhẹ tay, gọi trước khi đến 15 phút"
            value={senderNote}
            maxLength={ORDER_FIELD_MAX.senderNote}
            id={`${uid}-senderNote`} onChange={(e) => setSenderNote(e.target.value)}
            className={INPUT}
          />
        </div>

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
