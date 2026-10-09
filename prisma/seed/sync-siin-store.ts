/**
 * Đồng bộ & Kích hoạt tài khoản Siin Store trên mọi môi trường (kể cả Render / Production).
 *
 * Chức năng:
 *   1. Chuyển đổi tài khoản moclan@dev.vn -> siinstore@dev.vn (Mật khẩu: SiinStore@2026)
 *   2. Đảm bảo tư cách thành viên (membership) luôn ở trạng thái ACTIVE (mở khoá nếu bị SUSPENDED)
 *   3. Cập nhật tên tổ chức thành "Siin Store" (slug: siin-store)
 *   4. Cập nhật tên workspace thành "Không gian làm việc Siin Store"
 *   5. TUYỆT ĐỐI BẢO TOÀN DỮ LIỆU THỰC TẾ: Không ghi đè Business Profile, Brand Profile,
 *      sản phẩm, hình ảnh hay đơn hàng đã có trong cơ sở dữ liệu.
 */

import { prisma } from "../../src/core/tenancy/infra/prisma"
import { hashPassword } from "../../src/modules/organization/infra/password-hasher"
import { ensureSystemRoles } from "../../src/modules/organization/use-cases/ensure-system-roles"
import { FOUNDER_ROLE_KEY } from "../../src/modules/organization/domain/system-roles"
import { MOCLAN_CONSTANTS } from "./dev-moclan-data"

export async function syncSiinStoreAccount(): Promise<void> {
  console.log("🌸 [syncSiinStoreAccount] Bắt đầu đồng bộ tài khoản Siin Store...")

  // 1. Đảm bảo system roles đã tồn tại
  await ensureSystemRoles()
  const founderRole = await prisma.roles.findFirst({
    where: { key: FOUNDER_ROLE_KEY, organization_id: null },
  })
  if (!founderRole) {
    throw new Error(`Không tìm thấy system role '${FOUNDER_ROLE_KEY}'.`)
  }

  // 2. Organization: dev-moclan-org-0000-0000-000000000001
  const existingOrg = await prisma.organizations.findUnique({
    where: { id: MOCLAN_CONSTANTS.ORG_ID },
  })

  if (existingOrg) {
    await prisma.organizations.update({
      where: { id: MOCLAN_CONSTANTS.ORG_ID },
      data: {
        name: "Siin Store",
        slug: "siin-store",
      },
    })
    console.log(`  ✓ Organization: Đã cập nhật 'Siin Store' (slug: siin-store)`)
  } else {
    await prisma.organizations.create({
      data: {
        id: MOCLAN_CONSTANTS.ORG_ID,
        name: "Siin Store",
        slug: "siin-store",
        type: "SINGLE",
        credit_balance: 1000,
        data_region: "vn",
      },
    })
    console.log(`  ✓ Organization: Tạo mới 'Siin Store'`)
  }

  // 3. Workspace: dev-moclan-wsp-0000-0000-000000000001
  const WORKSPACE_ID = "dev-moclan-wsp-0000-0000-000000000001"
  await prisma.workspaces.upsert({
    where: { id: WORKSPACE_ID },
    update: { name: "Không gian làm việc Siin Store", kind: "PRODUCTION" },
    create: {
      id: WORKSPACE_ID,
      organization_id: MOCLAN_CONSTANTS.ORG_ID,
      name: "Không gian làm việc Siin Store",
      kind: "PRODUCTION",
    },
  })

  // 4. Đồng bộ User 1: siinstore@dev.vn / SiinStore@2026
  const targetPassword1 = await hashPassword("SiinStore@2026")

  const existingUser1 = await prisma.users.findFirst({
    where: {
      OR: [
        { id: MOCLAN_CONSTANTS.USER_ID },
        { email: "siinstore@dev.vn" },
        { email: "moclan@dev.vn" },
      ],
    },
  })

  let userId1 = MOCLAN_CONSTANTS.USER_ID
  if (existingUser1) {
    userId1 = existingUser1.id
    await prisma.users.update({
      where: { id: existingUser1.id },
      data: {
        email: "siinstore@dev.vn",
        name: "Chủ tiệm Siin Store",
        password_hash: targetPassword1,
      },
    })
    console.log(`  ✓ User chính: Cập nhật siinstore@dev.vn (ID: ${userId1})`)
  } else {
    await prisma.users.create({
      data: {
        id: userId1,
        email: "siinstore@dev.vn",
        name: "Chủ tiệm Siin Store",
        password_hash: targetPassword1,
        locale: "vi",
      },
    })
    console.log(`  ✓ User chính: Tạo mới siinstore@dev.vn (ID: ${userId1})`)
  }

  // Đảm bảo Membership của User 1: ACTIVE và quyền Điều hành
  const existingMbr1 = await prisma.memberships.findFirst({
    where: {
      organization_id: MOCLAN_CONSTANTS.ORG_ID,
      user_id: userId1,
    },
  })

  if (existingMbr1) {
    await prisma.memberships.update({
      where: { id: existingMbr1.id },
      data: {
        status: "ACTIVE",
        role_id: founderRole.id,
      },
    })
    console.log(`  ✓ Membership chính: ACTIVE (Role: ${FOUNDER_ROLE_KEY})`)
  } else {
    await prisma.memberships.create({
      data: {
        id: MOCLAN_CONSTANTS.MEMBERSHIP_ID,
        organization_id: MOCLAN_CONSTANTS.ORG_ID,
        user_id: userId1,
        role_id: founderRole.id,
        status: "ACTIVE",
      },
    })
    console.log(`  ✓ Membership chính: Tạo mới ACTIVE (Role: ${FOUNDER_ROLE_KEY})`)
  }

  // 5. Đồng bộ User 2: owner@siinstore.local / siinstore@dev123
  const targetPassword2 = await hashPassword("siinstore@dev123")
  const existingUser2 = await prisma.users.findFirst({
    where: {
      OR: [
        { id: "dev-moclan-usr-0000-0000-000000000002" },
        { email: "owner@siinstore.local" },
        { email: "owner@moclan.local" },
      ],
    },
  })

  let userId2 = "dev-moclan-usr-0000-0000-000000000002"
  if (existingUser2) {
    userId2 = existingUser2.id
    await prisma.users.update({
      where: { id: existingUser2.id },
      data: {
        email: "owner@siinstore.local",
        name: "Chủ tiệm Siin Store",
        password_hash: targetPassword2,
      },
    })
    console.log(`  ✓ User phụ: Cập nhật owner@siinstore.local (ID: ${userId2})`)
  } else {
    await prisma.users.create({
      data: {
        id: userId2,
        email: "owner@siinstore.local",
        name: "Chủ tiệm Siin Store",
        password_hash: targetPassword2,
        locale: "vi",
      },
    })
    console.log(`  ✓ User phụ: Tạo mới owner@siinstore.local (ID: ${userId2})`)
  }

  const existingMbr2 = await prisma.memberships.findFirst({
    where: {
      organization_id: MOCLAN_CONSTANTS.ORG_ID,
      user_id: userId2,
    },
  })

  if (existingMbr2) {
    await prisma.memberships.update({
      where: { id: existingMbr2.id },
      data: {
        status: "ACTIVE",
        role_id: founderRole.id,
      },
    })
    console.log(`  ✓ Membership phụ: ACTIVE (Role: ${FOUNDER_ROLE_KEY})`)
  } else {
    await prisma.memberships.create({
      data: {
        id: "dev-moclan-mbr-0000-0000-000000000002",
        organization_id: MOCLAN_CONSTANTS.ORG_ID,
        user_id: userId2,
        role_id: founderRole.id,
        status: "ACTIVE",
      },
    })
    console.log(`  ✓ Membership phụ: Tạo mới ACTIVE (Role: ${FOUNDER_ROLE_KEY})`)
  }

  console.log("✅ [syncSiinStoreAccount] Hoàn tất đồng bộ! Giữ nguyên 100% hồ sơ và sản phẩm thực tế.")
}

if (process.argv[1]?.endsWith("sync-siin-store.ts") || process.argv[1]?.endsWith("sync-siin-store.js")) {
  syncSiinStoreAccount()
    .then(() => prisma.$disconnect())
    .catch(async (err) => {
      console.error(err)
      await prisma.$disconnect()
      process.exit(1)
    })
}
