"use client"

import React, { useState, useEffect } from "react"
import { Plus, Trash2, Loader2, Sparkles, Flower2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { errorText } from "@/lib/error-text"
import type { ProductMasterIndex } from "@/modules/products/domain/product-master-index"

export interface CreateOrderInitialData {
  recipientName?: string
  phone?: string
  street?: string
  deliveryDate?: string
  timeSlot?: string
  cardMessage?: string
  internalNote?: string
  items?: ItemRow[]
}

interface CreateOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: CreateOrderInitialData | null
}

interface FlowerBomItemLite {
  flowerName: string
  quantity: number
  unit: string
  color: string
}

interface ItemRow {
  description: string
  quantity: number
  unitPriceVnd: number
  sampleImageUrl?: string | undefined
  bomSummary?: string | undefined
  /** BOM có cấu trúc thật lấy từ Master Index — để phiếu cắm hoa (florist ticket) đọc được
   * đúng từng loại hoa/số lượng/màu thay vì phải bịa lại từ mô tả chữ tự do. */
  bomFlowers?: FlowerBomItemLite[] | undefined
  wrapStyle?: string | undefined
  ribbon?: string | undefined
}

export function CreateOrderModal({ isOpen, onClose, onSuccess, initialData }: CreateOrderModalProps) {
  const [loading, setLoading] = useState(false)
  const [masterProducts, setMasterProducts] = useState<ProductMasterIndex[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [recipientName, setRecipientName] = useState("")
  const [phone, setPhone] = useState("")
  const [street, setStreet] = useState("")
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10))
  const [timeSlot, setTimeSlot] = useState("08:00 - 10:00")
  const [cardMessage, setCardMessage] = useState("")
  const [internalNote, setInternalNote] = useState("")
  const [items, setItems] = useState<ItemRow[]>([
    { description: "Bó hoa hồng đỏ 20 cành (Thiết kế tiêu chuẩn)", quantity: 1, unitPriceVnd: 650000 },
  ])
  const [error, setError] = useState<string | null>(null)

  // Khởi tạo từ initialData khi modal mở hoặc dữ liệu thay đổi
  useEffect(() => {
    if (!isOpen) return
    if (initialData) {
      if (initialData.recipientName !== undefined) setRecipientName(initialData.recipientName)
      if (initialData.phone !== undefined) setPhone(initialData.phone)
      if (initialData.street !== undefined) setStreet(initialData.street)
      if (initialData.deliveryDate !== undefined) setDeliveryDate(initialData.deliveryDate)
      if (initialData.timeSlot !== undefined) setTimeSlot(initialData.timeSlot)
      if (initialData.cardMessage !== undefined) setCardMessage(initialData.cardMessage)
      if (initialData.internalNote !== undefined) setInternalNote(initialData.internalNote)
      if (initialData.items && initialData.items.length > 0) setItems(initialData.items)
    }
  }, [isOpen, initialData])

  // Tải danh sách Master Index từ M01/Catalog
  useEffect(() => {
    if (!isOpen) return
    fetch("/api/v1/products/master-index?limit=30")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((res: { items?: ProductMasterIndex[] }) => {
        if (res.items) setMasterProducts(res.items)
      })
      .catch(() => { /* lỗi im lặng — API chưa sẵn */ })
  }, [isOpen])

  function handleSelectMasterProduct(productId: string) {
    setSelectedProductId(productId)
    const product = masterProducts.find((p) => p.id === productId)
    if (!product) return

    const flowerSummary = product.bom.flowers
      .map((f) => `${f.flowerName} (${f.quantity} ${f.unit})`)
      .join(", ")

    // Giá 0 nghĩa là Master Index chưa có giá bán lẻ thật — không bịa mặc định,
    // bắt buộc sales tự nhập (form chặn submit khi đơn giá <= 0).
    setItems([{
      description: `${product.name} [${product.code}]`,
      quantity: 1,
      unitPriceVnd: product.pricing.quotePriceVnd ?? 0,
      sampleImageUrl: product.masterImageUrl,
      bomSummary: flowerSummary,
      bomFlowers: product.bom.flowers,
      wrapStyle: product.bom.wrapStyle,
      ribbon: product.bom.ribbon,
    }])
    setInternalNote(
      `Kiểu gói: ${product.bom.wrapStyle}. Nơ: ${product.bom.ribbon}. Công thức: ${flowerSummary}`
    )
  }

  function addItem() {
    setItems((prev) => [...prev, { description: "", quantity: 1, unitPriceVnd: 0 }])
  }

  function removeItem(index: number) {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof ItemRow, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  const totalVnd = items.reduce((sum, it) => sum + it.quantity * it.unitPriceVnd, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!recipientName.trim() || !phone.trim() || !street.trim()) {
      setError("Vui lòng điền đầy đủ tên, số điện thoại và địa chỉ nhận hoa.")
      return
    }
    if (items.some((it) => !it.description.trim() || it.unitPriceVnd <= 0)) {
      setError("Vui lòng kiểm tra lại thông tin hoa và đơn giá của các mục.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryAddress: { recipientName, phone, street },
          deliveryWindow: { date: deliveryDate, timeSlot },
          cardMessage,
          internalNote,
          items: items.map((it) => ({
            description: it.description,
            quantity: Number(it.quantity),
            unitPriceVnd: Number(it.unitPriceVnd),
            metadata:
              it.sampleImageUrl || it.bomFlowers?.length
                ? { sampleImageUrl: it.sampleImageUrl, bomSummary: it.bomSummary, flowers: it.bomFlowers, wrapStyle: it.wrapStyle, ribbon: it.ribbon }
                : undefined,
          })),
        }),
      })
      if (!res.ok) {
        const data = await res.json() as { message?: string }
        throw new Error(data.message ?? "Tạo đơn hàng thất bại.")
      }
      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(errorText(err) || "Đã xảy ra lỗi khi tạo đơn hàng.")
    } finally {
      setLoading(false)
    }
  }

  const dialogTitle = (
    <span className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-subtle text-primary">
        <Sparkles className="h-3.5 w-3.5" />
      </span>
      Tạo Đơn Hàng Hoa Mới
    </span>
  )

  const dialogFooter = (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-body-sm font-semibold text-text-muted">Tổng tiền tạm tính:</span>
        <span className="text-title font-bold text-primary">
          {totalVnd.toLocaleString("vi-VN")} đ
        </span>
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Hủy</Button>
        <Button form="create-order-form" type="submit" disabled={loading} className="font-semibold">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Xác nhận tạo đơn
        </Button>
      </div>
    </div>
  )

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose() }}
      title={dialogTitle}
      description="Đồng bộ Master Index & Công thức cắm hoa"
      size="lg"
      footer={dialogFooter}
    >
      <form id="create-order-form" onSubmit={handleSubmit} className="space-y-4 text-body-sm">
        {error && (
          <div className="rounded-lg bg-danger-bg p-3 text-caption font-medium text-danger border border-danger/30">
            {error}
          </div>
        )}

        {masterProducts.length > 0 && (
          <div className="rounded-xl border border-dashed border-guidance-border bg-guidance-bg/60 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-caption font-bold text-guidance-text">
                <Flower2 className="h-4 w-4 text-guidance" />
                ⚡ Chọn mẫu nhanh từ Master Index (Đầy đủ BOM &amp; Ảnh)
              </span>
              <span className="text-caption font-medium text-guidance">{masterProducts.length} mẫu sẵn sàng</span>
            </div>
            <select
              className="w-full rounded-md border border-guidance-border bg-surface px-3 py-2 text-caption font-medium text-text focus:outline-none focus:ring-1 focus:ring-guidance"
              value={selectedProductId}
              onChange={(e) => handleSelectMasterProduct(e.target.value)}
            >
              <option value="">-- Bấm để chọn mẫu hoa có sẵn trong Master Catalog --</option>
              {masterProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} [{p.code}] — {p.pricing?.quotePriceVnd ? `${Number(p.pricing.quotePriceVnd).toLocaleString("vi-VN")} đ` : "Chưa có giá"} ({p.category})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block font-semibold text-text">Người nhận *</label>
            <input type="text" className="w-full rounded-md border border-border bg-surface px-3 py-2 text-body-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Họ tên người nhận hoa" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block font-semibold text-text">Số điện thoại *</label>
            <input type="text" className="w-full rounded-md border border-border bg-surface px-3 py-2 text-body-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="0909xxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
        </div>

        <div>
          <label className="mb-1 block font-semibold text-text">Địa chỉ giao hoa *</label>
          <input type="text" className="w-full rounded-md border border-border bg-surface px-3 py-2 text-body-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Số nhà, tên đường, phường, quận..." value={street} onChange={(e) => setStreet(e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block font-semibold text-text">Ngày hẹn giao</label>
            <input type="date" className="w-full rounded-md border border-border bg-surface px-3 py-2 text-body-sm focus:outline-none focus:ring-1 focus:ring-primary" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block font-semibold text-text">Khung giờ giao</label>
            <select className="w-full rounded-md border border-border bg-surface px-3 py-2 text-body-sm focus:outline-none focus:ring-1 focus:ring-primary" value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)}>
              <option value="07:30 - 09:30">Sáng sớm (07:30 - 09:30)</option>
              <option value="09:30 - 11:30">Sáng (09:30 - 11:30)</option>
              <option value="13:30 - 15:30">Chiều (13:30 - 15:30)</option>
              <option value="15:30 - 17:30">Chiều muộn (15:30 - 17:30)</option>
              <option value="18:00 - 20:00">Tối (18:00 - 20:00)</option>
              <option value="Giao gấp hỏa tốc">Giao gấp hỏa tốc (60 phút)</option>
            </select>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="font-semibold text-text">Danh sách mẫu hoa &amp; phụ kiện *</label>
            <button type="button" onClick={addItem} className="inline-flex items-center gap-1 text-caption font-semibold text-primary hover:underline">
              <Plus className="h-3.5 w-3.5" /> Thêm mục
            </button>
          </div>
          <div className="space-y-2">
            {items.map((it, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input type="text" className="flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-body-sm" placeholder="Tên mẫu hoa hoặc mô tả yêu cầu" value={it.description} onChange={(e) => updateItem(idx, "description", e.target.value)} required />
                <input type="number" min="1" className="w-16 rounded-md border border-border bg-surface px-2 py-1.5 text-center text-body-sm" value={it.quantity} onChange={(e) => updateItem(idx, "quantity", Math.max(1, parseInt(e.target.value) || 1))} />
                <input type="number" step="10000" min="0" className="w-32 rounded-md border border-border bg-surface px-2 py-1.5 text-right text-body-sm" placeholder="Đơn giá" value={it.unitPriceVnd} onChange={(e) => updateItem(idx, "unitPriceVnd", parseInt(e.target.value) || 0)} />
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(idx)} aria-label="Xóa dòng" className="flex h-9 w-9 items-center justify-center rounded-md text-text-muted hover:bg-surface-raised hover:text-danger">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block font-semibold text-text">Lời nhắn thiệp mừng</label>
          <textarea rows={2} className="w-full rounded-md border border-border bg-surface px-3 py-2 text-body-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Nội dung in/viết lên thiệp..." value={cardMessage} onChange={(e) => setCardMessage(e.target.value)} />
        </div>

        <div>
          <label className="mb-1 block font-semibold text-text">Ghi chú thợ cắm hoa (BOM / Phong cách)</label>
          <input type="text" className="w-full rounded-md border border-border bg-surface px-3 py-2 text-body-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Tone màu, giấy gói, hoa chính..." value={internalNote} onChange={(e) => setInternalNote(e.target.value)} />
        </div>
      </form>
    </Dialog>
  )
}
