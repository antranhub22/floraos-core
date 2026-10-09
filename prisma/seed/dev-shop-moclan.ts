/**
 * Dev Fixture: Siin Store (Database Seeder)
 *
 * Nạp đầy đủ mock data cho môi trường phát triển:
 *   • Organization, User owner, Membership
 *   • Business Profile & Brand Profile (kèm Logo, Storefront, QR, Video)
 *   • Master Assets (đăng ký bảng assets)
 *   • 6 Sản phẩm hoa mẫu (products, product_images, product_variants)
 *
 * Chạy riêng: npm run db:seed:dev (hoặc npx tsx prisma/seed/dev-shop-moclan.ts)
 */

import { prisma } from "../../src/core/tenancy/infra/prisma"
import { ensureSystemRoles } from "../../src/modules/organization/use-cases/ensure-system-roles"
import { FOUNDER_ROLE_KEY } from "../../src/modules/organization/domain/system-roles"
import { hashPassword } from "../../src/modules/organization/infra/password-hasher"
import {
  MOCLAN_CONSTANTS,
  MOCLAN_BUSINESS_PROFILE,
  MOCLAN_BRAND_PROFILE,
  MOCLAN_SAMPLE_PRODUCTS,
} from "./dev-moclan-data"

const DEV_ACCOUNTS = [
  {
    id: MOCLAN_CONSTANTS.USER_ID,
    email: "siinstore@dev.vn",
    name: "Chủ tiệm Siin Store",
    password: "SiinStore@2026",
    membershipId: MOCLAN_CONSTANTS.MEMBERSHIP_ID,
  },
  {
    id: "dev-moclan-usr-0000-0000-000000000002",
    email: "owner@siinstore.local",
    name: "Chủ tiệm Siin Store",
    password: "siinstore@dev123",
    membershipId: "dev-moclan-mbr-0000-0000-000000000002",
  },
]

export async function seedDevShopMoclan(): Promise<void> {
  console.log("🏡 Seeding Dev Fixture: Siin Store...")

  // 1. Đảm bảo system roles đã tồn tại
  await ensureSystemRoles()
  const ownerRole = await prisma.roles.findFirst({
    where: { key: FOUNDER_ROLE_KEY, organization_id: null },
  })
  if (!ownerRole) {
    throw new Error(`Không tìm thấy system role '${FOUNDER_ROLE_KEY}'.`)
  }

  // 2. Organization
  await prisma.organizations.upsert({
    where: { id: MOCLAN_CONSTANTS.ORG_ID },
    update: { name: MOCLAN_CONSTANTS.ORG_NAME, slug: MOCLAN_CONSTANTS.ORG_SLUG },
    create: {
      id: MOCLAN_CONSTANTS.ORG_ID,
      name: MOCLAN_CONSTANTS.ORG_NAME,
      slug: MOCLAN_CONSTANTS.ORG_SLUG,
      type: "SINGLE",
      credit_balance: 1000,
      data_region: "vn",
    },
  })
  console.log(`  ✓ Organization: ${MOCLAN_CONSTANTS.ORG_NAME} (${MOCLAN_CONSTANTS.ORG_SLUG})`)

  // 2b. Workspace (Bắt buộc cho resolveSession và layout hoạt động)
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
  console.log(`  ✓ Workspace: Không gian làm việc Siin Store (PRODUCTION)`)

  // 3. Users & Memberships (Băm trực tiếp qua bcrypt, đảm bảo 100% khớp)
  for (const acc of DEV_ACCOUNTS) {
    const passwordHash = await hashPassword(acc.password)
    await prisma.users.upsert({
      where: { id: acc.id },
      update: {
        name: acc.name,
        email: acc.email,
        password_hash: passwordHash,
      },
      create: {
        id: acc.id,
        email: acc.email,
        password_hash: passwordHash,
        name: acc.name,
        locale: "vi",
      },
    })

    await prisma.memberships.upsert({
      where: { id: acc.membershipId },
      update: { role_id: ownerRole.id, status: "ACTIVE" },
      create: {
        id: acc.membershipId,
        organization_id: MOCLAN_CONSTANTS.ORG_ID,
        user_id: acc.id,
        role_id: ownerRole.id,
        status: "ACTIVE",
        joined_at: new Date(),
      },
    })
    console.log(`  ✓ User: ${acc.email} (mật khẩu: ${acc.password}) → Điều hành`)
  }

  // 5. Business Profile — CHỈ tạo nếu chưa tồn tại, không ghi đè dữ liệu thật đã cập nhật qua UI
  const existingBizProfile = await prisma.business_profiles.findUnique({
    where: { organization_id: MOCLAN_CONSTANTS.ORG_ID },
  })
  if (!existingBizProfile) {
    await prisma.business_profiles.create({ data: MOCLAN_BUSINESS_PROFILE })
    console.log(`  ✓ Business Profile: ${MOCLAN_BUSINESS_PROFILE.display_name} (mới tạo)`)
  } else {
    console.log(`  → Business Profile: giữ nguyên dữ liệu hiện tại ("${existingBizProfile.display_name}")`)
  }

  // 6. Brand Profile — CHỈ tạo nếu chưa tồn tại, không ghi đè dữ liệu thật đã cập nhật qua UI
  const existingBrandProfile = await prisma.brand_profiles.findUnique({
    where: { organization_id: MOCLAN_CONSTANTS.ORG_ID },
  })
  if (!existingBrandProfile) {
    await prisma.brand_profiles.create({ data: MOCLAN_BRAND_PROFILE })
    console.log(`  ✓ Brand Profile: Đã nạp Logo, 5 ảnh Storefront, QR và Video intro (mới tạo)`)
  } else {
    console.log(`  → Brand Profile: giữ nguyên dữ liệu hiện tại`)
  }

  // 7. Đăng ký Master Brand Assets vào bảng assets
  const brandAssetsToSeed = [
    {
      id: "dev-moclan-ast-logo-0001",
      storage_key: `org/${MOCLAN_CONSTANTS.ORG_ID}/brand/siin-store-logo.jpg`,
      thumb_key: "/brand/siin-store-logo.jpg",
      mime_type: "image/jpeg",
      kind: "ORIGINAL" as const,
    },
    {
      id: "dev-moclan-ast-qr-0001",
      storage_key: `org/${MOCLAN_CONSTANTS.ORG_ID}/brand/siin-store-qr.svg`,
      thumb_key: "/brand/siin-store-qr.svg",
      mime_type: "image/svg+xml",
      kind: "ORIGINAL" as const,
    },
    {
      id: "dev-moclan-ast-vid-0001",
      storage_key: `org/${MOCLAN_CONSTANTS.ORG_ID}/brand/siin-store-intro.mp4`,
      thumb_key: null,
      mime_type: "video/mp4",
      kind: "VIDEO" as const,
    },
  ]

  for (const asset of brandAssetsToSeed) {
    await prisma.assets.upsert({
      where: { id: asset.id },
      update: { state: "READY", approval_state: "APPROVED" },
      create: {
        id: asset.id,
        organization_id: MOCLAN_CONSTANTS.ORG_ID,
        kind: asset.kind,
        state: "READY",
        storage_key: asset.storage_key,
        thumb_key: asset.thumb_key,
        mime_type: asset.mime_type,
        approval_state: "APPROVED",
        created_by: MOCLAN_CONSTANTS.USER_ID,
      },
    })
  }

  // 8. Đăng ký Sản phẩm hoa mẫu & Ảnh sản phẩm
  for (let i = 0; i < MOCLAN_SAMPLE_PRODUCTS.length; i++) {
    const p = MOCLAN_SAMPLE_PRODUCTS[i]!
    const assetId = `dev-moclan-ast-prd-000${i + 1}`

    // Upsert Asset ảnh sản phẩm
    await prisma.assets.upsert({
      where: { id: assetId },
      update: { state: "READY", approval_state: "APPROVED" },
      create: {
        id: assetId,
        organization_id: MOCLAN_CONSTANTS.ORG_ID,
        product_id: p.id,
        kind: "ORIGINAL",
        state: "READY",
        storage_key: `org/${MOCLAN_CONSTANTS.ORG_ID}/products/${p.code}.jpeg`,
        thumb_key: p.imagePath,
        mime_type: "image/jpeg",
        approval_state: "APPROVED",
        created_by: MOCLAN_CONSTANTS.USER_ID,
      },
    })

    // Upsert Product
    await prisma.products.upsert({
      where: {
        organization_id_code: {
          organization_id: MOCLAN_CONSTANTS.ORG_ID,
          code: p.code,
        },
      },
      update: {
        name: p.name,
        category: p.category,
        shape: p.shape,
        facing: p.facing,
        container: p.container,
        status: "ACTIVE",
        attributes: {
          price: p.price,
          original_price: p.originalPrice,
          description: p.description,
          image_url: p.imagePath,
        },
      },
      create: {
        id: p.id,
        organization_id: MOCLAN_CONSTANTS.ORG_ID,
        code: p.code,
        name: p.name,
        category: p.category,
        shape: p.shape,
        facing: p.facing,
        container: p.container,
        status: "ACTIVE",
        attributes: {
          price: p.price,
          original_price: p.originalPrice,
          description: p.description,
          image_url: p.imagePath,
        },
      },
    })

    // Upsert Product Image relation
    await prisma.product_images.upsert({
      where: {
        organization_id_product_id_asset_id_role: {
          organization_id: MOCLAN_CONSTANTS.ORG_ID,
          product_id: p.id,
          asset_id: assetId,
          role: "MAIN",
        },
      },
      update: { position: 0 },
      create: {
        organization_id: MOCLAN_CONSTANTS.ORG_ID,
        product_id: p.id,
        asset_id: assetId,
        role: "MAIN",
        position: 0,
      },
    })

    // Upsert Product Variant
    const variantId = `dev-moclan-var-000${i + 1}`
    await prisma.product_variants.upsert({
      where: { id: variantId },
      update: {
        name: "Tiêu chuẩn",
        size: "M",
        attributes: { price: p.price, original_price: p.originalPrice },
      },
      create: {
        id: variantId,
        organization_id: MOCLAN_CONSTANTS.ORG_ID,
        product_id: p.id,
        name: "Tiêu chuẩn",
        size: "M",
        multiplier: 1.0,
        attributes: { price: p.price, original_price: p.originalPrice },
      },
    })
  }

  console.log(`  ✓ Products: Đã nạp ${MOCLAN_SAMPLE_PRODUCTS.length} sản phẩm hoa mẫu kèm ảnh thực tế`)
  console.log("")
  console.log("✅ Toàn bộ Dev Mock Data Siin Store đã sẵn sàng!")
  console.log(`   → Tài khoản 1: ${DEV_ACCOUNTS[0]?.email} (Mật khẩu: ${DEV_ACCOUNTS[0]?.password})`)
  console.log(`   → Tài khoản 2: ${DEV_ACCOUNTS[1]?.email} (Mật khẩu: ${DEV_ACCOUNTS[1]?.password})`)
  console.log(`   → Org: ${MOCLAN_CONSTANTS.ORG_NAME} (slug: ${MOCLAN_CONSTANTS.ORG_SLUG})`)
}

// Chạy trực tiếp qua dòng lệnh
if (require.main === module) {
  seedDevShopMoclan()
    .catch((err) => {
      console.error("❌ Seed thất bại:", err)
      process.exit(1)
    })
    .finally(() => prisma.$disconnect())
}
