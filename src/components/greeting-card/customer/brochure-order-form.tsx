"use client"

import React, { useState } from "react"
import { ArrowLeft, Send, Sparkles, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  ORDER_FIELD_MAX,
  MAX_DELIVERY_LEAD_DAYS,
  todayInVietnam,
  validateCustomerOrderInput,
} from "@/modules/greeting-card/domain/greeting-card-rules"
import type {
  ProductSnapshot,
  CustomerOrderSubmitInput,
} from "@/modules/greeting-card/domain/greeting-card-types"
import type { ShippingConfig } from "@/modules/greeting-card/domain/brochure-pricing"
import { BrochureOrderOptions } from "./brochure-order-options"
import { useBrochureQuote } from "./use-brochure-quote"

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

export function BrochureOrderForm({
  productSnapshot,
  variants,
  shipping,
  quoteUrl,
  quoteExtraBody = {},
  onBack,
  onSubmit,
}: BrochureOrderFormProps) {
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [recipientName, setRecipientName] = useState("")
  const [recipientPhone, setRecipientPhone] = useState("")
  const [deliveryDate, setDeliveryDate] = useState("")
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState("Buổi sáng (8h - 12h)")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [cardMessage, setCardMessage] = useState("")
  const [senderNote, setSenderNote] = useState("")

  const [loading, setLoading] = useState(false)
  const pricing = useBrochureQuote(quoteUrl, quoteExtraBody, customerPhone)
  const minDate = todayInVietnam()
  const maxDate = new Date(Date.parse(`${minDate}T00:00:00Z`) + MAX_DELIVERY_LEAD_DAYS * 86_400_000)
    .toISOString()
    .slice(0, 10)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)

    // Cùng bộ luật với server (SĐT, ngày giao theo giờ VN, độ dài) — báo lỗi ngay, đỡ một vòng mạng.
    const check = validateCustomerOrderInput({
      customerName, customerPhone, recipientName, recipientPhone,
      deliveryDate, deliveryTimeSlot, deliveryAddress, cardMessage, senderNote,
    })
    if (shipping.zones.length > 0 && !pricing.selection.shippingZoneId) {
      check.errors.shippingZoneId = "Vui lòng chọn khu vực giao hoa"
      check.valid = false
    }
    if (!check.valid) {
      setErrorMessage(Object.values(check.errors)[0] ?? "Thông tin đặt hàng chưa hợp lệ")
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        customerName,
        customerPhone,
        recipientName,
        recipientPhone,
        deliveryDate,
        deliveryTimeSlot,
        deliveryAddress,
        cardMessage,
        senderNote,
        quantity: pricing.selection.quantity,
        ...(pricing.selection.variantId ? { variantId: pricing.selection.variantId } : {}),
        ...(pricing.selection.shippingZoneId ? { shippingZoneId: pricing.selection.shippingZoneId } : {}),
        ...(pricing.selection.voucherCode ? { voucherCode: pricing.selection.voucherCode } : {}),
      })
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Đã có lỗi xảy ra khi đặt hoa")
    } finally {
      setLoading(false)
    }
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
        {productSnapshot.imageUrl ? (
          <img
            src={productSnapshot.imageUrl}
            alt={productSnapshot.name}
            className="w-16 h-16 rounded-lg object-cover shrink-0 border border-border"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles size={24} className="text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-caption text-text-muted">Mẫu đã chọn:</div>
          <div className="text-body font-extrabold text-foreground truncate">
            {productSnapshot.name}
          </div>
          <div className="text-body-sm font-extrabold text-primary">
            {productSnapshot.price.toLocaleString("vi-VN")} đ
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-5 p-3 rounded-xl bg-danger-bg border border-danger/30 text-danger text-body-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            <label className="block text-caption font-bold text-foreground mb-1">
              Họ tên của bạn <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Nguyễn Văn A"
              value={customerName}
              maxLength={ORDER_FIELD_MAX.name}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-caption font-bold text-foreground mb-1">
              Số điện thoại của bạn <span className="text-danger">*</span>
            </label>
            <input
              type="tel"
              required
              placeholder="VD: 0901234567"
              value={customerPhone}
              maxLength={15}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Người nhận */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-caption font-bold text-foreground mb-1">
              Họ tên người nhận hoa <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Trần Thị B"
              value={recipientName}
              maxLength={ORDER_FIELD_MAX.name}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-caption font-bold text-foreground mb-1">
              Số điện thoại người nhận <span className="text-danger">*</span>
            </label>
            <input
              type="tel"
              required
              placeholder="VD: 0912345678"
              value={recipientPhone}
              maxLength={15}
              onChange={(e) => setRecipientPhone(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Ngày & Giờ giao */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-caption font-bold text-foreground mb-1">
              Ngày giao hoa <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              required
              min={minDate}
              max={maxDate}
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-caption font-bold text-foreground mb-1">
              Khung giờ mong muốn
            </label>
            <select
              value={deliveryTimeSlot}
              onChange={(e) => setDeliveryTimeSlot(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="Buổi sáng (8h - 12h)">Buổi sáng (8h - 12h)</option>
              <option value="Buổi chiều (13h - 17h)">Buổi chiều (13h - 17h)</option>
              <option value="Buổi tối (18h - 21h)">Buổi tối (18h - 21h)</option>
              <option value="Giờ cụ thể (liên hệ)">Giờ cụ thể (liên hệ)</option>
            </select>
          </div>
        </div>

        {/* Địa chỉ giao */}
        <div>
          <label className="block text-caption font-bold text-foreground mb-1">
            Địa chỉ giao hoa chi tiết <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành"
            value={deliveryAddress}
            maxLength={ORDER_FIELD_MAX.address}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Lời nhắn thiệp */}
        <div>
          <label className="block text-caption font-bold text-foreground mb-1">
            Nội dung thiệp mừng / băng rôn
          </label>
          <textarea
            rows={2}
            placeholder="VD: Chúc mừng ngày 20/10 người phụ nữ tuyệt vời của anh..."
            value={cardMessage}
            maxLength={ORDER_FIELD_MAX.cardMessage}
            onChange={(e) => setCardMessage(e.target.value)}
            className="w-full p-3 rounded-lg border border-border bg-background text-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        {/* Ghi chú thêm */}
        <div>
          <label className="block text-caption font-bold text-foreground mb-1">
            Ghi chú thêm cho thợ cắm hoa
          </label>
          <input
            type="text"
            placeholder="VD: Giao hoa nhẹ tay, gọi trước khi đến 15 phút"
            value={senderNote}
            maxLength={ORDER_FIELD_MAX.senderNote}
            onChange={(e) => setSenderNote(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading}
          className="mt-2 w-full h-12 bg-primary hover:bg-primary-dark text-white font-extrabold text-body flex items-center justify-center gap-2 rounded-xl shadow-md"
        >
          <Send size={18} />
          <span>{loading ? "Đang gửi đơn hàng..." : "HOÀN TẤT ĐẶT HOA & THANH TOÁN"}</span>
        </Button>
      </form>
    </div>
  )
}
