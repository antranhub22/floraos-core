"use client"

import React, { useState, useEffect } from "react"
import { Building2, Phone, Mail, MapPin, Globe, Clock, FileText, Check } from "lucide-react"
import type { BusinessProfileDetail } from "@/modules/profiles/use-cases/get-business-profile"
import type { UpsertBusinessProfileInput } from "@/modules/profiles/infra/business-profile-repository"

export interface BusinessProfileFormProps {
  initialData: BusinessProfileDetail | null
  onSave: (data: UpsertBusinessProfileInput) => Promise<boolean>
  saving: boolean
}

export function BusinessProfileForm({ initialData, onSave, saving }: BusinessProfileFormProps) {
  const [displayName, setDisplayName] = useState("")
  const [legalName, setLegalName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [website, setWebsite] = useState("")
  const [taxCode, setTaxCode] = useState("")
  const [description, setDescription] = useState("")
  const [openTime, setOpenTime] = useState("08:00")
  const [closeTime, setCloseTime] = useState("21:00")
  const [facebookUrl, setFacebookUrl] = useState("")
  const [zaloUrl, setZaloUrl] = useState("")
  const [instagramUrl, setInstagramUrl] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ lại form khi dữ liệu ban đầu (props) đổi, chủ đích
      setDisplayName(initialData.display_name || "")
      setLegalName(initialData.legal_name || "")
      setPhone(initialData.phone || "")
      setEmail(initialData.email || "")
      setAddress(initialData.address || "")
      setWebsite(initialData.website || "")
      setTaxCode(initialData.tax_code || "")
      setDescription(initialData.description || "")

      const hours = initialData.operating_hours as { open?: string; close?: string } | null
      if (hours?.open) setOpenTime(hours.open)
      if (hours?.close) setCloseTime(hours.close)

      const socials = initialData.social_links as { facebook?: string; zalo?: string; instagram?: string } | null
      if (socials?.facebook) setFacebookUrl(socials.facebook)
      if (socials?.zalo) setZaloUrl(socials.zalo)
      if (socials?.instagram) setInstagramUrl(socials.instagram)
    }
  }, [initialData])

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!displayName.trim()) {
      errs.displayName = "Tên hiển thị cửa hàng không được để trống"
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Định dạng email không hợp lệ"
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const payload: UpsertBusinessProfileInput = {
      display_name: displayName.trim(),
      legal_name: legalName.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      website: website.trim() || null,
      tax_code: taxCode.trim() || null,
      description: description.trim() || null,
      operating_hours: {
        open: openTime,
        close: closeTime,
      },
      social_links: {
        facebook: facebookUrl.trim() || null,
        zalo: zaloUrl.trim() || null,
        instagram: instagramUrl.trim() || null,
      },
    }

    await onSave(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Khối 1: Thông tin cơ bản & Pháp lý */}
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-border mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text">Thông tin pháp lý & Nhận diện</h3>
            <p className="text-xs text-text-muted">Tên thương hiệu xuất hiện trên hóa đơn, website và hợp đồng</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">
              Tên hiển thị cửa hàng <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ví dụ: Tiệm Hoa Tươi Thảo Mộc"
              className={`w-full rounded-xl border bg-surface px-3.5 py-2.5 text-xs sm:text-sm text-text transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                errors.displayName ? "border-red-500 ring-2 ring-red-500/10" : "border-border focus:border-primary"
              }`}
            />
            {errors.displayName && (
              <p className="mt-1 text-[11px] font-medium text-red-500">{errors.displayName}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">
              Tên pháp lý công ty / Hộ kinh doanh
            </label>
            <input
              type="text"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="Ví dụ: Công ty TNHH Hoa Tươi Việt Nam"
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs sm:text-sm text-text transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">
              Mã số thuế (nếu có)
            </label>
            <input
              type="text"
              value={taxCode}
              onChange={(e) => setTaxCode(e.target.value)}
              placeholder="0101234567"
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs sm:text-sm text-text transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">
              Mô tả ngắn gọn về cửa hàng
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Chuyên hoa sự kiện, hoa cưới, hoa sinh nhật thiết kế cao cấp"
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs sm:text-sm text-text transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      {/* Khối 2: Thông tin liên hệ & Kênh phân phối */}
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-border mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <Phone size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text">Kênh liên hệ & Đặt hoa</h3>
            <p className="text-xs text-text-muted">Tự động gắn vào Zalo scripts, Thẻ chào hàng A6 và nút bấm E-Catalog</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">
              Hotline / Số Zalo tư vấn chính
            </label>
            <div className="relative">
              <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912 345 678"
                className="w-full rounded-xl border border-border bg-surface pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-text transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">
              Email chăm sóc khách hàng
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@tiemhoathaomoc.vn"
                className={`w-full rounded-xl border bg-surface pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-text transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.email ? "border-red-500 ring-2 ring-red-500/10" : "border-border focus:border-primary"
                }`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-[11px] font-medium text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-text mb-1.5">
              Địa chỉ cửa hàng chính
            </label>
            <div className="relative">
              <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Số 123 Đường Hoa Hồng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"
                className="w-full rounded-xl border border-border bg-surface pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-text transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">
              Website cửa hàng (nếu có)
            </label>
            <div className="relative">
              <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://tiemhoathaomoc.vn"
                className="w-full rounded-xl border border-border bg-surface pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-text transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">
              Fanpage Facebook
            </label>
            <input
              type="text"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="https://facebook.com/tiemhoathaomoc"
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs sm:text-sm text-text transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      {/* Khối 3: Giờ vận hành */}
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-border mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <Clock size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text">Khung giờ mở cửa & Giao hoa</h3>
            <p className="text-xs text-text-muted">Hiển thị trên thông tin đặt hàng và trả lời tự động</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">
              Giờ mở cửa buổi sáng
            </label>
            <input
              type="time"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs sm:text-sm text-text transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">
              Giờ đóng cửa buổi tối
            </label>
            <input
              type="time"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs sm:text-sm text-text transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      {/* Nút lưu ở chân form */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold shadow-md hover:bg-primary/95 transition-all disabled:opacity-60"
        >
          <Check size={16} />
          <span>{saving ? "Đang lưu..." : "Lưu hồ sơ kinh doanh"}</span>
        </button>
      </div>
    </form>
  )
}
