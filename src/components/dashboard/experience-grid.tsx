"use client"

import { useState } from "react"
import {
  BookOpen,
  ChevronRight,
  ExternalLink,
  Image as ImageIcon,
  Info,
  LayoutTemplate,
  Lock,
  Rss,
  ScanSearch,
  Sparkles,
  Tag,
  Search,
  X,
  type LucideIcon,
} from "lucide-react"
import { useSession } from "@/lib/session"
import { EXPERIENCE_MODULES, EXTERNAL_MODULES, TRIAL_LIMIT } from "@/lib/mock-data"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

type ModuleId = (typeof EXPERIENCE_MODULES)[number]["id"]

const MODULE_ICONS: Record<ModuleId, LucideIcon> = {
  m01: ScanSearch,
  m04a: Sparkles,
  m02: Tag,
  m03: Search,
}

type ExternalModuleId = (typeof EXTERNAL_MODULES)[number]["id"]

const EXTERNAL_MODULE_ICONS: Record<ExternalModuleId, LucideIcon> = {
  m04b: ImageIcon,
  m07: Rss,
  m05: LayoutTemplate,
  m06: BookOpen,
}

// URL sản phẩm ngoài — cấu hình qua biến môi trường khi đã có bản triển khai
// thật của LocalBudd/SocialFlow. Để trống thì thẻ vẫn hiện, bấm vào chỉ báo
// rõ sản phẩm nào đang giữ chức năng này thay vì mở liên kết chết.
const PRODUCT_URLS: Record<string, string | undefined> = {
  SocialFlow: process.env.NEXT_PUBLIC_SOCIALFLOW_URL,
  LocalBudd: process.env.NEXT_PUBLIC_LOCALBUDD_URL,
}

export function ExperienceGrid() {
  const { orgName, userInitials } = useSession()
  const [remaining, setRemaining] = useState(TRIAL_LIMIT)
  const [noticeId, setNoticeId] = useState<ExternalModuleId | null>(null)

  const isLocked = remaining <= 0

  function spendTrialCredits(costPerUse: number) {
    if (costPerUse === 0) return
    setRemaining((cur) => Math.max(0, cur - costPerUse))
  }

  function openExternal(mod: (typeof EXTERNAL_MODULES)[number]) {
    const url = PRODUCT_URLS[mod.product]
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer")
      return
    }
    setNoticeId(mod.id)
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
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white">
          {userInitials}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-[18px] overflow-y-auto p-[18px]">
        <Card className="flex flex-col gap-2.5 border-none bg-surface-alt p-4">
          <div className="flex items-baseline justify-between">
            <div className="text-[13.5px] font-bold">Hạn mức dùng thử</div>
            <div className="text-[13px] font-bold text-primary">
              {remaining}/{TRIAL_LIMIT} lượt
            </div>
          </div>
          <Progress value={(remaining / TRIAL_LIMIT) * 100} />
          <a href="#" className="w-fit text-[12.5px] font-bold text-accent">
            Chuyển sang tổ chức thật →
          </a>
        </Card>

        <div>
          <div className="mb-0.5 text-[15px] font-extrabold">Chọn chức năng để bắt đầu</div>
          <div className="text-[12.5px] text-text-muted">Bấm thẻ nào cũng được — không bắt theo thứ tự</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {EXPERIENCE_MODULES.map((mod) => {
            const Icon = MODULE_ICONS[mod.id]
            const left = mod.costPerUse > 0 ? Math.floor(remaining / mod.costPerUse) : null
            const dimmed = left !== null && left <= 0
            return (
              <div
                key={mod.id}
                className={cn(
                  "flex flex-col gap-2.5 rounded-2xl border border-border bg-surface p-3.5 transition-shadow hover:shadow-md",
                  dimmed && "opacity-45"
                )}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-alt">
                  <Icon size={22} strokeWidth={1.8} className="text-primary" />
                </div>
                <div>
                  <div className="text-[13.5px] font-bold">{mod.name}</div>
                  <div className="mt-0.5 text-xs leading-snug text-text-muted">{mod.desc}</div>
                </div>
                <div className="mt-0.5 flex items-center justify-between">
                  <span className={cn("text-[11.5px] font-bold", dimmed ? "text-danger" : "text-secondary-text")}>
                    {left === null ? "Không giới hạn" : dimmed ? "Hết lượt" : `Còn ${left} lượt`}
                  </span>
                  <button
                    type="button"
                    disabled={dimmed}
                    onClick={() => spendTrialCredits(mod.costPerUse)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronRight size={17} strokeWidth={2.4} color="#fff" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div>
          <div className="mb-0.5 text-[15px] font-extrabold">Chức năng khác trong hệ sinh thái FloraOS</div>
          <div className="text-[12.5px] text-text-muted">Chạy trên sản phẩm riêng, mở sang khi bấm vào</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {EXTERNAL_MODULES.map((mod) => {
            const Icon = EXTERNAL_MODULE_ICONS[mod.id]
            return (
              <div
                key={mod.id}
                className="flex flex-col gap-2.5 rounded-2xl border border-dashed border-border bg-surface-alt/60 p-3.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface">
                    <Icon size={22} strokeWidth={1.8} className="text-text-muted" />
                  </div>
                  <span className="rounded-full bg-surface px-2 py-0.5 text-[10.5px] font-bold text-text-muted">
                    {mod.product}
                  </span>
                </div>
                <div>
                  <div className="text-[13.5px] font-bold">{mod.name}</div>
                  <div className="mt-0.5 text-xs leading-snug text-text-muted">{mod.desc}</div>
                </div>
                <button
                  type="button"
                  onClick={() => openExternal(mod)}
                  className="mt-0.5 flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface text-[12.5px] font-bold text-primary"
                >
                  Mở sang {mod.product}
                  <ExternalLink size={14} strokeWidth={2.2} />
                </button>
                {noticeId === mod.id && (
                  <div className="flex items-start gap-1.5 rounded-lg bg-surface px-2.5 py-2">
                    <Info size={13} strokeWidth={1.8} className="mt-0.5 flex-shrink-0 text-text-muted" />
                    <div className="flex-1 text-[11.5px] leading-snug text-text-muted">
                      Chưa nối bản demo {mod.product} — điền URL vào biến môi trường để nút này mở thật.
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
            <Lock size={20} strokeWidth={1.8} className="text-warning" />
            <div className="flex-1 text-[12.5px] leading-snug text-[#7A5320]">
              Đã dùng hết hạn mức dùng thử. Chuyển sang tổ chức thật để tiếp tục.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
