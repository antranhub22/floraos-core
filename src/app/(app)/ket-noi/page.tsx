"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Share2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FeatureGuidanceCard } from "@/components/ui/feature-guidance-card"
import {
  PlatformAccountCard,
  ConnectAccountModal,
  type PlatformConfig,
  type ConnectedAccountData,
} from "@/components/templates/platform-connections"

const SUPPORTED_PLATFORMS: PlatformConfig[] = [
  {
    id: "facebook",
    name: "Facebook Fanpage",
    icon: "📘",
    tag: "Fanpage & Cộng đồng",
    description: "Đăng bài viết kèm album ảnh hoa tươi thiết kế, tiếp cận khách hàng trên Fanpage.",
    features: ["Đăng bài tự động", "Hỗ trợ nhiều ảnh", "Tương thích Fanpage ID"],
    badgeColor: "blue",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: "📸",
    tag: "Visual Grid & Reels",
    description: "Chia sẻ hình ảnh hoa nghệ thuật thẩm mỹ, reels hoa tươi và câu chuyện thương hiệu.",
    features: ["Đăng ảnh thẩm mỹ cao", "Gắn thẻ hashtag tự động", "Visual Branding"],
    badgeColor: "rose",
  },
  {
    id: "linkedin",
    name: "LinkedIn B2B",
    icon: "💼",
    tag: "Đối tác & Doanh nghiệp",
    description: "Xây dựng thương hiệu doanh nghiệp, giới thiệu hoa định kỳ văn phòng và quà tặng VIP.",
    features: ["Thought Leadership", "Kết nối đối tác B2B", "Đăng bài chuyên nghiệp"],
    badgeColor: "sky",
  },
  {
    id: "tiktok",
    name: "TikTok Video",
    icon: "🎵",
    tag: "Video ngắn xu hướng",
    description: "Phát sóng các video hậu trường cắm hoa, clip florist 30-45 giây thu hút giới trẻ.",
    features: ["Kịch bản quay 30s", "Format Hook-Body-CTA", "Âm thanh xu hướng"],
    badgeColor: "purple",
  },
  {
    id: "zalo",
    name: "Zalo Official Account",
    icon: "💬",
    tag: "Tư vấn & Chăm sóc 1-chạm",
    description: "Gửi tin nhắn chào mẫu hoa mới, báo giá ưu đãi và tư vấn khách hàng cá nhân hóa.",
    features: ["Tin nhắn tư vấn 1-chạm", "Báo giá nhanh chóng", "Chăm sóc khách VIP"],
    badgeColor: "blue",
  },
]

export default function PlatformConnectionsPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<ConnectedAccountData[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [modalPlatform, setModalPlatform] = useState<string | null>(null)
  const [editingUsername, setEditingUsername] = useState<string>("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [notification, setNotification] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  // Tải lại danh sách tài khoản
  const reloadAccounts = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch("/api/v1/proxy/api/accounts?client=SOCIALFLOW")
      if (res.ok) {
        const data = await res.json()
        setAccounts(data.accounts || [])
      }
    } catch {
      // Offline fallback
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        const res = await fetch("/api/v1/proxy/api/accounts?client=SOCIALFLOW")
        if (res.ok && !ignore) {
          const data = await res.json()
          setAccounts(data.accounts || [])
        }
      } catch {
        // Offline fallback
      }
    }
    void load()
    return () => {
      ignore = true
    }
  }, [])

  const showToast = (type: "success" | "error", message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  // Mở modal kết nối mới
  const handleOpenConnect = (platformId: string) => {
    setModalPlatform(platformId)
    setEditingUsername("")
  }

  // Mở modal cập nhật mật khẩu cho tài khoản hiện có
  const handleEditAccount = (platformId: string, currentUsername: string) => {
    setModalPlatform(platformId)
    setEditingUsername(currentUsername)
  }

  // Lưu thông tin tài khoản và kích hoạt đăng nhập
  const handleSaveAccount = async (payload: {
    platform: string
    username: string
    password: string
    page_id?: string | undefined
    page_access_token?: string | undefined
  }) => {
    setActionLoading(payload.platform)
    try {
      const res = await fetch("/api/v1/proxy/api/accounts?client=SOCIALFLOW", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.detail || "Không thể lưu thông tin tài khoản.")
      }

      setModalPlatform(null)
      showToast("success", `Đã lưu tài khoản ${payload.platform}. Đang bắt đầu đăng nhập...`)

      // Tự động kích hoạt đăng nhập trình duyệt
      await handleLogin(payload.platform)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi lưu thông tin tài khoản."
      showToast("error", msg)
    } finally {
      setActionLoading(null)
      await reloadAccounts()
    }
  }

  // Mở trình duyệt Playwright để đăng nhập
  const handleLogin = async (platformId: string) => {
    setActionLoading(platformId)
    showToast("success", `Đang khởi chạy phiên đăng nhập cho ${platformId}...`)
    try {
      const res = await fetch(`/api/v1/proxy/api/accounts/${platformId}/login?client=SOCIALFLOW`, {
        method: "POST",
      })
      const data = await res.json()
      if (res.ok && data.success) {
        showToast("success", `Đăng nhập thành công tài khoản ${platformId}! Phiên đã được lưu.`)
      } else {
        showToast(
          "error",
          data.message || `Đăng nhập ${platformId} thất bại. Vui lòng kiểm tra lại tài khoản hoặc 2FA.`
        )
      }
    } catch {
      showToast("error", `Lỗi kết nối máy chủ khi đăng nhập ${platformId}.`)
    } finally {
      setActionLoading(null)
      await reloadAccounts()
    }
  }

  // Kiểm tra phiên đăng nhập
  const handleCheckSession = async (platformId: string) => {
    setActionLoading(platformId)
    try {
      const res = await fetch(`/api/v1/proxy/api/accounts/${platformId}/check?client=SOCIALFLOW`, {
        method: "POST",
      })
      const data = await res.json()
      if (res.ok && data.logged_in) {
        showToast("success", `Phiên đăng nhập ${platformId} đang hoạt động bình thường!`)
      } else {
        showToast("error", `Phiên ${platformId} đã hết hạn. Vui lòng bấm Đăng nhập lại.`)
      }
    } catch {
      showToast("error", `Lỗi kiểm tra phiên ${platformId}.`)
    } finally {
      setActionLoading(null)
      await reloadAccounts()
    }
  }

  // Ngắt kết nối tài khoản
  const handleDisconnect = async (platformId: string) => {
    if (!confirm(`Bạn có chắc chắn muốn ngắt kết nối tài khoản ${platformId}?`)) return

    setActionLoading(platformId)
    try {
      const res = await fetch(`/api/v1/proxy/api/accounts/${platformId}?client=SOCIALFLOW`, {
        method: "DELETE",
      })
      if (res.ok) {
        showToast("success", `Đã ngắt kết nối tài khoản ${platformId}.`)
      } else {
        showToast("error", `Không thể ngắt kết nối tài khoản ${platformId}.`)
      }
    } catch {
      showToast("error", `Lỗi kết nối khi ngắt kết nối ${platformId}.`)
    } finally {
      setActionLoading(null)
      await reloadAccounts()
    }
  }

  const activeModalConfig = SUPPORTED_PLATFORMS.find((p) => p.id === modalPlatform)
  const connectedCount = accounts.filter((a) => a.is_logged_in).length

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background p-6 space-y-6">
      {/* Header Trang */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <Share2 size={13} className="text-primary" />
            SocialFlow M07 · Tích Hợp Đa Nền Tảng
          </div>
          <h1 className="text-xl font-black text-text mt-0.5">
            Kết Nối Nền Tảng Mạng Xã Hội
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Quản lý và đồng bộ tài khoản mạng xã hội để đăng bài hoa tươi tự động cho tổ chức
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone="success" className="text-xs px-2.5 py-1">
            <CheckCircle2 size={13} />
            <strong>{connectedCount}</strong> / {SUPPORTED_PLATFORMS.length} đã kích hoạt
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => reloadAccounts()}
            disabled={refreshing}
            className="text-xs gap-1"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            Làm mới
          </Button>
          <Button
            size="sm"
            onClick={() => router.push("/lich-dang" as never)}
            className="text-xs font-bold gap-1 bg-primary text-white"
          >
            <Calendar size={13} />
            Bảng lịch đăng
            <ArrowRight size={13} />
          </Button>
        </div>
      </div>

      {/* Thông báo thao tác */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 animate-in fade-in ${
            notification.type === "success"
              ? "bg-success-bg border-success/30 text-secondary"
              : "bg-danger-bg border-danger/30 text-danger"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 size={16} className="text-success flex-shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-danger flex-shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Feature Guidance Card chuẩn SSOT */}
      <FeatureGuidanceCard
        tag="HƯỚNG DẪN KẾT NỐI TÀI KHOẢN MẠNG XÃ HỘI"
        title="Quản Lý Kết Nối & Xác Thực Tự Động Qua SocialFlow"
        description="Đăng ký tài khoản các nền tảng mạng xã hội của cửa hàng hoa. Hệ thống tự động khởi tạo và duy trì phiên đăng nhập an toàn để bạn có thể xuất bản bài viết 1-chạm mà không cần đăng nhập lại thủ công."
        tips={[
          "🔐 Mật khẩu được mã hóa an toàn hai chiều bằng chuẩn AES-256 nội bộ tại máy chủ.",
          "⚡ Trình duyệt Playwright tự động chạy để bạn hoàn tất đăng nhập và vượt qua kiểm tra bảo mật (2FA / Checkpoint).",
          "📅 Sau khi kết nối, các bài viết tạo từ tab 'Sinh Nội Dung' có thể phát sóng ngay sang Facebook, Instagram, LinkedIn, TikTok và Zalo OA.",
          "🔄 Nếu tài khoản bị đăng xuất ngoài ý muốn, bạn chỉ cần bấm 'Đăng nhập ngay' để cập nhật lại phiên.",
        ]}
      />

      {/* Danh sách các nền tảng mạng xã hội */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SUPPORTED_PLATFORMS.map((platform) => {
          const acc = accounts.find((a) => a.platform.toLowerCase() === platform.id.toLowerCase())
          return (
            <PlatformAccountCard
              key={platform.id}
              platform={platform}
              account={acc}
              loadingAction={actionLoading}
              onConnect={handleOpenConnect}
              onLogin={handleLogin}
              onCheck={handleCheckSession}
              onEdit={handleEditAccount}
              onDisconnect={handleDisconnect}
            />
          )
        })}
      </div>

      {/* Modal nhập tài khoản */}
      {activeModalConfig && (
        <ConnectAccountModal
          platformId={activeModalConfig.id}
          platformName={activeModalConfig.name}
          initialUsername={editingUsername}
          isOpen={!!modalPlatform}
          isLoading={actionLoading === modalPlatform}
          onClose={() => {
            setModalPlatform(null)
            setEditingUsername("")
          }}
          onSave={handleSaveAccount}
        />
      )}
    </div>
  )
}
