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
  Users,
} from "lucide-react"
import { useSession } from "@/lib/session"
import { useTenantProfile } from "@/lib/hooks/use-tenant-profile"
import { Button } from "@/components/ui/button"
import { SkeletonBlock } from "@/components/ui/skeleton"
import { FeatureGuidanceCard } from "@/components/templates/shared/feature-guidance-card"
import { useI18n } from "@/lib/i18n"
import type { Route } from "next"

export default function CaiDatTiemPage() {
  const { orgName, can } = useSession()
  const { dict } = useI18n()
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
        badgeLabel={dict.settings.header.guidanceBadge}
        badgeIcon={Settings}
        title={dict.settings.header.guidanceTitle}
        titleIcon={Store}
        description="Chỉnh sửa tên cửa hàng, hotline, địa chỉ và giờ mở cửa. Những thông tin này tự động đồng bộ sang thẻ chào khách và tin nhắn Zalo."
        tips={[
          "⚡ Tên cửa hàng, hotline và địa chỉ đồng bộ sang Thẻ chào A6 và tin nhắn Zalo",
          "🔒 Thiết lập AI và kết nối mạng xã hội chỉ dành cho tài khoản Điều hành",
          "🌐 Liên kết tài khoản mạng xã hội để đăng bài tự động đa kênh",
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
          <Link
            href={"/ho-so" as Route}
            className="p-4 rounded-2xl border border-border bg-surface hover:border-primary/40 hover:shadow-xs transition-all flex flex-col justify-between group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <div className="space-y-2">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Building2 size={18} />
              </div>
              <div className="text-sm font-bold text-text group-hover:text-primary transition-colors">
                Hồ sơ và thương hiệu
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Logo, màu sắc thương hiệu, chính sách cọc, cam kết và dịp lễ.
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
                Thiết lập AI
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Bảo vệ thông tin khách hàng, giới hạn chi phí dùng AI và chọn nhà cung cấp AI.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-accent pt-2 border-t border-border/60">
              <span>Thiết lập AI</span> <ArrowRight size={13} />
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
                Kết nối mạng xã hội
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Kết nối Facebook, Instagram, TikTok và Zalo OA.
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
                Phân tích ảnh hoa
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Chọn cách AI nhận diện ảnh hoa cho toàn bộ cửa hàng.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary pt-2 border-t border-border/60">
              <span>Thiết lập nhận diện</span> <ArrowRight size={13} />
            </div>
          </Link>

          <Link
            href={"/cai-dat/thanh-vien" as Route}
            className="p-4 rounded-2xl border border-border bg-surface hover:border-primary/40 hover:shadow-xs transition-all flex flex-col justify-between group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <div className="space-y-2">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Users size={18} />
              </div>
              <div className="text-sm font-bold text-text group-hover:text-primary transition-colors">
                Thành viên và phân quyền
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Mời thành viên mới, phân vai trò và chi nhánh làm việc.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary pt-2 border-t border-border/60">
              <span>Quản lý thành viên</span> <ArrowRight size={13} />
            </div>
          </Link>
        </div>
      </div>

      {/* 3. Form chỉnh sửa nhanh thông số cơ bản tại chỗ */}
      <div className="p-6 rounded-2xl border border-border bg-surface shadow-xs">
        <div className="mb-4">
          <h2 className="text-base font-extrabold text-text flex items-center gap-2">
            <Store size={18} className="text-primary" /> Thông tin cơ bản của cửa hàng
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Các trường thông tin dưới đây áp dụng tức thì cho hóa đơn, phiếu cắm hoa và kịch bản tư vấn.
          </p>
        </div>

        {loading ? (
          <div className="py-4">
            <SkeletonBlock lines={4} label="Đang tải thông tin cửa hàng..." />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tên cửa hàng */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text flex items-center gap-1.5">
                  <Store size={13} className="text-text-muted" /> Tên cửa hàng
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
                  <Clock size={13} className="text-text-muted" /> Giờ mở cửa
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
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
