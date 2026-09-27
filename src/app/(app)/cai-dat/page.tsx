"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import {
  Settings,
  Building2,
  Cpu,
  Share2,
  Server,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  MapPin,
  Store,
  Sparkles,
  Save,
} from "lucide-react"
import { useSession } from "@/lib/session"
import { useTenantProfile } from "@/lib/hooks/use-tenant-profile"
import { Button } from "@/components/ui/button"
import { SkeletonBlock } from "@/components/ui/skeleton"
import { FeatureGuidanceCard } from "@/components/templates/shared/feature-guidance-card"
import type { Route } from "next"

export default function CaiDatTiemPage() {
  const { orgName, can } = useSession()
  const canEdit = can("F2") || can("H4") // Quyền chỉnh sửa hồ sơ / điều hành

  const {
    business,
    loading,
    saving,
    error,
    successMessage,
    saveBusiness,
  } = useTenantProfile()

  const [displayName, setDisplayName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [openingHours, setOpeningHours] = useState("07:30 - 21:30")
  const [formDirty, setFormDirty] = useState(false)

  useEffect(() => {
    if (business) {
      setDisplayName(business.display_name || "")
      setPhone(business.phone || "")
      setAddress(business.address || "")
      const hours = business.operating_hours as { regular?: string } | null
      if (hours?.regular) {
        setOpeningHours(hours.regular)
      }
    }
  }, [business])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!business) return

    const ok = await saveBusiness({
      legal_name: business.legal_name,
      display_name: displayName.trim() || orgName || "Cửa Hàng Hoa",
      phone: phone.trim() || null,
      email: business.email,
      address: address.trim() || null,
      website: business.website,
      social_links: business.social_links,
      tax_code: business.tax_code,
      description: business.description,
      operating_hours: { regular: openingHours.trim() },
    })

    if (ok) {
      setFormDirty(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
      {/* 1. Hướng dẫn chuẩn hóa K1 */}
      <FeatureGuidanceCard
        badgeLabel="TRUNG TÂM CÀI ĐẶT TIỆM"
        badgeIcon={Settings}
        title="Cấu Hình Hoạt Động & Liên Kết Thiết Lập Chuyên Sâu"
        titleIcon={Store}
        description="Chỉnh sửa thông số cơ bản hiển thị trên hóa đơn, phiếu giao hàng và tin nhắn tư vấn tự động; đồng thời truy cập các khu vực cấu hình chuyên sâu của tiệm."
        tips={[
          "⚡ Tên tiệm, hotline và địa chỉ tự động đồng bộ sang Thẻ chào khách A6 và tin nhắn Zalo",
          "🔒 Cấu hình AI và Bộ máy phân tích chỉ dành cho nhân sự có thẩm quyền điều hành",
          "🌐 Kết nối tài khoản mạng xã hội để kích hoạt xuất bản bài đăng tự động đa kênh",
        ]}
      />

      {/* Thông báo trạng thái */}
      {error && (
        <div className="flex items-center gap-2 p-3 text-xs bg-warning-bg text-warning border border-warning/30 rounded-xl">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}
      {successMessage && (
        <div className="flex items-center gap-2 p-3 text-xs bg-success-bg text-primary border border-success-border rounded-xl">
          <CheckCircle2 size={15} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 2. Lưới liên kết sâu đến 4 phân hệ thiết lập */}
      <div>
        <h2 className="text-sm font-bold text-text uppercase tracking-wider mb-3">
          Liên Kết Thiết Lập Chuyên Sâu
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Link
            href={"/ho-so" as Route}
            className="p-4 rounded-2xl border border-border bg-surface hover:border-primary/40 hover:shadow-xs transition-all flex flex-col justify-between group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <div className="space-y-2">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Building2 size={18} />
              </div>
              <div className="text-sm font-bold text-text group-hover:text-primary transition-colors">
                Hồ Sơ & Thương Hiệu
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                5 mã màu hex, nhận diện thương hiệu, cam kết & dịp lễ.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary pt-2 border-t border-border/60">
              <span>Mở hồ sơ</span> <ArrowRight size={13} />
            </div>
          </Link>

          <Link
            href={"/cai-dat-ai" as Route}
            className="p-4 rounded-2xl border border-border bg-surface hover:border-primary/40 hover:shadow-xs transition-all flex flex-col justify-between group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <div className="space-y-2">
              <div className="h-9 w-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <Cpu size={18} />
              </div>
              <div className="text-sm font-bold text-text group-hover:text-accent transition-colors">
                Chính Sách AI
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Sàn bảo mật PII, trần chi phí credit & ưu tiên nhà cung cấp.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-accent pt-2 border-t border-border/60">
              <span>Quản trị AI</span> <ArrowRight size={13} />
            </div>
          </Link>

          <Link
            href={"/ket-noi" as Route}
            className="p-4 rounded-2xl border border-border bg-surface hover:border-primary/40 hover:shadow-xs transition-all flex flex-col justify-between group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <div className="space-y-2">
              <div className="h-9 w-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <Share2 size={18} />
              </div>
              <div className="text-sm font-bold text-text group-hover:text-accent transition-colors">
                Kênh Mạng Xã Hội
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Kết nối Facebook, Instagram, TikTok & Zalo OA.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-accent pt-2 border-t border-border/60">
              <span>Kết nối kênh</span> <ArrowRight size={13} />
            </div>
          </Link>

          <Link
            href={"/bo-may" as Route}
            className="p-4 rounded-2xl border border-border bg-surface hover:border-primary/40 hover:shadow-xs transition-all flex flex-col justify-between group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <div className="space-y-2">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Server size={18} />
              </div>
              <div className="text-sm font-bold text-text group-hover:text-primary transition-colors">
                Bộ Máy Phân Tích
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Động cơ nhận diện thị giác Vision Engine tổ chức.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary pt-2 border-t border-border/60">
              <span>Chọn bộ máy</span> <ArrowRight size={13} />
            </div>
          </Link>
        </div>
      </div>

      {/* 3. Form chỉnh sửa nhanh thông số cơ bản tại chỗ */}
      <div className="p-6 rounded-2xl border border-border bg-surface shadow-xs">
        <div className="mb-4">
          <h2 className="text-base font-extrabold text-text flex items-center gap-2">
            <Store size={18} className="text-primary" /> Thông Số Cơ Bản Của Tiệm
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Các trường thông tin dưới đây áp dụng tức thì cho hóa đơn, phiếu cắm hoa và kịch bản tư vấn.
          </p>
        </div>

        {loading ? (
          <div className="py-4">
            <SkeletonBlock lines={4} label="Đang tải thông số tiệm..." />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tên tiệm */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text flex items-center gap-1.5">
                  <Store size={13} className="text-text-muted" /> Tên tiệm hiển thị
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value)
                    setFormDirty(true)
                  }}
                  disabled={!canEdit || saving}
                  placeholder="Ví dụ: Tiệm Hoa Nắng Sài Gòn"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-text focus:outline-hidden focus:ring-1 focus:ring-primary disabled:opacity-60"
                  required
                />
              </div>

              {/* Hotline */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text flex items-center gap-1.5">
                  <Phone size={13} className="text-text-muted" /> Hotline / Zalo đặt hoa
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    setFormDirty(true)
                  }}
                  disabled={!canEdit || saving}
                  placeholder="Ví dụ: 0908 123 456"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-text focus:outline-hidden focus:ring-1 focus:ring-primary disabled:opacity-60"
                />
              </div>

              {/* Địa chỉ */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text flex items-center gap-1.5">
                  <MapPin size={13} className="text-text-muted" /> Địa chỉ cửa hàng
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value)
                    setFormDirty(true)
                  }}
                  disabled={!canEdit || saving}
                  placeholder="Ví dụ: 124 Nguyễn Đình Chiểu, P. Đa Kao, Q.1, TP.HCM"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-text focus:outline-hidden focus:ring-1 focus:ring-primary disabled:opacity-60"
                />
              </div>

              {/* Giờ mở cửa */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text flex items-center gap-1.5">
                  <Clock size={13} className="text-text-muted" /> Giờ phục vụ
                </label>
                <input
                  type="text"
                  value={openingHours}
                  onChange={(e) => {
                    setOpeningHours(e.target.value)
                    setFormDirty(true)
                  }}
                  disabled={!canEdit || saving}
                  placeholder="Ví dụ: 07:30 - 21:30 (Mở cửa tất cả các ngày)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-text focus:outline-hidden focus:ring-1 focus:ring-primary disabled:opacity-60"
                />
              </div>
            </div>

            {/* Nút lưu (K2: 1 primary action duy nhất) */}
            {canEdit && (
              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={saving || !formDirty}
                  className="text-xs font-bold gap-1.5 shadow-xs"
                >
                  <Save size={13} />
                  {saving ? "Đang lưu..." : "Lưu cài đặt tiệm"}
                </Button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
