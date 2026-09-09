import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "FloraOS",
  description: "Nền tảng cho cửa hàng hoa",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-dvh bg-white text-neutral-900 antialiased">{children}</body>
    </html>
  )
}
