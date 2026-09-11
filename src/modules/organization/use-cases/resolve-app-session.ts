import { cache } from "react"

import type { MockSession } from "@/lib/mock-data"
import { describeSession } from "./describe-session"
import { resolveSession } from "./resolve-session"

function viettatTen(name: string | null, email: string): string {
  const nguon = (name ?? email).trim()
  const phan = nguon.split(/\s+/).filter(Boolean)
  const chu = phan.length >= 2 ? phan[0]!.charAt(0) + phan[phan.length - 1]!.charAt(0) : nguon.slice(0, 2)
  return chu.toUpperCase()
}

/**
 * Dựng `MockSession` (khuôn dữ liệu cho `SessionProvider`) từ phiên đăng
 * nhập thật (cookie `floraos_session`) — dùng chung cho layout (dựng
 * `SessionProvider`) và trang chủ (chọn Admin Dashboard hay Experience Grid
 * theo `workspace.kind` THẬT).
 *
 * Trước đây trang chủ chọn màn theo tham số URL thủ công
 * `?che_do=trai-nghiem` (đã gỡ) — bất kỳ ai gõ URL đó cũng thấy Experience
 * Grid bất kể workspace thật của họ là gì. Giờ đọc đúng `workspace.kind` từ
 * CSDL: tài khoản tự đăng ký qua `POST /auth/signup` luôn được tạo workspace
 * `EXPERIENCE` (`sign-up.ts`), nên tự thấy đúng màn Trải nghiệm mà không cần
 * mẹo URL nào.
 *
 * Bọc `cache()` để layout và trang chủ cùng gọi hàm này trong một request
 * chỉ tính một lượt truy vấn CSDL, không phải hai.
 */
export const resolveAppSession = cache(async function resolveAppSession(
  cookieHeader: string
): Promise<MockSession | null> {
  const request = new Request("http://localhost/", { headers: { cookie: cookieHeader } })

  const resolved = await resolveSession(request).catch(() => null)
  if (!resolved || !resolved.ctx || !resolved.membership) return null

  const described = await describeSession(resolved)

  return {
    userName: described.user.name ?? described.user.email,
    userInitials: viettatTen(described.user.name, described.user.email),
    orgName: described.organization?.name ?? "FloraOS",
    workspaceKind: (described.workspace?.kind as MockSession["workspaceKind"]) ?? "PRODUCTION",
    capabilities: described.capabilities,
  }
})
