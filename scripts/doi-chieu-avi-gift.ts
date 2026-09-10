import { readFileSync } from "node:fs"
import path from "node:path"

import { prisma } from "@/core/tenancy/infra/prisma"
import type { AnalysisSourceRow } from "@/modules/avi-gift-import/domain/analysis-mapping"
import { HISTORICAL_JOB_IDEMPOTENCY_KEY } from "@/modules/avi-gift-import/domain/analysis-mapping"
import type { CatalogSourceRow } from "@/modules/avi-gift-import/domain/catalog-mapping"

/**
 * Đối chiếu những gì ĐÃ NẠP vào Postgres với hai tệp JSON nguồn — bước cuối
 * của P8 trước khi tích ô "Dữ liệu nhập đủ" ở `Checklist_Thuc_Thi.md`.
 *
 *   npm run doi-chieu -- --org-id=<uuid AVI GIFT>
 *
 * Số kỳ vọng SUY từ chính `catalog.json` và `analyses.json`, không gõ tay —
 * chép một con số vào đây rồi so với chính nó là không đối chiếu gì cả.
 *
 * Thoát khác 0 khi có dòng lệch, để cắm được vào một lượt kiểm tự động sau
 * này nếu cần.
 *
 * Ghi chú về `BAN_GIAO.md`: `Checklist_Thuc_Thi.md` bảo đối chiếu với "bảng
 * nghiệm thu của BAN_GIAO.md", nhưng đọc tệp đó thì nó là bảng nghiệm thu
 * GIAO DIỆN của FloraOS v1 (tạo thẻ, xuất PNG/PDF, kịch bản Zalo…), không
 * phải bảng số liệu dữ liệu. Nguồn đối chiếu đúng cho lượt nạp là hai tệp
 * JSON trung gian, vì chúng sinh trực tiếp từ Excel và `results.jsonl` thật.
 */

const DATA_DIR = path.join(process.cwd(), "scripts", "nap-avi-gift", "du-lieu-trung-gian")

type Dong = { ten: string; kyVong: number | string; thucTe: number | string }

function argValue(name: string): string | null {
  const prefix = `--${name}=`
  const found = process.argv.find((arg) => arg.startsWith(prefix))
  return found ? found.slice(prefix.length) : null
}

async function main(): Promise<void> {
  const organizationId = argValue("org-id")
  if (!organizationId) {
    console.error("Dùng: npm run doi-chieu -- --org-id=<uuid AVI GIFT>")
    console.error("(chạy `npm run nap:credit -- --list` để xem danh sách tổ chức)")
    process.exitCode = 1
    return
  }

  const catalog = JSON.parse(
    readFileSync(path.join(DATA_DIR, "catalog.json"), "utf-8")
  ) as CatalogSourceRow[]
  const analyses = JSON.parse(
    readFileSync(path.join(DATA_DIR, "analyses.json"), "utf-8")
  ) as AnalysisSourceRow[]

  const maDanhMuc = new Set(catalog.map((row) => row.code))
  const maChiCoOPhanTich = analyses.map((row) => row.code).filter((code) => !maDanhMuc.has(code))
  const tongAnh = analyses.reduce((sum, row) => sum + row.images.length, 0)

  const where = { organization_id: organizationId }
  const [
    soSanPham,
    soActive,
    soAsset,
    soAssetPending,
    soPhanTich,
    soPhanTichApproved,
    soJob,
    soUsage,
    organization,
  ] = await Promise.all([
    prisma.products.count({ where }),
    prisma.products.count({ where: { ...where, status: "ACTIVE" } }),
    prisma.assets.count({ where }),
    prisma.assets.count({ where: { ...where, approval_state: "PENDING", kind: "ORIGINAL" } }),
    prisma.product_analyses.count({ where }),
    prisma.product_analyses.count({ where: { ...where, approval_state: "APPROVED" } }),
    prisma.generation_jobs.count({
      where: { ...where, idempotency_key: HISTORICAL_JOB_IDEMPOTENCY_KEY },
    }),
    prisma.usage.count({ where }),
    prisma.organizations.findUnique({ where: { id: organizationId } }),
  ])

  if (!organization) {
    console.error(`Không có tổ chức nào mang id ${organizationId}`)
    process.exitCode = 1
    return
  }

  const dong: Dong[] = [
    { ten: "Sản phẩm", kyVong: maDanhMuc.size + maChiCoOPhanTich.length, thucTe: soSanPham },
    { ten: "  trong đó ACTIVE (có ảnh thật)", kyVong: maChiCoOPhanTich.length, thucTe: soActive },
    { ten: "Asset", kyVong: tongAnh, thucTe: soAsset },
    { ten: "  ORIGINAL + PENDING (chưa qua Identity Guard)", kyVong: tongAnh, thucTe: soAssetPending },
    { ten: "Lượt phân tích", kyVong: analyses.length, thucTe: soPhanTich },
    { ten: "  APPROVED", kyVong: analyses.length, thucTe: soPhanTichApproved },
    { ten: "Job tổng hợp lịch sử", kyVong: 1, thucTe: soJob },
    { ten: "Bản ghi usage (lượt nạp không tính phí)", kyVong: 0, thucTe: soUsage },
  ]

  console.log(`Tổ chức: ${organization.name} (${organizationId})`)
  console.log(`Số dư credit: ${organization.credit_balance}`)
  console.log("")
  console.log("Mục".padEnd(48) + "kỳ vọng".padStart(9) + "thực tế".padStart(9) + "  ")
  console.log("-".repeat(70))

  let lech = 0
  for (const d of dong) {
    const dat = String(d.kyVong) === String(d.thucTe)
    if (!dat) lech += 1
    console.log(
      d.ten.padEnd(48) +
        String(d.kyVong).padStart(9) +
        String(d.thucTe).padStart(9) +
        (dat ? "  đạt" : "  LỆCH")
    )
  }

  // Ba mã chỉ có ở lượt phân tích phải có mặt và phải được đánh dấu rõ nguồn.
  console.log("")
  console.log("Ba mã có phân tích nhưng không có trong danh mục giá:")
  for (const code of maChiCoOPhanTich) {
    const product = await prisma.products.findFirst({ where: { ...where, code } })
    const attributes = product?.attributes as { aviGiftImport?: { notInPriceCatalog?: unknown } } | null
    const danhDau = attributes?.aviGiftImport?.notInPriceCatalog === true
    const dat = product !== null && danhDau
    if (!dat) lech += 1
    console.log(
      `  ${code.padEnd(24)} ${product ? product.status.padEnd(8) : "THIẾU  "} ` +
        `${danhDau ? "đã đánh dấu nguồn" : "CHƯA đánh dấu nguồn"}${dat ? "" : "  ← LỆCH"}`
    )
  }

  console.log("")
  if (lech === 0) {
    console.log("Khớp hoàn toàn. Tích được ô \"Dữ liệu nhập đủ\" ở Checklist_Thuc_Thi.md.")
  } else {
    console.log(`${lech} dòng LỆCH — chưa tích ô nào.`)
    process.exitCode = 1
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
