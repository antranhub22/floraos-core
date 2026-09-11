"use client"

// Chọn bộ máy phân tích ảnh cho cả tổ chức (`H4`, trần cứng `dieu_hanh`).
//
//   Đọc  → GET /api/v1/vision/engine   (H1 — ai chạy phân tích cũng xem được)
//   Ghi  → PUT /api/v1/vision/engine   (H4 — chỉ Điều hành)
//
// Ba bộ trả cùng một hợp đồng JSON nên mọi thứ hạ nguồn không đổi. Thứ đổi
// là chất lượng, chi phí, và ảnh có rời khỏi hạ tầng của tổ chức hay không —
// nên màn này nói thẳng cả ba, thay vì bày ba lựa chọn trông ngang nhau.

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, ArrowLeft, Check, Cloud, Server } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useSession } from "@/lib/session"
import { cn } from "@/lib/utils"

type TrangThai = "san_xuat" | "thu_nghiem" | "chua_san_sang"

type MoTaBoMay = {
  key: string
  ten: string
  mo_ta: string
  trang_thai: TrangThai
  gui_anh_ra_ngoai: boolean
}

const NHAN_TRANG_THAI: Record<TrangThai, { chu: string; lop: string }> = {
  san_xuat: { chu: "Đã chạy thật", lop: "bg-success-bg text-primary" },
  thu_nghiem: { chu: "Chưa đo độ chính xác", lop: "bg-warning-bg text-warning" },
  chua_san_sang: { chu: "Chưa sẵn sàng", lop: "bg-surface-alt text-text-muted" },
}

export default function BoMayPage() {
  const router = useRouter()
  const { can } = useSession()
  const [danhSach, setDanhSach] = useState<MoTaBoMay[] | null>(null)
  const [dangDung, setDangDung] = useState<string | null>(null)
  const [chon, setChon] = useState<string | null>(null)
  const [dangLuu, setDangLuu] = useState(false)
  const [loi, setLoi] = useState<string | null>(null)
  const [daLuu, setDaLuu] = useState(false)

  useEffect(() => {
    let huy = false
    async function nap() {
      const res = await fetch("/api/v1/vision/engine")
      if (res.status === 401) {
        router.push("/dang-nhap")
        return
      }
      if (!res.ok) {
        if (!huy) setLoi(`Không đọc được cấu hình bộ máy (${res.status})`)
        return
      }
      const data = (await res.json()) as { dang_dung: string; danh_sach: MoTaBoMay[] }
      if (huy) return
      setDanhSach(data.danh_sach)
      setDangDung(data.dang_dung)
      setChon(data.dang_dung)
    }
    void nap()
    return () => {
      huy = true
    }
  }, [router])

  async function luu() {
    if (!chon || chon === dangDung) return
    setDangLuu(true)
    setLoi(null)
    setDaLuu(false)
    try {
      const res = await fetch("/api/v1/vision/engine", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bo_may: chon }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | null
        throw new Error(data?.error?.message ?? `Không lưu được (${res.status})`)
      }
      const data = (await res.json()) as { dang_dung: string }
      setDangDung(data.dang_dung)
      setDaLuu(true)
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không lưu được")
    } finally {
      setDangLuu(false)
    }
  }

  const doiDuoc = can("H4")

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-border bg-surface px-[18px] py-4">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted hover:bg-surface-alt"
          aria-label="Quay lại"
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </button>
        <div className="text-[17px] font-extrabold text-primary">Bộ máy phân tích ảnh</div>
      </div>

      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-4">
        <div className="text-[12.5px] leading-relaxed text-text-muted">
          Cả ba bộ trả về cùng một cấu trúc kết quả, nên luồng duyệt và dữ liệu sản phẩm không đổi khi
          bạn chuyển. Thứ đổi là độ chính xác, chi phí mỗi lượt, và ảnh có rời khỏi hệ thống hay không.
        </div>

        {loi && (
          <div className="rounded-xl border-[1.5px] border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700">
            {loi}
          </div>
        )}

        {danhSach === null && !loi && (
          <div className="py-8 text-center text-[13px] text-text-muted">Đang tải…</div>
        )}

        {danhSach?.map((bo) => {
          const dangChon = chon === bo.key
          const nhan = NHAN_TRANG_THAI[bo.trang_thai]
          return (
            <Card
              key={bo.key}
              className={cn(
                "flex flex-col gap-2.5 p-4",
                dangChon && "border-[1.5px] border-primary",
                doiDuoc && "cursor-pointer"
              )}
              onClick={() => doiDuoc && setChon(bo.key)}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full border-2",
                    dangChon ? "border-primary bg-primary" : "border-border"
                  )}
                >
                  {dangChon && <Check size={13} strokeWidth={3} color="#fff" />}
                </div>
                <div className="flex-1 text-[14.5px] font-bold">{bo.ten}</div>
                {bo.key === dangDung && (
                  <span className="rounded-full bg-success-bg px-2.5 py-1 text-[11px] font-bold text-primary">
                    Đang dùng
                  </span>
                )}
              </div>

              <div className="text-[12.5px] leading-relaxed text-text-muted">{bo.mo_ta}</div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", nhan.lop)}>
                  {nhan.chu}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-alt px-2 py-0.5 text-[11px] font-semibold text-text-muted">
                  {bo.gui_anh_ra_ngoai ? (
                    <>
                      <Cloud size={11} strokeWidth={2} /> Ảnh gửi ra nhà cung cấp
                    </>
                  ) : (
                    <>
                      <Server size={11} strokeWidth={2} /> Ảnh không rời hệ thống
                    </>
                  )}
                </span>
              </div>
            </Card>
          )
        })}

        {danhSach && (
          <div className="flex items-start gap-2 rounded-xl bg-warning-bg p-3.5">
            <AlertTriangle size={16} strokeWidth={1.8} className="mt-0.5 flex-shrink-0 text-warning" />
            <div className="text-xs leading-relaxed text-warning">
              Chỉ bộ &quot;Đầy đủ&quot; đã chạy trên ảnh thật. Hai bộ còn lại chưa được chấm điểm trên
              bộ ảnh chuẩn, nên chưa có căn cứ nói bộ nào đếm đúng hơn. Đổi bộ máy được ghi vào nhật ký
              kiểm toán để về sau đối chiếu được kết quả của từng giai đoạn.
            </div>
          </div>
        )}
      </div>

      {danhSach && (
        <div className="flex-shrink-0 border-t border-border bg-surface p-5">
          {doiDuoc ? (
            <>
              <Button
                className="h-[50px] w-full"
                disabled={dangLuu || !chon || chon === dangDung}
                onClick={luu}
              >
                {dangLuu ? "Đang lưu…" : chon === dangDung ? "Đang dùng bộ này" : "Chuyển sang bộ đã chọn"}
              </Button>
              {daLuu && (
                <div className="mt-2 text-center text-[12px] text-text-muted">
                  Đã lưu. Lượt phân tích đang chạy dở vẫn dùng bộ cũ.
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl bg-surface-alt px-3.5 py-3 text-center text-[12.5px] text-text-muted">
              Chỉ Điều hành mới đổi được bộ máy phân tích.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
