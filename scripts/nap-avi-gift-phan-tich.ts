import { readFile } from "node:fs/promises"
import { readFileSync } from "node:fs"
import path from "node:path"

import type { TenantContext } from "@/core/tenancy"
import { prisma } from "@/core/tenancy/infra/prisma"
import { LocalDiskStorageProvider } from "@/modules/assets/adapters/local-disk-storage-provider"
import type { AnalysisSourceRow } from "@/modules/avi-gift-import/domain/analysis-mapping"
import { importAnalyses } from "@/modules/avi-gift-import/use-cases/import-analyses"

// P8, nợ #34 — lượt nạp THỨ HAI của AVI GIFT: tám sản phẩm có ẢNH THẬT và
// phân tích nhận diện đầy đủ đã chạy ở v1.
//
//   1. python3 scripts/nap-avi-gift/doc-phan-tich.py \
//        "<thư mục FloraOS Vận hành>" scripts/nap-avi-gift/du-lieu-trung-gian
//   2. npm run nap:phan-tich -- --org-id=<uuid AVI GIFT>
//
// Dùng `npm run` chứ không `npx tsx` trực tiếp: script npm mang theo cờ
// `--env-file-if-exists=.env` (xem `package.json`).
//
// Chạy SAU `nap-avi-gift-vao-core.ts` (danh mục giá): năm trong tám mã đã có
// sẵn ở đó, lượt này nối vào chứ không tạo trùng. Ba mã còn lại (`GHTM`,
// `MM17082026`, `KG-20260831-001`) không có trong danh mục 1.316 nên được
// tạo mới, đánh dấu `attributes.aviGiftImport.notInPriceCatalog = true`.
//
// An toàn chạy lại: idempotent ở cả job, asset và lượt phân tích.
//
// Adapter một chiều: chỉ đọc `analyses.json` và các tệp ảnh; không có đường
// nào ghi ngược vào nguồn.

const DATA_DIR = path.join(process.cwd(), "scripts", "nap-avi-gift", "du-lieu-trung-gian")

function argValue(name: string): string | null {
  const prefix = `--${name}=`
  const found = process.argv.find((arg) => arg.startsWith(prefix))
  return found ? found.slice(prefix.length) : null
}

async function resolveContext(organizationId: string): Promise<TenantContext & { adminUserId: string }> {
  const workspace = await prisma.workspaces.findFirst({
    where: { organization_id: organizationId },
    orderBy: { created_at: "asc" },
  })
  if (!workspace) throw new Error(`Tổ chức ${organizationId} không có workspace nào`)

  const membership = await prisma.memberships.findFirst({
    where: { organization_id: organizationId },
    orderBy: { joined_at: "asc" },
  })
  if (!membership) throw new Error(`Tổ chức ${organizationId} không có thành viên nào`)

  return {
    organizationId,
    workspaceId: workspace.id,
    userId: membership.user_id,
    branchId: null,
    capabilities: new Set<string>(),
    adminUserId: membership.user_id,
  }
}

async function main(): Promise<void> {
  const organizationId = argValue("org-id")
  if (!organizationId) {
    console.error("Dùng: npm run nap:phan-tich -- --org-id=<uuid AVI GIFT>")
    console.error("(chạy `npm run nap:credit -- --list` để xem danh sách tổ chức)")
    process.exitCode = 1
    return
  }

  const analysesPath = path.join(DATA_DIR, "analyses.json")
  const rows = JSON.parse(readFileSync(analysesPath, "utf-8")) as AnalysisSourceRow[]
  const tongAnh = rows.reduce((sum, row) => sum + row.images.length, 0)
  console.log(`Đọc ${rows.length} lượt phân tích, ${tongAnh} ảnh từ ${analysesPath}`)

  const ctx = await resolveContext(organizationId)
  const result = await importAnalyses(ctx, rows, {
    storage: new LocalDiskStorageProvider(),
    readImage: async (absolutePath) => new Uint8Array(await readFile(absolutePath)),
    importedAt: new Date(),
    // Người chịu trách nhiệm cho lượt duyệt một-lần này là quản trị AVI GIFT
    // — cùng tài khoản `bootstrapAviGiftOrganization` đã dựng.
    approvedBy: ctx.adminUserId,
  })

  console.log("=".repeat(72))
  console.log(`Job tổng hợp: ${result.jobId}`)
  console.log(`Sản phẩm nối vào bản có sẵn: ${result.productsLinked}`)
  console.log(`Sản phẩm tạo mới (không có trong danh mục 1.316): ${result.productsCreated}`)
  console.log(`Ảnh dựng thành asset: ${result.assetsCreated} (bỏ qua vì đã có: ${result.assetsSkipped})`)
  console.log(`Lượt phân tích nạp: ${result.analysesCreated} (bỏ qua vì đã có: ${result.analysesSkipped})`)
  console.log(`Lỗi: ${result.failed.length}`)
  for (const f of result.failed) console.log(`  - ${f.code}: ${f.error}`)
  console.log("=".repeat(72))
  console.log("Ảnh nạp ở lượt này là `kind = ORIGINAL`, `approval_state = PENDING`:")
  console.log("ảnh CHỤP của cửa hàng, chưa qua Identity Guard (P9, nợ #30).")
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
