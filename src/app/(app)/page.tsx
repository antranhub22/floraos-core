// Điểm vào theo vai (đặc tả 03 mục 3): workspace THẬT vào Dashboard Điều hành,
// workspace TRẢI NGHIỆM vào lưới thẻ chức năng. Một tuyến "/", khác nhau ở nội dung
// render theo workspace.kind — không dựng hai bộ màn hình song song.
//
// Bản demo: thêm ?che_do=trai-nghiem để xem nhánh Trải nghiệm (chưa có chuyển
// workspace thật — xem README trong PR / tin nhắn bàn giao).

import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { ExperienceGrid } from "@/components/dashboard/experience-grid"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ che_do?: string }>
}) {
  const params = await searchParams
  const isExperience = params.che_do === "trai-nghiem"

  return isExperience ? <ExperienceGrid /> : <AdminDashboard />
}
