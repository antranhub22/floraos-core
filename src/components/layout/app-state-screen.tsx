// Khung dùng chung cho các màn hình trạng thái toàn ứng dụng: không tìm thấy
// trang (404), lỗi khi dựng trang, và đang tải. Thuần trình bày — không hook,
// không gọi dữ liệu — để dùng được cả trong Server Component (not-found,
// loading) lẫn Client Component (error.tsx bắt buộc là client).
//
// Kế hoạch: claude/ke-hoach-dong-bo-wireframe-va-hoan-thien-25-09-2026.md, GĐ2.

import type { ReactNode } from "react"

type Tone = "neutral" | "danger"

export interface AppStateScreenProps {
  /** Nhãn nhỏ phía trên tiêu đề, ví dụ "404" hoặc "Lỗi". */
  eyebrow?: string
  title: string
  description?: ReactNode
  /** Nút / liên kết hành động, đặt theo thứ tự ưu tiên từ trái sang phải. */
  actions?: ReactNode
  /** Chi tiết kỹ thuật cho nhân viên hỗ trợ (mã lỗi…). */
  footnote?: ReactNode
  tone?: Tone
  /** Chiếm toàn màn hình (dùng cho global-error / not-found ngoài khung app). */
  fullScreen?: boolean
}

export function AppStateScreen({
  eyebrow,
  title,
  description,
  actions,
  footnote,
  tone = "neutral",
  fullScreen = false,
}: AppStateScreenProps) {
  return (
    <main
      className={
        (fullScreen ? "min-h-dvh " : "min-h-[60vh] ") +
        "flex w-full items-center justify-center px-4 py-12"
      }
    >
      <div className="flex w-full max-w-md flex-col items-center gap-3 text-center">
        {eyebrow ? (
          <span
            className={
              "rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider " +
              (tone === "danger" ? "bg-danger-bg text-danger" : "bg-surface-alt text-text-muted")
            }
          >
            {eyebrow}
          </span>
        ) : null}
        <h1 className="text-[20px] font-extrabold text-text">{title}</h1>
        {description ? (
          <div className="text-[14px] leading-relaxed text-text-muted">{description}</div>
        ) : null}
        {actions ? <div className="mt-2 flex flex-wrap items-center justify-center gap-2">{actions}</div> : null}
        {footnote ? <div className="mt-2 text-[12px] text-text-muted">{footnote}</div> : null}
      </div>
    </main>
  )
}
