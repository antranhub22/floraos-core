"use client"

// Trang đăng nhập — gọi API đăng nhập thật (POST /api/v1/auth/login).
// Thành công: server cấp cookie phiên + cookie floraos_sso, rồi điều hướng
// sang Dashboard ("/"). Thất bại: hiện đúng thông báo lỗi server trả về.
//
// "Dùng thử miễn phí" trước đây là liên kết chết — nay chuyển hẳn form sang
// chế độ đăng ký, gọi thẳng POST /api/v1/auth/signup (đã có sẵn, tạo tổ
// chức EXPERIENCE + credit dùng thử). "Quên mật khẩu?" chưa có luồng khôi
// phục thật ở bản này (P12, xem TECHNICAL_DEBT.md) — bấm vào hiện thông báo
// rõ ràng thay vì im lặng không làm gì.

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

type CheDo = "dang-nhap" | "dang-ky"

export default function DangNhapPage() {
  const router = useRouter()
  const [cheDo, setCheDo] = useState<CheDo>("dang-nhap")
  const [showPw, setShowPw] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [ten, setTen] = useState("")
  const [tenToChuc, setTenToChuc] = useState("")
  const [loi, setLoi] = useState<string | null>(null)
  const [dangGui, setDangGui] = useState(false)
  const [hienThongBaoQuenMatKhau, setHienThongBaoQuenMatKhau] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoi(null)
    setDangGui(true)
    try {
      const dangKy = cheDo === "dang-ky"
      const res = await fetch(`/api/v1/auth/${dangKy ? "signup" : "login"}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          dangKy
            ? { email, password, name: ten || null, organization_name: tenToChuc }
            : { email, password }
        ),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setLoi(data?.error?.message ?? (dangKy ? "Đăng ký thất bại — thử lại sau" : "Đăng nhập thất bại — thử lại sau"))
        return
      }
      router.push("/")
      router.refresh()
    } catch {
      setLoi("Không kết nối được máy chủ — kiểm tra lại server có đang chạy không")
    } finally {
      setDangGui(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col justify-center overflow-hidden bg-bg px-[30px] py-9">
      <svg width="260" height="260" viewBox="0 0 260 260" className="pointer-events-none absolute -right-24 -top-24 opacity-50">
        <circle cx="130" cy="130" r="130" fill="#EEF4EE" />
      </svg>

      <div className="mx-auto flex w-full max-w-sm flex-col gap-9">
        <div className="flex flex-col items-center gap-3.5">
          <svg width="52" height="52" viewBox="0 0 100 100">
            <path d="M50,50 C48.5,45 41.5,38 50,32 C58.5,38 51.5,45 50,50 Z" fill="#E48692" transform="rotate(258 50 50)" />
            <path d="M50,50 C47,40 33,26 50,14 C67,26 53,40 50,50 Z" fill="#174C3C" />
            <path d="M50,50 C47,40 33,26 50,14 C67,26 53,40 50,50 Z" fill="#5F9670" transform="rotate(140 50 50)" />
            <circle cx="50" cy="50" r="3" fill="#174C3C" />
          </svg>
          <div className="text-[26px] font-extrabold tracking-tight text-primary">FloraOS</div>
          <div className="text-center text-[13.5px] text-text-muted">
            Nền tảng cho cửa hàng và chuỗi cửa hàng hoa
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {loi && (
            <div className="rounded-xl border-[1.5px] border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700">
              {loi}
            </div>
          )}

          {cheDo === "dang-ky" && (
            <div>
              <div className="mb-1.5 text-[13px] font-semibold">Tên cửa hàng / tổ chức</div>
              <input
                type="text"
                value={tenToChuc}
                onChange={(e) => setTenToChuc(e.target.value)}
                placeholder="Tiệm hoa của bạn"
                className="h-[46px] w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 text-sm outline-none focus:border-primary"
              />
            </div>
          )}

          {cheDo === "dang-ky" && (
            <div>
              <div className="mb-1.5 text-[13px] font-semibold">Họ tên (tuỳ chọn)</div>
              <input
                type="text"
                value={ten}
                onChange={(e) => setTen(e.target.value)}
                placeholder="Tên của bạn"
                className="h-[46px] w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 text-sm outline-none focus:border-primary"
              />
            </div>
          )}

          <div>
            <div className="mb-1.5 text-[13px] font-semibold">Email</div>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ban@cuahang.vn"
              autoComplete="username"
              className="h-[46px] w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <div className="mb-1.5 text-[13px] font-semibold">Mật khẩu</div>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                autoComplete={cheDo === "dang-ky" ? "new-password" : "current-password"}
                className="h-[46px] w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 pr-11 text-sm outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-1.5 top-1.5 flex h-[34px] w-[34px] items-center justify-center text-text-muted"
              >
                {showPw ? <EyeOff size={19} strokeWidth={1.8} /> : <Eye size={19} strokeWidth={1.8} />}
              </button>
            </div>
            {cheDo === "dang-nhap" && (
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setHienThongBaoQuenMatKhau((v) => !v)}
                  className="text-[13px] font-semibold text-primary"
                >
                  Quên mật khẩu?
                </button>
              </div>
            )}
            {hienThongBaoQuenMatKhau && (
              <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-surface-alt px-2.5 py-2">
                <Info size={13} strokeWidth={1.8} className="mt-0.5 flex-shrink-0 text-text-muted" />
                <div className="flex-1 text-[11.5px] leading-snug text-text-muted">
                  Bản hiện tại chưa hỗ trợ tự khôi phục mật khẩu — liên hệ quản trị hệ thống để được đặt lại.
                </div>
              </div>
            )}
          </div>

          <Button type="submit" className="mt-1.5 w-full" disabled={dangGui}>
            {dangGui
              ? cheDo === "dang-ky"
                ? "Đang đăng ký…"
                : "Đang đăng nhập…"
              : cheDo === "dang-ky"
                ? "Tạo tổ chức dùng thử"
                : "Đăng nhập"}
          </Button>

          <div className="my-1 flex items-center gap-2.5">
            <div className="h-px flex-1 bg-border" />
            <div className="text-xs text-text-muted">hoặc</div>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="text-center text-[13.5px] text-text-muted">
            {cheDo === "dang-nhap" ? (
              <>
                Chưa có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setCheDo("dang-ky")
                    setLoi(null)
                  }}
                  className="font-bold text-accent"
                >
                  Dùng thử miễn phí
                </button>
              </>
            ) : (
              <>
                Đã có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setCheDo("dang-nhap")
                    setLoi(null)
                  }}
                  className="font-bold text-accent"
                >
                  Đăng nhập
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      <div className="pb-1 pt-9 text-center text-[11.5px] text-text-muted/70">
        © FloraOS — nền tảng cho cửa hàng hoa
      </div>
    </div>
  )
}
