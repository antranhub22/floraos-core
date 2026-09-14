"use client"

import Link from "next/link"
import { AccountStorageHub } from "@/components/storage/account-storage-hub"
import { Button } from "@/components/ui/button"
import { Camera, Plus, Sparkles, Folder } from "lucide-react"

export default function KhoDuLieuPage() {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-6 max-w-7xl mx-auto w-full">
      {/* Top Header Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-sm">
            <Folder size={22} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-text">Kho Dữ Liệu Sản Phẩm</h1>
            <p className="text-[13px] text-text-muted mt-0.5">
              Kho lưu trữ trung tâm phân loại 3 phân vùng độc lập cho tài khoản của bạn.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/tai-anh">
            <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold h-10 px-4 shadow-sm">
              <Camera size={16} strokeWidth={2} />
              + Tải ảnh mới để phân tích
            </Button>
          </Link>
        </div>
      </div>

      {/* Main 3-Partition Storage Hub */}
      <AccountStorageHub initialTab="approved" />
    </div>
  )
}
