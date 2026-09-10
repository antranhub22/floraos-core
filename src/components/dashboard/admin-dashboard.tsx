"use client"

import { useState } from "react"
import Link from "next/link"
import { Bell, ChevronRight, AlertTriangle } from "lucide-react"
import { useSession } from "@/lib/session"
import { PENDING_APPROVALS } from "@/lib/mock-data"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FlowerPlaceholder } from "@/components/ui/flower-placeholder"

export function AdminDashboard() {
  const { orgName, userInitials } = useSession()
  const [pending, setPending] = useState(PENDING_APPROVALS)

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-[18px] py-4">
        <div>
          <div className="text-xs text-text-muted">Điều hành</div>
          <div className="text-[17px] font-extrabold text-primary">{orgName}</div>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="relative flex h-9 w-9 items-center justify-center rounded-full bg-surface-alt text-text">
            <Bell size={18} strokeWidth={1.8} />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white">
            {userInitials}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-4">
        <Card className="flex flex-col gap-3 p-[18px]">
          <div className="flex items-center justify-between">
            <div className="text-[14.5px] font-bold">Hàng chờ duyệt · {pending.length} mục</div>
            <Link href="/duyet" className="text-[12.5px] font-semibold text-primary">
              Xem tất cả
            </Link>
          </div>

          {pending.length === 0 ? (
            <div className="py-3.5 text-center text-[13px] text-text-muted">
              Đã duyệt hết — không còn mục nào chờ.
            </div>
          ) : (
            pending.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{ background: item.tint }}
                >
                  <FlowerPlaceholder size={20} color={item.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-semibold">{item.name}</div>
                  <div className="text-xs text-text-muted">{item.meta}</div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="bg-success-bg text-primary"
                  onClick={() => setPending((cur) => cur.filter((p) => p.id !== item.id))}
                >
                  Duyệt
                </Button>
              </div>
            ))
          )}
        </Card>

        <Card className="flex flex-col gap-3.5 p-[18px]">
          <div className="text-[14.5px] font-bold">Job đang chạy và job lỗi</div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="text-[13.5px] font-semibold">Phân tích ảnh — Bình hoa để bàn</div>
              <div className="text-xs font-bold text-secondary-text">Đang chạy</div>
            </div>
            <Progress value={62} barClassName="bg-secondary" />
            <div className="text-xs text-text-muted">Bước 3/4 — Đối chiếu từ điển</div>
          </div>

          <div className="h-px bg-border" />

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-danger-bg">
              <AlertTriangle size={17} strokeWidth={2} className="text-danger" />
            </div>
            <div className="flex-1">
              <div className="text-[13.5px] font-semibold">Tối ưu ảnh — Kệ hoa khai trương</div>
              <div className="text-xs text-danger">Lỗi kết nối máy chủ xử lý ảnh</div>
            </div>
            <Button size="sm" variant="ghost" className="bg-surface-alt">
              Chạy lại
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col gap-3 p-[18px]">
          <div className="text-[14.5px] font-bold">Sản phẩm mới và thay đổi gần đây</div>
          {[
            { name: "Giỏ hoa chúc mừng", meta: "Vừa thêm · 2 giờ trước", tint: "#F1E4E7", color: "#E48692" },
            { name: "Lẵng hoa chia buồn", meta: "Sửa giá · hôm qua", tint: "#E7EEE6", color: "#5F9670" },
          ].map((p) => (
            <div key={p.name} className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg"
                style={{ background: p.tint }}
              >
                <FlowerPlaceholder size={20} color={p.color} />
              </div>
              <div className="flex-1">
                <div className="text-[13.5px] font-semibold">{p.name}</div>
                <div className="text-xs text-text-muted">{p.meta}</div>
              </div>
              <ChevronRight size={16} className="text-text-muted" />
            </div>
          ))}
        </Card>

        <Card className="flex flex-col gap-3 p-[18px]">
          <div className="flex items-center justify-between">
            <div className="text-[14.5px] font-bold">Mức dùng và hạn mức</div>
            <a href="#" className="text-[12.5px] font-semibold text-primary">
              Xem chi tiết
            </a>
          </div>
          <div>
            <div className="mb-1.5 flex justify-between text-[13px]">
              <span className="text-text-muted">Đã dùng tháng này</span>
              <span className="font-bold">128 / 500 credit</span>
            </div>
            <Progress value={25.6} />
          </div>
          <div className="flex gap-5">
            <div>
              <div className="text-xs text-text-muted">Phân tích ảnh</div>
              <div className="text-sm font-bold">80 credit</div>
            </div>
            <div>
              <div className="text-xs text-text-muted">Tối ưu ảnh</div>
              <div className="text-sm font-bold">48 credit</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
