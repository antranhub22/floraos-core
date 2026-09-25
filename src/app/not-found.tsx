// Trang 404 cho mọi URL không khớp route nào (kể cả route menu trỏ tới nhưng
// chưa có trang). Thay trang 404 tiếng Anh mặc định của Next.js.

import Link from "next/link"

import { AppStateScreen } from "@/components/layout/app-state-screen"

export default function NotFound() {
  return (
    <AppStateScreen
      fullScreen
      eyebrow="404"
      title="Không tìm thấy trang"
      description="Đường dẫn này không tồn tại hoặc đã được chuyển đi. Kiểm tra lại địa chỉ, hoặc quay về Trang chủ."
      actions={
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Về Trang chủ
        </Link>
      }
    />
  )
}
