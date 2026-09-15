"use client"

import React, { useState, useEffect } from "react"
import { Lock, X, ShieldCheck, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface ConnectAccountModalProps {
  platformId: string | null
  platformName: string
  initialUsername?: string
  isOpen: boolean
  isLoading: boolean
  onClose: () => void
  onSave: (payload: {
    platform: string
    username: string
    password: string
    page_id?: string | undefined
    page_access_token?: string | undefined
  }) => Promise<void>
}

export function ConnectAccountModal({
  platformId,
  platformName,
  initialUsername = "",
  isOpen,
  isLoading,
  onClose,
  onSave,
}: ConnectAccountModalProps) {
  const [username, setUsername] = useState(initialUsername)
  const [password, setPassword] = useState("")
  const [pageId, setPageId] = useState("")
  const [pageAccessToken, setPageAccessToken] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setUsername(initialUsername)
      setPassword("")
      setValidationError(null)
    }
  }, [isOpen, initialUsername])

  if (!isOpen || !platformId) return null

  const isFacebook = platformId === "facebook"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setValidationError("Vui lòng nhập đầy đủ tên đăng nhập/email và mật khẩu.")
      return
    }

    setValidationError(null)
    await onSave({
      platform: platformId,
      username: username.trim(),
      password: password.trim(),
      page_id: pageId.trim() || undefined,
      page_access_token: pageAccessToken.trim() || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Lock size={15} />
            </div>
            <div>
              <div className="text-[15px] font-extrabold text-text">
                {initialUsername ? `Cập Nhật Mật Khẩu ${platformName}` : `Kết Nối Tài Khoản ${platformName}`}
              </div>
              <div className="text-[11.5px] text-text-muted">
                {initialUsername
                  ? "Nhập mật khẩu mới để hệ thống lưu và khởi tạo lại phiên đăng nhập"
                  : "Lưu trữ xác thực tự động phục vụ xuất bản bài viết"}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {validationError && (
            <div className="p-3 rounded-xl bg-danger-bg border border-danger/30 text-xs font-semibold text-danger flex items-center gap-2">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Username / Email Field */}
          <div>
            <label className="block text-[11.5px] font-bold text-text mb-1">
              {platformId === "instagram"
                ? "Tên người dùng Instagram (@username)"
                : platformId === "zalo"
                ? "Số điện thoại / Email đăng nhập Zalo"
                : "Email / Tên đăng nhập"}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={
                platformId === "linkedin"
                  ? "tuans2@gmail.com"
                  : platformId === "instagram"
                  ? "tiemhoa_floraos"
                  : "taikhoan@gmail.com"
              }
              required
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-[11.5px] font-bold text-text mb-1">
              {initialUsername ? "Mật khẩu mới của tài khoản" : "Mật khẩu tài khoản"}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            {initialUsername && (
              <p className="text-[11px] text-text-muted mt-1">
                💡 Nhập mật khẩu mới nhất của bạn tại đây để hệ thống tự động cập nhật vào máy chủ.
              </p>
            )}
          </div>

          {/* Optional Fanpage settings for Facebook */}
          {isFacebook && (
            <div className="p-3 rounded-xl bg-background/60 border border-border/80 space-y-2.5">
              <div className="text-[11.5px] font-bold text-primary flex items-center gap-1.5">
                <span>📘 Cấu hình Fanpage (Tùy chọn nâng cao)</span>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-text-muted mb-0.5">
                  Facebook Fanpage ID
                </label>
                <input
                  type="text"
                  value={pageId}
                  onChange={(e) => setPageId(e.target.value)}
                  placeholder="Ví dụ: 104829104812345"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text placeholder:text-text-muted/60 focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-text-muted mb-0.5">
                  Page Access Token (Tùy chọn)
                </label>
                <input
                  type="password"
                  value={pageAccessToken}
                  onChange={(e) => setPageAccessToken(e.target.value)}
                  placeholder="EAAB..."
                  className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text placeholder:text-text-muted/60 focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="rounded-xl bg-surface-hover/70 p-3 border border-border/60 flex items-start gap-2.5 text-[11.5px] text-text-muted leading-relaxed">
            <ShieldCheck size={16} className="text-secondary flex-shrink-0 mt-0.5" />
            <div>
              Thông tin đăng nhập được mã hóa hai chiều bằng thuật toán <strong>AES-256</strong> trên máy chủ nội bộ. Hệ thống sử dụng phiên duyệt tự động (Playwright Session) để đăng bài mà không lưu mật khẩu thô.
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="text-xs font-bold gap-1 bg-primary text-white"
            >
              {isLoading ? "Đang lưu & Khởi tạo..." : "Lưu & Kết nối ngay"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
