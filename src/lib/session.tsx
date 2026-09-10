"use client"

// Ngữ cảnh phiên phía client — theo docs/dac-ta/04-frontend-architecture.md mục 5:
// "Đây là việc ẩn hiện giao diện, không phải phép kiểm quyền. Máy chủ kiểm lại ở
// mọi endpoint." Danh sách năng lực ở đây là DỮ LIỆU MẪU; bản thật đọc từ
// GET /auth/me và không bao giờ tự suy quyền từ vai ở phía client.

import { createContext, useContext, useMemo } from "react"
import type { MockSession } from "@/lib/mock-data"

type SessionContextValue = MockSession & {
  can: (code: string) => boolean
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({
  session,
  children,
}: {
  session: MockSession
  children: React.ReactNode
}) {
  const value = useMemo<SessionContextValue>(
    () => ({
      ...session,
      can: (code: string) => session.capabilities.includes(code),
    }),
    [session]
  )
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error("useSession() phải gọi bên trong <SessionProvider>")
  return ctx
}
