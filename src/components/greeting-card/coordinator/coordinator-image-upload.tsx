"use client"

import React, { useRef, useState } from "react"
import { Upload, X, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CoordinatorImageUploadProps {
  orderId: string
  endpoint: "product-photo" | "recipient-photo"
  label: string
  onSuccess: () => void
  onCancel: () => void
}

type UploadState = "idle" | "uploading" | "success" | "error"

export function CoordinatorImageUpload({
  orderId,
  endpoint,
  label,
  onSuccess,
  onCancel,
}: CoordinatorImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [state, setState] = useState<UploadState>("idle")
  const [errorMsg, setErrorMsg] = useState("")

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith("image/")) {
      setErrorMsg("Chỉ chấp nhận file ảnh (JPG, PNG, WEBP)")
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setErrorMsg("Ảnh không được vượt quá 10MB")
      return
    }
    setFile(f)
    setErrorMsg("")
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  async function handleUpload() {
    if (!file) return
    setState("uploading")
    setErrorMsg("")

    try {
      // Step 1: Lấy presigned upload URL từ hệ thống
      const urlRes = await fetch("/api/v1/assets/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mime_type: file.type }),
      })
      if (!urlRes.ok) throw new Error("Lỗi lấy địa chỉ upload ảnh")
      const urlData = await urlRes.json()
      const { asset_id, storage_key, upload_url } = urlData as {
        asset_id: string
        storage_key: string
        upload_url: string
      }
      if (!asset_id || !upload_url) throw new Error("Phản hồi upload URL không hợp lệ")

      // Step 2: PUT file trực tiếp lên presigned URL (S3-compatible)
      const putRes = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      })
      if (!putRes.ok) throw new Error("Lỗi tải ảnh lên kho lưu trữ")

      // Step 3: Đăng ký asset trong DB
      const registerRes = await fetch("/api/v1/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_id,
          storage_key,
          kind: "ORIGINAL",
          mime_type: file.type,
          file_size: file.size,
        }),
      })
      if (!registerRes.ok) throw new Error("Lỗi đăng ký ảnh trong hệ thống")

      // Step 4: Gắn asset vào đơn hàng
      const attachRes = await fetch(`/api/v1/greeting-card/orders/${orderId}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: asset_id }),
      })
      if (!attachRes.ok) {
        const errData = await attachRes.json().catch(() => ({}))
        throw new Error((errData as { error?: string })?.error || "Lỗi gắn ảnh vào đơn hàng")
      }

      setState("success")
      setTimeout(onSuccess, 1200)
    } catch (err) {
      setState("error")
      setErrorMsg(err instanceof Error ? err.message : "Lỗi không xác định")
    }
  }

  if (state === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 size={40} className="text-success" />
        <p className="text-body font-bold text-success">{label} đã được cập nhật!</p>
        <p className="text-body-sm text-text-muted">Khách hàng sẽ thấy ảnh trong vòng 15 giây.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body-sm text-text-muted">{label} — Chụp rõ nét, ánh sáng tốt.</p>

      {/* Drop zone */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
      >
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="w-full max-h-52 object-contain rounded-xl"
          />
        ) : (
          <>
            <Upload size={28} className="text-text-muted" />
            <span className="text-body-sm font-medium text-text-muted">
              Nhấn để chọn ảnh từ máy
            </span>
            <span className="text-caption text-text-muted">JPG, PNG, WEBP · Tối đa 10MB</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {errorMsg && (
        <div className="flex items-center gap-2 text-danger text-body-sm p-3 bg-danger-bg rounded-xl border border-danger/30">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} className="h-9 text-caption">
          <X size={14} className="mr-1" />
          Huỷ
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!file || state === "uploading"}
          onClick={handleUpload}
          className="h-9 text-caption"
        >
          {state === "uploading" ? "Đang tải lên..." : "Lưu ảnh"}
        </Button>
      </div>
    </div>
  )
}
