// Điểm vào theo vai (đặc tả 03 mục 3): workspace THẬT vào Dashboard Điều hành,
// workspace TRẢI NGHIỆM vào lưới thẻ chức năng. Một tuyến "/", khác nhau ở nội
// dung render theo `workspace.kind` THẬT đọc từ phiên đăng nhập.
//
// Trước đây chọn màn theo tham số URL thủ công `?che_do=trai-nghiem` — ai
// cũng gõ được URL đó bất kể workspace thật của họ là gì, không phải cơ chế
// thật. Đã gỡ: tài khoản tự đăng ký qua "Dùng thử miễn phí" (`POST
// /auth/signup`) luôn được tạo workspace `EXPERIENCE` (`sign-up.ts`), nên tự
// thấy đúng màn Trải nghiệm; tài khoản thật (workspace `PRODUCTION`) tự thấy
// Dashboard Điều hành — không cần mẹo URL nào nữa.

import { cookies } from "next/headers"

import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { ExperienceGrid } from "@/components/dashboard/experience-grid"
import { resolveAppSession } from "@/modules/organization/use-cases/resolve-app-session"

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ")

  const session = await resolveAppSession(cookieHeader)
  // Không có phiên hợp lệ: layout bọc ngoài (`(app)/layout.tsx`) đã chuyển
  // sang /dang-nhap trước khi tới đây — nhánh này chỉ để tsc yên tâm về kiểu.
  if (!session) return null

  return session.workspaceKind === "EXPERIENCE" ? <ExperienceGrid /> : <AdminDashboard />
}
