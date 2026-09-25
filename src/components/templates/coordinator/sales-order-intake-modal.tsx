"use client"

import React, { useState, useEffect } from "react"
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  Flower2,
  Clock,
  MapPin,
  User,
  MessageSquare,
  ShieldAlert,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  Camera,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { FlowerBomItem, StructuredAddress } from "@/modules/products/domain/product-master-index"
import {
  errorMessage,
  uploadCoordinatorPhoto,
  type CreateOrderRequest,
} from "@/components/coordinator/coordinator-api"

/** Một mục Product Master Index dùng để điền nhanh form (`GET /products/master-index`). */
interface MasterPreset {
  id: string
  code?: string
  name: string
  masterImageUrl?: string
  pricing?: { quotePriceVnd?: number }
  bom?: { wrapStyle?: string; ribbon?: string; flowers?: FlowerBomItem[] }
}

export interface SalesOrderIntakeModalProps {
  isOpen: boolean
  onClose: () => void
  /** Gửi lên máy chủ; lỗi (400/422) ném ra để modal hiện, không đóng form. */
  onSubmit: (body: CreateOrderRequest) => Promise<void>
}

export function SalesOrderIntakeModal({
  isOpen,
  onClose,
  onSubmit,
}: SalesOrderIntakeModalProps) {
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerTier, setCustomerTier] = useState<"NEW" | "BRONZE" | "SILVER" | "GOLD" | "VIP">("NEW")

  const [recipientName, setRecipientName] = useState("")
  const [recipientPhone, setRecipientPhone] = useState("")

  // Chuẩn hóa địa chỉ phân cấp 5 tầng: Mặc định để trống để người dùng tự nhập liệu
  const [addressStreet, setAddressStreet] = useState("")
  const [addressWard, setAddressWard] = useState("")
  const [addressDistrict, setAddressDistrict] = useState("")
  const [addressCity, setAddressCity] = useState("")
  const [addressCountry, setAddressCountry] = useState("Việt Nam")

  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10))
  const [deliveryTime, setDeliveryTime] = useState("17:00")

  const [productTitle, setProductTitle] = useState("")
  const [unitPriceVnd, setUnitPriceVnd] = useState<number>(0)
  const [priority, setPriority] = useState<"STANDARD" | "RUSH" | "VIP">("STANDARD")
  const [cardMessage, setCardMessage] = useState("")
  const [internalNote, setInternalNote] = useState("")
  const [sampleImageUrl, setSampleImageUrl] = useState<string>("")
  const [sampleAssetId, setSampleAssetId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Ảnh tải lên đi qua kho `assets` của tổ chức (không base64 trong đơn).
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setFormError(null)
    setIsUploading(true)
    try {
      const { assetId, previewUrl } = await uploadCoordinatorPhoto(file)
      setSampleAssetId(assetId)
      setSampleImageUrl(previewUrl)
    } catch (error) {
      setFormError(`Không tải được ảnh mẫu: ${errorMessage(error)}`)
    } finally {
      setIsUploading(false)
    }
  }

  // Danh sách BOM cành hoa nguyên tử
  const [flowers, setFlowers] = useState<FlowerBomItem[]>([])

  const handlePrefillSampleAddressHN = () => {
    setAddressStreet("195 Lương Thế Vinh")
    setAddressWard("Phường Trung Văn")
    setAddressDistrict("Quận Nam Từ Liêm")
    setAddressCity("Hà Nội")
    setAddressCountry("Việt Nam")
  }

  const handlePrefillSampleAddressHCM = () => {
    setAddressStreet("68 Nguyễn Huệ, Bến Nghé")
    setAddressWard("Phường Bến Nghé")
    setAddressDistrict("Quận 1")
    setAddressCity("TP. Hồ Chí Minh")
    setAddressCountry("Việt Nam")
  }

  const handleClearAddress = () => {
    setAddressStreet("")
    setAddressWard("")
    setAddressDistrict("")
    setAddressCity("")
    setAddressCountry("Việt Nam")
  }

  // Master index presets để Sales bấm chọn nhanh
  const [masterProducts, setMasterProducts] = useState<MasterPreset[]>([])

  useEffect(() => {
    if (!isOpen) return
    fetch("/api/v1/products/master-index?limit=20")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((res) => {
        if (res.items && res.items.length > 0) {
          setMasterProducts(res.items)
        }
      })
      .catch(() => {
        // Graceful fallback nếu server offline
      })
  }, [isOpen])

  if (!isOpen) return null

  const handleSelectMasterProduct = (prod: MasterPreset) => {
    setProductTitle(prod.name)
    if (prod.masterImageUrl) {
      setSampleImageUrl(prod.masterImageUrl)
      setSampleAssetId(null)
    }
    if (prod.pricing?.quotePriceVnd) setUnitPriceVnd(prod.pricing.quotePriceVnd)
    if (prod.bom?.flowers && prod.bom.flowers.length > 0) {
      setFlowers(prod.bom.flowers)
    }
    if (prod.bom?.wrapStyle || prod.bom?.ribbon) {
      setInternalNote(`Gói: ${prod.bom.wrapStyle || "Chuẩn"}. Nơ: ${prod.bom.ribbon || "Chuẩn"}`)
    }
  }

  const handleAddFlower = () => {
    setFlowers((prev) => [
      ...prev,
      { flowerName: "", quantity: 1, unit: "cành", color: "Tự nhiên", role: "Phụ" },
    ])
  }

  const handleRemoveFlower = (index: number) => {
    setFlowers((prev) => prev.filter((_, i) => i !== index))
  }

  const handleFlowerChange = (index: number, field: keyof FlowerBomItem, val: string | number) => {
    setFlowers((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [field]: val } : f))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!customerName || !recipientName || !recipientPhone || !addressStreet || !addressWard || !addressDistrict || !addressCity) {
      setFormError("Điền đủ khách hàng, người nhận và địa chỉ 4 tầng (Số nhà, Phường/Xã, Quận/Huyện, Tỉnh/TP).")
      return
    }

    const country = addressCountry.trim() || "Việt Nam"
    const deliveryAddress = {
      street: addressStreet.trim(),
      ward: addressWard.trim(),
      district: addressDistrict.trim(),
      city: addressCity.trim(),
      country,
      formattedAddress: [addressStreet, addressWard, addressDistrict, addressCity]
        .map((v) => v.trim())
        .concat(country)
        .filter(Boolean)
        .join(", "),
    }
    // Giờ hẹn thật (giờ máy người nhập) — máy chủ dùng nó tính rủi ro trễ (F09/F12).
    const target = new Date(`${deliveryDate}T${deliveryTime}:00`)
    const priorityNote = priority === "STANDARD" ? "" : `[Ưu tiên: ${priority}] `
    const isStoredUrl = /^https?:\/\//i.test(sampleImageUrl) || sampleImageUrl.startsWith("/")

    const body: CreateOrderRequest = {
      customerName: customerName.trim(),
      customerTier,
      recipientName: recipientName.trim(),
      recipientPhone: recipientPhone.trim(),
      deliveryAddress,
      deliveryTargetTime: `${deliveryTime} ngày ${deliveryDate}`,
      ...(Number.isNaN(target.getTime()) ? {} : { deliveryTargetAt: target.toISOString() }),
      productTitle: productTitle.trim() || "Bó hoa tươi nghệ thuật",
      ...(sampleAssetId ? { sampleAssetId } : isStoredUrl ? { sampleImageUrl } : {}),
      unitPriceVnd: Number(unitPriceVnd) || 0,
      flowers: flowers
        .filter((f) => f.flowerName.trim())
        .map((f) => ({ flowerName: f.flowerName, quantity: Number(f.quantity) || 1, unit: f.unit, color: f.color, role: f.role })),
      ...(cardMessage.trim() ? { cardMessage } : {}),
      ...(priorityNote || internalNote.trim() ? { internalNote: `${priorityNote}${internalNote}`.trim() } : {}),
    }

    setIsSubmitting(true)
    try {
      await onSubmit(body)
    } catch (error) {
      setFormError(errorMessage(error))
      return
    } finally {
      setIsSubmitting(false)
    }

    handleClearAddress()
    setCustomerName("")
    setCustomerPhone("")
    setRecipientName("")
    setRecipientPhone("")
    setProductTitle("")
    setUnitPriceVnd(0)
    setFlowers([])
    setCardMessage("")
    setInternalNote("")
    setSampleImageUrl("")
    setSampleAssetId(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-surface z-10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
              <Flower2 size={18} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-text">
                Tiếp Nhận Đơn Hàng Mới (Sales Order Intake — T01)
              </h2>
              <p className="text-[11px] text-text-muted">
                Tạo đơn hàng từ Sales & Đưa ngay vào Tháp Điều Phối Control Tower
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 text-xs">
          {/* Quick Select from Master Index */}
          {masterProducts.length > 0 && (
            <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 flex flex-col gap-2">
              <div className="font-bold text-red-950 flex items-center gap-1.5">
                <Sparkles size={14} className="text-red-600" />
                <span>⚡ Chọn mẫu nhanh từ Product Master Index:</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {masterProducts.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectMasterProduct(p)}
                    className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-surface hover:border-red-500 text-left shrink-0 transition-colors"
                  >
                    <div className="font-bold text-text truncate max-w-[140px]">{p.name}</div>
                    <div className="text-[10px] text-text-muted">{p.code}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 1: Customer & Recipient */}
          <div className="flex flex-col gap-3">
            <span className="font-extrabold text-text text-sm flex items-center gap-1.5 border-b border-border pb-1">
              <User size={15} className="text-red-600" />
              1. Khách Hàng & Người Nhận Hoa
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-text block mb-1">Tên khách đặt *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="font-bold text-text block mb-1">Số điện thoại khách</label>
                <input
                  type="text"
                  placeholder="0901234567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="font-bold text-text block mb-1">Phân hạng khách hàng</label>
                <select
                  value={customerTier}
                  onChange={(e) => setCustomerTier(e.target.value as typeof customerTier)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none focus:border-red-500"
                >
                  <option value="NEW">Mới (NEW)</option>
                  <option value="BRONZE">Đồng (BRONZE)</option>
                  <option value="SILVER">Bạc (SILVER)</option>
                  <option value="GOLD">Vàng (GOLD)</option>
                  <option value="VIP">VIP Đặc Biệt</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-text block mb-1">Tên người nhận hoa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Trần Thị Bình"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="font-bold text-text block mb-1">Số điện thoại người nhận *</label>
                <input
                  type="text"
                  required
                  placeholder="0912345678"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Phân cấp địa chỉ 5 tầng: Số nhà/ngõ + Phường/xã + Quận/huyện + Tỉnh/TP + Quốc gia */}
            <div className="p-3.5 rounded-xl border border-red-200/80 bg-red-50/40 flex flex-col gap-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-red-950 flex items-center gap-1.5">
                  <MapPin size={14} className="text-red-600" />
                  ĐỊA CHỈ GIAO HÀNG PHÂN CẤP (ATOMIC STRUCTURED ADDRESS) *
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handlePrefillSampleAddressHN}
                    className="text-[10px] text-zinc-700 bg-white border border-border hover:bg-zinc-50 px-2 py-0.5 rounded-md font-bold transition-colors"
                  >
                    ⚡ Mẫu HN
                  </button>
                  <button
                    type="button"
                    onClick={handlePrefillSampleAddressHCM}
                    className="text-[10px] text-zinc-700 bg-white border border-border hover:bg-zinc-50 px-2 py-0.5 rounded-md font-bold transition-colors"
                  >
                    ⚡ Mẫu HCM
                  </button>
                  {addressStreet && (
                    <button
                      type="button"
                      onClick={handleClearAddress}
                      className="text-[10px] text-red-700 hover:text-red-800 font-bold px-1"
                    >
                      Xóa
                    </button>
                  )}
                  <span className="text-[10px] text-red-700 bg-red-100 px-2 py-0.5 rounded-full font-bold">
                    Chuẩn 5 Tầng
                  </span>
                </div>
              </div>

              {/* Tầng 1: Số nhà, ngõ/tên đường */}
              <div>
                <label className="font-bold text-text block mb-1">
                  1. Số nhà, ngõ / hẻm / ngách, tên đường (Số phòng / Tòa nhà nếu có) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 195 Lương Thế Vinh (hoặc P.802 Toà Lotte Center, 54 Liễu Giai)"
                  value={addressStreet}
                  onChange={(e) => setAddressStreet(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none focus:border-red-500 font-medium"
                />
              </div>

              {/* Tầng 2, 3, 4: Phường/Xã + Quận/Huyện + Tỉnh/Thành phố */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="font-bold text-text block mb-1">2. Phường / Xã / Thị trấn *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Phường Trung Văn"
                    value={addressWard}
                    onChange={(e) => setAddressWard(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none focus:border-red-500 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-text block mb-1">3. Quận / Huyện / Thị xã *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Quận Nam Từ Liêm"
                    value={addressDistrict}
                    onChange={(e) => setAddressDistrict(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none focus:border-red-500 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-text block mb-1">4. Tỉnh / Thành phố *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Hà Nội"
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none focus:border-red-500 font-medium"
                  />
                </div>
              </div>

              {/* Tầng 5: Quốc gia & Khung Xem Trước Ghép Chuẩn */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="font-bold text-text block mb-1">5. Quốc gia</label>
                  <input
                    type="text"
                    value={addressCountry}
                    onChange={(e) => setAddressCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none focus:border-red-500 font-medium"
                  />
                </div>

                <div className="sm:col-span-2 flex flex-col justify-end">
                  <div className="p-2 rounded-xl bg-surface border border-border/80 text-[11px] flex items-start gap-1.5">
                    <span className="font-bold text-red-600 shrink-0">Ghép chuẩn SSOT:</span>
                    <span className="text-text font-medium line-clamp-2">
                      {[addressStreet, addressWard, addressDistrict, addressCity, addressCountry].filter(Boolean).join(", ")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-text block mb-1">Ngày giao hẹn</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="font-bold text-text block mb-1">Giờ giao hẹn *</label>
                <input
                  type="time"
                  required
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Product & Atomic BOM */}
          <div className="flex flex-col gap-4">
            <span className="font-extrabold text-text text-sm flex items-center justify-between border-b border-border pb-1.5">
              <span className="flex items-center gap-1.5">
                <Flower2 size={16} className="text-red-600" />
                2. Mẫu Sản Phẩm & Công Thức Cắm Hoa (Atomic BOM)
              </span>
              <span className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                📸 Chuẩn Input Kỹ Thuật Đầu Vào
              </span>
            </span>

            {/* Khối Hiển Thị & Tải Ảnh Sản Phẩm Mẫu (Master Sample Image Spec) */}
            <div className="p-4 rounded-2xl border-2 border-red-200 bg-red-50/40 flex flex-col md:flex-row gap-4 items-start">
              {/* Cột Trái: Khung Preview Ảnh Mẫu */}
              <div className="flex flex-col items-center gap-2 shrink-0 w-full md:w-44">
                <div className="relative w-full aspect-square rounded-xl border border-red-200 bg-surface overflow-hidden shadow-sm flex items-center justify-center group">
                  {sampleImageUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sampleImageUrl}
                        alt="Ảnh mẫu hoa đầu vào"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => window.open(sampleImageUrl, "_blank")}
                          title="Xem ảnh gốc toàn màn hình"
                          className="p-1.5 rounded-lg bg-surface/90 text-text hover:bg-white text-xs font-bold shadow cursor-pointer"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSampleImageUrl("")}
                          title="Xóa ảnh mẫu"
                          className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 text-xs font-bold shadow cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <span className="absolute bottom-1.5 left-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[9.5px] font-bold text-white text-center backdrop-blur-xs truncate">
                        Ảnh mẫu cắm đối chiếu
                      </span>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-3 text-center text-text-muted">
                      <ImageIcon size={32} className="text-red-400 mb-1" />
                      <span className="text-[11px] font-bold text-text">Chưa có ảnh mẫu</span>
                      <span className="text-[10px] text-text-muted mt-0.5">Tải ảnh hoặc dán URL</span>
                    </div>
                  )}
                </div>

                {sampleImageUrl && (
                  <div className="text-[10.5px] text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    <span>Đã nạp ảnh chuẩn đầu vào</span>
                  </div>
                )}
              </div>

              {/* Cột Phải: Các tùy chọn Tải / Nhập / Dán link ảnh */}
              <div className="flex-1 flex flex-col gap-3 w-full">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-text text-xs flex items-center gap-1.5">
                      <Camera size={13} className="text-red-600" />
                      <span>Ảnh Mẫu Hoa Tiêu Chuẩn Đầu Vào (Master Image Spec) *</span>
                    </label>
                    <span className="text-[10.5px] text-text-muted">Dùng cho AI QC đối chiếu Chặng 05</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Dán URL link ảnh hoa mẫu (Zalo, Facebook, Web...)..."
                      value={sampleAssetId ? "(ảnh đã tải lên kho của tiệm)" : sampleImageUrl}
                      readOnly={Boolean(sampleAssetId)}
                      onChange={(e) => {
                        setSampleImageUrl(e.target.value)
                        setSampleAssetId(null)
                      }}
                      className="flex-1 px-3 py-2 rounded-xl border border-border bg-surface text-text text-xs focus:outline-none focus:border-red-500 font-medium"
                    />

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 h-auto text-xs font-bold gap-1.5 border-red-300 text-red-700 bg-red-50 hover:bg-red-100 shrink-0 cursor-pointer"
                    >
                      <Upload size={13} />
                      <span>{isUploading ? "Đang tải…" : "Tải ảnh lên"}</span>
                    </Button>
                  </div>
                </div>

                {/* Chọn nhanh ảnh mẫu từ preset */}
                <div className="flex flex-col gap-1.5 pt-2 border-t border-dashed border-red-200">
                  <span className="text-[11px] font-bold text-text-muted flex items-center gap-1">
                    <Sparkles size={11} className="text-amber-500" />
                    <span>Ảnh mẫu từ Product Master của tiệm:</span>
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {masterProducts.filter((p) => p.masterImageUrl).slice(0, 6).map((prod) => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => handleSelectMasterProduct(prod)}
                        className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                          sampleImageUrl === prod.masterImageUrl
                            ? "border-red-500 bg-red-100/80 text-red-900 font-bold"
                            : "border-border bg-surface hover:border-red-300 text-text"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={prod.masterImageUrl}
                          alt={prod.name}
                          className="w-4 h-4 rounded-full object-cover shrink-0"
                        />
                        <span className="truncate max-w-[120px]">{prod.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-surface/80 border border-border text-[11px] text-text-muted leading-relaxed">
                  💡 <strong>Tiêu chuẩn nghiệp vụ:</strong> Ảnh sản phẩm mẫu là căn cứ kỹ thuật bắt buộc của toàn bộ hành trình điều phối: làm tài liệu cho Thợ/Xưởng cắm hoa đúng mẫu (Chặng 04), làm dữ liệu đối trọng để <strong>AI QC so sánh độ tương đồng thị giác (Visual Similarity Score)</strong> tại Chặng 05, và lưu vào hồ sơ bàn giao nghiệm thu.
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="font-bold text-text block mb-1">Tên mẫu hoa / Sản phẩm *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bó Hồng Ohara Kem Sang Trọng"
                  value={productTitle}
                  onChange={(e) => setProductTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="font-bold text-text block mb-1">Giá bán báo khách (VNĐ)</label>
                <input
                  type="number"
                  value={unitPriceVnd}
                  onChange={(e) => setUnitPriceVnd(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Atomic Flowers Table */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-text">Công thức hoa nguyên tử (BOM):</label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddFlower} className="h-6 text-[11px] gap-1">
                  <Plus size={11} />
                  Thêm cành hoa
                </Button>
              </div>

              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-alt border-b border-border font-bold text-text-muted">
                    <tr>
                      <th className="px-3 py-2">Tên hoa</th>
                      <th className="px-3 py-2 w-20">Số lượng</th>
                      <th className="px-3 py-2 w-24">Đơn vị</th>
                      <th className="px-3 py-2">Màu sắc</th>
                      <th className="px-3 py-2 w-28">Vai trò</th>
                      <th className="px-2 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {flowers.map((fl, idx) => (
                      <tr key={idx}>
                        <td className="p-1.5">
                          <input
                            type="text"
                            required
                            placeholder="Tên loài hoa..."
                            value={fl.flowerName}
                            onChange={(e) => handleFlowerChange(idx, "flowerName", e.target.value)}
                            className="w-full px-2 py-1 rounded-lg border border-border bg-surface text-text"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            min="1"
                            value={fl.quantity}
                            onChange={(e) => handleFlowerChange(idx, "quantity", Number(e.target.value))}
                            className="w-full px-2 py-1 rounded-lg border border-border bg-surface text-text"
                          />
                        </td>
                        <td className="p-1.5">
                          <select
                            value={fl.unit}
                            onChange={(e) => handleFlowerChange(idx, "unit", e.target.value)}
                            className="w-full px-2 py-1 rounded-lg border border-border bg-surface text-text"
                          >
                            <option value="cành">cành</option>
                            <option value="bông">bông</option>
                            <option value="lá">lá</option>
                            <option value="cây">cây</option>
                          </select>
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            placeholder="Màu sắc..."
                            value={fl.color}
                            onChange={(e) => handleFlowerChange(idx, "color", e.target.value)}
                            className="w-full px-2 py-1 rounded-lg border border-border bg-surface text-text"
                          />
                        </td>
                        <td className="p-1.5">
                          <select
                            value={fl.role}
                            onChange={(e) => handleFlowerChange(idx, "role", e.target.value)}
                            className="w-full px-2 py-1 rounded-lg border border-border bg-surface text-text font-bold"
                          >
                            <option value="Chủ đạo">Chủ đạo</option>
                            <option value="Phụ">Phụ</option>
                            <option value="Điểm xuyến">Điểm xuyến</option>
                            <option value="Lấp đầy">Lấp đầy</option>
                          </select>
                        </td>
                        <td className="p-1.5 text-center">
                          {flowers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFlower(idx)}
                              className="text-text-muted hover:text-red-600 p-1"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 3: Card Message & Notes */}
          <div className="flex flex-col gap-3">
            <span className="font-extrabold text-text text-sm flex items-center gap-1.5 border-b border-border pb-1">
              <MessageSquare size={15} className="text-red-600" />
              3. Thiệp Chúc Mừng & Lưu Ý Điều Phối
            </span>

            <div>
              <label className="font-bold text-text block mb-1">Lời nhắn thiệp chúc mừng (In nguyên văn):</label>
              <textarea
                rows={2}
                placeholder="Ví dụ: Chúc mừng sinh nhật em yêu, luôn vui vẻ và hạnh phúc nhé!"
                value={cardMessage}
                onChange={(e) => setCardMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-text block mb-1">Mức độ ưu tiên điều phối</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as typeof priority)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none focus:border-red-500 font-bold"
                >
                  <option value="STANDARD">Tiêu chuẩn (STANDARD)</option>
                  <option value="RUSH">Đơn gấp cần ưu tiên (RUSH)</option>
                  <option value="VIP">Đơn VIP đối ngoại</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-text block mb-1">Ghi chú nội bộ cho thợ cắm:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Gói giấy lụa mờ, nơ đỏ, kiểm tra kỹ hoa nở..."
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Checklist Tiêu Chuẩn Đầu Vào P1 (Sổ Tay Điều Phối) */}
          <div className="p-3.5 rounded-xl border border-red-200 bg-red-50/50 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-red-950 text-xs flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-red-600" />
                Kiểm Định Tiêu Chuẩn Đầu Vào P1 (Điều 4 Quy chế & Sổ Tay Điều Phối):
              </span>
              <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                Mục tiêu P1: Đủ thông tin trước khi lập KH P2
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border font-semibold ${
                customerName && recipientName && recipientPhone
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-surface text-text-muted border-border"
              }`}>
                <span>{customerName && recipientName && recipientPhone ? "✓" : "○"}</span>
                <span className="truncate">1. Người nhận & SĐT</span>
              </div>

              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border font-semibold ${
                addressStreet && addressWard && addressDistrict && addressCity
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-surface text-text-muted border-border"
              }`}>
                <span>{addressStreet && addressWard && addressDistrict && addressCity ? "✓" : "○"}</span>
                <span className="truncate">2. Địa chỉ 5 tầng</span>
              </div>

              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border font-semibold ${
                deliveryDate && deliveryTime
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-surface text-text-muted border-border"
              }`}>
                <span>{deliveryDate && deliveryTime ? "✓" : "○"}</span>
                <span className="truncate">3. Giờ hẹn giao</span>
              </div>

              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border font-semibold ${
                sampleImageUrl
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}>
                <span>{sampleImageUrl ? "✓" : "!"}</span>
                <span className="truncate">4. Ảnh mẫu đối chiếu</span>
              </div>

              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border font-semibold ${
                productTitle && unitPriceVnd > 0
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-surface text-text-muted border-border"
              }`}>
                <span>{productTitle && unitPriceVnd > 0 ? "✓" : "○"}</span>
                <span className="truncate">5. Mẫu hoa & Giá bán</span>
              </div>

              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border font-semibold ${
                flowers.length > 0
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}>
                <span>{flowers.length > 0 ? "✓" : "!"}</span>
                <span className="truncate">6. Công thức cành BOM</span>
              </div>

              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border font-semibold ${
                cardMessage
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-surface text-text-muted border-border"
              }`}>
                <span>{cardMessage ? "✓" : "○"}</span>
                <span className="truncate">7. Lời nhắn thiệp</span>
              </div>

              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border font-semibold bg-emerald-50 text-emerald-800 border-emerald-200">
                <span>✓</span>
                <span className="truncate">8. Phân loại ưu tiên ({priority})</span>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          {formError && (
            <div role="alert" className="p-3 rounded-xl border border-red-300 bg-red-50 text-red-800 text-xs font-semibold">
              {formError}
            </div>
          )}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="bg-red-600 hover:bg-red-700 text-white font-bold gap-1.5"
            >
              <CheckCircle2 size={15} />
              <span>{isSubmitting ? "Đang tạo đơn…" : "Khởi Tạo Đơn & Đưa Vào Tháp Điều Phối"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
