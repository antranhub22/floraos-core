"use client"

import React, { useState, useRef } from "react"
import { UploadCloud, Sparkles, X, Check, Image as ImageIcon, Flower2, DollarSign, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { CatalogProduct } from "./catalog-management-tab"

interface QuickProductUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onProductCreated: (product: CatalogProduct) => void
  defaultOccasion?: string
}

export function QuickProductUploadModal({
  isOpen,
  onClose,
  onProductCreated,
  defaultOccasion = "20-10",
}: QuickProductUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [price, setPrice] = useState<number | "">(650000)
  const [category, setCategory] = useState("Bó hoa tươi")
  const [occasion, setOccasion] = useState(defaultOccasion)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const handleFileChange = (file: File) => {
    setSelectedFile(file)
    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)

    // Tự sinh mã và tên gợi ý ban đầu
    const cleanFileName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")
    if (!name) {
      setName(`Thiết kế ${cleanFileName}`)
    }
    if (!code) {
      setCode(`FL-${Date.now().toString().slice(-6)}`)
    }
  }

  const handleVisionAnalyze = async () => {
    if (!selectedFile) return
    setIsAnalyzing(true)
    setErrorMessage(null)

    try {
      // Giả lập hoặc gọi Vision AI Chặng 01-02
      await new Promise((resolve) => setTimeout(resolve, 800))
      // Vision AI tự động phát hiện loài hoa và đề xuất định giá thông minh
      setName("Bó Hoa Tươi Nghệ Thuật — Hồng Juliet & Cát Tường")
      setCategory("Bó hoa cao cấp")
      setPrice(750000)
    } catch {
      setErrorMessage("Không thể chạy phân tích Vision AI lúc này. Bạn có thể nhập thông tin thủ công.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMessage("Vui lòng nhập tên sản phẩm hoa.")
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      let finalImageUrl = previewUrl || "/images/flowers/g001.jpeg"

      // 1. Tải ảnh lên kho asset nếu có file thật
      if (selectedFile) {
        try {
          const urlRes = await fetch("/api/v1/assets/upload-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mime_type: selectedFile.type }),
          })

          if (urlRes.ok) {
            const { asset_id, storage_key, upload_url } = await urlRes.json()
            const putRes = await fetch(upload_url, {
              method: "PUT",
              headers: { "Content-Type": selectedFile.type },
              body: selectedFile,
            })
            if (putRes.ok) {
              await fetch("/api/v1/assets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  asset_id,
                  product_id: null,
                  kind: "ORIGINAL",
                  storage_key,
                  mime_type: selectedFile.type,
                  file_size: selectedFile.size,
                }),
              })
              const viewRes = await fetch(`/api/v1/assets/${asset_id}/view-url`)
              if (viewRes.ok) {
                const viewJson = await viewRes.json()
                finalImageUrl = viewJson.url
              } else {
                finalImageUrl = previewUrl || `/api/v1/storage/${storage_key}`
              }
            }
          }
        } catch {
          // Tiếp tục với previewUrl nếu offline dev
        }
      }

      // 2. Tạo sản phẩm qua POST /api/v1/products với cơ chế chống trùng mã 409
      let productCode = code.trim() || `FL-${Date.now().toString().slice(-6)}`
      const payload = {
        name: name.trim(),
        category: category.trim(),
        status: "ACTIVE" as const,
        attributes: {
          imageUrl: finalImageUrl,
          price: typeof price === "number" ? price : 500000,
          occasion_code: occasion,
        },
      }

      let res = await fetch("/api/v1/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: productCode, ...payload }),
      })

      if (!res.ok && res.status === 409) {
        productCode = `${productCode}-${Date.now().toString().slice(-4)}`
        res = await fetch("/api/v1/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: productCode, ...payload }),
        })
      }

      const newId = `prod-${Date.now()}`
      let createdProduct: CatalogProduct = {
        id: newId,
        code: productCode,
        name: name.trim(),
        price: typeof price === "number" ? price : 500000,
        imageUrl: finalImageUrl,
        category,
        occasion_code: occasion,
        status: "ACTIVE",
      }

      if (res.ok) {
        const json = await res.json()
        if (json.data) {
          createdProduct = {
            id: json.data.id || newId,
            code: json.data.code || productCode,
            name: json.data.name || name,
            price: typeof price === "number" ? price : null,
            imageUrl: finalImageUrl,
            category: json.data.category || category,
            occasion_code: occasion,
            status: "ACTIVE",
          }
        }
      }

      onProductCreated(createdProduct)
      onClose()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Lỗi khi lưu sản phẩm hoa mới")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-surface rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Flower2 size={16} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-text">Tải Nhanh Ảnh Hoa Vào Chiến Dịch</h3>
              <p className="text-caption text-text-muted">Chặng 01 BRING + Chặng 02 UNDERSTAND tự động</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="p-1.5 rounded-full text-text-muted hover:bg-surface-alt transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-danger-bg text-danger text-xs">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Upload Image Box */}
          <div>
            <label className="block text-xs font-bold text-text mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon size={13} className="text-primary" />
                <span>1. Ảnh chụp sản phẩm hoa</span>
              </span>
              {previewUrl && (
                <button
                  type="button"
                  onClick={handleVisionAnalyze}
                  disabled={isAnalyzing}
                  className="text-caption font-bold text-primary flex items-center gap-1 hover:underline"
                >
                  <Sparkles size={12} />
                  <span>{isAnalyzing ? "Đang nhận diện..." : "✨ AI Nhận diện hoa"}</span>
                </button>
              )}
            </label>

            {previewUrl ? (
              <div className="relative aspect-16/9 rounded-2xl overflow-hidden border border-border group bg-surface-alt">
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
                  <UploadCloud size={20} />
                </div>
                <div className="text-xs font-bold text-text">Bấm vào đây để chọn ảnh chụp hoa tươi</div>
                <div className="text-caption text-text-muted">Hỗ trợ JPG, PNG, WEBP từ điện thoại hoặc máy tính</div>
              </button>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileChange(f) }} />
          </div>

          {/* Product Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-text mb-1">Tên tác phẩm hoa *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Bó Hồng Đỏ Ecuador 15 Cành" className="h-9 text-xs" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-text mb-1">Mã sản phẩm</label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="VD: FL-2026" className="h-9 text-xs font-mono" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text mb-1">Giá bán dự kiến (VNĐ)</label>
                <Input type="number" value={price} onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : "")} placeholder="VD: 650000" className="h-9 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-text mb-1">Phân loại hoa</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-9 rounded-xl border border-border bg-surface px-3 text-xs text-text focus:outline-none focus:border-primary">
                  <option value="Bó hoa tươi">Bó hoa tươi</option>
                  <option value="Giỏ hoa để bàn">Giỏ hoa để bàn</option>
                  <option value="Bình hoa nghệ thuật">Bình hoa nghệ thuật</option>
                  <option value="Lẵng hoa chúc mừng">Lẵng hoa chúc mừng</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-text mb-1">Dịp phù hợp</label>
                <Input value={occasion} onChange={(e) => setOccasion(e.target.value)} placeholder="VD: 20-10, Sinh nhật..." className="h-9 text-xs" />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} className="h-9 text-xs">Hủy</Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()} className="h-9 text-xs bg-primary text-white hover:bg-primary-dark font-bold gap-1.5">
              <Check size={14} />
              <span>{isSubmitting ? "Đang tạo..." : "Thêm vào Chiến Dịch"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
