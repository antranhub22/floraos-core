"use client"

// Danh sách sản phẩm (M03) — trước đây là màn "Sắp có"; nay nối
// GET /products (`L1`, đặc tả 06 mục 6), cùng khuôn fetch với
// AdminDashboard (nợ #47 — chưa có SWR/TanStack Query, xem TECHNICAL_DEBT.md).

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FlowerPlaceholder } from "@/components/ui/flower-placeholder"

type Product = {
  id: string
  name: string
  code: string
  category: string | null
  status: "DRAFT" | "ACTIVE" | "ARCHIVED"
}

const NHAN_TRANG_THAI: Record<Product["status"], string> = {
  DRAFT: "Nháp",
  ACTIVE: "Đang bán",
  ARCHIVED: "Lưu trữ",
}

export default function SanPhamPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[] | null>(null)
  const [loi, setLoi] = useState<string | null>(null)
  const [tuKhoa, setTuKhoa] = useState("")

  useEffect(() => {
    let huy = false
    async function napLai() {
      try {
        const res = await fetch("/api/v1/products?limit=50")
        if (res.status === 401) {
          router.push("/dang-nhap")
          return
        }
        if (!res.ok) throw new Error(`Không tải được danh sách (${res.status})`)
        const data = (await res.json()) as { data: Product[] }
        if (!huy) setProducts(data.data)
      } catch (e) {
        if (!huy) setLoi(e instanceof Error ? e.message : "Không tải được danh sách")
      }
    }
    napLai()
    return () => {
      huy = true
    }
  }, [router])

  const hien = (products ?? []).filter((p) =>
    tuKhoa.trim() === "" ? true : (p.name + p.code).toLowerCase().includes(tuKhoa.trim().toLowerCase())
  )

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-[18px] py-4">
        <div className="text-[17px] font-extrabold text-primary">Sản phẩm</div>
        <Button size="sm" onClick={() => router.push("/them")}>
          <Plus size={16} strokeWidth={2.2} />
          Thêm
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {loi && (
          <div className="rounded-xl border-[1.5px] border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700">
            {loi}
          </div>
        )}

        <div className="relative">
          <Search size={16} strokeWidth={1.8} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
            placeholder="Tìm theo tên hoặc mã..."
            className="h-10 w-full rounded-xl border-[1.5px] border-border bg-surface pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>

        {products === null ? (
          <div className="py-8 text-center text-[13px] text-text-muted">Đang tải…</div>
        ) : hien.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 p-8 text-center">
            <div className="text-[13.5px] font-semibold">
              {products.length === 0 ? "Chưa có sản phẩm nào" : "Không tìm thấy sản phẩm phù hợp"}
            </div>
            {products.length === 0 && (
              <div className="text-xs text-text-muted">Bấm &quot;Thêm&quot; ở trên để tạo sản phẩm đầu tiên.</div>
            )}
          </Card>
        ) : (
          hien.map((p) => (
            <Card key={p.id} className="flex items-center gap-3 p-3.5">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-surface-alt">
                <FlowerPlaceholder size={20} color="#5F9670" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-semibold">{p.name}</div>
                <div className="truncate text-xs text-text-muted">
                  {p.code}
                  {p.category ? ` · ${p.category}` : ""} · {NHAN_TRANG_THAI[p.status]}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
