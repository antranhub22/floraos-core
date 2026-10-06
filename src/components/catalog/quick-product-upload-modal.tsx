"use client"

import React, { useState, useRef } from "react"
import { UploadCloud, Sparkles, X, Check, Image as ImageIcon, Flower2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { readApiError } from "@/components/greeting-card/api-error"
import type { CatalogProduct } from "./catalog-management-tab"
import { uploadProductImage, type UploadedImage } from "./quick-product-media"
import { QuickProductAiFields } from "./quick-product-ai-fields"
import {
  AI_FIELDS, CATEGORY_OPTIONS, fillEmptyFields, visionToFields,
  type AiField, type AiFieldValues, type VisionResult,
} from "./vision-suggestions"

interface QuickProductUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onProductCreated: (product: CatalogProduct) => void
  defaultOccasion?: string
}

const EMPTY_FIELDS = Object.fromEntries(AI_FIELDS.map((f) => [f, ""])) as AiFieldValues

export function QuickProductUploadModal({
  isOpen,
  onClose,
  onProductCreated,
  defaultOccasion = "20-10",
}: QuickProductUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  // Ảnh đã lên kho (khi bấm Phân tích) — lưu sản phẩm dùng lại, không tải lần hai
  const [uploaded, setUploaded] = useState<UploadedImage | null>(null)
  const [code, setCode] = useState("")
  const [price, setPrice] = useState<number | "">("")
  const [fields, setFields] = useState<AiFieldValues>({ ...EMPTY_FIELDS, occasion: defaultOccasion })
  const [touched, setTouched] = useState<Set<AiField>>(new Set())
  const [aiFilled, setAiFilled] = useState<Set<AiField>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  if (!isOpen) return null

  function setField(field: AiField, value: string) {
    setFields((f) => ({ ...f, [field]: value }))
    setTouched((t) => new Set(t).add(field))
    setAiFilled((s) => { const n = new Set(s); n.delete(field); return n })
  }

  const handleFileChange = (file: File) => {
    setSelectedFile(file)
    setUploaded(null)
    setPreviewUrl(URL.createObjectURL(file))
    if (!code) setCode(`FL-${Date.now().toString().slice(-6)}`)
  }

  async function ensureUploaded(): Promise<UploadedImage | null> {
    if (uploaded) return uploaded
    if (!selectedFile) return null
    const result = await uploadProductImage(selectedFile)
    setUploaded(result)
    return result
  }

  /** Chỉ chạy khi người dùng bấm — mỗi lần AI đọc ảnh mới tốn 1 credit (lỗi thì hoàn). */
  const handleVisionAnalyze = async () => {
    if (!selectedFile) return
    setIsAnalyzing(true)
    setErrorMessage(null)
    setNotice(null)
    try {
      const image = await ensureUploaded()
      if (!image) return
      const res = await fetch("/api/v1/market-intelligence/vision-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset_id: image.assetId }),
      })
      if (!res.ok) throw new Error(await readApiError(res, "AI chưa phân tích được ảnh này"))
      const vision = (await res.json()) as VisionResult & { usage?: { cost_credit: number } }
      const patch = fillEmptyFields(fields, visionToFields(vision), touched)
      const filled = Object.keys(patch) as AiField[]
      setFields((f) => ({ ...f, ...patch }))
      setAiFilled(new Set(filled))
      const cost = vision.usage?.cost_credit ? ` · đã dùng ${vision.usage.cost_credit} credit` : ""
      setNotice(filled.length > 0
        ? `AI đã điền ${filled.length} ô còn trống — kiểm tra lại trước khi lưu${cost}.`
        : `Các ô đã có nội dung, AI không ghi đè${cost}.`)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "AI chưa phân tích được ảnh này. Bạn có thể nhập tay.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fields.name.trim()) {
      setErrorMessage("Vui lòng nhập tên sản phẩm hoa.")
      return
    }
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const image = await ensureUploaded()
      let productCode = code.trim() || `FL-${Date.now().toString().slice(-6)}`
      const priceValue = typeof price === "number" && price > 0 ? price : null
      const payload = {
        name: fields.name.trim(),
        category: fields.category || undefined,
        status: "ACTIVE" as const,
        attributes: {
          ...(image ? { imageUrl: image.viewUrl, image_asset_id: image.assetId } : {}),
          // Không nhập giá → không ghi giá: khách thấy "Liên hệ", không có giá bịa
          ...(priceValue !== null ? { price: priceValue } : {}),
          occasion_code: fields.occasion.trim() || undefined,
          components: fields.components.trim() || undefined,
          colors: fields.colors.trim() || undefined,
          style: fields.style.trim() || undefined,
          packaging: fields.packaging.trim() || undefined,
          description: fields.description.trim() || undefined,
        },
      }
      const post = (c: string) =>
        fetch("/api/v1/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: c, ...payload }) })
      let res = await post(productCode)
      if (res.status === 409) {
        productCode = `${productCode}-${Date.now().toString().slice(-4)}`
        res = await post(productCode)
      }
      if (!res.ok) throw new Error(await readApiError(res, "Không lưu được sản phẩm"))
      const json = (await res.json()) as { data?: { id: string; code?: string; name?: string; category?: string | null } }
      if (!json.data?.id) throw new Error("Không lưu được sản phẩm")
      onProductCreated({
        id: json.data.id,
        code: json.data.code || productCode,
        name: json.data.name || fields.name.trim(),
        price: priceValue,
        imageUrl: image?.viewUrl ?? null,
        category: json.data.category ?? (fields.category || null),
        occasion_code: fields.occasion.trim() || null,
        status: "ACTIVE",
      })
      onClose()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Lỗi khi lưu sản phẩm hoa mới")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div role="dialog" aria-modal="true" aria-labelledby="qp-title" className="relative w-full max-w-lg bg-surface rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Flower2 size={16} aria-hidden="true" />
            </div>
            <div>
              <h3 id="qp-title" className="text-sm font-extrabold text-text">Thêm nhanh mẫu hoa</h3>
              <p className="text-caption text-text-muted">Chụp ảnh, điền thông tin — AI có thể giúp điền phần mô tả</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng cửa sổ" className="p-1.5 rounded-full text-text-muted hover:bg-surface-alt transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {errorMessage && <div role="alert" className="p-3 rounded-xl bg-danger-bg text-danger text-xs">{errorMessage}</div>}
          {notice && <div role="status" className="p-3 rounded-xl bg-primary/5 text-primary text-xs">{notice}</div>}

          <div>
            <p className="text-xs font-bold text-text mb-1.5 flex items-center gap-1.5">
              <ImageIcon size={13} className="text-primary" aria-hidden="true" />
              Ảnh chụp sản phẩm hoa
            </p>
            {previewUrl ? (
              <div className="relative aspect-16/9 rounded-2xl overflow-hidden border border-border group bg-surface-alt">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Xem trước" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="h-8 text-caption bg-white text-text">
                    Chọn ảnh khác
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full relative aspect-16/9 rounded-2xl border-2 border-dashed border-border hover:border-primary/60 bg-surface-alt flex flex-col items-center justify-center gap-2 cursor-pointer p-4 text-center transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <UploadCloud size={20} aria-hidden="true" />
                </div>
                <div className="text-xs font-bold text-text">Bấm vào đây để chọn ảnh chụp hoa tươi</div>
                <div className="text-caption text-text-muted">Hỗ trợ JPG, PNG, WEBP từ điện thoại hoặc máy tính</div>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileChange(f) }} />
            {previewUrl && (
              <Button type="button" variant="outline" onClick={() => void handleVisionAnalyze()} disabled={isAnalyzing || isSubmitting} className="mt-2 h-9 w-full text-xs font-bold gap-1.5">
                <Sparkles size={14} className="text-primary" aria-hidden="true" />
                {isAnalyzing ? "AI đang phân tích ảnh..." : "Phân tích ảnh bằng AI (1 credit)"}
              </Button>
            )}
            {previewUrl && (
              <p className="mt-1 text-caption text-text-muted">AI chỉ điền các ô còn trống về hoa; không đụng mã, giá hay ảnh.</p>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="qp-name" className="block text-xs font-bold text-text mb-1">
                Tên mẫu hoa *{aiFilled.has("name") && <span className="ml-1 text-caption font-medium text-primary">· AI gợi ý</span>}
              </label>
              <Input id="qp-name" value={fields.name} onChange={(e) => setField("name", e.target.value)} placeholder="VD: Bó Hồng Đỏ Ecuador 15 Cành" className="h-9 text-xs" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="qp-code" className="block text-xs font-bold text-text mb-1">Mã sản phẩm</label>
                <Input id="qp-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="VD: FL-2026" className="h-9 text-xs font-mono" />
              </div>
              <div>
                <label htmlFor="qp-price" className="block text-xs font-bold text-text mb-1">Giá bán (đồng)</label>
                <Input id="qp-price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : "")} placeholder="Để trống = Liên hệ" className="h-9 text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="qp-category" className="block text-xs font-bold text-text mb-1">
                  Phân loại{aiFilled.has("category") && <span className="ml-1 text-caption font-medium text-primary">· AI gợi ý</span>}
                </label>
                <select id="qp-category" value={fields.category} onChange={(e) => setField("category", e.target.value)} className="w-full h-9 rounded-xl border border-border bg-surface px-3 text-xs text-text focus:outline-none focus:border-primary">
                  <option value="">Chọn phân loại</option>
                  {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="qp-occasion" className="block text-xs font-bold text-text mb-1">
                  Dịp phù hợp{aiFilled.has("occasion") && <span className="ml-1 text-caption font-medium text-primary">· AI gợi ý</span>}
                </label>
                <Input id="qp-occasion" value={fields.occasion} onChange={(e) => setField("occasion", e.target.value)} placeholder="VD: 20-10, Sinh nhật..." className="h-9 text-xs" />
              </div>
            </div>
            <QuickProductAiFields values={fields} aiFilled={aiFilled} onChange={setField} />
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} className="h-9 text-xs">Hủy</Button>
            <Button type="submit" disabled={isSubmitting || isAnalyzing || !fields.name.trim()} className="h-9 text-xs bg-primary text-white hover:bg-primary-dark font-bold gap-1.5">
              <Check size={14} aria-hidden="true" />
              <span>{isSubmitting ? "Đang lưu..." : "Thêm mẫu hoa"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
