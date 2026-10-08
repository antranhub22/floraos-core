"use client"

import type { AddressParts } from "@/modules/greeting-card/domain/delivery-address"
import { useSavedState } from "./use-saved-state"

const EMPTY = {
  customerName: "",
  customerPhone: "",
  recipientName: "",
  recipientPhone: "",
  deliveryDate: "",
  deliveryTimeSlot: "",
  addressParts: { houseNumber: "", street: "", ward: "", province: "" } as AddressParts,
  cardMessage: "",
  senderNote: "",
  deliveryNote: "",
  mapUrl: "",
}

type Draft = typeof EMPTY

/**
 * Bản nháp form đặt hoa nhớ trên máy khách theo từng link: đóng tab rồi mở lại
 * vẫn còn thông tin đang điền. Xoá sau khi đặt thành công.
 */
export function useOrderDraft() {
  const [saved, setDraft, clearDraft] = useSavedState<Draft>("order-draft", EMPTY)
  // Nháp lưu từ bản cũ thiếu các ô mới → lấp bằng giá trị rỗng
  const draft = { ...EMPTY, ...saved }
  const field = <K extends keyof Draft>(k: K) => (v: Draft[K]) => setDraft({ ...draft, [k]: v })
  return {
    ...draft,
    setCustomerName: field("customerName"),
    setCustomerPhone: field("customerPhone"),
    setRecipientName: field("recipientName"),
    setRecipientPhone: field("recipientPhone"),
    setDeliveryDate: field("deliveryDate"),
    setDeliveryTimeSlot: field("deliveryTimeSlot"),
    setAddressParts: field("addressParts"),
    setNotes: (patch: Partial<Pick<Draft, "cardMessage" | "senderNote" | "deliveryNote" | "mapUrl">>) => setDraft({ ...draft, ...patch }),
    clearDraft,
  }
}
