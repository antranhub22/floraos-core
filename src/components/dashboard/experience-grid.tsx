"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronRight,
  Info,
  X,
  Menu,
  X as XIcon,
  Zap,
  ScanSearch,
  Sparkles,
  Video,
  FileText,
  Rss,
  LayoutGrid,
  Users,
  Package,
  MessageCircle,
  BarChart3,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"
import { useSession } from "@/lib/session"
import { FEATURES, TRIAL_LIMIT, STATUS_META, type ModuleStatus } from "@/lib/mock-data"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { UserMenu } from "@/components/layout/user-menu"
import { cn } from "@/lib/utils"

type FeatureIdType = (typeof FEATURES)[number]["id"]

const FEATURE_ICONS: Record<FeatureIdType, LucideIcon> = {
  "phân-tích-sản-phẩm": ScanSearch,
  "creative-studio": Sparkles,
  "video-studio": Video,
  "market-intelligence": TrendingUp,
  "content-engine": FileText,
  "social-publishing": Rss,
  "catalog-website": LayoutGrid,
  "crm-khách-hàng": Users,
  "đơn-hàng-vận-hành": Package,
  "chat-assistant": MessageCircle,
  "analytics-learning": BarChart3,
  "ai-features": Zap,
}

function StatusBadge({ status }: { status: ModuleStatus }) {
  const meta = STATUS_META[status]
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-bold",
        meta.bgClass,
        meta.textClass
      )}
    >
      <span className={cn("h-1.5 w-1.5 flex-shrink-0 rounded-full", meta.dotClass)} />
      {meta.label}
    </span>
  )
}

function routeForFeature(id: FeatureIdType): string | null {
  for (const f of FEATURES) {
    if (f.id === id && f.route && !f.disabled) return f.route
  }
  return null
}

export function ExperienceGrid() {
  const router = useRouter()
  const { orgName, userInitials } = useSession()
  const [remaining, setRemaining] = useState(TRIAL_LIMIT)
  const [noticeId, setNoticeId] = useState<FeatureIdType | null>(null)
  const [hienThongBaoNangCap, setHienThongBaoNangCap] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const isLocked = remaining <= 0

  function spendTrialCredits(costPerUse: number) {
    if (costPerUse === 0) return
    setRemaining((cur) => Math.max(0, cur - costPerUse))
  }

  function openFeature(mod: (typeof FEATURES)[number]) {
    if (mod.disabled) {
      setNoticeId((cur) => (cur === mod.id ? null : mod.id))
      return
    }
    const route = routeForFeature(mod.id)
    if (route) {
      spendTrialCredits(1)
      router.push(route as never)
      return
    }
    setNoticeId((cur) => (cur === mod.id ? null : mod.id))
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-[18px] py-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-[17px] font-extrabold text-primary">{orgName}</div>
            <span className="rounded-full bg-[#FBEAEC] px-2 py-0.5 text-[11px] font-bold text-[#B45566]">
              Đang dùng thử
            </span>
          </div>
          <div className="mt-0.5 text-xs text-text-muted">Workspace trải nghiệm</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-text hover:bg-surface-alt md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? <XIcon size={20} /> : <Menu size={20} />}
          </button>
          <UserMenu initials={userInitials} />
        </div>
      </div>

      {menuOpen && (
        <div className="flex-shrink-0 border-b border-border bg-surface px-[18px] py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {FEATURES.map((mod) => {
              const Icon = FEATURE_ICONS[mod.id]
              const route = routeForFeature(mod.id)
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    openFeature(mod)
                  }}
                  disabled={mod.disabled}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-left text-[13.5px] font-medium transition-colors",
                    mod.disabled && "opacity-40 cursor-not-allowed",
                    !mod.disabled && route && "hover:bg-surface-alt",
                    !route && "text-text-muted"
                  )}
                >
                  <Icon size={18} strokeWidth={1.8} className="text-primary" />
                  <span className="flex-1">{mod.name}</span>
                  <StatusBadge status={mod.status ?? "chua_co"} />
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-[18px] overflow-y-auto p-[18px]">
        <Card className="flex flex-col gap-2.5 border-none bg-surface-alt p-4">
          <div className="flex items-baseline justify-between">
            <div className="text-[13.5px] font-bold">Hạn mức dùng thử</div>
            <div className="text-[13px] font-bold text-primary">
              {remaining}/{TRIAL_LIMIT} lượt
            </div>
          </div>
          <Progress value={(remaining / TRIAL_LIMIT) * 100} />
          <button
            type="button"
            onClick={() => setHienThongBaoNangCap((v) => !v)}
            className="w-fit text-[12.5px] font-bold text-accent"
          >
            Chuyển sang tổ chức thật →
          </button>
          {hienThongBaoNangCap && (
            <div className="flex items-start gap-1.5 rounded-lg bg-surface px-2.5 py-2">
              <Info size={13} strokeWidth={1.8} className="mt-0.5 flex-shrink-0 text-text-muted" />
              <div className="flex-1 text-[11.5px] leading-snug text-text-muted">
                Bản hiện tại chưa hỗ trợ tự chuyển đổi — liên hệ quản trị hệ thống để nâng cấp tổ chức.
              </div>
              <button
                type="button"
                onClick={() => setHienThongBaoNangCap(false)}
                className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-surface-alt"
              >
                <X size={12} strokeWidth={2.2} />
              </button>
            </div>
          )}
        </Card>

        <div>
          <div className="mb-0.5 text-[15px] font-extrabold">Chọn chức năng để bắt đầu</div>
          <div className="text-[12.5px] text-text-muted">Bấm thẻ nào cũng được — không bắt theo thứ tự</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map((mod) => {
            const Icon = FEATURE_ICONS[mod.id]
            const disabled = mod.disabled === true
            const route = routeForFeature(mod.id)
            const isWaiting = mod.waiting === true

            return (
              <div
                key={mod.id}
                onClick={() => openFeature(mod)}
                className={cn(
                  "flex flex-col gap-2.5 rounded-2xl border border-border bg-surface p-3.5 transition-shadow hover:shadow-md cursor-pointer",
                  disabled && "opacity-45 cursor-not-allowed"
                )}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-alt">
                  <Icon size={22} strokeWidth={1.8} className={cn("text-primary", disabled && "opacity-50")} />
                </div>
                <div>
                  <div className="text-[13.5px] font-bold">{mod.name}</div>
                  <div className="mt-0.5 text-xs leading-snug text-text-muted">{mod.desc}</div>
                </div>
                <StatusBadge status={mod.status ?? "chua_co"} />
                {isWaiting && (
                  <div className="text-[10.5px] font-bold text-accent">
                    ● Đang chờ xử lý
                  </div>
                )}
                <div className="mt-0.5 flex items-center justify-between">
                  <span className={cn("text-[11.5px] font-bold", disabled ? "text-text-muted" : "text-secondary-text")}>
                    {disabled ? "Sắp có" : route ? "Mở ngay" : "Chưa có"}
                  </span>
                  <button
                    type="button"
                    disabled={disabled || !route}
                    onClick={(e) => {
                      e.stopPropagation()
                      openFeature(mod)
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronRight size={17} strokeWidth={2.4} color="#fff" />
                  </button>
                </div>
                {noticeId === mod.id && (
                  <div className="flex items-start gap-1.5 rounded-lg bg-surface-alt px-2.5 py-2">
                    <Info size={13} strokeWidth={1.8} className="mt-0.5 flex-shrink-0 text-text-muted" />
                    <div className="flex-1 text-[11.5px] leading-snug text-text-muted">
                      {mod.disabled
                        ? "Tính năng này đang phát triển. Sắp có mặt trong bản sắp tới."
                        : mod.status === "chua_co"
                          ? "Chưa có màn hình cho chức năng này trong bản hiện tại."
                          : mod.status === "chua_san_sang"
                            ? "Module đang phát triển. Chức năng sẽ có trong bản sắp tới."
                            : "Chưa có màn thao tác cho chức năng này trong bản hiện tại."}
                    </div>
                    <button
                      type="button"
                      onClick={() => setNoticeId(null)}
                      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-surface-alt"
                    >
                      <X size={12} strokeWidth={2.2} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {isLocked && (
          <div className="flex items-center gap-3 rounded-2xl bg-warning-bg p-3.5">
            <Zap size={20} strokeWidth={1.8} className="text-warning" />
            <div className="flex-1 text-[12.5px] leading-snug text-[#7A5320]">
              Đã dùng hết hạn mức dùng thử. Chuyển sang tổ chức thật để tiếp tục.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
