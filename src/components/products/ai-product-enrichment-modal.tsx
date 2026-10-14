"use client"

import React, { useState, useEffect } from "react"
import { Sparkles, CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { driveThumbProxySrc } from "@/components/greeting-card/drive-thumb-image"
import {
  type ProductFormValues,
  uploadImageFile,
  callVisionExtract,
  callContentEngineMarketing,
  applyVisionToForm,
  buildProductPatchPayload,
  CATEGORIES,
  SHAPES,
  FACINGS,
} from "./ai-product-helpers"
import { AiProductFormFields } from "./ai-product-form-fields"
import { extractInitialFormValues, type InitialProductInput } from "./ai-product-initial"

interface AiProductEnrichmentModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  initialProduct: InitialProductInput
  onSuccess: () => void
}

export function AiProductEnrichmentModal({
  isOpen,
  onClose,
  productId,
  initialProduct,
  onSuccess,
}: AiProductEnrichmentModalProps) {
  const [values, setValues] = useState<ProductFormValues>({
    name: "",
    code: "",
    category: CATEGORIES[0] ?? "Bó hoa",
    shape: SHAPES[0] ?? "Tròn",
    facing: FACINGS[0] ?? "Một mặt",
    container: "",
    priceVnd: "",
    primaryColor: "",
    description: "",
    status: "ACTIVE",
    flowers: [],
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGeneratingContent, setIsGeneratingContent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [contentSuggestions, setContentSuggestions] = useState<string[]>([])

  useEffect(() => {
    if (!isOpen) return
    const { values: initValues, previewUrl } = extractInitialFormValues(initialProduct)
    setValues(initValues)
    setImagePreview(previewUrl)
    setImageFile(null)
    setNotice(null)
    setErrorMsg(null)
    setContentSuggestions([])
  }, [isOpen, initialProduct])

  if (!isOpen) return null

  const handleFieldChange = <K extends keyof ProductFormValues>(field: K, val: ProductFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: val }))
  }

  const handleImageFileSelected = (file: File) => {
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    handleFieldChange("imageAssetId", null)
    handleFieldChange("imageUrl", null)
    handleFieldChange("driveLink", null)
  }

  const handleRunAiAnalysis = async () => {
    setIsAnalyzing(true)
    setErrorMsg(null)
    setNotice(null)
    try {
      let assetId = values.imageAssetId
      if (imageFile) {
        setUploadingImage(true)
        const uploaded = await uploadImageFile(imageFile)
        assetId = uploaded.assetId
        handleFieldChange("imageAssetId", uploaded.assetId)
        handleFieldChange("imageUrl", uploaded.viewUrl)
        setUploadingImage(false)
      } else if (!assetId && (values.imageUrl || values.driveLink)) {
        // Tải ảnh từ đường dẫn hiện có (Proxy/Drive) lên kho lưu trữ để Vision AI phân tích
        setUploadingImage(true)
        const fetchUrl = values.imageUrl || (values.driveLink ? driveThumbProxySrc(values.driveLink) : null)
        if (fetchUrl) {
          try {
            const res = await fetch(fetchUrl)
            if (res.ok) {
              const blob = await res.blob()
              const file = new File([blob], `${values.code || "product"}.jpg`, {
                type: blob.type || "image/jpeg",
              })
              const uploaded = await uploadImageFile(file)
              assetId = uploaded.assetId
              handleFieldChange("imageAssetId", uploaded.assetId)
              handleFieldChange("imageUrl", uploaded.viewUrl)
            }
          } catch {
            /* bỏ qua nếu tải lỗi */
          }
        }
        setUploadingImage(false)
      }

      if (!assetId) {
        throw new Error("Vui lòng tải ảnh lên hoặc chọn mẫu hoa có ảnh trước khi bấm Phân tích AI.")
      }

      const vision = await callVisionExtract(assetId)
      const { updated, filledFieldsCount } = applyVisionToForm(vision, values)
      setValues(updated)

      setIsGeneratingContent(true)
      const flowersList = updated.flowers.filter((f) => f.name.trim()).map((f) => f.name).join(", ")
      const summaryContext = `Mẫu hoa ${updated.name || updated.category}, phối từ ${flowersList || "các loài hoa tươi tuyển chọn"}. Tông màu ${updated.primaryColor || "hài hòa"}. Kiểu dáng ${updated.shape}.`
      const suggestions = await callContentEngineMarketing(summaryContext, "luxurious")
      setContentSuggestions(suggestions)

      if (suggestions[0] && !updated.description.trim()) {
        updated.description = suggestions[0]
        setValues({ ...updated })
      }
      setIsGeneratingContent(false)

      setNotice(
        `Phân tích hoàn tất! Đã tự động điền ${filledFieldsCount} trường còn thiếu và tạo câu chuyện tiếp thị từ Content Engine.`
      )
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Đã xảy ra lỗi khi phân tích AI.")
    } finally {
      setIsAnalyzing(false)
      setUploadingImage(false)
      setIsGeneratingContent(false)
    }
  }

  const handleCallContentEngine = async (style: "luxurious" | "sweet" | "creative" | "concise") => {
    setIsGeneratingContent(true)
    try {
      const flowersList = values.flowers.filter((f) => f.name.trim()).map((f) => f.name).join(", ")
      const baseText = values.description.trim() || `Mẫu hoa ${values.name || values.category}, gồm ${flowersList || "hoa tươi"}.`
      const suggestions = await callContentEngineMarketing(baseText, style)
      setContentSuggestions(suggestions)
      if (suggestions[0] && !values.description.trim()) {
        handleFieldChange("description", suggestions[0])
      }
    } finally {
      setIsGeneratingContent(false)
    }
  }

  const handleSubmit = async () => {
    if (!values.name.trim()) {
      setErrorMsg("Vui lòng nhập tên mẫu hoa.")
      return
    }
    if (!values.code.trim()) {
      setErrorMsg("Vui lòng nhập mã sản phẩm (SKU).")
      return
    }


    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      let finalAssetId = values.imageAssetId
      let finalImageUrl = values.imageUrl
      if (imageFile) {
        const uploaded = await uploadImageFile(imageFile)
        finalAssetId = uploaded.assetId
        finalImageUrl = uploaded.viewUrl
      }

      const currentAttrs = (initialProduct.attributes as Record<string, unknown> | null) ?? {}
      const patchData = buildProductPatchPayload(values, currentAttrs, finalAssetId, finalImageUrl)

      const res = await fetch(`/api/v1/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchData),
      })

      const responseBody = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(responseBody?.error?.message || "Không lưu được sản phẩm, vui lòng kiểm tra lại thông tin và thử lại")
      }

      await new Promise((r) => setTimeout(r, 400))

      onSuccess()
      onClose()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Đã xảy ra lỗi khi lưu sản phẩm.")
    } finally {
      setIsSubmitting(false)
    }
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-surface border border-border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-title-sm font-bold text-text">Bảng thông số sản phẩm & Phân tích AI</h2>
              <p className="text-caption text-text-muted">Xem thông số và dùng AI để sinh đầy đủ nội dung còn thiếu</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isAnalyzing}
              onClick={handleRunAiAnalysis}
              className="flex items-center gap-1.5 border-primary/40 text-primary hover:bg-primary-muted font-bold"
            >
              {isAnalyzing ? (
                <Loader2 size={15} className="animate-spin text-primary" />
              ) : (
                <Sparkles size={15} className="text-primary" />
              )}
              <span>{isAnalyzing ? "Đang phân tích..." : "Phân tích thông số sản phẩm bằng AI"}</span>
            </Button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-surface-alt transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Thông báo */}
        {notice && (
          <div className="mx-5 mt-4 flex items-center gap-2 rounded-xl border border-success-border bg-success-bg p-3 text-body-sm font-medium text-success">
            <CheckCircle2 size={16} className="flex-shrink-0" />
            <span>{notice}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mx-5 mt-4 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger-bg p-3 text-body-sm font-medium text-danger">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Thân Form */}
        <div className="flex-1 overflow-y-auto p-5">
          <AiProductFormFields
            values={values}
            onChange={handleFieldChange}
            onImageFileSelected={handleImageFileSelected}
            onRemoveImage={handleRemoveImage}
            imagePreview={imagePreview}
            uploadingImage={uploadingImage}
            onCallContentEngine={handleCallContentEngine}
            isGeneratingContent={isGeneratingContent}
            contentSuggestions={contentSuggestions}
            onSelectSuggestion={(txt) => handleFieldChange("description", txt)}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-3.5 bg-surface-alt/50">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={isSubmitting} className="font-bold">
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              "Lưu thay đổi"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
