"use client"

import React from "react"
import {
  CheckCircle2,
  Clock,
  KeyRound,
  Lock,
  LogIn,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface PlatformConfig {
  id: string
  name: string
  icon: string
  tag: string
  description: string
  features: string[]
  badgeColor: string
}

export interface ConnectedAccountData {
  id?: number | string
  platform: string
  username: string
  is_logged_in: number | boolean
  last_login?: string | null
  organization_id?: string
  page_id?: string | null
  created_at?: string
}

export interface PlatformAccountCardProps {
  platform: PlatformConfig
  account?: ConnectedAccountData | undefined
  loadingAction?: string | null
  onConnect: (platformId: string) => void
  onLogin: (platformId: string) => void
  onCheck: (platformId: string) => void
  onEdit?: (platformId: string, currentUsername: string) => void
  onDisconnect: (platformId: string) => void
}

export function PlatformAccountCard({
  platform,
  account,
  loadingAction,
  onConnect,
  onLogin,
  onCheck,
  onEdit,
  onDisconnect,
}: PlatformAccountCardProps) {
  const isLoggedIn = !!account?.is_logged_in
  const isCurrentLoading = loadingAction === platform.id

  const formatLastLogin = (iso?: string | null) => {
    if (!iso) return "Chưa ghi nhận"
    try {
      const d = new Date(iso)
      if (isNaN(d.getTime())) return iso
      return `${d.toLocaleDateString("vi-VN")} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
    } catch {
      return iso
    }
  }

  return (
    <Card className="flex flex-col justify-between p-5 border border-border bg-surface hover:border-primary/40 transition-all shadow-xs">
      <div>
        {/* Card Header: Icon, Name & Status Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-surface-hover border border-border flex items-center justify-center text-2xl shadow-2xs flex-shrink-0">
              {platform.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold text-text">{platform.name}</span>
                <span className="text-[10px] font-semibold text-text-muted bg-surface-hover px-2 py-0.5 rounded-full border border-border">
                  {platform.tag}
                </span>
              </div>
              <div className="text-[12px] text-text-muted mt-0.5 leading-relaxed">
                {platform.description}
              </div>
            </div>
          </div>

          <div>
            {account ? (
              isLoggedIn ? (
                <Badge tone="success" className="text-[11px] gap-1 px-2.5 py-0.5">
                  <CheckCircle2 size={12} /> Sẵn sàng đăng
                </Badge>
              ) : (
                <Badge tone="danger" className="text-[11px] gap-1 px-2.5 py-0.5">
                  <Clock size={12} /> Cần đăng nhập lại
                </Badge>
              )
            ) : (
              <Badge tone="neutral" className="text-[11px] px-2.5 py-0.5">
                Chưa kết nối
              </Badge>
            )}
          </div>
        </div>

        {/* Feature Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/60">
          {platform.features.map((feat, idx) => (
            <span
              key={idx}
              className="text-[10.5px] text-text-muted bg-background/60 px-2 py-0.5 rounded-md border border-border/50"
            >
              • {feat}
            </span>
          ))}
        </div>

        {/* Account Details Box if connected */}
        {account && (
          <div className="mt-3.5 p-3 rounded-xl bg-background/80 border border-border/80 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-text-muted font-medium">Tài khoản liên kết:</span>
              <span className="font-bold text-text truncate max-w-[190px]">
                {account.username}
              </span>
            </div>

            {account.page_id && (
              <div className="flex items-center justify-between">
                <span className="text-text-muted font-medium">Fanpage ID:</span>
                <span className="font-semibold text-primary">{account.page_id}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-text-muted">
              <span>Phiên đăng nhập:</span>
              <span>{formatLastLogin(account.last_login)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3.5 border-t border-border flex items-center justify-between gap-2">
        {account ? (
          <>
            <div className="flex items-center gap-1.5">
              {!isLoggedIn && (
                <Button
                  size="sm"
                  onClick={() => onLogin(platform.id)}
                  disabled={isCurrentLoading}
                  className="text-xs font-bold gap-1 bg-primary text-white"
                >
                  <LogIn size={13} />
                  {isCurrentLoading ? "Đang mở trình duyệt..." : "Đăng nhập ngay"}
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => onCheck(platform.id)}
                disabled={isCurrentLoading}
                className="text-xs gap-1"
                title="Kiểm tra lại tính hợp lệ của phiên đăng nhập"
              >
                <RefreshCw size={12} className={isCurrentLoading ? "animate-spin" : ""} />
                Kiểm tra phiên
              </Button>

              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(platform.id, account.username)}
                  disabled={isCurrentLoading}
                  className="text-xs gap-1 hover:border-primary/50"
                  title="Cập nhật mật khẩu mới hoặc cấu hình tài khoản"
                >
                  <KeyRound size={12} className="text-primary" />
                  Đổi mật khẩu
                </Button>
              )}
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDisconnect(platform.id)}
              disabled={isCurrentLoading}
              className="text-xs text-danger hover:bg-danger/10 gap-1 h-8 px-2"
              title="Ngắt kết nối tài khoản này"
            >
              <Trash2 size={13} />
              Ngắt kết nối
            </Button>
          </>
        ) : (
          <div className="w-full flex items-center justify-between">
            <span className="text-[11.5px] text-text-muted flex items-center gap-1">
              <Lock size={12} /> Mã hóa an toàn AES-256
            </span>
            <Button
              size="sm"
              onClick={() => onConnect(platform.id)}
              className="text-xs font-bold gap-1"
            >
              + Thêm tài khoản
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
