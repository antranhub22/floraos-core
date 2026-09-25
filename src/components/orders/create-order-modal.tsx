"use client"

import React, { useState, useEffect } from "react"
import { X, Plus, Trash2, Loader2, Sparkles, Flower2, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { errorText } from "@/lib/error-text"
import type { ProductMasterIndex } from "@/modules/products/domain/product-master-index"

interface CreateOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
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
  bomSummary?: string
  /** BOM có cấu trúc thật lấy từ Master Index — để phiếu cắm hoa (florist ticket) đọc được
   * đúng từng loại hoa/số lượng/màu thay vì phải bịa lại từ mô tả chữ tự do. */
  bomFlowers?: FlowerBomItemLite[]
  wrapStyle?: string
  ribbon?: string
}

export function CreateOrderModal({ isOpen, onClose, onSuccess }: CreateOrderModalProps) {
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

  // Tải danh sách Master Index từ M01/Catalog
  useEffect(() => {
    if (!isOpen) return
    fetch("/api/v1/products/master-index?limit=30")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((res) => {
        if (res.items) setMasterProducts(res.items)
      })
      .catch((err) => console.error("Lỗi tải Master Index:", err))
  }, [isOpen])

  if (!isOpen) return null

  // Khi người dùng chọn một mẫu hoa từ Master Index
  function handleSelectMasterProduct(productId: string) {
    setSelectedProductId(productId)
    const product = masterProducts.find((p) => p.id === productId)
    if (!product) return

    const flowerSummary = product.bom.flowers
      .map((f) => `${f.flowerName} (${f.quantity} ${f.unit})`)
      .join(", ")

    // Tự động điền vào dòng sản phẩm đầu tiên hoặc thêm mới
    // Giá 0 nghĩa là Master Index chưa có giá bán lẻ thật cấu hình cho mẫu này (xem rà
    // soát mục 7.2) — không bịa một số mặc định trông như thật, để bắt buộc sales tự
    // nhập giá tay (form đã chặn submit khi đơn giá <= 0).
    setItems([
      {
        description: `${product.name} [${product.code}]`,
        quantity: 1,
        unitPriceVnd: product.pricing.quotePriceVnd ?? 0,
        sampleImageUrl: product.masterImageUrl,
        bomSummary: flowerSummary,
        bomFlowers: product.bom.flowers,
        wrapStyle: product.bom.wrapStyle,
        ribbon: product.bom.ribbon,
      },
    ])

    // Điền gợi ý thợ cắm hoa từ BOM
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
          deliveryAddress: {
            recipientName,
            phone,
            street,
          },
          deliveryWindow: {
            date: deliveryDate,
            timeSlot,
          },
          cardMessage,
          internalNote,
          items: items.map((it) => ({
            description: it.description,
            quantity: Number(it.quantity),
            unitPriceVnd: Number(it.unitPriceVnd),
            // Chỉ đính metadata khi mục này thật sự được chọn từ Master Index (có ảnh mẫu
            // hoặc có BOM cấu trúc) — dòng nhập tay không qua Master Index sẽ không có.
            metadata:
              it.sampleImageUrl || it.bomFlowers?.length
                ? {
                    sampleImageUrl: it.sampleImageUrl,
                    bomSummary: it.bomSummary,
                    flowers: it.bomFlowers,
                    wrapStyle: it.wrapStyle,
                    ribbon: it.ribbon,
                  }
                : undefined,
          })),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Tạo đơn hàng thất bại.")
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(errorText(err) || "Đã xảy ra lỗi khi tạo đơn hàng.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-red-100 text-red-700">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-foreground">Tạo Đơn Hàng Hoa Mới (M10)</h2>
              <div className="text-[11px] text-muted-foreground">Đồng bộ Master Index & BOM Phân tích M01</div>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {/* Master Index Quick Picker */}
          {masterProducts.length > 0 && (
            <div className="rounded-xl border border-dashed border-red-300 bg-red-50/60 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-900">
                  <Flower2 className="h-4 w-4 text-red-600" />
                  ⚡ Chọn mẫu nhanh từ Master Index (Đầy đủ BOM & Ảnh)
                </span>
                <span className="text-[11px] font-medium text-red-700">
                  {masterProducts.length} mẫu sẵn sàng
                </span>
              </div>
              <select
                className="w-full rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-medium text-text focus:outline-none focus:ring-1 focus:ring-red-500"
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
              <label className="mb-1 block font-semibold text-text-main">Người nhận *</label>
              <input
                type="text"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Họ tên người nhận hoa"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-text-main">Số điện thoại *</label>
              <input
                type="text"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="0909xxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-text-main">Địa chỉ giao hoa *</label>
            <input
              type="text"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Số nhà, tên đường, phường, quận..."
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block font-semibold text-text-main">Ngày hẹn giao</label>
              <input
                type="date"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-text-main">Khung giờ giao</label>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
              >
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
              <label className="font-semibold text-text-main">Danh sách mẫu hoa & phụ kiện *</label>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Thêm mục
              </button>
            </div>
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                    placeholder="Tên mẫu hoa hoặc mô tả yêu cầu"
                    value={it.description}
                    onChange={(e) => updateItem(idx, "description", e.target.value)}
                    required
                  />
                  <input
                    type="number"
                    min="1"
                    className="w-16 rounded-md border border-border bg-background px-2 py-1.5 text-center text-sm"
                    value={it.quantity}
                    onChange={(e) => updateItem(idx, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                  />
                  <input
                    type="number"
                    step="10000"
                    min="0"
                    className="w-32 rounded-md border border-border bg-background px-2 py-1.5 text-right text-sm"
                    placeholder="Đơn giá"
                    value={it.unitPriceVnd}
                    onChange={(e) => updateItem(idx, "unitPriceVnd", parseInt(e.target.value) || 0)}
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-1 text-muted-foreground hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-text-main">Lời nhắn thiệp mừng</label>
            <textarea
              rows={2}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Nội dung in/viết lên thiệp..."
              value={cardMessage}
              onChange={(e) => setCardMessage(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-text-main">Ghi chú thợ cắm hoa (BOM / Phong cách)</label>
            <input
              type="text"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Tone màu, giấy gói, hoa chính..."
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-surface-raised px-4 py-3">
            <span className="font-semibold text-text-muted">Tổng tiền tạm tính:</span>
            <span className="text-lg font-bold text-red-600">
              {totalVnd.toLocaleString("vi-VN")} đ
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700 text-white font-semibold">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận tạo đơn
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
