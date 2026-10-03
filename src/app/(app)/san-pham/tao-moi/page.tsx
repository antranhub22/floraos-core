"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  Layers,
  FileText,
  DollarSign,
  AlertCircle,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type FlowerItem = {
  id: string
  name: string
  quantity: number
  unit: string
  color: string
  role: string
}

const CATEGORIES = [
  "Bó hoa",
  "Giỏ hoa",
  "Hộp hoa",
  "Kệ hoa khai trương",
  "Bình hoa",
  "Hoa chia buồn",
  "Cây cảnh / Quà tặng",
]

const SHAPES = [
  "Dáng tròn",
  "Dáng tam giác",
  "Dáng tự nhiên / Phong cách Hàn",
  "Dáng dài",
  "Dáng thác nước",
  "Dáng quạt",
]

const FACINGS = ["Một mặt", "Đa hướng (360 độ)", "Hai mặt"]

const FLOWER_ROLES = ["Chủ đạo", "Phụ", "Điểm nhấn", "Lấp đầy"]

export default function CreateProductPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form states
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [category, setCategory] = useState(CATEGORIES[0])
  const [shape, setShape] = useState(SHAPES[0])
  const [facing, setFacing] = useState(FACINGS[0])
  const [container, setContainer] = useState("")
  const [priceVnd, setPriceVnd] = useState("")
  const [primaryColor, setPrimaryColor] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<"ACTIVE" | "DRAFT">("ACTIVE")

  // Image upload states
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  // BOM items
  const [flowers, setFlowers] = useState<FlowerItem[]>([
    {
      id: "init-1",
      name: "Hoa hồng đỏ",
      quantity: 10,
      unit: "cành",
      color: "Đỏ",
      role: "Chủ đạo",
    },
  ])

  // Submitting
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Auto-generate code if empty
  useEffect(() => {
    if (!code) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000)
      setCode(`FL-${randomSuffix}`)
    }
  }, [code])

  // Cleanup object url
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const url = URL.createObjectURL(file)
    setImagePreview(url)
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview)
    }
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleAddFlower = () => {
    setFlowers((prev) => [
      ...prev,
      {
        id: `flower-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: "",
        quantity: 1,
        unit: "cành",
        color: "",
        role: "Phụ",
      },
    ])
  }

  const handleUpdateFlower = (id: string, field: keyof FlowerItem, value: string | number) => {
    setFlowers((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    )
  }

  const handleRemoveFlower = (id: string) => {
    setFlowers((prev) => prev.filter((f) => f.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMsg("Vui lòng nhập tên sản phẩm.")
      return
    }
    if (!code.trim()) {
      setErrorMsg("Vui lòng nhập mã sản phẩm.")
      return
    }

    setSubmitting(true)
    setErrorMsg(null)

    try {
      let uploadedAssetId: string | null = null

      // Upload image if provided
      if (imageFile) {
        setUploadingImage(true)
        const urlRes = await fetch("/api/v1/assets/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: null, mime_type: imageFile.type }),
        })

        if (!urlRes.ok) {
          throw new Error("Không thể khởi tạo đường dẫn tải ảnh lên.")
        }

        const { asset_id, storage_key, upload_url } = await urlRes.json()

        const putRes = await fetch(upload_url, {
          method: "PUT",
          headers: { "Content-Type": imageFile.type },
          body: imageFile,
        })

        if (!putRes.ok) {
          throw new Error("Tải file ảnh lên kho lưu trữ thất bại.")
        }

        const registerRes = await fetch("/api/v1/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            asset_id,
            product_id: null,
            kind: "ORIGINAL",
            storage_key,
            mime_type: imageFile.type,
            file_size: imageFile.size,
          }),
        })

        if (!registerRes.ok) {
          throw new Error("Không thể ghi nhận tài nguyên ảnh vào hệ thống.")
        }

        uploadedAssetId = asset_id
        setUploadingImage(false)
      }

      // Filter valid flower items
      const validFlowers = flowers
        .filter((f) => f.name.trim().length > 0)
        .map((f) => ({
          name: f.name.trim(),
          quantity: Number(f.quantity) || 1,
          unit: f.unit || "cành",
          color: f.color || "Tiêu chuẩn",
          role: f.role || "Chủ đạo",
        }))

      const parsedPrice = priceVnd.trim() ? Number(priceVnd.replace(/\D/g, "")) : null

      const attributesPayload = {
        price: parsedPrice,
        price_vnd: parsedPrice,
        description: description.trim() || null,
        color: primaryColor.trim() || null,
        bom: {
          flowers: validFlowers,
        },
      }

      const createRes = await fetch("/api/v1/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim(),
          category,
          shape,
          facing,
          container: container.trim() || null,
          status,
          attributes: attributesPayload,
          image_asset_id: uploadedAssetId,
        }),
      })

      if (!createRes.ok) {
        let msg = "Không thể tạo sản phẩm"
        try {
          const body = await createRes.json()
          msg = body.error?.message ?? msg
        } catch { /* ignore */ }
        throw new Error(msg)
      }

      // Done -> redirect to product catalog
      router.push("/san-pham" as never)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tạo sản phẩm.")
    } finally {
      setSubmitting(false)
      setUploadingImage(false)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-4 py-3.5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/san-pham" as never)}
            aria-label="Quay lại danh sách sản phẩm"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-text hover:bg-surface-alt transition-colors focus-visible:outline-2 focus-visible:outline-primary"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="text-caption text-text-muted">Kho sản phẩm cửa hàng</div>
            <h1 className="text-title font-extrabold text-primary">Tạo mẫu hoa mới</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/tai-anh" as never)}
            className="flex items-center gap-1.5"
            title="Dùng AI nhận diện ảnh và tự sinh công thức"
          >
            <Sparkles size={14} className="text-primary" />
            <span className="hidden sm:inline">Phân tích AI</span>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-1.5"
          >
            <CheckCircle2 size={15} strokeWidth={2.2} />
            <span>{submitting ? "Đang lưu..." : "Lưu vào kho"}</span>
          </Button>
        </div>
      </header>

      {/* Main form */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-bg p-4 text-body-sm font-medium text-danger">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nhóm 1: Ảnh & Thông tin nhận diện cơ bản */}
            <Card className="p-5 sm:p-6 space-y-5">
              <div className="flex items-center gap-2 text-title-sm font-bold text-text">
                <ImageIcon size={18} className="text-primary" />
                <span>Ảnh đại diện & Thông tin chung</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Upload ảnh */}
                <div className="flex flex-col gap-2">
                  <span className="text-caption font-semibold text-text">Ảnh mẫu hoa</span>
                  {imagePreview ? (
                    <div className="relative aspect-square w-full rounded-2xl border border-border bg-surface-alt overflow-hidden group">
                      <img
                        src={imagePreview}
                        alt="Preview mẫu hoa"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        aria-label="Xoá ảnh đã chọn"
                        className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-surface-alt/50 p-4 text-center transition-colors hover:border-primary/50 hover:bg-surface-alt"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Upload size={20} />
                      </div>
                      <div className="text-body-sm font-medium text-text">Chọn hoặc kéo thả ảnh</div>
                      <div className="text-caption text-text-muted">PNG, JPG, WEBP (tối đa 15MB)</div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {/* Các trường cơ bản */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label className="block text-caption font-semibold text-text mb-1">
                      Tên mẫu hoa <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ví dụ: Bó hoa Nắng Hạ Rạng Rỡ"
                      required
                      className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-body-sm outline-none focus:border-primary focus-visible:outline-2 focus-visible:outline-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-caption font-semibold text-text mb-1">
                        Mã sản phẩm (SKU) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="FL-1001"
                        required
                        className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-body-sm outline-none focus:border-primary focus-visible:outline-2 focus-visible:outline-primary uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-caption font-semibold text-text mb-1">
                        Giá tham chiếu (VNĐ)
                      </label>
                      <input
                        type="text"
                        value={priceVnd}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "")
                          setPriceVnd(val ? Number(val).toLocaleString("vi-VN") : "")
                        }}
                        placeholder="Ví dụ: 550,000"
                        className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-body-sm outline-none focus:border-primary focus-visible:outline-2 focus-visible:outline-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-caption font-semibold text-text mb-1">
                        Danh mục
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-body-sm outline-none focus:border-primary focus-visible:outline-2 focus-visible:outline-primary"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-caption font-semibold text-text mb-1">
                        Trạng thái kinh doanh
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as "ACTIVE" | "DRAFT")}
                        className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-body-sm outline-none focus:border-primary focus-visible:outline-2 focus-visible:outline-primary"
                      >
                        <option value="ACTIVE">Đang bán (Hiển thị ngay)</option>
                        <option value="DRAFT">Lưu nháp</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Nhóm 2: Định dạng thiết kế hoa */}
            <Card className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 text-title-sm font-bold text-text">
                <Layers size={18} className="text-primary" />
                <span>Định dạng & Phong cách cắm</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-caption font-semibold text-text mb-1">
                    Kiểu dáng
                  </label>
                  <select
                    value={shape}
                    onChange={(e) => setShape(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-body-sm outline-none focus:border-primary focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    {SHAPES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-caption font-semibold text-text mb-1">
                    Hướng nhìn
                  </label>
                  <select
                    value={facing}
                    onChange={(e) => setFacing(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-body-sm outline-none focus:border-primary focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    {FACINGS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-caption font-semibold text-text mb-1">
                    Vật chứa / Giá đỡ
                  </label>
                  <input
                    type="text"
                    value={container}
                    onChange={(e) => setContainer(e.target.value)}
                    placeholder="Giỏ mây, Bình gốm, Giấy báo..."
                    className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-body-sm outline-none focus:border-primary focus-visible:outline-2 focus-visible:outline-primary"
                  />
                </div>

                <div>
                  <label className="block text-caption font-semibold text-text mb-1">
                    Tone màu chủ đạo
                  </label>
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="Đỏ, Pastel, Trắng kem..."
                    className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-body-sm outline-none focus:border-primary focus-visible:outline-2 focus-visible:outline-primary"
                  />
                </div>
              </div>
            </Card>

            {/* Nhóm 3: Công thức hoa (BOM) */}
            <Card className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-title-sm font-bold text-text">
                  <FileText size={18} className="text-primary" />
                  <span>Công thức cắm hoa (BOM nguyên liệu)</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddFlower}
                  className="inline-flex items-center gap-1 text-caption font-bold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <Plus size={14} /> Thêm loài hoa
                </button>
              </div>

              <div className="space-y-3">
                {flowers.map((flower, idx) => (
                  <div
                    key={flower.id}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-xl border border-border bg-surface-alt/40 p-3 transition-colors hover:border-primary/40"
                  >
                    <div className="flex-1">
                      <input
                        type="text"
                        value={flower.name}
                        onChange={(e) => handleUpdateFlower(flower.id, "name", e.target.value)}
                        placeholder={`Tên hoa ${idx + 1} (vd: Hồng Ecuador)`}
                        className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-body-sm outline-none focus:border-primary focus-visible:outline-2 focus-visible:outline-primary"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-20">
                        <input
                          type="number"
                          min="1"
                          value={flower.quantity}
                          onChange={(e) =>
                            handleUpdateFlower(
                              flower.id,
                              "quantity",
                              Math.max(1, parseInt(e.target.value) || 1)
                            )
                          }
                          className="h-9 w-full rounded-lg border border-border bg-surface px-2 text-center text-body-sm outline-none focus:border-primary focus-visible:outline-2 focus-visible:outline-primary"
                        />
                      </div>

                      <div className="w-20">
                        <input
                          type="text"
                          value={flower.unit}
                          onChange={(e) => handleUpdateFlower(flower.id, "unit", e.target.value)}
                          placeholder="cành"
                          className="h-9 w-full rounded-lg border border-border bg-surface px-2 text-center text-body-sm outline-none focus:border-primary focus-visible:outline-2 focus-visible:outline-primary"
                        />
                      </div>

                      <div className="w-28">
                        <input
                          type="text"
                          value={flower.color}
                          onChange={(e) => handleUpdateFlower(flower.id, "color", e.target.value)}
                          placeholder="Màu sắc"
                          className="h-9 w-full rounded-lg border border-border bg-surface px-2 text-body-sm outline-none focus:border-primary focus-visible:outline-2 focus-visible:outline-primary"
                        />
                      </div>

                      <div className="w-28">
                        <select
                          value={flower.role}
                          onChange={(e) => handleUpdateFlower(flower.id, "role", e.target.value)}
                          className="h-9 w-full rounded-lg border border-border bg-surface px-2 text-caption font-medium outline-none focus:border-primary focus-visible:outline-2 focus-visible:outline-primary"
                        >
                          {FLOWER_ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveFlower(flower.id)}
                        disabled={flowers.length <= 1}
                        aria-label="Xoá loài hoa này"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:bg-danger-bg hover:text-danger disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-muted transition-colors focus-visible:outline-2 focus-visible:outline-primary"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Nhóm 4: Mô tả & Ghi chú */}
            <Card className="p-5 sm:p-6 space-y-4">
              <div className="text-title-sm font-bold text-text">Mô tả & Ghi chú sản phẩm</div>
              <div>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ghi chú ý nghĩa hoa, lưu ý bảo quản hoặc lời chúc gợi ý..."
                  className="w-full rounded-xl border border-border bg-surface p-3 text-body-sm outline-none focus:border-primary focus-visible:outline-2 focus-visible:outline-primary"
                />
              </div>
            </Card>

            {/* Thanh nút lưu cuối trang */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/san-pham" as never)}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5"
              >
                <CheckCircle2 size={16} />
                <span>{submitting ? "Đang lưu mẫu hoa..." : "Lưu vào kho sản phẩm"}</span>
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
