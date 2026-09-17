"use client"

import React, { useState } from "react"
import { X, UserPlus, Loader2, Sparkles, Phone, MapPin, Tag, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CreateCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateCustomerModal({ isOpen, onClose, onSuccess }: CreateCustomerModalProps) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [preferredFlowers, setPreferredFlowers] = useState("Hoa hồng, Baby")
  const [preferredColors, setPreferredColors] = useState("Pastel, Đỏ")
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim() || !phone.trim()) {
      setError("Vui lòng điền họ tên và số điện thoại khách hàng.")
      return
    }

    setLoading(true)
    try {
      const flowers = preferredFlowers.split(",").map((f) => f.trim()).filter(Boolean)
      const colors = preferredColors.split(",").map((c) => c.trim()).filter(Boolean)

      const res = await fetch("/api/v1/crm/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          notes: notes.trim() || undefined,
          preferredFlowers: flowers,
          preferredColors: colors,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Tạo khách hàng thất bại.")
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi tạo khách hàng.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-red-100 text-red-700">
              <UserPlus className="h-4 w-4" />
            </span>
            <h2 className="text-base font-bold text-foreground">Thêm Khách Hàng Mới (CRM M09)</h2>
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

          <div>
            <label className="mb-1 block font-semibold text-text-main">Họ và tên khách hàng *</label>
            <input
              type="text"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary"
              placeholder="Nguyễn Văn A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block font-semibold text-text-main">Số điện thoại *</label>
              <input
                type="text"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary"
                placeholder="0909xxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-text-main">Email (tùy chọn)</label>
              <input
                type="email"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary"
                placeholder="khachhang@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-text-main">Địa chỉ thường nhận hoa</label>
            <input
              type="text"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary"
              placeholder="Số nhà, đường, phường, quận..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block font-semibold text-text-main">Hoa yêu thích (phân cách bằng dấu phẩy)</label>
              <input
                type="text"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary"
                placeholder="Hồng đỏ, Baby, Tulip"
                value={preferredFlowers}
                onChange={(e) => setPreferredFlowers(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-text-main">Gu màu ưa thích</label>
              <input
                type="text"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary"
                placeholder="Pastel, Đỏ rực rỡ, Trắng kem"
                value={preferredColors}
                onChange={(e) => setPreferredColors(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-text-main">Ghi chú chăm sóc / Đặc điểm khách hàng</label>
            <textarea
              rows={2}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary"
              placeholder="Khách thích hoa sang trọng, hay tặng đối tác..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700 text-white font-semibold">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu khách hàng
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
