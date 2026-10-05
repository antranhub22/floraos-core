"use client"

// Lưới an toàn cuối cùng cho lỗi ở chính layout gốc: Next.js thay TOÀN BỘ layout
// gốc bằng tệp này, nên phải tự dựng <html>/<body> và nạp lại CSS toàn cục.
// (Chuyển từ nhánh fix/app-shell-states; các màn 404/lỗi/đang tải đã có trên main.)

import "./globals.css"

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
        <main role="alert" className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-caption font-semibold uppercase tracking-wider text-danger">Lỗi hệ thống</p>
          <h1 className="text-title font-bold">FloraOS tạm thời không tải được</h1>
          <p className="text-body-sm text-text-muted">Vui lòng thử lại sau ít phút. Dữ liệu của tiệm không bị ảnh hưởng.</p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-body-sm font-semibold text-surface hover:bg-primary-dark"
          >
            Thử lại
          </button>
          {error.digest && <p className="text-caption text-text-muted">Mã lỗi: {error.digest}</p>}
        </main>
      </body>
    </html>
  )
}
