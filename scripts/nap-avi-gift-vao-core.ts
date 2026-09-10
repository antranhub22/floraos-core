import { readFileSync } from "node:fs"
import path from "node:path"

import type { TenantContext } from "@/core/tenancy"
import { prisma } from "@/core/tenancy/infra/prisma"
import { bootstrapAviGiftOrganization } from "@/modules/avi-gift-import/use-cases/bootstrap-avi-gift-organization"
import { importCatalog } from "@/modules/avi-gift-import/use-cases/import-catalog"
import type { CatalogSourceRow } from "@/modules/avi-gift-import/domain/catalog-mapping"

// P8, H7 (đặc tả 08 mục 6). Chạy MỘT LẦN để dựng tổ chức AVI GIFT rồi nạp
// danh mục sản phẩm. An toàn chạy lại phần nạp danh mục (idempotent theo
// `code`) nhưng KHÔNG an toàn chạy lại phần dựng tổ chức — nếu tổ chức đã
// tồn tại, sửa script để đọc `organizationId` có sẵn thay vì bootstrap lại
// (xem điều kiện `--org-id` bên dưới).
//
//   1. python3 scripts/nap-avi-gift/doc-excel.py \
//        "<thư mục FloraOS Vận hành>" scripts/nap-avi-gift/du-lieu-trung-gian
//   2. npx tsx scripts/nap-avi-gift-vao-core.ts [--org-id=<uuid có sẵn>]
//
// Không đọc thẳng .xlsx ở đây — bước 1 (Python, `openpyxl`) đã chuẩn hoá
// thành `catalog.json`. Adapter một chiều: script này chỉ ĐỌC JSON, không có
// đường nào ghi ngược lại Excel hay .env chứa khoá thật của AVI GIFT.

const DATA_DIR = path.join(process.cwd(), "scripts", "nap-avi-gift", "du-lieu-trung-gian")
const ORGANIZATION_NAME = "AVI GIFT"
const ADMIN_EMAIL = "antranhub@gmail.com"

async function resolveContext(existingOrgId: string | null): Promise<TenantContext> {
  if (existingOrgId) {
    const workspace = await prisma.workspaces.findFirst({
      where: { organization_id: existingOrgId },
      orderBy: { created_at: "asc" },
    })
    if (!workspace) throw new Error(`Tổ chức ${existingOrgId} không có workspace nào`)
    const membership = await prisma.memberships.findFirst({
      where: { organization_id: existingOrgId },
      orderBy: { joined_at: "asc" },
    })
    if (!membership) throw new Error(`Tổ chức ${existingOrgId} không có thành viên nào`)
    console.log(`Dùng tổ chức có sẵn: ${existingOrgId}`)
    return {
      organizationId: existingOrgId,
      workspaceId: workspace.id,
      userId: membership.user_id,
      branchId: null,
      capabilities: new Set(),
    }
  }

  const bootstrap = await bootstrapAviGiftOrganization({
    organizationName: ORGANIZATION_NAME,
    adminEmail: ADMIN_EMAIL,
  })
  console.log("=".repeat(72))
  console.log(`Đã dựng tổ chức AVI GIFT — organization_id = ${bootstrap.organizationId}`)
  console.log(`Tài khoản admin: ${ADMIN_EMAIL}`)
  console.log(`Mật khẩu tạm (đổi ngay sau khi đăng nhập lần đầu):`)
  console.log(`  ${bootstrap.temporaryPassword}`)
  console.log("=".repeat(72))
  return {
    organizationId: bootstrap.organizationId,
    workspaceId: bootstrap.workspaceId,
    userId: bootstrap.userId,
    branchId: null,
    capabilities: new Set(),
  }
}

async function main(): Promise<void> {
  const orgIdArg = process.argv.find((a) => a.startsWith("--org-id="))
  const existingOrgId = orgIdArg ? orgIdArg.slice("--org-id=".length) : null

  const catalogPath = path.join(DATA_DIR, "catalog.json")
  const rows = JSON.parse(readFileSync(catalogPath, "utf-8")) as CatalogSourceRow[]
  console.log(`Đọc ${rows.length} dòng từ ${catalogPath}`)

  const ctx = await resolveContext(existingOrgId)
  const result = await importCatalog(ctx, rows, new Date())

  console.log(`Tạo mới: ${result.created}`)
  console.log(`Bỏ qua (đã có mã): ${result.skippedExisting}`)
  console.log(`Lỗi: ${result.failed.length}`)
  for (const f of result.failed.slice(0, 20)) console.log(`  - ${f.code}: ${f.error}`)
  console.log(`Cảnh báo dữ liệu nguồn: ${result.dataWarnings.length}`)
  for (const w of result.dataWarnings.slice(0, 20)) console.log(`  - ${w}`)
  if (result.dataWarnings.length > 20) {
    console.log(`  … còn ${result.dataWarnings.length - 20} cảnh báo, xem lại catalog.json`)
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
