// Theo docs/dac-ta/04-frontend-architecture.md mục 2:
// "(app)/layout.tsx — giải phiên, nạp năng lực, dựng khung điều hướng".
//
// Bản demo này dùng MOCK_SESSION thay vì đọc phiên thật từ cookie + GET /auth/me.
// Khi nối backend: thay getSession() bên dưới bằng lệnh gọi use-case thật
// (Server Component vẫn đọc dữ liệu ở phía máy chủ — không đổi kiến trúc).

import { SessionProvider } from "@/lib/session"
import { MOCK_SESSION } from "@/lib/mock-data"
import { BottomNav } from "@/components/layout/bottom-nav"

function getSession() {
  return MOCK_SESSION
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const session = getSession()

  return (
    <SessionProvider session={session}>
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-bg md:max-w-none">
        <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
        <BottomNav />
      </div>
    </SessionProvider>
  )
}
