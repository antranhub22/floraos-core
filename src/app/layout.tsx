import type { Metadata } from "next"
import "./globals.css"
import { publicAppUrl } from "@/lib/public-url"

const appUrl = publicAppUrl()

export const metadata: Metadata = {
  // Ảnh xem trước khi dán link vào Zalo/Facebook cần URL tuyệt đối; thiếu dòng này
  // Next.js rơi về http://localhost:<PORT> ở mọi môi trường ngoài Vercel.
  ...(appUrl ? { metadataBase: new URL(appUrl) } : {}),
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
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400;1,600&family=Caveat:wght@600;700&display=swap"
        />
      </head>
      <body className="min-h-dvh bg-bg text-text antialiased">{children}</body>
    </html>
  )
}
