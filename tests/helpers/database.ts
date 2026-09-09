import { prisma } from "@/core/tenancy/infra/prisma"
import { ensureSystemRoles } from "@/modules/organization/use-cases/ensure-system-roles"

const TENANT_TABLES = [
  "memberships",
  "roles",
  "branches",
  "workspaces",
  "organizations",
  "sessions",
  "users",
] as const

/**
 * Dọn sạch bảy bảng nền giữa các trường hợp thử. Bộ test cách ly phải bắt đầu
 * từ một cơ sở dữ liệu rỗng, nếu không thì "không tìm thấy" có thể là do dữ
 * liệu sót lại chứ không do bộ gác.
 */
export async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${TENANT_TABLES.join(", ")} RESTART IDENTITY CASCADE`
  )
  // Vai hệ thống là danh mục cài đặt, không phải dữ liệu thử: nạp lại đúng
  // như `npm run db:seed` làm sau khi đẩy lược đồ.
  await ensureSystemRoles()
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect()
}

export { prisma }
