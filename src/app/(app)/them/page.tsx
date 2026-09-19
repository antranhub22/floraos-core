"use client"

// "Thêm" — trước đây là màn "Sắp có". Nay là nơi tạo sản phẩm thủ công
// (POST /products, `L2`, đặc tả 06 mục 6) và lối tắt sang luồng tải ảnh
// (M01) — hai cách duy nhất hiện có để đưa một sản phẩm mới vào hệ thống.

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, ChevronRight, TrendingUp } from "lucide-react"
import { useSession } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function ThemPage() {
  const router = useRouter()
  const { can } = useSession()
  const coTheThemSanPham = can("L2")

  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [loi, setLoi] = useState<string | null>(null)
  const [dangGui, setDangGui] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoi(null)
    setDangGui(true)
    try {
      const res = await fetch("/api/v1/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, name, category: category || null }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setLoi(data?.error?.message ?? `Tạo sản phẩm thất bại (${res.status})`)
        return
      }
      router.push("/san-pham")
    } catch {
      setLoi("Không kết nối được máy chủ")
    } finally {
      setDangGui(false)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center border-b border-border bg-surface px-[18px] py-4">
        <div className="text-[17px] font-extrabold text-primary">Thêm</div>
      </div>

      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-4">
        <Card
          className="flex cursor-pointer items-center gap-3 p-3.5 hover:shadow-md"
          onClick={() => router.push("/tai-anh")}
        >
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-surface-alt">
            <Camera size={20} strokeWidth={1.8} className="text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-semibold">Tải ảnh, để AI nhận diện</div>
            <div className="text-xs text-text-muted">Phân tích ảnh sản phẩm (M01)</div>
          </div>
          <ChevronRight size={18} strokeWidth={2} className="text-text-muted" />
        </Card>

        <Card
          className="flex cursor-pointer items-center gap-3 p-3.5 hover:shadow-md"
          onClick={() => router.push("/market-intelligence")}
        >
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <TrendingUp size={20} strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[13.5px] font-semibold text-text">
              Nghiên cứu Thị trường & Xu hướng
              <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-extrabold text-rose-700">Mới</span>
            </div>
            <div className="text-xs text-text-muted">Google Trends, SerpApi, cơ hội viral</div>
          </div>
          <ChevronRight size={18} strokeWidth={2} className="text-text-muted" />
        </Card>

        {coTheThemSanPham ? (
          <Card className="flex flex-col gap-3.5 p-[18px]">
            <div className="text-[14.5px] font-bold">Hoặc nhập tay sản phẩm mới</div>

            {loi && (
              <div className="rounded-xl border-[1.5px] border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700">
                {loi}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <div className="mb-1.5 text-[13px] font-semibold">Mã sản phẩm</div>
                <input
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="VD: BHC-001"
                  className="h-11 w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <div className="mb-1.5 text-[13px] font-semibold">Tên sản phẩm</div>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Bó hồng đỏ 20 cành"
                  className="h-11 w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <div className="mb-1.5 text-[13px] font-semibold">Danh mục (tuỳ chọn)</div>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="VD: Bó hoa"
                  className="h-11 w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <Button type="submit" disabled={dangGui}>
                {dangGui ? "Đang tạo…" : "Tạo sản phẩm"}
              </Button>
            </form>
          </Card>
        ) : (
          <Card className="p-[18px] text-[13px] text-text-muted">
            Tài khoản này chưa có quyền tạo sản phẩm thủ công (cần năng lực L2).
          </Card>
        )}
      </div>
    </div>
  )
}
