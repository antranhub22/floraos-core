"use client"

// Trang đăng nhập — bản demo UI, KHÔNG gọi API xác thực thật.
// Bấm "Đăng nhập" chỉ điều hướng sang Dashboard (route "/") để xem giao diện.

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DangNhapPage() {
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    router.push("/")
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
          <div>
            <div className="mb-1.5 text-[13px] font-semibold">Email</div>
            <input
              type="text"
              defaultValue="moclan.hoa@gmail.com"
              placeholder="ban@cuahang.vn"
              className="h-[46px] w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <div className="mb-1.5 text-[13px] font-semibold">Mật khẩu</div>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                defaultValue="matkhaumau123"
                placeholder="Nhập mật khẩu"
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
            <div className="mt-2 flex justify-end">
              <a href="#" className="text-[13px] font-semibold text-primary">
                Quên mật khẩu?
              </a>
            </div>
          </div>

          <Button type="submit" className="mt-1.5 w-full">
            Đăng nhập
          </Button>

          <div className="my-1 flex items-center gap-2.5">
            <div className="h-px flex-1 bg-border" />
            <div className="text-xs text-text-muted">hoặc</div>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="text-center text-[13.5px] text-text-muted">
            Chưa có tài khoản?{" "}
            <a href="#" className="font-bold text-accent">
              Dùng thử miễn phí
            </a>
          </div>
        </form>
      </div>

      <div className="pb-1 pt-9 text-center text-[11.5px] text-text-muted/70">
        © FloraOS — nền tảng cho cửa hàng hoa
      </div>
    </div>
  )
}
