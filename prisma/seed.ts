import { prisma } from "../src/core/tenancy/infra/prisma"
import { ensureSystemRoles } from "../src/modules/organization/use-cases/ensure-system-roles"

/**
 * Nạp bốn vai hệ thống. Chạy bằng `npm run db:seed`, sau `prisma db push`.
 *
 * Vai hệ thống mang `organization_id = null` và dùng chung cho mọi tổ chức
 * (đặc tả 07 mục 3). Năng lực gắn vào vai thuộc P2.
 */
async function main(): Promise<void> {
  await ensureSystemRoles()
  const roles = await prisma.roles.findMany({ where: { organization_id: null } })
  console.log(`Vai hệ thống: ${roles.map((role) => role.key).join(", ")}`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
