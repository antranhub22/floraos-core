// Màn hình chờ khi chuyển giữa các trang trong khung ứng dụng tiệm (Next.js
// bọc trang trong Suspense với fallback này). Giữ nguyên thanh điều hướng.

import { Loader2 } from "lucide-react"

export default function AppLoading() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[60vh] w-full items-center justify-center gap-2 text-text-muted">
      <Loader2 size={18} className="animate-spin" aria-hidden="true" />
      <span className="text-[14px] font-medium">Đang tải…</span>
    </div>
  )
}
