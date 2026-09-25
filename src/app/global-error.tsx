"use client"

// Lưới an toàn cuối cùng: lỗi ở chính layout gốc. Next.js thay TOÀN BỘ layout
// gốc bằng tệp này, nên phải tự dựng <html>/<body> và nạp lại CSS toàn cục.

import "./globals.css"

import { AppStateScreen } from "@/components/layout/app-state-screen"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="vi">
      <body className="min-h-dvh bg-bg text-text antialiased">
        <AppStateScreen
          fullScreen
          tone="danger"
          eyebrow="Lỗi hệ thống"
          title="FloraOS tạm thời không tải được"
          description="Vui lòng thử lại sau ít phút. Dữ liệu của tiệm không bị ảnh hưởng."
          actions={
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Thử lại
            </button>
          }
          footnote={error.digest ? `Mã lỗi: ${error.digest}` : undefined}
        />
      </body>
    </html>
  )
}
