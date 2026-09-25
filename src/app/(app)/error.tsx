"use client"

// Ranh giới lỗi cho mọi trang trong khung ứng dụng tiệm. Khi một trang ném lỗi
// lúc dựng, người dùng vẫn giữ được thanh điều hướng (layout không bị thay)
// và có nút "Thử lại" để dựng lại đúng đoạn bị lỗi.

import { useEffect } from "react"
import Link from "next/link"

import { AppStateScreen } from "@/components/layout/app-state-screen"
import { Button } from "@/components/ui/button"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Ghi ra console trình duyệt để đối chiếu với log máy chủ qua `digest`.
    console.error("[FloraOS] Lỗi khi dựng trang:", error)
  }, [error])

  return (
    <AppStateScreen
      tone="danger"
      eyebrow="Lỗi"
      title="Trang này gặp sự cố"
      description="Dữ liệu của tiệm không bị ảnh hưởng. Bấm Thử lại; nếu vẫn lỗi, quay về Trang chủ và báo cho bộ phận hỗ trợ kèm mã bên dưới."
      actions={
        <>
          <Button size="sm" onClick={() => reset()}>
            Thử lại
          </Button>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold text-text hover:bg-surface-alt"
          >
            Về Trang chủ
          </Link>
        </>
      }
      footnote={error.digest ? `Mã lỗi: ${error.digest}` : undefined}
    />
  )
}
