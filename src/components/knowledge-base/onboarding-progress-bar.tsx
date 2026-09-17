"use client"

import React from "react"
import { CheckCircle2, Circle, Sparkles, ShieldCheck } from "lucide-react"

interface OnboardingStep {
  id: string
  title: string
  completed: boolean
  route: string
}

export function OnboardingProgressBar() {
  const steps: OnboardingStep[] = [
    { id: "s1", title: "M01: Duyệt BOM cành hoa", completed: true, route: "/tai-anh" },
    { id: "s2", title: "M02: Cài giá sàn & markup", completed: true, route: "/san-pham" },
    { id: "s3", title: "M04c: Dựng video 9:16", completed: true, route: "/video" },
    { id: "s4", title: "M06: Tải mã QR E-Catalog", completed: true, route: "/catalog" },
    { id: "s5", title: "M08: Kích hoạt kênh Chat AI", completed: true, route: "/hoi-thoai/kenh-tich-hop" },
    { id: "s6", title: "M09: Nạp khách & ngày kỷ niệm", completed: true, route: "/khach-hang" },
    { id: "s7", title: "M10: In phiếu xưởng ẩn giá", completed: true, route: "/don-hang" },
  ]

  const completedCount = steps.filter((s) => s.completed).length
  const percent = Math.round((completedCount / steps.length) * 100)

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-100 text-green-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-extrabold text-foreground flex items-center gap-2">
              Tiến Độ Khởi Tạo Dữ Liệu Cửa Hàng (Commercial-Ready)
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10.5px] font-bold text-green-800">
                100% Sẵn Sàng
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Đã hoàn thành {completedCount}/{steps.length} tiêu chuẩn nhập liệu cốt lõi của FloraOS
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xl font-black text-green-600">{percent}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500 rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* 7 Checkpoints */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
        {steps.map((step) => (
          <div
            key={step.id}
            className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/50 p-2 text-[11px] font-medium"
          >
            {step.completed ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            <span className="truncate text-foreground font-semibold">{step.title}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
