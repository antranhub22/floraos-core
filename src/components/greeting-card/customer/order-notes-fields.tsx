"use client"

import React from "react"
import { ORDER_FIELD_MAX } from "@/modules/greeting-card/domain/greeting-card-rules"
import { DELIVERY_NOTE_MAX, MAP_URL_MAX } from "@/modules/greeting-card/domain/delivery-note"

export interface OrderNotesValue {
  cardMessage: string
  senderNote: string
  deliveryNote: string
  mapUrl: string
}

const LABEL = "block text-body-sm font-bold text-foreground mb-1"

/**
 * Ba loại ghi chú tách riêng để không lẫn: lời nhắn in lên thiệp (người nhận đọc), ghi chú cho
 * cửa hàng / thợ cắm hoa, ghi chú cho người giao hoa (+ link Google Maps nếu khách có).
 */
export function OrderNotesFields({
  idPrefix,
  value,
  inputClassName,
  onChange,
}: {
  idPrefix: string
  value: OrderNotesValue
  inputClassName: string
  onChange: (patch: Partial<OrderNotesValue>) => void
}) {
  const id = (k: keyof OrderNotesValue) => `${idPrefix}-${k}`
  const cardLength = value.cardMessage.length
  return (
    <>
      <div>
        <label htmlFor={id("cardMessage")} className={LABEL}>
          Nội dung thiệp mừng / băng rôn
        </label>
        <textarea
          rows={2}
          placeholder="VD: Chúc mừng ngày 20/10 người phụ nữ tuyệt vời của anh..."
          value={value.cardMessage}
          maxLength={ORDER_FIELD_MAX.cardMessage}
          id={id("cardMessage")}
          aria-describedby={`${id("cardMessage")}-count`}
          onChange={(e) => onChange({ cardMessage: e.target.value })}
          className={`${inputClassName} h-auto p-3 resize-none`}
        />
        <p
          id={`${id("cardMessage")}-count`}
          aria-live="polite"
          className={`mt-1 text-right text-caption ${cardLength >= ORDER_FIELD_MAX.cardMessage ? "text-warning font-bold" : "text-text-muted"}`}
        >
          {cardLength}/{ORDER_FIELD_MAX.cardMessage} ký tự
        </p>
      </div>

      <div>
        <label htmlFor={id("senderNote")} className={LABEL}>
          Ghi chú cho cửa hàng / thợ cắm hoa
        </label>
        <input
          type="text"
          placeholder="VD: Gói giấy tông hồng, không dùng hoa ly"
          value={value.senderNote}
          maxLength={ORDER_FIELD_MAX.senderNote}
          id={id("senderNote")}
          onChange={(e) => onChange({ senderNote: e.target.value })}
          className={inputClassName}
        />
      </div>

      <div>
        <label htmlFor={id("deliveryNote")} className={LABEL}>
          Ghi chú cho người giao hoa
        </label>
        <input
          type="text"
          placeholder="VD: Gọi trước 15 phút, người nhận vắng thì gửi bảo vệ"
          value={value.deliveryNote}
          maxLength={DELIVERY_NOTE_MAX}
          id={id("deliveryNote")}
          onChange={(e) => onChange({ deliveryNote: e.target.value })}
          className={inputClassName}
        />
      </div>

      <div>
        <label htmlFor={id("mapUrl")} className={LABEL}>
          Link vị trí trên Google Maps (nếu có)
        </label>
        <input
          type="url"
          inputMode="url"
          placeholder="Mở Google Maps → Chia sẻ → Sao chép đường liên kết"
          value={value.mapUrl}
          maxLength={MAP_URL_MAX}
          id={id("mapUrl")}
          onChange={(e) => onChange({ mapUrl: e.target.value })}
          className={inputClassName}
        />
        <p className="mt-1 text-caption text-text-muted">Giúp người giao tìm đúng chỗ nhanh hơn, nhất là địa chỉ trong hẻm hoặc khu mới.</p>
      </div>
    </>
  )
}
