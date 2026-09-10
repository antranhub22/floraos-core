import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "FloraOS",
  description: "Nền tảng cho cửa hàng hoa",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body className="min-h-dvh bg-bg text-text antialiased">{children}</body>
    </html>
  )
}
